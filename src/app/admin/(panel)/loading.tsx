import Skeleton from "@/components/admin/Skeleton";

// Shown while an admin page's server reads run.
export default function PanelLoading() {
  return (
    <div role="status" aria-label="Loading">
      <Skeleton className="h-9 w-48" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
