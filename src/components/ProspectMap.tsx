"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Pin } from "@/app/api/prospects/route";

/** Pin colour is the whole game: green means walk in, amber means a chain
 *  where nobody on site can sign, grey means low signal. */
function pinColour(pin: Pin): string {
  if (pin.prospect.isChain) return "var(--amber-9)";
  if (pin.prospect.tier === "high") return "var(--green-9)";
  if (pin.prospect.tier === "medium") return "var(--blue-9)";
  return "var(--gray-8)";
}

export function ProspectMap({
  pins,
  centre,
  userLocation,
  selectedId,
  onSelect,
  onMoveEnd,
}: {
  pins: Pin[];
  centre: { lat: number; lng: number } | null;
  userLocation: { lat: number; lng: number } | null;
  selectedId: string | null;
  onSelect: (pin: Pin) => void;
  onMoveEnd: (centre: { lat: number; lng: number }) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const moveEnd = useRef(onMoveEnd);
  moveEnd.current = onMoveEnd;

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!container.current || map.current || !token) return;

    mapboxgl.accessToken = token;
    map.current = new mapboxgl.Map({
      container: container.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: centre ? [centre.lng, centre.lat] : [-73.98, 40.75],
      zoom: centre ? 15.5 : 12,
      attributionControl: false,
    });

    // Only react to gestures. Programmatic easeTo also fires moveend, and
    // reloading on that would loop forever.
    map.current.on("moveend", (event) => {
      if (!event.originalEvent) return;
      const c = map.current?.getCenter();
      if (c) moveEnd.current({ lat: c.lat, lng: c.lng });
    });

    return () => {
      map.current?.remove();
      map.current = null;
      markers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recentre when we learn where the user is.
  useEffect(() => {
    if (map.current && centre) {
      map.current.easeTo({
        center: [centre.lng, centre.lat],
        zoom: 15.5,
        duration: 600,
      });
    }
  }, [centre]);

  // A single dot for "you are here", kept separate from the business pins.
  useEffect(() => {
    if (!map.current || !userLocation) return;
    if (!userMarker.current) {
      const el = document.createElement("div");
      el.className =
        "size-3.5 rounded-full border-2 border-white bg-blue-9 shadow-md";
      el.style.boxShadow = "0 0 0 6px var(--blue-a5)";
      userMarker.current = new mapboxgl.Marker({ element: el }).setLngLat([
        userLocation.lng,
        userLocation.lat,
      ]);
      userMarker.current.addTo(map.current);
    } else {
      userMarker.current.setLngLat([userLocation.lng, userLocation.lat]);
    }
  }, [userLocation]);

  // Reconcile markers against pins rather than tearing them all down, so
  // panning does not flash the whole layer.
  useEffect(() => {
    if (!map.current) return;
    const live = map.current;
    const seen = new Set<string>();

    for (const pin of pins) {
      if (pin.lat === null || pin.lng === null) continue;
      seen.add(pin.id);

      let marker = markers.current.get(pin.id);
      if (!marker) {
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", pin.name);
        el.className =
          "size-4 rounded-full border-2 border-white shadow-md transition-transform duration-150 hover:scale-125";
        el.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelect(pin);
        });
        marker = new mapboxgl.Marker({ element: el })
          .setLngLat([pin.lng, pin.lat])
          .addTo(live);
        markers.current.set(pin.id, marker);
      }

      const el = marker.getElement();
      el.style.backgroundColor = pinColour(pin);
      el.style.transform =
        pin.id === selectedId
          ? `${el.style.transform.replace(/ scale\([^)]*\)/, "")} scale(1.6)`
          : el.style.transform.replace(/ scale\([^)]*\)/, "");
      el.style.zIndex = pin.id === selectedId ? "10" : "1";
    }

    for (const [id, marker] of markers.current) {
      if (!seen.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    }
  }, [pins, selectedId, onSelect]);

  return <div ref={container} className="size-full" />;
}
