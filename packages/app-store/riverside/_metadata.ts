import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "Riverside",
  slug: "riverside",
  type: "riverside_video",
  logo: "icon-dark.svg",
  url: "https://cal.com/",
  variant: "conferencing",
  categories: ["conferencing"],
  publisher: "Cal.com, Inc.",
  email: "help@cal.com",
  description:
    "Your online recording studio. The easiest way to record podcasts and videos in studio quality from anywhere. All from the browser.",
  __createdUsingCli: true,
  appData: {
    location: {
      label: "Riverside Video",
      urlRegExp: "^http(s)?:\\/\\/(www\\.)?riverside.fm\\/studio\\/[a-zA-Z0-9]*",
      type: "integrations:riverside_video",
      linkType: "static",
    },
  },
} as AppMeta;
