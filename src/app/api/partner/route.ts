import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { enrollAsPartner } from "@/lib/clients/whop";
import { getOptionalUser } from "@/lib/session";

/** The close: per-user, identical for every business, so it is fetched once
 *  and reused. Returns a signed-out or unauthorised state rather than failing,
 *  because the pitch is still worth showing without it. */
export async function GET() {
  const session = await getOptionalUser();
  if (!session) return NextResponse.json({ state: "signed_out" });

  try {
    const partner = await enrollAsPartner(session.token);
    const qrDataUrl = await QRCode.toDataURL(partner.referral_link, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    return NextResponse.json({
      state: "ready",
      referralLink: partner.referral_link,
      qrDataUrl,
      username: session.username,
    });
  } catch (error) {
    console.error("[scout] partner enrol failed:", error);
    return NextResponse.json({ state: "no_permission" });
  }
}
