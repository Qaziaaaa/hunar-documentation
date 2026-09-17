import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFoundPage() {
  const t = useTranslations("NotFound");

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-16 text-center">
      <p className="text-6xl font-bold text-navy">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-navy">{t("title")}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t("description")}</p>
      <Link className="mt-8" href="/">
        <Button>{t("backHome")}</Button>
      </Link>
    </div>
  );
}