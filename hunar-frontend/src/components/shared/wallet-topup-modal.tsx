"use client";

import { useLocale } from "next-intl";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WalletTopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitScreenshot?: (amount: number, file: File) => Promise<void>;
}

export function WalletTopUpModal({
  open,
  onOpenChange,
}: WalletTopUpModalProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-sm p-6 text-center rounded-2xl border-teal/20">
        <DialogHeader className="space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-teal/10 text-teal">
            <Landmark className="size-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-navy text-center">
            {isUrdu ? "والیٹ ٹاپ اپ" : "Top Up Wallet"}
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold text-slate-700 text-center">
            {isUrdu ? "ٹاپ اپ کے لیے ایڈمن سے رابطہ کریں" : "Contact admin for top up"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl bg-teal hover:bg-teal/90 text-white font-bold text-xs h-10 cursor-pointer"
          >
            {isUrdu ? "ٹھیک ہے" : "OK"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
