import { BookPageClient } from "@/components/booking/BookPageClient";

export default function BookPage() {
  return (
    <div className="min-h-full bg-bone text-ink">
      <section className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="font-display text-3xl tracking-tight md:text-4xl">
          Book an appointment
        </h1>
        <p className="mt-1 text-sm text-bark">
          Pick a service, barber, and time — confirmation is instant.
        </p>
        <div className="mt-6">
          <BookPageClient />
        </div>
      </section>
    </div>
  );
}
