"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  FileCheck,
  HelpCircle,
  Info,
  Loader2,
  PhoneCall,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  UploadCloud,
  UserCheck,
  X,
} from "lucide-react";
import {
  CustomerJobReferenceOption,
  SupportTicket,
  TicketIssueType,
  TicketPriority,
  TicketResolutionPreference,
} from "../types";

interface SubmitTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobOptions: CustomerJobReferenceOption[];
  onSubmitSuccess: (newTicket: SupportTicket) => void;
}

export function SubmitTicketModal({
  isOpen,
  onClose,
  jobOptions,
  onSubmitSuccess,
}: SubmitTicketModalProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [selectedJobId, setSelectedJobId] = useState<string>(
    jobOptions[0]?.id || "general"
  );
  const [issueType, setIssueType] = useState<TicketIssueType>("incomplete");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [description, setDescription] = useState("");
  const [resolutionPref, setResolutionPref] =
    useState<TicketResolutionPreference>("rework");
  const [attachedFiles, setAttachedFiles] = useState<string[]>([
    "bathroom_leak_photo_1.jpg",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCaseNum, setSubmittedCaseNum] = useState<string | null>(null);

  if (!isOpen) return null;

  const issueCategories: {
    id: TicketIssueType;
    label: string;
    description: string;
  }[] = isUrdu
    ? [
        {
          id: "incomplete",
          label: "نامکمل کام یا لیکیج",
          description: "کام ادھورا چھوڑ دیا گیا یا فٹنگ میں لیکیج ہے",
        },
        {
          id: "pricing",
          label: "قیمت یا کوٹیشن کا تنازعہ",
          description: "طے شدہ رقم یا وزٹ فیس سے زیادہ کا مطالبہ",
        },
        {
          id: "noshow",
          label: "کاریگر کی تاخیر / غیر حاضری",
          description: "کاریگر مقررہ وقت پر نہیں پہنچا",
        },
        {
          id: "quality",
          label: "غیر معیاری کام",
          description: "مرمت کے معیار سے عدم اطمینان",
        },
        {
          id: "safety",
          label: "حفاظتی PIN یا تصدیق کا مسئلہ",
          description: "کاریگر کا چہرہ یا PIN میچ نہیں ہوا",
        },
        {
          id: "damage",
          label: "سامان یا پراپرٹی کا نقصان",
          description: "کام کے دوران کسی گھریلو شے کو نقصان پہنچا",
        },
        {
          id: "other",
          label: "عمومی سپورٹ اور سوالات",
          description: "اکاؤنٹ، ایپ یا دیگر رہنمائی",
        },
      ]
    : [
        {
          id: "incomplete",
          label: "Incomplete Work / Leak",
          description: "Work left unfinished or faulty seal",
        },
        {
          id: "pricing",
          label: "Pricing & Quote Mismatch",
          description: "Dispute regarding on-site quote or fee",
        },
        {
          id: "noshow",
          label: "Technician Delayed / No-Show",
          description: "Technician did not arrive on time",
        },
        {
          id: "quality",
          label: "Substandard Quality",
          description: "Poor workmanship or improper fitting",
        },
        {
          id: "safety",
          label: "Safety PIN / Verification Issue",
          description: "Unrecognized person or PIN mismatch",
        },
        {
          id: "damage",
          label: "Property Damage Concern",
          description: "Accidental damage to fixtures or property",
        },
        {
          id: "other",
          label: "General Support Inquiry",
          description: "Account, app, or miscellaneous question",
        },
      ];

  const handleAddSampleFile = () => {
    const nextIdx = attachedFiles.length + 1;
    setAttachedFiles((prev) => [...prev, `fault_evidence_photo_${nextIdx}.jpg`]);
  };

  const handleRemoveFile = (fileName: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f !== fileName));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newCaseNumber = `CASE-${randomDigits}`;

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedCaseNum(newCaseNumber);

      const matchedJob = jobOptions.find((j) => j.id === selectedJobId);

      const createdTicket: SupportTicket = {
        id: `ticket-${randomDigits}`,
        caseNumber: newCaseNumber,
        jobReference: matchedJob ? matchedJob.jobNumber : "#GENERAL",
        serviceTitle: matchedJob
          ? matchedJob.title
          : (isUrdu ? "عمومی سپورٹ درخواست" : "General Support Inquiry"),
        workerName: matchedJob
          ? matchedJob.workerName
          : (isUrdu ? "سپورٹ ڈیسک" : "Support Desk"),
        location: isUrdu ? "کسٹمر پراپرٹی، پشاور" : "Customer Property, Peshawar",
        issueType,
        issueTitle:
          issueCategories.find((c) => c.id === issueType)?.label || (isUrdu ? "کسٹمر ٹکٹ" : "Customer Ticket"),
        priority,
        description,
        resolutionPreference: resolutionPref,
        status: "submitted",
        statusLabel: isUrdu ? "آپریشنز جائزہ" : "Operations Review",
        createdAt: isUrdu ? "ابھی" : "Just now",
        lastUpdate: isUrdu ? "ابھی" : "Just now",
        estimatedResolutionTime: isUrdu ? "20 منٹ کے اندر" : "Within 20 mins",
        timeline: isUrdu
          ? [
              {
                title: "کلیم جمع ہو گیا",
                timestamp: "ابھی",
                status: "completed",
                iconName: "check",
              },
              {
                title: "آپریشنز ڈیسک جائزہ",
                timestamp: "زیرِ کارروائی",
                status: "current",
                iconName: "pending",
              },
              {
                title: "حل اور ازالہ",
                timestamp: "آئندہ",
                status: "upcoming",
                iconName: "gavel",
              },
            ]
          : [
              {
                title: "Claim Submitted",
                timestamp: "Just now",
                status: "completed",
                iconName: "check",
              },
              {
                title: "Operations Desk Review",
                timestamp: "Under Review",
                status: "current",
                iconName: "pending",
              },
              {
                title: "Action & Resolution",
                timestamp: "Upcoming",
                status: "upcoming",
                iconName: "gavel",
              },
            ],
        attachments: attachedFiles,
        notesCount: 1,
      };

      onSubmitSuccess(createdTicket);
    }, 1000);
  };

  const handleFinish = () => {
    setSubmittedCaseNum(null);
    setDescription("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 rtl:text-right">
        {submittedCaseNum ? (
          /* Submission Success State */
          <div className="p-6 sm:p-8 text-center flex flex-col items-center gap-4">
            <div className="size-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <CheckCircle className="size-9" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest">
                {isUrdu ? "ٹکٹ کامیابی سے درج ہو گیا" : "Ticket Created Successfully"}
              </span>
              <h3 className="text-xl font-extrabold text-[#123B5D]">
                {isUrdu ? `سپورٹ #${submittedCaseNum} درج` : `Support #${submittedCaseNum} Logged`}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mt-1">
                {isUrdu
                  ? "آپ کا ٹکٹ براہِ راست آپریشنز سپورٹ ڈیسک کو تفویض کر دیا گیا ہے۔ ہمارے نگران افسر 20 منٹ کے اندر کال یا ایپ کے ذریعے رابطہ کریں گے۔"
                  : "Your ticket has been assigned directly to our Operations Support Desk. A dedicated case supervisor is reviewing your issue and will reach out via phone or app notification within 20 minutes."}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left rtl:text-right w-full max-w-md flex flex-col gap-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>{isUrdu ? "مسئلے کی قسم:" : "Issue Type:"}</span>
                <span className="font-bold text-slate-800">
                  {issueCategories.find((c) => c.id === issueType)?.label}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{isUrdu ? "ترجیح:" : "Priority:"}</span>
                <span className="font-bold uppercase text-amber-700">
                  {priority}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{isUrdu ? "وارنٹی کوریج:" : "Coverage:"}</span>
                <span className="font-bold text-emerald-700">
                  {isUrdu ? "5 روزہ کاریگری وارنٹی" : "5-Day Craftsmanship Warranty"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="mt-2 px-6 py-2.5 bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {isUrdu ? "فعال سپورٹ ٹکٹ دیکھیں" : "View Active Support Ticket"}
            </button>
          </div>
        ) : (
          /* Form State */
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center shrink-0">
                  <ShieldAlert className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#123B5D]">
                    {isUrdu ? "براہ راست سپورٹ ٹکٹ درج کریں" : "Open Direct Support Ticket"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isUrdu
                      ? "آرڈر ورکر کسٹمر تحفظ اور نگہداشت پالیسی کے تحت محفوظ"
                      : "Protected under Orderworker Customer Care Policy"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="size-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
              {/* 1. Job Reference Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#123B5D] flex items-center justify-between">
                  <span>{isUrdu ? "1. متعلقہ جاب منتخب کریں" : "1. Select Job Reference"}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {isUrdu ? "عمومی سوال کے لیے اختیاری" : "Optional if general question"}
                  </span>
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full h-10 bg-white border border-slate-200 text-slate-800 px-3 rounded-xl text-xs font-medium focus:border-[#0F8B8D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none cursor-pointer rtl:text-right"
                >
                  <option value="general">
                    {isUrdu
                      ? "عمومی سپورٹ / بغیر جاب ریفرنس"
                      : "General Support / No Job Reference"}
                  </option>
                  {jobOptions.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.jobNumber} — {job.title} ({job.workerName})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Reason for Ticket */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#123B5D]">
                  {isUrdu ? "2. شکایت یا مسئلے کی وجہ" : "2. Reason for Support Ticket"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {issueCategories.map((cat) => {
                    const isSelected = issueType === cat.id;

                    return (
                      <label
                        key={cat.id}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#0F8B8D]/5 border-[#0F8B8D] text-[#123B5D] shadow-2xs"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="issue_type"
                          value={cat.id}
                          checked={isSelected}
                          onChange={() => setIssueType(cat.id)}
                          className="mt-0.5 accent-[#0F8B8D]"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold leading-tight">
                            {cat.label}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            {cat.description}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 3. Priority Level */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#123B5D]">
                  {isUrdu ? "3. ترجیح / جلدی" : "3. Urgency / Priority"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    isUrdu
                      ? [
                          { id: "normal", label: "معمول", sub: "2 گھنٹے میں" },
                          { id: "high", label: "اہم", sub: "45 منٹ میں" },
                          { id: "urgent", label: "فوری", sub: "فوری الرٹ" },
                        ]
                      : [
                          { id: "normal", label: "Normal", sub: "Within 2 hours" },
                          { id: "high", label: "High", sub: "Within 45 mins" },
                          { id: "urgent", label: "Urgent", sub: "Immediate Desk Alert" },
                        ]
                  ).map((p) => {
                    const isSelected = priority === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id as TicketPriority)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#123B5D] bg-[#123B5D] text-white shadow-xs"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span className="text-xs font-bold block">{p.label}</span>
                        <span
                          className={`text-[9px] block ${
                            isSelected ? "text-slate-200" : "text-slate-400"
                          }`}
                        >
                          {p.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Issue Description */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#123B5D]">
                    {isUrdu ? "4. واقعے یا مسئلے کی وضاحت" : "4. Incident / Issue Description"}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {isUrdu ? "اردو یا انگریزی دونوں میں لکھ سکتے ہیں" : "Urdu or English supported"}
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isUrdu
                      ? "مسئلے کی مکمل وضاحت کریں۔ کاریگر کے ساتھ کیا بات ہوئی تھی اور کیا مسئلہ درپیش آیا..."
                      : "Explain the issue clearly in Urdu or English. Mention what was agreed with the technician, what went wrong, or any urgency..."
                  }
                  className="w-full bg-white border border-slate-200 text-slate-800 p-3 rounded-xl text-xs focus:border-[#0F8B8D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none resize-none placeholder:text-slate-400 rtl:text-right"
                />
              </div>

              {/* 5. Attach Photo Proof */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#123B5D]">
                    {isUrdu ? "5. تصاویر یا رسیدیں شامل کریں" : "5. Attach Photos / Proof"}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {isUrdu ? "واضح تصویر سے مسئلہ جلدی حل ہوتا ہے" : "Clear photos expedite resolution"}
                  </span>
                </div>

                <div
                  onClick={handleAddSampleFile}
                  className="bg-slate-50 border border-dashed border-slate-300 hover:border-[#0F8B8D] rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-center group"
                >
                  <div className="size-8 rounded-lg bg-white border border-slate-200 text-[#0F8B8D] flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                    <Camera className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-[#123B5D]">
                    {isUrdu ? "تصاویر یا رسید شامل کرنے کے لیے کلک کریں" : "Click to add photos or receipts"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    JPG, PNG (25MB تک)
                  </span>
                </div>

                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {attachedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-700"
                      >
                        <FileCheck className="size-3 text-emerald-600" />
                        <span className="truncate max-w-[140px]">{file}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(file);
                          }}
                          className="text-slate-400 hover:text-rose-600 ml-1 rtl:ml-0 rtl:mr-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. Desired Resolution */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#123B5D]">
                  {isUrdu ? "6. آپ کا مطلوبہ حل" : "6. Desired Resolution"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label
                    className={`flex flex-col gap-1 p-3 rounded-xl border cursor-pointer transition-all ${
                      resolutionPref === "rework"
                        ? "bg-[#0F8B8D]/5 border-[#0F8B8D] text-[#123B5D]"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">
                        {isUrdu ? "اسی کاریگر سے دوبارہ کام" : "Rework by Pro"}
                      </span>
                      <input
                        type="radio"
                        name="resolution_pref"
                        value="rework"
                        checked={resolutionPref === "rework"}
                        onChange={() => setResolutionPref("rework")}
                        className="accent-[#0F8B8D]"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {isUrdu
                        ? "کاریگر بغیر اضافی فیس کے خرابی ٹھیک کرے۔"
                        : "Technician fixes fault at Rs. 0 surcharge."}
                    </span>
                  </label>

                  <label
                    className={`flex flex-col gap-1 p-3 rounded-xl border cursor-pointer transition-all ${
                      resolutionPref === "replacement"
                        ? "bg-[#0F8B8D]/5 border-[#0F8B8D] text-[#123B5D]"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">
                        {isUrdu ? "متبادل سینئر کاریگر" : "Replacement Pro"}
                      </span>
                      <input
                        type="radio"
                        name="resolution_pref"
                        value="replacement"
                        checked={resolutionPref === "replacement"}
                        onChange={() => setResolutionPref("replacement")}
                        className="accent-[#0F8B8D]"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {isUrdu
                        ? "کسی دوسرے سینئر ماہر کو بھیجا جائے۔"
                        : "Assign a Senior verified specialist."}
                    </span>
                  </label>

                  <label
                    className={`flex flex-col gap-1 p-3 rounded-xl border cursor-pointer transition-all ${
                      resolutionPref === "callback"
                        ? "bg-[#0F8B8D]/5 border-[#0F8B8D] text-[#123B5D]"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">
                        {isUrdu ? "ڈیسک سے براہ راست کال" : "Desk Callback"}
                      </span>
                      <input
                        type="radio"
                        name="resolution_pref"
                        value="callback"
                        checked={resolutionPref === "callback"}
                        onChange={() => setResolutionPref("callback")}
                        className="accent-[#0F8B8D]"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {isUrdu
                        ? "آپریشنز سپروائزر فون پر بات کرے۔"
                        : "Operations supervisor calls you directly."}
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <UserCheck className="size-3.5 text-[#0F8B8D]" />
                  <span>
                    {isUrdu
                      ? "مرکزی آپریشنز سپورٹ ڈیسک کے زیرِ نگرانی"
                      : "Reviewed by central Operations Support Desk"}
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {isUrdu ? "منسوخ کریں" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !description.trim()}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>{isUrdu ? "ٹکٹ بن رہا ہے..." : "Creating Ticket..."}</span>
                      </>
                    ) : (
                      <span>{isUrdu ? "ٹکٹ جمع کروائیں" : "Submit Ticket"}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

