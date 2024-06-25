import { getOrgFullOrigin } from "@calcom/ee/organizations/lib/orgDomains";
import { isOrganisationAdmin } from "@calcom/lib/server/queries/organisations";
import { ProfileRepository } from "@calcom/lib/server/repository/profile";
import { prisma } from "@calcom/prisma";
import { RedirectType } from "@calcom/prisma/enums";

import { TRPCError } from "@trpc/server";

import type { TrpcSessionUser } from "../../../trpc";
import type { TBulkUsersDelete } from "./bulkDeleteUsers.schema.";

type BulkDeleteUsersHandler = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TBulkUsersDelete;
};

export async function bulkDeleteUsersHandler({ ctx, input }: BulkDeleteUsersHandler) {
  const currentUser = ctx.user;

  if (!currentUser.organizationId) throw new TRPCError({ code: "UNAUTHORIZED" });

  // check if user is admin of organization
  if (!(await isOrganisationAdmin(currentUser?.id, currentUser.organizationId)))
    throw new TRPCError({ code: "UNAUTHORIZED" });

  // Loop over all users in input.userIds and remove all memberships for the organization including child teams
  const deleteMany = prisma.membership.deleteMany({
    where: {
      userId: {
        in: input.userIds,
      },
      team: {
        OR: [
          {
            parentId: currentUser.organizationId,
          },
          { id: currentUser.organizationId },
        ],
      },
    },
  });

  const removeOrgrelation = prisma.user.updateMany({
    where: {
      id: {
        in: input.userIds,
      },
    },
    data: {
      organizationId: null,
      // Set username to null - to make sure there is no conflicts
      username: null,
      // Set completedOnboarding to false - to make sure the user has to complete onboarding again -> Setup a new username
      completedOnboarding: false,
    },
  });

  const removeProfiles = ProfileRepository.deleteMany({
    userIds: input.userIds,
  });

  const operations = [removeProfiles, deleteMany, removeOrgrelation];

  const organizationId = currentUser.organizationId;
  const redirectTo = input.redirectTo;
  if (redirectTo && organizationId) {
    const users = await ProfileRepository.findManyForOrg({ organizationId });
    const redirectToUser = await ProfileRepository.findByUserIdAndOrgId({
      userId: redirectTo,
      organizationId,
    });

    if (redirectToUser) {
      const orgUrlPrefix = getOrgFullOrigin(redirectToUser.organization.slug);
      const redirectData = users
        .filter((user) => input.userIds.some((userId) => userId === user.userId))
        .map((user) => ({
          from: user.username,
          toUrl: `${orgUrlPrefix}/${redirectToUser.username}`,
          type: RedirectType.User,
          fromOrgId: organizationId,
        }));

      const createUserRedirection = prisma.tempOrgRedirect.createMany({
        data: redirectData,
      });
      operations.push(createUserRedirection);
    }
  }

  // We do this in a transaction to make sure that all memberships are removed before we remove the organization relation from the user
  // We also do this to make sure that if one of the queries fail, the whole transaction fails
  await prisma.$transaction(operations);

  return {
    success: true,
    usersDeleted: input.userIds.length,
  };
}

export default bulkDeleteUsersHandler;
