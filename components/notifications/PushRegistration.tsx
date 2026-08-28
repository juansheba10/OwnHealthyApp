"use client";

import { useEffect } from "react";

// Registers the service worker on load. Subscribing to push is a separate,
// explicit user action from Settings — this component only makes sure the
// worker is installed and ready for that later step.
export function PushRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  }, []);

  return null;
}
