export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-full bg-bone text-ink">{children}</div>;
}
