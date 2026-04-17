"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MessageSquareText, ScrollText, Star, Store, Trophy } from "lucide-react";

import { MerchantBuildingIllustration, merchantBuildingBadgeClass } from "@/components/merchant-building-illustration";
import { Button } from "@/components/ui/button";
import { DEMO_REVIEW_CATEGORIES, addDemoComment, getCurrentMemberTitle } from "@/lib/achievement-demo";
import { createMerchantReview, fetchMe, fetchMerchantDetail, type Member, type MerchantDetail } from "@/lib/api";
import { formatWeiAsTwdEth } from "@/lib/currency";

type MerchantTab = "menu" | "reviews" | "building";

const merchantTabs: Array<{ id: MerchantTab; label: string; icon: typeof ScrollText }> = [
  { id: "menu", label: "菜單", icon: ScrollText },
  { id: "reviews", label: "評論", icon: MessageSquareText },
  { id: "building", label: "建築成長與勳章", icon: Store }
];

export function MerchantDetailView({ merchantId }: { merchantId: string }) {
  const [detail, setDetail] = useState<MerchantDetail | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState("5");
  const [category, setCategory] = useState<(typeof DEMO_REVIEW_CATEGORIES)[number]>("餐點");
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState<MerchantTab>("menu");

  async function refresh() {
    const [merchantDetail, currentMember] = await Promise.all([fetchMerchantDetail(merchantId), fetchMe()]);
    setDetail(merchantDetail);
    setMember(currentMember);
  }

  useEffect(() => {
    refresh()
      .catch((error) => setMessage(error instanceof Error ? error.message : "讀取店家資訊失敗。"))
      .finally(() => setLoading(false));
  }, [merchantId]);

  const building = useMemo(() => detail?.merchant.building || null, [detail]);

  async function handleReviewSubmit() {
    if (!member || !comment.trim()) return;
    setPending(true);
    try {
      await createMerchantReview(merchantId, {
        rating: Number(rating),
        comment: `【${category}】${comment.trim()}`
      });
      addDemoComment({
        merchantId,
        memberId: member.id,
        memberName: member.displayName,
        category,
        rating: Number(rating),
        content: comment.trim()
      });
      await refresh();
      setComment("");
      setMessage("評論已送出，店家星等與留言數已同步更新。");
      setActiveTab("reviews");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "新增評論失敗。");
    } finally {
      setPending(false);
    }
  }

  if (loading) return <div className="sketch-card p-8">讀取店家資訊中...</div>;
  if (!detail || !building) return <div className="sketch-card p-8 text-sm text-[hsl(7_65%_42%)]">{message || "目前找不到這家店的資訊。"}</div>;

  const merchant = detail.merchant;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2.25rem] shadow-[0_32px_80px_rgba(76,49,28,0.18)]">
        <div
          className="relative min-h-[38rem]"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(17,12,8,0.08), rgba(17,12,8,0.72)), url('https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=80')",
            backgroundPosition: "center",
            backgroundSize: "cover"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(255,245,238,0.95)] via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
            <div className="mx-auto flex max-w-[88rem] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,151,52,0.16)] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#FFE2C2] backdrop-blur-md">
                  <Trophy className="h-4 w-4" />
                  Top Rated Merchant
                </span>
                <h1 className="sketch-display text-[clamp(3rem,7vw,6.5rem)] font-extrabold leading-[0.9] tracking-[-0.08em] text-[hsl(24_26%_17%)]">
                  {merchant.name}
                </h1>
                {merchant.description ? <p className="max-w-2xl text-base leading-8 text-foreground-soft">{merchant.description}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/65 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    {merchant.group || "Featured kitchen"}
                  </span>
                  <span className="rounded-full bg-white/65 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    {merchant.address || "Address pending"}
                  </span>
                </div>
              </div>
              <Button size="lg" className="self-start lg:self-auto">
                Join Voting
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="sketch-soft-card p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Merchant profile</p>
            <h2 className="mt-3 sketch-display text-3xl font-extrabold tracking-[-0.05em] text-foreground">{merchant.name}</h2>
          </div>
          <div className="rounded-[1.5rem] bg-white/72 px-5 py-4 shadow-[0_16px_36px_rgba(76,49,28,0.08)]">
            <div className="flex items-center gap-2 text-primary">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-lg font-black">{(merchant.averageRating || 0).toFixed(1)}</span>
            </div>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{detail.reviews.length} reviews</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="地址" value={merchant.address || "尚未填寫"} />
          <Stat label="評論總數" value={`${detail.reviews.length} 則`} />
          <Stat label="菜單項目" value={`${merchant.menu.length} 項`} />
          <Stat label="建築分數" value={`${building.score}`} />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap gap-3">
          {merchantTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex min-h-[46px] items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition duration-200 ${
                  active
                    ? "border-[rgba(186,110,39,0.18)] bg-primary text-primary-foreground shadow-[0_14px_34px_rgba(125,68,29,0.18)]"
                    : "border-border bg-white/76 text-foreground-soft hover:bg-white hover:text-primary"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "menu" ? (
          <section className="sketch-soft-card p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Seasonal curation</p>
                <h2 className="mt-3 sketch-display text-3xl font-extrabold tracking-[-0.05em] text-foreground">菜單</h2>
              </div>
              <span className="text-sm font-semibold text-primary">Current Menu</span>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {merchant.menu.map((item, index) => (
                <div
                  key={item.id}
                  className={`${index === 0 ? "md:col-span-2" : ""} overflow-hidden rounded-[1.75rem] bg-white/76 shadow-[0_16px_40px_rgba(76,49,28,0.08)]`}
                >
                  <div
                    className={`${index === 0 ? "h-64" : "h-48"} bg-cover bg-center`}
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(24,16,12,0.04), rgba(24,16,12,0.4)), url('${menuImage(index)}')`
                    }}
                  />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="max-w-2xl">
                        <h3 className={`${index === 0 ? "text-2xl" : "text-xl"} font-bold text-foreground`}>{item.name}</h3>
                        <p className="mt-2 text-sm leading-7 text-foreground-soft">{item.description || "這個品項目前尚未填寫額外說明。"}</p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                        {formatWeiAsTwdEth(item.priceWei)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {merchant.menu.length === 0 ? (
                <div className="md:col-span-2 rounded-[1.5rem] border border-dashed border-border bg-white/55 p-6 text-sm leading-7 text-foreground-soft">
                  目前還沒有上架菜單。
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {activeTab === "reviews" ? (
          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="sketch-soft-card p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Community reviews</p>
                  <h2 className="mt-3 sketch-display text-3xl font-extrabold tracking-[-0.05em] text-foreground">會員評論</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-soft">
                    這裡集中顯示會員的餐點、環境、服務與價格回饋，閱讀區刻意拉大，讓評論不用再擠在旁邊的小欄位。
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-white/74 px-5 py-4 text-right shadow-[0_16px_36px_rgba(76,49,28,0.08)]">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Average rating</p>
                  <p className="mt-2 text-3xl font-black text-foreground">{(merchant.averageRating || 0).toFixed(1)}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {detail.reviews.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-border bg-white/60 p-6 text-sm leading-7 text-foreground-soft">
                    目前還沒有任何評論。
                  </div>
                ) : null}
                {detail.reviews.map((review) => {
                  const title = review.memberId ? getCurrentMemberTitle(review.memberId) : "";
                  const categoryLabel = review.comment.match(/^【([^】]+)】/)?.[1] || "綜合";
                  return (
                    <article key={`${review.id}-${review.createdAt}`} className="rounded-[1.5rem] bg-white/74 p-5 shadow-[0_14px_30px_rgba(76,49,28,0.06)]">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-bold text-foreground">{review.memberName}</p>
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                              {categoryLabel}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-primary">{title || "尚未裝備稱號"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{renderStars(review.rating)} ({review.rating}/5)</p>
                          <p className="mt-1 text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleString("zh-TW")}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-8 text-foreground-soft">{review.comment.replace(/^【[^】]+】/, "")}</p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="sketch-card p-6 md:p-8 xl:sticky xl:top-28 xl:h-fit">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Personal review</p>
              <h2 className="mt-3 sketch-display text-2xl font-extrabold tracking-[-0.05em] text-foreground">新增評論</h2>
              <p className="mt-3 text-sm leading-7 text-foreground-soft">
                寫評論也獨立拿到比較大的輸入空間，不會再和菜單卡片或建築資訊互相擠壓。
              </p>

              <div className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-foreground">評論分類</span>
                  <select className="sketch-field" value={category} onChange={(event) => setCategory(event.target.value as (typeof DEMO_REVIEW_CATEGORIES)[number])}>
                    {DEMO_REVIEW_CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-foreground">星等</span>
                  <select className="sketch-field" value={rating} onChange={(event) => setRating(event.target.value)}>
                    <option value="5">5 星</option>
                    <option value="4">4 星</option>
                    <option value="3">3 星</option>
                    <option value="2">2 星</option>
                    <option value="1">1 星</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-foreground">會員稱號</span>
                  <input className="sketch-field" value={member ? getCurrentMemberTitle(member.id) || "尚未裝備稱號" : "尚未登入"} readOnly />
                </label>
              </div>

              <label className="mt-4 grid gap-2 text-sm">
                <span className="font-medium text-foreground">評論內容</span>
                <textarea
                  className="sketch-field min-h-52"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="輸入你對這家店的餐點、環境、服務或價格評價。"
                />
              </label>
              <Button className="mt-5 w-full" onClick={handleReviewSubmit} disabled={pending || !comment.trim()}>
                送出評論
              </Button>
            </div>
          </section>
        ) : null}

        {activeTab === "building" ? (
          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="sketch-card flex items-end gap-5 rounded-[1.9rem] p-6 md:p-8">
              <MerchantBuildingIllustration building={building} className="h-56 w-40 shrink-0" />
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Store building</p>
                <h2 className="sketch-display text-3xl font-extrabold tracking-[-0.05em] text-foreground">{building.title}</h2>
                <p className="text-sm leading-7 text-foreground-soft">
                  店家會依據目前評分、評論與完成訂單數逐步成長，這一頁專門保留給收藏感與展示感更強的內容。
                </p>
                <div className="flex flex-wrap gap-2">
                  {building.badges.map((badge) => (
                    <span
                      key={badge.label}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${merchantBuildingBadgeClass(badge.tone)}`}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="sketch-soft-card p-6 md:p-8">
              <h3 className="sketch-display text-2xl font-extrabold tracking-[-0.05em] text-foreground">建築成長與勳章</h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Stat label="目前階段" value={building.stage} />
                <Stat label="樓層" value={`${building.floors} 層`} />
                <Stat label="建築分數" value={`${building.score}`} />
                <Stat label="下一階門檻" value={`${building.nextScore}`} />
                <Stat label="完成訂單" value={`${building.completedOrderCount} 筆`} />
                <Stat label="菜單數量" value={`${building.menuItemCount} 項`} />
              </div>
              <div className="mt-6 rounded-[1.5rem] bg-white/74 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Badge shelf</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {building.badges.map((badge) => (
                    <div
                      key={badge.label}
                      className={`rounded-[1.1rem] border px-4 py-3 text-sm font-semibold ${merchantBuildingBadgeClass(badge.tone)}`}
                    >
                      {badge.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </section>

      {message ? (
        <div className="rounded-[1.2rem] border border-[rgba(143,72,22,0.12)] bg-[rgba(255,248,241,0.84)] px-4 py-3 text-sm text-primary">
          {message}
        </div>
      ) : null}
    </div>
  );
}

function renderStars(rating: number) {
  const rounded = Math.round(rating);
  return `${"★".repeat(rounded)}${"☆".repeat(Math.max(0, 5 - rounded))}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] bg-white/75 px-4 py-4 shadow-[0_12px_28px_rgba(76,49,28,0.06)]">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function menuImage(index: number) {
  const images = [
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80"
  ] as const;

  return images[index % images.length];
}
