import { createHash, randomBytes } from "node:crypto";

const AUTHORIZE_URL = "https://api.whop.com/oauth/authorize";
const TOKEN_URL = "https://api.whop.com/oauth/token";
const USERINFO_URL = "https://api.whop.com/oauth/userinfo";

const base64url = (input: Buffer) => input.toString("base64url");

export function createPkce() {
  const verifier = base64url(randomBytes(32));
  return {
    verifier,
    challenge: base64url(createHash("sha256").update(verifier).digest()),
    state: base64url(randomBytes(16)),
    nonce: base64url(randomBytes(16)),
  };
}

export function authorizeUrl(options: {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  nonce: string;
  challenge: string;
}): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    scope: options.scope,
    state: options.state,
    nonce: options.nonce,
    code_challenge: options.challenge,
    code_challenge_method: "S256",
  });
  return `${AUTHORIZE_URL}?${params}`;
}

export type Tokens = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
};

/** PKCE, so no client secret. The verifier is the proof. */
export async function exchangeCode(options: {
  code: string;
  clientId: string;
  redirectUri: string;
  verifier: string;
}): Promise<Tokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: options.code,
      redirect_uri: options.redirectUri,
      client_id: options.clientId,
      code_verifier: options.verifier,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as Tokens;
}

/** `sub` is the Whop user id (user_...). */
export async function fetchUserInfo(accessToken: string): Promise<{
  sub: string;
  name?: string;
  email?: string;
  username?: string;
}> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`userinfo failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as { sub: string };
}
