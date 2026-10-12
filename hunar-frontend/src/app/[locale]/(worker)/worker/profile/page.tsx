"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Landmark,
  Loader2,
  MapPin,
  Pencil,
  Save,
  ShieldCheck,
  Star,
  User,
  X,
} from "lucide-react";
import { useLocale } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { RatingStars } from "@/components/shared/rating-stars";
import { RatingSummary } from "@/components/shared/rating-summary";
import { ReviewCard } from "@/components/shared/review-card";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { WorkerDashboardShell } from "@/features/worker-dashboard";
import { formatRs, sanitizePriceInput } from "@/lib/money";
import { http } from "@/lib/api-client";
import {
  getWorkerProfile,
  queryKeys,
  updateWorkerProfile,
} from "@/services/worker/profile.service";
import {
  getRatingSummary,
  getWorkerReviews,
  queryKeys as reviewKeys,
} from "@/services/worker/review.service";
import {
  getPrivacySettings,
  queryKeys as settingsKeys,
} from "@/services/worker/settings.service";
import type { UpdateWorkerProfileInput, WorkerProfile } from "@/types/worker";

const PESHAWAR_LOCATIONS = [
  "Hayatabad",
  "University Town",
  "Saddar",
  "Gulberg",
  "Defence",
  "Tehkal",
  "Warsak Road",
  "Board Bazaar",
  "Charsadda Road",
  "Hashtnagri",
];

function ProfileContent() {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileQuery = useQuery({
    queryKey: queryKeys.profile(),
    queryFn: getWorkerProfile,
  });

  const workerId = profileQuery.data?.id ?? "";

  const privacyQuery = useQuery({
    queryKey: settingsKeys.privacy,
    queryFn: getPrivacySettings,
    staleTime: 60_000,
  });

  const ratingQuery = useQuery({
    queryKey: reviewKeys.rating(workerId),
    queryFn: () => getRatingSummary(workerId),
    enabled: Boolean(workerId),
  });

  const reviewsQuery = useQuery({
    queryKey: reviewKeys.reviews(workerId, 1),
    queryFn: () => getWorkerReviews(workerId, 1, 10),
    enabled: Boolean(workerId),
  });

  const [mobileReviewsOpen, setMobileReviewsOpen] = useState(false);
  const [desktopReviewsOpen, setDesktopReviewsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formState, setFormState] = useState<UpdateWorkerProfileInput | null>(
    null
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const updateMutation = useMutation({
    mutationFn: updateWorkerProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile(), data);
      setFormState(null);
      setEditing(false);
      setSaveSuccess(true);
      setSaveError(null);
      setTimeout(() => setSaveSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
    },
    onError: (err: any) => {
      setSaveSuccess(false);
      setSaveError(
        err?.message ||
          (isUrdu
            ? "پروفائل محفوظ کرنے میں خرابی پیش آگئی۔"
            : "Failed to update profile. Please try again.")
      );
    },
  });

  // Visit Fee backend-driven permission handling
  const isVisitFeeLoading = privacyQuery.isLoading;
  const isVisitFeeAllowed =
    !privacyQuery.isError && privacyQuery.data?.showVisitCharge === true;

  if (profileQuery.isPending) {
    return <LoadingState label="Loading profile details..." />;
  }

  if (profileQuery.isError) {
    return (
      <ErrorState
        title="Unable to load profile"
        description="Please check your connection and try again."
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const worker: WorkerProfile = profileQuery.data;

  // Active form data: initialized strictly from latest saved worker profile
  const form = formState ?? {
    name: worker.name ?? "",
    phone: worker.phone ?? "",
    email: worker.email ?? "",
    avatarUrl: worker.avatarUrl ?? "",
    bio: worker.bio ?? "",
    skills: worker.skills ?? [],
    yearsExperience: worker.yearsExperience ?? 0,
    workshopLocation: worker.workshopLocation ?? "",
    serviceAreas: worker.serviceAreas ?? [],
    defaultVisitCharge: worker.defaultVisitCharge ?? 300,
  };

  const handleStartEditing = () => {
    setSaveError(null);
    setFormState({
      name: worker.name ?? "",
      phone: worker.phone ?? "",
      email: worker.email ?? "",
      avatarUrl: worker.avatarUrl ?? "",
      bio: worker.bio ?? "",
      skills: worker.skills ?? [],
      yearsExperience: worker.yearsExperience ?? 0,
      workshopLocation: worker.workshopLocation ?? "",
      serviceAreas: worker.serviceAreas ?? [],
      defaultVisitCharge: worker.defaultVisitCharge ?? 300,
    });
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setFormState(null);
    setSaveError(null);
  };

  const handleTextChange = (
    field: keyof UpdateWorkerProfileInput,
    value: string | number
  ) => {
    setFormState((prev) => ({
      ...form,
      ...prev,
      [field]: value,
    }));
  };

  const handleToggleServiceArea = (area: string) => {
    const currentAreas = form.serviceAreas ?? [];
    const updated = currentAreas.includes(area)
      ? currentAreas.filter((a) => a !== area)
      : [...currentAreas, area];

    setFormState((prev) => ({
      ...form,
      ...prev,
      serviceAreas: updated,
    }));
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previousAvatarUrl = form.avatarUrl ?? "";

    // Ephemeral local preview only; never persisted if the upload fails.
    const previewUrl = URL.createObjectURL(file);
    handleTextChange("avatarUrl", previewUrl);

    try {
      setUploadingAvatar(true);
      setSaveError(null);
      const formData = new FormData();
      formData.append("file", file);
      const raw = await http.upload<any>("/uploads/profile-photo", formData);
      const res = raw?.data ?? raw;
      if (res?.url) {
        handleTextChange("avatarUrl", res.url);
      } else {
        handleTextChange("avatarUrl", previousAvatarUrl);
        setSaveError(
          isUrdu
            ? "تصویر اپ لوڈ کرنے میں خرابی پیش آئی۔"
            : "Failed to upload avatar. Please try again."
        );
      }
    } catch (err) {
      console.warn("Avatar upload failed:", err);
      handleTextChange("avatarUrl", previousAvatarUrl);
      setSaveError(
        isUrdu
          ? "تصویر اپ لوڈ کرنے میں خرابی پیش آئی۔"
          : "Failed to upload avatar. Please try again."
      );
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleSave = () => {
    setSaveError(null);
    updateMutation.mutate(form);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Top Header */}
      <PageHeader
        title={isUrdu ? "ورکر پروفائل اور ترتیبات" : "Worker Profile & Settings"}
        // description={
        //   isUrdu
        //     ? "اپنی ذاتی معلومات، ورکشاپ کے مقام اور سروس ایریا کا انتظام کریں۔"
        //     : "Manage your personal information, shop workshop location, and service coverage areas."
        // }
        actions={
          <div className="hidden md:flex items-center gap-2">
            {saveSuccess ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 animate-in fade-in">
                <CheckCircle2 className="size-4" /> {isUrdu ? "پروفائل اپ ڈیٹ ہو گئی!" : "Profile Updated!"}
              </span>
            ) : null}
            <Button
              variant={editing ? "outline" : "default"}
              className={editing ? "" : "bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white font-semibold"}
              onClick={() => {
                if (editing) {
                  handleCancel();
                } else {
                  handleStartEditing();
                }
              }}
            >
              {editing ? (
                <>
                  <X className="mr-1.5 size-4" aria-hidden="true" />
                  {isUrdu ? "منسوخی" : "Cancel Editing"}
                </>
              ) : (
                <>
                  <Pencil className="mr-1.5 size-4" aria-hidden="true" />
                  {isUrdu ? "پروفائل میں ترمیم کریں" : "Edit Profile"}
                </>
              )}
            </Button>
          </div>
        }
      />

      {saveError ? (
        <div className="flex items-center gap-2 p-3.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{saveError}</span>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-stretch">
        {/* Left Column: Summary Card + Desktop Reviews */}
        <div className="flex flex-col gap-6">
          {/* Main Worker Profile Card */}
          <Card className="relative border-border shadow-xs">
            {/* Edit / Cancel button — top-right of card, mobile only */}
            <div className="md:hidden absolute top-3 right-3 flex items-center gap-2 z-10">
              {saveSuccess ? (
                <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-in fade-in">
                  <CheckCircle2 className="size-3.5" />
                  {isUrdu ? "اپ ڈیٹ ہو گئی!" : "Saved!"}
                </span>
              ) : null}
              <Button
                size="sm"
                variant={editing ? "outline" : "default"}
                className={editing ? "h-8 px-3 text-xs" : "h-8 px-3 text-xs bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white font-semibold"}
                onClick={() => {
                  if (editing) {
                    handleCancel();
                  } else {
                    handleStartEditing();
                  }
                }}
              >
                {editing ? (
                  <>
                    <X className="mr-1 size-3.5" aria-hidden="true" />
                    {isUrdu ? "منسوخی" : "Cancel"}
                  </>
                ) : (
                  <>
                    <Pencil className="mr-1 size-3.5" aria-hidden="true" />
                    {isUrdu ? "ترمیم" : "Edit Profile"}
                  </>
                )}
              </Button>
            </div>
            <CardContent className="flex flex-col items-center gap-4 text-center p-6 pt-12">
              <div className="relative">
                <Avatar className="size-28 border-2 border-[#0F8B8D]/30 shadow-md">
                  {form.avatarUrl || worker.avatarUrl ? (
                    <AvatarImage
                      src={form.avatarUrl || worker.avatarUrl}
                      alt={worker.name}
                    />
                  ) : null}
                  <AvatarFallback className="bg-[#0F8B8D]/10 text-3xl font-bold text-[#0F8B8D]">
                    {worker.name ? worker.name[0].toUpperCase() : "W"}
                  </AvatarFallback>
                </Avatar>

                {editing ? (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarSelect}
                    />
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full bg-[#0F8B8D] text-white shadow-md hover:bg-[#0F8B8D]/90 transition-transform active:scale-95 cursor-pointer disabled:opacity-75"
                      title={isUrdu ? "پروفائل فوٹو تبدیل کریں" : "Change Profile Photo"}
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="size-4.5 animate-spin" />
                      ) : (
                        <Camera className="size-4.5" />
                      )}
                    </button>
                  </>
                ) : null}
              </div>

              <div className="space-y-1 w-full">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-extrabold text-[#123B5D]">
                    {editing ? form.name : worker.name}
                  </h2>
                  {worker.isVerified ? <VerifiedBadge title={isUrdu ? "تصدیق شدہ ہنرمند" : "Verified Pro"} /> : null}
                </div>

                <button
                  type="button"
                  onClick={() => setMobileReviewsOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 pt-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                  title={isUrdu ? "جائزے دیکھیں" : "View reviews"}
                >
                  <RatingStars rating={worker.rating ?? 5} size="size-4" />
                  <span className="text-xs font-bold text-[#123B5D]">
                    {(worker.rating ?? 5).toFixed(1)}
                  </span>
                </button>


              </div>

              {/* Quick Stats Grid */}
              <div className="grid w-full grid-cols-2 gap-3 border-y border-border py-4 my-1 text-xs">
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-slate-500 font-medium">{isUrdu ? "مکمل شدہ کام" : "Completed Orders"}</p>
                  <p className="text-base font-extrabold text-[#123B5D] mt-0.5">
                    {worker.completedJobs ?? 0} {isUrdu ? "جابز" : "Jobs"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-slate-500 font-medium">{isUrdu ? "طے شدہ وزٹ فیس" : "Default Visit Fee"}</p>
                  <div className="mt-0.5">
                    {isVisitFeeLoading ? (
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>{isUrdu ? "جانچ ہو رہی ہے..." : "Checking..."}</span>
                      </div>
                    ) : !isVisitFeeAllowed ? (
                      <p className="text-xs font-bold text-slate-400">
                        {isUrdu ? "غیر فعال (بیک اینڈ)" : "Disabled (Backend)"}
                      </p>
                    ) : (
                      <p className="text-base font-extrabold text-emerald-600">
                        {formatRs(editing ? (form.defaultVisitCharge ?? 300) : (worker.defaultVisitCharge ?? 300))}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full text-left space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="size-4 text-[#0F8B8D] shrink-0" />
                  <span className="truncate">{editing ? form.email : (worker.email || (isUrdu ? "درج نہیں" : "Not provided"))}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Landmark className="size-4 text-[#0F8B8D] shrink-0" />
                  <span className="truncate">{editing ? form.phone : (worker.phone || (isUrdu ? "درج نہیں" : "Not provided"))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desktop Only: Reviews Section — fills remaining column height */}
          <div className="hidden lg:flex flex-col flex-1">
            <Card className="border-border shadow-xs flex flex-col flex-1">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between shrink-0">
                <CardTitle className="text-base font-bold text-[#123B5D] flex items-center gap-2">
                  <Star className="size-4.5 text-amber-500 fill-amber-500" />
                  {isUrdu ? "گاہکوں کے جائزے" : "Customer Reviews"}
                </CardTitle>
                {ratingQuery.data?.totalReviews ? (
                  <Badge variant="outline" className="text-xs font-semibold text-[#0F8B8D] border-[#0F8B8D]/30">
                    {ratingQuery.data.totalReviews} {isUrdu ? "جائزے" : "Reviews"}
                  </Badge>
                ) : null}
              </CardHeader>
              <CardContent className="p-5 space-y-4 flex flex-col flex-1">
                {ratingQuery.isPending || reviewsQuery.isPending ? (
                  <LoadingState label={isUrdu ? "جائزے لوڈ ہو رہے ہیں..." : "Loading reviews..."} />
                ) : ratingQuery.isError || reviewsQuery.isError ? (
                  <p className="text-xs text-rose-500 text-center py-2">
                    {isUrdu ? "جائزے لوڈ کرنے میں خرابی پیش آگئی" : "Unable to load reviews."}
                  </p>
                ) : (
                  <>
                    {ratingQuery.data && (
                      <RatingSummary
                        summary={ratingQuery.data}
                        title={isUrdu ? "ریٹنگ کی تفصیل" : "Rating Breakdown"}
                        reviewLabel={isUrdu ? "کل جائزے" : "Total Reviews"}
                        starLabel={isUrdu ? "ستارے" : "Stars"}
                      />
                    )}

                    <div className="space-y-3 pt-2">
                      {!reviewsQuery.data?.items || reviewsQuery.data.items.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs">
                          {isUrdu ? "ابھی تک کوئی جائزہ موجود نہیں ہے۔" : "No customer reviews yet."}
                        </div>
                      ) : (
                        <>
                          {reviewsQuery.data.items.slice(0, 2).map((review) => (
                            <ReviewCard
                              key={review.id}
                              review={review}
                              jobLabel={isUrdu ? "جاب حوالہ" : "Job Reference"}
                              noCommentLabel={isUrdu ? "کوئی تبصرہ درج نہیں" : "No review comment provided"}
                            />
                          ))}
                          {reviewsQuery.data.items.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setDesktopReviewsOpen(true)}
                              className="w-full mt-1 py-2 text-xs font-semibold text-[#0F8B8D] hover:text-[#0F8B8D]/80 border border-[#0F8B8D]/30 hover:bg-[#0F8B8D]/5 rounded-lg transition-colors cursor-pointer"
                            >
                              {isUrdu
                                ? `سبھی ${reviewsQuery.data.items.length} جائزے دیکھیں →`
                                : `See all ${ratingQuery.data?.totalReviews ?? reviewsQuery.data.items.length} reviews →`}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Section: Editable Cards */}
        <div className="space-y-6">
          {/* Card 1: Personal Information */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-[#123B5D] flex items-center gap-2">
                <User className="size-4.5 text-[#0F8B8D]" />
                {isUrdu ? "ذاتی معلومات" : "Personal Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {editing ? (
                <>
                  <div className="grid gap-1.5">
                    <Label htmlFor="prof-name" className="text-xs font-semibold text-[#123B5D]">
                      {isUrdu ? "پورا نام" : "Full Name"}
                    </Label>
                    <Input
                      id="prof-name"
                      value={form.name ?? ""}
                      onChange={(e) => handleTextChange("name", e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="prof-phone" className="text-xs font-semibold text-[#123B5D]">
                        {isUrdu ? "موبائل نمبر" : "Phone Number"}
                      </Label>
                      <Input
                        id="prof-phone"
                        value={form.phone ?? ""}
                        onChange={(e) => handleTextChange("phone", e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="prof-email" className="text-xs font-semibold text-[#123B5D]">
                        {isUrdu ? "ای میل ایڈریس" : "Email Address"}
                      </Label>
                      <Input
                        id="prof-email"
                        type="email"
                        value={form.email ?? ""}
                        onChange={(e) => handleTextChange("email", e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-slate-500 font-medium">{isUrdu ? "پورا نام" : "Full Name"}</dt>
                    <dd className="text-sm font-bold text-[#123B5D] mt-0.5">{worker.name}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-slate-500 font-medium">{isUrdu ? "موبائل نمبر" : "Phone Number"}</dt>
                    <dd className="text-sm font-bold text-[#123B5D] mt-0.5">{worker.phone || (isUrdu ? "درج نہیں" : "Not provided")}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                    <dt className="text-slate-500 font-medium">{isUrdu ? "ای میل ایڈریس" : "Email Address"}</dt>
                    <dd className="text-sm font-bold text-[#123B5D] mt-0.5">{worker.email || (isUrdu ? "درج نہیں" : "Not provided")}</dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Workshop Location vs Service Location */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-[#123B5D] flex items-center gap-2">
                <MapPin className="size-4.5 text-[#0F8B8D]" />
                {isUrdu ? "مقام اور سروس ایریا" : "Location & Coverage Management"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Workshop Location */}
              <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Landmark className="size-4 text-[#0F8B8D]" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wide text-[#123B5D]">
                    {isUrdu ? "1۔ ورکشاپ / دوکان کا مقام" : "1. Workshop Location (Physical Shop)"}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500">
                  {isUrdu
                    ? "آپ کی دوکان یا ورکشاپ کا مکمل پتہ۔"
                    : "Your physical shop, store, or workshop base address."}
                </p>

                {editing ? (
                  <div className="pt-1">
                    <Input
                      value={form.workshopLocation ?? ""}
                      onChange={(e) =>
                        handleTextChange("workshopLocation", e.target.value)
                      }
                      placeholder={isUrdu ? "مثلاً دوکان نمبر 14، مین کمرشل مارکیٹ" : "e.g. Shop #14, Main Commercial Avenue"}
                      className="h-10 text-xs font-semibold bg-white border-teal/30"
                    />
                  </div>
                ) : (
                  <p className="text-sm font-bold text-[#123B5D] pt-0.5">
                    {worker.workshopLocation ||
                      (isUrdu ? "کوئی پتہ درج نہیں" : "No workshop address provided")}
                  </p>
                )}
              </div>

              {/* Service Location */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-emerald-600" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wide text-[#123B5D]">
                    {isUrdu ? "2۔ دہلیز سروس کے علاقے" : "2. Service Location (Doorstep Coverage Areas)"}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500">
                  {isUrdu
                    ? "وہ تمام علاقے منتخب کریں جہاں آپ سروس فراہم کرتے ہیں۔"
                    : "Select all coverage sectors where you visit customers for doorstep service calls."}
                </p>

                {editing ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {PESHAWAR_LOCATIONS.map((loc) => {
                      const selected = (form.serviceAreas ?? []).includes(loc);
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => handleToggleServiceArea(loc)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                            selected
                              ? "bg-[#0F8B8D] text-white border-[#0F8B8D] shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {selected ? "✓ " : "+ "}
                          {loc}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  (worker.serviceAreas ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {worker.serviceAreas.map((area: any) => {
                        const areaName = typeof area === "string" ? area : (area?.label || area?.address || "");
                        if (!areaName) return null;
                        return (
                          <Badge
                            key={areaName}
                            variant="secondary"
                            className="bg-white text-[#123B5D] border border-emerald-300 px-3 py-1 text-xs font-semibold"
                          >
                            📍 {areaName}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 pt-1">
                      {isUrdu ? "کوئی سروس ایریا منتخب نہیں" : "No coverage areas selected"}
                    </p>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Professional Details & Save CTA */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-[#123B5D] flex items-center gap-2">
                <ShieldCheck className="size-4.5 text-[#0F8B8D]" />
                {isUrdu ? "پیشہ ورانہ تفصیلات اور تعارف" : "Professional Summary & Bio"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {editing ? (
                <>
                  <div className="grid gap-1.5">
                    <Label htmlFor="prof-bio" className="text-xs font-semibold text-[#123B5D]">
                      {isUrdu ? "تعارف اور تجارتی تجربہ" : "Bio & Trade Experience"}
                    </Label>
                    <Textarea
                      id="prof-bio"
                      rows={3}
                      value={form.bio ?? ""}
                      onChange={(e) => handleTextChange("bio", e.target.value)}
                      className="text-xs leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="prof-exp" className="text-xs font-semibold text-[#123B5D]">
                        {isUrdu ? "تجربہ (سالوں میں)" : "Years of Experience"}
                      </Label>
                      <Input
                        id="prof-exp"
                        type="number"
                        min="0"
                        value={form.yearsExperience ?? ""}
                        onChange={(e) => {
                          const cleaned = sanitizePriceInput(e.target.value);
                          handleTextChange("yearsExperience", cleaned === "" ? "" : Number(cleaned));
                        }}
                        className="h-10 text-sm"
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="prof-charge" className="text-xs font-semibold text-[#123B5D] flex items-center justify-between">
                        <span>{isUrdu ? "بنیادی وزٹ فیس (روپے)" : "Default Visit Fee (PKR)"}</span>
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {isUrdu ? "قابل ترمیم نہیں" : "Not editable"}
                        </span>
                      </Label>
                      <Input
                        id="prof-charge"
                        type="number"
                        disabled
                        value={worker.defaultVisitCharge ?? 300}
                        className="h-10 text-sm bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={updateMutation.isPending}
                      className="flex-1 border-slate-300 text-slate-700 font-semibold h-11"
                    >
                      <X className="mr-2 size-4" />
                      {isUrdu ? "منسوخ کریں" : "Cancel"}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="flex-1 bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white font-bold h-11 shadow-sm"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          {isUrdu ? "محفوظ کیا جا رہا ہے..." : "Saving Profile..."}
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 size-4" />
                          {isUrdu ? "پروفائل محفوظ کریں" : "Save Profile"}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 text-xs">
                  <div>
                    <p className="text-slate-500 font-medium">{isUrdu ? "تعارف" : "Bio"}</p>
                    <p className="text-sm font-normal text-slate-700 leading-relaxed mt-1">
                      {worker.bio || (isUrdu ? "ابھی تک کوئی تعارف شامل نہیں کیا گیا۔" : "No bio added yet.")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <p className="text-slate-500 font-medium">{isUrdu ? "تجربہ (سال)" : "Years of Experience"}</p>
                      <p className="text-sm font-bold text-[#123B5D] mt-0.5">
                        {worker.yearsExperience} {isUrdu ? "سال" : "Years"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">{isUrdu ? "طے شدہ وزٹ فیس" : "Default Visit Fee"}</p>
                      {isVisitFeeLoading ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Loader2 className="size-3 animate-spin" />
                          <span>{isUrdu ? "جانچ ہو رہی ہے..." : "Checking..."}</span>
                        </div>
                      ) : !isVisitFeeAllowed ? (
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">
                          {isUrdu ? "غیر فعال (بیک اینڈ)" : "Disabled (Backend)"}
                        </p>
                      ) : (
                        <p className="text-sm font-bold text-emerald-600 mt-0.5">
                          {formatRs(worker.defaultVisitCharge ?? 300)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Only: Reviews Dialog Modal */}
      <Dialog open={mobileReviewsOpen} onOpenChange={setMobileReviewsOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-5">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-bold text-[#123B5D] flex items-center gap-2">
              <Star className="size-4.5 text-amber-500 fill-amber-500" />
              {isUrdu ? "گاہکوں کے جائزے" : "Customer Reviews"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {ratingQuery.isPending || reviewsQuery.isPending ? (
              <LoadingState label={isUrdu ? "جائزے لوڈ ہو رہے ہیں..." : "Loading reviews..."} />
            ) : ratingQuery.isError || reviewsQuery.isError ? (
              <p className="text-xs text-rose-500 text-center py-4">
                {isUrdu ? "جائزے لوڈ کرنے میں خرابی پیش آگئی" : "Unable to load reviews."}
              </p>
            ) : (
              <>
                {ratingQuery.data && (
                  <RatingSummary
                    summary={ratingQuery.data}
                    title={isUrdu ? "ریٹنگ کی تفصیل" : "Rating Breakdown"}
                    reviewLabel={isUrdu ? "کل جائزے" : "Total Reviews"}
                    starLabel={isUrdu ? "ستارے" : "Stars"}
                  />
                )}

                <div className="space-y-3 pt-2">
                  {!reviewsQuery.data?.items || reviewsQuery.data.items.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      {isUrdu ? "ابھی تک کوئی جائزہ موجود نہیں ہے۔" : "No customer reviews yet."}
                    </div>
                  ) : (
                    reviewsQuery.data.items.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        jobLabel={isUrdu ? "جاب حوالہ" : "Job Reference"}
                        noCommentLabel={isUrdu ? "کوئی تبصرہ درج نہیں" : "No review comment provided"}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Desktop: All Reviews Dialog */}
      <Dialog open={desktopReviewsOpen} onOpenChange={setDesktopReviewsOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto p-5">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-bold text-[#123B5D] flex items-center gap-2">
              <Star className="size-4.5 text-amber-500 fill-amber-500" />
              {isUrdu ? "گاہکوں کے جائزے" : "All Customer Reviews"}
              {ratingQuery.data?.totalReviews ? (
                <Badge variant="outline" className="ml-auto text-xs font-semibold text-[#0F8B8D] border-[#0F8B8D]/30">
                  {ratingQuery.data.totalReviews} {isUrdu ? "جائزے" : "Reviews"}
                </Badge>
              ) : null}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {ratingQuery.data && (
              <RatingSummary
                summary={ratingQuery.data}
                title={isUrdu ? "ریٹنگ کی تفصیل" : "Rating Breakdown"}
                reviewLabel={isUrdu ? "کل جائزے" : "Total Reviews"}
                starLabel={isUrdu ? "ستارے" : "Stars"}
              />
            )}
            <div className="space-y-3 pt-1">
              {!reviewsQuery.data?.items || reviewsQuery.data.items.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  {isUrdu ? "ابھی تک کوئی جائزہ موجود نہیں ہے۔" : "No customer reviews yet."}
                </div>
              ) : (
                reviewsQuery.data.items.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    jobLabel={isUrdu ? "جاب حوالہ" : "Job Reference"}
                    noCommentLabel={isUrdu ? "کوئی تبصرہ درج نہیں" : "No review comment provided"}
                  />
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <WorkerDashboardShell initialTab="profile">
      <ProfileContent />
    </WorkerDashboardShell>
  );
}