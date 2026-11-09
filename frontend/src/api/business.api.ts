import client from "./client";

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
