import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/adminApi";
import Card from "../../components/atoms/Card";

export default function AdminDashboardPage() {
  const { data } = useQuery({
    queryKey: ["admin", "rag-documents"],
    queryFn: adminApi.listRagDocuments,
  });

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-ink-100">Admin Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-2xl font-bold text-admin-600">{data?.documents?.length ?? "—"}</p>
          <p className="text-xs text-slate-500 dark:text-ink-400">RAG documents indexed</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-admin-600">{data?.backend ?? "—"}</p>
          <p className="text-xs text-slate-500 dark:text-ink-400">Active RAG backend</p>
        </Card>
      </div>
    </div>
  );
}
