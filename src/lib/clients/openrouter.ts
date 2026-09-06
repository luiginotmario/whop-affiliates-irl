import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { env } from "@/lib/env";
import { type BusinessContext, type Pitch, PitchSchema } from "@/lib/schemas";
import { summarizeStack } from "@/lib/detect/stack";
import { describeMarket } from "@/lib/competitive";
import { describeProspect } from "@/lib/prospect";

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
- "product" names the Whop product the line maps to, taken VERBATIM from the
  product table in the knowledge base: "Whop Payouts", "Whop Tap to Pay",
  "Whop Ads", "Whop Marketplace". Never invent a name, never describe a
  capability there. Every bullet must map to a real product — including the
  market-position one.
- "how" is the part that earns the sale. The owner's question after every line
  is "so what?" — answer it. Say what the product actually DOES and what this
  specific business GETS. Name the mechanism, and a number where the knowledge
  base gives you one.
  Good: "Card taps land in your Whop balance at 2.6% + 10c, so there's no
  terminal rental and no waiting on a POS payout cycle."
  Good: "Whop runs the Meta campaigns on its own ad account, so there's no
  Business Manager to set up and results are counted by Whop's pixel, not
  Meta's."
  Bad: "Helps you grow." / "Better payments." / "Reach more customers."
  Never restate the bullet in different words — add the thing it left out.
- Lead with what they already run. Never guess a tool that was not detected.
- INCUMBENT TOOLS is live research on what they currently use. Read it before
  writing anything. NEVER pitch a capability the incumbent already has — if
  their booking tool already takes deposits, do not offer them deposits. That
  is the fastest way to be dismissed.
- If PROSPECT says they have NO website, that is the STRONGEST case on the
  page, not a missing detail. It means no online checkout, no processor to
  migrate, no booking tool, no contract to break — the whole Whop stack is
  net-new. Lead with Whop Tap to Pay, then Whop Wallet, Whop Cards and Whop
  Payouts. Never write "nothing detected" or hedge about missing data; a
  cash-and-terminal business is the easiest sale here, not the hardest.
  Physical businesses do not need to sell online to use Whop.
- Never trash the incumbent, and never argue it fails at something outside its
  job. "Resy can't pay your staff" is a category error — nobody bought a
  booking tool for payroll, and saying it tells the owner you do not understand
  their business.
- Argue CONSOLIDATION, not gaps. Count the tools they are paying for, including
  the ones a website scrape cannot see (POS, payroll, bank, accountant), and
  name which of them collapse into one Whop account.
- Say which tool they KEEP. "Keep Resy" makes everything else credible.
- Mark anything you inferred rather than detected as an assumption the owner can
  correct: "you're probably running payroll somewhere else".
- If the research names a real price they pay, that is fair to reference.
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

/** The system prompt is byte-identical on every request and is most of the
 *  input, so its prefill dominates time-to-first-token. Marking it cacheable
 *  means later requests skip re-processing it. */
function cachedSystem() {
  return [
    {
      type: "text" as const,
      text: SYSTEM,
      cache_control: { type: "ephemeral" as const },
    },
  ];
}

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
    signal: AbortSignal.timeout(45_000),
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
  const { place, stack, siteSummary, market, incumbents, prospect } = ctx;
  return [
    `Business: ${place.name}`,
    place.category && `Category: ${place.category}`,
    place.address && `Address: ${place.address}`,
    place.rating &&
      `Rating: ${place.rating} from ${place.userRatingCount ?? "?"} reviews`,
    place.priceLevel && `Price level: ${place.priceLevel}`,
    place.website ? `Website: ${place.website}` : "Website: none found",
    `Detected stack: ${summarizeStack(stack)}`,
    `PROSPECT:\n${describeProspect(prospect)}`,
    market &&
      `MARKET POSITION (counted from live data, safe to quote):\n${describeMarket(
        market,
        place,
      )
        .map((l) => `- ${l}`)
        .join("\n")}`,
    incumbents.length > 0 &&
      `INCUMBENT TOOLS (researched live just now — trust this over anything you remember):\n${incumbents.join(
        "\n\n",
      )}`,
    siteSummary && `Site copy: ${siteSummary.slice(0, 1500)}`,
  ]
    .filter(Boolean)
    .join("\n");
}
