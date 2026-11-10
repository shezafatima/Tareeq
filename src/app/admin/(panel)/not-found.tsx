import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import EmptyState from "@/components/admin/EmptyState";

export default function PanelNotFound() {
  return (
    <div className="space-y-6">
      <h1 className="sr-only">Not found</h1>
      <EmptyState icon={MagnifyingGlass} title="We couldn't find that.">
        <Link href="/admin/programs" className="inline-flex min-h-11 items-center font-semibold text-royal underline underline-offset-4">
          Back to programs
        </Link>
      </EmptyState>
    </div>
  );
}
