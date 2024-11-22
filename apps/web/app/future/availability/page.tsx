import { _generateMetadata } from "app/_utils";
import { WithLayout } from "app/layoutHOC";
import { notFound } from "next/navigation";

import { getServerSessionForAppDir } from "@calcom/feature-auth/lib/get-server-session-for-app-dir";

import AvailabilityPage from "~/availability/availability-view";

export const generateMetadata = async () => {
  return await _generateMetadata(
    (t) => t("availability"),
    (t) => t("configure_availability")
  );
};

const Page = async () => {
  const session = await getServerSessionForAppDir();
  const userId = session?.user?.id;
  const orgId = session?.user?.org?.id;
  if (!userId || !orgId) {
    notFound();
  }

  try {
    return <AvailabilityPage />;
  } catch {
    notFound();
  }
};

export default WithLayout({ ServerPage: Page });
