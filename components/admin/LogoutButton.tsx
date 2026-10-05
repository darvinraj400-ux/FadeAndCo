"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (!res.ok) {
        toast.error("Logout failed. Try again.");
        return;
      }
    } catch {
      toast.error("Logout failed. Try again.");
      return;
    } finally {
      setBusy(false);
    }
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={logout}
      disabled={busy}
      className="border-cream/15 bg-transparent text-cream/70 hover:bg-cream/10 hover:text-cream"
    >
      Logout
    </Button>
  );
}
