"use client";

import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/features/admin/api/admin-api";
import { compressImage } from "@/lib/image-compression";
import type { DistanceSlab, ServiceCategory } from "@/types/admin";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  FolderTree,
  ImagePlus,
  Info,
  Loader2,
  Pencil,
  Plus,
  Save,
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

        {loading ? (
          <p className="text-sm font-medium text-slate-500">Loading categories...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
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
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                      cat.isActive ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                    title={cat.isActive ? "Click to deactivate" : "Click to activate"}
                  >
                    <span className="sr-only">
                      {cat.isActive ? "Deactivate category" : "Activate category"}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
                        cat.isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider ${
                      cat.isActive ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {cat.isActive ? "Active" : "Inactive"}
                  </span>
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
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(null);
                        setToastMessage(null);
                      }}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
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
      </div>
);
}
