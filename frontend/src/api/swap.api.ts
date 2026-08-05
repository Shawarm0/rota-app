import client from "./client";
import type { SwapRequest } from "../types";

export async function requestSwap(shiftId: string): Promise<SwapRequest> {
  const { data } = await client.post<SwapRequest>("/swaps", { shiftId });
  return data;
}

export async function listSwapRequests(status?: string): Promise<SwapRequest[]> {
  const { data } = await client.get<SwapRequest[]>("/swaps", { params: { status } });
  return data;
}

export async function acceptSwap(id: string) {
  const { data } = await client.post(`/swaps/${id}/accept`);
  return data;
}

export async function approveSwap(id: string) {
  const { data } = await client.post(`/swaps/${id}/approve`);
  return data;
}

export async function rejectSwap(id: string) {
  const { data } = await client.post(`/swaps/${id}/reject`);
  return data;
}

export async function cancelSwap(id: string) {
  const { data } = await client.post(`/swaps/${id}/cancel`);
  return data;
}
