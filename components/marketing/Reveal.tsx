"use client";

import { useEffect, useRef, useState } from "react";

// One-shot scroll reveal: fade + 20px rise, 600ms ease-out. Fires once on
// viewport entry; renders visible immediately under prefers-reduced-motion.
export function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Start visible: no-JS and pre-hydration render full content. The effect
  // below hides (when motion is OK) and reveals on entry.
  const [state, setState] = useState<"visible" | "hidden" | "shown">(
    "visible"
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Resolve the already-decided cases up front. IntersectionObserver never
    // fires for an element that is outside the root at mount, so without this
    // a deep link (or a reload that restores scroll) would leave everything
    // above the fold stuck at opacity 0.
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
    <div
      ref={ref}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`${className ?? ""} transition-all duration-[600ms] ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        hidden ? "translate-y-5 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      {children}
    </div>
  );
}
