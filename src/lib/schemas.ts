import { z } from "zod";

/** A business as we know it before enrichment — straight from Places. */
export const PlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  category: z.string().nullable(),
  website: z.string().nullable(),
  rating: z.number().nullable(),
  userRatingCount: z.number().nullable(),
  priceLevel: z.string().nullable(),
  photoUrl: z.string().nullable(),
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

/** The whole context bundle we hand to the model. */
export const BusinessContextSchema = z.object({
  place: PlaceSchema,
  stack: StackSchema,
  siteSummary: z.string().nullable(),
});
export type BusinessContext = z.infer<typeof BusinessContextSchema>;

/** Exactly what the model must return. Kept small on purpose — this gets
 *  read off a phone screen while walking into a shop. */
export const PitchSchema = z.object({
  observation: z
    .string()
    .describe("One line naming what they currently run. Said out loud first."),
  // Deliberately unbounded. A hard max here fails the whole request at parse
  // time when the model returns one extra line; trimming for display is the
  // caller's problem, not the schema's.
  bullets: z.array(
    z.object({
      say: z.string().describe("One sentence, spoken, under 20 words."),
      because: z.string().describe("The Whop fact behind it. Not spoken aloud."),
    }),
  ),
  objection: z.object({
    likely: z.string().describe("The objection this business will raise."),
    answer: z.string().describe("One-sentence reply."),
  }),
});
export type Pitch = z.infer<typeof PitchSchema>;
