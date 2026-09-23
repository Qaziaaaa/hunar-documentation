import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkerSignupPage() {
  const t = useTranslations("Auth");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-teal/10 text-teal">
            <BriefcaseBusiness aria-hidden="true" className="size-6" />
          </div>
          <CardTitle>{t("workerSignup.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("workerSignup.description")}</p>
          <Button className="w-full bg-teal hover:bg-teal/85" render={<Link href="/login" />}>
            {t("workerSignup.continue")}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}