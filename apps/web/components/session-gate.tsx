"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clearStoredToken, fetchMe, getStoredToken } from "@/lib/api";
import { clearWalletConnection } from "@/lib/wallet-auth";

export function SessionGate({
  children,
  requireSubscription = false,
  allowedRole = "member"
}: {
  children: React.ReactNode;
  requireSubscription?: boolean;
  allowedRole?: "member" | "admin";
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyAccess() {
      if (!getStoredToken()) {
        router.replace("/login");
        return;
      }
      try {
        const member = await fetchMe();
        if (allowedRole === "admin") {
          if (!member.isAdmin) {
            router.replace("/member");
            return;
          }
          if (active) setReady(true);
          return;
        }
        if (member.isAdmin) {
          router.replace("/admin");
          return;
        }
        if (!requireSubscription) {
          if (active) setReady(true);
          return;
        }
        if (!member.subscriptionActive) {
          router.replace("/subscribe");
          return;
        }
        if (active) setReady(true);
      } catch {
        clearStoredToken();
        clearWalletConnection();
        router.replace("/login");
      }
    }

    void verifyAccess();
    return () => {
      active = false;
    };
  }, [allowedRole, requireSubscription, router]);

  if (!ready) {
    return <div className="rounded-[1.5rem] border border-border bg-card p-8 text-sm text-muted-foreground">正在驗證登入狀態...</div>;
  }

  return <>{children}</>;
}
