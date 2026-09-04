import { getPlace } from "@/lib/clients/places";
import { fetchSite } from "@/lib/clients/firecrawl";
import { generatePitch } from "@/lib/clients/openrouter";
import { detectStack } from "@/lib/detect/stack";
import { StackSchema, type BusinessContext, type Pitch, type Place } from "@/lib/schemas";

export type Brief = { place: Place; context: BusinessContext; pitch: Pitch };

/** Place lookup and site scrape run together — the scrape is the slow leg and
 *  it does not need the place record, only the URL, which we may already have. */
export async function buildBrief(placeId: string): Promise<Brief> {
  const place = await getPlace(placeId);

  const site = place.website ? await fetchSite(place.website) : null;
  const stack = site ? detectStack(site.html) : StackSchema.parse({
    payments: [],
    commerce: [],
    booking: [],
    marketing: [],
  });

  const context: BusinessContext = {
    place,
    stack,
    siteSummary: site?.text ?? null,
  };

  return { place, context, pitch: await generatePitch(context) };
}
