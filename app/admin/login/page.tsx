"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Wrong password.");
        } else {
          toast.error("Login unavailable. Try again later.");
        }
        setPassword("");
        return;
      }
      // Hard navigation. /admin is gated by middleware on the fade_admin
      // cookie this request just set. A soft router transition did not
      // reliably land there — the URL stayed on /admin/login — whereas a
      // document request re-runs middleware with the cookie in hand and
      // leaves no pre-auth RSC payload in the client router cache.
      window.location.href = "/admin";
    } catch {
      toast.error("Could not log in. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      {/* Card is the "surface" token (#1a1a1a) on the matte-black shell
          (#111111) — a card painted the same colour as the page reads as
          nothing at all. The brass hairline alone is too faint to carry it. */}
      <Card className="w-full max-w-sm border-gold/25 bg-panel text-cream">
        <CardHeader>
          <CardTitle className="font-display text-2xl text-cream">
            Fade &amp; Co. Admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-password" className="text-cream/70">
                Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                autoComplete="current-password"
                autoFocus
                className="border-gold/15 bg-coal text-cream"
              />
            </div>
            <Button
              type="submit"
              disabled={busy || !password}
              className="bg-gold text-ink hover:bg-gold/85"
            >
              {busy ? "Checking…" : "Log in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
