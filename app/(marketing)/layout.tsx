export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-full bg-zinc-950 text-zinc-100">{children}</div>;
}
