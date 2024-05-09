import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "Roam",
  slug: "roam",
  type: "roam_conferencing",
  logo: "icon.png",
  url: "https://ro.am",
  variant: "conferencing",
  categories: ["conferencing"],
  publisher: "Roam HQ, Inc.",
  email: "support@ro.am",
  appData: {
    location: {
      type: "integrations:{SLUG}_video",
      label: "{TITLE}",
      linkType: "static",
      organizerInputPlaceholder: "https://ro.am/r/#/p/yHwFBQrRTMuptqKYo_wu8A/huzRiHnR-np4RGYKV-c0pQ",
      urlRegExp: "^http(s)?:\\/\\/(www\\.)?ro.am\\/[a-zA-Z0-9]*",
    },
  },
  description: "Roam is Your Whole Company in one HQ\r",
  isTemplate: false,
  __createdUsingCli: true,
  __template: "event-type-location-video-static",
} as AppMeta;
