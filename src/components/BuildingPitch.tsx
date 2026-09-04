"use client";

import { useEffect, useState } from "react";
import { Badge, Card, Spinner, Text } from "frosted-ui";

/** The three real legs of buildBrief, in order. */
const STEPS = [
  { key: "lookup", label: "Looking them up", after: 900 },
  { key: "site", label: "Reading their site", after: 2600 },
  { key: "pitch", label: "Writing your pitch", after: Infinity },
] as const;

export function BuildingPitch() {
  const [index, setIndex] = useState(0);

  // Advances on the measured duration of each leg rather than real events —
  // the brief is one server render, so there is no progress channel to read.
  useEffect(() => {
    const step = STEPS[index];
    if (!step || step.after === Infinity) return;
    const timer = setTimeout(() => setIndex((i) => i + 1), step.after);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <Card size="4" className="w-full">
      <div className="flex flex-col gap-4 py-2">
        {STEPS.map((step, i) => {
          const active = i === index;
          const complete = i < index;

          return (
            <div key={step.key} className="flex items-center gap-3">
              {active ? (
                <Spinner size="2" />
              ) : (
                <Badge
                  size="1"
                  color={complete ? "green" : "gray"}
                  variant={complete ? "solid" : "soft"}
                >
                  {complete ? "✓" : "•"}
                </Badge>
              )}
              <div className="flex items-baseline gap-2">
                <Text
                  size="3"
                  color={active ? undefined : "gray"}
                  weight={active ? "medium" : "regular"}
                >
                  {step.label}
                </Text>
                {step.key === "pitch" ? (
                  <Text size="1" color="gray">
                    Usually a few seconds
                  </Text>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
