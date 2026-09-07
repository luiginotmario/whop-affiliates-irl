import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { buildAndTransfer } from "@/lib/autopilot";
import { getOptionalUser } from "@/lib/session";
import { env } from "@/lib/env";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await getOptionalUser();
  if (!session) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const { placeId, email, message } = (await request.json()) as {
    placeId?: string;
    email?: string;
    message?: string;
  };
  if (!placeId || !email) {
    return NextResponse.json(
      { error: "placeId and email are required" },
      { status: 400 },
    );
  }

  try {
    const result = await buildAndTransfer({
      token: env.whopPlatformKey(),
      partnerUsername: session.username,
      placeId,
      email,
      returnUrl: env.claimReturnUrl(),
    });
    // Rendered here so the owner can scan it off the salesperson's screen —
    // nothing to send, nothing to copy.
    const qrDataUrl = await QRCode.toDataURL(result.claimUrl, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    return NextResponse.json({ ...result, qrDataUrl });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Couldn't build the business",
      },
      { status: 500 },
    );
  }
}
