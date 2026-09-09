import { unstable_cache } from "next/cache";
import { getPlace } from "@/lib/clients/places";
import { fetchSite } from "@/lib/clients/firecrawl";
import { generatePitch } from "@/lib/clients/openrouter";
import { detectStack } from "@/lib/detect/stack";
import { marketPosition } from "@/lib/competitive";
import { researchStack } from "@/lib/clients/research";
import { assessProspect } from "@/lib/prospect";
import {
  StackSchema,
  type BusinessContext,
  type Pitch,
  type Place,
} from "@/lib/schemas";

export type Brief = { place: Place; context: BusinessContext; pitch: Pitch };

const EMPTY_STACK = StackSchema.parse({
  payments: [],
  commerce: [],
  booking: [],
  marketing: [],
});

/** Bump when the context shape changes — a cached context built against an
 *  older shape renders blank fields rather than failing loudly. */
const CONTEXT_VERSION = "v5-context";

async function gatherContext(placeId: string): Promise<BusinessContext> {
  const place = await getPlace(placeId);

  // The site scrape, the rivals lookup and the prospect check are independent.
  const [site, market, prospect] = await Promise.all([
    place.website ? fetchSite(place.website) : Promise.resolve(null),
    marketPosition(place),
    assessProspect(place),
  ]);

  const stack = site ? detectStack(site.html) : EMPTY_STACK;

  // Research what they already run before arguing against it — otherwise the
  // pitch offers them features their current tool already has.
  const incumbents = await researchStack(Object.values(stack).flat());

  return {
    place,
    stack,
    siteSummary: site?.text ?? null,
    market,
    incumbents,
    prospect,
  };
}

/** Everything except the model call. Cached hard: it is the slow, expensive
 *  half (a scrape, a rivals lookup, a web search per tool) and it is stable
 *  for a given business. Kept separate from generation so the pitch can be
 *  streamed — a stream cannot be cached, but its inputs can. */
export const buildContext = unstable_cache(gatherContext, ["context", CONTEXT_VERSION], {
  revalidate: 60 * 60 * 24,
  tags: ["context"],
});

/** Bump when the Pitch schema or the prompt changes. */
const PITCH_VERSION = "v7-no-objection";

/** The generated pitch, cached by business. Without this the model re-runs on
 *  every view — 25s each time, and different words each time, which is worse
 *  than slow when someone is mid-conversation reading them aloud. */
export const buildPitch = unstable_cache(
  async (placeId: string) => generatePitch(await buildContext(placeId)),
  ["pitch", PITCH_VERSION],
  { revalidate: 60 * 60 * 24, tags: ["pitch"] },
);

export async function buildBrief(placeId: string): Promise<Brief> {
  const [context, pitch] = [await buildContext(placeId), await buildPitch(placeId)];
  return { place: context.place, context, pitch };
}
