import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "Routing Forms",
  title: "Routing Forms",
  isGlobal: true,
  slug: "routing-forms",
  type: "routing-forms_other",
  logo: "icon-dark.svg",
  url: "https://cal.com/resources/feature/routing-forms",
  variant: "other",
  categories: ["automation"],
  publisher: "Cal.com, Inc.",
  simplePath: "/apps/routing-forms",
  email: "help@cal.com",
  licenseRequired: true,
  teamsPlanRequired: {
    upgradeUrl: "/routing-forms/forms",
  },
  description:
    "It would allow a booker to connect with the right person or choose the right event, faster. It would work by taking inputs from the booker and using that data to route to the correct booker/event as configured by Cal user",
  __createdUsingCli: true,
} as AppMeta;
