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

export const registerServiceWorkerAndSubscribe = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push not supported");
    return;
  }

  const reg = await navigator.serviceWorker.register("/sw.js");
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
