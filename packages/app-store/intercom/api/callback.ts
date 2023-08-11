import type { NextApiRequest, NextApiResponse } from "next";

import { CAL_URL } from "@calcom/lib/constants";
import { getSafeRedirectUrl } from "@calcom/lib/getSafeRedirectUrl";
import logger from "@calcom/lib/logger";
import prisma from "@calcom/prisma";

import createOAuthAppCredential from "../../_utils/createOAuthAppCredential";
import getAppKeysFromSlug from "../../_utils/getAppKeysFromSlug";
import getInstalledAppPath from "../../_utils/getInstalledAppPath";

const log = logger.getChildLogger({ prefix: [`[[intercom/api/callback]`] });

let client_id = "";
let client_secret = "";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;

  if (code && typeof code !== "string") {
    res.status(400).json({ message: "`code` must be a string" });
    return;
  }
  if (!req.session?.user?.id) {
    return res.status(401).json({ message: "You must be logged in to do this" });
  }

  const appKeys = await getAppKeysFromSlug("intercom");

  if (typeof appKeys.client_id === "string") client_id = appKeys.client_id;
  if (typeof appKeys.client_secret === "string") client_secret = appKeys.client_secret;
  if (!client_id) return res.status(400).json({ message: "Intercom client_id missing." });
  if (!client_secret) return res.status(400).json({ message: "Intercom client_secret missing." });

  const response = await fetch(`https://api.intercom.io/auth/eagle/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      client_id,
      client_secret,
    }),
  });

  const responseBody = await response.json();

  if (response.status !== 200) {
    log.error("get user_access_token failed", responseBody);
    return res.redirect("/apps/installed?error=" + JSON.stringify(responseBody));
  }

  // Find if already credentials on the database
  await prisma.credential.deleteMany({
    where: {
      userId: req.session.user.id,
      type: "intercom_automation",
    },
  });

  // Find the admin id from the accompte thanks to access_token and store it
  const admin = await fetch(`https://api.intercom.io/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${responseBody.access_token}`,
    },
  });

  const adminBody = await admin.json();

  if (admin.status !== 200) {
    log.error("get admin_id failed", adminBody);
    return res.redirect("/apps/installed?error=" + JSON.stringify(adminBody));
  }

  const adminId = adminBody.id;

  createOAuthAppCredential(
    { appId: "intercom", type: "intercom_automation" },
    {
      adminId,
      access_token: responseBody.access_token,
    },
    req
  );

  res.redirect(
    getSafeRedirectUrl(CAL_URL + "/apps/installed/automation?hl=intercom") ??
      getInstalledAppPath({ variant: "automation", slug: "intercom" })
  );
}
