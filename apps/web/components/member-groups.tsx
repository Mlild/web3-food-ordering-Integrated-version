"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Plus, Sparkles, Users, Vote } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createGroup, fetchGroups, fetchMe, joinGroup, type Group, type Member } from "@/lib/api";

export function MemberGroups() {
  const [member, setMember] = useState<Member | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [createName, setCreateName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  async function refresh() {
    const [me, nextGroups] = await Promise.all([fetchMe(), fetchGroups()]);
    setMember(me);
    setGroups(nextGroups);
  }

  useEffect(() => {
    refresh()
      .catch((error) => setMessage(error instanceof Error ? error.message : "讀取群組資料失敗"))
      .finally(() => setLoading(false));
  }, []);

  const ownedGroups = useMemo(
    () => groups.filter((group) => group.ownerMemberId === member?.id),
    [groups, member?.id]
  );
  const joinedGroups = useMemo(
    () => groups.filter((group) => !ownedGroups.some((owned) => owned.id === group.id)),
    [groups, ownedGroups]
  );

  async function handleCreateGroup() {
    if (!createName.trim()) return;
    setPending(true);
    try {
      const group = await createGroup(createName.trim());
      setCreateName("");
      await refresh();
      setMessage(`已建立群組「${group.name}」`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "建立群組失敗");
    } finally {
      setPending(false);
    }
  }

  async function handleJoinGroup() {
    if (!inviteCode.trim()) return;
    setPending(true);
    try {
      const group = await joinGroup(inviteCode.trim());
      setInviteCode("");
      await refresh();
      setMessage(`已加入群組「${group.name}」`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加入群組失敗");
    } finally {
      setPending(false);
    }
  }

  if (loading) return <div className="sketch-card p-8">正在載入群組清單...</div>;

  function sortGroups(items: Group[]) {
    return [...items].sort((left, right) => {
      switch (sortBy) {
        case "oldest":
          return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
        case "name":
          return left.name.localeCompare(right.name, "zh-TW");
        case "members_desc":
          return (right.members?.length || 0) - (left.members?.length || 0);
        case "invite":
          return (left.inviteCode || "").localeCompare(right.inviteCode || "", "zh-TW");
        case "newest":
        default:
          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }
    });
  }

  async function handleCopyInviteCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setMessage(`已複製邀請碼：${code}`);
    } catch {
      setMessage("複製邀請碼失敗");
    }
  }

  const sortedOwned = sortGroups(ownedGroups);
  const sortedJoined = sortGroups(joinedGroups);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="sketch-soft-card overflow-hidden p-8 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Community clusters</p>
              <h1 className="mt-3 sketch-display text-[clamp(2.2rem,4vw,4rem)] font-extrabold tracking-[-0.06em] text-foreground">
                把同事、朋友和固定飯局整理成可投票的群組。
              </h1>
            </div>
            <div className="rounded-[1.8rem] bg-white/78 p-5 shadow-[0_20px_46px_rgba(76,49,28,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Live summary</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <SummaryTile label="我的群組" value={`${ownedGroups.length}`} />
                <SummaryTile label="參與群組" value={`${groups.length}`} />
                <SummaryTile label="可用投票" value={`${member?.voteCouponCount || 0}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          <section className="sketch-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-primary text-primary-foreground">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">建立新群組</p>
              </div>
            </div>
            <label className="mt-5 grid gap-2 text-sm">
              <span className="font-medium text-foreground">群組名稱</span>
              <input
                className="sketch-field"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="例如：信義午餐群"
              />
            </label>
            <Button className="mt-4 w-full" onClick={handleCreateGroup} disabled={pending || !createName.trim()}>
              建立群組
            </Button>
          </section>

          <section className="sketch-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-accent text-accent-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">加入群組</p>
              </div>
            </div>
            <label className="mt-5 grid gap-2 text-sm">
              <span className="font-medium text-foreground">邀請碼</span>
              <input
                className="sketch-field"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="請輸入邀請碼"
              />
            </label>
            <Button className="mt-4 w-full" variant="secondary" onClick={handleJoinGroup} disabled={pending || !inviteCode.trim()}>
              加入群組
            </Button>
          </section>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="sketch-display text-3xl font-extrabold tracking-[-0.05em] text-foreground">Groups</h2>
          <p className="mt-1 text-sm text-foreground-soft">依建立時間、名稱、成員數與邀請碼排序。</p>
        </div>
        <label className="grid gap-2 text-sm min-w-[16rem]">
          <span className="font-medium text-foreground">排序方式</span>
          <select className="sketch-field" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="newest">依建立時間新到舊</option>
            <option value="oldest">依建立時間舊到新</option>
            <option value="name">依群組名稱排序</option>
            <option value="members_desc">依會員數多到少</option>
            <option value="invite">依邀請碼排序</option>
          </select>
        </label>
      </section>

      <section className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-foreground">我建立的群組</h3>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
              {sortedOwned.length} groups
            </span>
          </div>
          {sortedOwned.length === 0 ? <EmptyPanel body="目前沒有自己建立的群組，先建立一個新的飯局小圈吧。" /> : null}
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {sortedOwned.map((group, index) => (
              <GroupCard
                key={group.id}
                group={group}
                tone={index % 3}
                onCopyInviteCode={handleCopyInviteCode}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-foreground">我參與的群組</h3>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
              {sortedJoined.length} groups
            </span>
          </div>
          {sortedJoined.length === 0 ? <EmptyPanel body="目前沒有加入其他人的群組，拿到邀請碼後就能從上方直接加入。" /> : null}
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {sortedJoined.map((group, index) => (
              <GroupCard
                key={group.id}
                group={group}
                tone={(index + 1) % 3}
                onCopyInviteCode={handleCopyInviteCode}
              />
            ))}
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-[1.2rem] border border-[rgba(143,72,22,0.12)] bg-[rgba(255,248,241,0.84)] px-4 py-3 text-sm text-primary">
          {message}
        </div>
      ) : null}
    </div>
  );
}

function GroupCard({
  group,
  tone,
  onCopyInviteCode
}: {
  group: Group;
  tone: number;
  onCopyInviteCode: (code: string) => void;
}) {
  const tones = [
    "bg-[linear-gradient(180deg,rgba(255,251,247,0.98),rgba(244,232,218,0.92))]",
    "bg-[linear-gradient(180deg,rgba(251,238,230,0.98),rgba(255,248,241,0.94))]",
    "bg-[linear-gradient(180deg,rgba(255,222,188,0.95),rgba(252,237,219,0.96))]"
  ] as const;
  const memberCount = group.members?.length || 0;
  const activeCount = Math.min(Math.max(1, Math.ceil(memberCount / 4)), 5);

  return (
    <div className={`group rounded-[2rem] p-6 shadow-[0_24px_54px_rgba(76,49,28,0.1)] transition duration-300 hover:-translate-y-1 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-white/80 text-primary shadow-[0_12px_28px_rgba(76,49,28,0.08)]">
          {tone === 2 ? <Sparkles className="h-6 w-6" /> : tone === 1 ? <Vote className="h-6 w-6" /> : <Users className="h-6 w-6" />}
        </div>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary">
          {group.inviteCode ? "Live Vote" : "Invite Pending"}
        </span>
      </div>

      <div className="mt-6 space-y-3">
        <h4 className="sketch-display text-[1.9rem] font-extrabold tracking-[-0.05em] text-foreground">{group.name}</h4>
        {group.description ? <p className="text-sm leading-7 text-foreground-soft">{group.description}</p> : null}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 rounded-[1.5rem] bg-white/45 p-4">
        <div className="border-r border-white/60 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Active</p>
          <p className="mt-1 text-2xl font-black text-foreground">{String(activeCount).padStart(2, "0")}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Members</p>
          <p className="mt-1 text-2xl font-black text-foreground">{String(memberCount).padStart(2, "0")}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex -space-x-3">
          {Array.from({ length: Math.min(Math.max(memberCount, 1), 3) }).map((_, index) => (
            <div
              key={index}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[rgba(255,255,255,0.88)] text-[10px] font-bold text-primary shadow-sm"
            >
              {index === 0 ? "MV" : index === 1 ? "GD" : memberCount > 3 ? `+${memberCount - 2}` : "OK"}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {group.inviteCode ? (
            <Button size="sm" variant="ghost" onClick={() => onCopyInviteCode(group.inviteCode || "")}>
              複製邀請碼
            </Button>
          ) : null}
          <Button asChild size="icon" variant="secondary" className="h-12 w-12 rounded-[1rem]">
            <Link href={`/member/groups/${group.id}`}>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      <p className="mt-4 text-xs text-foreground-soft">建立時間：{new Date(group.createdAt).toLocaleDateString("zh-TW")}</p>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] bg-white/78 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-black text-foreground">{value}</p>
    </div>
  );
}

function EmptyPanel({ body }: { body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border bg-white/50 px-5 py-6 text-sm leading-7 text-foreground-soft">
      {body}
    </div>
  );
}
