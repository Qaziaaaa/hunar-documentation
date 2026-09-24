"use client";

import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  Crosshair,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  Navigation,
} from "lucide-react";
import type { ScheduledVisit } from "../types";
import {
  UNIVERSITY_TOWN_TRAVELED_COORDS,
  UNIVERSITY_TOWN_REMAINING_COORDS,
} from "../data/real-road-routes";
import "leaflet/dist/leaflet.css";

interface PeshawarLiveTrackingMapProps {
  visit: ScheduledVisit;
  onProgressUpdate?: (remainingKm: number, etaMinutes: number) => void;
}

export function PeshawarLiveTrackingMap({
  visit,
}: PeshawarLiveTrackingMapProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const fullRouteBoundsRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dynamic route states
  const [traveledPoints, setTraveledPoints] = useState<[number, number][]>(
    UNIVERSITY_TOWN_TRAVELED_COORDS
  );
  const [remainingPoints, setRemainingPoints] = useState<[number, number][]>(
    UNIVERSITY_TOWN_REMAINING_COORDS
  );

  // Fetch or resolve actual road routing for any visit
  useEffect(() => {
    let isCancelled = false;

    const isSmitOrTown =
      (Math.abs(visit.customerLat - 33.9904) < 0.05 &&
        Math.abs(visit.customerLng - 71.49533) < 0.05) ||
      (Math.abs(visit.customerLat - 34.0043) < 0.05 &&
        Math.abs(visit.customerLng - 71.5034) < 0.05);

    if (isSmitOrTown) {
      setTraveledPoints(UNIVERSITY_TOWN_TRAVELED_COORDS);
      setRemainingPoints(UNIVERSITY_TOWN_REMAINING_COORDS);
      return;
    }

    // Dynamic OSRM fetching for other locations
    async function resolveRoute() {
      try {
        const originLng = visit.originLng || 71.5458;
        const originLat = visit.originLat || 34.0084;
        const techLng = visit.technician.currentLng || 71.511284;
        const techLat = visit.technician.currentLat || 34.004869;
        const destLng = visit.customerLng;
        const destLat = visit.customerLat;

        const [resTraveled, resRemaining] = await Promise.all([
          fetch(
            `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${techLng},${techLat}?overview=full&geometries=geojson`
          ).then((r) => r.json()),
          fetch(
            `https://router.project-osrm.org/route/v1/driving/${techLng},${techLat};${destLng},${destLat}?overview=full&geometries=geojson`
          ).then((r) => r.json()),
        ]);

        if (isCancelled) return;

        if (resTraveled?.routes?.[0]?.geometry?.coordinates) {
          const tPoints = resTraveled.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );
          setTraveledPoints(tPoints);
        }

        if (resRemaining?.routes?.[0]?.geometry?.coordinates) {
          const rPoints = resRemaining.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );
          setRemainingPoints(rPoints);
        }
      } catch (err) {
        console.warn("OSRM route fetch fallback:", err);
      }
    }

    resolveRoute();

    return () => {
      isCancelled = true;
    };
  }, [visit]);

  const currentDistance = visit.remainingDistanceKm;
  const currentEta = visit.etaMinutes;

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Patch Leaflet DomUtil.getPosition to prevent '_leaflet_pos' TypeError when unmounting or accessing detached DOM elements
      if (L && L.DomUtil && L.DomUtil.getPosition && !(L.DomUtil as any)._patchedPosition) {
        const origGetPos = L.DomUtil.getPosition;
        L.DomUtil.getPosition = function (el: any) {
          if (!el) return new L.Point(0, 0);
          try {
            return origGetPos.call(L.DomUtil, el);
          } catch {
            return new L.Point(0, 0);
          }
        };
        (L.DomUtil as any)._patchedPosition = true;
      }

      // Clean up previous instance
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }

      const techPos: [number, number] =
        remainingPoints.length > 0
          ? remainingPoints[0]
          : [visit.technician.currentLat, visit.technician.currentLng];

      const customerPos: [number, number] = [
        visit.customerLat,
        visit.customerLng,
      ];

      // Center map between technician and customer
      const midLat = (techPos[0] + customerPos[0]) / 2;
      const midLng = (techPos[1] + customerPos[1]) / 2;

      const map = L.map(mapContainerRef.current, {
        center: [midLat, midLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      });

      mapInstanceRef.current = map;

      // OpenStreetMap crisp, reliable tile layer without watermarks
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Traveled route (Faint subtle trail behind technician)
      if (traveledPoints.length > 1) {
        L.polyline(traveledPoints, {
          color: "#94A3B8",
          weight: 3.5,
          opacity: 0.4,
          dashArray: "5, 8",
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
      }

      // Active Navigation Route (Technician -> Customer Doorstep)
      if (remainingPoints.length > 1) {
        // High contrast casing
        L.polyline(remainingPoints, {
          color: "#042F2E",
          weight: 8,
          opacity: 0.35,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        // Vibrant brand emerald route path
        const navLine = L.polyline(remainingPoints, {
          color: "#0F766E",
          weight: 5.5,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        const routeBounds = navLine.getBounds();
        fullRouteBoundsRef.current = routeBounds;

        map.fitBounds(routeBounds, {
          padding: [45, 45],
          maxZoom: 15,
        });
      }

      // Customer Destination (Doorstep) Pin
      const isSmitDest =
        visit.customerAddress?.toLowerCase().includes("smit") ||
        (Math.abs(visit.customerLat - 33.9904) < 0.05 &&
          Math.abs(visit.customerLng - 71.49533) < 0.05);

      const doorstepLabel = isSmitDest
        ? isUrdu
          ? "منزل: SMIT پشاور"
          : "End: SMIT Peshawar"
        : isUrdu
        ? "آپ کی دہلیز"
        : "Your Doorstep";

      const customerIcon = L.divIcon({
        className: "custom-customer-pin",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: default;">
            <div style="width: 42px; height: 42px; border-radius: 50%; background: rgba(18, 59, 93, 0.2); position: absolute; animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 36px; height: 36px; border-radius: 12px; background: #123B5D; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(18,59,93,0.3); border: 2.5px solid white; z-index: 10;">
              ${
                isSmitDest
                  ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`
                  : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
              }
            </div>
            <div style="background: #123B5D; color: white; font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); margin-top: 3px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.25); z-index: 10;">
              ${doorstepLabel}
            </div>
          </div>
        `,
        iconSize: [44, 58],
        iconAnchor: [22, 48],
      });

      L.marker([visit.customerLat, visit.customerLng], {
        icon: customerIcon,
      })
        .addTo(map)
        .bindTooltip(
          isSmitDest
            ? isUrdu
              ? "ایس ایم آئی ٹی پشاور (سیلانی ماس آئی ٹی سینٹر)"
              : "SMIT Peshawar (Saylani Mass IT Training Centre)"
            : doorstepLabel,
          { direction: "top", offset: [0, -10] }
        );

      // Technician Live Marker with Animated Radar Pulse
      const techIcon = L.divIcon({
        className: "custom-tech-pin",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: default;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(15, 118, 110, 0.25); position: absolute; animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
            <div style="width: 38px; height: 38px; border-radius: 50%; background: #0F766E; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(15,118,110,0.45); border: 2.5px solid white; z-index: 20;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
            </div>
            <div style="background: #0F172A; color: white; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); margin-top: 2px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; gap: 4px; z-index: 20;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #10B981; display: inline-block;"></span>
              <span>${visit.technician.name.split(" ")[0]} • ${currentDistance} km</span>
            </div>
          </div>
        `,
        iconSize: [48, 62],
        iconAnchor: [24, 48],
      });

      L.marker(techPos, { icon: techIcon }).addTo(map);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [
    visit,
    isUrdu,
    traveledPoints,
    remainingPoints,
    currentDistance,
  ]);

  const handleCenter = () => {
    if (mapInstanceRef.current && fullRouteBoundsRef.current) {
      mapInstanceRef.current.fitBounds(fullRouteBoundsRef.current, {
        padding: [45, 45],
        animate: true,
      });
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <>
      {isFullscreen && (
        <div
          onClick={() => setIsFullscreen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] transition-opacity"
        />
      )}
      <div
        className={`relative w-full rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-sm bg-slate-100 isolate ${
          isFullscreen
            ? "fixed inset-4 sm:inset-10 z-[80] rounded-3xl shadow-2xl border-2 border-white"
            : "h-72 sm:h-88 z-0"
        }`}
      >
        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* TOP LEFT: CUSTOMER-FOCUSED LIVE ARRIVAL STATUS CARD */}
        <div className="absolute top-3.5 left-3.5 rtl:left-auto rtl:right-3.5 z-20 pointer-events-auto max-w-[260px] sm:max-w-xs">
          <div className="bg-white/95 text-slate-900 backdrop-blur-md px-3.5 py-3 rounded-2xl border border-slate-200/90 shadow-md space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2.5 bg-emerald-600"></span>
              </span>
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#0F766E]">
                {isUrdu ? "لائیو ٹریکنگ • راستے میں" : "Live Tracking • En Route"}
              </span>
            </div>

            <div>
              <div className="text-sm sm:text-base font-black text-[#123B5D] leading-snug">
                {isUrdu
                  ? `تقریباً ${currentEta} منٹ میں آمد`
                  : `Arriving in ~${currentEta} mins`}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {isUrdu
                  ? `${currentDistance} کلومیٹر فاصلہ • ${visit.technician.name.split(" ")[0]} روانہ ہے`
                  : `${currentDistance} km away • ${visit.technician.name.split(" ")[0]} is on the way`}
              </p>
            </div>
          </div>
        </div>

        {/* TOP RIGHT CONTROLS: RECENTER & FULLSCREEN */}
        <div className="absolute top-3.5 right-3.5 rtl:right-auto rtl:left-3.5 z-20 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCenter}
            className="size-9 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-[#123B5D] hover:text-[#0F766E] shadow-sm flex items-center justify-center transition-all cursor-pointer hover:bg-white active:scale-95"
            title={isUrdu ? "راستہ سینٹر کریں" : "Center Map"}
          >
            <Crosshair className="size-4.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="size-9 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-[#123B5D] hover:text-[#0F766E] shadow-sm flex items-center justify-center transition-all cursor-pointer hover:bg-white active:scale-95"
            title={
              isFullscreen
                ? isUrdu
                  ? "چھوٹی اسکرین"
                  : "Exit Fullscreen"
                : isUrdu
                ? "فل اسکرین"
                : "Fullscreen"
            }
          >
            {isFullscreen ? (
              <Minimize2 className="size-4.5" />
            ) : (
              <Maximize2 className="size-4.5" />
            )}
          </button>
        </div>

        {/* BOTTOM RIGHT CONTROLS: ZOOM CONTROLS */}
        <div className="absolute bottom-3.5 right-3.5 rtl:right-auto rtl:left-3.5 z-20 hidden sm:flex items-center bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="size-8 text-slate-700 hover:text-[#0F766E] hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer border-r border-slate-200 rtl:border-r-0 rtl:border-l"
            title={isUrdu ? "بڑا کریں" : "Zoom In"}
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="size-8 text-slate-700 hover:text-[#0F766E] hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
            title={isUrdu ? "چھوٹا کریں" : "Zoom Out"}
          >
            <Minus className="size-4" />
          </button>
        </div>
      </div>
    </>
  );
}
