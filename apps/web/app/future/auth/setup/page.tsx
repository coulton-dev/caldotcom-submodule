import Setup from "@pages/auth/setup";
import { withAppDir } from "app/AppDirSSRHOC";
import { WithLayout } from "app/layoutHOC";

import { getSetupPageData } from "@server/lib/setupGetData";

export default WithLayout({
  getLayout: null,
  Page: Setup,
  getData: withAppDir(getSetupPageData),
})<"P">;
