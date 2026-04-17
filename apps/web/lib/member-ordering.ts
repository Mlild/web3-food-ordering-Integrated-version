import type { Member, Merchant, Proposal } from "@/lib/api";

import { formatWeiAsTwdEth } from "@/lib/currency";

export type Stage = "create" | "proposal" | "voting" | "ordering" | "submitted";

export type CreateDraft = {
  groupId: string;
  title: string;
  maxOptions: string;
  proposalMinutes: string;
  voteMinutes: string;
  orderMinutes: string;
  merchantIds: string[];
};

export type StageSortKey = "newest" | "oldest" | "title" | "options_desc" | "votes_desc" | "orders_desc" | "deadline_soon";

export type PendingOrderingSync =
  | {
      action: "create_proposal";
      txHash: string;
      payload: {
        title: string;
        description?: string;
        maxOptions: number;
        merchantId?: string;
        merchantIds?: string[];
        useInitialProposalTickets?: boolean[];
        proposalMinutes: number;
        voteMinutes: number;
        orderMinutes: number;
        groupId: number;
        useCreateOrderTicket?: boolean;
      };
    }
  | {
      action: "add_option";
      txHash: string;
      payload: { proposalId: number; merchantId: string; useProposalTicket: boolean; syncStartedAt?: string };
    }
  | {
      action: "vote";
      txHash: string;
      payload: { proposalId: number; optionId: number; voteCount: number; useVoteTicket: boolean; syncStartedAt?: string };
    }
  | {
      action: "pay_order";
      txHash: string;
      payload: {
        proposalId: number;
        items: Record<string, number>;
        signature: {
          amountWei: string;
          expiry: number;
          orderHash: string;
          signature: string;
          digest: string;
          signerAddress: string;
          contractAddress: string;
          tokenAddress: string;
        };
        syncStartedAt?: string;
      };
    };

const ORDERING_SYNC_KEY = "member-ordering-pending-sync";

export const defaultCreateDraft: CreateDraft = {
  groupId: "",
  title: "",
  maxOptions: "5",
  proposalMinutes: "",
  voteMinutes: "",
  orderMinutes: "",
  merchantIds: []
};

export function readPendingOrderingSync(): PendingOrderingSync | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(ORDERING_SYNC_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingOrderingSync;
  } catch {
    window.sessionStorage.removeItem(ORDERING_SYNC_KEY);
    return null;
  }
}

export function writePendingOrderingSync(value: PendingOrderingSync) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ORDERING_SYNC_KEY, JSON.stringify(value));
}

export function clearPendingOrderingSync() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ORDERING_SYNC_KEY);
}

export function detailHref(stage: Stage, proposalId: number) {
  if (stage === "proposal" || stage === "create") return `/member/ordering/proposals/${proposalId}`;
  if (stage === "voting") return `/member/ordering/voting/${proposalId}`;
  if (stage === "ordering") return `/member/ordering/ordering/${proposalId}`;
  return `/member/ordering/submitted/${proposalId}`;
}

export function stageForProposal(proposal: Proposal, now: number): Stage | null {
  const proposalDeadline = new Date(proposal.proposalDeadline).getTime();
  const voteDeadline = new Date(proposal.voteDeadline).getTime();
  const orderDeadline = new Date(proposal.orderDeadline).getTime();
  const hasWinner = proposal.options.some((option) => option.id === proposal.winnerOptionId);
  if (Number.isFinite(proposalDeadline) && now < proposalDeadline) return "proposal";
  if (Number.isFinite(voteDeadline) && now < voteDeadline) return "voting";
  if (hasWinner && Number.isFinite(orderDeadline) && now < orderDeadline) return "ordering";
  if (hasWinner || proposal.orderMemberCount > 0 || safeArray(proposal.orders).length > 0) return "submitted";
  return null;
}

export function listHref(stage: Stage) {
  if (stage === "proposal" || stage === "create") return "/member/ordering/proposals";
  if (stage === "voting") return "/member/ordering/voting";
  if (stage === "ordering") return "/member/ordering/ordering";
  return "/member/ordering/submitted";
}

export function relevantDeadline(proposal: Proposal, stage: Stage) {
  if (stage === "proposal" || stage === "create") return new Date(proposal.proposalDeadline);
  if (stage === "voting") return new Date(proposal.voteDeadline);
  if (stage === "ordering") return new Date(proposal.orderDeadline);
  return new Date(proposal.createdAt);
}

export function canWithdrawProposal(proposal: Proposal, memberId: number) {
  if (!memberId || proposal.createdBy !== memberId) return false;
  if (proposal.status !== "proposing") return false;
  if (safeArray(proposal.votes).length > 0 || safeArray(proposal.orders).length > 0) return false;
  return proposal.options.every((option) => option.proposerMemberId === memberId);
}

export function safeArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : [];
}

export function normalizeProposal(proposal: Proposal): Proposal {
  const votes = safeArray(proposal.votes);
  const createdAt = new Date(proposal.createdAt).getTime();
  let proposalDeadline = new Date(proposal.proposalDeadline).getTime();
  let voteDeadline = new Date(proposal.voteDeadline).getTime();
  let orderDeadline = new Date(proposal.orderDeadline).getTime();
  const proposalMinutes = Math.round((proposalDeadline - createdAt) / 60000);
  if (Number.isFinite(createdAt) && Number.isFinite(proposalDeadline) && proposalMinutes > 90 && proposalMinutes <= 1530) {
    proposalDeadline -= 1440 * 60000;
    voteDeadline -= 1440 * 60000;
    orderDeadline -= 1440 * 60000;
  }
  return {
    ...proposal,
    proposalDeadline: new Date(proposalDeadline).toISOString(),
    voteDeadline: new Date(voteDeadline).toISOString(),
    orderDeadline: new Date(orderDeadline).toISOString(),
    options: safeArray(proposal.options),
    orders: safeArray(proposal.orders),
    votes,
    totalVoteCount: proposal.totalVoteCount ?? votes.reduce((sum, vote) => sum + (vote.voteCount ?? vote.voteWeight ?? 0), 0)
  };
}

export function dedupeProposals(proposals: Proposal[]) {
  const byKey = new Map<string, Proposal>();
  for (const proposal of proposals) {
    const key = `proposal:${proposal.id}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, proposal);
      continue;
    }
    byKey.set(key, scoreProposal(existing) >= scoreProposal(proposal) ? existing : proposal);
  }
  return Array.from(byKey.values());
}

function scoreProposal(proposal: Proposal) {
  let score = 0;
  score += proposal.groupId > 0 ? 1000 : 0;
  score += proposal.options.length * 100;
  score += safeArray(proposal.orders).length * 20;
  score += safeArray(proposal.votes).length * 10;
  score += proposal.title.startsWith("Chain Proposal #") ? 0 : 50;
  return score;
}

export function resolveMerchantId(selectedMerchantId: string, query: string, merchants: Merchant[]) {
  if (selectedMerchantId.trim() && merchants.some((merchant) => merchant.id === selectedMerchantId.trim())) return selectedMerchantId.trim();
  const keyword = query.trim().toLowerCase();
  const exactId = merchants.find((merchant) => merchant.id.toLowerCase() === keyword);
  if (exactId) return exactId.id;
  const exactName = merchants.find((merchant) => merchant.name.trim().toLowerCase() === keyword);
  return exactName?.id || "";
}

export function filterMerchants(merchants: Merchant[], query: string, limit = 6) {
  const keyword = query.trim().toLowerCase();
  return merchants
    .filter((merchant) => !keyword || merchant.id.toLowerCase().includes(keyword) || merchant.name.toLowerCase().includes(keyword))
    .slice(0, limit);
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未設定";
  return date.toLocaleString("zh-TW");
}

export function formatCountdown(value: string, now: number) {
  const target = new Date(value).getTime();
  if (!Number.isFinite(target)) return "未設定";
  const diff = target - now;
  if (diff <= 0) return "已截止";
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) {
    return `${days} 天 ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function getProposalStageMinutes(proposal: Proposal, stage: "proposal" | "vote" | "order") {
  const createdAt = new Date(proposal.createdAt).getTime();
  const proposalAt = new Date(proposal.proposalDeadline).getTime();
  const voteAt = new Date(proposal.voteDeadline).getTime();
  const orderAt = new Date(proposal.orderDeadline).getTime();
  if (!Number.isFinite(createdAt) || !Number.isFinite(proposalAt) || !Number.isFinite(voteAt) || !Number.isFinite(orderAt)) return 0;
  if (stage === "proposal") return normalizeStageMinutes(Math.round((proposalAt - createdAt) / 60000));
  if (stage === "vote") return normalizeStageMinutes(Math.round((voteAt - proposalAt) / 60000));
  return normalizeStageMinutes(Math.round((orderAt - voteAt) / 60000));
}

function normalizeStageMinutes(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  let normalized = minutes;
  while (normalized > 1440) {
    normalized -= 1440;
  }
  if (normalized > 90 && normalized - 1440 <= 90) {
    normalized -= 1440;
  }
  if (normalized > 90 && normalized >= 1440) {
    normalized = normalized % 1440;
  }
  return Math.max(0, normalized);
}

export function formatProposalStatus(status: string) {
  switch (status) {
    case "proposing":
      return "店家提案中";
    case "voting":
      return "投票中";
    case "ordering":
      return "點餐中";
    case "awaiting_settlement":
      return "待結算";
    case "settled":
      return "已完成";
    case "failed":
      return "成立失敗";
    case "cancelled":
      return "已撤回";
    default:
      return status;
  }
}

export function stageDetailHeading(stage: Stage) {
  switch (stage) {
    case "proposal":
      return { kicker: "Proposal stage", title: "店家提案階段" };
    case "voting":
      return { kicker: "Voting stage", title: "投票階段" };
    case "ordering":
      return { kicker: "Ordering stage", title: "點餐階段" };
    case "submitted":
      return { kicker: "Submitted stage", title: "完成送出訂單階段" };
    case "create":
    default:
      return { kicker: "Create stage", title: "建立訂單" };
  }
}

export function formatOrderStatus(status: string) {
  switch (status) {
    case "payment_received":
    case "paid_local":
    case "paid_onchain":
      return "付款完成";
    case "merchant_accepted":
      return "店家已接單";
    case "merchant_completed":
      return "店家已做完";
    case "ready_for_payout":
      return "平台撥款中";
    case "platform_paid":
      return "店家已收款";
    default:
      return status;
  }
}

export function aggregateProposalOrder(proposal: Proposal) {
  const orders = safeArray(proposal.orders);
  const amountWei = orders.reduce((total, order) => total + BigInt(order.amountWei || "0"), 0n);
  const itemCount = orders.reduce((total, order) => total + safeArray(order.items).reduce((sum, item) => sum + item.quantity, 0), 0);
  const createdAt = orders.length ? new Date(Math.min(...orders.map((order) => new Date(order.createdAt).getTime()))).toISOString() : undefined;
  const acceptedAt = latestTimeline(orders.map((order) => order.acceptedAt));
  const completedAt = latestTimeline(orders.map((order) => order.completedAt));
  const confirmedAt = latestTimeline(orders.map((order) => order.confirmedAt));
  const paidOutAt = latestTimeline(orders.map((order) => order.paidOutAt));
  return {
    memberCount: orders.length,
    itemCount,
    amountWei,
    status: aggregateOrderStatus(orders.map((order) => order.status)),
    createdAt,
    acceptedAt,
    completedAt,
    confirmedAt,
    paidOutAt
  };
}

export function confirmableOrderIds(proposal: Proposal) {
  return safeArray(proposal.orders)
    .filter((order) => order.status === "merchant_completed")
    .map((order) => order.id);
}

export function proposalCreatorName(proposal: Proposal) {
  const name = String(proposal.createdByName || proposal.orders[0]?.createdByName || "").trim();
  return name || "未知";
}

export function canCreatorConfirmReceipt(proposal: Proposal, member: Member | null) {
  const proposalCreatorId = Number(proposal.createdBy || proposal.orders[0]?.createdBy || 0);
  const currentMemberId = Number(member?.id || 0);
  const proposalCreatorNameValue = String(proposal.createdByName || proposal.orders[0]?.createdByName || "").trim();
  const currentMemberName = String(member?.displayName || "").trim();
  const isCreator =
    proposalCreatorId > 0 && currentMemberId > 0
      ? proposalCreatorId === currentMemberId
      : proposalCreatorNameValue !== "" && currentMemberName !== "" && proposalCreatorNameValue === currentMemberName;
  if (!isCreator) return false;
  return confirmableOrderIds(proposal).length > 0;
}

function latestTimeline(values: Array<string | undefined>) {
  const filtered = values.filter(Boolean) as string[];
  if (!filtered.length) return undefined;
  return filtered.sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];
}

function aggregateOrderStatus(statuses: string[]) {
  if (!statuses.length) return "payment_received";
  if (statuses.some((status) => status === "payment_received" || status === "paid_local" || status === "paid_onchain")) return "payment_received";
  if (statuses.some((status) => status === "merchant_accepted")) return "merchant_accepted";
  if (statuses.some((status) => status === "merchant_completed")) return "merchant_completed";
  if (statuses.some((status) => status === "ready_for_payout")) return "ready_for_payout";
  if (statuses.every((status) => status === "platform_paid")) return "platform_paid";
  return statuses[0];
}

export function formatAggregateOrderStatus(status: string) {
  switch (status) {
    case "payment_received":
    case "paid_local":
    case "paid_onchain":
      return "點餐階段進行中";
    case "merchant_accepted":
      return "店家已接單";
    case "merchant_completed":
      return "店家已完成製作";
    case "ready_for_payout":
      return "會員已確認，待平台撥款";
    case "platform_paid":
      return "已完成";
    default:
      return formatOrderStatus(status);
  }
}

export function formatWeiFriendly(value: string | number | bigint) {
  return formatWeiAsTwdEth(value);
}

export function durationOptions(options: number[] | undefined, fallback: number) {
  const values = Array.from(new Set([fallback, ...(options || [])].filter((value) => Number.isFinite(value) && value > 0)))
    .map((value) => Math.trunc(value))
    .sort((left, right) => left - right);
  return values.length ? values : [1];
}
