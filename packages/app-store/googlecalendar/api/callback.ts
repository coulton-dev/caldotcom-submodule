import { google } from "googleapis";
import type { NextApiRequest, NextApiResponse } from "next";

import { WEBAPP_URL_FOR_OAUTH, CAL_URL } from "@calcom/lib/constants";
import { getSafeRedirectUrl } from "@calcom/lib/getSafeRedirectUrl";
import prisma from "@calcom/prisma";

import getAppKeysFromSlug from "../../_utils/getAppKeysFromSlug";
import getInstalledAppPath from "../../_utils/getInstalledAppPath";
import { decodeOAuthState } from "../../_utils/oauth/decodeOAuthState";

let client_id = "";
let client_secret = "";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  const state = decodeOAuthState(req);

  if (code && typeof code !== "string") {
    res.status(400).json({ message: "`code` must be a string" });
    return;
  }
  if (!req.session?.user?.id) {
    return res.status(401).json({ message: "You must be logged in to do this" });
  }

  const appKeys = await getAppKeysFromSlug("google-calendar");
  if (typeof appKeys.client_id === "string") client_id = appKeys.client_id;
  if (typeof appKeys.client_secret === "string") client_secret = appKeys.client_secret;
  if (!client_id) return res.status(400).json({ message: "Google client_id missing." });
  if (!client_secret) return res.status(400).json({ message: "Google client_secret missing." });

  const redirect_uri = `${WEBAPP_URL_FOR_OAUTH}/api/integrations/googlecalendar/callback`;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

  let key = { access_token: "" };

  if (code) {
    const token = await oAuth2Client.getToken(code);
    key = token.res?.data;
  }

  const credentials = await prisma.credential.create({
    data: {
      type: "google_calendar",
      key,
      userId: req.session.user.id,
      appId: "google-calendar",
    },
  });

  // Fetch the user's email from the Google OAuth2 userinfo endpoint using the access token in 'key'.
  const userEmail = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${key?.access_token}`,
    },
  })
    .then((res) => res.json())
    .then((res) => res.email); // Extract the user's email from the response.

  // Upsert (Insert or Update) a record of primary calendar in the 'selectedCalendar' table in the Prisma database.
  await prisma.selectedCalendar.upsert({
    where: {
      userId_integration_externalId: {
        userId: req.session.user.id,
        integration: credentials?.type, // Match the credential type.
        externalId: userEmail, // Match the user's email.
      },
    },
    create: {
      userId: req.session.user.id,
      integration: credentials?.type, // Set the integration type from the credential.
      externalId: userEmail, // Set the external ID to the user's email.
      credentialId: credentials?.id, // Associate the credential with this record.
    },
    update: {},
  });

  if (state?.installGoogleVideo) {
    const existingGoogleMeetCredential = await prisma.credential.findFirst({
      where: {
        userId: req.session.user.id,
        type: "google_video",
      },
    });

    if (!existingGoogleMeetCredential) {
      await prisma.credential.create({
        data: {
          type: "google_video",
          key: {},
          userId: req.session.user.id,
          appId: "google-meet",
        },
      });

      res.redirect(
        getSafeRedirectUrl(`${CAL_URL}/apps/installed/conferencing?hl=google-meet`) ??
          getInstalledAppPath({ variant: "conferencing", slug: "google-meet" })
      );
    }
  }
  res.redirect(
    getSafeRedirectUrl(state?.returnTo) ??
      getInstalledAppPath({ variant: "calendar", slug: "google-calendar" })
  );
}
