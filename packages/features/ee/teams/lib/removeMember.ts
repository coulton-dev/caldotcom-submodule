import { getOrgFullOrigin } from "@calcom/features/ee/organizations/lib/orgDomains";
import logger from "@calcom/lib/logger";
import { ProfileRepository } from "@calcom/lib/server/repository/profile";
import prisma from "@calcom/prisma";
import { RedirectType } from "@calcom/prisma/enums";

import { TRPCError } from "@trpc/server";

const log = logger.getSubLogger({ prefix: ["removeMember"] });

const removeMember = async ({
  memberId,
  teamId,
  isOrg,
  redirectTo,
}: {
  memberId: number;
  teamId: number;
  isOrg: boolean;
  redirectTo?: number;
}) => {
  const [membership] = await prisma.$transaction([
    prisma.membership.delete({
      where: {
        userId_teamId: { userId: memberId, teamId: teamId },
      },
      include: {
        user: true,
        team: true,
      },
    }),
    // remove user as host from team events associated with this membership
    prisma.host.deleteMany({
      where: {
        userId: memberId,
        eventType: {
          teamId: teamId,
        },
      },
    }),
  ]);

  if (isOrg) {
    log.debug("Removing a member from the organization");

    // Deleting membership from all child teams
    const foundUser = await prisma.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        movedToProfileId: true,
        email: true,
        username: true,
        completedOnboarding: true,
      },
    });

    const orgInfo = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        isOrganization: true,
        organizationSettings: true,
        slug: true,
        id: true,
        metadata: true,
      },
    });
    const orgMetadata = orgInfo?.organizationSettings;

    if (!foundUser || !orgInfo) throw new TRPCError({ code: "NOT_FOUND" });

    // Delete all sub-team memberships where this team is the organization
    await prisma.membership.deleteMany({
      where: {
        team: {
          parentId: teamId,
        },
        userId: membership.userId,
      },
    });

    const userToDeleteMembershipOf = foundUser;

    const profileToDelete = await ProfileRepository.findByUserIdAndOrgId({
      userId: userToDeleteMembershipOf.id,
      organizationId: orgInfo.id,
    });

    if (redirectTo && profileToDelete) {
      const userToRedirectTo = await ProfileRepository.findByUserIdAndOrgId({
        userId: redirectTo,
        organizationId: orgInfo.id,
      });

      if (userToRedirectTo) {
        const orgUrlPrefix = getOrgFullOrigin(orgInfo.slug);
        await prisma.tempOrgRedirect.create({
          data: {
            from: profileToDelete.username,
            toUrl: `${orgUrlPrefix}/${userToRedirectTo.username}`,
            type: RedirectType.User,
            fromOrgId: orgInfo.id,
          },
        });
      }
    }

    if (
      userToDeleteMembershipOf.username &&
      userToDeleteMembershipOf.movedToProfileId === profileToDelete?.id
    ) {
      log.debug("Cleaning up tempOrgRedirect for user", userToDeleteMembershipOf.username);

      await prisma.tempOrgRedirect.deleteMany({
        where: {
          from: userToDeleteMembershipOf.username,
        },
      });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: membership.userId },
        data: { organizationId: null },
      }),
      ProfileRepository.delete({
        userId: membership.userId,
        organizationId: orgInfo.id,
      }),
    ]);
  }

  // Deleted managed event types from this team from this member
  await prisma.eventType.deleteMany({
    where: { parent: { teamId: teamId }, userId: membership.userId },
  });

  return { membership };
};

export default removeMember;
