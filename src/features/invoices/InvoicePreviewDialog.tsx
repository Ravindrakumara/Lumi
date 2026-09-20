import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoiceApi } from "../../api/invoiceApi";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Spinner from "../../components/atoms/Spinner";
import { formatCents, invoiceStatusLabel, invoiceStatusTone } from "./format";

interface InvoicePreviewDialogProps {
  invoiceId: string | null;
  onClose: () => void;
}

export default function InvoicePreviewDialog({ invoiceId, onClose }: InvoicePreviewDialogProps) {
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => invoiceApi.get(invoiceId!),
    enabled: invoiceId !== null,
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.pay(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
    },
  });

  if (invoiceId === null) return null;

  return (
    <Dialog open={invoiceId !== null} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40 print:hidden" />
      <div className="fixed inset-0 flex items-center justify-center p-4 print:static print:p-0">
        <DialogPanel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-ink-900 print:max-w-none print:rounded-none print:shadow-none print:dark:bg-white">
          {isLoading || !invoice ? (
            <div className="flex justify-center py-10">
              <Spinner size={28} />
            </div>
          ) : (
            <>
          <div id="invoice-print" className="print:p-8">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-ink-100 print:text-black">
                  Invoice {invoice.invoice_number}
                </DialogTitle>
                <p className="mt-1 text-sm text-slate-500 dark:text-ink-400 print:text-black">
                  {invoice.period_start} &ndash; {invoice.period_end}
                </p>
              </div>
              <Badge tone={invoiceStatusTone(invoice.status, invoice.amount_cents)}>
                {invoiceStatusLabel(invoice.status, invoice.amount_cents)}
              </Badge>
            </div>

            <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm dark:border-ink-700 print:border-slate-300">
              <Row label="Plan" value={invoice.tier_name} />
              <Row label="Chat messages used" value={String(invoice.chat_messages_used)} />
              <Row label="Voice minutes used" value={invoice.voice_minutes_used.toFixed(1)} />
              <Row label="Issued" value={new Date(invoice.issued_at).toLocaleString()} />
              {invoice.paid_at ? <Row label="Paid" value={new Date(invoice.paid_at).toLocaleString()} /> : null}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-ink-700 print:border-slate-300">
              <span className="text-sm font-medium text-slate-700 dark:text-ink-100 print:text-black">
                Amount due
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-ink-100 print:text-black">
                {formatCents(invoice.amount_cents, invoice.currency)}
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 print:hidden">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              Print
            </Button>
            {invoice.status !== "paid" && invoice.amount_cents > 0 ? (
              <Button onClick={() => payMutation.mutate(invoice.id)} loading={payMutation.isPending}>
                Pay
              </Button>
            ) : null}
          </div>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500 dark:text-ink-400 print:text-black">{label}</span>
      <span className="text-slate-800 dark:text-ink-100 print:text-black">{value}</span>
    </div>
  );
}
