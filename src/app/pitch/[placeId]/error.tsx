"use client";

import Link from "next/link";
import { Button, Card, Heading, Text } from "frosted-ui";

export default function PitchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card size="3" variant="surface" className="w-full">
      <Heading as="h2" size="4" weight="bold">
        Couldn&apos;t build the pitch
      </Heading>
      <Text as="p" size="2" color="gray" className="mt-1.5">
        {error.message || "Something failed upstream."}
      </Text>
      <div className="mt-5 flex gap-2">
        <Button size="2" variant="solid" color="blue" onClick={reset}>
          Try again
        </Button>
        <Link href="/">
          <Button size="2" variant="soft" color="gray">
            Start over
          </Button>
        </Link>
      </div>
    </Card>
  );
}
