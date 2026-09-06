"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProspectMap } from "@/components/ProspectMap";
import { ProspectSheet } from "@/components/ProspectSheet";
import { LocateButton } from "@/components/LocateButton";
import type { Pin } from "@/app/api/prospects/route";

export function Explore() {
  const router = useRouter();
  const params = useSearchParams();
  const placeParam = params.get("place");
  // Set once a pitch has been generated, so returning from Whop restores the
  // pitch itself rather than dropping you back on a "Get the pitch" button.
  const pitchParam = params.get("pitch") === "1";
  const [pins, setPins] = useState<Pin[]>([]);
  const [selected, setSelected] = useState<Pin | null>(null);
  const [centre, setCentre] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async (url: string) => {
    const id = ++requestId.current;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (id !== requestId.current) return;
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      setPins(json.pins);
      if (json.pins.length === 0) setMessage("Nothing found here.");
    } catch (error) {
      if (id !== requestId.current) return;
      setMessage(error instanceof Error ? error.message : "Search failed");
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  }, []);

  const locate = useCallback(
    ({ silent = false }: { silent?: boolean } = {}) => {
      const fail = (text: string) => {
        setLocating(false);
        if (!silent) setMessage(text);
      };

      if (!window.isSecureContext) {
        fail("Location needs HTTPS. Open the site over https, or on localhost.");
        return;
      }
      if (!navigator.geolocation) {
        fail("This device has no location API.");
        return;
      }

      setLocating(true);

      // A hard ceiling of our own. If neither callback ever fires — which some
      // mobile browsers do when Location Services is off at the OS level —
      // the button would stay disabled forever with no explanation.
      let settled = false;
      const giveUp = setTimeout(() => {
        if (settled) return;
        settled = true;
        fail(
          "The browser never answered the location request. On iOS check Settings > Privacy & Security > Location Services > Safari Websites.",
        );
      }, 12000);

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (settled) return;
          settled = true;
          clearTimeout(giveUp);
          setLocating(false);
          setMessage(null);
          const here = { lat: coords.latitude, lng: coords.longitude };
          setUserLocation(here);
          setCentre(here);
          void load(`/api/prospects?lat=${here.lat}&lng=${here.lng}`);
        },
        (error) => {
          if (settled) return;
          settled = true;
          clearTimeout(giveUp);
          // Report what the browser actually said. A friendly rewrite here is
          // what made this impossible to diagnose.
          const names: Record<number, string> = {
            1: "PERMISSION_DENIED",
            2: "POSITION_UNAVAILABLE",
            3: "TIMEOUT",
          };
          fail(
            `Location failed - ${names[error.code] ?? `code ${error.code}`}` +
              (error.message ? `: ${error.message}` : ""),
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    },
    [load],
  );

  // Deliberately NOT called on mount. Mobile Safari denies a geolocation
  // request that is not tied to a user gesture, and that denial sticks for the
  // rest of the page session — so an eager call on load means the button can
  // never prompt afterwards. It has to start from a tap.
  //
  // If the browser already holds a granted permission we can use it silently,
  // because that path does not prompt and cannot be denied for lack of a
  // gesture.
  useEffect(() => {
    if (!navigator.permissions?.query) return;
    void navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (status.state === "granted") locate({ silent: true });
      })
      .catch(() => {
        /* Safari may not expose the geolocation permission; wait for the tap */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Panning is a query: show the businesses wherever they just looked.
  const onMoveEnd = useCallback(
    (next: { lat: number; lng: number }) => {
      void load(`/api/prospects?lat=${next.lat}&lng=${next.lng}`);
    },
    [load],
  );

  useEffect(() => {
    if (query.trim().length < 2) return;
    const timer = setTimeout(
      () => void load(`/api/prospects?q=${encodeURIComponent(query)}`),
      250,
    );
    return () => clearTimeout(timer);
  }, [query, load]);

  // Selecting from either surface moves the map to it, and records it in the
  // URL. OAuth is a full page navigation, so React state cannot survive it —
  // the URL is the only thing that can.
  const select = useCallback(
    (pin: Pin) => {
      setSelected(pin);
      if (pin.lat !== null && pin.lng !== null) {
        setCentre({ lat: pin.lat, lng: pin.lng });
      }
      router.replace(`/?place=${encodeURIComponent(pin.id)}`, { scroll: false });
    },
    [router],
  );

  const clear = useCallback(() => {
    setSelected(null);
    router.replace("/", { scroll: false });
  }, [router]);

  // Restore whatever business the URL names — on first load, on back/forward,
  // and after signing in with Whop.
  useEffect(() => {
    if (!placeParam || selected?.id === placeParam) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch(
        `/api/prospects?q=${encodeURIComponent(placeParam)}`,
      );
      if (!res.ok || cancelled) return;
      const json = await res.json();
      const match = (json.pins as Pin[]).find((p) => p.id === placeParam);
      if (!match || cancelled) return;
      setSelected(match);
      setPins((current) =>
        current.some((p) => p.id === match.id) ? current : [match, ...current],
      );
      if (match.lat !== null && match.lng !== null) {
        setCentre({ lat: match.lat, lng: match.lng });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeParam]);

  const hasToken = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {hasToken ? (
        <>
          <ProspectMap
            pins={pins}
            centre={centre}
            userLocation={userLocation}
            selectedId={selected?.id ?? null}
            onSelect={select}
            onMoveEnd={onMoveEnd}
          />
          <LocateButton onClick={() => locate()} busy={locating} />
        </>
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gray-2 px-6 text-center">
          <p className="text-2 text-gray-11">
            Add NEXT_PUBLIC_MAPBOX_TOKEN to .env to show the map. Search still
            works below.
          </p>
        </div>
      )}

      <ProspectSheet
        pins={pins}
        selected={selected}
        query={query}
        busy={busy}
        message={message}
        onQueryChange={setQuery}
        onLocate={locate}
        onSelect={select}
        autoPitch={pitchParam}
        onClear={clear}
      />
    </div>
  );
}
