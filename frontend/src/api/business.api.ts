import client from "./client";
import type { ActivityEntry } from "../lib/activity";

export interface BusinessSummary {
  id: string;
  name: string;
  createdAt: string;
  locations: { id: string; name: string }[];
  users: { id: string; firstName: string; lastName: string; email: string; active: boolean }[];
  _count: { users: number };
}

export interface CreateBusinessInput {
  name: string;
  owner: { email: string; password: string; firstName: string; lastName: string };
}

export async function listBusinesses(): Promise<BusinessSummary[]> {
  const { data } = await client.get<BusinessSummary[]>("/businesses");
  return data;
}

export async function createBusiness(input: CreateBusinessInput) {
  const { data } = await client.post<{ id: string; name: string }>("/businesses", input);
  return data;
}

// The newest entries, plus how many the business has in total
export async function listActivity(businessId: string) {
  const { data } = await client.get<{ total: number; items: ActivityEntry[] }>(`/businesses/${businessId}/activity`);
  return data;
}

// Without ids, the business's whole activity log is deleted
export async function deleteActivity(businessId: string, ids?: string[]) {
  const { data } = await client.delete<{ deleted: number }>(`/businesses/${businessId}/activity`, { data: ids ? { ids } : {} });
  return data;
}
