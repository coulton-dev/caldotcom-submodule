import ForgotPassword from "@pages/auth/forgot-password";
import { withAppDir } from "app/AppDirSSRHOC";
import { _generateMetadata } from "app/_utils";
import { WithLayout } from "app/layoutHOC";

import { getServerSideProps } from "@server/lib/forgotPasswordGetData";

export const generateMetadata = async () => {
  return await _generateMetadata(
    (t) => t("reset_password"),
    (t) => t("change_your_password")
  );
};

export default WithLayout({
  getLayout: null,
  Page: ForgotPassword,
  getData: withAppDir(getServerSideProps),
})<"P">;
