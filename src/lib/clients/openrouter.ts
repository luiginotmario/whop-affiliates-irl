import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { env } from "@/lib/env";
import { type BusinessContext, type Pitch, PitchSchema } from "@/lib/schemas";
import { summarizeStack } from "@/lib/detect/stack";
import { describeMarket } from "@/lib/competitive";

/** The knowledge base is the product. Read once at module load — it ships with
 *  the repo, so there is no reason to touch disk per request. */
const KNOWLEDGE = readFileSync(
  join(process.cwd(), "src/content/whop-stack.md"),
  "utf8",
);

const SYSTEM = `You brief a salesperson who is about to walk into a local business and pitch Whop.

Everything you know about Whop is in the knowledge base below. Use only what is
in it. Do not add capabilities, numbers, or comparisons from memory.

<whop_knowledge>
${KNOWLEDGE}
</whop_knowledge>

This is read off a phone while standing in front of the owner. It gets glanced
at, not read. Every line must be sayable at a glance.

Rules:
- Pick the 2-3 capabilities that fit THIS business. Never recite the file.
- Follow the knowledge base's "How to reason about a business" section: work out
  how they take money today, find the worst part of it, and name the Whop
  product that removes it. A shop taking cards in person on a Square terminal
  should hear about Tap to Pay before it hears about anything else.
- Prefer the specific differentiator over the generic one. "Whop owns the ad
  account, so there is no Business Manager to get banned" beats "run ads".
  "Spend earnings on an issued card without moving money to a bank" beats
  "we handle payouts".
- Give exactly 3 bullets. Not 4, not 5. They will not get through more.
- "say" is at most 12 words. One breath. No sub-clauses, no "could" pile-ups.
- "proof" is a 2-4 word label, never a sentence: "Whop owns the ad account",
  "Spend from your balance", "Refunds claw back".
- Lead with what they already run. Never guess a tool that was not detected.
- EXACTLY ONE of the three bullets MUST cite a number from MARKET POSITION.
  Those numbers were counted from live data and are safe to say verbatim.
  Make it the opening bullet — a specific fact about their own street is what
  earns the next thirty seconds. Name the rival if it helps.
  Good: "Three coffee shops within 500m have more reviews than you."
  Good: "WatchHouse has 1029 reviews to your 978."
  Bad: "You could reach more customers."
- Any number you use must come from MARKET POSITION or the knowledge base.
  Never estimate, project, or model a result. "Ads would drive 3x more" is
  forbidden. "Three shops within 500m out-review you" is encouraged.
- Obey the "What not to say" section of the knowledge base exactly.`;

export async function generatePitch(ctx: BusinessContext): Promise<Pitch> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
  });

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
  const { place, stack, siteSummary, market } = ctx;
  return [
    `Business: ${place.name}`,
    place.category && `Category: ${place.category}`,
    place.address && `Address: ${place.address}`,
    place.rating &&
      `Rating: ${place.rating} from ${place.userRatingCount ?? "?"} reviews`,
    place.priceLevel && `Price level: ${place.priceLevel}`,
    place.website ? `Website: ${place.website}` : "Website: none found",
    `Detected stack: ${summarizeStack(stack)}`,
    market &&
      `MARKET POSITION (counted from live data, safe to quote):\n${describeMarket(
        market,
        place,
      )
        .map((l) => `- ${l}`)
        .join("\n")}`,
    siteSummary && `Site copy: ${siteSummary.slice(0, 1500)}`,
  ]
    .filter(Boolean)
    .join("\n");
}
