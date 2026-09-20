import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { subscriptionApi } from "../../api/subscriptionApi";
import Button from "../../components/atoms/Button";
import Select from "../../components/atoms/Select";
import Spinner from "../../components/atoms/Spinner";

interface ManageSubscriptionDialogProps {
  userId: string | null;
  userLabel: string;
  onClose: () => void;
}

const TIER_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "premium", label: "Premium" },
];

export default function ManageSubscriptionDialog({ userId, userLabel, onClose }: ManageSubscriptionDialogProps) {
  const queryClient = useQueryClient();
  const [tierId, setTierId] = useState("free");

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["admin", "subscription", userId],
    queryFn: () => subscriptionApi.adminGet(userId!),
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (subscription) setTierId(subscription.tier.id);
  }, [subscription]);

  const updateMutation = useMutation({
    mutationFn: () => subscriptionApi.adminUpdate(userId!, { tier_id: tierId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "subscription", userId] });
      onClose();
    },
  });

  return (
    <Dialog open={userId !== null} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-ink-900">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-ink-100">
            Manage subscription
          </DialogTitle>
          <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">{userLabel}</p>

          {isLoading ? (
            <div className="py-6">
              <Spinner />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <Select label="Tier" value={tierId} onChange={setTierId} options={TIER_OPTIONS} />
              {subscription ? (
                <p className="text-xs text-slate-400 dark:text-ink-400">
                  Today's usage: {subscription.usage_today.chat_messages_used}/
                  {subscription.usage_today.chat_messages_limit} chat,{" "}
                  {subscription.usage_today.voice_minutes_used}/{subscription.usage_today.voice_minutes_limit} min
                  voice
                </p>
              ) : null}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => updateMutation.mutate()} loading={updateMutation.isPending}>
              Save
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
