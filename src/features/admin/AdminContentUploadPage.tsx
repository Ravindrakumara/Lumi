import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useRef, useState } from "react";
import { adminApi } from "../../api/adminApi";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import AdminDataTable, { type Column } from "../../components/organisms/AdminDataTable";
import type { RagDocument } from "../../types";

const COLUMNS: Column<RagDocument>[] = [
  { key: "name", label: "File" },
  { key: "size_bytes", label: "Size", render: (row) => `${(row.size_bytes / 1024).toFixed(1)} KB` },
];

export default function AdminContentUploadPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "rag-documents"],
    queryFn: adminApi.listRagDocuments,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => adminApi.uploadRagDocument(file),
    onSuccess: (result) => {
      setStatusMessage(
        result.indexed_chunks != null
          ? `Uploaded "${result.saved}" — re-indexed ${result.indexed_chunks} chunks.`
          : `Uploaded "${result.saved}" — ${result.note}`
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "rag-documents"] });
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err: AxiosError<{ detail: string }>) => {
      setStatusMessage(err.response?.data?.detail || "Upload failed.");
    },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-ink-100">RAG Content</h2>
        {data?.backend ? <Badge tone="admin">backend: {data.backend}</Badge> : null}
      </div>

      <Card className="mb-6">
        <p className="mb-3 text-sm text-slate-600 dark:text-ink-400">
          Upload a .txt, .md, or .pdf knowledge document. It's saved to the knowledge folder and
          immediately re-embedded into the RAG index — no terminal step needed.
        </p>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadMutation.mutate(file);
            }}
            className="text-sm dark:text-ink-400"
          />
          {uploadMutation.isPending ? <Button loading disabled>Uploading…</Button> : null}
        </div>
        {statusMessage ? <p className="mt-2 text-sm text-slate-600 dark:text-ink-400">{statusMessage}</p> : null}
      </Card>

      <h3 className="mb-2 font-semibold text-slate-800 dark:text-ink-100">Indexed documents</h3>
      {isLoading ? null : (
        <AdminDataTable<RagDocument>
          columns={COLUMNS}
          rows={data?.documents || []}
          emptyMessage="No documents uploaded yet."
        />
      )}
    </div>
  );
}
