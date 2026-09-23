"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  CopyCheck,
  ImageUp,
  Landmark,
  MessageCircle,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HUNAR_CONFIG } from "@/lib/config";
import { formatRsExact } from "@/lib/money";

interface WalletTopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitScreenshot?: (amount: number, file: File) => Promise<void>;
}

export function WalletTopUpModal({
  open,
  onOpenChange,
  onSubmitScreenshot,
}: WalletTopUpModalProps) {
  const whatsappNumber = HUNAR_CONFIG.whatsappNumber ?? "+92 314 0837519";
  const cleanNumber = whatsappNumber.replace(/[^\d]/g, "");

  const [amount, setAmount] = useState<number>(500);
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be under 5MB");
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 50) {
      setError("Please enter a valid top-up amount (minimum Rs. 50)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (onSubmitScreenshot && selectedFile) {
        await onSubmitScreenshot(amount, selectedFile);
      } else {
        // Simulate successful submission
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
        setSelectedFile(null);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit top-up proof",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 border-teal/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-navy flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-teal/10 text-teal">
              <Landmark className="size-5" />
            </span>
            Top Up HUNAR Wallet
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Send money to HUNAR via EasyPaisa, JazzCash, or Bank Transfer, then
            upload the screenshot proof below.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="text-lg font-semibold text-navy">
              Top-Up Submitted!
            </h3>
            <p className="text-sm text-muted-foreground">
              HUNAR admin will verify your payment and credit{" "}
              <strong className="text-navy">{formatRsExact(amount)}</strong> to
              your wallet shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {/* Payment Details Box */}
            <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-teal">
                  HUNAR Official Account
                </span>
                <span className="text-[11px] font-medium text-navy bg-white px-2 py-0.5 rounded border border-teal/15">
                  EasyPaisa / JazzCash / Bank
                </span>
              </div>

              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-border shadow-xs">
                <div>
                  <p className="text-xs text-muted-foreground">Account Title & Number</p>
                  <p className="text-base font-bold text-navy">
                    {whatsappNumber}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">HUNAR Services Platform</p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0 border-teal/30 text-teal hover:bg-teal hover:text-white"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="size-3.5 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 mr-1" />
                      Copy Number
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Amount Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-navy">
                Select or Enter Top-Up Amount (PKR)
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {[300, 500, 1000, 2000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all ${
                      amount === val
                        ? "border-teal bg-teal text-white shadow-xs"
                        : "border-border bg-card text-navy hover:bg-muted"
                    }`}
                  >
                    Rs. {val}
                  </button>
                ))}
              </div>

              <div className="mt-2">
                <Input
                  type="number"
                  min={50}
                  step={50}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Enter custom amount"
                  className="h-10 text-sm font-semibold text-navy border-border"
                />
              </div>
            </div>

            {/* Proof Upload / WhatsApp */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-navy">
                Upload Payment Screenshot Proof
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-teal/30 bg-muted/30 p-4 text-center hover:bg-teal/5 transition-colors"
              >
                {selectedFile ? (
                  <div className="flex items-center gap-2 text-teal font-medium text-xs">
                    <CheckCircle2 className="size-4" />
                    <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="size-6 text-teal mb-1" />
                    <p className="text-xs font-medium text-navy">
                      Click to choose screenshot image
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      JPG, PNG, WebP up to 5MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Direct WhatsApp Fallback */}
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800">
                <MessageCircle className="size-4 shrink-0 text-emerald-600" />
                <span>Prefer to send proof on WhatsApp directly?</span>
              </div>
              <a
                href={`https://wa.me/${cleanNumber}?text=Assalam-o-Alaikum%20HUNAR,%20I%20have%20sent%20Rs.%20${amount}%20for%20wallet%20topup.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1.5 font-medium text-white hover:bg-emerald-700 shrink-0"
              >
                Send WhatsApp <ArrowRight className="size-3" />
              </a>
            </div>

            {error && (
              <p className="text-xs font-medium text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-1/2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-1/2 bg-teal hover:bg-teal/90 text-white font-semibold"
              >
                {loading ? "Submitting..." : "Submit Top-Up"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
