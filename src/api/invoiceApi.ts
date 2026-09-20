import { client } from "./client";
import type { Invoice } from "../types";

export const invoiceApi = {
  list: (): Promise<Invoice[]> => client.get("/invoices").then((r) => r.data.invoices),

  get: (invoiceId: string): Promise<Invoice> => client.get(`/invoices/${invoiceId}`).then((r) => r.data),

  pay: (invoiceId: string): Promise<Invoice> =>
    client.post(`/invoices/${invoiceId}/pay`).then((r) => r.data),
};
