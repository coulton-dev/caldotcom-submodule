import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "Telegram",
  slug: "telegram",
  type: "telegram_video",
  logo: "icon.svg",
  url: "https://cal.com/",
  variant: "messaging",
  categories: ["messaging"],
  publisher: "Cal.com, Inc.",
  email: "support@cal.com",
  description: "Schedule a chat with your guests or have a Telegram Video call.",
  __createdUsingCli: true,
  appData: {
    location: {
      type: "integrations:telegram_video",
      label: "Telegram",
      linkType: "static",
      organizerInputPlaceholder: "https://t.me/MyUsername",
      urlRegExp: "^http(s)?:\\/\\/(www\\.)?t.me\\/[a-zA-Z0-9]*",
    },
  },
} as AppMeta;
