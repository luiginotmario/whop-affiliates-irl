import QRCode from "qrcode";
import { enrollAsPartner } from "@/lib/clients/whop";
import { getOptionalUser } from "@/lib/session";
import { QrClose } from "@/components/QrClose";
import { SignInPrompt } from "@/components/SignInPrompt";

/** The close is per-user, not per-business — the referral link is identical for
 *  every shop. It renders in its own boundary so it never waits on the pitch,
 *  and the pitch never waits on it. */
export async function Close({ next }: { next: string }) {
  const session = await getOptionalUser();
  if (!session) return <SignInPrompt next={next} signedIn={false} />;

  const partner = await enrollAsPartner(session.token).catch(
    (error: unknown) => {
      console.error("[scout] partner enrol failed:", error);
      return null;
    },
  );
  if (!partner) return <SignInPrompt next={next} signedIn />;

  const qrDataUrl = await QRCode.toDataURL(partner.referral_link, {
    width: 480,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  return (
    <QrClose qrDataUrl={qrDataUrl} referralLink={partner.referral_link} />
  );
}
