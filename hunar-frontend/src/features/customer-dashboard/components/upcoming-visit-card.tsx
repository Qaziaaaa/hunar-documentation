"use client";

import {
  CheckCircle2,
  Eye,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MOCK_UPCOMING_BOOKING } from "../mock/customer-mock-data";

export function UpcomingVisitCard() {
  const booking = MOCK_UPCOMING_BOOKING;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Immediate Booking
        </span>
        <span className="inline-flex items-center gap-1 text-[#0F8B8D] text-[11px] font-bold bg-[#0F8B8D]/10 px-2 py-0.5 rounded border border-[#0F8B8D]/20">
          <ShieldCheck className="size-3.5" />
          OTP Secured
        </span>
      </div>

      {/* Appointment Inner Box */}
      <div className="border border-slate-200 p-4 rounded-xl flex flex-col gap-3 bg-white shadow-2xs">
        {/* Date & Time Slot */}
        <div className="flex items-center gap-3">
          <div className="bg-[#123B5D] text-white rounded-lg p-2.5 flex flex-col items-center justify-center min-w-[56px] shadow-2xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#0F8B8D]">
              {booking.month}
            </span>
            <span className="text-xl leading-none font-bold text-white mt-0.5">
              {booking.day}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              {booking.timeSlot}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {booking.slotLabel}
            </span>
          </div>
        </div>

        <div className="h-[1px] bg-slate-100 my-0.5"></div>

        {/* Service Item */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Service Item
          </span>
          <p className="text-xs sm:text-sm font-bold text-[#123B5D]">
            {booking.serviceItem}
          </p>
        </div>

        {/* Pro Profile Micro-Card */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#123B5D] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {booking.worker.avatarInitials}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {booking.worker.name}
                </span>
                <CheckCircle2 className="size-3.5 text-[#16A34A] shrink-0" />
              </div>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                {booking.worker.title} • {booking.worker.rating}
                <Star className="size-3 fill-amber-400 text-amber-400 inline" />
                ({booking.worker.reviewsCount})
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-bold text-[#0F8B8D] block">
              Rs. {booking.baseCharge.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Base Visit Fee</span>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 pt-0.5">
          <MapPin className="size-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-snug">
            {booking.address}
          </p>
        </div>

        {/* Security OTP Pill */}
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Completion OTP:</span>
          <span className="font-mono font-bold tracking-widest text-slate-900 bg-white border border-slate-200 px-2.5 py-0.5 rounded shadow-2xs">
            {booking.completionOtp}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Link
          href={`/customer/job/${booking.jobId}/tracking`}
          className="w-full py-2 px-3 rounded-lg bg-[#0F8B8D] text-white text-xs hover:bg-[#0F8B8D]/90 transition-colors flex items-center justify-center gap-1.5 font-semibold shadow-2xs"
        >
          <Eye className="size-3.5" />
          <span>Details</span>
        </Link>
        <Link
          href="/customer/chat"
          className="w-full py-2 px-3 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 font-semibold"
        >
          <MessageSquare className="size-3.5 text-slate-400" />
          <span>Message</span>
        </Link>
      </div>
    </div>
  );
}
