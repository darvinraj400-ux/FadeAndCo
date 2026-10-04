import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAppointmentsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/4 bg-zinc-800" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 bg-zinc-800" />
        <Skeleton className="h-8 w-24 bg-zinc-800" />
        <Skeleton className="h-8 w-24 bg-zinc-800" />
      </div>
      <Skeleton className="h-96 w-full bg-zinc-800" />
    </div>
  );
}
