import { ArrowLeft, ClipboardPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PostJobPage() {
  const t = useTranslations("Customer");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-orange/10 text-orange">
            <ClipboardPlus aria-hidden="true" className="size-6" />
          </div>
          <CardTitle>{t("postJob.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("postJob.description")}</p>
          <Button variant="outline" className="w-full" render={<Link href="/" />}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t("postJob.backHome")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}