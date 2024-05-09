import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "Google Analytics",
  slug: "ga4",
  type: "ga4_analytics",
  logo: "icon.svg",
  url: "https://marketingplatform.google.com",
  variant: "analytics",
  categories: ["analytics"],
  publisher: "Cal.com, Inc.",
  email: "support@cal.com",
  description:
    "Google Analytics is a web analytics service offered by Google that tracks and reports website traffic, currently as a platform inside the Google Marketing Platform brand.",
  extendsFeature: "EventType",
  appData: {
    tag: {
      scripts: [
        {
          src: "https://www.googletagmanager.com/gtag/js?id={TRACKING_ID}",
          attrs: {},
        },
        {
          content:
            "window.dataLayer = window.dataLayer || [];\n      function gtag(){dataLayer.push(arguments);}\n      gtag('js', new Date());\n      gtag('config', '{TRACKING_ID}');",
        },
      ],
    },
  },
  __createdUsingCli: true,
} as AppMeta;
