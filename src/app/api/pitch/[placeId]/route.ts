import { NextResponse } from "next/server";
import { buildBrief } from "@/lib/pitch";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ placeId: string }> },
) {
  const { placeId } = await params;
  try {
    const { place, context, pitch } = await buildBrief(placeId);
    return NextResponse.json({ place, context, pitch });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Couldn't build the pitch",
      },
      { status: 500 },
    );
  }
}
