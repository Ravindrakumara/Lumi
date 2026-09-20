import { client } from "./client";
import type { Profile, ProfileUpdateRequest, Program } from "../types";

export const profileApi = {
  get: (): Promise<Profile> => client.get("/profile").then((r) => r.data),

  update: (body: ProfileUpdateRequest): Promise<Profile> =>
    client.put("/profile", body).then((r) => r.data),

  listPrograms: (): Promise<Program[]> =>
    client.get("/programs").then((r) => r.data.programs),
};
