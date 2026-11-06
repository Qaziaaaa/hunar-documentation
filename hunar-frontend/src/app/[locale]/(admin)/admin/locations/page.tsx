"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/features/admin/api/admin-api";
import type { AreaItem, CityItem } from "@/types/admin";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Compass,
  Filter,
  Info,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

export default function LocationsManagementPage() {
  // Tab state: "cities" | "areas"
  const [activeTab, setActiveTab] = useState<"cities" | "areas">("cities");

  // Data states
  const [cities, setCities] = useState<CityItem[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("ALL");

  // City modal state (create / edit)
  const [cityModalMode, setCityModalMode] = useState<"create" | "edit" | null>(null);
  const [editingCity, setEditingCity] = useState<CityItem | null>(null);
  const [cityName, setCityName] = useState("");
  const [cityNameUrdu, setCityNameUrdu] = useState("");
  const [savingCity, setSavingCity] = useState(false);
  const [cityFormError, setCityFormError] = useState<string | null>(null);

  // Area modal state (create / edit)
  const [areaModalMode, setAreaModalMode] = useState<"create" | "edit" | null>(null);
  const [editingArea, setEditingArea] = useState<AreaItem | null>(null);
  const [areaName, setAreaName] = useState("");
  const [areaNameUrdu, setAreaNameUrdu] = useState("");
  const [areaCityId, setAreaCityId] = useState("");
  const [savingArea, setSavingArea] = useState(false);
  const [areaFormError, setAreaFormError] = useState<string | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "city" | "area";
    id: string;
    name: string;
    subCount?: number;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toggling state
  const [togglingCityId, setTogglingCityId] = useState<string | null>(null);
  const [togglingAreaId, setTogglingAreaId] = useState<string | null>(null);

  // Success toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Load cities and areas
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setPageError(null);

    Promise.all([adminApi.listCities(), adminApi.listAreas()])
      .then(([citiesData, areasData]) => {
        if (!alive) return;
        setCities(citiesData);
        setAreas(areasData);
      })
      .catch((err) => {
        if (!alive) return;
        setPageError(
          err instanceof Error ? err.message : "Failed to load cities and areas data",
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [reloadKey]);

  // ----------------------------------------------------
  // City Actions
  // ----------------------------------------------------
  const handleOpenCreateCity = () => {
    setCityModalMode("create");
    setEditingCity(null);
    setCityName("");
    setCityNameUrdu("");
    setCityFormError(null);
  };

  const handleOpenEditCity = (city: CityItem) => {
    setCityModalMode("edit");
    setEditingCity(city);
    setCityName(city.name);
    setCityNameUrdu(city.nameUrdu ?? "");
    setCityFormError(null);
  };

  const handleCloseCityModal = () => {
    setCityModalMode(null);
    setEditingCity(null);
    setCityName("");
    setCityNameUrdu("");
    setCityFormError(null);
    setSavingCity(false);
  };

  const handleSaveCity = async () => {
    const trimmed = cityName.trim();
    if (!trimmed) {
      setCityFormError("City name is required.");
      return;
    }

    setSavingCity(true);
    setCityFormError(null);

    try {
      if (cityModalMode === "edit" && editingCity) {
        const updated = await adminApi.updateCity(editingCity.id, {
          name: trimmed,
          nameUrdu: cityNameUrdu.trim() || undefined,
        });
        setCities((prev) =>
          prev.map((c) => (c.id === editingCity.id ? { ...c, ...updated } : c)),
        );
        // Also update city name in areas list if present
        setAreas((prev) =>
          prev.map((a) => (a.cityId === editingCity.id ? { ...a, cityName: trimmed } : a)),
        );
        setToastMessage(`City "${trimmed}" updated successfully.`);
      } else {
        const created = await adminApi.createCity({
          name: trimmed,
          nameUrdu: cityNameUrdu.trim() || undefined,
        });
        setCities((prev) => [...prev, created]);
        setToastMessage(`City "${trimmed}" created successfully.`);
      }
      handleCloseCityModal();
    } catch (err) {
      setCityFormError(err instanceof Error ? err.message : "Failed to save city.");
    } finally {
      setSavingCity(false);
    }
  };

  const handleViewCityAreas = (city: CityItem) => {
    setSelectedCityFilter(city.id);
    setActiveTab("areas");
    setSearchQuery("");
  };

  const handleToggleCity = async (id: string) => {
    const target = cities.find((c) => c.id === id);
    if (!target || togglingCityId === id) return;

    const nextActive = !target.isActive;
    setTogglingCityId(id);
    setPageError(null);
    try {
      await adminApi.toggleCity(id, nextActive);
      setCities((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: nextActive } : c)),
      );
      // When a city is turned off, also turn off all areas belonging to that city
      if (!nextActive) {
        setAreas((prev) =>
          prev.map((a) => (a.cityId === id ? { ...a, isActive: false } : a)),
        );
      }
      setToastMessage(
        nextActive
          ? `City "${target.name}" is now active.`
          : `City "${target.name}" and all its areas are now deactivated.`,
      );
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to update city status.");
    } finally {
      setTogglingCityId(null);
    }
  };

  // ----------------------------------------------------
  // Area Actions
  // ----------------------------------------------------
  const handleOpenCreateArea = () => {
    setAreaModalMode("create");
    setEditingArea(null);
    setAreaName("");
    setAreaNameUrdu("");
    // Default to selected filter city or first available city
    if (selectedCityFilter !== "ALL") {
      setAreaCityId(selectedCityFilter);
    } else if (cities.length > 0) {
      setAreaCityId(cities[0].id);
    } else {
      setAreaCityId("");
    }
    setAreaFormError(null);
  };

  const handleOpenEditArea = (area: AreaItem) => {
    setAreaModalMode("edit");
    setEditingArea(area);
    setAreaName(area.name);
    setAreaNameUrdu(area.nameUrdu ?? "");
    setAreaCityId(area.cityId);
    setAreaFormError(null);
  };

  const handleCloseAreaModal = () => {
    setAreaModalMode(null);
    setEditingArea(null);
    setAreaName("");
    setAreaNameUrdu("");
    setAreaCityId("");
    setAreaFormError(null);
    setSavingArea(false);
  };

  const handleSaveArea = async () => {
    const trimmed = areaName.trim();
    if (!trimmed) {
      setAreaFormError("Area name is required.");
      return;
    }
    if (!areaCityId) {
      setAreaFormError("Please select a parent city.");
      return;
    }

    setSavingArea(true);
    setAreaFormError(null);

    try {
      if (areaModalMode === "edit" && editingArea) {
        const updated = await adminApi.updateArea(editingArea.id, {
          name: trimmed,
          nameUrdu: areaNameUrdu.trim() || undefined,
          cityId: areaCityId,
        });
        const parentCity = cities.find((c) => c.id === areaCityId);
        setAreas((prev) =>
          prev.map((a) =>
            a.id === editingArea.id
              ? {
                  ...a,
                  ...updated,
                  cityName: parentCity ? parentCity.name : a.cityName,
                }
              : a,
          ),
        );
        // Refresh cities to update areasCount if parent changed
        if (editingArea.cityId !== areaCityId) {
          setReloadKey((k) => k + 1);
        }
        setToastMessage(`Area "${trimmed}" updated successfully.`);
      } else {
        const created = await adminApi.createArea({
          name: trimmed,
          nameUrdu: areaNameUrdu.trim() || undefined,
          cityId: areaCityId,
        });
        const parentCity = cities.find((c) => c.id === areaCityId);
        const enrichedCreated: AreaItem = {
          ...created,
          cityName: parentCity ? parentCity.name : "Unknown",
        };
        setAreas((prev) => [...prev, enrichedCreated]);
        // Increment parent city's areasCount locally
        setCities((prev) =>
          prev.map((c) =>
            c.id === areaCityId ? { ...c, areasCount: (c.areasCount ?? 0) + 1 } : c,
          ),
        );
        setToastMessage(`Area "${trimmed}" created successfully.`);
      }
      handleCloseAreaModal();
    } catch (err) {
      setAreaFormError(err instanceof Error ? err.message : "Failed to save area.");
    } finally {
      setSavingArea(false);
    }
  };

  const handleToggleArea = async (id: string) => {
    const target = areas.find((a) => a.id === id);
    if (!target || togglingAreaId === id) return;

    const parentCity = cities.find((c) => c.id === target.cityId);
    if (!target.isActive && parentCity && !parentCity.isActive) {
      setPageError(
        `Cannot activate "${target.name}" because its parent city "${parentCity.name}" is deactivated. Please activate ${parentCity.name} first.`,
      );
      return;
    }

    const nextActive = !target.isActive;
    setTogglingAreaId(id);
    setPageError(null);
    try {
      await adminApi.toggleArea(id, nextActive);
      setAreas((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: nextActive } : a)),
      );
      setToastMessage(
        `Area "${target.name}" is now ${nextActive ? "active" : "inactive"}.`,
      );
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to update area status.");
    } finally {
      setTogglingAreaId(null);
    }
  };

  // ----------------------------------------------------
  // Deletion Actions
  // ----------------------------------------------------
  const handleOpenDelete = (
    type: "city" | "area",
    id: string,
    name: string,
    subCount?: number,
  ) => {
    setDeleteTarget({ type, id, name, subCount });
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      if (deleteTarget.type === "city") {
        await adminApi.deleteCity(deleteTarget.id);
        setCities((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setAreas((prev) => prev.filter((a) => a.cityId !== deleteTarget.id));
        setToastMessage(`City "${deleteTarget.name}" deleted.`);
      } else {
        await adminApi.deleteArea(deleteTarget.id);
        const removed = areas.find((a) => a.id === deleteTarget.id);
        setAreas((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        if (removed) {
          setCities((prev) =>
            prev.map((c) =>
              c.id === removed.cityId
                ? { ...c, areasCount: Math.max(0, (c.areasCount ?? 1) - 1) }
                : c,
            ),
          );
        }
        setToastMessage(`Area "${deleteTarget.name}" deleted.`);
      }
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : `Failed to delete ${deleteTarget.type}. Ensure there are no active dependencies or try deactivating instead.`,
      );
    } finally {
      setDeleting(false);
    }
  };

  // ----------------------------------------------------
  // Filtered views
  // ----------------------------------------------------
  const filteredCities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.nameUrdu && c.nameUrdu.toLowerCase().includes(q)),
    );
  }, [cities, searchQuery]);

  const filteredAreas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return areas.filter((a) => {
      const matchesCity =
        selectedCityFilter === "ALL" || a.cityId === selectedCityFilter;
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        (a.nameUrdu && a.nameUrdu.toLowerCase().includes(q)) ||
        (a.cityName && a.cityName.toLowerCase().includes(q));
      return matchesCity && matchesSearch;
    });
  }, [areas, searchQuery, selectedCityFilter]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-xs font-bold text-emerald-800 shadow-xl transition-all">
          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Page Error Banner */}
      {pageError && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <span className="flex items-center gap-2 text-sm font-bold text-red-700">
            <AlertCircle className="size-4 shrink-0" /> {pageError}
          </span>
          <button
            type="button"
            onClick={() => {
              setPageError(null);
              setReloadKey((k) => k + 1);
            }}
            className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end sm:pt-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
              <MapPin className="size-3.5" /> Regions & Locations
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
            Cities & Areas Management
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage operational cities and localized service areas, monitor coverage, or toggle location availability
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:self-end">
          {activeTab === "cities" ? (
            <button
              type="button"
              onClick={handleOpenCreateCity}
              className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-navy/90"
            >
              <Plus className="size-4 text-teal-300" /> Add New City
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenCreateArea}
              disabled={cities.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="size-4 text-teal-300" /> Add New Area
            </button>
          )}
        </div>
      </div>

      {/* Segmented Control + Search & Filters Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Toggle / Segmented Control */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setActiveTab("cities");
              setSearchQuery("");
            }}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "cities"
                ? "bg-white text-navy shadow-xs"
                : "text-slate-500 hover:text-navy"
            }`}
          >
            <Building2 className="size-4" />
            Cities
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                activeTab === "cities"
                  ? "bg-navy/10 text-navy"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {cities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("areas");
              setSearchQuery("");
            }}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "areas"
                ? "bg-white text-navy shadow-xs"
                : "text-slate-500 hover:text-navy"
            }`}
          >
            <MapPin className="size-4" />
            Areas
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                activeTab === "areas"
                  ? "bg-navy/10 text-navy"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {areas.length}
            </span>
          </button>
        </div>

        {/* Search & Secondary Filter */}
        <div className="flex flex-1 flex-col gap-2.5 sm:max-w-md sm:flex-row sm:items-center sm:justify-end">
          {activeTab === "areas" && cities.length > 0 && (
            <div className="relative shrink-0">
              <select
                value={selectedCityFilter}
                onChange={(e) => setSelectedCityFilter(e.target.value)}
                className="h-10 w-full sm:w-44 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/15"
              >
                <option value="ALL">All Cities ({areas.length})</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === "cities" ? "Search cities..." : "Search areas by name or city..."
              }
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium outline-none transition focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-6 animate-spin text-teal" />
            <p className="text-xs font-bold text-slate-500">
              Loading {activeTab === "cities" ? "cities" : "areas"}...
            </p>
          </div>
        </div>
      ) : activeTab === "cities" ? (
        // ==========================================
        // CITIES VIEW
        // ==========================================
        filteredCities.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Building2 className="size-10 text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-navy">No cities found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {searchQuery
                ? `No cities matching "${searchQuery}".`
                : "Get started by adding your first operational city."}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={handleOpenCreateCity}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-navy px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy/90"
              >
                <Plus className="size-3.5 text-teal-300" /> Add City
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCities.map((city) => (
              <div
                key={city.id}
                onClick={() => handleViewCityAreas(city)}
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/50 hover:shadow-md cursor-pointer"
                title={`Click to view areas in ${city.name}`}
              >
                {/* Left Section: Icon & Info */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy text-white transition-transform duration-200 group-hover:scale-105">
                    <Building2 className="size-5 text-teal-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-navy text-sm truncate group-hover:text-teal transition-colors">
                        {city.name}
                      </h3>
                      <ChevronRight className="size-3.5 text-slate-300 group-hover:text-teal group-hover:translate-x-0.5 transition" />
                    </div>
                    {city.nameUrdu ? (
                      <p className="text-[11px] font-semibold text-slate-400 truncate" dir="rtl">
                        {city.nameUrdu}
                      </p>
                    ) : null}
                    <p className="text-xs text-slate-500 mt-0.5">
                      {city.areasCount ?? 0} Areas • {city.workersCount ?? 0} Workers • {city.ordersCount ?? 0} Jobs
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span className="inline-flex items-center gap-1 rounded-md bg-teal/10 px-1.5 py-0.5 text-[10px] font-extrabold text-teal group-hover:bg-teal group-hover:text-white transition">
                        <MapPin className="size-3" /> View {city.areasCount ?? 0} Areas
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section: Switch Toggle & Edit / Delete */}
                <div
                  className="flex flex-col items-end gap-1.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    role="switch"
                    aria-checked={city.isActive}
                    disabled={togglingCityId === city.id}
                    onClick={() => handleToggleCity(city.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                      city.isActive ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                    title={city.isActive ? "Click to deactivate city" : "Click to activate city"}
                  >
                    <span className="sr-only">
                      {city.isActive ? "Deactivate city" : "Activate city"}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
                        city.isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>

                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider ${
                      city.isActive ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {city.isActive ? "Active" : "Inactive"}
                  </span>

                  <div className="flex items-center gap-1 mt-0.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCity(city)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 transition hover:border-teal/50 hover:text-teal"
                    >
                      <Pencil className="size-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenDelete(
                          "city",
                          city.id,
                          city.name,
                          city.areasCount,
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-600 transition hover:bg-rose-50"
                      title="Delete city"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // ==========================================
        // AREAS VIEW
        // ==========================================
        <div className="space-y-4">
          {/* Active City Filter Banner */}
          {selectedCityFilter !== "ALL" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-teal/20 bg-teal/5 p-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-500">Filtered by City:</span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-extrabold text-navy shadow-xs border border-teal/30">
                  <Building2 className="size-3.5 text-teal" />
                  {cities.find((c) => c.id === selectedCityFilter)?.name || "Selected City"}
                </span>
                <span className="text-xs font-bold text-teal">
                  ({filteredAreas.length} {filteredAreas.length === 1 ? "area" : "areas"})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCityFilter("ALL")}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 shadow-xs hover:border-teal/50 hover:text-teal transition"
              >
                <ArrowLeft className="size-3.5" /> All Cities
              </button>
            </div>
          )}

          {filteredAreas.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <MapPin className="size-10 text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-navy">No areas found</h3>
              <p className="mt-1 text-xs text-slate-500">
                {searchQuery || selectedCityFilter !== "ALL"
                  ? "No areas match the current filters."
                  : "No service areas configured yet."}
              </p>
              {!searchQuery && cities.length > 0 && (
                <button
                  type="button"
                  onClick={handleOpenCreateArea}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-navy px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy/90"
                >
                  <Plus className="size-3.5 text-teal-300" /> Add Area
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAreas.map((area) => {
                const parentCity = cities.find((c) => c.id === area.cityId);
                const isParentActive = parentCity ? parentCity.isActive : (area.city?.isActive ?? true);
                const isEffectiveActive = isParentActive && area.isActive;

                return (
                  <div
                    key={area.id}
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-md"
                  >
                    {/* Left Section: Icon & Info */}
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy text-white transition-transform duration-200 group-hover:scale-105">
                        <MapPin className="size-5 text-teal-300" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-navy text-sm truncate">{area.name}</h3>
                        {area.nameUrdu ? (
                          <p className="text-[11px] font-semibold text-slate-400 truncate" dir="rtl">
                            {area.nameUrdu}
                          </p>
                        ) : null}
                        <p className="text-xs text-slate-500 mt-0.5">
                          {area.workersCount ?? 0} Workers • {area.ordersCount ?? 0} Jobs
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-teal/10 px-1.5 py-0.5 text-[10px] font-extrabold text-teal">
                            <Building2 className="size-3" /> {area.cityName || parentCity?.name || "City"}
                          </span>
                          {!isParentActive && (
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-200">
                              City Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Section: Switch Toggle & Edit / Delete */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isEffectiveActive}
                        disabled={!isParentActive || togglingAreaId === area.id}
                        onClick={() => handleToggleArea(area.id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                          isEffectiveActive ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                        title={
                          !isParentActive
                            ? `Parent city "${parentCity?.name ?? "City"}" is deactivated. Activate city first.`
                            : isEffectiveActive
                            ? "Click to deactivate area"
                            : "Click to activate area"
                        }
                      >
                        <span className="sr-only">
                          {isEffectiveActive ? "Deactivate area" : "Activate area"}
                        </span>
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
                            isEffectiveActive ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>

                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider ${
                          isEffectiveActive ? "text-emerald-600" : "text-slate-400"
                        }`}
                      >
                        {isEffectiveActive ? "Active" : "Inactive"}
                      </span>

                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditArea(area)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 transition hover:border-teal/50 hover:text-teal"
                      >
                        <Pencil className="size-3" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenDelete("area", area.id, area.name)
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-600 transition hover:bg-rose-50"
                        title="Delete area"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* ADD / EDIT CITY MODAL                                */}
      {/* ==================================================== */}
      {cityModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-[10px] font-bold text-teal uppercase tracking-wider">
                  <Building2 className="size-3" /> City Management
                </span>
                <h3 className="mt-1 text-xl font-black text-navy">
                  {cityModalMode === "edit" ? "Edit Operational City" : "Add New Operational City"}
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  {cityModalMode === "edit"
                    ? "Update city details. Associated areas will remain linked."
                    : "Configure a new city for worker assignments and customer job postings."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseCityModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            {cityFormError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                <AlertCircle className="size-4 shrink-0" />
                {cityFormError}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  City Name (English) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="e.g. Peshawar, Islamabad, Lahore"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-navy outline-none transition focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/15"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  City Name (Urdu / مقامی نام)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={cityNameUrdu}
                  onChange={(e) => setCityNameUrdu(e.target.value)}
                  placeholder="مثلاً: پشاور، اسلام آباد، لاہور"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-navy outline-none transition focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/15"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCloseCityModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCity}
                disabled={savingCity}
                className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-navy/90 disabled:opacity-60"
              >
                {savingCity ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5 text-teal-300" />
                    {cityModalMode === "edit" ? "Save Changes" : "Create City"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* ADD / EDIT AREA MODAL                                */}
      {/* ==================================================== */}
      {areaModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-[10px] font-bold text-teal uppercase tracking-wider">
                  <MapPin className="size-3" /> Area Management
                </span>
                <h3 className="mt-1 text-xl font-black text-navy">
                  {areaModalMode === "edit" ? "Edit Service Area" : "Add New Service Area"}
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  {areaModalMode === "edit"
                    ? "Update area details or reassign to another parent city."
                    : "Add an operational locality or sector linked to a parent city."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseAreaModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            {areaFormError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                <AlertCircle className="size-4 shrink-0" />
                {areaFormError}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Parent City <span className="text-red-500">*</span>
                </label>
                <select
                  value={areaCityId}
                  onChange={(e) => setAreaCityId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-navy outline-none transition focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/15"
                >
                  <option value="">Select a Parent City</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.nameUrdu ? `(${c.nameUrdu})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Area Name (English) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="e.g. Hayatabad, F-7, University Town, Gulberg"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-navy outline-none transition focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/15"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Area Name (Urdu / مقامی نام)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={areaNameUrdu}
                  onChange={(e) => setAreaNameUrdu(e.target.value)}
                  placeholder="مثلاً: حیات آباد، یونیورسٹی ٹاؤن، گلبرگ"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-navy outline-none transition focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/15"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCloseAreaModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveArea}
                disabled={savingArea}
                className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-navy/90 disabled:opacity-60"
              >
                {savingArea ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5 text-teal-300" />
                    {areaModalMode === "edit" ? "Save Changes" : "Create Area"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* DELETE CONFIRMATION MODAL                            */}
      {/* ==================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <Trash2 className="size-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-navy">
                  Delete {deleteTarget.type === "city" ? "City" : "Area"}
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to delete{" "}
                  <strong className="text-navy">{deleteTarget.name}</strong>?
                  {deleteTarget.type === "city" && deleteTarget.subCount && deleteTarget.subCount > 0 ? (
                    <span className="block mt-2 font-semibold text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      Warning: This city has {deleteTarget.subCount} associated area(s). Deleting it will also remove these areas. Consider deactivating instead if workers or historical orders exist.
                    </span>
                  ) : (
                    <span className="block mt-1 text-slate-500">
                      This action will remove the record. Historical records referencing it by name will not be lost.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                <AlertCircle className="size-4 shrink-0" />
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" /> Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
