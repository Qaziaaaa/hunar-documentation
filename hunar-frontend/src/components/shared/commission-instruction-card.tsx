import { ArrowRight, Landmark, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HUNAR_CONFIG } from "@/lib/config";

export function CommissionInstructionCard({
  labels,
}: {
  labels: {
    title: string;
    bankAccountLabel: string;
    bankAccountPlaceholder: string;
    paymentMethodLabel: string;
    paymentMethodValue: string;
    afterPaymentTitle: string;
    whatsappInstruction: string;
    whatsappMessageExample: string;
  };
}) {
  const number = HUNAR_CONFIG.whatsappNumber;
  return (
    <Card className="border-teal/30 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-teal/10 text-teal">
            <Landmark aria-hidden="true" className="size-4" />
          </span>
          {labels.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-sm font-semibold text-navy">
            {labels.bankAccountLabel}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {HUNAR_CONFIG.bankAccountDetailsPlaceholder ??
              labels.bankAccountPlaceholder}
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {labels.paymentMethodLabel}
          </p>
          <p className="text-sm text-navy">{labels.paymentMethodValue}</p>
        </div>

        <div className="rounded-lg border border-orange/30 bg-orange/5 p-4">
          <div className="flex items-center gap-2">
            <MessageCircle aria-hidden="true" className="size-4 text-orange" />
            <p className="text-sm font-semibold text-navy">
              {labels.afterPaymentTitle}
            </p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.whatsappInstruction.replace("{number}", number)}
          </p>
          <a
            href={`https://wa.me/${number.replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal px-3 py-2 text-sm font-medium text-white transition-colors outline-none hover:bg-teal/85 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ArrowRight aria-hidden="true" className="size-4" />
            {number}
          </a>
          <p className="mt-3 text-xs italic text-muted-foreground">
            {labels.whatsappMessageExample.replace("{number}", number)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
