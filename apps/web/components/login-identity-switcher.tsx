"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Store,
  Ticket,
  Users,
  Wallet
} from "lucide-react";

import {
  clearStoredToken,
  fetchMe,
  fetchMerchantDashboard,
  getStoredToken,
  passwordLogin,
  setStoredToken
} from "@/lib/api";
import { authenticateWithWallet, clearWalletConnection, getConnectedWalletAddress } from "@/lib/wallet-auth";

type IdentityRole = "member" | "merchant" | "admin";

const roleTabs = [
  { id: "member", label: "使用者 User", icon: Users },
  { id: "merchant", label: "店家 Merchant", icon: Store },
  { id: "admin", label: "平台管理者 Admin", icon: Shield }
] as const satisfies ReadonlyArray<{ id: IdentityRole; label: string; icon: typeof Users }>;

const roleCopy: Record<
  IdentityRole,
  {
    eyebrow: string;
    welcome: string;
    loginBody: string;
    registerTitle: string;
    registerBody: string;
    registerLabel: string;
    hints: string[];
  }
> = {
  member: {
    eyebrow: "Member access",
    welcome: "Welcome Back",
    loginBody: "Access the Kitchen Council via decentralized ID.",
    registerTitle: "New Here?",
    registerBody: "Join the decentralized dining democracy.",
    registerLabel: "Register Identity",
    hints: ["Earn voting tickets and community perks", "Verified merchant ratings and order records"]
  },
  merchant: {
    eyebrow: "Merchant access",
    welcome: "Merchant Sign In",
    loginBody: "Connect the service wallet used to manage your menu and orders.",
    registerTitle: "Open Your Kitchen",
    registerBody: "Register a merchant identity before setting your storefront and menu.",
    registerLabel: "Register Merchant",
    hints: ["Accept orders with the same wallet identity", "Track menu reviews, payouts, and merchant analytics"]
  },
  admin: {
    eyebrow: "Operator access",
    welcome: "Admin Console",
    loginBody: "Use the platform operator account to review menus, payouts, and governance.",
    registerTitle: "Platform Access",
    registerBody: "Operator accounts are managed internally. Use the seeded credentials below for demo access.",
    registerLabel: "Enter Admin Console",
    hints: ["Review menus, merchant delists, and payouts", "Governance settings and metrics stay inside the admin console"]
  }
};

export function LoginIdentitySwitcher() {
  const [role, setRole] = useState<IdentityRole>("member");
  const [walletAddress, setWalletAddress] = useState("");
  const [memberDisplayName, setMemberDisplayName] = useState("");
  const [memberInviteCode, setMemberInviteCode] = useState("");
  const [merchantDisplayName, setMerchantDisplayName] = useState("");
  const [adminForm, setAdminForm] = useState({
    email: "alice@example.com",
    password: "demo1234"
  });
  const [busyAction, setBusyAction] = useState<"" | "member-login" | "member-register" | "merchant-login" | "merchant-register" | "admin-login">("");
  const [loginMessage, setLoginMessage] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        const connected = await getConnectedWalletAddress();
        if (active) {
          setWalletAddress(connected);
        }
      } catch {
        if (active) {
          setWalletAddress("");
        }
      }

      if (!getStoredToken()) {
        if (active) {
          setCheckingSession(false);
        }
        return;
      }

      try {
        const me = await fetchMe();
        if (me.isAdmin) {
          window.location.replace("/admin");
          return;
        }

        try {
          const dashboard = await fetchMerchantDashboard();
          if (dashboard.merchant) {
            window.location.replace("/merchant");
            return;
          }
        } catch {
          // fall through to member routes
        }

        window.location.replace(me.subscriptionActive ? "/member" : "/subscribe");
      } catch {
        clearStoredToken();
        clearWalletConnection();
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setLoginMessage("");
    setRegisterMessage("");
  }, [role]);

  async function handleWalletLogin(targetRole: "member" | "merchant") {
    setBusyAction(targetRole === "member" ? "member-login" : "merchant-login");
    setLoginMessage("");

    try {
      clearStoredToken();
      clearWalletConnection();

      const result = await authenticateWithWallet({});
      setStoredToken(result.token);
      setWalletAddress(result.member.walletAddress || "");

      if (targetRole === "merchant") {
        window.location.replace("/merchant");
        return;
      }

      window.location.replace(result.member.subscriptionActive ? "/member" : "/subscribe");
    } catch (error) {
      if (error instanceof Error && error.message.includes("displayName is required")) {
        setLoginMessage("這個錢包看起來是第一次使用，請改用右側註冊身份。");
      } else {
        setLoginMessage(error instanceof Error ? error.message : "登入失敗");
      }
    } finally {
      setBusyAction("");
    }
  }

  async function handleWalletRegister(targetRole: "member" | "merchant") {
    setBusyAction(targetRole === "member" ? "member-register" : "merchant-register");
    setRegisterMessage("");

    const displayName = targetRole === "member" ? memberDisplayName.trim() : merchantDisplayName.trim();
    const inviteCode = targetRole === "member" ? memberInviteCode.trim() : "";

    if (!displayName) {
      setRegisterMessage(targetRole === "member" ? "請先輸入顯示名稱。" : "請先輸入店家負責人名稱。");
      setBusyAction("");
      return;
    }

    try {
      clearStoredToken();
      clearWalletConnection();

      const result = await authenticateWithWallet({
        displayName,
        inviteCode
      });

      setStoredToken(result.token);
      setWalletAddress(result.member.walletAddress || "");

      if (targetRole === "merchant") {
        window.location.replace("/merchant");
        return;
      }

      window.location.replace(result.member.subscriptionActive ? "/member" : "/subscribe");
    } catch (error) {
      setRegisterMessage(error instanceof Error ? error.message : "註冊失敗");
    } finally {
      setBusyAction("");
    }
  }

  async function handleAdminLogin() {
    setBusyAction("admin-login");
    setLoginMessage("");

    try {
      clearStoredToken();
      const result = await passwordLogin(adminForm.email, adminForm.password);
      setStoredToken(result.token);
      window.location.replace("/admin");
    } catch (error) {
      setLoginMessage(error instanceof Error ? error.message : "登入失敗");
    } finally {
      setBusyAction("");
    }
  }

  const copy = roleCopy[role];
  const walletLoading = busyAction === "member-login" || busyAction === "merchant-login";
  const registerLoading = busyAction === "member-register" || busyAction === "merchant-register";
  const adminLoading = busyAction === "admin-login";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#140f0b_0%,#221710_100%)]">
      <div className="absolute inset-0">
        <img
          alt="Warm restaurant dining room"
          className="h-full w-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVxeaCKrVg0NoPJnl2Mb2qcXIbSBCtfYdNcIkn2gJzC8uTmpw6ItkGfu_ebmmyV2HK34e2EhTrUpe9Thv3NaSMXvRpqQRjpRgZxO6r7EGzAS0iyStI-UgAZUfh2LdtyQP8lDIBKQyh2QcqXrm2JQ_X3Cx-GvUZ4ais_We6oPXV6WrTnN9gdAooja76KgX_-pqdjq71yuTvVIpKAwy_xlO1SpxsujT5JjVqktZguS4wmfQisPUeffI4QpeE1vihYhVY4GTOFSQ3m1SY"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,13,8,0.56),rgba(20,13,8,0.4))]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[90rem] flex-col justify-center gap-6 px-4 py-8 md:px-8">
        <div className="flex justify-center">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-[1.35rem] border border-white/15 bg-[rgba(255,245,238,0.78)] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-md">
            {roleTabs.map((tab) => {
              const Icon = tab.icon;
              const active = role === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRole(tab.id)}
                  className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[1rem] px-4 py-2 text-sm font-bold tracking-tight transition duration-200 md:px-6 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(125,68,29,0.22)]"
                      : "text-foreground-soft hover:bg-white/70 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <section className="grid overflow-hidden rounded-[2.5rem] border border-white/15 bg-[rgba(255,245,238,0.94)] shadow-[0_32px_64px_-12px_rgba(52,45,40,0.4)] backdrop-blur-md md:grid-cols-2">
          <div className="border-b border-[rgba(125,68,29,0.08)] p-8 md:border-b-0 md:border-r md:p-14">
            <div className="mb-10 text-center md:text-left">
              <Link href="/member" className="text-3xl font-black uppercase tracking-tighter text-primary">
                MealVote
              </Link>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-primary/70">{copy.eyebrow}</p>
              <h1 className="mt-3 sketch-display text-4xl font-extrabold tracking-[-0.06em] text-foreground md:text-5xl">
                {copy.welcome}
              </h1>
              <p className="mt-3 max-w-md text-sm leading-7 text-foreground-soft">{copy.loginBody}</p>
              {checkingSession ? (
                <div className="mt-6 rounded-[1.3rem] border border-[rgba(125,68,29,0.08)] bg-white/68 px-4 py-3 text-sm text-foreground-soft">
                  正在確認登入狀態...
                </div>
              ) : null}
            </div>

            {role === "admin" ? (
              <div className="space-y-4">
                <label className="grid gap-2 text-sm">
                  <span className="font-semibold text-foreground">Admin Email</span>
                  <input
                    className="sketch-field"
                    type="email"
                    autoComplete="email"
                    value={adminForm.email}
                    onChange={(event) => setAdminForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="font-semibold text-foreground">Password</span>
                  <input
                    className="sketch-field"
                    type="password"
                    autoComplete="current-password"
                    value={adminForm.password}
                    onChange={(event) => setAdminForm((current) => ({ ...current, password: event.target.value }))}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void handleAdminLogin()}
                  disabled={adminLoading}
                  className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-[1.35rem] bg-primary px-6 py-5 text-lg font-extrabold text-primary-foreground shadow-[0_16px_36px_rgba(125,68,29,0.24)] transition duration-200 hover:brightness-105 disabled:cursor-wait disabled:opacity-60"
                >
                  {adminLoading ? "Signing In..." : "Enter Admin Console"}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <button
                  type="button"
                  onClick={() => void handleWalletLogin(role)}
                  disabled={walletLoading}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-4 rounded-[1.35rem] border border-[rgba(226,118,27,0.18)] bg-white px-8 py-5 text-lg font-extrabold text-foreground shadow-[0_12px_32px_rgba(246,133,27,0.22)] transition duration-200 hover:border-[rgba(226,118,27,0.48)] hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
                >
                  <Wallet className="h-6 w-6 text-[#E2761B]" />
                  {walletLoading ? "Connecting..." : "Connect MetaMask"}
                </button>
                <div className="flex items-center gap-3 text-foreground-soft/70">
                  <Shield className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-[0.22em]">Secure Web3 Auth Only</p>
                </div>
                <div className="rounded-[1.4rem] bg-[rgba(255,248,241,0.72)] p-4">
                  <div className="flex items-center gap-4 text-sm text-foreground-soft">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div>
                      <p>Your votes are secured by the hearth blockchain.</p>
                      <p className="mt-1 text-xs text-foreground-soft/70">
                        {walletAddress ? `Detected wallet: ${shortAddress(walletAddress)}` : "Connect a wallet to continue."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loginMessage ? <p className="mt-5 text-sm font-medium text-destructive">{loginMessage}</p> : null}
          </div>

          <div className="bg-[rgba(251,238,230,0.82)] p-8 md:p-14">
            <div className="mb-10">
              <h2 className="sketch-display text-3xl font-extrabold tracking-[-0.05em] text-foreground md:text-4xl">
                {copy.registerTitle}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-foreground-soft">{copy.registerBody}</p>
            </div>

            {role === "admin" ? (
              <div className="space-y-6">
                <div className="rounded-[1.4rem] bg-white/60 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70">Demo Credentials</p>
                  <div className="mt-4 space-y-2 text-sm text-foreground-soft">
                    <p>
                      <span className="font-semibold text-foreground">Email:</span> alice@example.com
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Password:</span> demo1234
                    </p>
                  </div>
                </div>
                <div className="rounded-[1.4rem] border border-white/30 bg-white/35 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70">Why Join?</p>
                  <ul className="mt-4 space-y-3">
                    {copy.hints.map((hint) => (
                      <li key={hint} className="flex items-center gap-2 text-sm text-foreground-soft">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>{hint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <label className="grid gap-2 text-sm">
                  <span className="font-bold uppercase tracking-[0.16em] text-foreground-soft">
                    {role === "member" ? "Display Name" : "Owner Name"}
                  </span>
                  <input
                    className="sketch-field"
                    value={role === "member" ? memberDisplayName : merchantDisplayName}
                    onChange={(event) =>
                      role === "member" ? setMemberDisplayName(event.target.value) : setMerchantDisplayName(event.target.value)
                    }
                    placeholder={role === "member" ? "ENTER-DISPLAY-NAME" : "ENTER-OWNER-NAME"}
                    autoComplete="name"
                  />
                </label>

                {role === "member" ? (
                  <label className="grid gap-2 text-sm">
                    <span className="font-bold uppercase tracking-[0.16em] text-foreground-soft">Invite Code</span>
                    <input
                      className="sketch-field"
                      value={memberInviteCode}
                      onChange={(event) => setMemberInviteCode(event.target.value)}
                      placeholder="ENTER-HEARTH-CODE"
                    />
                  </label>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleWalletRegister(role)}
                  disabled={registerLoading}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-[1.35rem] bg-[linear-gradient(135deg,hsl(24_66%_34%),hsl(30_80%_52%))] px-6 py-5 text-xl font-extrabold text-primary-foreground shadow-[0_16px_36px_rgba(125,68,29,0.24)] transition duration-200 hover:brightness-105 disabled:cursor-wait disabled:opacity-60"
                >
                  {registerLoading ? "Registering..." : copy.registerLabel}
                  <ArrowRight className="h-5 w-5" />
                </button>

                <div className="rounded-[1.4rem] border border-white/30 bg-white/35 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70">Why Join?</p>
                  <ul className="mt-4 space-y-3">
                    {copy.hints.map((hint) => (
                      <li key={hint} className="flex items-center gap-2 text-sm text-foreground-soft">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>{hint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {registerMessage ? <p className="mt-5 text-sm font-medium text-destructive">{registerMessage}</p> : null}
          </div>
        </section>
      </div>

      <div className="fixed bottom-6 right-4 z-20 md:bottom-8 md:right-8">
        <div className="flex items-center gap-3 rounded-full border border-white/20 bg-[rgba(255,245,238,0.72)] px-4 py-2 shadow-[0_20px_40px_rgba(0,0,0,0.2)] backdrop-blur-md">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground-soft md:text-xs">
            Mainnet Live: 1,402 Active Sessions
          </span>
        </div>
      </div>
    </main>
  );
}

function shortAddress(address: string) {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
