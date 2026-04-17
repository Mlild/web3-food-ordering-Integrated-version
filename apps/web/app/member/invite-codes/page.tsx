import { AppNav } from "@/components/app-nav";
import { BrandHomeLink } from "@/components/brand-home-link";
import { MemberInviteCenter } from "@/components/member-invite-center";
import { SessionGate } from "@/components/session-gate";

export default function MemberInviteCodesPage() {
  return (
    <main id="main-content" className="meal-page max-w-7xl">
      <div className="flex items-center justify-between gap-4">
        <BrandHomeLink>MealVote / Registration Invite</BrandHomeLink>
        <AppNav />
      </div>
      <SessionGate requireSubscription>
        <MemberInviteCenter />
      </SessionGate>
    </main>
  );
}
