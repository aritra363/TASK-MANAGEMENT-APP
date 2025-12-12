// Cache name
const CACHE_NAME = "taskmgt-v1";

// Push notification handler
self.addEventListener("push", function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Notification", body: event.data.text() };
    }
  }
  const title = data.title || "Notification";
  const options = {
    body: data.message || data.body || "You have a notification",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Message handler - do NOT return true unless handling async
self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Install event
self.addEventListener("install", function (event) {
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", function (event) {
  event.waitUntil(clients.claim());
});

// Fetch handler for offline support
self.addEventListener("fetch", function (event) {
  const url = event.request.url;

  // Only handle GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip all API calls, Socket.io, and authentication requests
  if (
    url.includes("/api/") ||
    url.includes("/auth/") ||
    url.includes("/socket.io/") ||
    url.includes("/manager/") ||
    url.includes("/employee/") ||
    url.includes("/admin/") ||
    url.includes("/tasks/")
  ) {
    return;
  }

  // Simple network-first strategy for static assets only
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses
        if (!response || response.status !== 200) {
          return response;
        }
        return response;
      })
      .catch(() => {
        // Offline fallback - only for static assets
        return caches.match(event.request);
      })
  );
});


