import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useState } from "react";
import { adminAccountsApi } from "../../api/adminAccountsApi";
import Button from "../../components/atoms/Button";
import FormField from "../../components/molecules/FormField";
import Select from "../../components/atoms/Select";
import { ADMIN_ROLE_OPTIONS } from "../../constants/adminRoles";
import type { AdminRole } from "../../types";

interface CreateAdminAccountDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateAdminAccountDialog({ open, onClose }: CreateAdminAccountDialogProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [adminRole, setAdminRole] = useState<AdminRole>("receptionist");

  const createMutation = useMutation<unknown, AxiosError<{ detail: string }>, void>({
    mutationFn: () => adminAccountsApi.create({ email, name, password, admin_role: adminRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "accounts"] });
      setEmail("");
      setName("");
      setPassword("");
      setAdminRole("receptionist");
      onClose();
    },
  });

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-ink-900">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-ink-100">
            Create admin account
          </DialogTitle>

          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <FormField label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FormField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <Select
              label="Role"
              value={adminRole}
              onChange={(value) => setAdminRole(value as AdminRole)}
              options={ADMIN_ROLE_OPTIONS}
            />

            {createMutation.error ? (
              <p className="text-sm text-red-600">{createMutation.error.response?.data?.detail}</p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Create
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
