"use client";

import { useState } from "react";

export function FaqSection({
  items,
}: {
  items: Array<{ q: string; a: string }>;
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20 md:py-28">
      <p className="font-mono text-xs tracking-widest text-bronze">QUESTIONS</p>
      <h2 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
        FAQ
      </h2>
      <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-parchment px-5">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                className="flex w-full items-center justify-between gap-4 py-4 text-left focus-visible:outline-2 focus-visible:outline-bronze"
              >
                <span className="font-medium">{item.q}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                  className={`shrink-0 text-bronze transition-transform duration-300 ease-out motion-reduce:transition-none ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>
              <div
                id={`faq-panel-${i}`}
                role="region"
                data-open={isOpen}
                className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out data-[open=true]:grid-rows-[1fr] motion-reduce:transition-none"
              >
                <div className="min-h-0 overflow-hidden">
                  <p className="pb-4 text-sm text-bark">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
