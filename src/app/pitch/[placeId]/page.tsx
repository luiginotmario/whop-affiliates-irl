import { Suspense } from "react";
import { BackButton } from "@/components/BackButton";
import { BuildingPitch } from "@/components/BuildingPitch";
import { PitchCard } from "@/components/PitchCard";
import { AccountBar } from "@/components/AccountBar";
import { Close } from "@/components/Close";
import { buildBrief } from "@/lib/pitch";

/** Deep link to a single pitch. The main surface is the map sheet; this exists
 *  so a pitch can be linked to or reloaded directly. */
export default async function PitchPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = await params;
  return (
    <div className="scrollbar-none pb-safe mx-auto flex h-full w-full max-w-xl flex-col gap-4 overflow-y-auto overscroll-contain px-6 pt-6">
      <Suspense fallback={<BuildingPitch />}>
        <Brief placeId={placeId} />
      </Suspense>
      <Suspense fallback={null}>
        <Close next={`/pitch/${placeId}`} />
      </Suspense>
    </div>
  );
}

async function Brief({ placeId }: { placeId: string }) {
  const brief = await buildBrief(placeId);
  return (
    <div className="flex w-full flex-col gap-4">
      <AccountBar />
      <BackButton href="/" />
      <PitchCard {...brief} />
    </div>
  );
}
