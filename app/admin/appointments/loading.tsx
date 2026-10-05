import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAppointmentsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/4 bg-cream/10" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 bg-cream/10" />
        <Skeleton className="h-8 w-24 bg-cream/10" />
        <Skeleton className="h-8 w-24 bg-cream/10" />
      </div>
      <Skeleton className="h-96 w-full bg-cream/10" />
    </div>
  );
}
