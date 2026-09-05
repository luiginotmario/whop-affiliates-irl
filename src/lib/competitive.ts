import { nearbyRivals } from "@/lib/clients/places";
import {
  MarketPositionSchema,
  type MarketPosition,
  type Place,
} from "@/lib/schemas";

const RADIUS_METRES = 500;

/** Where this business stands on its own street. Every number is counted from
 *  Places results — nothing here is estimated, projected, or modelled. */
export async function marketPosition(
  place: Place,
): Promise<MarketPosition | null> {
  if (place.lat === null || place.lng === null || !place.primaryType) {
    return null;
  }

  let rivals: Place[];
  try {
    rivals = await nearbyRivals(
      place.lat,
      place.lng,
      place.primaryType,
      RADIUS_METRES,
    );
  } catch {
    // A missing comparison is better than a failed pitch.
    return null;
  }

  const others = rivals.filter((r) => r.id !== place.id);
  if (others.length === 0) return null;

  const reviews = place.userRatingCount ?? 0;
  const rating = place.rating ?? 0;

  const byReviews = [...others].sort(
    (a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0),
  );
  const top = byReviews[0] ?? null;

  return MarketPositionSchema.parse({
    rivals: others.length,
    radiusMetres: RADIUS_METRES,
    betterReviewed: others.filter((r) => (r.userRatingCount ?? 0) > reviews)
      .length,
    betterRated: others.filter((r) => (r.rating ?? 0) > rating).length,
    topRival: top ? { name: top.name, userRatingCount: top.userRatingCount } : null,
    rivalsWithWebsite: others.filter((r) => r.website).length,
  });
}

/** Plain-English lines for the prompt. Only facts we counted. */
export function describeMarket(m: MarketPosition, place: Place): string[] {
  const lines = [
    `${m.rivals} other ${place.category ?? "businesses"} within ${m.radiusMetres}m.`,
    `${m.betterReviewed} of them have more reviews than this one (${place.userRatingCount ?? 0}).`,
    `${m.betterRated} of them are rated higher (${place.rating ?? "n/a"}).`,
    `${m.rivalsWithWebsite} of ${m.rivals} have a website; this one ${place.website ? "does" : "does not"}.`,
  ];
  if (m.topRival) {
    lines.push(
      `Busiest nearby rival: ${m.topRival.name} with ${m.topRival.userRatingCount ?? "?"} reviews.`,
    );
  }
  return lines;
}
