import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-16 text-center">
      <span className="inline-flex items-center rounded-full bg-secondary px-4 py-1.5 text-sm text-navy">
        {t("Home.heroBadge")}
      </span>
      <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-navy sm:text-5xl">
        {t("Home.heroTitle")}
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        {t("Home.heroSubtitle")}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/signup/worker">
          <Button size="lg" className="bg-teal text-white hover:bg-teal/85">
            {t("Home.ctaWorker")}
          </Button>
        </Link>
        <Link href="/post-job">
          <Button size="lg" variant="outline">
            {t("Home.ctaPostJob")}
          </Button>
        </Link>
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        HUNAR {t("Common.slogan")}
      </p>
    </div>
  );
}