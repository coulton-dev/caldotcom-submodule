import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "Whereby",
  title: "Whereby",
  slug: "whereby",
  type: "whereby_video",
  logo: "icon-dark.svg",
  url: "https://cal.com/",
  variant: "conferencing",
  categories: ["conferencing"],
  publisher: "Cal.com, Inc.",
  email: "help@cal.com",
  description: "Whereby makes it super simple for collaborating teams to jump on a video call.",
  __createdUsingCli: true,
  appData: {
    location: {
      linkType: "static",
      type: "integrations:whereby_video",
      label: "Whereby Video",
      organizerInputPlaceholder: "https://www.whereby.com/cal",
      urlRegExp:
        "^(?:https?://)?(?:(?!.*-\\.)(?:\\w+(-\\w+)*\\.))*whereby\\.com(/[\\w\\-._~:?#\\[\\]@!$&'()*+,;%=]+)*$",
    },
  },
} as AppMeta;
