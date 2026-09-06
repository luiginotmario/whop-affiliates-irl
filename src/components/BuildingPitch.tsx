"use client";

import { Badge, Card, Spinner, Text } from "frosted-ui";

/** The legs of buildBrief, in order. */
const STEPS = [
  { key: "lookup", label: "Looking them up" },
  { key: "site", label: "Reading their site" },
  { key: "pitch", label: "Writing your pitch", note: "Usually a few seconds" },
] as const;

export type Stage = (typeof STEPS)[number]["key"];

/** Driven by real stream events rather than timers: the context event marks
 *  the lookup and scrape done, so the ticks mean something. */
export function BuildingPitch({ stage }: { stage: Stage }) {
  const index = STEPS.findIndex((s) => s.key === stage);

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
                {"note" in step && step.note ? (
                  <Text size="1" color="gray">
                    {step.note}
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
