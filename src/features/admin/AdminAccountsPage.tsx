import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminAccountsApi } from "../../api/adminAccountsApi";
import Button from "../../components/atoms/Button";
import Select from "../../components/atoms/Select";
import Spinner from "../../components/atoms/Spinner";
import AdminDataTable, { type Column } from "../../components/organisms/AdminDataTable";
import { ADMIN_ROLE_OPTIONS } from "../../constants/adminRoles";
import { useAuthStore } from "../../store/authStore";
import type { AdminRole, User } from "../../types";
import CreateAdminAccountDialog from "./CreateAdminAccountDialog";

export default function AdminAccountsPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["admin", "accounts"],
    queryFn: adminAccountsApi.list,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AdminRole | null }) =>
      adminAccountsApi.updateRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "accounts"] }),
  });

  const columns: Column<User>[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "admin_role",
      label: "Role",
      render: (row) => {
        const isSelf = row.id === currentUser?.id;
        return (
          <Select
            value={row.admin_role || ""}
            onChange={(value) => updateRoleMutation.mutate({ userId: row.id, role: value as AdminRole })}
            options={ADMIN_ROLE_OPTIONS}
            // Changing your own role here could lock you out mid-session
            // (the change only takes effect on your next login anyway,
            // since it's baked into the JWT) - simplest to just disallow
            // it and have another root_admin make the change instead.
            disabled={isSelf}
          />
        );
      },
    },
    {
      key: "created_at",
      label: "Created",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "",
      render: (row) => {
        const isSelf = row.id === currentUser?.id;
        return (
          <Button
            variant="danger"
            disabled={isSelf}
            loading={updateRoleMutation.isPending}
            onClick={() => updateRoleMutation.mutate({ userId: row.id, role: null })}
          >
            Revoke
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-ink-100">Admin Accounts</h2>
        <Button onClick={() => setCreateOpen(true)}>Create admin account</Button>
      </div>

      {updateRoleMutation.isError ? (
        <p className="mb-3 text-sm text-red-600">
          {(updateRoleMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
            "Could not update that account."}
        </p>
      ) : null}

      {isLoading ? (
        <Spinner />
      ) : (
        <AdminDataTable columns={columns} rows={accounts || []} getKey={(row) => row.id} emptyMessage="No admin accounts yet." />
      )}

      <CreateAdminAccountDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
