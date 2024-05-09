import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  name: "Google Tag Manager",
  slug: "gtm",
  type: "gtm_analytics",
  logo: "icon.svg",
  url: "https://tagmanager.google.com",
  variant: "analytics",
  categories: ["analytics"],
  publisher: "Black Lemon",
  email: "support@blacklemon.dk",
  description: "App to install Google Tag Manager",
  extendsFeature: "EventType",
  appData: {
    tag: {
      scripts: [
        {
          content:
            "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','{TRACKING_ID}');",
        },
      ],
    },
  },
  isTemplate: false,
  __createdUsingCli: true,
  __template: "booking-pages-tag",
} as AppMeta;
