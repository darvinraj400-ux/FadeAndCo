import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3 bg-zinc-800" />
      <Skeleton className="h-4 w-1/2 bg-zinc-800" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-64 w-full bg-zinc-800" />
        <Skeleton className="h-64 w-full bg-zinc-800" />
        <Skeleton className="h-64 w-full bg-zinc-800" />
      </div>
    </div>
  );
}
