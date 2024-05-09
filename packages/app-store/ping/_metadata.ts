import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "Ping.gg",
  title: "Ping.gg",
  slug: "ping",
  type: "ping_video",
  logo: "icon.svg",
  url: "https://ping.gg",
  variant: "conferencing",
  categories: ["conferencing"],
  publisher: "Ping.gg",
  email: "support@ping.gg",
  description:
    "Ping.gg makes high quality video collaborations easier than ever. Think 'Zoom for streamers and creators'. Join a call in 3 clicks, manage audio and video like a pro, and copy-paste your guests straight into OBS",
  __createdUsingCli: true,
  appData: {
    location: {
      linkType: "static",
      type: "integrations:ping_video",
      label: "Ping.gg",
      organizerInputPlaceholder: "https://www.ping.gg/call/theo",
      urlRegExp: "^http(s)?:\\/\\/(www\\.)?ping.gg\\/call\\/[a-zA-Z0-9]*",
    },
  },
} as AppMeta;
