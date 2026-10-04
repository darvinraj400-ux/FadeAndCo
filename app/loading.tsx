import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-full bg-zinc-950">
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-16">
        <Skeleton className="h-8 w-2/3 bg-zinc-800" />
        <Skeleton className="h-4 w-full bg-zinc-800" />
        <Skeleton className="h-4 w-5/6 bg-zinc-800" />
        <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 w-full bg-zinc-800" />
          <Skeleton className="h-32 w-full bg-zinc-800" />
          <Skeleton className="h-32 w-full bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
