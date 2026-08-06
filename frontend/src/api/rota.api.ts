import client from "./client";
import type { Rota } from "../types";

export async function listRotas(status?: string): Promise<Rota[]> {
  const { data } = await client.get<Rota[]>("/rotas", { params: { status } });
  return data;
}

export async function getRota(id: string): Promise<Rota> {
  const { data } = await client.get<Rota>(`/rotas/${id}`);
  return data;
}

export async function createRota(input: { name?: string; startDate: string; endDate: string; locationId?: string }): Promise<Rota> {
  const { data } = await client.post<Rota>("/rotas", input);
  return data;
}

export async function updateRota(id: string, input: Partial<{ name: string; startDate: string; endDate: string }>) {
  const { data } = await client.patch(`/rotas/${id}`, input);
  return data;
}

export async function deleteRota(id: string) {
  await client.delete(`/rotas/${id}`);
}

export async function publishRota(id: string) {
  const { data } = await client.post(`/rotas/${id}/publish`);
  return data;
}

export async function copyRota(id: string, newStartDate: string) {
  const { data } = await client.post(`/rotas/${id}/copy`, { newStartDate });
  return data;
}
