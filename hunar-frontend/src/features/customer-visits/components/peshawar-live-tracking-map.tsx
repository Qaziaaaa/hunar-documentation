"use client";

import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  Compass,
  Crosshair,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { ScheduledVisit } from "../types";
import "leaflet/dist/leaflet.css";

interface PeshawarLiveTrackingMapProps {
  visit: ScheduledVisit;
  onProgressUpdate?: (remainingKm: number, etaMinutes: number) => void;
}

export function PeshawarLiveTrackingMap({
  visit,
  onProgressUpdate,
}: PeshawarLiveTrackingMapProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const techMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<"carto" | "osm">("carto");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState(2);
  const [currentSpeed, setCurrentSpeed] = useState(visit.technician.speedKmh || 28);
  const [currentDistance, setCurrentDistance] = useState(visit.remainingDistanceKm);
  const [currentEta, setCurrentEta] = useState(visit.etaMinutes);

  // Pre-calculated route points along Peshawar University Road from Saddar Cantt to University Town / Hayatabad
  const routePoints: [number, number][] = [
    [34.0084, 71.5458], // Saddar Cantt Workshop
    [34.0076, 71.5360], // Sunehri Masjid Road
    [34.0068, 71.5246], // Tehkal / University Road
    [34.0055, 71.5140], // Islamia College Gate
    [34.0048, 71.5080], // University Town Entrance
    [visit.customerLat, visit.customerLng], // Customer Doorstep
  ];

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initial center between tech and customer
      const midLat = (routePoints[simulationIndex][0] + visit.customerLat) / 2;
      const midLng = (routePoints[simulationIndex][1] + visit.customerLng) / 2;

      const map = L.map(mapContainerRef.current, {
        center: [midLat, midLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Tile Layer
      const tileUrl =
        mapStyle === "carto"
          ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      // 1. Customer Destination House Icon
      const doorstepLabel = isUrdu ? "آپ کی دہلیز" : "Your Doorstep";
      const customerIcon = L.divIcon({
        className: "custom-customer-pin",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: default;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(18, 59, 93, 0.2); position: absolute; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 38px; height: 38px; border-radius: 12px; background: #123B5D; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.25); border: 2.5px solid white; z-index: 10;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div style="background: #123B5D; color: white; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); margin-top: 3px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.3); z-index: 10;">
              ${doorstepLabel}
            </div>
          </div>
        `,
        iconSize: [44, 60],
        iconAnchor: [22, 50],
      });

      L.marker([visit.customerLat, visit.customerLng], { icon: customerIcon }).addTo(map);

      // 2. Route Polyline
      const latLngs = routePoints.map((pt) => [pt[0], pt[1]] as [number, number]);
      const polyline = L.polyline(latLngs, {
        color: "#0F766E",
        weight: 5,
        opacity: 0.8,
        dashArray: "8, 8",
      }).addTo(map);

      routePolylineRef.current = polyline;

      // 3. Technician Live Motorcycle Pin
      const techPos = routePoints[simulationIndex] as [number, number];
      const techIcon = L.divIcon({
        className: "custom-tech-pin",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(15, 118, 110, 0.25); position: absolute; animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
            <div style="width: 42px; height: 42px; border-radius: 50%; background: #0F766E; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(15,118,110,0.45); border: 3px solid white; z-index: 20;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
            </div>
            <div style="background: #1A1A2E; color: white; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.25); margin-top: 2px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; gap: 4px; z-index: 20;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #16A34A; display: inline-block;"></span>
              <span>${visit.technician.name.split(" ")[0]} • ${currentDistance} km</span>
            </div>
          </div>
        `,
        iconSize: [52, 65],
        iconAnchor: [26, 52],
      });

      const marker = L.marker(techPos, { icon: techIcon }).addTo(map);
      techMarkerRef.current = marker;

      // Fit map bounds to show full route
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

      setMapLoaded(true);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapStyle, visit.customerLat, visit.customerLng, isUrdu]);

  // Handle Simulation Step: Move technician closer to doorstep
  const handleSimulateMove = async () => {
    if (!mapInstanceRef.current || !techMarkerRef.current) return;

    const nextIndex = (simulationIndex + 1) % routePoints.length;
    setSimulationIndex(nextIndex);

    const nextPos = routePoints[nextIndex];
    techMarkerRef.current.setLatLng(nextPos);

    // Calculate remaining distance & ETA
    const stepsRemaining = routePoints.length - 1 - nextIndex;
    const newDistance = Number(Math.max(stepsRemaining * 0.35, 0.1).toFixed(1));
    const newEta = Math.max(stepsRemaining * 4, 2);
    const newSpeed = nextIndex === routePoints.length - 1 ? 0 : Math.floor(Math.random() * 15 + 20);

    setCurrentDistance(newDistance);
    setCurrentEta(newEta);
    setCurrentSpeed(newSpeed);

    if (onProgressUpdate) {
      onProgressUpdate(newDistance, newEta);
    }

    // Update marker icon
    const L = (await import("leaflet")).default;
    const techIcon = L.divIcon({
      className: "custom-tech-pin",
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(15, 118, 110, 0.25); position: absolute; animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
          <div style="width: 42px; height: 42px; border-radius: 50%; background: #0F766E; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(15,118,110,0.45); border: 3px solid white; z-index: 20;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
          </div>
          <div style="background: #1A1A2E; color: white; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.25); margin-top: 2px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; gap: 4px; z-index: 20;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #16A34A; display: inline-block;"></span>
            <span>${visit.technician.name.split(" ")[0]} • ${newDistance} km</span>
          </div>
        </div>
      `,
      iconSize: [52, 65],
      iconAnchor: [26, 52],
    });

    techMarkerRef.current.setIcon(techIcon);
    mapInstanceRef.current.panTo(nextPos, { animate: true, duration: 0.8 });
  };

  const handleCenter = () => {
    if (mapInstanceRef.current && routePolylineRef.current) {
      mapInstanceRef.current.fitBounds(routePolylineRef.current.getBounds(), {
        padding: [40, 40],
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
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-sm bg-slate-100 ${
        isFullscreen ? "fixed inset-4 z-50 rounded-3xl" : "h-80 sm:h-96"
      }`}
    >
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Left: Live Street & Traffic Landmark Overlay */}
      <div className="absolute top-3.5 left-3.5 rtl:left-auto rtl:right-3.5 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2.5 max-w-xs sm:max-w-md pointer-events-none">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16A34A]"></span>
        </span>
        <div className="flex flex-col min-w-0 rtl:text-right">
          <span className="text-xs font-bold text-[#123B5D] truncate">
            {isUrdu
              ? `راستے میں ہے: صدر ← ${visit.customerArea}`
              : `En Route: Saddar → ${visit.customerArea}`}
          </span>
          <span className="text-[10.5px] text-slate-500 font-medium truncate">
            {visit.currentStreetLandmark}
          </span>
        </div>
      </div>

      {/* Top Right Controls: Style Toggle & Fullscreen */}
      <div className="absolute top-3.5 right-3.5 rtl:right-auto rtl:left-3.5 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMapStyle(mapStyle === "carto" ? "osm" : "carto")}
          className="size-9 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-[#123B5D] hover:text-[#0F766E] shadow-sm flex items-center justify-center transition-all cursor-pointer hover:bg-white active:scale-95"
          title={isUrdu ? "نقشہ تبدیل کریں" : "Switch Map Tiles"}
        >
          <Layers className="size-4.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="size-9 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-[#123B5D] hover:text-[#0F766E] shadow-sm flex items-center justify-center transition-all cursor-pointer hover:bg-white active:scale-95"
          title={isFullscreen ? (isUrdu ? "چھوٹی اسکرین" : "Exit Fullscreen") : (isUrdu ? "فل اسکرین" : "Fullscreen")}
        >
          {isFullscreen ? (
            <Minimize2 className="size-4.5" />
          ) : (
            <Maximize2 className="size-4.5" />
          )}
        </button>
      </div>

      {/* Bottom Left: Remaining Distance & Speed Pill */}
      <div className="absolute bottom-3.5 left-3.5 rtl:left-auto rtl:right-3.5 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="flex flex-col rtl:text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            {isUrdu ? "باقی فاصلہ" : "Remaining"}
          </span>
          <span className="text-xs font-extrabold text-[#123B5D]">
            {currentDistance} {isUrdu ? "کلومیٹر" : "km"} (~{currentEta}{isUrdu ? "منٹ" : "m"})
          </span>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex flex-col rtl:text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            {isUrdu ? "لائیو رفتار" : "Live Speed"}
          </span>
          <span className="text-xs font-bold text-[#16A34A] flex items-center gap-1">
            <Navigation className="size-3 rtl:rotate-180" />
            {currentSpeed} {isUrdu ? "کلومیٹر/گھنٹہ" : "km/h"}
          </span>
        </div>
      </div>

      {/* Bottom Right Controls: Simulation Step, Recenter & Zoom */}
      <div className="absolute bottom-3.5 right-3.5 rtl:right-auto rtl:left-3.5 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSimulateMove}
          className="px-3 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          title={isUrdu ? "کاریگر کی حرکت سمولیٹ کریں" : "Simulate GPS Dispatch Movement"}
        >
          <Play className="size-3.5 fill-white" />
          <span>{isUrdu ? "حرکت سمولیٹ کریں" : "Simulate Move"}</span>
        </button>

        <button
          type="button"
          onClick={handleCenter}
          className="size-9 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-[#123B5D] hover:text-[#0F766E] shadow-sm flex items-center justify-center transition-all cursor-pointer hover:bg-white active:scale-95"
          title={isUrdu ? "راستہ سینٹر کریں" : "Center Full Route"}
        >
          <Crosshair className="size-4.5" />
        </button>

        <div className="hidden sm:flex items-center bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="size-9 text-slate-700 hover:text-[#0F766E] hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer border-r border-slate-200 rtl:border-r-0 rtl:border-l"
            title={isUrdu ? "بڑا کریں" : "Zoom In"}
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="size-9 text-slate-700 hover:text-[#0F766E] hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
            title={isUrdu ? "چھوٹا کریں" : "Zoom Out"}
          >
            <Minus className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

