import client from "./client";
import type { ShiftTemplate } from "../types";

export interface ShiftTemplateInput {
  name: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
  locationId?: string | null;
}

export async function listShiftTemplates(): Promise<ShiftTemplate[]> {
  const { data } = await client.get<ShiftTemplate[]>("/shift-templates");
  return data;
}

export async function createShiftTemplate(input: ShiftTemplateInput): Promise<ShiftTemplate> {
  const { data } = await client.post<ShiftTemplate>("/shift-templates", input);
  return data;
}

export async function updateShiftTemplate(id: string, input: ShiftTemplateInput): Promise<ShiftTemplate> {
  const { data } = await client.put<ShiftTemplate>(`/shift-templates/${id}`, input);
  return data;
}

export async function deleteShiftTemplate(id: string) {
  await client.delete(`/shift-templates/${id}`);
}
