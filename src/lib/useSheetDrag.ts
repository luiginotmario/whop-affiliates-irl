"use client";

import { useCallback, useRef, useState } from "react";

/** A flick decides regardless of distance. 0.11 px/ms is the standard cutoff. */
const FLICK_VELOCITY = 0.11;
/** Over-drag past either end moves less the further it goes. */
const OVERDRAG_DAMPING = 0.35;
/** Past this much of its own height, a slow drag still counts as collapse. */
const COLLAPSE_FRACTION = 0.4;

/** The height the panel would take if left to its content.
 *
 *  `scrollHeight` is useless here: the panel is `overflow: hidden` around a
 *  flex child that scrolls itself, so the child shrinks to fit and the panel
 *  never overflows — `scrollHeight` just returns the current height. Measure
 *  by letting it size naturally for one frame instead, with the transition
 *  suppressed so the probe is never visible.
 */
function naturalHeight(panel: HTMLElement): number {
  const previous = panel.style.height;
  panel.style.transition = "none";
  panel.style.height = "auto";
  const measured = panel.offsetHeight;
  panel.style.height = previous;
  void panel.offsetHeight; // force reflow so the restore is committed
  panel.style.transition = "";
  return measured;
}

/** Drag-to-collapse for the sheet, on both pointer and touch.
 *
 *  The sheet has no fabricated detents. At rest it is `height: auto` — as tall
 *  as its content and no taller, which is why a two-line preview and a full
 *  pitch both look right with no special casing. Dragging only ever subtracts
 *  from that; releasing near the top restores `auto`.
 */
export function useSheetDrag(
  panelRef: React.RefObject<HTMLElement | null>,
  headerRef: React.RefObject<HTMLElement | null>,
) {
  const [collapsed, setCollapsed] = useState(false);
  // Gesture state in refs: a pointer handler that closes over React state
  // reads whatever was current when it was created.
  const dragging = useRef(false);
  const collapsedRef = useRef(false);
  const start = useRef({ y: 0, time: 0, height: 0, natural: 0 });

  const peekHeight = useCallback(
    () => (headerRef.current?.offsetHeight ?? 24) + 72,
    [headerRef],
  );

  /** Animate to a pixel height, then hand sizing back to the content. */
  const settle = useCallback(
    (toCollapsed: boolean) => {
      const panel = panelRef.current;
      if (!panel) return;
      dragging.current = false;
      collapsedRef.current = toCollapsed;
      panel.dataset.dragging = "false";

      if (toCollapsed) {
        panel.style.height = `${peekHeight()}px`;
      } else {
        // `auto` cannot be transitioned, so animate to the measured height and
        // release to `auto` once it lands.
        // One measurement per settle is cheap; it was measuring per move
        // event that stalled the renderer.
        const target = naturalHeight(panel);
        panel.style.height = `${target}px`;
        const done = (event: TransitionEvent) => {
          if (event.propertyName !== "height") return;
          if (!collapsedRef.current) panel.style.height = "auto";
          panel.removeEventListener("transitionend", done);
        };
        panel.addEventListener("transitionend", done);
      }
      setCollapsed(toCollapsed);
    },
    [panelRef, peekHeight],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      const panel = panelRef.current;
      if (!panel || dragging.current) return; // multi-pointer guard

      const target = event.target as HTMLElement;
      // Never hijack a control or a text selection.
      if (target.closest("button, a, input, textarea, select, [role='button']")) {
        return;
      }
      // A sheet drags from anywhere, but the body scrolls too. Only take the
      // gesture when that scroll is already at the top — otherwise the user is
      // scrolling content, not moving the sheet.
      const scroller = target.closest<HTMLElement>("[data-sheet-scroll]");
      if (scroller && scroller.scrollTop > 0) return;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* capture is an enhancement, not a requirement */
      }
      panel.dataset.dragging = "true";
      start.current = {
        y: event.clientY,
        time: Date.now(),
        height: panel.offsetHeight,
        // Measured once per gesture. naturalHeight forces a synchronous
        // reflow, so calling it per move event thrashes layout every frame.
        natural: naturalHeight(panel),
      };
      dragging.current = true;
    },
    [panelRef],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const panel = panelRef.current;
      if (!panel || !dragging.current) return;

      // Dragging down shrinks the sheet; the bottom edge never moves.
      let next = start.current.height - (event.clientY - start.current.y);
      const min = peekHeight();
      const max = start.current.natural;

      // Friction rather than a wall at both ends.
      if (next < min) next = min - (min - next) * OVERDRAG_DAMPING;
      if (next > max) next = max + (next - max) * OVERDRAG_DAMPING;

      panel.style.height = `${next}px`;
    },
    [panelRef, peekHeight],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      const panel = panelRef.current;
      if (!panel || !dragging.current) return;

      const travelled = start.current.y - event.clientY;
      const elapsed = Math.max(Date.now() - start.current.time, 1);
      const velocity = Math.abs(travelled) / elapsed;

      if (velocity > FLICK_VELOCITY) {
        settle(travelled < 0); // flicked down = collapse
        return;
      }
      settle(panel.offsetHeight < start.current.height * COLLAPSE_FRACTION);
    },
    [panelRef, settle],
  );

  return {
    collapsed,
    toggle: () => settle(!collapsedRef.current),
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}
