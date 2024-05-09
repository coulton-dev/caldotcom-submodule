import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  name: "Meta Pixel",
  slug: "metapixel",
  type: "metapixel_analytics",
  logo: "icon.svg",
  url: "https://github.com/regexyl",
  variant: "analytics",
  categories: ["analytics"],
  publisher: "Regina Liu",
  email: "info@regexyl.com",
  description:
    "Add Meta Pixel to your bookings page to measure, optimize and build audiences for your ad campaigns.",
  extendsFeature: "EventType",
  isTemplate: false,
  __createdUsingCli: true,
  __template: "event-type-app-card",
  appData: {
    tag: {
      scripts: [
        {
          content:
            "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','{TRACKING_ID}');fbq('trackCustom','CalcomView');",
        },
      ],
    },
  },
} as AppMeta;
