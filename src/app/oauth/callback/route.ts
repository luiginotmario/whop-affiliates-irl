import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { exchangeCode, fetchUserInfo } from "@/lib/oauth";
import { PKCE_COOKIE, SESSION_COOKIE } from "@/lib/session";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const error = params.get("error");
  const code = params.get("code");
  const state = params.get("state");

  const raw = request.headers
    .get("cookie")
    ?.match(new RegExp(`${PKCE_COOKIE}=([^;]+)`))?.[1];
  const stored = raw
    ? (JSON.parse(decodeURIComponent(raw)) as {
        verifier: string;
        state: string;
        returnTo: string;
      })
    : null;

  const fail = (reason: string) =>
    NextResponse.redirect(
      `${env.appUrl()}/?auth_error=${encodeURIComponent(reason)}`,
    );

  if (error) {
    return fail(params.get("error_description") ?? error);
  }
  if (!code || !stored) return fail("Sign-in expired. Try again.");
  if (state !== stored.state) return fail("State mismatch.");

  try {
    const tokens = await exchangeCode({
      code,
      clientId: env.whopClientId(),
      redirectUri: env.redirectUri(),
      verifier: stored.verifier,
    });

    const user = await fetchUserInfo(tokens.access_token);

    const res = NextResponse.redirect(`${env.appUrl()}${stored.returnTo}`);
    res.cookies.set(
      SESSION_COOKIE,
      JSON.stringify({
        userId: user.sub,
        token: tokens.access_token,
        username: user.username ?? user.preferred_username ?? user.name ?? null,
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: tokens.expires_in ?? 60 * 60 * 24 * 30,
      },
    );
    res.cookies.delete(PKCE_COOKIE);
    return res;
  } catch (cause) {
    return fail(cause instanceof Error ? cause.message : "Token exchange failed");
  }
}
