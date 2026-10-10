"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const ANNOUNCE_KEY = "fade_announcement_dismissed";

const LINKS = [
  { href: "#services", label: "Services" },
  { href: "#barbers", label: "Barbers" },
  { href: "#gallery", label: "Gallery" },
  { href: "#location", label: "Hours" },
  { href: "#faq", label: "FAQ" },
  { href: "/book", label: "Book" },
];

export function SiteHeader() {
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(ANNOUNCE_KEY) === "1") setDismissed(true);
    } catch {
      // sessionStorage unavailable (private mode) — bar stays visible.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        toggleRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    function onChange(e: MediaQueryListEvent) {
      if (e.matches) setDrawerOpen(false);
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(ANNOUNCE_KEY, "1");
    } catch {
      // Non-persistent — bar reappears next visit.
    }
  }

  return (
    <>
      {ready ? (
        <div
          className={`grid bg-bone transition-all duration-200 ease-out ${
            dismissed
              ? "invisible grid-rows-[0fr] opacity-0"
              : "grid-rows-[1fr] opacity-100"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="relative flex h-9 items-center justify-center border-l-2 border-brass px-4">
              <p className="hidden font-mono text-xs text-bark sm:block">
                Walk-ins welcome · Tue–Sun · 03-2288 XXXX
              </p>
              <p className="font-mono text-xs text-bark sm:hidden">
                Walk-ins welcome · Tue–Sun
              </p>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss announcement"
                tabIndex={dismissed ? -1 : undefined}
                className="absolute right-3 rounded p-1 text-bark hover:text-ink focus-visible:outline-2 focus-visible:outline-bronze"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M2 2l8 8M10 2l-8 8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="sticky top-0 z-10 border-b border-line bg-bone/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-display text-2xl">
            Fade &amp; Co.
          </Link>
          <div className="hidden items-center gap-6 text-sm text-bark sm:flex">
            <a href="#services" className="hover:text-ink">
              Services
            </a>
            <a href="#barbers" className="hover:text-ink">
              Barbers
            </a>
            <a href="#gallery" className="hover:text-ink">
              Gallery
            </a>
            <a href="#location" className="hover:text-ink">
              Hours
            </a>
            <a href="/book" className="hover:text-ink">
              Book
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:+60322880000"
              className="hidden font-mono text-xs text-bark hover:text-ink md:block"
            >
              03-2288 XXXX
            </a>
            <Link
              href="/book"
              className="rounded-lg bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
            >
              Book now
            </Link>
            <button
              type="button"
              ref={toggleRef}
              onClick={() => setDrawerOpen((v) => !v)}
              aria-expanded={drawerOpen}
              aria-controls="mobile-nav"
              aria-label={drawerOpen ? "Close navigation menu" : "Open navigation menu"}
              className="rounded p-2 text-ink hover:bg-parchment focus-visible:outline-2 focus-visible:outline-bronze sm:hidden"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                {drawerOpen ? (
                  <path d="M4 4l12 12M16 4L4 16" />
                ) : (
                  <path d="M3 5h14M3 10h14M3 15h14" />
                )}
              </svg>
            </button>
          </div>
        </div>
        <div
          id="mobile-nav"
          inert={!drawerOpen}
          className={`grid transition-all duration-200 ease-out sm:hidden ${
            drawerOpen
              ? "grid-rows-[1fr] opacity-100"
              : "invisible grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="flex flex-col gap-1 border-t border-line px-4 py-3">
              {LINKS.map((l) => (
                <a
                  key={l.href + l.label}
                  href={l.href}
                  onClick={() => setDrawerOpen(false)}
                  className="rounded px-2 py-2 text-sm text-bark hover:bg-parchment hover:text-ink"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="tel:+60322880000"
                aria-label="Call the shop"
                className="rounded px-2 py-2 font-mono text-xs text-bark hover:bg-parchment hover:text-ink"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                  className="mr-2 inline"
                >
                  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.9z" />
                </svg>
                03-2288 XXXX
              </a>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
