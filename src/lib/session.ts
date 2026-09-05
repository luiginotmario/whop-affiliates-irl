import { cookies } from "next/headers";

export const SESSION_COOKIE = "whop_session";
export const PKCE_COOKIE = "whop_pkce";

export type Session = { userId: string; token: string };

/** Reads the httpOnly session cookie. Null when signed out. */
export async function getOptionalUser(): Promise<Session | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    return parsed.userId && parsed.token ? parsed : null;
  } catch {
    return null;
  }
}
