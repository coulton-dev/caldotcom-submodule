import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  name: "Paypal",
  slug: "paypal",
  type: "paypal_payment",
  logo: "icon.svg",
  url: "https://paypal.com",
  variant: "payment",
  categories: ["payment"],
  publisher: "Cal.com",
  email: "support@cal.com",
  description: "Paypal payment app by Cal.com",
  extendsFeature: "EventType",
  isTemplate: false,
  __createdUsingCli: true,
  imageSrc: "icon.svg",
  __template: "event-type-app-card",
  dirName: "paypal",
} as AppMeta;
