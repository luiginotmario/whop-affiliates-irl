"use client";

import { LocateFixed } from "lucide-react";
import { IconButton, Spinner } from "frosted-ui";

/** Floating control, same idiom as a maps app: one tap to find yourself. */
export function LocateButton({
  onClick,
  busy,
}: {
  onClick: () => void;
  busy: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end p-3">
      {/* ghost, not solid: solid forces a white foreground for a dark fill, and
          the white panel background below leaves a white icon on white. */}
      <IconButton
        size="3"
        variant="ghost"
        color="gray"
        aria-label="Show my location"
        onClick={onClick}
        disabled={busy}
        className="pointer-events-auto rounded-full bg-panel-solid text-gray-12 shadow-lg transition-transform duration-150 active:scale-[0.95]"
      >
        {busy ? <Spinner size="2" /> : <LocateFixed size={18} />}
      </IconButton>
    </div>
  );
}
