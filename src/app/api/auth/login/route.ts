import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { authorizeUrl, createPkce } from "@/lib/oauth";
import { PKCE_COOKIE } from "@/lib/session";

export async function GET(request: Request) {
  const { verifier, challenge, state, nonce } = createPkce();
  const returnTo = new URL(request.url).searchParams.get("next") ?? "/";

  const res = NextResponse.redirect(
    authorizeUrl({
      clientId: env.whopClientId(),
      redirectUri: env.redirectUri(),
      scope: env.oauthScope(),
      state,
      nonce,
      challenge,
    }),
  );

  // Must be set on the redirect response itself — cookies() in a route handler
  // does not attach to a redirect, and the state comes back mismatched.
  res.cookies.set(PKCE_COOKIE, JSON.stringify({ verifier, state, returnTo }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
