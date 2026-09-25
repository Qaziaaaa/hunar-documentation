"use client";

import { useState } from "react";
import { Calculator, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRsExact } from "@/lib/money";

export function CommissionCalculator() {
  const [visitCharge, setVisitCharge] = useState<number>(500);
  const [repairCharge, setRepairCharge] = useState<number>(1500);

  const commission = Math.round(visitCharge * 0.1);
  const workerNetVisit = visitCharge - commission;
  const totalCustomerPay = visitCharge + repairCharge;
  const totalWorkerTakeHome = workerNetVisit + repairCharge;

  return (
    <Card className="border-teal/20 shadow-sm overflow-hidden bg-card">
      <CardHeader className="bg-gradient-to-r from-navy/5 to-teal/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-navy text-lg">
          <span className="flex size-8 items-center justify-center rounded-lg bg-teal/10 text-teal">
            <Calculator className="size-4.5" />
          </span>
          WorkerFIX 10% Commission Calculator
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Calculate exact platform commission holds and net earnings for any visit.
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Interactive Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-navy">
              Visiting Charge (PKR)
            </Label>
            <Input
              type="number"
              min={100}
              step={50}
              value={visitCharge}
              onChange={(e) => setVisitCharge(Math.max(0, Number(e.target.value)))}
              className="h-10 text-sm font-semibold text-navy border-teal/30 focus-visible:ring-teal"
            />
            <p className="text-[11px] text-teal font-medium">
              10% Commission applies ONLY to this visit fee.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-navy">
              Estimated Repair Price (PKR)
            </Label>
            <Input
              type="number"
              min={0}
              step={100}
              value={repairCharge}
              onChange={(e) => setRepairCharge(Math.max(0, Number(e.target.value)))}
              className="h-10 text-sm font-semibold text-navy"
            />
            <p className="text-[11px] text-muted-foreground">
              0% commission on repair parts & labor! You keep 100%.
            </p>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="rounded-xl border border-border bg-slate-50 p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
            Earnings Breakdown
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-600">Customer Total Payment:</span>
              <span className="font-bold text-navy">{formatRsExact(totalCustomerPay)}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-600 flex items-center gap-1.5">
                HUNAR Commission (10% of {formatRsExact(visitCharge)}):
              </span>
              <span className="font-bold text-orange-600">
                - {formatRsExact(commission)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 text-base font-extrabold text-navy">
              <span className="text-teal font-bold flex items-center gap-1">
                <CheckCircle2 className="size-4 text-teal" />
                Worker Net Take-Home:
              </span>
              <span className="text-teal text-lg">
                {formatRsExact(totalWorkerTakeHome)}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Step Lifecycle Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border border-orange/20 bg-orange/5 p-3 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-navy">
              <span className="flex size-5 items-center justify-center rounded-full bg-orange/20 text-orange-700 text-[10px]">
                1
              </span>
              "I've Arrived"
            </div>
            <p className="text-slate-600 leading-snug">
              {formatRsExact(commission)} is <strong>held</strong> from your HUNAR wallet when you arrive at doorstep.
            </p>
          </div>

          <div className="rounded-lg border border-teal/20 bg-teal/5 p-3 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-navy">
              <span className="flex size-5 items-center justify-center rounded-full bg-teal/20 text-teal-700 text-[10px]">
                2
              </span>
              OTP Confirmed
            </div>
            <p className="text-slate-600 leading-snug">
              The {formatRsExact(commission)} held commission is <strong>deducted</strong> when customer confirms security OTP.
            </p>
          </div>

          <div className="rounded-lg border border-emerald/20 bg-emerald-50 p-3 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-navy">
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-200 text-emerald-800 text-[10px]">
                3
              </span>
              Job Cancelled?
            </div>
            <p className="text-slate-600 leading-snug">
              If cancelled before OTP, the {formatRsExact(commission)} hold is <strong>100% returned</strong> to your wallet.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
