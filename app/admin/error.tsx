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
      <h1 className="text-2xl font-semibold text-white">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        The admin view failed to load. Your data is safe — try again.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-zinc-500">
          Reference: {error.digest}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-500"
      >
        Try again
      </button>
    </div>
  );
}
