const CACHE = "tasklite-shell-v3";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon.svg"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).pathname.startsWith("/api/")) return;
  event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request).then(hit => hit || caches.match("/"))));
});
self.addEventListener("push", event => {
  const data = event.data?.json() || {};
  const overdue = data.notificationType === "overdue";
  event.waitUntil(self.registration.showNotification(data.title || "Task Reminder", { body: data.body || "You have a task due", icon: overdue ? "/icons/overdue-192.png" : "/icons/icon-192.png", badge: overdue ? "/icons/overdue-192.png" : "/icons/icon-192.png", tag: `task-${data.taskId || "general"}-${data.notificationType || "update"}`, requireInteraction: overdue, silent: false, data: { url: data.url || "/", taskId: data.taskId }, actions: data.taskId ? [{ action: "complete", title: "Complete" }, { action: "open", title: "Open" }] : [{ action: "open", title: "Open" }] }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close(); const url = event.notification.data?.url || "/";
  if (event.action === "complete" && event.notification.data?.taskId) { event.waitUntil(fetch(`/api/tasks/${event.notification.data.taskId}/complete`, { method: "POST", credentials: "include" }).then(() => self.registration.showNotification("Task completed", { body: "Nice work.", icon: "/icons/icon.svg" }))); return; }
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => { const open = list.find(c => "focus" in c); return open ? open.focus().then(() => open.navigate(url)) : clients.openWindow(url); }));
});
