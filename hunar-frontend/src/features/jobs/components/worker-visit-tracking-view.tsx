"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { JobRequest } from "@/types/job";
import { VisitOffer } from "@/types/offer";
import { formatRs } from "@/lib/design-tokens";
import { connectSocket } from "@/lib/socket";
import { http } from "@/lib/api-client";
import { getWorkerProfile } from "@/services/worker/profile.service";
import { workerStore } from "@/stores/worker-jobs-store";
import { HUNAR_CONFIG } from "@/lib/config";
import dynamic from "next/dynamic";

const WorkerChatModal = dynamic(
  () => import("./worker-chat-modal").then((mod) => mod.WorkerChatModal),
  { ssr: false }
);

const WorkerArrivalOtpModal = dynamic(
  () => import("./worker-arrival-otp-modal").then((mod) => mod.WorkerArrivalOtpModal),
  { ssr: false }
);
import {
  arrivalService,
  SUCCESS_VERIFICATION_MESSAGE,
  SUCCESS_VERIFICATION_MESSAGE_UR,
} from "../services/arrival-verification-service";
import {
  Phone,
  MessageCircle,
  Navigation as NavigationIcon,
  CheckCircle2,
  X,
  AlertTriangle,
  Wallet,
  Headphones,
  PhoneCall,
  ShieldCheck,
  MapPin,
  Clock,
  Loader2,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

interface WorkerVisitTrackingViewProps {
  job: JobRequest;
  offer?: VisitOffer;
  onArrived?: () => void;
}

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
  const leafletRef = useRef<any>(null);
  const routeBoundsRef = useRef<any>(null);
  const workerMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const routeCasingRef = useRef<any>(null);
  const routeNavRef = useRef<any>(null);

  const [showCallModal, setShowCallModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isArriving, setIsArriving] = useState(false);
  const isArrivingRef = useRef(false);
  const [showWorkerOtpModal, setShowWorkerOtpModal] = useState(false);
  const [arrivedAtTime, setArrivedAtTime] = useState<number>(Date.now());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);

  // Customer / Job exact coordinates from job location (fallback to Central Peshawar / Hayatabad if missing)
  const rawCustomerLat = job.location.coordinates?.lat;
  const rawCustomerLng = job.location.coordinates?.lng;
  const hasCustomerCoords =
    typeof rawCustomerLat === "number" &&
    !isNaN(rawCustomerLat) &&
    rawCustomerLat !== 0 &&
    typeof rawCustomerLng === "number" &&
    !isNaN(rawCustomerLng) &&
    rawCustomerLng !== 0;

  const customerLat = hasCustomerCoords ? rawCustomerLat! : 34.0048;
  const customerLng = hasCustomerCoords ? rawCustomerLng! : 71.5113;

  // Worker live coordinates (start with cached GPS or realistic nearby Peshawar coordinates, never (0,0) Null Island)
  const [workerLat, setWorkerLat] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem("hunar_worker_coords");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed?.lat === "number" && !isNaN(parsed.lat) && parsed.lat !== 0) {
            return parsed.lat;
          }
        }
      } catch {}
    }
    return Number((customerLat - 0.015).toFixed(6));
  });

  const [workerLng, setWorkerLng] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem("hunar_worker_coords");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed?.lng === "number" && !isNaN(parsed.lng) && parsed.lng !== 0) {
            return parsed.lng;
          }
        }
      } catch {}
    }
    return Number((customerLng - 0.012).toFixed(6));
  });

  const [isGpsActive, setIsGpsActive] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem("hunar_worker_coords");
        if (raw) {
          const parsed = JSON.parse(raw);
          return Boolean(parsed?.lat && parsed?.lng && parsed.lat !== 0 && parsed.lng !== 0);
        }
      } catch {}
    }
    return false;
  });
  const [workerProfileName, setWorkerProfileName] = useState<string>("Technician");

  useEffect(() => {
    getWorkerProfile()
      .then((p) => {
        if (p?.name || (p as any)?.fullName) {
          setWorkerProfileName(p.name || (p as any).fullName);
        }
      })
      .catch(() => {});
  }, []);

  // Real-time GPS Tracker for Worker
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;

    let lastSent = 0;
    const sendLocationUpdate = async (lat: number, lng: number, acc?: number) => {
      if (!lat || !lng || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;
      setWorkerLat(lat);
      setWorkerLng(lng);
      setIsGpsActive(true);

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("hunar_worker_coords", JSON.stringify({ lat, lng }));
        } catch {}
      }

      if (workerMarkerRef.current) {
        workerMarkerRef.current.setLatLng([lat, lng]);
      }

      // Throttled transmission to backend every 4 seconds
      const now = Date.now();
      if (now - lastSent > 4000 && job?.id) {
        lastSent = now;
        try {
          await http.post(`/location/track?jobId=${job.id}`, {
            latitude: lat,
            longitude: lng,
            accuracy: acc ?? 10,
          });
        } catch (err) {
          console.warn("[Worker GPS] Failed sending location update:", err);
        }
      }
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendLocationUpdate(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      (err) => console.warn("[Worker GPS] Initial position error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        sendLocationUpdate(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      (err) => console.warn("[Worker GPS] Watch error:", err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [job?.id]);

  const agreedVisitCharge =
    offer?.agreedVisitCharge ??
    offer?.visitCharge ??
    job.visitCharge ??
    job.customerSuggestedPrice ??
    (job as any).suggestedVisitCharge ??
    0;

  const commissionHold = Math.round(agreedVisitCharge * 0.1);
  const [currentSecurityPin, setCurrentSecurityPin] = useState<string>(job.securityPin || "");
  const customerFirstName = job.customer.name.split(" ")[0];

  // Live distance and ETA states computed dynamically from worker & customer coordinates
  const [liveDistanceKm, setLiveDistanceKm] = useState<number | null>(null);
  const [liveEtaMinutes, setLiveEtaMinutes] = useState<number | null>(null);

  // Dynamic OSRM Road Route Fetching with Fallback & Real Distance/ETA Extraction
  useEffect(() => {
    let isCancelled = false;

    async function fetchRoadRoute() {
      // Guard against unassigned / privacy-sanitized (0,0) coordinates
      if (
        !customerLat ||
        !customerLng ||
        (customerLat === 0 && customerLng === 0) ||
        !workerLat ||
        !workerLng ||
        (workerLat === 0 && workerLng === 0)
      ) {
        setLiveDistanceKm(null);
        setLiveEtaMinutes(null);
        return;
      }

      // Calculate direct Haversine distance in km as baseline
      const directKm = calculateHaversineKm(workerLat, workerLng, customerLat, customerLng);

      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${workerLng},${workerLat};${customerLng},${customerLat}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (!isCancelled && data?.routes?.[0]) {
          const route = data.routes[0];
          if (route.geometry?.coordinates) {
            const pts = route.geometry.coordinates.map(
              ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
            );
            if (pts.length > 1) {
              setRoutePoints(pts);
            }
          }
          if (typeof route.distance === "number") {
            const km = Number((route.distance / 1000).toFixed(1));
            setLiveDistanceKm(km);
            const mins = km <= 0.05 ? 0 : Math.max(1, Math.round(route.duration / 60));
            setLiveEtaMinutes(mins);
            return;
          }
        }
      } catch {
        if (!isCancelled) {
          // No road route available: fall back to a straight line between the
          // actual worker and customer coordinates (never a fabricated route).
          setRoutePoints([
            [workerLat, workerLng],
            [customerLat, customerLng],
          ]);
        }
      }

      // Fallback: Haversine distance
      if (!isCancelled) {
        const km = Number(directKm.toFixed(1));
        setLiveDistanceKm(km);
        const mins = km <= 0.05 ? 0 : Math.max(1, Math.round((km / 25) * 60));
        setLiveEtaMinutes(mins);
      }
    }

    fetchRoadRoute();
    return () => {
      isCancelled = true;
    };
  }, [customerLat, customerLng, workerLat, workerLng]);

  // Derived user-facing distance and arrival status
  const displayDistanceKm =
    liveDistanceKm !== null
      ? liveDistanceKm
      : typeof job.location.distanceKm === "number"
      ? job.location.distanceKm
      : 0;

  const displayEtaMinutes =
    liveEtaMinutes !== null
      ? liveEtaMinutes
      : typeof job.etaMinutes === "number"
      ? job.etaMinutes
      : 0;

  const isAtDoorstep = Boolean(isGpsActive && liveDistanceKm !== null && liveDistanceKm <= 0.05);

  const distanceText = isAtDoorstep
    ? isUrdu
      ? "دہلیز پر موجود"
      : "At Doorstep"
    : displayDistanceKm > 0 ? `${displayDistanceKm} km` : (isUrdu ? "قریب" : "Nearby");

  const etaText = isAtDoorstep
    ? isUrdu
      ? "پہنچ چکے ہیں"
      : "Arrived"
    : displayEtaMinutes <= 1
    ? isUrdu
      ? "~1 منٹ"
      : "~1 min away"
    : isUrdu
    ? `~${displayEtaMinutes} منٹ`
    : `~${displayEtaMinutes} mins away`;

  // Initialize Map with HUNAR Palette (Mounts once)
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;
    let timer1: any = null;
    let timer2: any = null;

    async function initMap() {
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      // 1. Monkeypatch Leaflet DomUtil.getPosition to prevent '_leaflet_pos' TypeError when unmounting or accessing detached DOM elements
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

      // 2. Monkeypatch Leaflet Map.prototype._getMapPanePos to prevent '_leaflet_pos' error when _mapPane is detached
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

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
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
      leafletRef.current = L;

      // Reliable OpenStreetMap Tile Layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        subdomains: "abc",
      }).addTo(map);

      // HUNAR Brand Teal & Navy Route Path
      const initialPoints =
        routePoints && routePoints.length > 1
          ? routePoints
          : ([[workerLat, workerLng], [customerLat, customerLng]] as [number, number][]);

      // High contrast navy casing
      const casing = L.polyline(initialPoints, {
        color: "#123B5D",
        weight: 7,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
      routeCasingRef.current = casing;

      // Vibrant brand teal navigation line
      const navLine = L.polyline(initialPoints, {
        color: "#0F8B8D",
        weight: 4.5,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
      routeNavRef.current = navLine;

      const bounds = L.latLngBounds(initialPoints);
      if (bounds.isValid()) {
        routeBoundsRef.current = bounds;
        try {
          map.fitBounds(bounds, {
            padding: [60, 60],
            maxZoom: 16,
          });
        } catch {}
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

      workerMarkerRef.current = L.marker([workerLat, workerLng], { icon: workerIcon }).addTo(map);

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

      destMarkerRef.current = L.marker([customerLat, customerLng], { icon: destIcon }).addTo(map);

      // Force recalculation of map tile dimensions after DOM settle
      timer1 = setTimeout(() => {
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

      timer2 = setTimeout(() => {
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
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      leafletRef.current = null;
      workerMarkerRef.current = null;
      destMarkerRef.current = null;
      routeCasingRef.current = null;
      routeNavRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dynamically update route polylines and fit bounds when road route changes
  useEffect(() => {
    if (!mapInstanceRef.current || !routePoints || routePoints.length < 2) return;
    if (routeCasingRef.current) {
      routeCasingRef.current.setLatLngs(routePoints);
    }
    if (routeNavRef.current) {
      routeNavRef.current.setLatLngs(routePoints);
      try {
        const bounds = routeNavRef.current.getBounds();
        if (bounds.isValid()) {
          routeBoundsRef.current = bounds;
          mapInstanceRef.current.fitBounds(bounds, {
            padding: [60, 60],
            maxZoom: 16,
          });
        }
      } catch {}
    }
  }, [routePoints]);

  // Dynamically update worker marker position and polyline when GPS coordinates update
  useEffect(() => {
    if (!workerLat || !workerLng || (workerLat === 0 && workerLng === 0)) return;
    if (workerMarkerRef.current) {
      workerMarkerRef.current.setLatLng([workerLat, workerLng]);
    }
    // If no multi-point road route is active, keep direct line between worker and customer updated
    if (
      mapInstanceRef.current &&
      (!routePoints || routePoints.length < 2) &&
      routeNavRef.current &&
      routeCasingRef.current
    ) {
      const directLine: [number, number][] = [
        [workerLat, workerLng],
        [customerLat, customerLng],
      ];
      routeCasingRef.current.setLatLngs(directLine);
      routeNavRef.current.setLatLngs(directLine);
      const b = routeNavRef.current.getBounds();
      if (b.isValid()) {
        routeBoundsRef.current = b;
      }
    }
  }, [workerLat, workerLng, customerLat, customerLng, routePoints]);

  // Dynamically update customer marker position if customer coordinates change
  useEffect(() => {
    if (destMarkerRef.current) {
      destMarkerRef.current.setLatLng([customerLat, customerLng]);
    }
  }, [customerLat, customerLng]);


  // Real-time socket listener for customer OTP verification across devices/browsers
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    // Join job room so worker also receives broadcasts sent to jobRoom(job.id)
    if (job?.id) {
      socket.emit("location:track:start", { jobId: job.id });
    }

    const onConnect = () => {
      if (job?.id) {
        socket.emit("location:track:start", { jobId: job.id });
      }
    };
    socket.on("connect", onConnect);

    const handleOtpVerified = (payload: any) => {
      const normJobId = job.id?.toLowerCase();
      const payloadJobId = payload?.jobId?.toLowerCase();
      const payloadVisitId = payload?.visitId;
      const expectedVisitId = (job as any)?.visitId || (job as any)?.nextVisit?.id;

      if (
        !payloadJobId ||
        payloadJobId === normJobId ||
        (payloadVisitId && payloadVisitId === expectedVisitId)
      ) {
        arrivalService.verifyOtpSuccess({ jobId: job.id, ...payload });
        setShowWorkerOtpModal(false);
        setIsArriving(false);
        const successMsg = isUrdu ? SUCCESS_VERIFICATION_MESSAGE_UR : SUCCESS_VERIFICATION_MESSAGE;
        setSuccessMessage(successMsg);
        workerStore.arriveAtSite(job.id);
        workerStore.startInspection(job.id);
        if (onArrived) {
          onArrived();
        }
      }
    };

    const handleJobStatusChanged = (payload: any) => {
      const normJobId = job.id?.toLowerCase();
      const payloadJobId = payload?.jobId?.toLowerCase();
      if (
        payload &&
        (!payloadJobId || payloadJobId === normJobId) &&
        (payload.newStatus === "VISIT_COMPLETED" ||
          payload.newStatus === "IN_PREMISES" ||
          payload.newStatus === "INSPECTION_DONE")
      ) {
        handleOtpVerified(payload);
      }
    };

    socket.on("visit:otp:verified", handleOtpVerified);
    socket.on("visit.otp.verified", handleOtpVerified);
    socket.on("job:statusChanged", handleJobStatusChanged);
    socket.on("job:status:changed", handleJobStatusChanged);

    return () => {
      socket.off("connect", onConnect);
      socket.off("visit:otp:verified", handleOtpVerified);
      socket.off("visit.otp.verified", handleOtpVerified);
      socket.off("job:statusChanged", handleJobStatusChanged);
      socket.off("job:status:changed", handleJobStatusChanged);
    };
  }, [job.id, onArrived, isUrdu]);

  // Safety net polling: while worker OTP modal is open, poll visit status every 2 seconds
  useEffect(() => {
    if (!showWorkerOtpModal && !isArriving) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const visitId = (job as any)?.visitId || (job as any)?.nextVisit?.id || job.id;
        const res: any = await http.get(`/visits/${visitId}`).catch(() => null);
        if (!res || !isMounted) return;

        const visitStatus = (res.status || res.visitStatus || "").toUpperCase();
        const jobStatus = (res.job?.status || res.jobStatus || "").toUpperCase();

        if (
          visitStatus === "COMPLETED" ||
          jobStatus === "VISIT_COMPLETED" ||
          jobStatus === "INSPECTION_DONE" ||
          res.isArrivalPending === false
        ) {
          setShowWorkerOtpModal(false);
          setIsArriving(false);
          const successMsg = isUrdu ? SUCCESS_VERIFICATION_MESSAGE_UR : SUCCESS_VERIFICATION_MESSAGE;
          setSuccessMessage(successMsg);
          arrivalService.verifyOtpSuccess({ jobId: job.id });
          workerStore.arriveAtSite(job.id);
          workerStore.startInspection(job.id);
          if (onArrived) {
            onArrived();
          }
        }
      } catch {
        // ignore background poll errors
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [showWorkerOtpModal, isArriving, job.id, isUrdu, onArrived]);

  // Subscribe to real-time arrival OTP verification
  useEffect(() => {
    const unsubscribe = arrivalService.subscribe((session, eventType) => {
      const normJobId = job.id?.toLowerCase();
      const sessionJobId = session?.jobId?.toLowerCase();

      if (
        session &&
        (!sessionJobId || sessionJobId === normJobId || session.otp === currentSecurityPin) &&
        (eventType === "OTP_VERIFIED" || session.status === "otp_verified")
      ) {
        setShowWorkerOtpModal(false);
        setIsArriving(false);
        const successMsg = isUrdu ? SUCCESS_VERIFICATION_MESSAGE_UR : SUCCESS_VERIFICATION_MESSAGE;
        setSuccessMessage(successMsg);

        workerStore.arriveAtSite(job.id);
        workerStore.startInspection(job.id);
        if (onArrived) {
          onArrived();
        }
      }
    });

    return () => unsubscribe();
  }, [job.id, currentSecurityPin, isUrdu, onArrived]);

  // Handle "I'm here" / Reached Doorstep CTA
  const handleReachedDoorstep = async () => {
    if (isArriving || isArrivingRef.current) return;
    setErrorMessage(null);

    // Active jobs proceed without blocking arrival; wallet deduction applies normally

    // Instantly generate/retrieve 4-digit arrival OTP
    const optimisticOtp =
      currentSecurityPin ||
      (job as any)?.activeArrivalOtp ||
      Math.floor(1000 + Math.random() * 9000).toString();
    const now = Date.now();

    // Instantly open OTP modal (0ms latency, zero button freeze)
    setCurrentSecurityPin(optimisticOtp);
    setArrivedAtTime(now);
    setShowWorkerOtpModal(true);

    arrivalService.startArrivalSession({
      jobId: job.id,
      visitId: (job as any)?.visitId || (job as any)?.nextVisit?.id,
      otp: optimisticOtp,
      workerName: workerProfileName || "Technician",
      customerName: job.customer.name,
      customerAddress: job.location.fullAddress || (job.location as any).address || job.location.area,
    });

    try {
      isArrivingRef.current = true;
      setIsArriving(true);
      const res = await workerStore.arriveAtDoorstep(job.id, optimisticOtp);
      if (!res.success) {
        setShowWorkerOtpModal(false);
        setErrorMessage(res.error || "Failed to notify arrival");
        return;
      }

      const realOtp = res.otp || optimisticOtp;
      if (realOtp !== optimisticOtp) {
        setCurrentSecurityPin(realOtp);
      }
      if (res.arrivedAt) {
        setArrivedAtTime(res.arrivedAt);
      }

      arrivalService.startArrivalSession({
        jobId: job.id,
        visitId: res.visitId,
        otp: realOtp,
        workerName: workerProfileName || "Technician",
        customerName: job.customer.name,
        customerAddress: job.location.fullAddress || (job.location as any).address || job.location.area,
      });
    } catch (err: any) {
      setShowWorkerOtpModal(false);
      setErrorMessage(err?.message || "Failed to notify arrival");
    } finally {
      isArrivingRef.current = false;
      setIsArriving(false);
    }
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    workerStore.cancelJob(job.id, cancelReason || "Cancelled by worker en route");
    setShowCancelModal(false);
    router.push("/worker/jobs");
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col lg:flex-row bg-slate-100 text-slate-900 font-sans antialiased select-none overflow-hidden w-full">
      {/* ======================================================== */}
      {/* 1. MOBILE TOP HEADER (Cancel visit on left, Headphone Support on right) */}
      {/* ======================================================== */}
      <header className="absolute top-0 inset-x-0 z-30 flex lg:hidden items-center justify-between px-4 py-3 pointer-events-auto">
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
          title={isUrdu ? "WorkerFIX سپورٹ" : "WorkerFIX 24/7 Support"}
        >
          <Headphones className="size-4.5" />
        </button>
      </header>

      {/* ======================================================== */}
      {/* 2. MAP AREA (Full height on desktop, upper half on mobile) */}
      {/* ======================================================== */}
      <div className="relative w-full lg:flex-1 h-full min-h-[300px] lg:min-h-0 bg-slate-100 overflow-hidden isolate flex flex-col">
        {/* Desktop Top Floating Header Bar */}
        <div className="hidden lg:flex absolute top-5 inset-x-6 z-30 items-center justify-between pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="text-xs font-bold text-slate-700 hover:text-red-600 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/90 shadow-sm transition-all hover:bg-red-50 cursor-pointer flex items-center gap-1.5"
          >
            <span>{isUrdu ? "وزٹ منسوخ کریں" : "Cancel visit"}</span>
          </button>

          {/* Status Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm text-xs font-extrabold text-[#123B5D]">
            <span className="size-2 rounded-full bg-[#0F8B8D] animate-ping" />
            <span>
              {isUrdu ? "راستے میں · کسٹمر کی دہلیز روانگی" : "Live Navigation · En Route to Customer"}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-[#0F8B8D]">
              {isAtDoorstep
                ? (isUrdu ? "دہلیز پر موجود" : "At Doorstep")
                : isGpsActive
                ? `${etaText} (${distanceText})`
                : (isUrdu ? "GPS سگنل کا انتظار..." : "Awaiting GPS Signal...")}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowSupportModal(true)}
            className="h-9 px-3.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm flex items-center gap-2 text-xs font-bold text-[#123B5D] hover:text-[#0F8B8D] hover:bg-white active:scale-95 transition-all cursor-pointer"
            title={isUrdu ? "WorkerFIX سپورٹ" : "WorkerFIX 24/7 Support"}
          >
            <Headphones className="size-4" />
            <span>{isUrdu ? "مدد / سپورٹ" : "24/7 Support"}</span>
          </button>
        </div>

        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

        {/* Top Right on Map: Recenter & Zoom Controls */}
        <div className="absolute top-16 lg:top-20 right-4 z-20 flex flex-col gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.zoomIn();
              }
            }}
            className="size-8 sm:size-9 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md flex items-center justify-center text-slate-800 font-black text-sm hover:bg-white active:scale-95 transition-all cursor-pointer"
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
            className="size-8 sm:size-9 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md flex items-center justify-center text-slate-800 font-black text-sm hover:bg-white active:scale-95 transition-all cursor-pointer"
            title="Zoom Out"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => {
              if (mapInstanceRef.current) {
                if (routeBoundsRef.current && routeBoundsRef.current.isValid()) {
                  mapInstanceRef.current.fitBounds(routeBoundsRef.current, {
                    padding: [60, 60],
                    maxZoom: 16,
                  });
                } else if (leafletRef.current && workerLat && workerLng && customerLat && customerLng) {
                  const b = leafletRef.current.latLngBounds([
                    [workerLat, workerLng],
                    [customerLat, customerLng],
                  ]);
                  mapInstanceRef.current.fitBounds(b, {
                    padding: [60, 60],
                    maxZoom: 16,
                  });
                } else {
                  mapInstanceRef.current.setView([customerLat, customerLng], 15);
                }
              }
            }}
            className="size-8 sm:size-9 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md flex items-center justify-center text-[#123B5D] hover:text-[#0F8B8D] hover:bg-white active:scale-95 transition-all cursor-pointer"
            title={isUrdu ? "راستہ دوبارہ مرکوز کریں" : "Recenter Route"}
          >
            <MapPin className="size-4 text-[#0F8B8D]" />
          </button>
        </div>

        {/* Bottom Left on Map: "▲ Navigate" Button */}
        <div className="absolute bottom-6 left-4 z-20 pointer-events-auto">
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${workerLat},${workerLng}&destination=${customerLat},${customerLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#123B5D] hover:bg-[#0E2E49] text-white text-xs font-extrabold shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <NavigationIcon className="size-4 fill-white rotate-45" />
            <span>{isUrdu ? "گوگل میپس میں کھولیں" : "Navigate in Google Maps"}</span>
          </a>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3A. MOBILE BOTTOM SHEET (Untouched for mobile < lg) */}
      {/* ======================================================== */}
      <div className="relative w-full bg-white rounded-t-[28px] -mt-4 z-30 border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] p-4 sm:p-5 flex flex-col justify-between space-y-3.5 lg:hidden">
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
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              ) : null}
              {(!job.customer.avatarUrl) && (
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
                {distanceText}
              </span>
              <span>·</span>
              <span className="text-slate-600">
                {etaText}
              </span>
            </div>
          </div>

          {/* Right Column: Sleek Circular Call & Message Buttons */}
          <div className="flex flex-col gap-2 shrink-0">
            {/* Call Button */}
            <button
              type="button"
              onClick={() => setShowCallModal(true)}
              className="size-10.5 rounded-full bg-success hover:bg-success/90 text-white shadow-md shadow-success/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              title="Call Customer"
            >
              <Phone className="size-4.5 stroke-[2.2]" />
            </button>

            {/* Message Button (Opens Customer-Matched Worker Chat Modal) */}
            <button
              type="button"
              onClick={() => setShowChatModal(true)}
              className="size-10.5 rounded-full bg-teal hover:bg-teal/90 text-white shadow-md shadow-teal/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              title="Chat with Customer"
            >
              <MessageCircle className="size-4.5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* PAYMENT / FEE ROW */}
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
        </div>

        {/* MAIN PRIMARY CTA BUTTON (HUNAR Gradient: Navy to Teal) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleReachedDoorstep}
            disabled={isArriving}
            className={`w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#123B5D] to-[#0F8B8D] text-white font-extrabold text-base sm:text-lg shadow-lg shadow-[#0F8B8D]/25 transition-all flex items-center justify-center gap-2 ${
              isArriving
                ? "opacity-80 cursor-wait pointer-events-none"
                : "hover:opacity-95 active:scale-[0.99] cursor-pointer"
            }`}
          >
            {isArriving ? (
              <>
                <Loader2 className="size-5 text-teal-200 animate-spin" />
                <span>{isUrdu ? "اطلاع دی جا رہی ہے..." : "Notifying Customer..."}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-5 text-teal-200" />
                <span>{isUrdu ? "میں دہلیز پر پہنچ گیا ہوں" : "I'm here (Doorstep)"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3B. DESKTOP SIDEBAR CONTROL PANEL (Shown only on lg+) */}
      {/* ======================================================== */}
      <aside className="hidden lg:flex lg:w-[420px] xl:w-[460px] h-full bg-white border-l border-slate-200/90 flex-col justify-between p-6 z-30 shadow-xl overflow-y-auto scrollbar-none no-scrollbar">
        <div className="space-y-6">
          {/* Top Title Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold text-[#0F8B8D] uppercase tracking-wider block">
                {isUrdu ? "لائیو وزٹ کنٹرول" : "Live Visit Control"}
              </span>
              <h2 className="text-lg font-black text-[#123B5D]">
                {job.title}
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ACTIVE</span>
            </span>
          </div>

          {/* Customer Profile Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-sm font-extrabold text-[#123B5D] overflow-hidden shadow-2xs shrink-0">
                  {job.customer.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.customer.avatarUrl}
                      alt={job.customer.name}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : null}
                  {(!job.customer.avatarUrl) && (
                    job.customer.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-slate-900 truncate">
                      {job.customer.name}
                    </span>
                    <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    ⭐ {job.customer.rating} ({job.customer.totalReviews} reviews)
                  </p>
                </div>
              </div>

              {/* Direct Communication Quick Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCallModal(true)}
                  className="size-10 rounded-xl bg-success/10 text-success hover:bg-success hover:text-white border border-success/20 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title="Call Customer"
                >
                  <Phone className="size-4 stroke-[2.2]" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowChatModal(true)}
                  className="size-10 rounded-xl bg-teal/10 text-teal hover:bg-teal hover:text-white border border-teal/20 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title="Chat with Customer"
                >
                  <MessageCircle className="size-4 stroke-[2.2]" />
                </button>
              </div>
            </div>
          </div>

          {/* Destination & Route Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <div className="size-8 rounded-xl bg-teal-50 text-[#0F8B8D] border border-teal-200 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isUrdu ? "کسٹمر کا پتہ" : "Destination Doorstep"}
                </span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {job.location.area}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  {job.location.fullAddress}
                </p>
                {job.location.landmark && (
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Landmark: {job.location.landmark}
                  </p>
                )}
              </div>
            </div>

            {/* Route ETA pill */}
            <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between text-xs font-bold border border-slate-200/80">
              <span className="text-slate-600 flex items-center gap-1.5">
                <NavigationIcon className="size-3.5 rotate-45 text-[#0F8B8D]" />
                <span>{distanceText}</span>
              </span>
              <span className="text-[#0F8B8D] flex items-center gap-1">
                <Clock className="size-3.5" />
                <span>{etaText}</span>
              </span>
            </div>
          </div>

          {/* Agreed Visit Fee Summary */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Agreed Visit Charge</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {formatRs(agreedVisitCharge)}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Desktop Bottom Action Button */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <button
            type="button"
            onClick={handleReachedDoorstep}
            disabled={isArriving}
            className={`w-full py-4 rounded-2xl bg-gradient-to-r from-[#123B5D] to-[#0F8B8D] text-white font-extrabold text-base shadow-lg shadow-[#0F8B8D]/25 transition-all flex items-center justify-center gap-2.5 ${
              isArriving
                ? "opacity-80 cursor-wait pointer-events-none"
                : "hover:opacity-95 active:scale-[0.99] cursor-pointer"
            }`}
          >
            {isArriving ? (
              <>
                <Loader2 className="size-5 text-teal-200 animate-spin" />
                <span>{isUrdu ? "اطلاع دی جا رہی ہے..." : "Notifying Customer..."}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-5 text-teal-200" />
                <span>{isUrdu ? "میں دہلیز پر پہنچ گیا ہوں" : "I'm here (Doorstep)"}</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-center text-slate-400">
            {isUrdu
              ? "پہنچنے کے بعد کسٹمر 4 ہندسوں کا سیکیورٹی پن فراہم کرے گا۔"
              : "Customer will provide the 4-digit security PIN on arrival."}
          </p>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 4. MODALS (Chat, Call Direct, Cancel, Support) */}
      {/* ======================================================== */}

      {/* Customer-Matched Worker Chat Modal */}
      {showChatModal && (
        <WorkerChatModal
          job={job}
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          onCallCustomer={() => {
            setShowChatModal(false);
            setShowCallModal(true);
          }}
        />
      )}

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

      {/* 24/7 WorkerFIX Support Modal */}
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
                    {isUrdu ? "WorkerFIX ہیلپ لائن" : "WorkerFIX Support"}
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
                href={`tel:${HUNAR_CONFIG.rawSupportPhone}`}
                className="w-full py-3 px-4 rounded-xl bg-[#0F8B8D] hover:bg-[#0B7F74] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <PhoneCall className="size-4" />
                <span>{isUrdu ? "ہیلپ لائن پر کال کریں" : `Call Helpline (${HUNAR_CONFIG.supportPhone})`}</span>
              </a>

              <a
                href={`https://wa.me/${HUNAR_CONFIG.rawWhatsapp}?text=Salam%20WorkerFIX%20Support%2C%20I%20am%20a%20technician%20on%20job%20`}
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

      {/* Success Toast Banner */}
      {successMessage && (
        <div className="fixed top-5 inset-x-4 z-50 max-w-md mx-auto bg-[#0F766E] text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="size-6 text-emerald-300 shrink-0" />
          <p className="text-xs sm:text-sm font-bold leading-snug">{successMessage}</p>
        </div>
      )}

      {/* Worker Doorstep OTP Modal */}
      {showWorkerOtpModal && (
        <WorkerArrivalOtpModal
          isOpen={showWorkerOtpModal}
          otp={currentSecurityPin}
          arrivedAt={arrivedAtTime}
          jobId={job.id}
          customerName={job.customer.name}
          onClose={() => setShowWorkerOtpModal(false)}
          isUrdu={isUrdu}
        />
      )}
    </div>
  );
}
