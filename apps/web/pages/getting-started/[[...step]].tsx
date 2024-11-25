import PageWrapper from "@components/PageWrapper";

import OnboardingPage from "~/getting-started/[[...step]]/onboarding-view";

const Page = () => <OnboardingPage />;

export { getServerSideProps } from "@lib/getting-started/[[...step]]/getServerSideProps";
Page.PageWrapper = PageWrapper;
export default Page;
