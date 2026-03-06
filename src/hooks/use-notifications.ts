import { useEffect, useCallback } from "react";

export function useNotificationPermission() {
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);
}

export function sendBrowserNotification(title: string, body: string, onClick?: () => void) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const notification = new Notification(title, {
    body,
    icon: "/favicon.png",
    requireInteraction: true, // Persist until dismissed
  });

  if (onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }
}
