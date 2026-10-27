"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { adminApi } from "@/features/admin/api/admin-api";
import { compressImage } from "@/lib/image-compression";
import type { DistanceSlab, ServiceCategory } from "@/types/admin";
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  Edit3,
  Filter,
  FolderTree,
  ImagePlus,
  Info,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  Truck,
  Wrench,
  X,
} from "lucide-react";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit form state
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [formCat, setFormCat] = useState<ServiceCategory | null>(null);
  const [formName, setFormName] = useState("");
  const [formNameUrdu, setFormNameUrdu] = useState("");
  const [formCharge, setFormCharge] = useState("");
  const [formSortOrder, setFormSortOrder] = useState("");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Distance Charges Modal State
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [editingSlabs, setEditingSlabs] = useState<DistanceSlab[]>([]);
  const [isEditingSlabs, setIsEditingSlabs] = useState(false);
  const [savingSlabs, setSavingSlabs] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [pricingFilter, setPricingFilter] = useState<
    "ALL" | "WITH_DELIVERY" | "WITHOUT_DELIVERY" | "FEE_SET" | "FEE_NOT_SET"
  >("ALL");
  const [sortBy, setSortBy] = useState<
    "DEFAULT" | "NAME_ASC" | "NAME_DESC" | "WORKERS_DESC" | "JOBS_DESC" | "FEE_DESC" | "FEE_ASC"
  >("DEFAULT");

  const totalCount = categories.length;
  const activeCount = useMemo(() => categories.filter((c) => c.isActive).length, [categories]);
  const inactiveCount = useMemo(() => categories.filter((c) => !c.isActive).length, [categories]);

  // Deleting category state
  const [categoryToDelete, setCategoryToDelete] = useState<ServiceCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [deleteCategoryError, setDeleteCategoryError] = useState<string | null>(null);

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setDeletingCategory(true);
    setDeleteCategoryError(null);
    try {
      await adminApi.deleteCategory(categoryToDelete.id);
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      if (selectedCategory?.id === categoryToDelete.id) {
        setSelectedCategory(null);
      }
      setCategoryToDelete(null);
      setToastMessage({
        type: "success",
        text: `Category "${categoryToDelete.name}" deleted successfully.`,
      });
    } catch (err) {
      setDeleteCategoryError(
        err instanceof Error ? err.message : "Failed to delete category.",
      );
    } finally {
      setDeletingCategory(false);
    }
  };

  const isFilterActive =
    search.trim() !== "" ||
    statusFilter !== "ALL" ||
    pricingFilter !== "ALL" ||
    sortBy !== "DEFAULT";

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPricingFilter("ALL");
    setSortBy("DEFAULT");
  };

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = categories.filter((cat) => {
      // 1. Search filter (English name + Urdu name)
      if (q) {
        const matchesName = cat.name.toLowerCase().includes(q);
        const matchesUrdu = cat.nameUrdu ? cat.nameUrdu.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesUrdu) return false;
      }

      // 2. Status filter
      if (statusFilter === "ACTIVE" && !cat.isActive) return false;
      if (statusFilter === "INACTIVE" && cat.isActive) return false;

      // 3. Pricing & Delivery filter
      if (pricingFilter === "WITH_DELIVERY") {
        if (!cat.distanceSlabs || cat.distanceSlabs.length === 0) return false;
      } else if (pricingFilter === "WITHOUT_DELIVERY") {
        if (cat.distanceSlabs && cat.distanceSlabs.length > 0) return false;
      } else if (pricingFilter === "FEE_SET") {
        if (cat.defaultVisitCharge == null) return false;
      } else if (pricingFilter === "FEE_NOT_SET") {
        if (cat.defaultVisitCharge != null) return false;
      }

      return true;
    });

    // 4. Sort logic
    return list.slice().sort((a, b) => {
      switch (sortBy) {
        case "NAME_ASC":
          return a.name.localeCompare(b.name);
        case "NAME_DESC":
          return b.name.localeCompare(a.name);
        case "WORKERS_DESC":
          return (b.activeWorkersCount ?? 0) - (a.activeWorkersCount ?? 0);
        case "JOBS_DESC":
          return (b.totalJobsCount ?? 0) - (a.totalJobsCount ?? 0);
        case "FEE_DESC":
          return (b.defaultVisitCharge ?? 0) - (a.defaultVisitCharge ?? 0);
        case "FEE_ASC":
          return (a.defaultVisitCharge ?? 0) - (b.defaultVisitCharge ?? 0);
        case "DEFAULT":
        default:
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      }
    });
  }, [categories, search, statusFilter, pricingFilter, sortBy]);

  useEffect(() => {
    adminApi
      .listCategories()
      .then(setCategories)
      .catch((err) =>
        setPageError(err instanceof Error ? err.message : "Failed to load categories"),
      )
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const handleToggleCategory = async (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target || togglingId === id) return;
    setPageError(null);
    setTogglingId(id);
    try {
      await adminApi.toggleCategory(id, !target.isActive);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
      );
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Failed to update category",
      );
    } finally {
      setTogglingId(null);
    }
  };

  const closeForm = () => {
    setFormMode(null);
    setFormCat(null);
    setFormName("");
    setFormNameUrdu("");
    setFormCharge("");
    setFormSortOrder("");
    setFormImageFile(null);
    setFormImagePreview(null);
    setFormError(null);
    setUploadingImage(false);
  };

  const handleOpenCreate = () => {
    closeForm();
    setFormMode("create");
    setFormCharge("500");
    setFormSortOrder(String(categories.length + 1));
  };

  const handleOpenEdit = (cat: ServiceCategory) => {
    closeForm();
    setFormMode("edit");
    setFormCat(cat);
    setFormName(cat.name);
    setFormNameUrdu(cat.nameUrdu ?? "");
    setFormCharge(cat.defaultVisitCharge != null ? String(cat.defaultVisitCharge) : "");
    setFormSortOrder(String(cat.sortOrder ?? 0));
    setFormImagePreview(cat.imageUrl ?? null);
  };

  const handleFormImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFormError(null);
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setFormError("Image must be JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError("Image must be under 10 MB.");
      return;
    }
    setUploadingImage(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.85 });
      const fileToUpload = new File([compressed], file.name, {
        type: compressed.type || file.type,
      });
      if (formImagePreview?.startsWith("blob:")) URL.revokeObjectURL(formImagePreview);
      setFormImageFile(fileToUpload);
      setFormImagePreview(URL.createObjectURL(fileToUpload));
    } catch {
      setFormError("Could not process that image. Try another file.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveFormImage = () => {
    if (formImagePreview?.startsWith("blob:")) URL.revokeObjectURL(formImagePreview);
    setFormImageFile(null);
    setFormImagePreview(null);
  };

  const handleFormSubmit = async () => {
    const name = formName.trim();
    if (!name) {
      setFormError("Category name is required.");
      return;
    }
    const charge = Number(formCharge);
    if (formCharge === "" || Number.isNaN(charge) || charge < 0) {
      setFormError("Default visit charge is required (0 or more).");
      return;
    }
    const sortOrder = formSortOrder === "" ? undefined : Number(formSortOrder);
    if (sortOrder !== undefined && (Number.isNaN(sortOrder) || sortOrder < 0)) {
      setFormError("Sort order must be 0 or more.");
      return;
    }
    setFormError(null);
    setSavingForm(true);
    try {
      let imageUrl: string | undefined;
      if (formImageFile) {
        imageUrl = await adminApi.uploadCategoryImage(formImageFile);
      } else if (formMode === "edit") {
        // undefined = keep as-is; "" = cleared by the admin
        imageUrl = formImagePreview ?? "";
      }
      const payload = {
        name,
        nameUrdu: formNameUrdu.trim() || undefined,
        imageUrl,
        sortOrder,
        defaultVisitCharge: charge,
      };
      if (formMode === "edit" && formCat) {
        const updated = await adminApi.updateCategory(formCat.id, payload);
        setCategories((prev) =>
          prev.map((c) =>
            c.id === formCat.id
              ? {
                  ...c,
                  ...updated,
                  nameUrdu: updated.nameUrdu ?? null,
                  imageUrl: updated.imageUrl ?? null,
                }
              : c,
          ),
        );
      } else {
        const created = await adminApi.createCategory(payload);
        setCategories((prev) => [...prev, created]);
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save category.");
    } finally {
      setSavingForm(false);
    }
  };

  const handleOpenDistanceModal = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setEditingSlabs(category.distanceSlabs ? [...category.distanceSlabs] : []);
    setIsEditingSlabs(false);
    setToastMessage(null);
  };

  const addDistanceSlab = () => {
    setEditingSlabs((prev) => {
      const last = prev[prev.length - 1];
      const minKm = last ? (last.maxKm ?? last.minKm + 2) : 0;
      const maxKm = minKm + 2;
      return [
        ...prev,
        { minKm, maxKm, charge: null, label: `${minKm}–${maxKm} KM` },
      ];
    });
  };

  const removeDistanceSlab = (idx: number) => {
    setEditingSlabs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveDistanceSlabs = async () => {
    if (!selectedCategory) return;
    setSavingSlabs(true);
    setToastMessage(null);
    try {
      const updated = await adminApi.updateCategoryDistanceSlabs(selectedCategory.id, editingSlabs);
      setCategories((prev) =>
        prev.map((c) => (c.id === selectedCategory.id ? { ...c, distanceSlabs: updated.distanceSlabs } : c))
      );
      setSelectedCategory((prev) => (prev ? { ...prev, distanceSlabs: updated.distanceSlabs } : null));
      setIsEditingSlabs(false);
      setToastMessage({ type: "success", text: "Delivery pricing updated successfully." });
    } catch {
      setToastMessage({ type: "error", text: "Unable to update delivery pricing. Please try again." });
    } finally {
      setSavingSlabs(false);
    }
  };

  return (
<div className="space-y-6">
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
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end sm:pt-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
                <FolderTree className="size-3.5" /> Trades & Categories
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
              Service Categories Management
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Add new service trades, configure distance delivery charges, or toggle category availability
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-navy/90 sm:mt-6 sm:self-end"
          >
            <Plus className="size-4 text-teal-300" /> Add New Category
          </button>
        </div>

        {/* Filters & Search Toolbar (Single Top Row, Clean Sticky Toolbar) */}
        <div className="sticky top-0 z-20 -mx-3 rounded-2xl bg-[#eaeef4]/90 px-3 py-2.5 backdrop-blur-md transition-all dark:bg-[#0d1424]/90">
          <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories by name (English or اردو)..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-xs font-medium text-navy shadow-xs outline-none transition placeholder:text-slate-400 focus:border-teal focus:ring-2 focus:ring-teal/15"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                title="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Status Segmented Control */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`min-w-[68px] rounded-lg px-3 py-1.5 text-center font-bold transition-all ${
                statusFilter === "ALL"
                  ? "bg-navy text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-navy"
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`min-w-[76px] rounded-lg px-3 py-1.5 text-center font-bold transition-all ${
                statusFilter === "ACTIVE"
                  ? "bg-navy text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-navy"
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("INACTIVE")}
              className={`min-w-[84px] rounded-lg px-3 py-1.5 text-center font-bold transition-all ${
                statusFilter === "INACTIVE"
                  ? "bg-navy text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-navy"
              }`}
            >
              Inactive ({inactiveCount})
            </button>
          </div>

          {/* Pricing & Delivery Filter Dropdown */}
          <div className="relative">
            <select
              value={pricingFilter}
              onChange={(e) => setPricingFilter(e.target.value as typeof pricingFilter)}
              className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 text-xs font-bold text-slate-700 shadow-xs outline-none transition hover:border-slate-300 focus:border-teal focus:ring-2 focus:ring-teal/15 cursor-pointer"
            >
              <option value="ALL">All Delivery & Pricing</option>
              <option value="WITH_DELIVERY">With Delivery Charges</option>
              <option value="WITHOUT_DELIVERY">Standard (No Delivery)</option>
              <option value="FEE_SET">Visit Fee Set</option>
              <option value="FEE_NOT_SET">Visit Fee Not Set</option>
            </select>
            <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 text-xs font-bold text-slate-700 shadow-xs outline-none transition hover:border-slate-300 focus:border-teal focus:ring-2 focus:ring-teal/15 cursor-pointer"
            >
              <option value="DEFAULT">Sort: Default Order</option>
              <option value="NAME_ASC">Name (A → Z)</option>
              <option value="NAME_DESC">Name (Z → A)</option>
              <option value="WORKERS_DESC">Most Workers</option>
              <option value="JOBS_DESC">Most Jobs</option>
              <option value="FEE_DESC">Highest Visit Fee</option>
              <option value="FEE_ASC">Lowest Visit Fee</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Reset Button (Always visible by default) */}
          <button
            type="button"
            onClick={handleResetFilters}
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold shadow-xs transition hover:bg-slate-50 cursor-pointer ${
              isFilterActive
                ? "text-teal hover:text-navy border-teal/40 bg-teal/5"
                : "text-slate-600 hover:text-navy"
            }`}
            title="Reset all filters"
          >
            <RotateCcw
              className={`size-3 transition-colors ${
                isFilterActive ? "text-teal" : "text-slate-400"
              }`}
            />
            <span>Reset</span>
          </button>

          {/* Category Count */}
          <div className="inline-flex h-10 min-w-[130px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium tabular-nums text-slate-500 shadow-xs whitespace-nowrap">
            Showing <span className="mx-1 font-extrabold text-navy">{filteredCategories.length}</span> of{" "}
            <span className="ml-1 font-bold text-navy">{totalCount}</span>
          </div>
        </div>
      </div>

        {loading ? (
          <p className="text-sm font-medium text-slate-500">Loading categories...</p>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-xs">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Search className="size-7" />
            </div>
            <h3 className="mt-4 text-base font-extrabold text-navy">No categories found</h3>
            <p className="mt-1 max-w-sm text-xs font-medium text-slate-500">
              {search
                ? `No service category matches your search "${search}". Try checking for spelling or reset filters.`
                : "No service categories match your current filter settings."}
            </p>
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-navy/90"
              >
                <RotateCcw className="size-3.5 text-teal-300" /> Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => handleOpenDistanceModal(cat)}
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {cat.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- uploaded /uploads paths render through the API rewrite
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="size-11 shrink-0 rounded-xl object-cover ring-1 ring-slate-200 transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-11 items-center justify-center rounded-xl bg-navy text-white transition-transform duration-200 group-hover:scale-105">
                      <Wrench className="size-5 text-teal-300" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-navy text-sm">{cat.name}</h3>
                    {cat.nameUrdu ? (
                      <p className="text-[11px] font-semibold text-slate-400" dir="rtl">
                        {cat.nameUrdu}
                      </p>
                    ) : null}
                    <p className="text-xs text-slate-500">
                      {cat.activeWorkersCount} Workers • {cat.totalJobsCount} Jobs
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {cat.defaultVisitCharge != null ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-navy/10 px-1.5 py-0.5 text-[10px] font-extrabold text-navy">
                          Visit Fee Rs. {cat.defaultVisitCharge}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-800">
                          <AlertCircle className="size-3" /> Fee Not Set
                        </span>
                      )}
                      {cat.distanceSlabs && cat.distanceSlabs.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-teal/10 px-1.5 py-0.5 text-[10px] font-extrabold text-teal">
                          <Truck className="size-3" /> Delivery Charges
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div
                  className="flex flex-col items-end gap-1.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    role="switch"
                    aria-checked={cat.isActive}
                    disabled={togglingId === cat.id}
                    onClick={() => handleToggleCategory(cat.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
                      cat.isActive ? "bg-emerald-500" : "bg-slate-300"
                    } ${togglingId === cat.id ? "opacity-80" : ""}`}
                    title={cat.isActive ? "Click to deactivate" : "Click to activate"}
                  >
                    <span className="sr-only">
                      {cat.isActive ? "Deactivate category" : "Activate category"}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none flex size-5 items-center justify-center transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
                        cat.isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    >
                      {togglingId === cat.id && (
                        <Loader2 className="size-3 animate-spin text-teal-600" />
                      )}
                    </span>
                  </button>
                  {togglingId === cat.id ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-teal">
                      <Loader2 className="size-2.5 animate-spin" /> Updating
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider ${
                        cat.isActive ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 transition hover:border-teal/50 hover:text-teal"
                  >
                    <Pencil className="size-3" /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Category Modal */}
        {formMode ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-[10px] font-bold text-teal uppercase tracking-wider">
                    <FolderTree className="size-3" /> Service Category
                  </span>
                  <h3 className="mt-1 text-xl font-black text-navy">
                    {formMode === "edit" ? "Edit Category" : "Add Service Category"}
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    {formMode === "edit"
                      ? "Update details shown to customers across the app."
                      : "Name, visit fee, and a cover image make the category ready for customers."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {/* Cover image */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Cover Image
                  </label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    className="hidden"
                    onChange={handleFormImageSelect}
                  />
                  {formImagePreview ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- preview covers may be blob: or /uploads paths */}
                      <img
                        src={formImagePreview}
                        alt="Category cover preview"
                        className="size-16 rounded-xl object-cover ring-1 ring-slate-200"
                      />
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-teal/50 hover:text-teal"
                        >
                          Replace image
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveFormImage}
                          className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-600 transition hover:bg-rose-50"
                        >
                          Remove image
                        </button>
                      </div>
                      {uploadingImage ? (
                        <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-teal">
                          <Loader2 className="size-3.5 animate-spin" /> Processing…
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-teal/50 hover:bg-teal/5 disabled:opacity-60"
                    >
                      {uploadingImage ? (
                        <Loader2 className="size-6 animate-spin text-teal" />
                      ) : (
                        <ImagePlus className="size-6 text-slate-400" />
                      )}
                      <span className="text-xs font-bold text-slate-600">
                        {uploadingImage ? "Processing image…" : "Upload cover image"}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        JPEG, PNG, or WebP • up to 5 MB after compression
                      </span>
                    </button>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Appliance Repair"
                    maxLength={100}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15"
                  />
                </div>

                {/* Urdu name */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Urdu Name
                  </label>
                  <input
                    type="text"
                    value={formNameUrdu}
                    onChange={(e) => setFormNameUrdu(e.target.value)}
                    placeholder="مثلاً اپلائینس مرمت"
                    maxLength={100}
                    dir="rtl"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15"
                  />
                </div>

                {/* Visit charge + sort order */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Default Visit Fee (Rs) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formCharge}
                      onChange={(e) => setFormCharge(e.target.value)}
                      placeholder="500"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15"
                    />
                    <p className="mt-1 text-[10px] font-semibold text-slate-400">
                      Suggested visiting fee when customers post a job.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formSortOrder}
                      onChange={(e) => setFormSortOrder(e.target.value)}
                      placeholder="1"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15"
                    />
                    <p className="mt-1 text-[10px] font-semibold text-slate-400">
                      Position in the customer listing.
                    </p>
                  </div>
                </div>

                {formError ? (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                    <AlertCircle className="size-4 shrink-0" /> {formError}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  disabled={savingForm || uploadingImage}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-navy/90 disabled:opacity-50"
                >
                  {savingForm ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin text-teal-300" /> Saving…
                    </>
                  ) : formMode === "edit" ? (
                    <>
                      <Save className="size-3.5 text-teal-300" /> Save Changes
                    </>
                  ) : (
                    <>
                      <Plus className="size-3.5 text-teal-300" /> Create Category
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Delivery / Distance Charges Modal */}
        {selectedCategory ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-[10px] font-bold text-teal uppercase tracking-wider">
                      <Truck className="size-3" /> Distance Pricing
                    </span>
                    <span className="rounded-md bg-navy/10 px-2 py-0.5 text-[10px] font-extrabold text-navy">
                      {selectedCategory.name}
                    </span>
                  </div>
                  <h3 className="mt-1 text-xl font-black text-navy">Delivery / Distance Charges</h3>
                  <p className="text-xs font-medium text-slate-500">
                    Configure travel charges based on distance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null);
                    setIsEditingSlabs(false);
                    setToastMessage(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Toast Notification Message inside popup */}
              {toastMessage ? (
                <div
                  className={`flex items-center gap-2 rounded-xl p-3 text-xs font-bold ${
                    toastMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {toastMessage.type === "success" ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="size-4 shrink-0 text-rose-600" />
                  )}
                  <span>{toastMessage.text}</span>
                </div>
              ) : null}

              {/* Info Box */}
              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-amber-900">
                <Info className="size-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1 text-[11px] leading-relaxed">
                  <p className="font-bold text-amber-950">Delivery Charge Information</p>
                  <p>
                    Delivery/Travel charges are calculated according to the distance between the customer and the assigned worker.
                  </p>
                  <p className="font-semibold text-amber-900">
                    • Note: Delivery charges are calculated based on the distance between customer and worker. Labor and material charges are calculated separately.
                  </p>
                </div>
              </div>

              {/* Pricing Slabs Table / Cards */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Distance Range
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Applicable Delivery Charge
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {editingSlabs.length === 0 && (
                    <p className="py-4 text-center text-[11px] font-semibold text-slate-400">
                      No distance slabs configured for this category yet.
                    </p>
                  )}
                  {editingSlabs.map((slab, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs font-semibold shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md bg-navy/5 font-extrabold text-[10px] text-navy">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-navy">
                          {slab.label || (slab.maxKm ? `${slab.minKm}–${slab.maxKm} KM` : `${slab.minKm}+ KM`)}
                        </span>
                      </div>

                      {isEditingSlabs ? (
                        slab.requiresApproval || slab.maxKm === null ? (
                          <span className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-extrabold text-amber-800">
                            Admin / Worker Approval
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-slate-400">Rs.</span>
                            <input
                              type="number"
                              value={slab.charge ?? ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? null : Number(e.target.value);
                                setEditingSlabs((prev) =>
                                  prev.map((s, i) => (i === idx ? { ...s, charge: val } : s))
                                );
                              }}
                              className="h-8 w-24 rounded-lg border border-slate-200 px-2 text-xs font-bold outline-none focus:border-teal"
                            />
                          </div>
                        )
                      ) : (
                        <span className="font-extrabold text-teal">
                          {slab.charge !== null && slab.charge !== undefined
                            ? `Rs.${slab.charge}`
                            : "Admin / Worker Approval"}
                        </span>
                      )}

                      {isEditingSlabs && (
                        <button
                          type="button"
                          onClick={() => removeDistanceSlab(idx)}
                          aria-label="Remove slab"
                          className="flex size-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {isEditingSlabs && (
                  <button
                    type="button"
                    onClick={addDistanceSlab}
                    className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-[11px] font-bold text-slate-500 transition hover:border-teal/50 hover:text-teal"
                  >
                    <Plus className="size-3.5" /> Add distance slab
                  </button>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                {!isEditingSlabs ? (
                  <>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(null);
                          setToastMessage(null);
                        }}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryToDelete(selectedCategory)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100 hover:border-rose-300"
                      >
                        <Trash2 className="size-3.5" /> Delete Category
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingSlabs(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-teal-600"
                    >
                      <Edit3 className="size-3.5" /> Edit
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingSlabs(false);
                        setEditingSlabs(selectedCategory.distanceSlabs || []);
                      }}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDistanceSlabs}
                      disabled={savingSlabs}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-navy/90 disabled:opacity-50"
                    >
                      <Save className="size-3.5 text-teal-300" />
                      {savingSlabs ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Delete Confirmation Modal */}
        {categoryToDelete ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-navy">Delete Category</h3>
                  <p className="text-xs text-slate-500">Confirm category removal</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete{" "}
                <span className="font-extrabold text-navy">&ldquo;{categoryToDelete.name}&rdquo;</span>?
                <p className="mt-1 text-[11px] text-slate-400">
                  Note: Categories with existing customer jobs cannot be deleted and must be deactivated instead.
                </p>
              </div>

              {deleteCategoryError && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{deleteCategoryError}</span>
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={deletingCategory}
                  onClick={() => {
                    setCategoryToDelete(null);
                    setDeleteCategoryError(null);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingCategory}
                  onClick={handleConfirmDeleteCategory}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-rose-700 disabled:opacity-50"
                >
                  {deletingCategory ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Deleting…
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
        ) : null}
      </div>
);
}
