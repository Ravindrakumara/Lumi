import { CheckIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { subscriptionApi } from "../../api/subscriptionApi";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import Spinner from "../../components/atoms/Spinner";
import type { Tier } from "../../types";

// Free is genuinely self-service here (it's already the safe default
// tier). Premium is not - tier_id can only ever be changed by an admin
// (see admin_update_subscription in web/subscription_routes.py, gated by
// require_admin). Clicking Premium here just records an upgrade request
// for an admin to action, it never grants premium on its own.
const TIER_PERKS: Record<string, string[]> = {
  free: ["Daily chat practice", "Basic pronunciation feedback", "Core lessons for your level"],
  premium: ["Higher daily chat & voice limits", "Priority pronunciation analysis", "All programs unlocked"],
};

export default function ChoosePlanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pendingTier, setPendingTier] = useState<string | null>(null);

  const { data: tiers, isLoading } = useQuery({
    queryKey: ["subscription", "tiers"],
    queryFn: subscriptionApi.listTiers,
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: subscriptionApi.getMine,
  });

  const selectMutation = useMutation({
    mutationFn: (tierId: string) => subscriptionApi.selectPlan({ tier_id: tierId }),
    onSuccess: (result, tierId) => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      if (tierId === "free") {
        navigate("/", { replace: true });
      }
    },
    onSettled: () => setPendingTier(null),
  });

  function handleChoose(tierId: string) {
    setPendingTier(tierId);
    selectMutation.mutate(tierId);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-ink-950">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-ink-950">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-ink-100">Choose your plan</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">
            You can start free and change later - Premium just needs an admin to switch you over.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {(tiers || []).map((tier) => (
            <PlanCard
              key={tier.id}
              tier={tier}
              requested={subscription?.upgrade_requested && tier.id === "premium"}
              loading={pendingTier === tier.id && selectMutation.isPending}
              onChoose={() => handleChoose(tier.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  tier,
  requested,
  loading,
  onChoose,
}: {
  tier: Tier;
  requested?: boolean;
  loading: boolean;
  onChoose: () => void;
}) {
  const isPremium = tier.id === "premium";
  const perks = TIER_PERKS[tier.id] || [];

  return (
    <Card padding="lg" className={`flex flex-col ${isPremium ? "border-admin-500/40" : ""}`}>
      <p className="text-lg font-bold text-slate-900 dark:text-ink-100">{tier.name}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">
        {tier.chat_messages_per_day} chat messages/day &middot; {tier.voice_minutes_per_day} voice minutes/day
      </p>

      <ul className="mt-4 flex-1 space-y-2">
        {perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-sm text-slate-600 dark:text-ink-100">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-live-500" />
            {perk}
          </li>
        ))}
      </ul>

      <Button
        variant={isPremium ? "admin" : "primary"}
        onClick={onChoose}
        loading={loading}
        disabled={requested}
        className="mt-6 w-full"
      >
        {isPremium ? (requested ? "Upgrade requested" : "Request upgrade") : "Continue with Free"}
      </Button>
      {isPremium ? (
        <p className="mt-2 text-center text-xs text-slate-400 dark:text-ink-400">
          {requested
            ? "An admin needs to approve this before Premium limits apply."
            : "Requires admin approval - you'll start on Free until then."}
        </p>
      ) : null}
    </Card>
  );
}
