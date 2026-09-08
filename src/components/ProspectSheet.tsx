"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Heading,
  Spinner,
  Switch,
  Text,
  TextField,
} from "frosted-ui";
import type { Pin } from "@/app/api/prospects/route";
import { PitchCard, type Brief } from "@/components/PitchCard";
import { BuildingPitch, type Stage } from "@/components/BuildingPitch";
import { QrClose } from "@/components/QrClose";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Autopilot } from "@/components/Autopilot";
import { useSheetDrag } from "@/lib/useSheetDrag";

type PartnerState =
  | { state: "signed_out" }
  | { state: "no_permission" }
  | { state: "ready"; referralLink: string; qrDataUrl: string };

function TierBadge({ pin }: { pin: Pin }) {
  if (pin.prospect.isChain) {
    return (
      <Badge size="1" variant="soft" color="amber">
        Chain — staff can&apos;t sign
      </Badge>
    );
  }
  if (pin.prospect.isOffline) {
    return (
      <Badge size="1" variant="soft" color="green">
        No website — stack is net-new
      </Badge>
    );
  }
  return (
    <Badge
      size="1"
      variant="soft"
      color={pin.prospect.tier === "high" ? "green" : "gray"}
    >
      {pin.prospect.tier} opportunity
    </Badge>
  );
}

export function ProspectSheet({
  pins,
  selected,
  query,
  busy,
  message,
  autoPitch,
  onQueryChange,
  onLocate,
  onSelect,
  onClear,
}: {
  pins: Pin[];
  selected: Pin | null;
  query: string;
  busy: boolean;
  message: string | null;
  autoPitch: boolean;
  onQueryChange: (value: string) => void;
  onLocate: () => void;
  onSelect: (pin: Pin) => void;
  onClear: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const drag = useSheetDrag(panelRef, headerRef);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [stage, setStage] = useState<Stage>("lookup");
  const [partner, setPartner] = useState<PartnerState | null>(null);
  // Off: hand them the QR and let them onboard themselves. On: build the
  // business server-side and email them an invite to claim it.
  const [autopilot, setAutopilot] = useState(false);

  // A new business invalidates whatever pitch is on screen.
  useEffect(() => {
    setBrief(null);
    setBriefError(null);
    setLoadingBrief(false);
  }, [selected?.id]);

  const requested = useRef<string | null>(null);

  useEffect(() => {
    if (!autoPitch || !selected || brief || loadingBrief) return;
    if (requested.current === selected.id) return;
    requested.current = selected.id;
    void getPitch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPitch, selected?.id]);

  const getPitch = useCallback(async () => {
    if (!selected) return;
    setLoadingBrief(true);
    setStage("lookup");
    setBriefError(null);
    setBrief(null);
    // The QR is per-user and identical everywhere, so it loads alongside the
    // pitch rather than after it.
    void fetch("/api/partner")
      .then((r) => r.json())
      .then(setPartner)
      .catch(() => setPartner({ state: "signed_out" }));

    let context: { place: Brief["place"]; context: Brief["context"] } | null =
      null;

    window.history.replaceState(
      null,
      "",
      `/?place=${encodeURIComponent(selected.id)}&pitch=1`,
    );

    try {
      const res = await fetch(`/api/pitch/${selected.id}`);
      if (!res.ok || !res.body) throw new Error("Couldn't build the pitch");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Newline delimited; the final line of a chunk may be incomplete.
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);

          if (event.type === "error") throw new Error(event.error);

          // The context event means the lookup and the scrape are done, so
          // the loader can tick them off for real rather than on a timer.
          if (event.type === "context") {
            context = { place: event.place, context: event.context };
            setStage("pitch");
          }

          // Bullets arrive individually but the card is only shown complete —
          // a loader, then a half-filled card, then another loader reads as
          // broken. One state change, one finished card.
          if (event.type === "done" && context) {
            setBrief({ ...context, pitch: event.pitch });
          }
        }
      }
    } catch (error) {
      setBriefError(
        error instanceof Error ? error.message : "Couldn't build the pitch",
      );
    } finally {
      setLoadingBrief(false);
    }
  }, [selected]);

  // Picking a business raises the sheet to show it; clearing drops it back to
  // the search bar. Scrolling the container IS the animation.


  return (
    // A scroll container, not a modal: the two stops above the panel are the
    // sheet's resting positions, and the map stays live behind them.
    <div className="sheet-shell">
      <div
        ref={panelRef}
        data-collapsed={drag.collapsed}
        className="sheet-panel max-w-xl rounded-t-6 bg-panel-solid shadow-lg"
      >
        {/* Grab area. touch-action:none so the browser does not steal the
            gesture for scrolling before the handler sees it. */}
        <div
          ref={headerRef}
          // A 4px pill is not a touch target. The grab area is padded out to
          // ~40px so a thumb can find it, with the pill drawn inside.
          className="flex shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-t-6 bg-panel-solid py-4 active:cursor-grabbing"
          role="button"
          tabIndex={0}
          aria-label={drag.collapsed ? "Expand panel" : "Collapse panel"}
          aria-expanded={!drag.collapsed}
          onDoubleClick={drag.toggle}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              drag.toggle();
            }
          }}
          {...drag.handlers}
        >
          <div className="h-1.5 w-10 rounded-full bg-gray-7" />
        </div>
        <div className="sheet-body">

        {selected ? (
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <Heading as="h2" size="6" weight="bold" className="min-w-0">
                {selected.name}
              </Heading>
              <Button size="1" variant="soft" color="gray" onClick={onClear}>
                Close
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <TierBadge pin={selected} />
              <Text size="1" color="gray">
                {[
                  selected.category,
                  selected.rating && `${selected.rating}★`,
                  selected.userRatingCount &&
                    `${selected.userRatingCount} reviews`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </div>

            {selected.address ? (
              <Text size="2" color="gray">
                {selected.address}
              </Text>
            ) : null}

            <Text size="1" color="gray">
              You earn 30% of Whop&apos;s profit from any business you sign, for
              as long as the referral lasts.
            </Text>

            {loadingBrief ? (
              <BuildingPitch stage={stage} />
            ) : brief ? (
              <div className="flex flex-col gap-3">
                <PitchCard {...brief} />
                {partner?.state === "ready" ? (
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center justify-between gap-3">
                      <span>
                        <Text as="div" size="2" weight="medium">
                          Autopilot
                        </Text>
                        <Text as="div" size="1" color="gray">
                          Build their Whop and email them to claim it
                        </Text>
                      </span>
                      <Switch
                        size="2"
                        checked={autopilot}
                        onCheckedChange={setAutopilot}
                      />
                    </label>

                    {autopilot ? (
                      <Autopilot
                        placeId={selected.id}
                        businessName={selected.name}
                      />
                    ) : (
                      <QrClose
                        qrDataUrl={partner.qrDataUrl}
                      />
                    )}
                  </div>
                ) : partner ? (
                  <SignInPrompt
                    next={`/?place=${encodeURIComponent(selected.id)}&pitch=1`}
                    signedIn={partner.state === "no_permission"}
                  />
                ) : null}
              </div>
            ) : (
              <>
                {briefError ? (
                  <Text as="div" size="2" color="danger">
                    {briefError}
                  </Text>
                ) : null}
                <Button
                  size="3"
                  variant="solid"
                  color="blue"
                  className="w-full transition-transform duration-150 active:scale-[0.98]"
                  onClick={getPitch}
                >
                  {briefError ? "Try again" : "Get the pitch"}
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-3">
            <div className="flex gap-2">
              <TextField.Root size="3" variant="surface" className="flex-1">
                <TextField.Input
                  placeholder="Search a business, or use your location"
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  autoComplete="off"
                  enterKeyHint="search"
                  inputMode="search"
                />
              </TextField.Root>
              <Button
                size="3"
                variant="soft"
                color="gray"
                onClick={onLocate}
                loading={busy}
              >
                Near me
              </Button>
            </div>

            {busy && pins.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <Spinner size="2" />
                <Text size="2" color="gray">
                  Looking around you
                </Text>
              </div>
            ) : null}

            {message ? (
              <Text size="2" color="gray" align="center" className="py-4">
                {message}
              </Text>
            ) : null}

            {pins.length > 0 ? (
              <ul
                // A results list is scrollable by nature, so it gets its own
                // ceiling. Without one the sheet grows to 20 rows and covers
                // the map it is supposed to sit over.
                className="scrollbar-none flex max-h-[38svh] flex-col gap-1 overflow-y-auto overscroll-contain"
              >
                {pins.map((pin) => (
                  <li key={pin.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(pin)}
                      className="w-full rounded-4 px-3 py-2 text-left transition-colors hover:bg-gray-3"
                    >
                      <Text as="div" size="3" weight="medium">
                        {pin.name}
                      </Text>
                      <div className="mt-1 flex items-center gap-2">
                        <TierBadge pin={pin} />
                        <Text size="1" color="gray" className="truncate">
                          {pin.category}
                        </Text>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
