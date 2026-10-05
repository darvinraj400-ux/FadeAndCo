import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 bg-bone text-ink">
      <div className="mx-auto w-full max-w-5xl px-4 py-24 text-center">
        <p className="font-mono text-sm text-bark">404</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          This chair is empty.
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-bark">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-brass px-5 py-2.5 text-sm font-medium text-ink hover:bg-brass/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
        >
          Back home
        </Link>
        <p className="mt-12 text-xs text-bark">
          Fade &amp; Co. is a fictional barbershop. This is a portfolio piece.
        </p>
      </div>
    </div>
  );
}
