"use client";

import { useEffect, useRef, useState } from "react";

// One-shot scroll reveal: fade + 16px rise, 600ms ease-out. Fires once on
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
    setState("hidden");
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setState("shown");
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const hidden = state === "hidden";

  return (
    <div
      ref={ref}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`${className ?? ""} transition-all duration-[600ms] ease-out will-change-transform motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        hidden ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      {children}
    </div>
  );
}
