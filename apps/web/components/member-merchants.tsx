"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Flame, Star, TrendingUp } from "lucide-react";

import { MerchantBuildingIllustration, merchantBuildingBadgeClass } from "@/components/merchant-building-illustration";
import { Button } from "@/components/ui/button";
import { fetchMerchants, type Merchant } from "@/lib/api";

export function MemberMerchants() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchMerchants()
      .then(setMerchants)
      .catch((error) => setMessage(error instanceof Error ? error.message : "讀取店家列表失敗。"))
      .finally(() => setLoading(false));
  }, []);

  const featuredMerchant = useMemo(
    () => [...merchants].sort((left, right) => (right.averageRating || 0) - (left.averageRating || 0))[0] || null,
    [merchants]
  );

  if (loading) return <div className="sketch-card p-8">讀取店家列表中...</div>;

  return (
    <div className="space-y-8">
      {featuredMerchant ? (
        <section className="overflow-hidden rounded-[2.25rem] border border-white/15 shadow-[0_32px_80px_rgba(76,49,28,0.18)]">
          <div
            className="relative overflow-hidden"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(29,18,12,0.74) 0%, rgba(29,18,12,0.52) 42%, rgba(255,248,241,0.92) 42%, rgba(255,248,241,0.97) 100%), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80')",
              backgroundPosition: "center",
              backgroundSize: "cover"
            }}
          >
            <div className="grid min-h-[30rem] gap-6 p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-12">
              <div className="flex flex-col justify-end text-white">
                <div className="space-y-4">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[rgba(255,166,92,0.18)] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#FFD2A8]">
                    <Flame className="h-4 w-4" />
                    Top rated merchant
                  </span>
                  <h1 className="sketch-display text-[clamp(3rem,6vw,5.75rem)] font-extrabold leading-[0.9] tracking-[-0.07em]">
                    {featuredMerchant.name}
                  </h1>
                  <p className="max-w-xl text-base leading-8 text-white/76">
                    {featuredMerchant.description || "這家店目前在社群投票和評分中都非常活躍，適合當作今天的熱門候選。"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/16 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                      {featuredMerchant.group || "Featured kitchen"}
                    </span>
                    <span className="rounded-full bg-white/16 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                      {(featuredMerchant.averageRating || 0).toFixed(1)} rating
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-6">
                <div className="rounded-[1.9rem] bg-[rgba(255,248,241,0.88)] p-6 shadow-[0_24px_60px_rgba(76,49,28,0.14)] backdrop-blur-md">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-lg">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Merchant pulse</p>
                      <p className="mt-3 sketch-display text-3xl font-extrabold tracking-[-0.05em] text-foreground">
                        社群票選正在把店家頁變得像一份精選餐單。
                      </p>
                    </div>
                    <Button asChild>
                      <Link href={`/member/merchants/${featuredMerchant.id}`}>Open detail</Link>
                    </Button>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-[rgba(255,255,255,0.64)] p-5 rounded-[1.5rem]">
                    <div className="flex -space-x-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[rgba(255,248,241,0.95)] bg-[#F6E1CF] text-xs font-bold text-primary">MV</div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[rgba(255,248,241,0.95)] bg-[#EBC8AF] text-xs font-bold text-primary">GD</div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[rgba(255,248,241,0.95)] bg-[#E0B992] text-xs font-bold text-primary">+84</div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Active group vote</p>
                      <p className="mt-1 text-2xl font-black text-foreground">342 Votes cast today</p>
                    </div>
                  </div>
                </div>

                <Button asChild size="lg" className="self-start">
                  <Link href={`/member/merchants/${featuredMerchant.id}`}>Join voting</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {merchants.map((merchant, index) => {
          const building = merchant.building;
          const isFeatured = index === 0;

          return (
            <Link
              key={merchant.id}
              href={`/member/merchants/${merchant.id}`}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-[2rem] bg-[rgba(255,251,247,0.96)] shadow-[0_22px_50px_rgba(76,49,28,0.1)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_62px_rgba(76,49,28,0.14)]"
            >
              <div
                className="relative h-72 overflow-hidden"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(27,18,12,0.04), rgba(27,18,12,0.52)), url('${merchantHero(index)}')`,
                  backgroundPosition: "center",
                  backgroundSize: "cover"
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_30%)]" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                  <span className="rounded-[1rem] bg-[rgba(255,248,241,0.88)] px-4 py-2 text-sm font-bold text-foreground shadow-lg">
                    {merchant.name}
                  </span>
                  {isFeatured ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,248,241,0.8)] px-3 py-1 text-xs font-bold text-primary">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Trending
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{merchant.group || "Featured kitchen"}</p>
                      <p className="mt-2 text-sm leading-7 text-foreground-soft">
                        {merchant.description || "店家介紹整理中，詳細資訊可進入頁面查看菜單與評論。"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-bold">{(merchant.averageRating || 0).toFixed(1)}</span>
                    </div>
                  </div>

                  {building ? (
                    <div className="rounded-[1.4rem] bg-[rgba(247,239,231,0.8)] p-4">
                      <div className="flex items-end gap-4">
                        <MerchantBuildingIllustration building={building} compact className="h-28 w-24 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-foreground">{building.title}</p>
                          <p className="mt-1 text-sm text-foreground-soft">
                            {building.stage} · {building.floors} 層
                          </p>
                          <p className="mt-1 text-sm font-semibold text-primary">建築分數 {building.score}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {building.badges.slice(0, 3).map((badge) => (
                          <span
                            key={badge.label}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${merchantBuildingBadgeClass(badge.tone)}`}
                          >
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="rounded-full bg-[rgba(255,151,52,0.12)] px-3 py-1 text-xs font-bold text-[hsl(30_80%_40%)]">
                    {merchant.reviewCount || 0} reviews
                  </span>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      {message ? (
        <div className="rounded-[1.2rem] border border-[rgba(143,72,22,0.12)] bg-[rgba(255,248,241,0.84)] px-4 py-3 text-sm text-primary">
          {message}
        </div>
      ) : null}
    </div>
  );
}

function merchantHero(index: number) {
  const images = [
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=1200&q=80"
  ] as const;

  return images[index % images.length];
}
