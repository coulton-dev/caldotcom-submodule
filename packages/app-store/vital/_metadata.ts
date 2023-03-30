import type { AppMeta } from "@calcom/types/App";

import _package from "./package.json";

export const metadata = {
  name: "Vital",
  description: _package.description,
  installed: true,
  category: "other",
  categories: ["other"],
  // If using static next public folder, can then be referenced from the base URL (/).
  imageSrc: "/app-store/vital/icon.svg",
  logo: "/app-store/vital/icon.svg",
  label: "Vital",
  publisher: "Vital",
  rating: 5,
  reviews: 69,
  slug: "vital-automation",
  title: "Vital",
  trending: true,
  type: "vital_other",
  url: "https://tryvital.io",
  variant: "other",
  verified: true,
  email: "support@tryvital.io",
  dirName: "vital",
} as AppMeta;

export default metadata;
