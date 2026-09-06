import { NextResponse } from "next/server";
import { nearbyPlaces, searchPlaces } from "@/lib/clients/places";
import { quickAssess } from "@/lib/prospect";
import type { Place, Prospect } from "@/lib/schemas";

export type Pin = Place & { prospect: Prospect };

/** Pins for the map. One Places call; chain-ness is inferred from the result
 *  set itself so twenty markers do not cost twenty lookups. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q");
  const lat = params.get("lat");
  const lng = params.get("lng");

  try {
    const places: Place[] =
      lat && lng
        ? await nearbyPlaces(Number(lat), Number(lng))
        : query && query.trim().length > 1
          ? await searchPlaces(query.trim())
          : [];

    const pins: Pin[] = places
      .filter((p) => p.lat !== null && p.lng !== null)
      .map((p) => ({ ...p, prospect: quickAssess(p, places) }));

    return NextResponse.json({ pins });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 },
    );
  }
}
