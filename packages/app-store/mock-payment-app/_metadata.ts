import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "Mock Payment App",
  slug: "mock-payment-app",
  type: "mock-payment-app_payment",
  logo: "icon.svg",
  url: "https://example.com/link",
  variant: "payment",
  categories: ["payment"],
  publisher: "Intuita",
  email: "greg@intuita.io",
  description: "The mock payment app for tests",
  isTemplate: false,
  __createdUsingCli: true,
  __template: "basic",
  dirName: "mock-payment-app",
  extendsFeature: "EventType",
} as AppMeta;
