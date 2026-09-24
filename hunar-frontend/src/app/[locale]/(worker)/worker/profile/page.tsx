"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  CheckCircle2,
  Landmark,
  MapPin,
  Pencil,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { RatingStars } from "@/components/shared/rating-stars";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { WorkerDashboardShell } from "@/features/worker-dashboard";
import { formatRs } from "@/lib/money";
import {
  getWorkerProfile,
  queryKeys,
  updateWorkerProfile,
} from "@/services/worker/profile.service";
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

import { useLocale } from "next-intl";

function ProfileContent() {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileQuery = useQuery({
    queryKey: queryKeys.profile(),
    queryFn: getWorkerProfile,
  });

  const [editing, setEditing] = useState(false);
  const [formState, setFormState] = useState<UpdateWorkerProfileInput | null>(
    null
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateMutation = useMutation({
    mutationFn: updateWorkerProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile(), data);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

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

  // Active form data
  const form = formState ?? {
    name: worker.name,
    phone: worker.phone ?? "+92 300 1234567",
    email: worker.email ?? "faizan.ahmed@hunar.pk",
    avatarUrl: worker.avatarUrl ?? "",
    bio: worker.bio ?? "",
    skills: worker.skills ?? [],
    yearsExperience: worker.yearsExperience ?? 3,
    workshopLocation:
      worker.workshopLocation ?? "Shop #14, Main Saddar Road, Peshawar Cantt",
    serviceAreas: worker.serviceAreas ?? [
      "University Town",
      "Hayatabad",
      "Saddar",
    ],
    defaultVisitCharge: worker.defaultVisitCharge ?? 300,
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

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      handleTextChange("avatarUrl", fakeUrl);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Top Header */}
      <PageHeader
        title={isUrdu ? "ورکر پروفائل اور ترتیبات" : "Worker Profile & Settings"}
        description={
          isUrdu
            ? "اپنی ذاتی معلومات، ورکشاپ کے مقام اور سروس ایریا کا انتظام کریں۔"
            : "Manage your personal information, shop workshop location, and service coverage areas."
        }
        actions={
          <div className="flex items-center gap-2">
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
                  setEditing(false);
                  setFormState(null);
                } else {
                  setEditing(true);
                  setFormState({
                    name: worker.name,
                    phone: worker.phone ?? "+92 300 1234567",
                    email: worker.email ?? "faizan.ahmed@hunar.pk",
                    avatarUrl: worker.avatarUrl ?? "",
                    bio: worker.bio ?? "",
                    skills: worker.skills ?? [],
                    yearsExperience: worker.yearsExperience ?? 3,
                    workshopLocation:
                      worker.workshopLocation ??
                      "Shop #14, Main Saddar Road, Peshawar Cantt",
                    serviceAreas: worker.serviceAreas ?? [
                      "University Town",
                      "Hayatabad",
                      "Saddar",
                    ],
                    defaultVisitCharge: worker.defaultVisitCharge ?? 300,
                  });
                }
              }}
            >
              <Pencil className="mr-1.5 size-4" aria-hidden="true" />
              {editing ? (isUrdu ? "منسوخی" : "Cancel Editing") : (isUrdu ? "پروفائل میں ترمیم کریں" : "Edit Profile")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        {/* Left Card: Summary & Avatar */}
        <Card className="border-border shadow-xs">
          <CardContent className="flex flex-col items-center gap-4 text-center p-6">
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
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full bg-[#0F8B8D] text-white shadow-md hover:bg-[#0F8B8D]/90 transition-transform active:scale-95 cursor-pointer"
                    title={isUrdu ? "پروفائل فوٹو تبدیل کریں" : "Change Profile Photo"}
                  >
                    <Camera className="size-4.5" />
                  </button>
                </>
              ) : null}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-extrabold text-[#123B5D]">
                  {editing ? form.name : worker.name}
                </h2>
                {worker.isVerified ? <VerifiedBadge title={isUrdu ? "تصدیق شدہ ہنرمند" : "Verified Pro"} /> : null}
              </div>

              <div className="flex items-center justify-center gap-2 pt-0.5">
                <RatingStars rating={worker.rating} size="size-4" />
                <span className="text-xs font-bold text-[#123B5D]">
                  {worker.rating.toFixed(1)} / 5.0 ({worker.reviewsCount} {isUrdu ? "جائزے" : "reviews"})
                </span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid w-full grid-cols-2 gap-3 border-y border-border py-4 my-1 text-xs">
              <div className="rounded-xl bg-slate-50 p-2.5">
                <p className="text-slate-500 font-medium">{isUrdu ? "مکمل شدہ کام" : "Completed Orders"}</p>
                <p className="text-base font-extrabold text-[#123B5D] mt-0.5">
                  {worker.completedJobs} {isUrdu ? "جابز" : "Jobs"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5">
                <p className="text-slate-500 font-medium">{isUrdu ? "طے شدہ وزٹ فیس" : "Default Visit Fee"}</p>
                <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                  {formatRs(form.defaultVisitCharge ?? 300)}
                </p>
              </div>
            </div>

            <div className="w-full text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <User className="size-4 text-[#0F8B8D] shrink-0" />
                <span className="truncate">{editing ? form.email : (worker.email ?? "faizan.ahmed@hunar.pk")}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Landmark className="size-4 text-[#0F8B8D] shrink-0" />
                <span className="truncate">{editing ? form.phone : (worker.phone ?? "+92 300 1234567")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

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
                    <dd className="text-sm font-bold text-[#123B5D] mt-0.5">{worker.phone ?? "+92 300 1234567"}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                    <dt className="text-slate-500 font-medium">{isUrdu ? "ای میل ایڈریس" : "Email Address"}</dt>
                    <dd className="text-sm font-bold text-[#123B5D] mt-0.5">{worker.email ?? "faizan.ahmed@hunar.pk"}</dd>
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
                    ? "پشاور میں آپ کی دوکان یا ورکشاپ کا مکمل پتہ۔"
                    : "Your physical shop, store, or workshop base address in Peshawar."}
                </p>

                {editing ? (
                  <div className="pt-1">
                    <Input
                      value={form.workshopLocation ?? ""}
                      onChange={(e) =>
                        handleTextChange("workshopLocation", e.target.value)
                      }
                      placeholder={isUrdu ? "مثلاً دوکان نمبر 14، پشاور کینٹ" : "e.g. Shop #14, Main Saddar Road, Peshawar Cantt"}
                      className="h-10 text-xs font-semibold bg-white border-teal/30"
                    />
                  </div>
                ) : (
                  <p className="text-sm font-bold text-[#123B5D] pt-0.5">
                    {worker.workshopLocation ??
                      "Shop #14, Main Saddar Road, Peshawar Cantt"}
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
                    ? "پشاور کے وہ تمام علاقے منتخب کریں جہاں آپ سروس فراہم کرتے ہیں۔"
                    : "Select all Peshawar sectors where you visit customers for doorstep service calls."}
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
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(worker.serviceAreas ?? []).map((area) => (
                      <Badge
                        key={area}
                        variant="secondary"
                        className="bg-white text-[#123B5D] border border-emerald-300 px-3 py-1 text-xs font-semibold"
                      >
                        📍 {area}
                      </Badge>
                    ))}
                  </div>
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
                        value={form.yearsExperience ?? 0}
                        onChange={(e) =>
                          handleTextChange("yearsExperience", Number(e.target.value))
                        }
                        className="h-10 text-sm"
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="prof-charge" className="text-xs font-semibold text-[#123B5D]">
                        {isUrdu ? "بنیادی وزٹ فیس (روپے)" : "Default Visit Fee (PKR)"}
                      </Label>
                      <Input
                        id="prof-charge"
                        type="number"
                        min="0"
                        value={form.defaultVisitCharge ?? 300}
                        onChange={(e) =>
                          handleTextChange(
                            "defaultVisitCharge",
                            Number(e.target.value)
                          )
                        }
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="w-full bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white font-bold h-11 shadow-sm mt-2"
                  >
                    <Save className="mr-2 size-4" />
                    {updateMutation.isPending
                      ? isUrdu
                        ? "محفوظ کیا جا رہا ہے..."
                        : "Saving Profile..."
                      : isUrdu
                        ? "پروفائل کی تبدیلیاں محفوظ کریں"
                        : "Save Profile Changes"}
                  </Button>
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
                      <p className="text-sm font-bold text-emerald-600 mt-0.5">
                        {formatRs(worker.defaultVisitCharge ?? 300)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
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