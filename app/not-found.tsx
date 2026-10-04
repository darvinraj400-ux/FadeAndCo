import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 bg-zinc-950 text-zinc-100">
      <div className="mx-auto w-full max-w-5xl px-4 py-24 text-center">
        <p className="font-mono text-sm text-zinc-500">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          This chair is empty.
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-400"
        >
          Back home
        </Link>
        <p className="mt-12 text-xs text-zinc-600">
          Fade &amp; Co. is a fictional barbershop. This is a portfolio piece.
        </p>
      </div>
    </div>
  );
}
