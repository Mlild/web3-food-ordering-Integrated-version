"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { clearStoredToken, fetchMe, fetchMerchantDashboard, getStoredToken, type Member } from "@/lib/api";
import { clearWalletConnection, getConnectedWalletAddress } from "@/lib/wallet-auth";

const memberLinks = [
  { href: "/member", label: "會員資訊" },
  { href: "/member/groups", label: "群組" },
  { href: "/member/ordering", label: "建立訂單" },
  { href: "/member/ongoing-orders", label: "成立中訂單" },
  { href: "/member/ordering/submitted", label: "完成送出訂單" },
  { href: "/member/orders", label: "歷史訂單" },
  { href: "/member/merchants", label: "店家清單" },
  { href: "/member/badges", label: "勳章兌換" },
  { href: "/member/invite-codes", label: "註冊邀請碼" },
  { href: "/member/records", label: "使用紀錄" }
] as const;

const adminLinks = [
  { href: "/admin", label: "後台總覽" },
  { href: "/admin/metrics", label: "數據總覽" },
  { href: "/admin/settings", label: "治理參數" },
  { href: "/admin/payouts", label: "平台撥款" },
  { href: "/admin/menu-reviews", label: "菜單審核" },
  { href: "/admin/merchant-delists", label: "下架審核" }
] as const;
const merchantLinks = [
  { href: "/merchant", label: "店家資訊" },
  { href: "/merchant/orders", label: "訂單工作台" },
  { href: "/merchant/analytics", label: "營運分析" },
  { href: "/merchant/menu", label: "菜單管理" },
  { href: "/merchant/reviews", label: "評分留言" }
] as const;

export function AppNav() {
  return <AppNavInner showLinks interactiveWalletStatus />;
}

export function AppNavCompact() {
  return <AppNavInner showLinks={false} interactiveWalletStatus={false} />;
}

const chipClass =
  "inline-flex min-h-[38px] items-center gap-2 rounded-full border border-border bg-white/82 px-4 py-2 text-[13px] font-medium text-foreground-soft shadow-[0_10px_24px_rgba(76,49,28,0.08)] backdrop-blur-md transition duration-200";
const navLinkBase =
  "inline-flex min-h-[40px] items-center rounded-full border px-4 py-2 text-[14px] font-medium transition duration-200";
const navLinkActive = "border-[rgba(186,110,39,0.2)] bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(125,68,29,0.16)]";
const navLinkIdle = "border-border bg-white/78 text-foreground-soft hover:-translate-y-0.5 hover:bg-white hover:text-primary";
const panelClass =
  "border border-border bg-[rgba(255,251,247,0.96)] p-3 shadow-[0_24px_54px_rgba(76,49,28,0.16)] backdrop-blur-md";
const buttonClass =
  "inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-white/82 px-4 py-2 text-[14px] font-medium text-foreground-soft shadow-[0_10px_24px_rgba(76,49,28,0.08)] transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-primary disabled:cursor-wait";

function AppNavInner({
  showLinks,
  interactiveWalletStatus
}: {
  showLinks: boolean;
  interactiveWalletStatus: boolean;
}) {
  const pathname = usePathname();
  const [member, setMember] = useState<Member | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [walletActionPending, setWalletActionPending] = useState(false);
  const [walletMessage, setWalletMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [merchantBound, setMerchantBound] = useState(false);
  const [merchantDisplayName, setMerchantDisplayName] = useState("");
  const [roleMenuPosition, setRoleMenuPosition] = useState({ top: 0, right: 0 });
  const roleSwitcherRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const address = await getConnectedWalletAddress();
        if (active) {
          setWalletAddress(address);
        }
      } catch {
        if (active) {
          setWalletAddress("");
        }
      }

      if (!getStoredToken()) {
        if (active) {
          setMember(null);
        }
        return;
      }

      try {
        const me = await fetchMe();
        if (active) {
          setMember(me);
        }
        if (!me.isAdmin) {
          try {
            const dashboard = await fetchMerchantDashboard();
            if (active) {
              setMerchantBound(Boolean(dashboard.merchant));
              setMerchantDisplayName(dashboard.merchant?.name || "");
            }
          } catch {
            if (active) {
              setMerchantBound(false);
              setMerchantDisplayName("");
            }
          }
        } else if (active) {
          setMerchantBound(false);
          setMerchantDisplayName("");
        }
      } catch {
        clearStoredToken();
        clearWalletConnection();
        if (active) {
          setMember(null);
          setWalletAddress("");
          setMerchantBound(false);
          setMerchantDisplayName("");
        }
      }
    }

    loadStatus();
    return () => {
      active = false;
    };
  }, [pathname]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setWalletMenuOpen(false);
    setRoleMenuOpen(false);
    setWalletMessage("");
  }, [pathname]);

  useEffect(() => {
    if (!roleMenuOpen || !roleSwitcherRef.current) return;
    const rect = roleSwitcherRef.current.getBoundingClientRect();
    setRoleMenuPosition({
      top: rect.bottom + 12,
      right: Math.max(window.innerWidth - rect.right, 16)
    });
  }, [roleMenuOpen]);

  const handleLogout = useCallback(() => {
    clearStoredToken();
    clearWalletConnection();
    setMember(null);
    setWalletAddress("");
    window.location.replace("/login");
  }, []);

  const handleLoginRoute = useCallback(() => {
    setWalletMessage("");
    window.location.replace("/login");
  }, []);

  const handleWalletStatusClick = useCallback(() => {
    if (member) {
      setWalletMenuOpen((prev) => !prev);
      return;
    }
    handleLoginRoute();
  }, [handleLoginRoute, member]);

  const connectedAddress = member?.walletAddress || walletAddress || "";
  const isAdmin = Boolean(member?.isAdmin);
  const adminContext = isAdmin || pathname === "/admin";
  const merchantContext = pathname.startsWith("/merchant");
  const currentIdentity = member?.isAdmin
    ? "平台管理者"
    : merchantContext
      ? merchantDisplayName || "店家中心"
      : member?.displayName || "會員";
  const statusLabel = member ? currentIdentity : connectedAddress ? `已連接 ${shortAddress(connectedAddress)}` : "未連接";
  const currentPathLabel = describePath(pathname).join(" / ");
  const visibleLinks = adminContext ? adminLinks : merchantContext ? merchantLinks : memberLinks;
  const canSwitchRoles = Boolean(member) && !adminContext;
  const roleOptions = [
    { href: "/member", label: "會員中心", status: member ? "已綁定" : "未綁定" },
    { href: "/merchant", label: "店家中心", status: merchantBound ? "已綁定" : "未綁定" }
  ] as const;
  const currentRoleOption = merchantContext ? roleOptions[1] : roleOptions[0];

  return (
    <div className="relative z-[80] flex items-center justify-end gap-3">
      <div className="hidden items-center gap-2 md:flex">
        <span className={`${chipClass} sketch-mono text-primary`}>
          {currentPathLabel}
        </span>
      </div>
      {showLinks ? (
        <div className="hidden items-center gap-3 md:flex">
          <nav className="flex flex-wrap items-center gap-2">
            {visibleLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${navLinkBase} ${active ? navLinkActive : navLinkIdle}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          {canSwitchRoles ? (
            <div className="relative">
              <button
                ref={roleSwitcherRef}
                type="button"
                onClick={() => setRoleMenuOpen((prev) => !prev)}
                className={buttonClass}
              >
                <span>{currentRoleOption.label}</span>
                <ChevronDown className={`h-4 w-4 transition ${roleMenuOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
          ) : null}
          {member ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={interactiveWalletStatus ? handleWalletStatusClick : undefined}
                className={buttonClass}
                aria-label="查看帳號與錢包狀態"
                disabled={walletActionPending || !interactiveWalletStatus}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${connectedAddress ? "bg-[#2E8B57]" : "bg-muted-foreground/50"}`} />
                <span>{walletActionPending ? "授權中..." : currentIdentity}</span>
              </button>
            </div>
          ) : null}
          {member ? (
            <button
              type="button"
              onClick={handleLogout}
              className={buttonClass}
            >
              登出
            </button>
          ) : null}
        </div>
      ) : null}

      {!member || !showLinks ? (
        <div className="relative hidden md:block">
          <button
            type="button"
            onClick={interactiveWalletStatus ? handleWalletStatusClick : undefined}
            className={buttonClass}
            aria-label={member ? "查看錢包連結狀態" : "連接錢包並登入"}
            disabled={walletActionPending || !interactiveWalletStatus}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${connectedAddress ? "bg-[#2E8B57]" : "bg-muted-foreground/50"}`} />
            <span>{walletActionPending ? "授權中..." : statusLabel}</span>
          </button>
        </div>
      ) : null}
      {walletMessage ? <p className="hidden text-[13px] text-[#D42B2B] font-bold md:block">{walletMessage}</p> : null}

      {/* Mobile hamburger */}
      {showLinks ? (
        <div className="flex items-center gap-2 md:hidden">
          <span
            className={`${chipClass} max-w-[9rem] truncate text-primary`}
          >
            {currentPathLabel}
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex cursor-pointer items-center justify-center rounded-full border border-border bg-white/82 p-2.5 text-foreground shadow-[0_10px_24px_rgba(76,49,28,0.08)] transition duration-200 hover:-translate-y-0.5 hover:bg-white"
            aria-label={menuOpen ? "關閉選單" : "開啟選單"}
            aria-expanded={menuOpen}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      ) : (
        <div className="md:hidden">
          {member ? (
            <button
              type="button"
              onClick={handleLogout}
              className={buttonClass}
            >
              登出
            </button>
          ) : (
            <button
              type="button"
              onClick={interactiveWalletStatus ? handleWalletStatusClick : undefined}
              className={buttonClass}
              aria-label={member ? "查看錢包連結狀態" : "連接錢包並登入"}
              disabled={walletActionPending || !interactiveWalletStatus}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${connectedAddress ? "bg-[#2E8B57]" : "bg-muted-foreground/50"}`} />
              <span>{walletActionPending ? "授權中..." : statusLabel}</span>
            </button>
          )}
        </div>
      )}

      {menuOpen ? (
        <div
          className={`absolute right-4 top-full z-50 mt-3 w-56 rounded-[1.5rem] md:hidden ${panelClass}`}
        >
          {canSwitchRoles ? (
            <div
              className="mb-3 rounded-[1.2rem] border border-[rgba(125,68,29,0.08)] bg-secondary/70 p-2"
            >
              <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">角色切換</p>
              <nav className="grid gap-1">
                {roleOptions.map((link) => {
                  const active = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-3 text-center text-[14px] font-bold transition ${
                        active ? "rounded-[1rem] bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(125,68,29,0.14)]" : "rounded-[1rem] text-foreground hover:bg-white/70"
                      }`}
                    >
                      <span>{link.label}</span>{" "}
                      <span className={`text-[12px] ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>({link.status})</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ) : null}
          <nav className="flex flex-col gap-1">
            {visibleLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 text-[14px] font-bold transition ${
                    active ? "rounded-[1rem] bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(125,68,29,0.14)]" : "rounded-[1rem] text-foreground hover:bg-white/70"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-2 border-t border-border/60 pt-2">
            <button
              type="button"
              onClick={member ? handleLogout : handleLoginRoute}
              className="w-full cursor-pointer px-4 py-3 text-left text-[14px] font-bold text-foreground transition hover:bg-secondary disabled:cursor-wait"
              style={{ borderRadius: "1rem" }}
              disabled={walletActionPending}
            >
              {walletActionPending ? "授權中..." : member ? "登出" : statusLabel}
            </button>
            <div className="px-4 pb-2">
              <p className="text-[13px] font-bold text-foreground">{currentIdentity}</p>
              <p className="break-all text-[12px] text-muted-foreground sketch-mono">{connectedAddress || "尚未連接錢包"}</p>
              <p className="mt-2 text-[12px] text-muted-foreground italic">{member ? "已連接後可從這裡登出" : "點擊上方可重新連接並登入"}</p>
            </div>
            {walletMessage ? <p className="px-4 pb-2 text-[12px] text-[#D42B2B] font-bold">{walletMessage}</p> : null}
          </div>
        </div>
      ) : null}

      {mounted && interactiveWalletStatus && walletMenuOpen && member
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="關閉錢包選單"
                className="fixed inset-0 z-[150] cursor-default bg-transparent"
                onClick={() => setWalletMenuOpen(false)}
              />
              <div
                className={`fixed right-4 top-20 z-[160] min-w-56 rounded-[1.5rem] p-3 md:right-6 ${panelClass}`}
              >
                <p className="px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">目前帳號</p>
                <p className="mt-1 px-3 text-[14px] font-bold text-foreground">{currentIdentity}</p>
                <p className="mt-3 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">錢包地址</p>
                <p className="mt-1 break-all px-3 text-[14px] font-bold text-foreground sketch-mono">{member.walletAddress || connectedAddress}</p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-3 w-full rounded-[1rem] border border-border bg-secondary px-4 py-3 text-left text-[14px] font-bold text-foreground shadow-[0_10px_24px_rgba(76,49,28,0.08)] transition duration-200 hover:bg-white"
                >
                  登出
                </button>
              </div>
            </>,
            document.body
          )
        : null}
      {mounted && roleMenuOpen && canSwitchRoles
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="關閉角色切換選單"
                className="fixed inset-0 z-[170] cursor-default bg-transparent"
                onClick={() => setRoleMenuOpen(false)}
              />
              <div
                className={`fixed z-[180] min-w-56 rounded-[1.5rem] p-2 ${panelClass}`}
                style={{
                  top: `${roleMenuPosition.top}px`,
                  right: `${roleMenuPosition.right}px`
                }}
              >
                {roleOptions.map((option) => {
                  const active = pathname.startsWith(option.href);
                  return (
                    <Link
                      key={option.href}
                      href={option.href}
                      className={`flex items-center justify-between gap-4 px-4 py-3 text-[14px] font-bold transition ${
                        active ? "rounded-[1rem] bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(125,68,29,0.14)]" : "rounded-[1rem] text-foreground hover:bg-white/70"
                      }`}
                    >
                      <span>{option.label}</span>
                      <span className={`text-[12px] ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>({option.status})</span>
                    </Link>
                  );
                })}
              </div>
            </>,
            document.body
          )
        : null}
    </div>
  );
}

function describePath(pathname: string) {
  const entries: Array<[RegExp, string[]]> = [
    [/^\/$/, ["首頁"]],
    [/^\/member$/, ["會員中心"]],
    [/^\/member\/account$/, ["會員中心", "會員設定"]],
    [/^\/member\/subscription$/, ["會員中心", "訂閱管理"]],
    [/^\/member\/groups$/, ["會員中心", "群組清單"]],
    [/^\/member\/groups\/\d+$/, ["會員中心", "群組清單", "群組詳細資料"]],
    [/^\/member\/groups\/\d+\/members$/, ["會員中心", "群組清單", "群組會員清單"]],
    [/^\/member\/groups\/\d+\/orders$/, ["會員中心", "群組清單", "群組歷史訂單"]],
    [/^\/member\/groups\/\d+\/invite-usage$/, ["會員中心", "群組清單", "群組邀請碼紀錄"]],
    [/^\/member\/merchants$/, ["會員中心", "店家清單"]],
    [/^\/member\/merchants\/[^/]+$/, ["會員中心", "店家清單", "店家詳細資料"]],
    [/^\/member\/orders$/, ["會員中心", "訂單紀錄"]],
    [/^\/member\/orders\/\d+$/, ["會員中心", "訂單紀錄", "訂單詳細資料"]],
    [/^\/member\/badges$/, ["會員中心", "勳章兌換"]],
    [/^\/member\/invite-codes$/, ["會員中心", "註冊邀請碼"]],
    [/^\/member\/records$/, ["會員中心", "使用紀錄"]],
    [/^\/member\/ordering(\/create)?$/, ["會員中心", "建立訂單"]],
    [/^\/member\/ordering\/proposals/, ["會員中心", "成立中訂單", "店家提案階段"]],
    [/^\/member\/ordering\/voting/, ["會員中心", "成立中訂單", "投票階段"]],
    [/^\/member\/ordering\/ordering/, ["會員中心", "成立中訂單", "點餐階段"]],
    [/^\/member\/ordering\/submitted/, ["會員中心", "完成送出訂單"]],
    [/^\/member\/ongoing-orders$/, ["會員中心", "成立中訂單"]],
    [/^\/records$/, ["會員中心", "使用紀錄"]],
    [/^\/merchant$/, ["店家中心", "店家資訊"]],
    [/^\/merchant\/profile$/, ["店家中心", "店家資訊"]],
    [/^\/merchant\/orders$/, ["店家中心", "訂單工作台"]],
    [/^\/merchant\/menu$/, ["店家中心", "菜單管理"]],
    [/^\/merchant\/menu\/edit$/, ["店家中心", "菜單管理", "編輯菜單"]],
    [/^\/merchant\/menu\/new$/, ["店家中心", "菜單管理", "新增品項"]],
    [/^\/merchant\/reviews$/, ["店家中心", "評分留言"]],
    [/^\/merchant\/orders\/\d+$/, ["店家中心", "訂單工作台", "訂單詳細資料"]],
    [/^\/admin$/, ["平台管理", "後台總覽"]],
    [/^\/admin\/metrics$/, ["平台管理", "數據總覽"]],
    [/^\/admin\/payouts$/, ["平台管理", "平台撥款"]],
    [/^\/admin\/menu-reviews$/, ["平台管理", "菜單審核"]],
    [/^\/admin\/merchant-delists$/, ["平台管理", "下架審核"]],
    [/^\/admin\/groups\/\d+$/, ["平台管理", "群組清單", "群組詳細資料"]],
    [/^\/subscribe$/, ["首頁", "訂閱頁面"]]
  ];
  const matched = entries.find(([pattern]) => pattern.test(pathname));
  return matched?.[1] || pathname.split("/").filter(Boolean);
}

function shortAddress(address: string) {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
