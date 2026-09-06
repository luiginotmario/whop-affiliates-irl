import { nearbyRivals } from "@/lib/clients/places";
import { ProspectSchema, type Place, type Prospect } from "@/lib/schemas";

/** A chain has the same name several times over a wide area. The person behind
 *  the counter at one cannot sign anything. */
const CHAIN_RADIUS_METRES = 5000;
const CHAIN_THRESHOLD = 2;

export async function assessProspect(place: Place): Promise<Prospect> {
  const reasons: string[] = [];
  const reviews = place.userRatingCount ?? 0;

  let sameName = 0;
  if (place.lat !== null && place.lng !== null && place.primaryType) {
    try {
      const wide = await nearbyRivals(
        place.lat,
        place.lng,
        place.primaryType,
        CHAIN_RADIUS_METRES,
      );
      sameName = wide.filter(
        (r) =>
          r.id !== place.id &&
          r.name.trim().toLowerCase() === place.name.trim().toLowerCase(),
      ).length;
    } catch {
      sameName = 0;
    }
  }

  const isChain = sameName >= CHAIN_THRESHOLD;
  const isOffline = !place.website;

  if (isChain) {
    reasons.push(
      `${sameName + 1} locations share this name nearby — likely a chain, so the decision is not made in the shop.`,
    );
  } else {
    reasons.push("Looks independent — the owner is probably on site.");
  }

  if (isOffline) {
    reasons.push(
      "No website at all. No online checkout, no payment processor to migrate, no booking tool. The entire Whop stack is net-new to them.",
    );
  }

  // Reviews stand in for footfall. Deliberately a tier, never a currency
  // amount — we do not know their revenue and will not pretend to.
  const tier =
    reviews >= 400 && !isChain
      ? "high"
      : reviews >= 100 || (!isChain && reviews >= 50)
        ? "medium"
        : "low";

  reasons.push(
    `${reviews} reviews${place.priceLevel ? `, price level ${place.priceLevel}` : ""} — used only as a rough footfall signal.`,
  );

  return ProspectSchema.parse({ isChain, isOffline, tier, reasons });
}

/** Pin-level assessment with no extra API calls: chain-ness is inferred from
 *  duplicate names inside the same result set. Cheap enough for 20 markers. */
export function quickAssess(place: Place, neighbours: Place[]): Prospect {
  const reviews = place.userRatingCount ?? 0;
  const sameName = neighbours.filter(
    (r) =>
      r.id !== place.id &&
      r.name.trim().toLowerCase() === place.name.trim().toLowerCase(),
  ).length;

  const isChain = sameName >= 1;
  const isOffline = !place.website;
  const tier =
    reviews >= 400 && !isChain
      ? "high"
      : reviews >= 100 || (!isChain && reviews >= 50)
        ? "medium"
        : "low";

  return ProspectSchema.parse({
    isChain,
    isOffline,
    tier,
    reasons: isOffline ? ["No website — whole stack is net-new."] : [],
  });
}

export function describeProspect(p: Prospect): string {
  return [
    `Chain: ${p.isChain ? "yes — deprioritise, staff cannot decide" : "no, independent"}`,
    `Has a website: ${p.isOffline ? "NO" : "yes"}`,
    `Opportunity tier: ${p.tier}`,
    ...p.reasons.map((r) => `- ${r}`),
  ].join("\n");
}
