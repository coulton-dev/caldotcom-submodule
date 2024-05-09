import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "Sirius Video",
  slug: "sirius_video",
  type: "sirius_video_video",
  logo: "icon-dark.svg",
  url: "https://cal.com/",
  variant: "conferencing",
  categories: ["conferencing"],
  publisher: "Cal.com, Inc.",
  email: "support@cal.com",
  description: "Video meetings made for music.\rCreate your own virtual music classroom, easily.",
  __createdUsingCli: true,
  appData: {
    location: {
      type: "integrations:sirius_video_video",
      label: "Sirius Video",
      linkType: "static",
      organizerInputPlaceholder: "https://sirius.video/sebastian",
      urlRegExp: "^http(s)?:\\/\\/(www\\.)?sirius.video\\/[a-zA-Z0-9]*",
    },
  },
} as AppMeta;
