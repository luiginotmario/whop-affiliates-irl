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
