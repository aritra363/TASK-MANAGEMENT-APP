import api from "../api/api";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
};

// Clear old service worker caches to fix service worker issues
const clearOldCaches = async () => {
  if ("caches" in window) {
    try {
      const cacheNames = await caches.keys();
      // Delete old cache versions
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== "taskmgt-v1") {
            return caches.delete(cacheName);
          }
        })
      );
    } catch (err) {
      console.warn("Failed to clear old caches:", err);
    }
  }
};

export const registerServiceWorkerAndSubscribe = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push not supported");
    return;
  }

  // Clear old caches before registering
  await clearOldCaches();

  const reg = await navigator.serviceWorker.register("/sw.js", {
    updateViaCache: "none"
  });
  
  const r = await api.get("/push/vapidPublicKey");
  const publicKey = r.data.publicKey;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("Push permission not granted");
    return;
  }

  const subscribeOptions = {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  };

  const subscription = await reg.pushManager.subscribe(subscribeOptions);
  await api.post("/push/subscribe", subscription);
  return subscription;
};

export const unsubscribeFromPush = async () => {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await api.post("/push/unsubscribe", { endpoint: sub.endpoint });
    await sub.unsubscribe();
  } catch (err) {
    console.warn(err);
  }
};
