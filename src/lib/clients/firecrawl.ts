import { env } from "@/lib/env";

/** Plain fetch first — it is free, ~200ms, and the signatures we look for sit
 *  in the raw HTML. Firecrawl is the fallback for JS-rendered sites, and only
 *  when a key is configured. */
export async function fetchSite(
  url: string,
): Promise<{ html: string; text: string } | null> {
  const direct = await fetchDirect(url);
  if (direct) return direct;

  const key = env.firecrawl();
  if (!key) return null;

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ url, formats: ["rawHtml", "markdown"] }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { rawHtml?: string; markdown?: string };
    };
    return {
      html: json.data?.rawHtml ?? "",
      text: (json.data?.markdown ?? "").slice(0, 4000),
    };
  } catch {
    return null;
  }
}

async function fetchDirect(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; WhopScout/1.0)" },
      signal: AbortSignal.timeout(6_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return { html, text: stripTags(html).slice(0, 4000) };
  } catch {
    return null;
  }
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
