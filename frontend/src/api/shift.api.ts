import client from "./client";
import type { Shift } from "../types";

export async function createShift(rotaId: string, input: Partial<Shift>): Promise<Shift> {
  const { data } = await client.post<Shift>(`/rotas/${rotaId}/shifts`, input);
  return data;
}

export async function bulkCreateShifts(rotaId: string, shifts: Partial<Shift>[]) {
  const { data } = await client.post(`/rotas/${rotaId}/shifts/bulk`, { shifts });
  return data;
}

export async function updateShift(id: string, input: Partial<Shift>): Promise<Shift> {
  const { data } = await client.patch<Shift>(`/shifts/${id}`, input);
  return data;
}

export async function deleteShift(id: string) {
  await client.delete(`/shifts/${id}`);
}

export async function getMyShifts(from?: string, to?: string): Promise<Shift[]> {
  const { data } = await client.get<Shift[]>("/shifts/mine", { params: { from, to } });
  return data;
}

export async function getAllShifts(from?: string, to?: string, location?: string): Promise<Shift[]> {
  const { data } = await client.get<Shift[]>("/shifts/all", { params: { from, to, location } });
  return data;
}

export async function getAvailableShifts(): Promise<Shift[]> {
  const { data } = await client.get<Shift[]>("/shifts/available");
  return data;
}

export async function claimShift(id: string): Promise<Shift> {
  const { data } = await client.post<Shift>(`/shifts/${id}/claim`);
  return data;
}

export async function createAdditionalShift(input: {
  // Omit for an open shift anyone can pick up
  userId?: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
  requestCover?: boolean;
}): Promise<Shift> {
  const { data } = await client.post<Shift>("/shifts/additional", input);
  return data;
}

export async function requestCover(id: string): Promise<{ notified: number }> {
  const { data } = await client.post<{ notified: number }>(`/shifts/${id}/request-cover`);
  return data;
}

// Shifts at other stores waiting for approval from the signed-in manager (as the staff member's home store)
export interface CrossStoreRequest {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  store: string | null;
  draft: boolean;
  requestedBy: string | null;
  user: { id: string; firstName: string; lastName: string };
}

export async function listCrossStoreRequests(): Promise<CrossStoreRequest[]> {
  const { data } = await client.get<CrossStoreRequest[]>("/shifts/approvals");
  return data;
}

export async function decideCrossStoreRequest(id: string, approve: boolean) {
  await client.post(`/shifts/${id}/${approve ? "approve" : "reject"}`);
}
