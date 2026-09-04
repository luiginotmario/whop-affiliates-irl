import { cookies } from "next/headers";

export const SESSION_COOKIE = "scout_whop_token";
export const PKCE_COOKIE = "scout_pkce";

/** The signed-in user's Whop access token, or null. */
export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}
