import { unstable_cache } from "next/cache";
import { env } from "@/lib/env";

const PROMPT = `You are researching a tool a local business already uses, so a
salesperson does not walk in and pitch them something they already have.

Answer in at most 6 short lines, facts only, no selling:
- What it does (one line)
- What it charges, with the real number if you find one
- What it genuinely does WELL (the salesperson must not trash it)
- What it does NOT do: does it take payments? pay out to staff or suppliers?
  hold a balance? issue cards? run ads? handle sales tax filing?

If a fact is not verifiable, omit the line rather than guess.`;

async function research(tool: string): Promise<string | null> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openRouter()}`,
      },
      body: JSON.stringify({
        model: env.model(),
        plugins: [{ id: "web", max_results: 4 }],
        messages: [
          { role: "system", content: PROMPT },
          { role: "user", content: `Tool: ${tool}` },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    return content ? `${tool}\n${content.trim()}` : null;
  } catch {
    return null;
  }
}

/** Cached hard: what Square is does not change per shop, and the same handful
 *  of tools come up all day. First restaurant pays for the lookup, the rest
 *  get it free. */
export const researchTool = unstable_cache(research, ["tool-research"], {
  revalidate: 60 * 60 * 24 * 30,
  tags: ["tool-research"],
});

/** Cap the fan-out: three tools is enough to write three bullets. */
export async function researchStack(tools: string[]): Promise<string[]> {
  const results = await Promise.all(tools.slice(0, 3).map(researchTool));
  return results.filter((r): r is string => r !== null);
}
