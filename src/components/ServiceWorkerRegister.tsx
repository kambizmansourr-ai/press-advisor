"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // offline caching is a progressive enhancement; a failed registration
        // (e.g. served over plain http on a non-localhost host) should not break the app.
      });
    }
  }, []);

  return null;
}
