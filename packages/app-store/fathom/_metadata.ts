import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "Fathom",
  slug: "fathom",
  type: "fathom_analytics",
  logo: "icon.svg",
  url: "https://cal.com",
  variant: "analytics",
  categories: ["analytics"],
  publisher: "Cal.com, Inc.",
  email: "help@cal.com",
  extendsFeature: "EventType",
  appData: {
    tag: {
      scripts: [
        {
          src: "https://cdn.usefathom.com/script.js",
          attrs: {
            "data-site": "{TRACKING_ID}",
          },
        },
      ],
    },
  },
  description:
    "Fathom Analytics provides simple, privacy-focused website analytics. We're a GDPR-compliant, Google Analytics alternative.",
  __createdUsingCli: true,
} as AppMeta;
