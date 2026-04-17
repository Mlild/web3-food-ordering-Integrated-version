"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Gift,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Settings,
  ShoppingBag,
  ShieldCheck,
  Ticket,
  Users,
  Vote,
  Wallet
} from "lucide-react";

import {
  clearStoredToken,
  claimTickets,
  fetchGroups,
  fetchMe,
  fetchMyOrderHistory,
  fetchProposals,
  type Group,
  type Member,
  type MemberOrderHistory,
  type Proposal
} from "@/lib/api";
import { getAvailableMemberPoints, getCurrentMemberTitle } from "@/lib/achievement-demo";
import { Button } from "@/components/ui/button";
import { clearWalletConnection } from "@/lib/wallet-auth";

type DashboardState = {
  member: Member | null;
  groups: Group[];
  orderHistory: MemberOrderHistory | null;
  proposals: Proposal[];
};

type VotingCard = {
  id: number;
  title: string;
  description: string;
  href: string;
  deadline: string;
  statusLabel: string;
  merchantNames: string[];
  votes: number;
  palette: string;
};

const sidebarLinks = [
  { href: "/member", label: "Dashboard", icon: LayoutDashboard },
  { href: "/member/ongoing-orders", label: "Active Votes", icon: Vote },
  { href: "/member/orders", label: "Order History", icon: History },
  { href: "/member/merchants", label: "Chef Portal", icon: ShoppingBag },
  { href: "/member/badges", label: "Badge Rewards", icon: BadgeCheck },
  { href: "/member/invite-codes", label: "Invite Codes", icon: KeyRound },
  { href: "/member/records", label: "Usage Ledger", icon: ReceiptText },
  { href: "/member/account", label: "Settings", icon: Settings }
] as const;

const topLinks = [
  { href: "/member/merchants", label: "Marketplace" },
  { href: "/member/ordering/voting", label: "Live Polls" },
  { href: "/member/groups", label: "Community" }
] as const;

const votingPalettes = [
  "from-[#f0d5b7] via-[#fff8f2] to-[#ecd1c3]",
  "from-[#f5d2d8] via-[#fff7f7] to-[#f0e0cf]",
  "from-[#e8d8c8] via-[#fff8f1] to-[#f5dfbe]"
] as const;

export function MemberDashboard({ openSubscribe = false }: { openSubscribe?: boolean }) {
  const pathname = usePathname();
  const [state, setState] = useState<DashboardState>({ member: null, groups: [], orderHistory: null, proposals: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(openSubscribe ? "可從這裡查看目前會員狀態。" : "");
  const [pending, setPending] = useState(false);
  const [demoTitle, setDemoTitle] = useState("");
  const [demoPoints, setDemoPoints] = useState(0);

  async function refresh() {
    const [memberResult, groupsResult, orderHistoryResult, proposalsResult] = await Promise.allSettled([
      fetchMe(),
      fetchGroups(),
      fetchMyOrderHistory(),
      fetchProposals()
    ]);

    if (memberResult.status !== "fulfilled") {
      throw memberResult.reason;
    }

    const groups = groupsResult.status === "fulfilled" ? groupsResult.value : [];
    const orderHistory = orderHistoryResult.status === "fulfilled" ? orderHistoryResult.value : { orders: [] };
    const proposals = proposalsResult.status === "fulfilled" ? proposalsResult.value : [];

    setState({
      member: memberResult.value,
      groups,
      orderHistory,
      proposals
    });
    setDemoTitle(getCurrentMemberTitle(memberResult.value.id));
    setDemoPoints(getAvailableMemberPoints(memberResult.value.id));

    const messages: string[] = [];
    if (groupsResult.status !== "fulfilled") messages.push("群組資料目前暫時無法更新。");
    if (orderHistoryResult.status !== "fulfilled") messages.push("訂單紀錄目前暫時無法更新。");
    if (proposalsResult.status !== "fulfilled") messages.push("提案資料目前暫時無法更新。");
    if (messages.length > 0) setMessage(messages.join(" "));
  }

  useEffect(() => {
    refresh()
      .catch((error) => setMessage(error instanceof Error ? error.message : "讀取會員首頁資料失敗。"))
      .finally(() => setLoading(false));
  }, [openSubscribe, pathname]);

  async function handleClaimTickets() {
    setPending(true);
    try {
      const result = await claimTickets();
      setState((current) => ({
        ...current,
        member: result.member
      }));
      await refresh();
      setMessage(
        `已領取提案券 ${result.claimedProposalTickets} 張、投票券 ${result.claimedVoteTickets} 張、建立訂單券 ${result.claimedCreateOrderTickets} 張。`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "領取票券失敗。");
    } finally {
      setPending(false);
    }
  }

  function handleLogout() {
    clearStoredToken();
    clearWalletConnection();
    window.location.replace("/login");
  }

  if (loading) {
    return <div className="sketch-card p-8">讀取會員首頁資料中...</div>;
  }

  if (!state.member) {
    return <div className="sketch-card p-8">目前沒有可用的會員資料。</div>;
  }

  const now = Date.now();
  const activeProposals = state.proposals
    .filter((proposal) => {
      if (proposal.status === "proposing" || proposal.status === "voting") return true;
      const deadline = new Date(proposal.orderDeadline).getTime();
      return proposal.orders.length > 0 && Number.isFinite(deadline) && deadline > now;
    })
    .sort((a, b) => new Date(a.orderDeadline).getTime() - new Date(b.orderDeadline).getTime());

  const votingCards: VotingCard[] = activeProposals.slice(0, 2).map((proposal, index) => ({
    id: proposal.id,
    title: proposal.title,
    description: proposal.description || `${proposal.mealPeriod} 的社群投票正在進行中。`,
    href:
      proposal.status === "proposing"
        ? `/member/ordering/proposals/${proposal.id}`
        : proposal.status === "voting"
          ? `/member/ordering/voting/${proposal.id}`
          : `/member/ordering/ordering/${proposal.id}`,
    deadline: proposal.status === "proposing" ? proposal.proposalDeadline : proposal.status === "voting" ? proposal.voteDeadline : proposal.orderDeadline,
    statusLabel: proposal.status === "proposing" ? "提案中" : proposal.status === "voting" ? "投票中" : "點餐中",
    merchantNames: proposal.options.map((option) => option.merchantName).filter(Boolean).slice(0, 3),
    votes: proposal.totalVoteCount ?? proposal.options.reduce((sum, option) => sum + option.weightedVotes, 0),
    palette: votingPalettes[index % votingPalettes.length]
  }));

  const submittedProposalCount = Array.from(
    new Set(
      state.proposals
        .filter((proposal) => {
          const hasWinner = proposal.options.some((option) => option.id === proposal.winnerOptionId);
          const deadlinePassed = new Date(proposal.orderDeadline).getTime() <= now;
          return hasWinner && deadlinePassed && proposal.orders.length > 0 && proposal.orders.some((order) => order.status !== "platform_paid");
        })
        .map((proposal) => proposal.id)
    )
  ).length;

  const historyProposalCount = Array.from(
    new Set((state.orderHistory?.orders || []).filter((order) => order.status === "platform_paid").map((order) => order.proposalId))
  ).length;

  const claimableCount =
    state.member.claimableProposalCoupons +
    state.member.claimableVoteCoupons +
    state.member.claimableCreateOrderCoupons;

  return (
    <div className="space-y-6">
      <header className="sketch-header sticky top-4 z-20 rounded-[1.75rem] px-4 py-3 shadow-[0_16px_40px_rgba(76,49,28,0.1)] md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/member" className="inline-flex items-center gap-3 text-foreground">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(125,68,29,0.2)]">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="sketch-display text-xl font-extrabold tracking-[-0.04em]">MEALVOTE</p>
                <p className="text-xs text-muted-foreground">Member portal</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-6 lg:flex">
              {topLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="cursor-pointer text-sm font-medium text-muted-foreground transition duration-200 hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <span className="sketch-block-ticker hidden md:inline-flex">
              <span className="dot" />
              {state.member.subscriptionActive ? "Membership active" : "Subscription needed"}
            </span>
            <button
              type="button"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card/80 text-primary transition duration-200 hover:bg-card"
              aria-label="通知"
            >
              <Bell className="h-4 w-4" />
            </button>
            <Button type="button" size="sm" variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              登出
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/member/account">會員設定</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="sketch-soft-card hidden p-5 lg:block lg:sticky lg:top-28 lg:h-fit">
          <div className="space-y-1">
            <p className="text-lg font-bold text-foreground">Member Portal</p>
            <p className="text-sm text-muted-foreground">{demoTitle || "The Kitchen Cabinet"}</p>
          </div>

          <nav className="mt-6 grid gap-2">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex cursor-pointer items-center gap-3 rounded-[1.1rem] px-4 py-3 text-sm font-medium transition duration-200 ${
                    active
                      ? "bg-card text-primary shadow-[0_12px_28px_rgba(76,49,28,0.08)]"
                      : "text-foreground-soft hover:bg-white/70 hover:text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <Button asChild className="mt-8 w-full">
            <Link href="/member/ordering/create">Start New Poll</Link>
          </Button>
        </aside>

        <div className="space-y-8">
          <div className="flex gap-3 overflow-x-auto pb-1 lg:hidden">
            {sidebarLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition duration-200 ${
                    active ? "bg-primary text-primary-foreground" : "bg-white/70 text-foreground-soft"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <section className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <p className="sketch-kicker">Member dashboard</p>
              <div>
                <h1 className="sketch-display text-[clamp(2.7rem,5vw,4.25rem)] font-extrabold tracking-[-0.06em] text-foreground">
                  Welcome back, {state.member.displayName}.
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-soft">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5">
                  <Wallet className="h-4 w-4 text-primary" />
                  {shortAddress(state.member.walletAddress || "") || "尚未綁定錢包"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5">
                  <Ticket className="h-4 w-4 text-accent" />
                  勳章積分 {demoPoints} pts
                </span>
              </div>
            </div>

            <div className="sketch-soft-card w-full max-w-sm p-6">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  {state.member.subscriptionActive ? "Epicurean tier" : "Membership status"}
                </p>
              </div>
              <div className="mt-4 space-y-1">
                <p className="sketch-display text-3xl font-extrabold tracking-[-0.05em] text-foreground">
                  {state.member.subscriptionActive ? "Active Member" : "Subscription Required"}
                </p>
                <p className="text-sm text-foreground-soft">
                  {state.member.subscriptionExpiresAt
                    ? `Renewal in ${formatDaysUntil(state.member.subscriptionExpiresAt)}`
                    : "開通後即可進入完整點餐流程"}
                </p>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/80">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${state.member.subscriptionActive ? 72 : 22}%` }}
                />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild variant="secondary" size="sm">
                  <Link href="/member/subscription">查看訂閱</Link>
                </Button>
                <Button size="sm" variant="chain" onClick={handleClaimTickets} disabled={pending || claimableCount <= 0}>
                  <Gift className="h-4 w-4" />
                  {pending ? "領取中..." : `領取票券 ${claimableCount > 0 ? `(${claimableCount})` : ""}`}
                </Button>
              </div>
            </div>
          </section>

          <div className="space-y-8">
            <section className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="sketch-display text-3xl font-extrabold tracking-[-0.05em] text-foreground">Active Voting Arena</h2>
                <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(245,134,0,0.12)] px-4 py-1.5 text-sm font-semibold text-[hsl(30_80%_40%)]">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  Live now
                </span>
              </div>

              {votingCards.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {votingCards.map((card) => (
                    <Link
                      key={card.id}
                      href={card.href}
                      className="group cursor-pointer overflow-hidden rounded-[2rem] bg-[rgba(255,251,247,0.94)] shadow-[0_24px_50px_rgba(76,49,28,0.1)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(76,49,28,0.14)]"
                    >
                      <div className={`relative h-52 overflow-hidden bg-gradient-to-br ${card.palette}`}>
                        <div className="absolute right-[-2rem] top-[-1.5rem] h-36 w-36 rounded-full bg-white/30 blur-2xl" />
                        <div className="absolute bottom-[-2rem] left-[-1rem] h-28 w-28 rounded-full bg-primary/15 blur-2xl" />
                        <div className="relative flex h-full flex-col justify-between p-6">
                          <span className="inline-flex w-fit rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary shadow-[0_10px_24px_rgba(76,49,28,0.08)]">
                            {card.statusLabel}
                          </span>
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-soft">
                              Ends in {formatTimeRemaining(card.deadline)}
                            </p>
                            <div className="text-4xl font-black tracking-[-0.05em] text-foreground">{card.votes}</div>
                            <p className="text-sm text-foreground-soft">Weighted votes recorded</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4 p-6">
                        <div>
                          <h3 className="sketch-display text-[1.75rem] font-extrabold tracking-[-0.05em] text-foreground">
                            {card.title}
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-foreground-soft">{card.description}</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <div className="flex flex-wrap gap-2">
                            {card.merchantNames.length > 0 ? (
                              card.merchantNames.map((merchant) => (
                                <span
                                  key={merchant}
                                  className="rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-medium text-foreground-soft"
                                >
                                  {merchant}
                                </span>
                              ))
                            ) : (
                              <span className="rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-medium text-foreground-soft">
                                Waiting for options
                              </span>
                            )}
                          </div>
                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                            Cast vote
                            <ArrowRight className="h-4 w-4 transition duration-200 group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="sketch-card p-8">
                  <h3 className="sketch-display text-2xl font-extrabold tracking-[-0.04em] text-foreground">還沒有進行中的提案</h3>
                  <p className="mt-2 text-sm leading-7 text-foreground-soft">
                    目前沒有可投票的餐廳提案，可以直接建立新訂單，或先到群組裡邀請成員加入。
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button asChild>
                      <Link href="/member/ordering/create">開始建立提案</Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <Link href="/member/groups">查看群組</Link>
                    </Button>
                  </div>
                </div>
              )}

              <div className="sketch-soft-card flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-2 text-sm text-foreground-soft">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Live tally: {activeProposals.reduce((sum, proposal) => sum + (proposal.totalVoteCount ?? 0), 0)} votes cast today
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <span>Groups {state.groups.length}</span>
                  <span>History {historyProposalCount}</span>
                </div>
              </div>
            </section>
          </div>

          <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="sketch-soft-card p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">The leaderboard</p>
              <h2 className="mt-3 sketch-display text-4xl font-extrabold tracking-[-0.05em] text-foreground">
                {demoTitle || "Community Member"}
              </h2>
              <div className="mt-6 flex flex-wrap gap-3">
                <StatPill label="Rank" value={demoTitle ? "Active" : "New"} />
                <StatPill label="Influence" value={`${demoPoints} pts`} />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/member/badges">兌換勳章</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/member/invite-codes">註冊邀請碼</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
              <QuickStatCard label="群組數量" value={`${state.groups.length}`} href="/member/groups" />
              <QuickStatCard label="進行中提案" value={`${activeProposals.length}`} href="/member/ongoing-orders" />
              <QuickStatCard label="待結算訂單" value={`${submittedProposalCount}`} href="/member/ordering/submitted" />
              <QuickStatCard label="歷史訂單" value={`${historyProposalCount}`} href="/member/orders" />
              <QuickStatCard label="提案券" value={`${state.member.proposalCouponCount} 張`} href="/member/records?tab=proposal-coupon" />
              <QuickStatCard label="投票券" value={`${state.member.voteCouponCount} 張`} href="/member/records?tab=vote-coupon" />
            </div>
          </section>

          {message ? (
            <div className="rounded-[1.2rem] border border-[rgba(143,72,22,0.12)] bg-[rgba(255,248,241,0.84)] px-4 py-3 text-sm text-primary">
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function QuickStatCard({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="sketch-card sketch-lift cursor-pointer p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 sketch-display text-[1.9rem] font-extrabold tracking-[-0.05em] text-foreground">{value}</p>
    </Link>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] bg-white/80 px-4 py-3 shadow-[0_12px_24px_rgba(76,49,28,0.08)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function formatTimeRemaining(dateString: string) {
  const diff = new Date(dateString).getTime() - Date.now();
  if (!Number.isFinite(diff)) return "soon";
  if (diff <= 0) return "closed";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days >= 1) return `${days}d`;
  if (hours >= 1) return `${hours}h`;

  const minutes = Math.max(1, Math.floor(diff / (1000 * 60)));
  return `${minutes}m`;
}

function formatDaysUntil(dateString: string) {
  const diff = new Date(dateString).getTime() - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) return "today";
  const days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  return `${days} days`;
}

function shortAddress(address: string) {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
