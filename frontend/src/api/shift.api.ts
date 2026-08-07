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
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
}): Promise<Shift> {
  const { data } = await client.post<Shift>("/shifts/additional", input);
  return data;
}

export async function requestCover(id: string): Promise<{ notified: number }> {
  const { data } = await client.post<{ notified: number }>(`/shifts/${id}/request-cover`);
  return data;
}
