import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "Webex",
  title: "Webex",
  slug: "webex",
  type: "webex_video",
  imageSrc: "/icon.ico",
  logo: "/icon.ico",
  url: "https://github.com/aar2dee2",
  variant: "conferencing",
  categories: ["conferencing"],
  publisher: "aar2dee2",
  email: "support@cal.com",
  description: "Create meetings with Cisco Webex",
  appData: {
    location: {
      linkType: "dynamic",
      type: "integrations:webex_video",
      label: "Webex",
    },
  },
  isTemplate: false,
  __createdUsingCli: true,
  __template: "basic",
  concurrentMeetings: true,
} as AppMeta;
