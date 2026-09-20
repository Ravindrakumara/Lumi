import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { invoiceApi } from "../../api/invoiceApi";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import Spinner from "../../components/atoms/Spinner";
import { formatCents, invoiceStatusLabel, invoiceStatusTone } from "./format";
import InvoicePreviewDialog from "./InvoicePreviewDialog";

export default function InvoicesPage() {
  const { data: invoices, isLoading } = useQuery({ queryKey: ["invoices"], queryFn: invoiceApi.list });
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-ink-100">Billing</h2>
        <p className="text-sm text-slate-500 dark:text-ink-400">
          One invoice per billed month. New invoices appear automatically after each month ends.
        </p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !invoices || invoices.length === 0 ? (
        <Card className="text-center text-sm text-slate-500 dark:text-ink-400" padding="lg">
          No invoices yet - your first one appears after your first billed month ends.
        </Card>
      ) : (
        <Card padding="none" className="divide-y divide-slate-200 dark:divide-ink-700">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-ink-100">{invoice.invoice_number}</p>
                <p className="text-xs text-slate-500 dark:text-ink-400">
                  {invoice.period_start} &ndash; {invoice.period_end} &middot; {invoice.tier_name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-ink-100">
                  {formatCents(invoice.amount_cents, invoice.currency)}
                </span>
                <Badge tone={invoiceStatusTone(invoice.status, invoice.amount_cents)}>
                  {invoiceStatusLabel(invoice.status, invoice.amount_cents)}
                </Badge>
                <Button variant="secondary" onClick={() => setPreviewingId(invoice.id)}>
                  View
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <InvoicePreviewDialog invoiceId={previewingId} onClose={() => setPreviewingId(null)} />
    </div>
  );
}
