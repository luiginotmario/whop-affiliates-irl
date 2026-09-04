import { NextResponse } from "next/server";
import { nearbyPlaces, searchPlaces } from "@/lib/clients/places";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q");
  const lat = params.get("lat");
  const lng = params.get("lng");

  try {
    if (lat && lng) {
      return NextResponse.json({
        places: await nearbyPlaces(Number(lat), Number(lng)),
      });
    }
    if (query && query.trim().length > 1) {
      return NextResponse.json({ places: await searchPlaces(query.trim()) });
    }
    return NextResponse.json({ places: [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 },
    );
  }
}
