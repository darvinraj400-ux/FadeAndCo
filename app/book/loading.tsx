import { Skeleton } from "@/components/ui/skeleton";

export default function BookLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
