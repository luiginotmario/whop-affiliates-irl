import {
  createAccount,
  createProduct,
  listAccounts,
  createOnboardingLink,
} from "@/lib/clients/whop";
import { buildContext } from "@/lib/pitch";
import type { BusinessContext } from "@/lib/schemas";

function productTitle(ctx: BusinessContext): string {
  const category = ctx.place.category ?? "Purchase";
  return `${category} at ${ctx.place.name}`;
}

function productDescription(ctx: BusinessContext): string {
  // Their own words where we have them; the category where we do not.
  const summary = ctx.siteSummary?.trim().slice(0, 240);
  return summary && summary.length > 40
    ? summary
    : `Pay ${ctx.place.name} online or in person.`;
}

async function findAccountByTitle(accessToken: string, title: string) {
  try {
    const { data } = await listAccounts(accessToken);
    const wanted = title.trim().toLowerCase();
    return data.find((a) => a.title?.trim().toLowerCase() === wanted) ?? null;
  } catch {
    return null; // a listing failure should not block a first-time create
  }
}

/** Builds the business and hands it over in one pass. Deliberately not split:
 *  creating on a toggle would litter Whop with accounts for shops that said
 *  no, so nothing exists until an email is submitted. */
export async function buildAndTransfer(options: {
  /** One credential for the whole chain. An account created by another
   *  credential is a company this key has no authority over, so the invite
   *  would 403 no matter what permissions the key holds. */
  token: string;
  /** The salesperson's Whop username, recorded as the referring partner. */
  partnerUsername: string | null;
  placeId: string;
  email: string;
  /** Where Whop sends the owner once they have claimed the account. */
  returnUrl: string;
}): Promise<{ accountId: string; claimUrl: string }> {
  const ctx = await buildContext(options.placeId);

  // Whop rejects a second account with the same name, and a run that dies
  // after creating one leaves it behind — so a retry would be permanently
  // blocked by its own debris. Reuse the existing one instead, which also
  // makes a failed attempt resume rather than restart.
  const account =
    (await findAccountByTitle(options.token, ctx.place.name)) ??
    (await createAccount(options.token, {
      title: ctx.place.name,
      email: options.email,
      // Partner credit is recorded here rather than on the handover: the
      // transfer endpoint that carried `as_partner` is not open to us.
      affiliate_code: options.partnerUsername ?? undefined,
    }));

  await createProduct(options.token, {
    account_id: account.id,
    title: productTitle(ctx),
    description: productDescription(ctx),
  });

  // Deliberately no plan. Places only reports a price band, so any price we
  // set would be invented — and an owner opening their new Whop to find a
  // price they never chose is worse than finding none. They price it once,
  // in one click, knowing their own numbers.

  // No team-member invite. Both `owner` and `admin` are full-access grants,
  // and a platform key does not hold full access on the accounts it creates,
  // so it cannot confer either. The hosted onboarding link is the handover.

  const link = await createOnboardingLink(
    options.token,
    account.id,
    options.returnUrl,
  );

  return { accountId: account.id, claimUrl: link.url };
}
