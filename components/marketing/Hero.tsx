"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

// Cinematic hero: full-viewport photograph, dark gradient overlays, left
// content. The image translates at 30% of scroll speed. Because the translate
// is always downward, the image's bottom edge stays past the bottom of the
// hero for every scroll offset, and the only gap that opens is at the hero's
// top edge — which has already scrolled off-screen. The `scale-[1.08]` is
// there to soften the move, not to hide edges. Reduced-motion: static image.
export function Hero() {
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (imgRef.current) {
          imgRef.current.style.transform = `translateY(${window.scrollY * 0.3}px)`;
        }
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#111111] md:min-h-screen">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          ref={imgRef}
          className="relative h-full w-full scale-[1.08] will-change-transform"
        >
          <Image
            src="/images/hero.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[60%_center]"
          />
          <noscript>
            {/* JPEG sibling of the WebP above, for no-JS clients. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero.jpg"
              alt=""
              width={1920}
              height={1080}
              className="h-full w-full object-cover object-[60%_center]"
            />
          </noscript>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(17,17,17,0.85)_0%,rgba(17,17,17,0.55)_50%,rgba(17,17,17,0.2)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_top,rgba(17,17,17,0.9),transparent_40%)]"
      />
      <div className="relative mx-auto w-full max-w-5xl px-4 py-24">
        <p className="font-mono text-xs tracking-widest text-brass">
          EST. 2018 · BANGSAR, KL
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.5rem,10vw,4rem)] leading-[1.05] tracking-tight text-[#F4F0E8] md:text-7xl">
          Sharp cuts. Honest prices. No guesswork.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[#F4F0E8]/85">
          Fade &amp; Co. is a three-chair barbershop. Book online in under a
          minute — or just tell us what you want and let the AI figure it out.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/book"
            className="rounded-lg bg-brass px-5 py-2.5 text-sm font-medium text-ink transition hover:brightness-110 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            Book now
          </Link>
          <a
            href="#services"
            className="rounded-lg border border-[#F4F0E8]/40 px-5 py-2.5 text-sm font-medium text-[#F4F0E8] transition hover:border-brass hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            See services
          </a>
        </div>
        <p className="mt-6 font-mono text-xs text-[#F4F0E8]/70">
          Walk-ins welcome · Open 7 days
        </p>
      </div>
    </section>
  );
}
