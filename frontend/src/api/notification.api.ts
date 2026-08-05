import client from "./client";
import type { Notification } from "../types";

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
}

export async function getNotifications(page = 1, limit = 20): Promise<NotificationsResponse> {
  const { data } = await client.get<NotificationsResponse>("/notifications", { params: { page, limit } });
  return data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await client.get<{ count: number }>("/notifications/unread-count");
  return data.count;
}

export async function markRead(id: string) {
  await client.post(`/notifications/${id}/read`);
}

export async function markAllRead() {
  await client.post("/notifications/read-all");
}
