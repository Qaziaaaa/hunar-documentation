import { ArrowLeft, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const t = useTranslations("Auth");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("login.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("login.description")}</p>
          <Button className="w-full bg-teal hover:bg-teal/85" render={<Link href="/worker" />}>
            <LogIn aria-hidden="true" className="size-4" />
            {t("login.continue")}
          </Button>
          <Button variant="ghost" className="w-full" render={<Link href="/" />}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t("common.backHome")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}