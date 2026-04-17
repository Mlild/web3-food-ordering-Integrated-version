import { AppNav } from "@/components/app-nav";
import { BrandHomeLink } from "@/components/brand-home-link";
import { SessionGate } from "@/components/session-gate";
import { UsageLedger, type LedgerTab } from "@/components/usage-ledger";

export default async function MemberRecordsPage({
  searchParams
}: {
  searchParams?: Promise<{ tab?: LedgerTab }>;
}) {
  const params = (await searchParams) ?? {};

  return (
    <main id="main-content" className="meal-page max-w-7xl">
      <div className="flex items-center justify-between gap-4">
        <BrandHomeLink>MealVote / Usage Ledger</BrandHomeLink>
        <AppNav />
      </div>
      <SessionGate requireSubscription>
        <UsageLedger initialTab={params.tab || "usage"} />
      </SessionGate>
    </main>
  );
}
