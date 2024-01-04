import LegacyPage from "@pages/d/[link]/[slug]";
import { ssrInit } from "app/_trpc/ssrInit";
import { _generateMetadata } from "app/_utils";
import { WithLayout } from "app/layoutHOC";
import type { GetServerSidePropsContext } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { getBookingForReschedule, getMultipleDurationValue } from "@calcom/features/bookings/lib/get-booking";
import type { GetBookingType } from "@calcom/features/bookings/lib/get-booking";
import { orgDomainConfig } from "@calcom/features/ee/organizations/lib/orgDomains";
import slugify from "@calcom/lib/slugify";
import prisma from "@calcom/prisma";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("appearance"),
    (t) => t("appearance_description")
  );

async function getPageProps(context: GetServerSidePropsContext) {
  const ssr = await ssrInit();

  const session = await getServerSession({ req: context.req });
  const { link, slug } = paramsSchema.parse(context.params);
  const { rescheduleUid, duration: queryDuration } = context.query;
  const { currentOrgDomain, isValidOrgDomain } = orgDomainConfig(context.req);
  const org = isValidOrgDomain ? currentOrgDomain : null;

  const hashedLink = await prisma.hashedLink.findUnique({
    where: {
      link,
    },
    select: {
      eventTypeId: true,
      eventType: {
        select: {
          users: {
            select: {
              username: true,
            },
          },
          team: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  const username = hashedLink?.eventType.users[0]?.username;

  if (!hashedLink || !username) {
    return notFound();
  }

  const user = await prisma.user.findFirst({
    where: {
      username,
      organization: isValidOrgDomain
        ? {
            slug: currentOrgDomain,
          }
        : null,
    },
    select: {
      away: true,
      hideBranding: true,
    },
  });

  if (!user) {
    return notFound();
  }

  let booking: GetBookingType | null = null;
  if (rescheduleUid) {
    booking = await getBookingForReschedule(`${rescheduleUid}`, session?.user?.id);
  }

  const isTeamEvent = !!hashedLink.eventType?.team?.id;

  // We use this to both prefetch the query on the server,
  // as well as to check if the event exist, so we c an show a 404 otherwise.
  const eventData = await ssr.viewer.public.event.fetch({ username, eventSlug: slug, isTeamEvent, org });

  if (!eventData) {
    return notFound();
  }

  return {
    entity: eventData.entity,
    duration: getMultipleDurationValue(eventData.metadata?.multipleDuration, queryDuration, eventData.length),
    booking,
    away: user?.away,
    user: username,
    slug,
    dehydratedState: await ssr.dehydrate(),
    isBrandingHidden: user?.hideBranding,
    // Sending the team event from the server, because this template file
    // is reused for both team and user events.
    isTeamEvent,
    hashedLink: link,
  };
}

const paramsSchema = z.object({ link: z.string(), slug: z.string().transform((s) => slugify(s)) });

// @ts-expect-error getData arg
export default WithLayout({ getLayout: null, Page: LegacyPage, getData: getPageProps });
