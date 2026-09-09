import { z } from "zod";

/** A business as we know it before enrichment — straight from Places. */
export const PlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  category: z.string().nullable(),
  /** Machine type (e.g. "coffee_shop"), used to find true like-for-like rivals. */
  primaryType: z.string().nullable(),
  website: z.string().nullable(),
  rating: z.number().nullable(),
  userRatingCount: z.number().nullable(),
  priceLevel: z.string().nullable(),
  photoUrl: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
});
export type Place = z.infer<typeof PlaceSchema>;

/** What we detected them running, from their own site's HTML. */
export const StackSchema = z.object({
  payments: z.array(z.string()),
  commerce: z.array(z.string()),
  booking: z.array(z.string()),
  marketing: z.array(z.string()),
});
export type Stack = z.infer<typeof StackSchema>;

/** Where this business actually stands against the shops on its own street.
 *  Every field is computed from Places results, never estimated. */
export const MarketPositionSchema = z.object({
  rivals: z.number(),
  radiusMetres: z.number(),
  betterReviewed: z.number(),
  betterRated: z.number(),
  topRival: z
    .object({ name: z.string(), userRatingCount: z.number().nullable() })
    .nullable(),
  rivalsWithWebsite: z.number(),
});

/** How a business shows up on the map, and whether it is worth walking into. */
export const ProspectSchema = z.object({
  /** Same name repeated nearby — head office decides, not the person behind
   *  the counter. Deprioritise. */
  isChain: z.boolean(),
  /** No site at all: nothing to migrate and the whole stack is net-new. */
  isOffline: z.boolean(),
  /** Footfall proxy from reviews and price level. Never a currency amount. */
  tier: z.enum(["high", "medium", "low"]),
  reasons: z.array(z.string()),
});
export type Prospect = z.infer<typeof ProspectSchema>;
export type MarketPosition = z.infer<typeof MarketPositionSchema>;

/** The whole context bundle we hand to the model. */
export const BusinessContextSchema = z.object({
  place: PlaceSchema,
  stack: StackSchema,
  siteSummary: z.string().nullable(),
  market: MarketPositionSchema.nullable(),
  /** Live web research on each detected tool, so the pitch argues against what
   *  the incumbent actually is rather than what the model remembers. */
  incumbents: z.array(z.string()),
  prospect: ProspectSchema,
});
export type BusinessContext = z.infer<typeof BusinessContextSchema>;

/** Exactly what the model must return. Kept small on purpose — this gets
 *  read off a phone screen while walking into a shop. */
export const PitchSchema = z.object({
  // Deliberately unbounded. A hard max fails the whole request at parse time
  // when the model returns one extra line; trimming is the caller's problem.
  bullets: z.array(
    z.object({
      say: z
        .string()
        .describe("What you say out loud. Max 12 words. One breath."),
      product: z
        .string()
        .describe(
          "The Whop product this line maps to, named exactly as in the " +
            'knowledge base\'s product table. e.g. "Whop Payouts", ' +
            '"Whop Tap to Pay", "Whop Ads". Never invent a name.',
        ),
      how: z
        .string()
        .describe(
          "How that product actually works for THIS business and what it gets " +
            "them. Max 25 words. Must contain a mechanism (what happens) and " +
            "an outcome (what they gain). Never a vague benefit.",
        ),
    }),
  ),
});
export type Pitch = z.infer<typeof PitchSchema>;
