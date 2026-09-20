export function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

// A $0 invoice (Free tier) is never actually owed - labeling it "Unpaid"
// reads as a debt that doesn't exist, confusing once real paid invoices
// sit next to it in the same list.
export function invoiceStatusLabel(status: string, amountCents: number): string {
  if (amountCents === 0) return "Free";
  return status === "paid" ? "Paid" : "Unpaid";
}

export function invoiceStatusTone(status: string, amountCents: number): "success" | "warning" | "neutral" {
  if (amountCents === 0) return "neutral";
  return status === "paid" ? "success" : "warning";
}
