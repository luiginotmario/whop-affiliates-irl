import { z } from "zod";
import { env } from "@/lib/env";
import {
  type BusinessContext,
  type Pitch,
  PitchSchema,
} from "@/lib/schemas";
import { summarizeStack } from "@/lib/detect/stack";

const SYSTEM = `You brief a salesperson who is about to walk into a local business and pitch Whop.

Whop is a payments and monetization platform: checkout in 195 countries with 100+ payment methods, one-time and recurring billing, an affiliate program that pays referrers automatically, instant payouts to bank or crypto, and a built-in audience that discovers businesses on Whop.

This is read off a phone while standing in front of the owner. It gets glanced
at, not read. Every line must be sayable at a glance.

Rules:
- Give exactly 3 bullets. Not 4, not 5. They will not get through more.
- "say" is at most 12 words. One breath. No sub-clauses, no "could" pile-ups.
- "proof" is a 2-4 word label, never a sentence: "195 countries",
  "Recurring billing", "Instant payouts", "Pays referrers automatically".
- "opener" is spoken TO THE OWNER, second person, max 15 words. It names what
  they run and invites a reply. "You run X and Y" / "I saw you use X".
  Never third person: not "Runs Shopify for gifts" — they are standing there.
- Lead with what they already run. Never guess a tool that was not detected.
- Never claim a fee, a percentage, or a savings number. You do not know their rates.
- No hype words: revolutionary, game-changing, seamless, unlock, supercharge.
- If nothing was detected, pitch from the business category alone and say so plainly.`;

export async function generatePitch(ctx: BusinessContext): Promise<Pitch> {
  const res = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openRouter()}`,
      },
      body: JSON.stringify({
        model: env.model(),
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: describe(ctx) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "pitch",
            strict: true,
            schema: z.toJSONSchema(PitchSchema),
          },
        },
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (!res.ok) {
    throw new Error(`OpenRouter failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned no content");

  return PitchSchema.parse(JSON.parse(content));
}

function describe(ctx: BusinessContext): string {
  const { place, stack, siteSummary } = ctx;
  return [
    `Business: ${place.name}`,
    place.category && `Category: ${place.category}`,
    place.address && `Address: ${place.address}`,
    place.rating &&
      `Rating: ${place.rating} from ${place.userRatingCount ?? "?"} reviews`,
    place.priceLevel && `Price level: ${place.priceLevel}`,
    place.website ? `Website: ${place.website}` : "Website: none found",
    `Detected stack: ${summarizeStack(stack)}`,
    siteSummary && `Site copy: ${siteSummary.slice(0, 1500)}`,
  ]
    .filter(Boolean)
    .join("\n");
}
