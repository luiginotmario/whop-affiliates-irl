"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, Spinner, Text, TextField } from "frosted-ui";
import type { Place } from "@/lib/schemas";

type Status = "idle" | "locating" | "searching" | "error";

export function Scout({ header }: { header: React.ReactNode }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async (url: string, next: Status) => {
    const id = ++requestId.current;
    setStatus(next);
    setMessage(null);
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (id !== requestId.current) return;
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      setPlaces(json.places);
      setStatus("idle");
      if (json.places.length === 0) setMessage("Nothing found. Try the name.");
    } catch (error) {
      if (id !== requestId.current) return;
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Search failed");
    }
  }, []);

  // Debounced typing. 250ms is long enough to not fire per keystroke and
  // short enough that results feel like they were already there.
  useEffect(() => {
    if (query.trim().length < 2) {
      setPlaces([]);
      setMessage(null);
      return;
    }
    const timer = setTimeout(
      () => load(`/api/places?q=${encodeURIComponent(query)}`, "searching"),
      250,
    );
    return () => clearTimeout(timer);
  }, [query, load]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("This device has no location.");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        load(
          `/api/places?lat=${coords.latitude}&lng=${coords.longitude}`,
          "searching",
        ),
      () => {
        setStatus("error");
        setMessage("Location denied. Type the name instead.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    // Two regions that always split the viewport the same way, so the search
    // block never moves when results arrive. On mobile the search sits at the
    // top; from sm up it takes the upper half and lands dead centre.
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col justify-end gap-6 pt-10 sm:flex-1 sm:pt-0">
        {header}

        <div className="flex flex-col gap-3">
          <TextField.Root size="3" variant="surface">
            <TextField.Input
              placeholder="Name, or paste their website"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              enterKeyHint="search"
              inputMode="search"
            />
          </TextField.Root>

          <Button
            size="3"
            variant="soft"
            color="gray"
            onClick={useMyLocation}
            loading={status === "locating"}
            className="transition-transform duration-150 active:scale-[0.98]"
          >
            Use my location
          </Button>
        </div>
      </div>

      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6 pt-8">
        <Results
          places={places}
          status={status}
          message={message}
          onPick={(id) => router.push(`/pitch/${id}`)}
        />
      </div>
    </div>
  );
}

function Results({
  places,
  status,
  message,
  onPick,
}: {
  places: Place[];
  status: Status;
  message: string | null;
  onPick: (id: string) => void;
}) {
  if (status === "searching" && places.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 pt-6">
        <Spinner size="2" />
        <Text size="2" color="gray">
          Searching
        </Text>
      </div>
    );
  }

  if (message) {
    return (
      <Text as="p" size="2" color="gray" align="center" className="pt-6">
        {message}
      </Text>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {places.map((place) => (
        <li key={place.id}>
          <button
            type="button"
            onClick={() => onPick(place.id)}
            className="w-full text-left transition-transform duration-150 active:scale-[0.99]"
          >
            <Card size="2" variant="surface">
              <Text as="div" size="3" weight="medium">
                {place.name}
              </Text>
              <Text as="div" size="2" color="gray" className="mt-1">
                {[place.category, place.address].filter(Boolean).join(" · ")}
              </Text>
            </Card>
          </button>
        </li>
      ))}
    </ul>
  );
}
