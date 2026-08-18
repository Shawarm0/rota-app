import client from "./client";
import type { Category } from "../types";

export async function listCategories(): Promise<Category[]> {
  const { data } = await client.get<Category[]>("/categories");
  return data;
}

export async function createCategory(input: { name: string; color: string }): Promise<Category> {
  const { data } = await client.post<Category>("/categories", input);
  return data;
}

export async function updateCategory(id: string, input: { name?: string; color?: string }): Promise<Category> {
  const { data } = await client.patch<Category>(`/categories/${id}`, input);
  return data;
}

export async function deleteCategory(id: string) {
  await client.delete(`/categories/${id}`);
}
