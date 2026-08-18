import client from "./client";
import type { User } from "../types";

export async function listUsers(role?: string): Promise<User[]> {
  const { data } = await client.get<User[]>("/users", { params: { role } });
  return data;
}

export async function getUser(id: string): Promise<User> {
  const { data } = await client.get<User>(`/users/${id}`);
  return data;
}

export async function createUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "MANAGER" | "EMPLOYEE";
  businessId?: string;
  locationId?: string;
  categoryId?: string;
}): Promise<User> {
  const { data } = await client.post<User>("/users", input);
  return data;
}

export async function updateUser(id: string, input: Partial<Pick<User, "firstName" | "lastName" | "email" | "locationId" | "categoryId">>): Promise<User> {
  const { data } = await client.patch<User>(`/users/${id}`, input);
  return data;
}

export async function disableUser(id: string) {
  const { data } = await client.post(`/users/${id}/disable`);
  return data;
}

export async function enableUser(id: string) {
  const { data } = await client.post(`/users/${id}/enable`);
  return data;
}

export async function resetPassword(id: string, newPassword: string) {
  const { data } = await client.post(`/users/${id}/reset-password`, { newPassword });
  return data;
}

export async function deleteUser(id: string) {
  await client.delete(`/users/${id}`);
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await client.post("/users/change-password", { currentPassword, newPassword });
  return data;
}
