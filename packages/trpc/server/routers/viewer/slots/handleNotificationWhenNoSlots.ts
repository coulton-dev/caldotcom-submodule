import { Redis } from "@upstash/redis";

import type { Dayjs } from "@calcom/dayjs";
import { getTasker } from "@calcom/features/tasker/tasker-factory";
import { getTranslation } from "@calcom/lib/server";
import { prisma } from "@calcom/prisma";

type EventDetails = {
  username: string;
  eventSlug: string;
  startTime: Dayjs;
  visitorTimezone?: string;
  visitorUid?: string;
};

// TODO: Build this key based on startTime so we can get a period of time this happens
const constructRedisKey = (eventDetails: EventDetails, orgSlug?: string) => {
  return `${eventDetails.username}:${eventDetails.eventSlug}${orgSlug ? `@${orgSlug}` : ""}`;
};

const constructDataHash = (eventDetails: EventDetails) => {
  const obj = {
    startTime: eventDetails.startTime.format("YYYY-MM-DD"),
    visitorTimezone: eventDetails?.visitorTimezone,
    visitorUid: eventDetails?.visitorUid,
  };

  return JSON.stringify(obj);
};

// 7 days or 60s in dev
// const NO_SLOTS_NOTIFICATION_FREQUENCY = 604_800;
const NO_SLOTS_NOTIFICATION_FREQUENCY = 60;

const NO_SLOTS_COUNT_FOR_NOTIFICATION = 2;

export const handleNotificationWhenNoSlots = async ({
  eventDetails,
  orgDetails,
}: {
  eventDetails: EventDetails;
  orgDetails: { currentOrgDomain: string | null; isValidOrgDomain: boolean };
}) => {
  if (!orgDetails.currentOrgDomain) return;
  const UPSTASH_ENV_FOUND = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!UPSTASH_ENV_FOUND) return;

  const redis = Redis.fromEnv();

  const usersUniqueKey = constructRedisKey(eventDetails, orgDetails.currentOrgDomain);
  // Get only the required amount of data so the request is as small as possible
  // We may need to get more data and check the startDate occurrence of this
  // Not trigger email if the start months are the same
  const usersExistingNoSlots = await redis.lrange(usersUniqueKey, 0, NO_SLOTS_COUNT_FOR_NOTIFICATION - 1);
  await redis.lpush(usersUniqueKey, constructDataHash(eventDetails));

  if (!usersExistingNoSlots.length) {
    await redis.expire(usersUniqueKey, NO_SLOTS_NOTIFICATION_FREQUENCY);
  }

  // We add one as we know we just added one to the list - saves us re-fetching the data
  if (usersExistingNoSlots.length + 1 === NO_SLOTS_COUNT_FOR_NOTIFICATION) {
    // Get all org admins to send the email too
    const foundAdmins = await prisma.membership.findMany({
      where: {
        team: {
          slug: orgDetails.currentOrgDomain,
          isOrganization: true,
        },
        role: {
          in: ["ADMIN", "OWNER"],
        },
      },
      select: {
        user: {
          select: {
            email: true,
            locale: true,
          },
        },
      },
    });
    //   Send Email
    // TODO: use new tasker

    const tasker = getTasker();
    for (const admin of foundAdmins) {
      const translation = await getTranslation(admin.user.locale ?? "en", "common");

      const payload = {
        to: admin.user.email,
        template: "OrganizationAdminNoSlotsEmail",
        payload: {
          language: translation,
          to: {
            email: admin.user.email,
          },
          user: eventDetails.username,
          slug: eventDetails.eventSlug,
          startTime: eventDetails.startTime.format("YYYY-MM"),
          editLink: "www.google.com",
        },
      };
      tasker.create("sendEmail", JSON.stringify(payload));
    }
    //   Calling tasker in dev for now but itll be triggered by cron
    await tasker.processQueue();
  }
};
