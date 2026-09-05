import { unstable_cache } from "next/cache";
import { getPlace } from "@/lib/clients/places";
import { fetchSite } from "@/lib/clients/firecrawl";
import { generatePitch } from "@/lib/clients/openrouter";
import { detectStack } from "@/lib/detect/stack";
import { marketPosition } from "@/lib/competitive";
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
  const [site, market] = await Promise.all([
    place.website ? fetchSite(place.website) : Promise.resolve(null),
    marketPosition(place),
  ]);

  const context: BusinessContext = {
    place,
    stack: site ? detectStack(site.html) : EMPTY_STACK,
    siteSummary: site?.text ?? null,
    market,
  };

  return { place, context, pitch: await generatePitch(context) };
}

/** Briefs are expensive (a scrape, a rivals lookup, and ~15s of model time) and
 *  stable for a given business, so they are cached by place id. This also keeps
 *  the pitch identical when someone signs in and comes back mid-conversation —
 *  regenerating it would hand them different words to say. */
export const buildBrief = unstable_cache(generateBrief, ["brief"], {
  revalidate: 60 * 60 * 24,
  tags: ["brief"],
});
