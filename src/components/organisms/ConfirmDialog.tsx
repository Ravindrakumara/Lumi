import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import type { ReactNode } from "react";
import Button from "../atoms/Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmLabel?: string;
  confirmPending?: boolean;
  children: ReactNode;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  confirmLabel = "Confirm",
  confirmPending,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 transition duration-100 data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl transition duration-100 data-closed:scale-95 data-closed:opacity-0 dark:bg-ink-900"
        >
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-ink-100">{title}</DialogTitle>
          <div className="mt-2 text-sm text-slate-600 dark:text-ink-400">{children}</div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm} loading={confirmPending}>
              {confirmLabel}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
