import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "WhatsApp",
  slug: "whatsapp",
  type: "whatsapp_video",
  logo: "icon.svg",
  url: "https://cal.com/",
  variant: "messaging",
  categories: ["messaging"],
  publisher: "Cal.com, Inc.",
  email: "support@cal.com",
  description: "Schedule a chat with your guests or have a WhatsApp Video call.",
  __createdUsingCli: true,
  appData: {
    location: {
      type: "integrations:whatsapp_video",
      label: "WhatsApp",
      linkType: "static",
      organizerInputPlaceholder: "https://wa.me/send?phone=1234567890",
      urlRegExp: "^http(s)?:\\/\\/(www\\.)?wa.me\\/[a-zA-Z0-9]*",
    },
  },
} as AppMeta;
