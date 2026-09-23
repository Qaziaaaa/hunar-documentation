"use client";

import { useState } from "react";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
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
import { Select } from "@/components/ui/select";
import { formatRsExact } from "@/lib/money";

interface WalletWithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletBalance: number;
  onWithdraw?: (amount: number, accountDetails: string) => Promise<void>;
}

export function WalletWithdrawModal({
  open,
  onOpenChange,
  walletBalance,
  onWithdraw,
}: WalletWithdrawModalProps) {
  const [amount, setAmount] = useState<number>(500);
  const [method, setMethod] = useState<string>("easypaisa");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountTitle, setAccountTitle] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 100) {
      setError("Minimum withdrawal amount is Rs. 100");
      return;
    }

    if (amount > walletBalance) {
      setError(`Cannot withdraw more than available balance (${formatRsExact(walletBalance)})`);
      return;
    }

    if (!accountNumber || accountNumber.trim().length < 8) {
      setError("Please enter a valid mobile wallet or bank account number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (onWithdraw) {
        await onWithdraw(amount, `${method.toUpperCase()}: ${accountNumber} (${accountTitle})`);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  const methodOptions = [
    { label: "EasyPaisa Account", value: "easypaisa" },
    { label: "JazzCash Mobile Wallet", value: "jazzcash" },
    { label: "Bank Account / IBAN", value: "bank" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 border-teal/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-navy flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-teal/10 text-teal">
              <ArrowUpRight className="size-5" />
            </span>
            Withdraw Earnings
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Withdraw your HUNAR earnings directly to EasyPaisa, JazzCash, or Bank IBAN (Min Rs. 100).
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="text-lg font-semibold text-navy">Payout Processed!</h3>
            <p className="text-sm text-muted-foreground">
              <strong className="text-navy">{formatRsExact(amount)}</strong> has been requested for automated transfer to {accountNumber}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="space-y-4 mt-2">
            <div className="rounded-lg bg-navy/5 p-3 flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">Available Balance:</span>
              <span className="text-sm font-bold text-navy">{formatRsExact(walletBalance)}</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-navy">Withdrawal Amount (Min Rs. 100)</Label>
              <Input
                type="number"
                min={100}
                max={walletBalance}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Amount in PKR"
                className="h-10 text-sm font-semibold text-navy"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-navy">Payout Method</Label>
              <Select
                value={method}
                onValueChange={(val) => setMethod(val ?? "easypaisa")}
                options={methodOptions}
                placeholder="Select payout method"
                className="h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-navy">Account Title</Label>
                <Input
                  type="text"
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                  placeholder="e.g. Abdullah Khan"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-navy">Account / Mobile Number</Label>
                <Input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="03xx-xxxxxxx"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs font-medium text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {error}
              </p>
            )}

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
                disabled={loading || walletBalance < 100}
                className="w-1/2 bg-teal hover:bg-teal/90 text-white font-semibold"
              >
                {loading ? "Processing..." : "Confirm Payout"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
