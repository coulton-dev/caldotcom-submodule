import { compare, hash } from "bcryptjs";
import { DefaultSession } from "next-auth";
import { getSession as getSessionInner, GetSessionOptions } from "next-auth/client";

export async function hashPassword(password: string) {
  const hashedPassword = await hash(password, 12);
  return hashedPassword;
}

export async function verifyPassword(password: string, hashedPassword: string) {
  const isValid = await compare(password, hashedPassword);
  return isValid;
}

type DefaultSessionUser = NonNullable<DefaultSession["user"]>;
type CalendsoSessionUser = DefaultSessionUser & {
  id: number;
  username: string;
};
export interface CalendsoSession extends DefaultSession {
  user?: CalendsoSessionUser;
}

export async function getSession(options: GetSessionOptions): Promise<CalendsoSession | null> {
  const session = await getSessionInner(options);

  // that these are equal are unsured in `[...nextauth]`'s callback
  return session as CalendsoSession;
}
