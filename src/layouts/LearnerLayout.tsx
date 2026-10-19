import {
  BookOpenIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  DocumentChartBarIcon,
  LanguageIcon,
  SpeakerWaveIcon,
  TrophyIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router-dom";
import { profileApi } from "../api/profileApi";
import { subscriptionApi } from "../api/subscriptionApi";
import Spinner from "../components/atoms/Spinner";
import Sidebar, { type NavItemConfig } from "../components/organisms/Sidebar";
import StatsSidebar from "../components/organisms/StatsSidebar";

const NAV_ITEMS: NavItemConfig[] = [
  { to: "/", label: "Chat", icon: ChatBubbleLeftRightIcon },
  { to: "/profile", label: "Profile", icon: UserCircleIcon },
  { to: "/lessons", label: "Lessons", icon: BookOpenIcon },
  { to: "/pronunciation", label: "Pronunciation", icon: SpeakerWaveIcon },
  { to: "/progress", label: "Progress", icon: ChartBarIcon },
  { to: "/vocabulary", label: "Vocabulary", icon: LanguageIcon },
  { to: "/achievements", label: "Achievements", icon: TrophyIcon },
  { to: "/reports", label: "Reports", icon: DocumentChartBarIcon },
  { to: "/billing", label: "Billing", icon: CreditCardIcon },
  { to: "/settings", label: "Settings", icon: Cog6ToothIcon },
];

export default function LearnerLayout() {
  // Every learner route goes through this layout, so this is the one place
  // that needs to check "has this person finished onboarding yet",
  // "have they been through plan selection yet", and (US-02) "have they
  // completed the adaptive assessment yet" - see
  // features/onboarding/OnboardingPage.tsx,
  // features/subscription/ChoosePlanPage.tsx, and
  // features/assessment/AssessmentPage.tsx (sibling top-level routes,
  // not nested here, so none of them re-trigger this same check).
  const { data: profile, isLoading: profileLoading } = useQuery({ queryKey: ["profile"], queryFn: profileApi.get });
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: subscriptionApi.getMine,
    enabled: Boolean(profile?.onboarding_completed),
  });

  if (profileLoading || (profile?.onboarding_completed && subscriptionLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-ink-950">
        <Spinner size={28} />
      </div>
    );
  }

  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  if (subscription && !subscription.plan_selected) {
    return <Navigate to="/choose-plan" replace />;
  }

  if (profile && profile.onboarding_completed && !profile.cefr_level) {
    return <Navigate to="/assessment" replace />;
  }

  return (
    <div className="flex h-screen bg-cream dark:bg-ink-950">
      <Sidebar title="Lumi" items={NAV_ITEMS} tone="brand" />
      <main className="flex-1 overflow-y-auto p-4 pt-20 lg:p-6">
        <Outlet />
      </main>
      <StatsSidebar />
    </div>
  );
}
