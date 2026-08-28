"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  isPushSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/actions/push";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type Status =
  | "checking"
  | "unsupported"
  | "denied"
  | "subscribed"
  | "unsubscribed";

export function NotificationsSection() {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      const sub = await reg?.pushManager.getSubscription();
      if (sub && (await isPushSubscribed(sub.endpoint))) {
        setStatus("subscribed");
      } else {
        setStatus("unsubscribed");
      }
    }
    check();
  }, []);

  async function handleEnable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("VAPID key no configurada");

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = sub.toJSON();
      if (!json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Suscripción push incompleta");
      }
      await subscribeToPush({
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setStatus("subscribed");
    } catch (err) {
      console.error("Push subscribe failed:", err);
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeFromPush(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-sm font-medium">Notificaciones</h3>

      {status === "checking" && (
        <p className="text-xs text-muted">Comprobando...</p>
      )}

      {status === "unsupported" && (
        <p className="text-xs text-muted">
          Tu navegador no soporta notificaciones push.
        </p>
      )}

      {status === "denied" && (
        <p className="text-xs text-muted">
          Bloqueaste los permisos de notificación. Actívalos desde los ajustes
          del navegador para recibir avisos.
        </p>
      )}

      {status === "subscribed" && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            Recibirás avisos de fin de ayuno, sesiones Hyrox y horas de comida.
          </p>
          <button
            type="button"
            onClick={handleDisable}
            disabled={busy}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:text-text transition-colors disabled:opacity-50"
          >
            <BellOff size={14} />
            Desactivar
          </button>
        </div>
      )}

      {status === "unsubscribed" && (
        <button
          type="button"
          onClick={handleEnable}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text hover:border-accent transition-colors disabled:opacity-50"
        >
          <Bell size={14} />
          Activar notificaciones
        </button>
      )}
    </div>
  );
}
