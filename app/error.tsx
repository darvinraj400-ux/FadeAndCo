"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded border px-3 py-1.5 text-sm"
      >
        Try again
      </button>
    </div>
  );
}
