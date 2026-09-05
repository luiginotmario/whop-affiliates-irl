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
export type MarketPosition = z.infer<typeof MarketPositionSchema>;

/** The whole context bundle we hand to the model. */
export const BusinessContextSchema = z.object({
  place: PlaceSchema,
  stack: StackSchema,
  siteSummary: z.string().nullable(),
  market: MarketPositionSchema.nullable(),
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
      proof: z
        .string()
        .describe(
          "The Whop capability, as a 2-4 word label. Not a sentence. " +
            'e.g. "195 countries", "Recurring billing", "Instant payouts".',
        ),
    }),
  ),
  objection: z.object({
    likely: z.string().describe("The objection, max 10 words."),
    answer: z.string().describe("Your reply, max 20 words. Spoken."),
  }),
});
export type Pitch = z.infer<typeof PitchSchema>;
