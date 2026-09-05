import Image from "next/image";
import { Suspense } from "react";
import { Badge, Card, Heading, Separator, Text } from "frosted-ui";
import QRCode from "qrcode";
import { SectionLabel } from "@/components/SectionLabel";
import { BackButton } from "@/components/BackButton";
import { BuildingPitch } from "@/components/BuildingPitch";
import { QrClose } from "@/components/QrClose";
import { enrollAsPartner } from "@/lib/clients/whop";
import { getAccessToken } from "@/lib/session";
import { SignInPrompt } from "@/components/SignInPrompt";
import { buildBrief } from "@/lib/pitch";
import type { Stack } from "@/lib/schemas";

export default async function PitchPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = await params;
  return (
    // main is a fixed-height column, so this page owns its own scroll.
    <div className="scrollbar-none flex h-full flex-col overflow-y-auto overscroll-contain py-6">
      <Suspense fallback={<BuildingPitch />}>
        <Brief placeId={placeId} />
      </Suspense>
    </div>
  );
}

async function Brief({ placeId }: { placeId: string }) {
  const accessToken = await getAccessToken();

  // The brief is worth showing even to a signed-out user; only the close needs
  // an identity, so the sign-in ask sits where the QR would be.
  const [brief, partner] = await Promise.all([
    buildBrief(placeId),
    accessToken ? enrollAsPartner(accessToken) : null,
  ]);
  const { place, context, pitch } = brief;
  const qrDataUrl = partner
    ? await QRCode.toDataURL(partner.referral_link, {
        width: 480,
        margin: 1,
        errorCorrectionLevel: "M",
      })
    : null;

  return (
    <div className="flex w-full flex-col gap-4">
      <BackButton href="/" />
      <Card size="3" variant="surface" className="w-full">
        <div className="flex items-center gap-3.5">
          {place.photoUrl ? (
            <Image
              src={place.photoUrl}
              alt=""
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-6 object-cover"
              unoptimized
              priority
            />
          ) : null}
          <div className="min-w-0">
            <Heading as="h2" size="5" weight="bold" className="truncate">
              {place.name}
            </Heading>
            <Text as="div" size="2" color="gray" className="mt-0.5 truncate">
              {[place.category, place.rating && `${place.rating}★`]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </div>
        </div>

        <Separator size="4" className="my-4" />

        <SectionLabel>They&apos;re using</SectionLabel>
        <StackChips stack={context.stack} />


        <Separator size="4" className="my-4" />

        <SectionLabel>What to say</SectionLabel>
        {/* Three at most. Anyone reading this is standing in front of someone
            and gets one glance per line. */}
        <ol className="mt-3 flex flex-col gap-5">
          {pitch.bullets.slice(0, 3).map((bullet, index) => (
            <li key={index} className="flex flex-col items-start gap-2">
              <Text as="div" size="5">
                {bullet.say}
              </Text>
              <Badge size="1" variant="soft" color="blue">
                {bullet.proof}
              </Badge>
            </li>
          ))}
        </ol>

        <Separator size="4" className="my-4" />

        <SectionLabel>If they push back</SectionLabel>
        <Text as="div" size="2" color="gray" className="mt-2">
          &ldquo;{pitch.objection.likely}&rdquo;
        </Text>
        <Text as="div" size="4" className="mt-2">
          {pitch.objection.answer}
        </Text>
      </Card>

      {partner && qrDataUrl ? (
        <QrClose qrDataUrl={qrDataUrl} referralLink={partner.referral_link} />
      ) : (
        <SignInPrompt next={`/pitch/${placeId}`} />
      )}
    </div>
  );
}

function StackChips({ stack }: { stack: Stack }) {
  const all = Object.values(stack).flat();
  if (all.length === 0) {
    return (
      <Text as="div" size="2" color="gray" className="mt-2">
        Nothing detected — pitch from the category.
      </Text>
    );
  }
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {all.map((tool) => (
        <Badge key={tool} size="2" variant="soft" color="gray">
          {tool}
        </Badge>
      ))}
    </div>
  );
}
