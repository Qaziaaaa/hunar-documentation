"use client";

import React, { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface CustomerLiveTrackingMapProps {
  workerLat: number | null;
  workerLng: number | null;
  customerLat: number | null;
  customerLng: number | null;
  customerAddress?: string;
  technicianName?: string;
  isTraveling: boolean;
  isUrdu?: boolean;
}

function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export function CustomerLiveTrackingMap({
  workerLat,
  workerLng,
  customerLat,
  customerLng,
  customerAddress,
  technicianName = "Technician",
  isTraveling,
  isUrdu = false,
}: CustomerLiveTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const techMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const [LState, setLState] = useState<any>(null);

  const hasGenuineWorkerCoords =
    typeof workerLat === "number" &&
    typeof workerLng === "number" &&
    workerLat !== 0 &&
    workerLng !== 0;

  const hasGenuineCustomerCoords =
    typeof customerLat === "number" &&
    typeof customerLng === "number" &&
    customerLat !== 0 &&
    customerLng !== 0;

  // Real-time trip mode (technician is traveling and genuine worker GPS coordinates exist)
  const isLiveTripActive =
    isTraveling && hasGenuineWorkerCoords && hasGenuineCustomerCoords;

  // Effective destination coordinates (fallback to central Peshawar if not specified)
  const effectiveCustLat = hasGenuineCustomerCoords ? customerLat! : 34.0048;
  const effectiveCustLng = hasGenuineCustomerCoords ? customerLng! : 71.5113;

  const directDistanceKm =
    isLiveTripActive && hasGenuineWorkerCoords && hasGenuineCustomerCoords
      ? calculateHaversineKm(workerLat!, workerLng!, effectiveCustLat, effectiveCustLng)
      : null;

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) {
      return;
    }

    let isMounted = true;

    async function initLeaflet() {
      const L = (await import("leaflet")).default;
      if (!isMounted) return;

      setLState(L);

      // Patch Leaflet DOM positioning to avoid unmount exceptions
      if (L && L.DomUtil && L.DomUtil.getPosition && !(L.DomUtil as any)._patchedPosition) {
        const origGetPos = L.DomUtil.getPosition;
        L.DomUtil.getPosition = function (el: any) {
          if (!el) return new L.Point(0, 0);
          try {
            return origGetPos.call(L.DomUtil, el) || new L.Point(0, 0);
          } catch {
            return new L.Point(0, 0);
          }
        };
        (L.DomUtil as any)._patchedPosition = true;
      }

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }

      if (!mapContainerRef.current) return;

      const custPos: [number, number] = [effectiveCustLat, effectiveCustLng];

      const map = L.map(mapContainerRef.current, {
        center: custPos,
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Standard OpenStreetMap tiles (free, reliable, no API key watermark)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        subdomains: ["a", "b", "c"],
      }).addTo(map);

      // Customer Destination Custom Pin (#123B5D Navy)
      const custIcon = L.divIcon({
        className: "custom-cust-pin",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #123B5D; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 30],
      });

      customerMarkerRef.current = L.marker(custPos, { icon: custIcon })
        .addTo(map)
        .bindPopup(
          `<strong>${isUrdu ? "تصدیق شدہ سروس کا پتہ" : "Confirmed Service Address"}</strong><br/>${
            customerAddress || (isUrdu ? "مقررہ مقام" : "Destination Location")
          }`
        );

      // If active trip with verified technician coordinates, show technician marker and route bounds
      if (isLiveTripActive && hasGenuineWorkerCoords) {
        const techPos: [number, number] = [workerLat!, workerLng!];

        const techIcon = L.divIcon({
          className: "custom-tech-pin",
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
              <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: #0F766E; opacity: 0.3; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 32px; height: 32px; border-radius: 50%; background: #0F766E; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); display: flex; align-items: center; justify-content: center; color: white;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        techMarkerRef.current = L.marker(techPos, { icon: techIcon })
          .addTo(map)
          .bindPopup(`<strong>${technicianName}</strong><br/>${isUrdu ? "آپ کی لوکیشن کی طرف روانہ" : "Heading to your location"}`);

        const bounds = L.latLngBounds([techPos, custPos]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } else {
        map.setView(custPos, 15);
      }

      // Ensure Leaflet calculates viewport dimensions reliably after paint
      setTimeout(() => {
        if (!isMounted) return;
        try {
          map.invalidateSize();
        } catch {}
      }, 100);

      setTimeout(() => {
        if (!isMounted) return;
        try {
          map.invalidateSize();
        } catch {}
      }, 400);
    }

    void initLeaflet();

    const handleResize = () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch {}
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [
    isLiveTripActive,
    effectiveCustLat,
    effectiveCustLng,
    technicianName,
    customerAddress,
    isUrdu,
  ]);

  // Update technician marker position dynamically when real GPS coordinates change
  useEffect(() => {
    if (
      mapInstanceRef.current &&
      techMarkerRef.current &&
      hasGenuineWorkerCoords
    ) {
      techMarkerRef.current.setLatLng([workerLat!, workerLng!]);
    }
  }, [workerLat, workerLng, hasGenuineWorkerCoords]);

  return (
    <div
      className="relative z-0 isolate rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100 w-full"
      style={{ minHeight: "340px", height: "auto" }}
    >
      {/* Map Canvas - Explicit dimensions prevent 0px collapse in all environments */}
      <div
        ref={mapContainerRef}
        className="w-full"
        style={{
          width: "100%",
          height: "320px",
          minHeight: "320px",
          display: "block",
          position: "relative",
          zIndex: 1,
        }}
      />

      {/* Top Floating Status Overlay - Scoped inside map container */}
      <div
        className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-10"
      >
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200/80 flex items-center gap-2 pointer-events-auto">
          {isLiveTripActive ? (
            <>
              <span className="size-2 rounded-full bg-[#16A34A] animate-ping" />
              <span className="text-xs font-bold text-[#123B5D]">
                {isUrdu ? "لائیو جی پی ایس فعال" : "Live GPS Active"}
              </span>
              {directDistanceKm !== null && directDistanceKm > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-extrabold text-[#0F766E]">
                    {directDistanceKm} km away
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              <MapPin className="size-3.5 text-[#0F766E]" />
              <span className="text-xs font-bold text-[#123B5D]">
                {isUrdu ? "تصدیق شدہ سروس کا پتہ" : "Confirmed Service Address"}
              </span>
            </>
          )}
        </div>

        {/* Re-center button */}
        <button
          type="button"
          onClick={() => {
            if (!mapInstanceRef.current) return;
            if (isLiveTripActive && hasGenuineWorkerCoords && LState) {
              const bounds = LState.latLngBounds([
                [workerLat!, workerLng!],
                [effectiveCustLat, effectiveCustLng],
              ]);
              mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
            } else {
              mapInstanceRef.current.setView([effectiveCustLat, effectiveCustLng], 15);
            }
          }}
          className="bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-md border border-slate-200/80 text-slate-700 hover:text-[#0F766E] transition-colors pointer-events-auto cursor-pointer"
          title={isUrdu ? "مرکز کریں" : "Center Map"}
        >
          <Crosshair className="size-4" />
        </button>
      </div>

      {/* Bottom Confirmed Address Bar */}
      {customerAddress && (
        <div
          className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs relative"
          style={{ zIndex: 10 }}
        >
          <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-2">
            <MapPin className="size-4 text-[#0F766E] shrink-0" />
            <span className="font-semibold text-slate-700 truncate">{customerAddress}</span>
          </div>
          <span className="text-[11px] font-bold text-[#0F766E] shrink-0 bg-[#0F766E]/10 px-2 py-0.5 rounded-md">
            {isUrdu ? "مقررہ پتہ" : "Service Address"}
          </span>
        </div>
      )}
    </div>
  );
}
