import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "Facetime",
  title: "Facetime",
  slug: "facetime",
  type: "facetime_video",
  logo: "icon.svg",
  url: "https://github.com/Mythie",
  variant: "conferencing",
  categories: ["conferencing"],
  publisher: "Lucas Smith",
  email: "help@cal.com",
  description: "Facetime makes it super simple for collaborating teams to jump on a video call.",
  __createdUsingCli: true,
  appData: {
    location: {
      linkType: "static",
      type: "integrations:facetime_video",
      label: "Facetime",
      organizerInputPlaceholder: "https://facetime.apple.com/join... link copied from the FaceTime app",
      urlRegExp: "^https?:\\/\\/facetime\\.apple\\.com\\/join.+$",
    },
  },
  isTemplate: false,
} as AppMeta;
