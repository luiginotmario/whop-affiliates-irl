# Whop: what it actually does, and why it wins each argument

Knowledge base for pitch generation. Every claim below traces to a first-party
Whop source, cited per section. Researched 2026-09-04 — re-verify before
quoting a number to a business owner.

Rule for the model reading this: pick the 2-3 capabilities that match what the
business already runs. Never recite the whole file. A shop on Square does not
care about courses.

---

## The one-line frame

Stripe sells you a payment processor. Whop sells you the whole business:
you take the money, hold the money, spend the money on a card, buy ads with it,
pay your referrers from it, and incorporate the company that owns it — in one
account. Every competitor below solves exactly one row of that.

---

## 1. Payments & checkout

**What it is.** Card, wallet and local-method checkout in 195 countries,
135+ currencies, 100+ payment methods. Embeddable, hosted, or API.

**What you can actually do.** Drop a checkout on your own site; take Apple Pay
and Google Pay; offer Klarna and Afterpay so customers pay over time; run
one-time or recurring on the same plan object; auto-retry failed cards and take
automatically-updated card numbers when they expire.

**Why this beats a plain processor.** Financing (Klarna/Afterpay), card
auto-updating and real-time retries are revenue-recovery features that normally
cost extra or need a third-party dunning tool bolted on. Whop lists 99.999%
uptime and PCI-compliant infrastructure, and 24×7 phone, chat and email support
— phone support is rare at this price point.

**Source:** https://docs.whop.com/fees.md · https://docs.whop.com/developer/guides/accept-payments.md

## 1b. Tap to Pay on iPhone — in-person, no terminal

**What it is.** Apple's Tap to Pay, built into every Whop checkout. The seller's
iPhone *is* the card reader. No terminal, no dock, no dongle.

**What you can actually do.** Open any payment link in the Whop iOS app; under
the QR code there is a **Tap to Pay** button. The customer taps a physical card,
Apple Pay, or any contactless wallet against the phone. Payment is instant and
the money lands in the Whop balance next to every online sale — same ledger, one
set of books.

**Why this beats Square, Toast and Clover.** Three things, and they compound:
- **No hardware.** No terminal to buy, charge, carry, or replace. Works at a
  pop-up, a market stall, a delivery, a chair on the pavement.
- **One balance.** Square settles to your bank on their cycle. Here the money is
  immediately spendable — issue a card (section 4) and buy stock with this
  morning's takings.
- **Same books.** In-person and online sales are the same ledger. No monthly
  reconciliation between a POS and a payment processor.

**Rate.** US in-person: **2.6% + 10¢** — cheaper than Whop's own online rate.
No setup fee, no monthly cost, no contactless surcharge.

**Limitation, state it honestly.** One-time payments only. Not subscriptions.

**Source:** https://whop.com/blog/tap-to-pay-on-iphone/

## 1c. Sales tax, calculated and remitted

**What it is.** Whop calculates, collects and remits sales tax for you.

**What you can actually do.** Set `tax_remitted_by`, `tax_type` and a product
tax code on the account; tax is then handled per transaction. Preview a buyer's
subtotal, tax and total before checkout with Calculate Tax.

**Why this matters to a shop.** Tax filing is the job every owner hates and most
do badly. A processor hands you a CSV; this remits it.

**Cost.** 2% per transaction on which tax is collected. Say the rate if asked —
it is not free.

**Source:** https://docs.whop.com/fees.md · https://docs.whop.com/api-reference/beta/plans/calculate-tax.md

## 2. Subscriptions & memberships

**What it is.** Plans define price and cadence; memberships track each
customer's billing state and access.

**What you can actually do.** Pause and resume collection, add free days, cancel
at period end or immediately, reverse a scheduled cancellation, transfer a
membership to another person with a one-use link, and invite someone straight
onto a free plan.

**Why this beats rolling your own.** Pause/resume, free-day extensions and
membership transfer are the three things every subscription business builds
badly in-house. They are endpoints here.

**Source:** https://docs.whop.com/api-reference/beta/memberships/membership.md

## 3. Payouts & money movement

**What it is.** Money out to 200+ countries — bank, wallet, or crypto — plus
account-to-account transfers inside Whop.

**What you can actually do.** Pay staff, contractors or referrers directly from
your balance. Send to someone who has no account yet with a claim link they
redeem later. Choose standard ACH ($2.50) or instant (4% + $1.00).

**Why this beats a processor plus a bank.** A processor moves money to your
bank and stops. Paying anyone else is then your problem — a separate payroll or
mass-payout vendor. Here, taking money in and paying people out are the same
balance.

**Source:** https://docs.whop.com/api-reference/beta/transfers/transfer.md · https://docs.whop.com/fees.md

## 4. Wallet, cards & swaps

**What it is.** Your earnings sit in a Whop balance. Whop issues virtual cards
that spend from it directly.

**What you can actually do.** Issue cards, assign them to named cardholders,
set per-card spending limits, freeze a card, and read every transaction. Swap
between currencies or tokens in-ledger at mid-market. Spend earnings without
first withdrawing to a bank.

**Why this is the strongest argument for most businesses.** Everywhere else,
revenue has to leave the platform, land in a bank account, and come back out on
a different company's card before you can spend it. Here the money never leaves.
Earn Monday, buy inventory Tuesday, no transfer, no wait, no second vendor.

**Source:** https://docs.whop.com/api-reference/beta/cards/card.md · https://docs.whop.com/api-reference/beta/swaps/swap.md

## 5. Ads & attribution

**What it is.** Buy ads on external networks from your Whop account. **Whop owns
the ad account, the review path, and the billing relationship.**

**What you can actually do.** Create a campaign, ad group and ad in a single API
call. Target by location, demographics, interests, devices and languages, or
upload a customer list as an audience. Generate creatives as AI images or video
from a prompt, supply your own, or promote an existing post from a connected
social account. Pay for spend out of your Whop balance.

**Why this beats Meta Ads Manager directly.** Two reasons, and they are the real
ones. First, you never own the ad account — no Business Manager setup, no
account bans or review purgatory, because the account is Whop's. Second, and
bigger: **every performance number is attributed by the Whop pixel, not by the
ad network.** The platform selling you the ads is not the platform grading them.

**Accuracy note.** The docs say "networks like Meta" and Meta is the documented
platform. Do not promise Google or TikTok campaigns.

**Source:** https://docs.whop.com/developer/ads/overview.md · https://docs.whop.com/developer/ads/pixel.md

## 6. Affiliates & partners

**What it is.** Two separate systems. Affiliates promote *your* products.
Partners refer *businesses onto Whop* and earn on their activity.

**What you can actually do.** Create an affiliate from just an email — they do
not need an existing Whop account. Set commission as a percentage or flat fee,
per plan or as account-wide revenue share. Refunds claw commissions back
automatically. Partners earn across two tiers on four income sources: product
sales, ad spend, platform transfers, and card interchange.

**Why this beats an affiliate SaaS.** The usual stack is processor + affiliate
platform + payout vendor, with reconciliation between them. Here attribution,
commission math, refund clawback and the payout are one system, so an affiliate
cannot be paid on a sale that later refunded.

**Source:** https://docs.whop.com/developer/guides/affiliates.md · https://docs.whop.com/developer/partners/overview.md

## 7. Marketplaces & connected accounts

**What it is.** Onboard other businesses under you, charge on their behalf, take
a cut, pay them out.

**What you can actually do.** Create a connected account, send a hosted KYC
onboarding link, charge customers directly on that account while collecting an
application fee, or collect centrally and transfer their share later. Set fee
markups per account. Embed a payout portal so they manage their own withdrawals.

**Why this matters.** This is the same shape as Stripe Connect, with payouts,
issued cards and identity already attached rather than assembled.

**Source:** https://docs.whop.com/developer/platforms/enroll-connected-accounts.md · https://docs.whop.com/developer/platforms/collect-payments-for-connected-accounts.md

## 8. Identity & verification

**What it is.** Hosted KYC/KYB. One call starts a session; Whop runs the rest.

**What you can actually do.** Start verification for a person or a business,
prefill known fields, handle requests for more information, and read verified
identity data back. Business structures are supported per country of
incorporation.

**Why it matters.** You cannot pay people at scale without this, and it is
normally a separate vendor and contract.

**Source:** https://docs.whop.com/developer/verification/overview.md

## 9. LLC / C-Corp formation

**What it is.** Whop will incorporate the business itself.

**What you can actually do.** Start an LLC or a C-Corp for a business account
via `POST /accounts/{id}/form_company`. C-Corp additionally takes a share
structure and officer roles per founder. The response returns a hosted checkout;
once paid, the filing is submitted, and progress is tracked on the account's
`company_formation` field.

**Why nobody else does this.** No payment processor incorporates your company.
This is the line that ends the "we already have Stripe" conversation — it is not
the same category of product.

**Source:** https://docs.whop.com/api-reference/beta/accounts/form-company.md

## 10. Chat, community & courses

**What it is.** Chat channels, DMs, forums and full course delivery, gated by
membership.

**What you can actually do.** Give paying customers a private forum or chat,
sell a course with chapters, lessons and assessments, and track per-student
completion.

**Why this beats bolting on Discord or a course platform.** Access is tied to
the membership, so it is granted and revoked by billing state automatically.
Nobody keeps access after they stop paying, and nobody has to be manually
removed.

**Source:** https://docs.whop.com/llms.txt (Chat & engagement, Courses)

## 11. Distribution: the Whop marketplace

**What it is.** Whop is a consumer destination, not only infrastructure. People
browse it and buy.

**What you can actually do.** List products where buyers already are. Ship an
app to businesses already transacting on Whop.

**Why this is the one no processor can copy.** Stripe cannot send you a
customer. Whop can. Every other row here is plumbing; this one is demand.

**Source:** https://docs.whop.com/developer/start.md

## 12. Data & analytics

**What it is.** Time-series stats on revenue, transactions, disputes, members
and referrals, plus a per-payment fee breakdown.

**What you can actually do.** Query any metric over any period, break it down by
its properties, and read exactly what Whop's fee, processing, affiliate and
other lines cost on any single payment.

**Why it matters.** Per-payment fee transparency is unusual — most processors
report fees in aggregate at month end.

**Source:** https://docs.whop.com/developer/guides/stats.md · https://docs.whop.com/api-reference/beta/payments/list-payment-fees.md

---

## The rate card

Only quote these if the owner asks about cost. They are first-party as of
2026-09-04.

| Item | Rate |
| --- | --- |
| Domestic cards & wallets (online) | 2.7% + $0.30 |
| In-person, Tap to Pay (US) | 2.6% + 10¢ |
| International cards | +1.5% |
| Currency conversion | +1% |
| Monthly platform fee | none |
| Dispute | $15.00 |
| Early dispute alert | $29.00 |
| ML fraud detection | $0.03–$0.07 per check |
| Payment orchestration | 0.8% |
| Billing automation | 0.5% |
| Tax collection & remittance | 2% when tax is collected |
| Standard ACH payout | $2.50 |
| Instant payout | 4% + $1.00 |

**Honesty rule.** Do not present 2.7% + $0.30 as the all-in cost. A business
using international cards, tax remittance and instant payouts pays materially
more. Quote the base rate as the base rate.

**Source:** https://docs.whop.com/fees.md

---

## How to reason about a business

Do not pattern-match the category to a stock answer. Work out how this business
actually takes money today, find the worst part of that, and name the Whop
product that removes it.

Ask, in order:
1. **How do they get paid right now?** In person? A POS? Online only? Not at all?
2. **What is that costing them** — hardware, a monthly fee, a settlement delay,
   two sets of books, tax filing they do by hand?
3. **Which single Whop capability removes that?** Lead with that one.
4. **What would they buy second?** That is bullet two.

Worked examples — note that none of them lead with "global payments":

- **Watch shop, high ticket, in person, Square terminal.** Lead with Tap to Pay:
  the terminal disappears and the iPhone becomes the reader. Then financing —
  Klarna and Afterpay matter enormously on a £3,000 watch and are the difference
  between a sale and a maybe. Then the card: spend today's takings on stock
  without waiting for settlement.
- **Restaurant on Toast, bookings on Resy.** Tap to Pay for the counter and the
  terrace, prepaid tasting-menu deposits as one-time plans, sales tax remitted
  instead of filed by hand.
- **Barber, cash and a card reader, Instagram-led.** Tap to Pay, memberships for
  a monthly cut, and regulars as affiliates who get paid for referrals.
- **Boutique on Shopify.** Never pitch replacing Shopify. Pitch the layer it has
  no answer for: affiliate payouts, an issued card, marketplace discovery.
- **Market stall, cash only.** Tap to Pay alone. No hardware, no wifi, no power.
  Nothing else matters until they can take a card.
- **Gym or studio on Mindbody.** Memberships with pause and resume — the single
  most requested thing a gym cannot do well — plus in-person Tap to Pay.

The test for a good bullet: could the owner disagree with the *fact*? If they
could only disagree with the *opinion*, it is too vague.

## Angle by business type

Match on the Places category and the detected stack.

- **Brick and mortar** — take in-person payments from the Whop iOS app: create a
  checkout link, a QR appears, the customer scans and pays. Print it for
  signage. Then give regulars a paid forum and a merch store.
  *(https://docs.whop.com/supported-business-models/brick-and-mortar.md)*
- **Runs Shopify / an online store** — do not pitch replacing it. Pitch the
  layer Shopify has no answer for: affiliate payouts, an issued card that spends
  the revenue, and marketplace distribution.
- **Runs Square / Toast / Clover** — they own the register; Whop owns everything
  after the sale. Recurring plans, referrals, and money that stays spendable.
- **Takes bookings (Resy, Calendly, Mindbody)** — memberships and prepaid
  packages billed automatically, with access tied to billing state.
- **Instagram-led, no site** — checkout link in bio, followers become paid
  affiliates, marketplace discovery.
- **Coach, course, newsletter, paid community** — memberships plus courses plus
  chat, gated on billing, in one place.

---

## What not to say

- Never claim a saving, a percentage cut, or a comparison number you cannot
  source. You do not know their current rates.
- Never name a tool that was not actually detected.
- Never promise Google or TikTok ad campaigns. Meta is what is documented.
- No hype words: revolutionary, game-changing, seamless, unlock, supercharge.
