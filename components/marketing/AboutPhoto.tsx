"use client";

import { useEffect, useRef, useState } from "react";
import { Photo } from "@/components/marketing/Photo";

// About interior photo: square frame offset down-right, slides up 20px over
// 700ms on entry while the brass hairline border fades in after. One-shot.
// Starts visible so no-JS and pre-hydration render the full image.
export function AboutPhoto() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"visible" | "hidden" | "shown">("visible");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Same guard as Reveal: IntersectionObserver never fires for an element
    // that starts outside the viewport, so decide the already-visible case
    // up front instead of waiting for a callback that will not come.
    const rect = node.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top <= window.innerHeight * 0.92) {
      setState("shown");
      return;
    }

    setState("hidden");
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("shown");
          obs.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -5% 0px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const hidden = state === "hidden";

  return (
    <div ref={ref} className="md:translate-x-4 md:translate-y-4">
      <div
        className={`overflow-hidden rounded-2xl border border-brass transition-opacity delay-300 duration-700 motion-reduce:transition-none ${
          hidden ? "opacity-0" : "opacity-100"
        }`}
      >
        <div
          className={`aspect-square w-full transition-all duration-700 ease-out motion-reduce:transition-none ${
            hidden
              ? "translate-y-5 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
              : "translate-y-0 opacity-100"
          }`}
        >
          <Photo
            name="shop-interior"
            width={1200}
            height={900}
            alt="Inside the Fade & Co. shop — three chairs under warm lamps"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
