import { Link } from "@/i18n/navigation";
import { WorkerFixLogo } from "@/components/shared/workerfix-logo";

export function AuthBrand() {
  return (
    <Link
      href="/"
      title="WorkerFIX Home"
      className="group flex items-center gap-2 transition-opacity hover:opacity-90"
    >
      <WorkerFixLogo variant="dark" size="md" />
    </Link>
  );
}