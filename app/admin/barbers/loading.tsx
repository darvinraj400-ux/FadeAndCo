import { Skeleton } from "@/components/ui/skeleton";

export default function AdminBarbersLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/4 bg-zinc-800" />
      <Skeleton className="h-64 w-full bg-zinc-800" />
    </div>
  );
}
