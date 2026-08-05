import client from "./client";
import type { AuthResponse, User } from "../types";

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function refreshTokens(refreshToken: string) {
  const { data } = await client.post<{ accessToken: string; refreshToken: string }>("/auth/refresh", { refreshToken });
  return data;
}

export async function logout(refreshToken: string) {
  await client.post("/auth/logout", { refreshToken });
}

export async function getMe(): Promise<User> {
  const { data } = await client.get<User>("/auth/me");
  return data;
}
