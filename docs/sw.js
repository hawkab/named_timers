const CACHE_NAME = 'waka-named-timers-v3';
const APP_SHELL = [
  "./",
  "./app/i18n/i18n.js",
  "./app/i18n/translations.js",
  "./app/main.js",
  "./app/state/default-data.js",
  "./app/state/store.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./components/app-shell/app-shell.css",
  "./components/app-shell/app-shell.html",
  "./components/app-shell/app-shell.js",
  "./components/duration-input/duration-input.css",
  "./components/duration-input/duration-input.html",
  "./components/duration-input/duration-input.js",
  "./components/empty-state/empty-state.css",
  "./components/empty-state/empty-state.html",
  "./components/empty-state/empty-state.js",
  "./components/file-actions/file-actions.css",
  "./components/file-actions/file-actions.html",
  "./components/file-actions/file-actions.js",
  "./components/floating-controls/floating-controls.css",
  "./components/floating-controls/floating-controls.html",
  "./components/floating-controls/floating-controls.js",
  "./components/process-card/process-card.css",
  "./components/process-card/process-card.html",
  "./components/process-card/process-card.js",
  "./components/process-editor/process-editor.css",
  "./components/process-editor/process-editor.html",
  "./components/process-editor/process-editor.js",
  "./components/progress-bar/progress-bar.css",
  "./components/progress-bar/progress-bar.html",
  "./components/progress-bar/progress-bar.js",
  "./components/runner/runner.css",
  "./components/runner/runner.html",
  "./components/runner/runner.js",
  "./components/sidebar/sidebar.css",
  "./components/sidebar/sidebar.html",
  "./components/sidebar/sidebar.js",
  "./components/sound-settings/sound-settings.css",
  "./components/sound-settings/sound-settings.html",
  "./components/sound-settings/sound-settings.js",
  "./components/stage-editor/stage-editor.css",
  "./components/stage-editor/stage-editor.html",
  "./components/stage-editor/stage-editor.js",
  "./components/toast/toast.css",
  "./components/toast/toast.html",
  "./components/toast/toast.js",
  "./index.html",
  "./manifest.webmanifest",
  "./shared/component-loader.js",
  "./shared/dom.js",
  "./shared/events.js",
  "./shared/file-io.js",
  "./shared/ids.js",
  "./shared/notifications.js",
  "./shared/sound.js",
  "./shared/time.js",
  "./styles.css"
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('waka-named-timers-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./')))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if ('focus' in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow('./');
    return undefined;
  }));
});
