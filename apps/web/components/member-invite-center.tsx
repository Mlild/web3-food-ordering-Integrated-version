"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Sparkles, Ticket, Users } from "lucide-react";

import {
  fetchMe,
  fetchRegistrationInviteUsage,
  type Member,
  type RegistrationInviteUsage
} from "@/lib/api";
import { Button } from "@/components/ui/button";

export function MemberInviteCenter() {
  const [member, setMember] = useState<Member | null>(null);
  const [inviteItems, setInviteItems] = useState<RegistrationInviteUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function refresh() {
    setLoading(true);
    setMessage("");
    try {
      const [me, usage] = await Promise.all([fetchMe(), fetchRegistrationInviteUsage().catch(() => [])]);
      setMember(me);
      setInviteItems(usage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "讀取邀請碼資訊失敗。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const totalInvites = inviteItems.length;
  const latestInviteAt = useMemo(() => inviteItems[0]?.usedAt || "", [inviteItems]);

  async function handleCopyInviteCode() {
    if (!member?.registrationInviteCode) return;
    try {
      await navigator.clipboard.writeText(member.registrationInviteCode);
      setMessage("註冊邀請碼已複製。");
    } catch {
      setMessage("無法自動複製，請手動複製邀請碼。");
    }
  }

  if (loading) {
    return <div className="meal-panel p-8">讀取註冊邀請碼資料中...</div>;
  }

  if (!member) {
    return <div className="meal-panel p-8 text-sm text-[hsl(7_65%_42%)]">{message || "目前沒有可用的會員資料。"}</div>;
  }

  return (
    <section className="meal-panel p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="meal-kicker">Registration invite</p>
          <h1 className="text-3xl font-extrabold">註冊邀請碼中心</h1>
        </div>
        <Button variant="secondary" onClick={refresh} disabled={loading}>
          {loading ? "更新中..." : "重新整理"}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-border bg-background/75 p-6 shadow-[0_18px_40px_rgba(76,49,28,0.08)]">
          <div className="flex items-center gap-2 text-primary">
            <Ticket className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Your invite code</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="rounded-[1.25rem] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(76,49,28,0.08)]">
              <p className="text-2xl font-black tracking-[0.08em] text-foreground">
                {member.registrationInviteCode || "尚未產生"}
              </p>
            </div>
            <Button onClick={handleCopyInviteCode} disabled={!member.registrationInviteCode}>
              <Copy className="h-4 w-4" />
              複製邀請碼
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <InviteStatCard label="成功邀請" value={`${totalInvites} 人`} icon={Users} />
          <InviteStatCard label="最新啟用" value={latestInviteAt ? new Date(latestInviteAt).toLocaleDateString("zh-TW") : "尚無紀錄"} icon={Sparkles} />
          <InviteStatCard label="會員名稱" value={member.displayName} icon={Ticket} />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-foreground">邀請碼使用紀錄</h2>
        <div className="mt-4 space-y-3">
          {inviteItems.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-border bg-background/60 p-5 text-sm text-muted-foreground">
              目前還沒有註冊邀請碼使用紀錄。
            </div>
          ) : (
            inviteItems.map((item) => (
              <article key={item.id} className="rounded-[1.25rem] border border-border bg-background/75 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{item.usedByName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">使用你的邀請碼完成註冊</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">{item.inviteCode}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(item.usedAt).toLocaleString("zh-TW")}</p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {message ? <p className="mt-5 text-sm text-primary">{message}</p> : null}
    </section>
  );
}

function InviteStatCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string;
  icon: typeof Ticket;
}) {
  return (
    <div className="rounded-[1.25rem] border border-border bg-background/70 p-5">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" />
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
