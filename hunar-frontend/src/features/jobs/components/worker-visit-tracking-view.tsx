"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { JobRequest } from "@/types/job";
import { VisitOffer } from "@/types/offer";
import { formatRs } from "@/lib/design-tokens";
import { workerStore } from "@/stores/worker-jobs-store";
import { WorkerChatModal } from "./worker-chat-modal";
import {
  Phone,
  MessageCircle,
  Navigation as NavigationIcon,
  CheckCircle2,
  Copy,
  Check,
  X,
  AlertTriangle,
  Wallet,
  Headphones,
  PhoneCall,
  ShieldCheck,
  MapPin,
  KeyRound,
  Clock,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

interface WorkerVisitTrackingViewProps {
  job: JobRequest;
  offer?: VisitOffer;
  onArrived?: () => void;
}

// Peshawar high-detail road route points
const PESHAWAR_ROAD_POINTS: [number, number][] = [
  [34.004869, 71.511284],
  [34.005201, 71.514086],
  [34.006157, 71.51861],
  [34.006888, 71.524865],
  [34.007397, 71.527823],
  [34.008288, 71.531717],
  [34.008853, 71.534727],
  [34.009398, 71.535448],
  [34.010809, 71.536774],
  [34.011449, 71.536697],
  [34.0145, 71.5358],
  [34.015, 71.535],
];

export function WorkerVisitTrackingView({
  job,
  offer,
  onArrived,
}: WorkerVisitTrackingViewProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isUrdu = locale === "ur";

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const routeBoundsRef = useRef<any>(null);

  const [copiedPin, setCopiedPin] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isArriving, setIsArriving] = useState(false);
  const [routePoints, setRoutePoints] = useState<[number, number][]>(
    PESHAWAR_ROAD_POINTS
  );

  // Customer / Job coordinates
  const customerLat = job.location.coordinates?.lat || 34.015;
  const customerLng = job.location.coordinates?.lng || 71.535;

  // Worker live starting coordinates
  const workerLat = 34.004869;
  const workerLng = 71.511284;

  const agreedVisitCharge =
    offer?.agreedVisitCharge ??
    offer?.visitCharge ??
    job.visitCharge ??
    job.customerSuggestedPrice ??
    800;

  const commissionHold = Math.round(agreedVisitCharge * 0.1);
  const securityPin = job.securityPin || "7294";
  const customerFirstName = job.customer.name.split(" ")[0];

  // Dynamic OSRM Road Route Fetching with Fallback
  useEffect(() => {
    let isCancelled = false;

    async function fetchRoadRoute() {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${workerLng},${workerLat};${customerLng},${customerLat}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (!isCancelled && data?.routes?.[0]?.geometry?.coordinates) {
          const pts = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );
          if (pts.length > 1) {
            setRoutePoints(pts);
          }
        }
      } catch {
        if (!isCancelled) {
          setRoutePoints(PESHAWAR_ROAD_POINTS);
        }
      }
    }

    fetchRoadRoute();
    return () => {
      isCancelled = true;
    };
  }, [customerLat, customerLng, workerLat, workerLng]);

  // Initialize Map with HUNAR Palette
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;

    async function initMap() {
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

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }

      const centerLat = (workerLat + customerLat) / 2;
      const centerLng = (workerLng + customerLng) / 2;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
      });

      mapInstanceRef.current = map;

      // Reliable OpenStreetMap Tile Layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        subdomains: "abc",
      }).addTo(map);

      // HUNAR Brand Teal & Navy Route Path
      if (routePoints && routePoints.length > 1) {
        // High contrast navy casing
        L.polyline(routePoints, {
          color: "#123B5D",
          weight: 7,
          opacity: 0.85,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        // Vibrant brand teal navigation line
        const navLine = L.polyline(routePoints, {
          color: "#0F8B8D",
          weight: 4.5,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        const bounds = navLine.getBounds();
        if (bounds.isValid()) {
          routeBoundsRef.current = bounds;
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 16,
          });
        }
      }

      // 1. Live Technician / Worker Marker (White circle with Navy/Teal badge, worker icon & live pulsating radar ring)
      const workerIcon = L.divIcon({
        className: "ref-worker-icon",
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background: #0F8B8D; opacity: 0.25; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 38px; height: 38px; border-radius: 50%; background: #123B5D; border: 2.8px solid #FFFFFF; box-shadow: 0 4px 14px rgba(18, 59, 93, 0.45); display: flex; align-items: center; justify-content: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
                <path d="M14.7 15.3 16 14l3 3-1.3 1.3a1 1 0 0 1-1.4 0l-1.6-1.6a1 1 0 0 1 0-1.4z"/>
              </svg>
            </div>
            <div style="position: absolute; bottom: -8px; background: #0F8B8D; color: #FFFFFF; font-size: 8.5px; font-weight: 900; padding: 1px 5px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); white-space: nowrap; border: 1px solid rgba(255,255,255,0.4);">
              YOU
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      L.marker([workerLat, workerLng], { icon: workerIcon }).addTo(map);

      // 2. Destination Doorstep Pin Marker
      const destIcon = L.divIcon({
        className: "ref-dest-icon",
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: #123B5D; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 14px rgba(18, 59, 93, 0.45); display: flex; align-items: center; justify-content: center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg);">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div style="background: #123B5D; color: #FFFFFF; font-size: 9.5px; font-weight: 800; padding: 2px 7px; border-radius: 5px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); margin-top: 3px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.25);">
              ${customerFirstName}
            </div>
          </div>
        `,
        iconSize: [38, 52],
        iconAnchor: [19, 36],
      });

      L.marker([customerLat, customerLng], { icon: destIcon }).addTo(map);

      // Force recalculation of map tile dimensions after DOM settle
      setTimeout(() => {
        if (isMounted && mapInstanceRef.current) {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch {}
          if (routeBoundsRef.current) {
            try {
              mapInstanceRef.current.fitBounds(routeBoundsRef.current, {
                padding: [50, 50],
                maxZoom: 16,
              });
            } catch {}
          }
        }
      }, 200);

      setTimeout(() => {
        if (isMounted && mapInstanceRef.current) {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch {}
        }
      }, 500);

      if (mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            try {
              mapInstanceRef.current.invalidateSize();
            } catch {}
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [customerLat, customerLng, workerLat, workerLng, routePoints, customerFirstName]);

  const handleCopyPin = () => {
    navigator.clipboard.writeText(securityPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  // Handle "I'm here" / Reached Doorstep CTA
  const handleReachedDoorstep = () => {
    setErrorMessage(null);
    setIsArriving(true);

    const result = workerStore.arriveAtSite(job.id);
    if (!result.success) {
      setErrorMessage(
        result.error ||
          `Insufficient wallet balance. Minimum ${formatRs(commissionHold)} commission hold required.`
      );
      setIsArriving(false);
      return;
    }

    if (onArrived) {
      onArrived();
    }
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    workerStore.cancelJob(job.id, cancelReason || "Cancelled by worker en route");
    setShowCancelModal(false);
    router.push("/worker/jobs");
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white text-slate-900 font-sans antialiased select-none overflow-hidden w-full max-w-3xl sm:max-w-4xl mx-auto shadow-2xl">
      {/* ======================================================== */}
      {/* 1. TOP HEADER (Cancel visit on left, Headphone Support on right) */}
      {/* ======================================================== */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3 pointer-events-auto">
        <button
          type="button"
          onClick={() => setShowCancelModal(true)}
          className="text-xs sm:text-sm font-bold text-slate-800 hover:text-red-600 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
        >
          {isUrdu ? "وزٹ منسوخ کریں" : "Cancel visit"}
        </button>

        {/* Top-Right: Headphone Support Button */}
        <button
          type="button"
          onClick={() => setShowSupportModal(true)}
          className="size-9 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xs flex items-center justify-center text-[#123B5D] hover:text-[#0F8B8D] hover:bg-white active:scale-95 transition-all cursor-pointer"
          title={isUrdu ? "ہنر سپورٹ" : "Hunar 24/7 Support"}
        >
          <Headphones className="size-4.5" />
        </button>
      </header>

      {/* ======================================================== */}
      {/* 2. MAP AREA (UPPER SECTION) */}
      {/* ======================================================== */}
      <div className="relative w-full flex-1 min-h-[300px] bg-slate-100 overflow-hidden isolate">
        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

        {/* Top Right on Map: Recenter & Zoom Controls */}
        <div className="absolute top-16 right-4 z-20 flex flex-col gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.zoomIn();
              }
            }}
            className="size-8 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md flex items-center justify-center text-slate-800 font-black text-sm hover:bg-white active:scale-95 transition-all cursor-pointer"
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.zoomOut();
              }
            }}
            className="size-8 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md flex items-center justify-center text-slate-800 font-black text-sm hover:bg-white active:scale-95 transition-all cursor-pointer"
            title="Zoom Out"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => {
              if (mapInstanceRef.current && routeBoundsRef.current) {
                mapInstanceRef.current.fitBounds(routeBoundsRef.current, {
                  padding: [50, 50],
                  maxZoom: 16,
                });
              }
            }}
            className="size-8 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md flex items-center justify-center text-[#123B5D] hover:text-[#0F8B8D] hover:bg-white active:scale-95 transition-all cursor-pointer"
            title={isUrdu ? "راستہ دوبارہ مرکوز کریں" : "Recenter Route"}
          >
            <MapPin className="size-4 text-[#0F8B8D]" />
          </button>
        </div>

        {/* Bottom Left on Map: "▲ Navigate" Button */}
        <div className="absolute bottom-6 left-4 z-20 pointer-events-auto">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              job.location.fullAddress
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#123B5D] hover:bg-[#0E2E49] text-white text-xs font-extrabold shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <NavigationIcon className="size-4 fill-white rotate-45" />
            <span>{isUrdu ? "نیویگیٹ کریں" : "Navigate"}</span>
          </a>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. LOWER HALF — BOTTOM SHEET (Polished, Customer Address Only) */}
      {/* ======================================================== */}
      <div className="relative w-full bg-white rounded-t-[28px] -mt-4 z-30 border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] p-4 sm:p-5 flex flex-col justify-between space-y-3.5">
        {/* Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto -mt-1 shrink-0" />

        {/* Error Alert if insufficient wallet balance */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs animate-in fade-in">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* CUSTOMER PROFILE & DESTINATION ADDRESS ROW */}
        <div className="flex items-center justify-between gap-3">
          {/* Left Column: Avatar + First Name + Rating */}
          <div className="flex flex-col items-center shrink-0 w-14 text-center">
            <div className="size-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-extrabold text-[#123B5D] overflow-hidden shadow-2xs">
              {job.customer.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={job.customer.avatarUrl}
                  alt={job.customer.name}
                  className="size-full object-cover"
                />
              ) : (
                job.customer.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <span className="text-xs font-extrabold text-slate-900 mt-1 truncate max-w-full">
              {customerFirstName}
            </span>
            <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 mt-0.5">
              ⭐ {job.customer.rating} <span className="text-slate-400 font-normal">({job.customer.totalReviews})</span>
            </span>
          </div>

          {/* Middle Column: ONLY Customer Destination Address */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start gap-2">
              <div className="size-6 rounded-lg bg-teal-50 text-[#0F8B8D] border border-teal-200 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-slate-900 truncate">
                  {job.location.area}
                </p>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight mt-0.5">
                  {job.location.fullAddress}
                </p>
              </div>
            </div>

            {/* Distance & ETA Info */}
            <div className="flex items-center gap-2 pt-0.5 text-[10.5px] text-slate-500 font-bold pl-8">
              <span className="inline-flex items-center gap-1 text-[#0F8B8D]">
                <NavigationIcon className="size-3 rotate-45 fill-current" />
                {job.location.distanceKm || 2.1} km
              </span>
              <span>·</span>
              <span className="text-slate-600">
                ~{job.etaMinutes || 12} mins away
              </span>
            </div>
          </div>

          {/* Right Column: Sleek Circular Call & Message Buttons */}
          <div className="flex flex-col gap-2 shrink-0">
            {/* Call Button */}
            <button
              type="button"
              onClick={() => setShowCallModal(true)}
              className="size-10.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              title="Call Customer"
            >
              <Phone className="size-4.5 stroke-[2.2]" />
            </button>

            {/* Message Button (Opens Customer-Matched Worker Chat Modal) */}
            <button
              type="button"
              onClick={() => setShowChatModal(true)}
              className="size-10.5 rounded-full bg-[#123B5D] hover:bg-[#0E2E49] text-white shadow-md shadow-[#123B5D]/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              title="Chat with Customer"
            >
              <MessageCircle className="size-4.5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* PAYMENT / FEE & DOORSTEP PIN ROW */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-teal-50 text-[#0F8B8D] border border-teal-200 flex items-center justify-center font-black text-[11px]">
              Rs
            </div>
            <span className="font-black text-[#123B5D] text-sm sm:text-base">
              {formatRs(agreedVisitCharge)}{" "}
              <span className="text-slate-400 font-medium text-xs">· Agreed Visit Fee</span>
            </span>
          </div>

          {/* Doorstep Verification PIN */}
          <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-xs">
            <KeyRound className="size-3.5 text-amber-800 shrink-0" />
            <span className="text-amber-800 text-[10.5px] font-bold">PIN:</span>
            <span className="font-mono font-black text-[#123B5D] text-xs tracking-wider">
              {securityPin}
            </span>
            <button
              type="button"
              onClick={handleCopyPin}
              className="p-1 rounded text-amber-800 hover:text-amber-950 transition-colors cursor-pointer"
              title="Copy PIN"
            >
              {copiedPin ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        </div>

        {/* MAIN PRIMARY CTA BUTTON (HUNAR Gradient: Navy to Teal) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleReachedDoorstep}
            disabled={isArriving}
            className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#123B5D] to-[#0F8B8D] hover:opacity-95 active:scale-[0.99] text-white font-extrabold text-base sm:text-lg shadow-lg shadow-[#0F8B8D]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="size-5 text-teal-200" />
            <span>{isUrdu ? "میں دہلیز پر پہنچ گیا ہوں" : "I'm here (Doorstep)"}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. MODALS (Chat, Call Direct, Cancel, Support) */}
      {/* ======================================================== */}

      {/* Customer-Matched Worker Chat Modal */}
      <WorkerChatModal
        job={job}
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        onCallCustomer={() => {
          setShowChatModal(false);
          setShowCallModal(true);
        }}
      />

      {/* Call Customer Direct Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-teal-50 text-[#0F8B8D] flex items-center justify-center shrink-0">
                <Phone className="size-5 fill-current" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 text-base truncate">
                  Contact {job.customer.name}
                </h3>
                <p className="text-xs text-slate-500">{job.location.area}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Direct Phone Line
              </span>
              <p className="text-lg font-mono font-bold text-[#123B5D]">
                {job.customer.phone}
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCallModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              <a
                href={`tel:${job.customer.phone}`}
                className="flex-1 py-2.5 rounded-xl bg-[#0F8B8D] text-white text-xs font-bold text-center hover:bg-[#0B7F74] transition-colors"
              >
                Dial Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Visit Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <form
            onSubmit={handleCancelSubmit}
            className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Cancel Visit</h3>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel this visit to {job.customer.name}?
            </p>

            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Confirm Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 24/7 Hunar Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-2xl bg-teal-50 text-[#0F8B8D] flex items-center justify-center">
                  <Headphones className="size-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {isUrdu ? "ہنر ہیلپ لائن" : "Hunar Support"}
                  </h3>
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    24/7 Priority Assistance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Job Reference</span>
                <span className="text-xs font-mono font-bold text-[#123B5D]">#{job.id}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                <span className="text-xs text-slate-500 font-medium">Customer</span>
                <span className="text-xs font-bold text-slate-800">{job.customer.name}</span>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href="tel:0800-48627"
                className="w-full py-3 px-4 rounded-xl bg-[#0F8B8D] hover:bg-[#0B7F74] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <PhoneCall className="size-4" />
                <span>{isUrdu ? "ہیلپ لائن پر کال کریں" : "Call Helpline (0800-HUNAR)"}</span>
              </a>

              <a
                href="https://wa.me/923000000000?text=Salam%20Hunar%20Support%2C%20I%20am%20a%20technician%20on%20job%20"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#123B5D] hover:bg-[#0E2E49] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <ShieldCheck className="size-4 text-teal-300" />
                <span>{isUrdu ? "واٹس ایپ سپورٹ" : "WhatsApp Dispatcher"}</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              {isUrdu ? "بند کریں" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
