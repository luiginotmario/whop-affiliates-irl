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

async function generateBrief(placeId: string): Promise<Brief> {
  const place = await getPlace(placeId);

  // The site scrape and the rival lookup are independent, so they overlap.
  const [site, market, prospect] = await Promise.all([
    place.website ? fetchSite(place.website) : Promise.resolve(null),
    marketPosition(place),
    assessProspect(place),
  ]);

  const stack = site ? detectStack(site.html) : EMPTY_STACK;

  // Research what they already run before arguing against it — otherwise the
  // pitch offers them features their current tool already has.
  const incumbents = await researchStack(Object.values(stack).flat());

  const context: BusinessContext = {
    place,
    stack,
    siteSummary: site?.text ?? null,
    market,
    incumbents,
    prospect,
  };

  return { place, context, pitch: await generatePitch(context) };
}

/** Briefs are expensive (a scrape, a rivals lookup, and ~15s of model time) and
 *  stable for a given business, so they are cached by place id. This also keeps
 *  the pitch identical when someone signs in and comes back mid-conversation —
 *  regenerating it would hand them different words to say. */
/** Bump when the Pitch schema or prompt changes — a cached brief built against
 *  an older shape renders blank fields rather than failing loudly. */
const BRIEF_VERSION = "v4-prospect";

export const buildBrief = unstable_cache(generateBrief, ["brief", BRIEF_VERSION], {
  revalidate: 60 * 60 * 24,
  tags: ["brief"],
});
