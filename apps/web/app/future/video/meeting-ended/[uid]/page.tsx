import Page, { getServerSideProps } from "@pages/video/meeting-ended/[uid]";
import { withAppDirSsr } from "app/WithAppDirSsr";
import { _generateMetadata } from "app/_utils";
import { WithLayout } from "app/layoutHOC";

export const generateMetadata = async () =>
  await _generateMetadata(
    () => "Meeting Unavailable",
    () => "Meeting Unavailable"
  );

const getData = withAppDirSsr(getServerSideProps);

export default WithLayout({ getData, Page, getLayout: null })<"P">;
