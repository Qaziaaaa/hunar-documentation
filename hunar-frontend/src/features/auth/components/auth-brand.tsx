import { Link } from "@/i18n/navigation";
import { OrderworkerLogo } from "@/components/shared/orderworker-logo";

export function AuthBrand() {
  return (
    <Link
      href="/"
      title="Orderworker Home"
      className="group flex items-center gap-2 transition-opacity hover:opacity-90"
    >
      <OrderworkerLogo variant="dark" size="md" showBadge={true} />
    </Link>
  );
}