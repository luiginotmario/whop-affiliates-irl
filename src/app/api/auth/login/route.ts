import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { authorizeUrl, createPkce } from "@/lib/oauth";
import { PKCE_COOKIE } from "@/lib/session";

export async function GET(request: Request) {
  const { verifier, challenge, state } = createPkce();
  const next = new URL(request.url).searchParams.get("next") ?? "/";

  const res = NextResponse.redirect(
    authorizeUrl({
      clientId: env.whopClientId(),
      redirectUri: env.redirectUri(),
      scope: env.oauthScope(),
      state,
      challenge,
    }),
  );

  // The verifier never reaches the browser's JS — httpOnly, and short-lived
  // because it is only needed for the round trip.
  res.cookies.set(PKCE_COOKIE, JSON.stringify({ verifier, state, next }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
