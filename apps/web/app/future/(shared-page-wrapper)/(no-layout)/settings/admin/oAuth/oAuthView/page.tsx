import Page from "@pages/settings/admin/oAuth/oAuthView";
import { _generateMetadata } from "app/_utils";

export const generateMetadata = async () =>
  await _generateMetadata(
    () => "",
    () => ""
  );

export default Page;
