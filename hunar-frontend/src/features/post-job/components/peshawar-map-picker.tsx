"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Crosshair,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Sparkles,
  Check,
} from "lucide-react";
import type { PostJobData } from "../types";
import "leaflet/dist/leaflet.css";

export interface PeshawarHotspot {
  id: string;
  name: string;
  areaKey: string;
  landmark: string;
  addressPrefix: string;
  lat: number;
  lng: number;
  zoom: number;
}

export const PESHAWAR_HOTSPOTS: PeshawarHotspot[] = [
  {
    id: "univ-town",
    name: "University Town",
    areaKey: "University Town, Peshawar",
    landmark: "Near Islamia College Gate",
    addressPrefix: "House 45, Street 12, Block C, University Town",
    lat: 34.0043,
    lng: 71.5034,
    zoom: 15,
  },
  {
    id: "hayatabad-phase1",
    name: "Hayatabad Phase 1",
    areaKey: "Hayatabad Phase 1, Peshawar",
    landmark: "Near Phase 1 Commercial Market",
    addressPrefix: "House 12, Sector A-1, Phase 1, Hayatabad",
    lat: 33.996,
    lng: 71.448,
    zoom: 15,
  },
  {
    id: "hayatabad-phase2",
    name: "Hayatabad Phase 2",
    areaKey: "Hayatabad Phase 2, Peshawar",
    landmark: "Near Zarghoni Mosque",
    addressPrefix: "House 55, Sector B-2, Phase 2, Hayatabad",
    lat: 33.991,
    lng: 71.443,
    zoom: 15,
  },
  {
    id: "hayatabad-phase3",
    name: "Hayatabad Phase 3",
    areaKey: "Hayatabad Phase 3, Peshawar",
    landmark: "Near Tatara Park, Sector E-2",
    addressPrefix: "Street 4, Sector E-2, Phase 3, Hayatabad",
    lat: 33.9856,
    lng: 71.4398,
    zoom: 15,
  },
  {
    id: "hayatabad-phase4",
    name: "Hayatabad Phase 4",
    areaKey: "Hayatabad Phase 4, Peshawar",
    landmark: "Near Shaukat Khanum Hospital",
    addressPrefix: "House 34, Sector G-3, Phase 4, Hayatabad",
    lat: 33.98,
    lng: 71.435,
    zoom: 15,
  },
  {
    id: "hayatabad-phase5",
    name: "Hayatabad Phase 5",
    areaKey: "Hayatabad Phase 5, Peshawar",
    landmark: "Near Hayatabad Food Street",
    addressPrefix: "House 89, Sector D-1, Phase 5, Hayatabad",
    lat: 33.978,
    lng: 71.429,
    zoom: 15,
  },
  {
    id: "hayatabad-phase6",
    name: "Hayatabad Phase 6",
    areaKey: "Hayatabad Phase 6, Peshawar",
    landmark: "Near Hayatabad Medical Complex (HMC)",
    addressPrefix: "House 28, Sector F-4, Phase 6, Hayatabad",
    lat: 33.9745,
    lng: 71.4256,
    zoom: 15,
  },
  {
    id: "hayatabad-phase7",
    name: "Hayatabad Phase 7",
    areaKey: "Hayatabad Phase 7, Peshawar",
    landmark: "Near Phase 7 Green Belt",
    addressPrefix: "House 10, Sector H-2, Phase 7, Hayatabad",
    lat: 33.969,
    lng: 71.419,
    zoom: 15,
  },
  {
    id: "saddar-cantt",
    name: "Saddar & Cantt",
    areaKey: "Saddar & Peshawar Cantt",
    landmark: "Near Mall Road & Deans Trade Center",
    addressPrefix: "Flat 12, Saddar Road, Cantt",
    lat: 34.0084,
    lng: 71.5458,
    zoom: 15,
  },
  {
    id: "gulbahar-gt-road",
    name: "Gulbahar & City",
    areaKey: "Gulbahar & City Area, Peshawar",
    landmark: "Near Hashtnagri Flyover",
    addressPrefix: "House 18, Street 3, Gulbahar No. 2",
    lat: 34.015,
    lng: 71.585,
    zoom: 14.5,
  },
  {
    id: "warsak-road",
    name: "Warsak Road",
    areaKey: "Warsak Road, Peshawar",
    landmark: "Near Peshawar Public School",
    addressPrefix: "Street 9, Officers Colony, Warsak Road",
    lat: 34.041,
    lng: 71.518,
    zoom: 14.5,
  },
  {
    id: "ring-road-pishtakhara",
    name: "Ring Road",
    areaKey: "Ring Road & Pishtakhara, Peshawar",
    landmark: "Near Pishtakhara Chowk",
    addressPrefix: "Main Ring Road near Canal Bridge",
    lat: 33.968,
    lng: 71.512,
    zoom: 14.5,
  },
  {
    id: "dha-peshawar",
    name: "DHA Peshawar",
    areaKey: "DHA Peshawar",
    landmark: "Near Sector A Main Boulevard",
    addressPrefix: "Villa 104, Sector B, DHA Peshawar",
    lat: 34.025,
    lng: 71.41,
    zoom: 14.5,
  },
  {
    id: "regi-model-town",
    name: "Regi Model Town",
    areaKey: "Regi Model Town (RMT), Peshawar",
    landmark: "Near Zone 3 Commercial Center",
    addressPrefix: "Plot 88, Sector C, Zone 3, RMT",
    lat: 34.048,
    lng: 71.455,
    zoom: 14.5,
  },
  {
    id: "dalazak-road",
    name: "Dalazak Road",
    areaKey: "Dalazak Road, Peshawar",
    landmark: "Near Dalazak Chowk & Ring Road",
    addressPrefix: "House 22, Street 4, Dalazak Road",
    lat: 34.032,
    lng: 71.601,
    zoom: 14.5,
  },
  {
    id: "kohat-road",
    name: "Kohat Road",
    areaKey: "Kohat Road & Scheme Chowk, Peshawar",
    landmark: "Near Kohat Road Bus Terminal",
    addressPrefix: "Shop 14, Main Kohat Road",
    lat: 33.952,
    lng: 71.538,
    zoom: 14.5,
  },
  {
    id: "charsadda-road",
    name: "Charsadda Road",
    areaKey: "Charsadda Road, Peshawar",
    landmark: "Near Eidgah & Interchange",
    addressPrefix: "House 7, Street 1, Charsadda Road",
    lat: 34.053,
    lng: 71.572,
    zoom: 14.5,
  },
];

// Tile Layer options with reliable public CDNs
const TILE_LAYERS = {
  streets: {
    name: "Streets",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ["a", "b", "c"],
  },
  dark: {
    name: "Dark GPS",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: ["a", "b", "c", "d"],
  },
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; Esri &mdash; Source: Esri, Maxar, GeoEye',
    subdomains: [],
  },
};

interface PeshawarMapPickerProps {
  data: PostJobData;
  onChange: (updates: Partial<PostJobData>) => void;
  isLocating?: boolean;
  onAutoDetect?: () => void;
}

export function PeshawarMapPicker({
  data,
  onChange,
  isLocating = false,
  onAutoDetect,
}: PeshawarMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentTileLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);

  const [currentStyleKey, setCurrentStyleKey] = useState<"streets" | "dark" | "satellite">("streets");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Active coordinates (default to University Town, Peshawar)
  const currentLng = data.longitude ?? 71.5034;
  const currentLat = data.latitude ?? 34.0043;

  // Find matching hotspot based on area name or distance
  const findClosestHotspot = useCallback((lat: number, lng: number) => {
    let closest = PESHAWAR_HOTSPOTS[0];
    let minDistance = Number.MAX_VALUE;

    PESHAWAR_HOTSPOTS.forEach((h) => {
      const dist = Math.hypot(h.lat - lat, h.lng - lng);
      if (dist < minDistance) {
        minDistance = dist;
        closest = h;
      }
    });
    return closest;
  }, []);

  // Update position handler (called on map click or marker drag)
  const handlePositionUpdate = useCallback(
    (lat: number, lng: number) => {
      const closest = findClosestHotspot(lat, lng);

      onChange({
        latitude: lat,
        longitude: lng,
        area: closest.areaKey,
        landmark: closest.landmark,
        city: "Peshawar",
        address: closest.addressPrefix,
      });
    },
    [findClosestHotspot, onChange]
  );

  // Initialize Leaflet Map on client mount
  useEffect(() => {
    let isCancelled = false;

    async function initLeaflet() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      try {
        const leafletModule = await import("leaflet");
        const L = leafletModule.default || leafletModule;
        LRef.current = L;

        if (isCancelled || !mapContainerRef.current) return;

        // Create Leaflet Map instance
        const map = L.map(mapContainerRef.current, {
          center: [currentLat, currentLng],
          zoom: 14,
          zoomControl: false,
          attributionControl: false,
        });

        // Add Base Tile Layer
        const tileConfig = TILE_LAYERS[currentStyleKey];
        const tileLayer = L.tileLayer(tileConfig.url, {
          attribution: tileConfig.attribution,
          subdomains: tileConfig.subdomains,
          maxZoom: 19,
        }).addTo(map);

        currentTileLayerRef.current = tileLayer;

        // Custom HTML Pin Marker
        const customIcon = L.divIcon({
          className: "hunar-pin-wrapper",
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
              <!-- Animated Pulse Ring -->
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 52px;
                height: 52px;
                border-radius: 50%;
                background: rgba(15, 118, 110, 0.28);
                animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                pointer-events: none;
              "></div>
              
              <!-- Pin Head -->
              <div style="
                position: relative;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: #0F766E;
                border: 3px solid #ffffff;
                box-shadow: 0 4px 14px rgba(15, 118, 110, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                z-index: 2;
              ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>

              <!-- Pin Pointer Arrow -->
              <div style="
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 8px solid #0F766E;
                margin-top: -2px;
                z-index: 1;
              "></div>

              <!-- Pin Ground Shadow -->
              <div style="
                width: 14px;
                height: 4px;
                background: rgba(0, 0, 0, 0.35);
                border-radius: 50%;
                margin-top: 2px;
              "></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        // Add Draggable Marker
        const marker = L.marker([currentLat, currentLng], {
          icon: customIcon,
          draggable: true,
        }).addTo(map);

        // Marker drag handler
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          handlePositionUpdate(pos.lat, pos.lng);
        });

        // Click anywhere on map to reposition pin
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          handlePositionUpdate(lat, lng);
        });

        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;

        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      } catch (err) {
        console.error("Leaflet initialization error:", err);
      }
    }

    initLeaflet();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update tile style when currentStyleKey changes
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current) return;
    try {
      const L = LRef.current;
      if (currentTileLayerRef.current) {
        mapInstanceRef.current.removeLayer(currentTileLayerRef.current);
      }
      const tileConfig = TILE_LAYERS[currentStyleKey];
      const newLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        subdomains: tileConfig.subdomains,
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      currentTileLayerRef.current = newLayer;
    } catch (err) {
      console.warn("Could not switch tile layer:", err);
    }
  }, [currentStyleKey]);

  // Reactive Fly-To whenever data.latitude / data.longitude changes from parent or dropdown
  useEffect(() => {
    if (!mapInstanceRef.current || !markerInstanceRef.current) return;
    if (data.latitude && data.longitude) {
      const latLng = [data.latitude, data.longitude];
      markerInstanceRef.current.setLatLng(latLng);
      mapInstanceRef.current.flyTo(latLng, mapInstanceRef.current.getZoom() || 14.5, {
        duration: 0.8,
      });
    }
  }, [data.latitude, data.longitude]);

  // Zoom handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  // Recenter / Auto-Detect handler
  const handleRecenter = () => {
    if (onAutoDetect) {
      onAutoDetect();
    }
  };

  // Hotspot chip click handler
  const handleSelectHotspot = (hotspot: PeshawarHotspot) => {
    onChange({
      area: hotspot.areaKey,
      landmark: hotspot.landmark,
      city: "Peshawar",
      latitude: hotspot.lat,
      longitude: hotspot.lng,
      address: hotspot.addressPrefix,
    });
  };

  // Determine active hotspot based on data.area or closest coordinates
  const activeHotspot =
    PESHAWAR_HOTSPOTS.find((h) => h.areaKey === data.area) ||
    findClosestHotspot(currentLat, currentLng);

  return (
    <div className="space-y-2.5">
      {/* Map Canvas Container */}
      <div
        className={`w-full ${
          isExpanded ? "h-80 sm:h-96" : "h-56 sm:h-64"
        } rounded-2xl relative overflow-hidden transition-all duration-300 select-none shadow-xs border border-slate-200 bg-slate-100 z-0`}
      >
        {/* Top-Left Floating Info Badge (Syncs LIVE with data.area & landmark) */}
        <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1 max-w-[78%] pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xs border border-slate-200 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[11px] font-bold text-[#123B5D] truncate">
                📍 {data.area || "University Town, Peshawar"}
              </span>
              <span className="text-[9.5px] text-slate-500 truncate">
                {data.landmark || "Near Islamia College Gate"}
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right Live GPS Badge */}
        <div className="absolute top-3 right-3 z-[1000] hidden sm:flex items-center gap-1.5 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-700 shadow-2xs border border-slate-200 flex items-center gap-1">
            <span className="text-[#0F766E] font-bold">GPS:</span> Live Map
          </div>
        </div>

        {/* Real Map Mount Container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Map Controls (Bottom-Right) */}
        <div className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1.5">
          {/* Layer Style Switcher */}
          <button
            type="button"
            onClick={() =>
              setCurrentStyleKey((prev) =>
                prev === "streets" ? "dark" : prev === "dark" ? "satellite" : "streets"
              )
            }
            className="p-1.5 sm:p-2 rounded-xl bg-white/95 hover:bg-white text-slate-700 hover:text-[#0F766E] shadow-sm border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
            title="Toggle Map Style (Streets / Voyager / Satellite)"
          >
            <Layers className="size-3.5 sm:size-4" />
            <span className="text-[10px] font-bold capitalize hidden sm:inline">
              {TILE_LAYERS[currentStyleKey].name}
            </span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-white/95 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 sm:p-2 text-slate-700 hover:text-[#0F766E] hover:bg-slate-50 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <Plus className="size-3.5 sm:size-4" />
            </button>
            <div className="w-px h-4 bg-slate-200" />
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 sm:p-2 text-slate-700 hover:text-[#0F766E] hover:bg-slate-50 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <Minus className="size-3.5 sm:size-4" />
            </button>
          </div>

          {/* Recenter Pin */}
          <button
            type="button"
            onClick={handleRecenter}
            className="p-1.5 sm:p-2 rounded-xl bg-white/95 hover:bg-white text-slate-700 hover:text-[#0F766E] shadow-sm border border-slate-200 transition-all cursor-pointer"
            title="Recenter Map Pin"
          >
            <Crosshair
              className={`size-3.5 sm:size-4 ${isLocating ? "animate-spin text-[#0F766E]" : ""}`}
            />
          </button>

          {/* Expand Height */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded((prev) => !prev);
              setTimeout(() => {
                if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
              }, 320);
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-white/95 hover:bg-white text-slate-700 hover:text-[#0F766E] shadow-sm border border-slate-200 transition-all cursor-pointer"
            title={isExpanded ? "Contract Map View" : "Expand Map View"}
          >
            {isExpanded ? (
              <Minimize2 className="size-3.5 sm:size-4" />
            ) : (
              <Maximize2 className="size-3.5 sm:size-4" />
            )}
          </button>
        </div>

        {/* Bottom-Left Coordinates Pill */}
        <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none hidden sm:flex items-center gap-2">
          <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9.5px] font-semibold text-slate-600 shadow-2xs border border-slate-200">
            Coordinates: {currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E
          </div>
        </div>
      </div>

      {/* Quick Peshawar Neighborhood Hotspot Chips */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Sparkles className="size-3 text-[#0F766E]" />
            Popular Peshawar Hotspots:
          </span>
          <span className="text-[10px] text-slate-400">
            Tap to fly to location
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {PESHAWAR_HOTSPOTS.slice(0, 10).map((hotspot) => {
            const isSelected = (data.area || "").toLowerCase() === hotspot.areaKey.toLowerCase();
            return (
              <button
                key={hotspot.id}
                type="button"
                onClick={() => handleSelectHotspot(hotspot)}
                className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                  isSelected
                    ? "bg-[#0F766E] text-white font-bold shadow-2xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {isSelected && <Check className="size-3 stroke-[3]" />}
                <span>{hotspot.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
