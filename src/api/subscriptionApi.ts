import { client } from "./client";
import type { AdminSubscriptionUpdateRequest, PlanSelectionRequest, Subscription, Tier } from "../types";

export const subscriptionApi = {
  getMine: (): Promise<Subscription> => client.get("/subscription").then((r) => r.data),

  listTiers: (): Promise<Tier[]> => client.get("/subscription/tiers").then((r) => r.data.tiers),

  selectPlan: (body: PlanSelectionRequest): Promise<Subscription> =>
    client.post("/subscription/select-plan", body).then((r) => r.data),

  adminGet: (userId: string): Promise<Subscription> =>
    client.get(`/admin/subscriptions/${userId}`).then((r) => r.data),

  adminUpdate: (userId: string, body: AdminSubscriptionUpdateRequest): Promise<Subscription> =>
    client.put(`/admin/subscriptions/${userId}`, body).then((r) => r.data),
};
