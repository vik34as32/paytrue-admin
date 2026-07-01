/* Firebase Cloud Messaging is not configured in this app.
   This stub prevents 404/500 errors from browsers or extensions
   that probe for a default firebase-messaging service worker. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
