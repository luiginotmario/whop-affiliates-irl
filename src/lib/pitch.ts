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

export async function buildBrief(placeId: string): Promise<Brief> {
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
