import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  "/*": "Don't modify slug - If required, do it using cli edit command",
  name: "Element Call",
  slug: "element-call",
  type: "element-call_conferencing",
  logo: "icon.svg",
  url: "https://github.com/suyash5053/",
  variant: "conferencing",
  categories: ["conferencing"],
  publisher: "Suyash Srivastava",
  email: "suyashsrivastava50532gmail.com",
  appData: {
    location: {
      type: "integrations:{SLUG}_video",
      label: "{TITLE}",
      linkType: "static",
      organizerInputPlaceholder: "https://call.element.io/",
      urlRegExp: "^http(s)?:\\/\\/(www\\.)?call.element.io/[a-zA-Z0-9]*",
    },
  },
  description:
    'Element is an open-source communication platform that provides messaging, voice calling, and video conferencing capabilities. It is based on the Matrix protocol, which is a decentralized and federated messaging protocol designed to enable secure and interoperable communication across different platforms and services."',
  isTemplate: false,
  __createdUsingCli: true,
  __template: "event-type-location-video-static",
  dirName: "element-call",
} as AppMeta;
