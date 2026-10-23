import webpush from "web-push";
import prisma from "../lib/db.js";
import { env } from "../config/env.js";
import logger from "../lib/logger.js";

// Only these notification types are sent to the phone. Everything else stays in-app only.
const PUSH_TYPES = new Set([
  "ROTA_PUBLISHED",
  "SHIFT_COVER",
  "SWAP_REQUEST",
  "SWAP_ACCEPTED",
  "SWAP_COMPLETED",
  "SWAP_REJECTED",
  "HOLIDAY_REQUEST",
  "HOLIDAY_APPROVED",
  "HOLIDAY_REJECTED",
]);

// Where tapping the notification takes the user
const PUSH_URLS: Record<string, string> = {
  ROTA_PUBLISHED: "/my-shifts",
  SHIFT_COVER: "/shift-pot",
  SWAP_COMPLETED: "/my-shifts",
  HOLIDAY_APPROVED: "/holidays",
  HOLIDAY_REJECTED: "/holidays",
};

const pushEnabled = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);

if (pushEnabled) {
  webpush.setVapidDetails(env.VAPID_EMAIL, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

export interface PushNotification {
  userId: string;
  title: string;
  body: string;
  data: { type: string; [key: string]: unknown };
}

export function getPublicKey() {
  return env.VAPID_PUBLIC_KEY;
}

export async function subscribe(userId: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  // A device can only belong to one user at a time (e.g. shared phone, different login)
  return prisma.pushToken.upsert({
    where: { endpoint: sub.endpoint },
    create: { userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    update: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  });
}

export async function unsubscribe(userId: string, endpoint: string) {
  return prisma.pushToken.deleteMany({ where: { userId, endpoint } });
}

// Fire-and-forget: never blocks or fails the request that triggered it
export function sendPush(notifications: PushNotification[]) {
  if (!pushEnabled) return;
  const toSend = notifications.filter((n) => PUSH_TYPES.has(n.data.type));
  if (toSend.length === 0) return;

  void deliver(toSend).catch((err) => logger.error({ err }, "Push delivery failed"));
}

async function deliver(notifications: PushNotification[]) {
  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: [...new Set(notifications.map((n) => n.userId))] } },
  });

  await Promise.all(
    notifications.flatMap((n) =>
      tokens
        .filter((t) => t.userId === n.userId)
        .map(async (t) => {
          const payload = JSON.stringify({
            title: n.title,
            body: n.body,
            data: { ...n.data, url: PUSH_URLS[n.data.type] ?? "/notifications" },
          });
          try {
            await webpush.sendNotification(
              { endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } },
              payload,
              { TTL: 60 * 60 * 24 },
            );
          } catch (err) {
            const status = (err as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410) {
              await prisma.pushToken.delete({ where: { id: t.id } }).catch(() => {});
            } else {
              logger.warn({ err, userId: t.userId }, "Push send failed");
            }
          }
        }),
    ),
  );
}
