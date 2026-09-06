import { Badge, Card, Heading, Separator, Spinner, Text } from "frosted-ui";
import Image from "next/image";
import { SectionLabel } from "@/components/SectionLabel";
import type { BusinessContext, Pitch, Place, Prospect, Stack } from "@/lib/schemas";

export type Brief = { place: Place; context: BusinessContext; pitch: Pitch };

/** `pitch.bullets` may be partial while streaming; everything rendered from it
 *  is already complete, so no placeholder states are needed. */
export function PitchCard({
  place,
  context,
  pitch,
  streaming = false,
}: Brief & { streaming?: boolean }) {
  return (
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

      {context.prospect.isChain ? (
        <>
          <Badge size="2" variant="soft" color="amber">
            Likely a chain — staff can&apos;t sign
          </Badge>
          <Separator size="4" className="my-4" />
        </>
      ) : null}

      <SectionLabel>They&apos;re using</SectionLabel>
      <StackChips stack={context.stack} prospect={context.prospect} />

      <Separator size="4" className="my-4" />

      <SectionLabel>What to say</SectionLabel>
      <ol className="mt-3 flex flex-col gap-5">
        {pitch.bullets.slice(0, 3).map((bullet, index) => (
          <li key={index} className="flex flex-col items-start gap-2">
            <Text as="div" size="5">
              {bullet.say}
            </Text>
            <Badge size="1" variant="soft" color="blue">
              {bullet.product}
            </Badge>
            <Text as="div" size="2" color="gray">
              {bullet.how}
            </Text>
          </li>
        ))}
      </ol>

      <Separator size="4" className="my-4" />

      {pitch.objection.likely ? (
        <>
      <SectionLabel>If they push back</SectionLabel>
      <Text as="div" size="2" color="gray" className="mt-2">
        &ldquo;{pitch.objection.likely}&rdquo;
      </Text>
      <Text as="div" size="4" className="mt-2">
        {pitch.objection.answer}
      </Text>
        </>
      ) : null}

      {streaming ? (
        <div className="mt-4 flex items-center gap-2">
          <Spinner size="1" />
          <Text size="1" color="gray">
            Still writing
          </Text>
        </div>
      ) : null}
    </Card>
  );
}

function StackChips({ stack, prospect }: { stack: Stack; prospect: Prospect }) {
  const all = Object.values(stack).flat();
  if (all.length === 0) {
    return (
      <div className="mt-2 flex flex-col items-start gap-2">
        <Badge size="2" variant="soft" color="green">
          {prospect.isOffline
            ? "No website — whole stack is net-new"
            : "Nothing detected"}
        </Badge>
        <Text as="div" size="2" color="gray">
          {prospect.isOffline
            ? "No online checkout, no processor to migrate, no contract to break."
            : "Their site gave nothing away. Pitch from the category."}
        </Text>
      </div>
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
