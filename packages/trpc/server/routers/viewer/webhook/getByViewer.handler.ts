import { CAL_URL } from "@calcom/lib/constants";
import { prisma } from "@calcom/prisma";
import { MembershipRole } from "@calcom/prisma/enums";
import type { TrpcSessionUser } from "@calcom/trpc/server/trpc";

import { TRPCError } from "@trpc/server";

type GetByViewerOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
};

export const getByViewerHandler = async ({ ctx }: GetByViewerOptions) => {
  const user = await prisma.user.findUnique({
    where: {
      id: ctx.user.id,
    },
    select: {
      username: true,
      avatar: true,
      name: true,
      webhooks: true,
      teams: {
        where: {
          accepted: true,
        },
        select: {
          role: true,
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
              members: {
                select: {
                  userId: true,
                },
              },
              webhooks: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  }

  const userWebhooks = user.webhooks;

  type WebhookGroup = {
    teamId?: number | null;
    profile: {
      slug: (typeof user)["username"];
      name: (typeof user)["name"];
      image?: string;
    };
    metadata?: {
      readOnly: boolean;
    };
    webhooks: typeof userWebhooks;
  };

  let webhookGroups: WebhookGroup[] = [];

  webhookGroups.push({
    teamId: null,
    profile: {
      slug: user.username,
      name: user.name,
      image: user.avatar || undefined,
    },
    webhooks: userWebhooks,
    metadata: {
      readOnly: false,
    },
  });

  webhookGroups = ([] as WebhookGroup[]).concat(
    webhookGroups,
    user.teams.map((membership) => ({
      teamId: membership.team.id,
      profile: {
        name: membership.team.name,
        slug: "team/" + membership.team.slug,
        image: `${CAL_URL}/team/${membership.team.slug}/avatar.png`,
      },
      metadata: {
        readOnly: membership.role === MembershipRole.MEMBER,
      },
      webhooks: membership.team.webhooks,
    }))
  );

  return {
    webhookGroups: webhookGroups.filter((groupBy) => !!groupBy.webhooks?.length),
    profiles: webhookGroups.map((group) => ({
      teamId: group.teamId,
      ...group.profile,
      ...group.metadata,
    })),
  };
};
