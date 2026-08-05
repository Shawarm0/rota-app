import client from "./client";
import type { HolidayRequest } from "../types";

export async function requestHoliday(input: { date: string; shiftId?: string; reason?: string }): Promise<HolidayRequest> {
  const { data } = await client.post<HolidayRequest>("/holidays", input);
  return data;
}

export async function listHolidayRequests(status?: string): Promise<HolidayRequest[]> {
  const { data } = await client.get<HolidayRequest[]>("/holidays", { params: { status } });
  return data;
}

export async function approveHoliday(id: string) {
  const { data } = await client.post(`/holidays/${id}/approve`);
  return data;
}

export async function rejectHoliday(id: string, reason?: string) {
  const { data } = await client.post(`/holidays/${id}/reject`, { reason });
  return data;
}

export async function cancelHoliday(id: string) {
  const { data } = await client.post(`/holidays/${id}/cancel`);
  return data;
}
