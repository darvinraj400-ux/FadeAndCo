import { Skeleton } from "@/components/ui/skeleton";

export default function AdminServicesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/4 bg-cream/10" />
      <Skeleton className="h-64 w-full bg-cream/10" />
    </div>
  );
}
