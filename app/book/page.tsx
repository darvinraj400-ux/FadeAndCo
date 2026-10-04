import { BookPageClient } from "@/components/booking/BookPageClient";

export default function BookPage() {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <section className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Book an appointment</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Pick a service, barber, and time — confirmation is instant.
        </p>
        <div className="mt-6">
          <BookPageClient />
        </div>
      </section>
    </div>
  );
}
