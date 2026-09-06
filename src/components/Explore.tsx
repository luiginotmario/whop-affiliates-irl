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

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setMessage("This device has no location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        const here = { lat: coords.latitude, lng: coords.longitude };
        setUserLocation(here);
        setCentre(here);
        void load(`/api/prospects?lat=${here.lat}&lng=${here.lng}`);
      },
      () => {
        setLocating(false);
        setMessage("Location denied. Search by name instead.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [load]);

  // Ask on arrival. The whole product is "what is around me", so waiting for a
  // tap just shows an empty map first.
  useEffect(() => {
    locate();
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
          <LocateButton onClick={locate} busy={locating} />
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
