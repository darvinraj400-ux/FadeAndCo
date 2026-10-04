import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Case study",
  description:
    "How Fade & Co. was built: race-safe multi-barber scheduling with natural-language booking input.",
};

// Layer 6B builds this page.
export default function CaseStudyPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Case study</h1>
      <p className="mt-2 text-muted-foreground">Coming soon.</p>
    </section>
  );
}
