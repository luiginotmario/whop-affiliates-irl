"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProspectMap } from "@/components/ProspectMap";
import { ProspectSheet } from "@/components/ProspectSheet";
import { LocateButton } from "@/components/LocateButton";
import type { Pin } from "@/app/api/prospects/route";

export function Explore() {
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

  // Selecting from either surface moves the map to it.
  const select = useCallback((pin: Pin) => {
    setSelected(pin);
    if (pin.lat !== null && pin.lng !== null) {
      setCentre({ lat: pin.lat, lng: pin.lng });
    }
  }, []);

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
        onClear={() => setSelected(null)}
      />
    </div>
  );
}
