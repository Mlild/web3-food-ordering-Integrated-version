import { MemberDashboard } from "@/components/member-dashboard";
import { SessionGate } from "@/components/session-gate";

export default async function MemberPage({
  searchParams
}: {
  searchParams?: Promise<{ subscribe?: string }>;
}) {
  const params = (await searchParams) ?? {};

  return (
    <main id="main-content" className="sketch-shell">
      <div className="relative z-[1] mx-auto max-w-[92rem] px-5 pb-12 pt-5 md:px-8 lg:px-10">
        <SessionGate requireSubscription>
          <MemberDashboard openSubscribe={params.subscribe === "1"} />
        </SessionGate>
      </div>
    </main>
  );
}
