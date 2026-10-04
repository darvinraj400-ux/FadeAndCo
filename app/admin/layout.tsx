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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="font-serif text-sm font-semibold tracking-tight text-white"
            >
              Fade &amp; Co. Admin
            </Link>
            <nav className="flex items-center gap-5 text-sm text-zinc-400">
              <Link href="/admin" className="hover:text-white">
                Today
              </Link>
              <Link href="/admin/appointments" className="hover:text-white">
                Appointments
              </Link>
              <Link href="/admin/services" className="hover:text-white">
                Services
              </Link>
              <Link href="/admin/barbers" className="hover:text-white">
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
