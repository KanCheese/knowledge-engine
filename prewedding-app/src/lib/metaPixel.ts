declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: Fbq;
};

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID ?? "";

let initialized = false;

export function initMetaPixel() {
  if (!PIXEL_ID || initialized || typeof window === "undefined") return;
  initialized = true;

  const n = (window.fbq as Fbq | undefined) ?? (function (...args: unknown[]) {
    const fbq = n as Fbq;
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  } as Fbq);

  if (!window.fbq) window.fbq = n;
  if (!window._fbq) window._fbq = n;

  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = n.queue ?? [];

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const first = document.getElementsByTagName("script")[0];
  first.parentNode?.insertBefore(script, first);

  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
}

export function trackMetaEvent(
  event: "Lead" | "ViewContent" | "InitiateCheckout",
  data?: Record<string, unknown>,
) {
  if (!PIXEL_ID || !window.fbq) return;
  window.fbq("track", event, data);
}

export function hasMetaPixel() {
  return Boolean(PIXEL_ID);
}
