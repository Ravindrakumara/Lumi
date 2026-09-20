import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
  getKey?: (row: T, index: number) => string | number;
}

export default function AdminDataTable<T>({
  columns,
  rows,
  emptyMessage = "No data yet.",
  getKey = (_row, index) => index,
}: AdminDataTableProps<T>) {
  if (!rows.length) {
    return (
      <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-ink-900 dark:text-ink-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-ink-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600 dark:bg-ink-800 dark:text-ink-400">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2 font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-ink-700 dark:bg-ink-900">
          {rows.map((row, i) => (
            <tr key={getKey(row, i)}>
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2 text-slate-800 dark:text-ink-100">
                  {col.render ? col.render(row) : String(row[col.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
