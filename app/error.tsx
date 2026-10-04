"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("app error:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Please try again. If the problem persists, contact the shop.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:border-zinc-500"
      >
        Try again
      </button>
    </div>
  );
}
