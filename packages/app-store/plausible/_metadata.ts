import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "Plausible",
  slug: "plausible",
  type: "plausible_analytics",
  logo: "icon.svg",
  url: "https://cal.com/",
  variant: "analytics",
  categories: ["analytics"],
  publisher: "Cal.com, Inc.",
  email: "help@cal.com",
  extendsFeature: "EventType",
  appData: {
    tag: {
      scripts: [
        {
          src: "{PLAUSIBLE_URL}",
          attrs: {
            "data-domain": "{TRACKING_ID}",
          },
        },
      ],
    },
  },
  description: "Simple, privacy-friendly Google Analytics alternative.",
  __createdUsingCli: true,
} as AppMeta;
