import { env } from "@/lib/env";
import { type Place, PlaceSchema } from "@/lib/schemas";

const BASE = "https://places.googleapis.com/v1";

const FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "primaryType",
  "primaryTypeDisplayName",
  "websiteUri",
  "rating",
  "userRatingCount",
  "priceLevel",
  "photos",
  "location",
].join(",");

type RawPlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string };
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  photos?: { name: string }[];
  location?: { latitude?: number; longitude?: number };
};

function toPlace(raw: RawPlace): Place {
  const photo = raw.photos?.[0]?.name;
  return PlaceSchema.parse({
    id: raw.id,
    name: raw.displayName?.text ?? "Unknown",
    address: raw.formattedAddress ?? null,
    category: raw.primaryTypeDisplayName?.text ?? null,
    primaryType: raw.primaryType ?? null,
    website: raw.websiteUri ?? null,
    rating: raw.rating ?? null,
    userRatingCount: raw.userRatingCount ?? null,
    priceLevel: raw.priceLevel ?? null,
    lat: raw.location?.latitude ?? null,
    lng: raw.location?.longitude ?? null,
    photoUrl: photo
      ? `${BASE}/${photo}/media?maxHeightPx=400&key=${env.googlePlaces()}`
      : null,
  });
}

/** Free-text search: a name, or a name plus a street. */
export async function searchPlaces(query: string): Promise<Place[]> {
  const res = await fetch(`${BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googlePlaces(),
      "X-Goog-FieldMask": FIELDS.split(",")
        .map((f) => `places.${f}`)
        .join(","),
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 8 }),
  });
  if (!res.ok) throw new Error(`Places search failed: ${res.status}`);
  const json = (await res.json()) as { places?: RawPlace[] };
  return (json.places ?? []).map(toPlace);
}

/** "What's around me" — the no-typing path. */
export async function nearbyPlaces(
  lat: number,
  lng: number,
): Promise<Place[]> {
  const res = await fetch(`${BASE}/places:searchNearby`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googlePlaces(),
      "X-Goog-FieldMask": FIELDS.split(",")
        .map((f) => `places.${f}`)
        .join(","),
    },
    body: JSON.stringify({
      maxResultCount: 10,
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: 200 },
      },
    }),
  });
  if (!res.ok) throw new Error(`Places nearby failed: ${res.status}`);
  const json = (await res.json()) as { places?: RawPlace[] };
  return (json.places ?? []).map(toPlace);
}

export async function getPlace(placeId: string): Promise<Place> {
  const res = await fetch(`${BASE}/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": env.googlePlaces(),
      "X-Goog-FieldMask": FIELDS,
    },
  });
  if (!res.ok) throw new Error(`Places detail failed: ${res.status}`);
  return toPlace((await res.json()) as RawPlace);
}

/** Like-for-like rivals around a place: same primary type, tight radius.
 *  One call — this sits on the critical path while someone stands outside. */
export async function nearbyRivals(
  lat: number,
  lng: number,
  primaryType: string,
  radius = 500,
): Promise<Place[]> {
  const res = await fetch(`${BASE}/places:searchNearby`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googlePlaces(),
      "X-Goog-FieldMask": FIELDS.split(",")
        .map((f) => `places.${f}`)
        .join(","),
    },
    body: JSON.stringify({
      includedPrimaryTypes: [primaryType],
      maxResultCount: 20,
      rankPreference: "POPULARITY",
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius },
      },
    }),
  });
  if (!res.ok) throw new Error(`Places rivals failed: ${res.status}`);
  const json = (await res.json()) as { places?: RawPlace[] };
  return (json.places ?? []).map(toPlace);
}
