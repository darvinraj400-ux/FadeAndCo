"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Fallback height of the bar before it has been measured on screen. The real
// value includes the iOS safe-area inset (~34px on notched devices), which is
// why it is measured rather than hardcoded.
const FALLBACK_BAR_PX = 72;

// Mobile-only sticky booking CTA.
//
// Rendered from app/(marketing)/page.tsx rather than a layout on purpose:
// /case-study lives in the same route group, and /book and /admin live
// outside it, so a layout would leak the bar onto exactly the pages it must
// not appear on. It is also emitted *after* </footer> so it sits outside every
// <Reveal> wrapper — a transform on an ancestor would make this element its
// own containing block and break `position: fixed`.
export function MobileBookCta() {
  const [visible, setVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [barHeight, setBarHeight] = useState(FALLBACK_BAR_PX);
  const barRef = useRef<HTMLDivElement>(null);

  // Matches the `md:hidden` breakpoint exactly: Tailwind v4's md is 48rem and
  // rem in a media query resolves against the initial 16px, not the root.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    // `null` is the pre-measurement state; bail on desktop so we never pay for
    // the scroll listener or render a dead node.
    if (isDesktop !== false) return;

    let raf = 0;

    function measure() {
      const bar = barRef.current;
      if (bar) {
        const h = bar.getBoundingClientRect().height;
        // Measuring the live element is what keeps this honest on devices
        // with a safe-area inset; only re-render when it actually changed.
        setBarHeight((prev) => (Math.abs(prev - h) > 1 ? h : prev));
      }
      const footer = document.getElementById("site-footer");
      const pastHero = window.scrollY > window.innerHeight;
      // Keying on the footer rather than #faq: the FAQ block is ~400px tall,
      // so hiding on its top edge would drop the bar a full screen early.
      const footerArrived = footer
        ? footer.getBoundingClientRect().top <= barHeight
        : false;
      setVisible(pastHero && !footerArrived);
    }

    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [isDesktop, barHeight]);

  if (!visible) return null;

  return (
    <div
      ref={barRef}
      data-testid="mobile-book-cta"
      className="animate-in fade-in fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bone/90 backdrop-blur motion-reduce:animate-none md:hidden [padding-bottom:env(safe-area-inset-bottom,0px)]"
    >
      <div className="px-3 py-3">
        <Link
          href="/book"
          className="flex w-full items-center justify-center rounded-lg bg-brass px-5 py-3 text-sm font-medium text-ink transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          Book now
        </Link>
      </div>
    </div>
  );
}
