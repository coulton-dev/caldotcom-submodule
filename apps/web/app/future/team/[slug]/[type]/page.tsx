import { withAppDirSsr } from "app/WithAppDirSsr";
import { _generateMetadata } from "app/_utils";
import { WithLayout } from "app/layoutHOC";
import { type GetServerSidePropsContext } from "next";
import { cookies, headers } from "next/headers";

import { buildLegacyCtx } from "@lib/buildLegacyCtx";
import { getServerSideProps, type PageProps } from "@lib/team/[slug]/[type]/getServerSideProps";

import LegacyPage from "@components/pages/team/[slug]/[type]";

export const generateMetadata = async ({
  params,
  searchParams,
}: {
  params: Record<string, string | string[]>;
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  const legacyCtx = buildLegacyCtx(headers(), cookies(), params, searchParams);
  const props = await getData(legacyCtx as unknown as GetServerSidePropsContext);
  const { entity, user, slug, booking } = props;
  const { trpc } = await import("@calcom/trpc");
  const { data: event } = trpc.viewer.public.event.useQuery(
    { username: user, eventSlug: slug, isTeamEvent: false, org: entity.orgSlug ?? null },
    { refetchOnWindowFocus: false }
  );

  const profileName = event?.profile?.name ?? "";
  const title = event?.title ?? "";

  return await _generateMetadata(
    (t) => `${booking?.uid && !!booking ? t("reschedule") : ""} ${title} | ${profileName}`,
    (t) => `${booking?.uid ? t("reschedule") : ""} ${title}`
  );
};
const getData = withAppDirSsr<PageProps>(getServerSideProps);

export default WithLayout({
  Page: LegacyPage,
  getData,
  getLayout: null,
  isBookingPage: true,
})<"P">;
