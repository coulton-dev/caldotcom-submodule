import { createDefaultInstallation } from "@calcom/app-store/_utils/installation";
import type { AppDeclarativeHandler } from "@calcom/types/AppHandler";

import { metadata as appConfig } from "../_metadata";

const handler: AppDeclarativeHandler = {
  appType: appConfig.type,
  variant: appConfig.variant,
  slug: appConfig.slug,
  supportsMultipleInstalls: false,
  handlerType: "add",
  createCredential: ({ appType, user, slug, teamId }) =>
    createDefaultInstallation({ appType, user, slug, key: {}, teamId }),
};

export default handler;
