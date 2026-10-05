"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("admin error:", error);
  }, [error]);

  return (
    <div className="py-16 text-center">
      <h1 className="font-display text-3xl tracking-tight text-cream">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-cream/60">
        The admin view failed to load. Your data is safe — try again.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-cream/40">
          Reference: {error.digest}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-lg border border-cream/15 px-4 py-2 text-sm text-cream hover:border-brass"
      >
        Try again
      </button>
    </div>
  );
}
