import { Briefcase } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./empty-state";

export function EmptyJobsState({
  title,
  description,
  checkAgainLabel,
  expandAreaLabel,
  onCheckAgain,
  checking,
}: {
  title: string;
  description: string;
  checkAgainLabel: string;
  expandAreaLabel: string;
  onCheckAgain: () => void;
  checking?: boolean;
}) {
  return (
    <EmptyState
      icon={Briefcase}
      title={title}
      description={description}
      actions={
        <>
          <Button
            className="bg-teal hover:bg-teal/85"
            onClick={onCheckAgain}
            disabled={checking}
          >
            {checkAgainLabel}
          </Button>
          <Button variant="outline" render={<Link href="/worker/profile" />}>
            {expandAreaLabel}
          </Button>
        </>
      }
    />
  );
}
