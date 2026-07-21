(() => {
  "use strict";

  const TARGET = "https://neuroped.pages.dev";
  const destination = `${TARGET}${window.location.hash || ""}`;

  function clearNamespacedStorage(storage) {
    try {
      const keys = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key?.startsWith("neuroped:") || key?.startsWith("np_")) {
          keys.push(key);
        }
      }
      for (const key of keys) storage.removeItem(key);
    } catch {
      // O redirecionamento continua mesmo quando storage está indisponível.
    }
  }

  clearNamespacedStorage(window.localStorage);
  clearNamespacedStorage(window.sessionStorage);

  const cleanup = [];

  if ("serviceWorker" in navigator) {
    cleanup.push(
      navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(
          registrations
            .filter((registration) => {
              try {
                return new URL(registration.scope).pathname.startsWith("/neuroped/");
              } catch {
                return false;
              }
            })
            .map((registration) => registration.unregister()),
        ),
      ),
    );
  }

  if ("caches" in window) {
    cleanup.push(
      window.caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("neuroped-"))
            .map((key) => window.caches.delete(key)),
        ),
      ),
    );
  }

  if ("indexedDB" in window) {
    cleanup.push(
      new Promise((resolve) => {
        const request = window.indexedDB.deleteDatabase("neuroped-icp");
        request.onsuccess = resolve;
        request.onerror = resolve;
        request.onblocked = resolve;
      }),
    );
  }

  const redirect = () => window.location.replace(destination);
  Promise.allSettled(cleanup).finally(redirect);
  window.setTimeout(redirect, 1_500);
})();
