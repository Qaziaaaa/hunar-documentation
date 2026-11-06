"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Navigation,
  Loader2,
} from "lucide-react";
import type { PostJobData } from "../types";
import "leaflet/dist/leaflet.css";

export type { PeshawarHotspot } from "./peshawar-map-data";
export {
  PESHAWAR_HOTSPOTS,
  findClosestHotspot,
  getHotspotArea,
  reverseGeocodePeshawar,
} from "./peshawar-map-data";
import {
  reverseGeocodePeshawar,
} from "./peshawar-map-data";


// Tile Layer options with reliable public CDNs
const TILE_LAYERS = {
  streets: {
    name: "Streets",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenStreetMap',
    subdomains: ["a", "b", "c"],
  },
  dark: {
    name: "Clean",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenStreetMap',
    subdomains: ["a", "b", "c"],
  },
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; Esri',
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

  const [currentStyleKey] = useState<"streets" | "dark" | "satellite">("streets");
  const [isLocalLocating, setIsLocalLocating] = useState<boolean>(false);

  // Active coordinates (default to University Town, Peshawar)
  const currentLng = data.longitude ?? 71.5034;
  const currentLat = data.latitude ?? 34.0043;

  // Update position handler (called on map click or marker drag)
  const handlePositionUpdate = useCallback(
    async (lat: number, lng: number) => {
      const geo = await reverseGeocodePeshawar(lat, lng);
      onChange({
        latitude: lat,
        longitude: lng,
        area: geo.area,
        ...(data.address ? { address: data.address } : {}),
        ...(data.landmark ? { landmark: data.landmark } : {}),
      });
    },
    [onChange, data.address, data.landmark]
  );

  // Live GPS locator
  const handleLiveGPSLocate = useCallback(() => {
    if (onAutoDetect) {
      onAutoDetect();
      return;
    }

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocalLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([lat, lng]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
        }

        const geo = await reverseGeocodePeshawar(lat, lng);
        onChange({
          latitude: lat,
          longitude: lng,
          area: geo.area,
          landmark: "",
          address: "",
        });

        setIsLocalLocating(false);
      },
      (err) => {
        console.warn("GPS error:", err);
        setIsLocalLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [onAutoDetect, onChange]);

  // Initialize Leaflet Map on client mount
  useEffect(() => {
    let isCancelled = false;

    async function initLeaflet() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      try {
        const leafletModule = await import("leaflet");
        const L = leafletModule.default || leafletModule;
        LRef.current = L;

        // Patch Leaflet DomUtil.getPosition to prevent '_leaflet_pos' TypeError when unmounting or accessing detached DOM elements
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

        // Patch Leaflet Map.prototype._getMapPanePos to prevent '_leaflet_pos' error when _mapPane is detached
        if (L && L.Map && L.Map.prototype && !(L.Map.prototype as any)._patchedPanePos) {
          const origPanePos = (L.Map.prototype as any)._getMapPanePos;
          (L.Map.prototype as any)._getMapPanePos = function (this: any) {
            if (!this?._mapPane) return new L.Point(0, 0);
            try {
              return origPanePos.call(this) || new L.Point(0, 0);
            } catch {
              return new L.Point(0, 0);
            }
          };
          (L.Map.prototype as any)._patchedPanePos = true;
        }

        if (isCancelled || !mapContainerRef.current) return;

        // Create Leaflet Map instance
        const map = L.map(mapContainerRef.current, {
          center: [currentLat, currentLng],
          zoom: 15,
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
          className: "workerfix-pin-wrapper",
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
          try {
            map.invalidateSize();
          } catch {}
        }, 200);
      } catch (err) {
        console.error("Leaflet initialization error:", err);
      }
    }

    initLeaflet();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch {}
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

  // Reactive Fly-To whenever data.latitude / data.longitude changes from parent, dropdown, or GPS
  useEffect(() => {
    if (!mapInstanceRef.current || !markerInstanceRef.current) return;
    if (data.latitude && data.longitude) {
      const latLng = [data.latitude, data.longitude];
      markerInstanceRef.current.setLatLng(latLng);
      mapInstanceRef.current.flyTo(latLng, mapInstanceRef.current.getZoom() || 15, {
        duration: 0.7,
      });
    }
  }, [data.latitude, data.longitude]);

  const isDetecting = isLocating || isLocalLocating;

  return (
    <div className="w-full h-52 sm:h-56 lg:h-44 xl:h-48 rounded-2xl relative overflow-hidden transition-all duration-300 select-none shadow-xs border border-slate-200 bg-slate-100 z-0">
      {/* Real Map Mount Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Bottom-Left Locate / Current Location Button */}
      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleLiveGPSLocate}
          disabled={isDetecting}
          className="bg-[#0F766E] hover:bg-[#115E59] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md border border-white/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-75"
          title="Detect my exact live GPS location"
        >
          {isDetecting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Navigation className="size-3.5 fill-white" />
          )}
          <span>{isDetecting ? "Locating..." : "Locate me"}</span>
        </button>
      </div>
    </div>
  );
}
