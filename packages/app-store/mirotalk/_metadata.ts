import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "Mirotalk",
  slug: "mirotalk",
  type: "mirotalk_video",
  logo: "icon.svg",
  url: "https://cal.com/",
  variant: "conferencing",
  categories: ["conferencing"],
  publisher: "Cal.com, Inc.",
  email: "support@cal.com",
  appData: {
    location: {
      type: "integrations:{SLUG}_video",
      label: "{TITLE}",
      linkType: "static",
      organizerInputPlaceholder: "https://p2p.mirotalk.com/join/80085ShinyPhone",
      urlRegExp: "^(http|https):\\/\\/(p2p|sfu)\\.mirotalk\\.com\\/join\\/[a-zA-Z0-9]+$",
    },
  },
  description:
    "Peer to peer real-time video conferences, optimized for small groups. Unlimited time, unlimited rooms each having 5-8 participants.",
  isTemplate: false,
  __createdUsingCli: true,
  __template: "event-type-location-video-static",
  dirName: "mirotalk",
} as AppMeta;
