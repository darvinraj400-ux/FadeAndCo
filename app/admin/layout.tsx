import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Note: /admin access control is enforced in middleware.ts (layouts cannot
// read the request path, so gating there would redirect-loop /admin/login).
// This layout renders the dark admin shell + header.
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="admin-dark min-h-screen bg-coal text-cream">
      <header className="sticky top-0 z-30 border-b border-cream/10 bg-coal/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="border-l-2 border-gold pl-3 font-display text-lg tracking-tight text-cream transition-colors hover:text-gold"
            >
              Fade &amp; Co. Admin
            </Link>
            <nav className="flex items-center gap-5 text-sm text-cream/60">
              <Link href="/admin" className="hover:text-cream">
                Today
              </Link>
              <Link href="/admin/appointments" className="hover:text-cream">
                Appointments
              </Link>
              <Link href="/admin/services" className="hover:text-cream">
                Services
              </Link>
              <Link href="/admin/barbers" className="hover:text-cream">
                Barbers
              </Link>
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
