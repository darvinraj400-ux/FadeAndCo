import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { siteOrigin } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
});

const displaySerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "Fade & Co. — Barber Booking",
    template: "%s · Fade & Co.",
  },
  description:
    "Fade & Co. is a three-chair barbershop. Book online in under a minute — or just tell us what you want and let the AI figure it out.",
  openGraph: {
    title: "Fade & Co. — Barber Booking",
    description:
      "Sharp cuts, honest prices, no guesswork. Book online in under a minute.",
    type: "website",
    url: "/",
    siteName: "Fade & Co.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fade & Co. — Barber Booking",
    description:
      "Sharp cuts, honest prices, no guesswork. Book online in under a minute.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${displaySerif.variable} h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full flex flex-col`}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
