const NOTIFICATION_SETUP_KEY = 'waka.namedTimers.notifications.v1';

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }
  try {
    return await navigator.serviceWorker.register('./sw.js');
  } catch (error) {
    console.warn('Service worker registration failed', error);
    return null;
  }
}

export async function requestNotificationsOnce() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    localStorage.setItem(NOTIFICATION_SETUP_KEY, 'granted');
    return 'granted';
  }
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(NOTIFICATION_SETUP_KEY, 'granted');
    }
    return permission;
  } catch (error) {
    return 'default';
  }
}

export async function showLocalNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker?.getRegistration?.();
    if (registration?.showNotification) {
      await registration.showNotification(title, {
        icon: './assets/icons/icon-192.png',
        badge: './assets/icons/icon-192.png',
        ...options,
      });
      return true;
    }
    new Notification(title, options);
    return true;
  } catch (error) {
    try {
      new Notification(title, options);
      return true;
    } catch (_) {
      return false;
    }
  }
}
