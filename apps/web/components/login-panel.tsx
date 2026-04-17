"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Store, Users, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { clearStoredToken, passwordLogin, setStoredToken } from "@/lib/api";
import { authenticateWithWallet, clearWalletConnection, getConnectedWalletAddress } from "@/lib/wallet-auth";

type WalletRoleMode = "login" | "register";

export function LoginPanel() {
  const [memberDisplayName, setMemberDisplayName] = useState("");
  const [memberInviteCode, setMemberInviteCode] = useState("");
  const [merchantDisplayName, setMerchantDisplayName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [memberMode, setMemberMode] = useState<WalletRoleMode>("login");
  const [merchantMode, setMerchantMode] = useState<WalletRoleMode>("login");
  const [memberLoading, setMemberLoading] = useState(false);
  const [merchantLoading, setMerchantLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [memberMessage, setMemberMessage] = useState("");
  const [merchantMessage, setMerchantMessage] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminForm, setAdminForm] = useState({
    email: "alice@example.com",
    password: "demo1234"
  });

  useEffect(() => {
    let active = true;

    async function loadWalletStatus() {
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
    }

    void loadWalletStatus();

    return () => {
      active = false;
    };
  }, []);

  async function handleWalletLogin(target: "member" | "merchant", mode: WalletRoleMode) {
    const setLoading = target === "member" ? setMemberLoading : setMerchantLoading;
    const setMessage = target === "member" ? setMemberMessage : setMerchantMessage;
    const displayName = target === "member" ? memberDisplayName : merchantDisplayName;
    const inviteCode = target === "member" ? memberInviteCode : "";

    setLoading(true);
    setMessage("");

    try {
      clearStoredToken();
      clearWalletConnection();

      const result = await authenticateWithWallet({
        displayName: mode === "register" ? displayName : "",
        inviteCode: mode === "register" ? inviteCode : ""
      });

      setStoredToken(result.token);
      setWalletAddress(result.member.walletAddress || "");

      if (target === "member") {
        window.location.replace(result.member.subscriptionActive ? "/member" : "/subscribe");
        return;
      }

      window.location.replace("/merchant");
    } catch (error) {
      if (error instanceof Error && error.message.includes("displayName is required")) {
        setMessage("這個錢包看起來是第一次使用，請切到「首次註冊」後填入名稱。");
      } else {
        setMessage(error instanceof Error ? error.message : "登入失敗");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminLogin() {
    setAdminLoading(true);
    setAdminMessage("");

    try {
      clearStoredToken();
      const result = await passwordLogin(adminForm.email, adminForm.password);
      setStoredToken(result.token);
      window.location.replace("/admin");
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "登入失敗");
    } finally {
      setAdminLoading(false);
    }
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-[1.5rem] border border-white/55 bg-white/72 px-5 py-4 shadow-[0_16px_36px_rgba(76,49,28,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Welcome back</p>
            <h2 className="mt-2 sketch-display text-[2.1rem] font-extrabold tracking-[-0.05em] text-foreground">
              用同一個入口切換會員、店家與管理者。
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-foreground-soft">
              保留你現有的登入邏輯，但把入口視覺整理成更像餐飲產品首頁的操作台。
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(125,68,29,0.12)] bg-[rgba(255,248,241,0.92)] px-3 py-1.5 text-xs font-medium text-foreground-soft">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            {walletAddress ? shortAddress(walletAddress) : "Wallet not connected"}
          </div>
        </div>
      </div>

      <WalletRoleCard
        icon={Users}
        title="一般會員"
        description="適合建立訂單、參與投票、查看歷史紀錄與會員任務。"
        mode={memberMode}
        displayName={memberDisplayName}
        inviteCode={memberInviteCode}
        walletAddress={walletAddress}
        loading={memberLoading}
        message={memberMessage}
        onModeChange={setMemberMode}
        loginLabel="會員登入"
        registerLabel="會員註冊"
        registerDescription="第一次使用請輸入顯示名稱，邀請碼可選填。"
        showInviteCode
        onDisplayNameChange={setMemberDisplayName}
        onInviteCodeChange={setMemberInviteCode}
        onSubmit={() => void handleWalletLogin("member", memberMode)}
      />

      <WalletRoleCard
        icon={Store}
        title="店家入口"
        description="適合接單、管理菜單與追蹤店家營運。"
        mode={merchantMode}
        displayName={merchantDisplayName}
        inviteCode=""
        walletAddress={walletAddress}
        loading={merchantLoading}
        message={merchantMessage}
        onModeChange={setMerchantMode}
        loginLabel="店家登入"
        registerLabel="店家註冊"
        registerDescription="第一次使用店家錢包時，先建立負責人名稱。"
        showInviteCode={false}
        onDisplayNameChange={setMerchantDisplayName}
        onInviteCodeChange={() => undefined}
        onSubmit={() => void handleWalletLogin("merchant", merchantMode)}
      />

      <AdminRoleCard
        email={adminForm.email}
        password={adminForm.password}
        loading={adminLoading}
        message={adminMessage}
        onEmailChange={(email) => setAdminForm((prev) => ({ ...prev, email }))}
        onPasswordChange={(password) => setAdminForm((prev) => ({ ...prev, password }))}
        onSubmit={() => void handleAdminLogin()}
      />
    </section>
  );
}

function WalletRoleCard({
  icon: Icon,
  title,
  description,
  mode,
  displayName,
  inviteCode,
  walletAddress,
  loading,
  message,
  onModeChange,
  loginLabel,
  registerLabel,
  registerDescription,
  showInviteCode = true,
  onDisplayNameChange,
  onInviteCodeChange,
  onSubmit
}: {
  icon: typeof Users;
  title: string;
  description: string;
  mode: WalletRoleMode;
  displayName: string;
  inviteCode: string;
  walletAddress: string;
  loading: boolean;
  message: string;
  onModeChange: (mode: WalletRoleMode) => void;
  loginLabel: string;
  registerLabel: string;
  registerDescription: string;
  showInviteCode?: boolean;
  onDisplayNameChange: (value: string) => void;
  onInviteCodeChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const canSubmit = mode === "login" || Boolean(displayName.trim());

  return (
    <section className="sketch-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(125,68,29,0.18)]">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-sm leading-7 text-foreground-soft">{description}</p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label={`${title} 登入模式`}
          className="inline-flex rounded-full bg-secondary p-1"
        >
          <button
            role="tab"
            aria-selected={mode === "login"}
            type="button"
            className={`min-h-[36px] cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition duration-200 ${
              mode === "login" ? "bg-card text-foreground shadow-[0_8px_18px_rgba(76,49,28,0.08)]" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onModeChange("login")}
          >
            登入
          </button>
          <button
            role="tab"
            aria-selected={mode === "register"}
            type="button"
            className={`min-h-[36px] cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition duration-200 ${
              mode === "register" ? "bg-card text-foreground shadow-[0_8px_18px_rgba(76,49,28,0.08)]" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onModeChange("register")}
          >
            首次註冊
          </button>
        </div>
      </div>

      {mode === "register" ? (
        <div className="mt-5 grid gap-3">
          <p className="text-sm leading-7 text-foreground-soft">{registerDescription}</p>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-foreground">名稱</span>
            <input
              className="sketch-field"
              value={displayName}
              onChange={(event) => onDisplayNameChange(event.target.value)}
              placeholder="請輸入名稱"
              autoComplete="name"
            />
          </label>
          {showInviteCode ? (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-foreground">邀請碼</span>
              <input
                className="sketch-field sketch-mono"
                value={inviteCode}
                onChange={(event) => onInviteCodeChange(event.target.value)}
                placeholder="例如 member-12"
              />
            </label>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 rounded-[1.2rem] border border-[rgba(125,68,29,0.08)] bg-[rgba(255,251,247,0.88)] px-4 py-3 text-sm leading-7 text-foreground-soft">
          使用已註冊的錢包直接簽名登入；第一次使用請切換到「首次註冊」。
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={onSubmit} disabled={loading || !canSubmit}>
          {loading ? "處理中..." : mode === "login" ? loginLabel : registerLabel}
        </Button>
        <span className="inline-flex min-h-[38px] items-center rounded-full border border-border bg-white/84 px-3 py-1 text-xs text-foreground-soft shadow-[0_8px_18px_rgba(76,49,28,0.06)]">
          <span
            className={`mr-2 h-2 w-2 rounded-full ${walletAddress ? "bg-[hsl(142_38%_36%)]" : "bg-muted-foreground/40"}`}
            aria-hidden="true"
          />
          {walletAddress ? shortAddress(walletAddress) : "尚未連接錢包"}
        </span>
      </div>

      {message ? (
        <p className="mt-4 text-sm font-medium text-destructive" role="alert" aria-live="polite">
          {message}
        </p>
      ) : null}
    </section>
  );
}

function AdminRoleCard({
  email,
  password,
  loading,
  message,
  onEmailChange,
  onPasswordChange,
  onSubmit
}: {
  email: string;
  password: string;
  loading: boolean;
  message: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="rounded-[1.6rem] border border-[rgba(125,68,29,0.12)] bg-[linear-gradient(180deg,rgba(255,247,238,0.98),rgba(244,232,218,0.96))] p-5 shadow-[0_18px_42px_rgba(76,49,28,0.1)] md:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-accent text-accent-foreground shadow-[0_14px_30px_rgba(186,110,39,0.18)]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">平台管理者登入</p>
          <p className="mt-1 text-sm leading-7 text-foreground-soft">
            預設帳密已帶入，可直接進後台查看統計、治理與審核流程。
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-foreground">Email</span>
          <input
            className="sketch-field"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="請輸入 Email"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-foreground">Password</span>
          <input
            className="sketch-field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="請輸入 Password"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button variant="chain" onClick={onSubmit} disabled={loading}>
          {loading ? "登入中..." : "管理者登入"}
        </Button>
        <span className="inline-flex min-h-[38px] items-center rounded-full border border-white/55 bg-white/82 px-3 py-1 text-xs text-foreground-soft shadow-[0_8px_18px_rgba(76,49,28,0.06)]">
          alice@example.com / demo1234
        </span>
      </div>

      {message ? (
        <p className="mt-4 text-sm font-medium text-destructive" role="alert" aria-live="polite">
          {message}
        </p>
      ) : null}
    </section>
  );
}

function shortAddress(address: string) {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
