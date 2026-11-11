import Skeleton from "@/components/admin/Skeleton";

// The dashboard's own loading state, in the shape of the page (specs/029-admin-dashboard contracts/routes-and-ui.md).
export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Loading" className="grid gap-3 lg:grid-cols-12 lg:items-start lg:gap-4">
      <Skeleton className="h-20 rounded-2xl lg:col-span-5" />
      <Skeleton className="h-20 rounded-2xl lg:col-span-7" />
      <div className="grid grid-cols-2 gap-3 lg:col-span-12 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3 lg:col-span-5 lg:space-y-4">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <div className="space-y-3 lg:col-span-7 lg:space-y-4">
        <Skeleton className="h-60 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    </div>
  );
}
