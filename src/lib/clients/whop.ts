import { env } from "@/lib/env";

export type Partner = {
  referral_link: string;
  whop_partner_enabled_at: string | null;
};

/** Every Partners call acts as a signed-in user, so the caller passes their
 *  OAuth access token. An API key has no user to enrol and gets a 403. */
async function call<T>(
  path: string,
  accessToken: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const { idempotencyKey, ...rest } = init;
  const res = await fetch(`${env.whopBaseUrl()}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      ...rest.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Whop ${path} failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

/** Enrols the signed-in user as a Whop partner and returns their referral link.
 *  Idempotent by contract — enrolling again keeps the original enrolment time,
 *  so this is safe to call on every request. */
export function enrollAsPartner(accessToken: string): Promise<Partner> {
  return call<Partner>("/partners", accessToken, { method: "POST" });
}

export type Account = { id: string; title: string; route: string };
type Product = { id: string; title: string };

/** User tokens list the user's own business accounts; a company key lists its
 *  own account and everything connected to it. */
export function listAccounts(token: string): Promise<{ data: Account[] }> {
  return call<{ data: Account[] }>("/accounts?first=50", token);
}

export function createAccount(
  token: string,
  body: {
    title: string;
    /** Required for Account API key requests — the owner's address. */
    email: string;
    /** The referring partner's Whop username. */
    affiliate_code?: string;
    country?: string;
  },
): Promise<Account> {
  return call<Account>("/accounts", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createProduct(
  token: string,
  body: { account_id: string; title: string; description?: string },
): Promise<Product> {
  return call<Product>("/products", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** The handover for a connected account: a hosted onboarding URL the real
 *  owner opens to claim it.
 *
 *  The two alternatives are both closed. `transfer_ownership` answers 403
 *  "requires a first-party user session". `/team_members` sends an invite
 *  email but `owner` and `admin` are both full-access grants, and a platform
 *  key does not hold full access on the accounts it creates, so it cannot
 *  confer either.
 *
 *  The OpenAPI spec names the field `account_id`; the guide's SDK samples say
 *  `company_id`. Both are sent because the docs disagree. */
export function createOnboardingLink(
  token: string,
  accountId: string,
  returnUrl: string,
): Promise<{ url: string; expires_at: string }> {
  return call<{ url: string; expires_at: string }>("/account_links", token, {
    method: "POST",
    body: JSON.stringify({
      account_id: accountId,
      company_id: accountId,
      use_case: "account_onboarding",
      return_url: returnUrl,
      refresh_url: returnUrl,
    }),
  });
}
