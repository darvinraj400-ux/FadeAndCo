export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="font-semibold">Fade &amp; Co.</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-4 text-sm text-muted-foreground">
          Fade &amp; Co. — stub footer (Layer 1)
        </div>
      </footer>
    </div>
  );
}
