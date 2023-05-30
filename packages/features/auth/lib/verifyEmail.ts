import { randomBytes } from "crypto";

import { sendEmailVerificationLink } from "@calcom/emails/email-manager";
import { WEBAPP_URL } from "@calcom/lib/constants";
import logger from "@calcom/lib/logger";
import rateLimit from "@calcom/lib/rateLimit";
import { getTranslation } from "@calcom/lib/server/i18n";
import { prisma } from "@calcom/prisma";
import { TRPCError } from "@calcom/trpc/server";

const log = logger.getChildLogger({ prefix: [`[[Auth] `] });

const limiter = rateLimit({
  intervalInMs: 60 * 1000, // 1 minute
});

interface VerifyEmailType {
  username?: string;
  email: string;
  language?: string;
}

export const sendEmailVerification = async ({ email, language, username }: VerifyEmailType) => {
  const token = randomBytes(32).toString("hex");
  const translation = await getTranslation(language ?? "en", "common");

  const sendEmailVerificationEnabled = await prisma.feature.findFirst({
    where: {
      slug: "email-verification",
      enabled: true,
    },
  });

  if (!sendEmailVerificationEnabled) {
    log.warn("Email verification is disabled - Skipping");
    return { ok: true, skipped: true };
  }

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(new Date().setHours(23)), // +1 day
    },
  });

  const params = new URLSearchParams({
    token,
  });

  const { isRateLimited } = limiter.check(10, email); // 10 requests per minute

  if (isRateLimited) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "An unexpected error occurred, please try again later.",
      cause: "Too many requests",
    });
  }

  await sendEmailVerificationLink({
    language: translation,
    verificationEmailLink: `${WEBAPP_URL}/api/auth/verify-email?${params.toString()}`,
    user: {
      email,
      name: username,
    },
  });

  return { ok: true, skipped: false };
};
