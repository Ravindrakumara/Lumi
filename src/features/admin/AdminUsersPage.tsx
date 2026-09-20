import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi } from "../../api/adminApi";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Spinner from "../../components/atoms/Spinner";
import AdminDataTable, { type Column } from "../../components/organisms/AdminDataTable";
import ManageSubscriptionDialog from "./ManageSubscriptionDialog";
import type { User } from "../../types";

export default function AdminUsersPage() {
  const { data: users, isLoading } = useQuery({ queryKey: ["admin", "users"], queryFn: adminApi.listUsers });
  const [managingUser, setManagingUser] = useState<User | null>(null);

  const columns: Column<User>[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "is_admin",
      label: "Role",
      render: (row) => <Badge tone={row.is_admin ? "admin" : "neutral"}>{row.is_admin ? "Admin" : "Learner"}</Badge>,
    },
    {
      key: "created_at",
      label: "Joined",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <Button variant="secondary" onClick={() => setManagingUser(row)}>
          Manage subscription
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-ink-100">Users</h2>
      {isLoading ? (
        <Spinner />
      ) : (
        <AdminDataTable columns={columns} rows={users || []} getKey={(row) => row.id} emptyMessage="No users yet." />
      )}

      <ManageSubscriptionDialog
        userId={managingUser?.id ?? null}
        userLabel={managingUser ? `${managingUser.name} (${managingUser.email})` : ""}
        onClose={() => setManagingUser(null)}
      />
    </div>
  );
}
