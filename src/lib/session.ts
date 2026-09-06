import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { refreshTokens } from "@/lib/oauth";

export const SESSION_COOKIE = "whop_session";
export const PKCE_COOKIE = "whop_pkce";

/** The cookie outlives the token it carries. Those are different lifetimes:
 *  the access token is short-lived and renewable, the sign-in is not. Tying
 *  the cookie to `expires_in` is what made sessions vanish on tab close. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export type Session = {
  userId: string;
  token: string;
  username: string | null;
  refreshToken?: string;
  /** Absolute epoch ms, so it survives serialisation unambiguously. */
  expiresAt?: number;
};

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

/** Sixty seconds of slack so a call does not start with a token about to die. */
const EXPIRY_SKEW_MS = 60_000;

export async function getOptionalUser(): Promise<Session | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  let session: Session;
  try {
    session = JSON.parse(raw) as Session;
  } catch {
    return null;
  }
  if (!session.userId || !session.token) return null;

  const stale =
    session.expiresAt !== undefined &&
    session.expiresAt - EXPIRY_SKEW_MS < Date.now();
  if (!stale || !session.refreshToken) return session;

  try {
    const tokens = await refreshTokens({
      refreshToken: session.refreshToken,
      clientId: env.whopClientId(),
    });
    const renewed: Session = {
      ...session,
      token: tokens.access_token,
      refreshToken: tokens.refresh_token ?? session.refreshToken,
      expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000,
    };
    // Route handlers may write cookies; server components may not. Either way
    // the caller still gets a working token for this request.
    try {
      jar.set(SESSION_COOKIE, JSON.stringify(renewed), sessionCookieOptions());
    } catch {
      /* read-only context — the refreshed token is still returned */
    }
    return renewed;
  } catch {
    return session; // let the API call fail and surface a real error
  }
}
