# Scout

Know what to say before you walk in.

You are about to walk into a local business and pitch Whop. Scout tells you what
they already run and gives you the words, then shows the QR that credits you as
their Whop partner.

## Flow

1. **Find them** — use your location, or type a name
2. **Scout reads them** — Google Places for the business, their own homepage for
   the stack they run (Square, Shopify, Calendly, …)
3. **You get a script** — an opener, 3–4 lines written to be spoken, and the
   objection they will raise
4. **Show the QR** — they scan, they onboard, you are credited via the Whop
   Partners API

## Setup

```bash
pnpm install
cp .env.example .env.local   # fill in the keys
pnpm dev
```

| Variable | What it is |
| --- | --- |
| `GOOGLE_PLACES_API_KEY` | Places API (New) must be enabled on the key |
| `OPENROUTER_API_KEY` | Pitch generation |
| `OPENROUTER_MODEL` | Defaults to `anthropic/claude-sonnet-5` |
| `WHOP_API_KEY` | User-scoped credential with the `partner:create` permission |
| `FIRECRAWL_API_KEY` | Optional. Fallback scraper for JS-rendered sites |

## Layout

```
src/
  app/
    page.tsx                  search screen
    pitch/[placeId]/page.tsx  the brief + the close
    api/places/route.ts       search / nearby
  lib/
    clients/                  one file per external service
      places.ts               Google Places (New)
      firecrawl.ts            plain fetch first, Firecrawl as fallback
      openrouter.ts           pitch generation, schema-constrained
      whop.ts                 Whop API
    detect/stack.ts           what they run, from their own HTML
    schemas.ts                every boundary is a Zod schema
    pitch.ts                  orchestrates the three calls
  components/
```

Every component is Frosted UI. No custom palette, no custom type scale.

## Notes from building against the Whop API

Findings from reading the live docs and the published OpenAPI spec on
2026-09-03/04. Re-verify before relying on any of them — they may be fixed.

1. **`@whop/react@0.3.2` maps `./styles.css` in its `exports` but does not ship
   the file.** Its `files` field is `["dist", "scripts/postinstall.mjs"]`, so
   `@import "@whop/react/styles.css"` fails to resolve. The stylesheet lives in
   `frosted-ui`, which pnpm does not hoist — so `frosted-ui` has to be a direct
   dependency. This project imports from `frosted-ui` throughout for that reason.

2. **`WhopApp` requires an app ID.** It boots the iframe SDK, so it throws
   `[createSdk]: appId is required` at prerender in a standalone (non-embedded)
   app. Frosted's own `Theme` is the right wrapper outside an embedded context.
   The Frosted UI guide shows `WhopApp` as the default setup without noting this.

3. **The Frosted UI guide's component names are stale.** It documents
   `TextInput`; the package exports `TextField` as a namespace
   (`TextField.Root` / `TextField.Input`). Text weights include `semi-bold`,
   which the guide omits.

4. **`application_fee_amount` is Legacy-only.** It exists at
   `plan.application_fee_amount` on Legacy `POST /checkout_configurations`, on
   the inline-plan branch only — not on the `plan_id` branch, and not on the
   Current API's create-a-checkout-configuration at all. `llms.txt` says to
   always prefer the versioned API, which leaves platform integrators without a
   documented way to take an application fee on the surface they are told to use.

5. **`collect-payments-for-connected-accounts` omits the field it is about.**
   The prose explains `plan.application_fee_amount`, but only the Python sample
   includes it — TypeScript, Rust, and Go all leave it out.

6. **`POST /account_links` field name disagrees with itself.** The OpenAPI spec
   requires `account_id`; the guide's SDK samples pass `company_id`. Likely an
   SDK-to-wire mapping left over from the Companies to Accounts rename.

7. **Old `Companies` URLs 404 rather than redirecting to `Accounts`.** Worth a
   301 mainly because models trained on the old paths still emit them.
