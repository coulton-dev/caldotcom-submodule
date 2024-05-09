import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "Salesroom",
  slug: "salesroom",
  type: "salesroom_conferencing",
  logo: "icon.svg",
  url: "https://salesroom.com/",
  variant: "conferencing",
  categories: ["conferencing"],
  publisher: "Cal.com, Inc.",
  email: "support@cal.com",
  appData: {
    location: {
      type: "integrations:{SLUG}_video",
      label: "{TITLE}",
      linkType: "static",
      organizerInputPlaceholder: "https://user.sr.chat",
      urlRegExp: "^https:\\/\\/.+\\.sr\\.chat",
    },
  },
  description: "Unlock real-time AI and take your sales game to the next level",
  isTemplate: false,
  __createdUsingCli: true,
  __template: "event-type-location-video-static",
} as AppMeta;
