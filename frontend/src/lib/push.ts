import * as notificationApi from "../api/notification.api";

export type PushState = "unsupported" | "needs-install" | "denied" | "enabled" | "disabled";

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function getPushState(): Promise<PushState> {
  // iOS only exposes push to web apps launched from the home screen
  if (isIOS() && !isStandalone()) return "needs-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "denied") return "denied";

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  return subscription && Notification.permission === "granted" ? "enabled" : "disabled";
}

// Must be called from a user gesture (button tap) or iOS will refuse the permission prompt
export async function enablePush(): Promise<PushState> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "disabled";

  const publicKey = await notificationApi.getPushPublicKey();
  if (!publicKey) throw new Error("Push notifications are not configured on the server");

  await navigator.serviceWorker.register("/sw.js");
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  await notificationApi.subscribePush(subscription.toJSON());
  return "enabled";
}

export async function disablePush() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  await notificationApi.unsubscribePush(subscription.endpoint).catch(() => {});
  await subscription.unsubscribe();
}

// Re-link this device's subscription to whoever is signed in now. Covers sessions that
// expired without a proper sign-out (another user signing in on the same phone) and
// subscriptions the server dropped.
export async function syncPushSubscription() {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) await notificationApi.subscribePush(subscription.toJSON());
}
