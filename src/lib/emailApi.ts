import type { StoredQuote } from "./quoteLibrary";

const SUB_KEY = "ke-email-subscription-v1";

export interface EmailSubscription {
  email: string;
  timezone: string;
  subscribedAt: string;
}

export function loadEmailSubscription(): EmailSubscription | null {
  try {
    const raw = localStorage.getItem(SUB_KEY);
    return raw ? (JSON.parse(raw) as EmailSubscription) : null;
  } catch {
    return null;
  }
}

export function saveEmailSubscription(sub: EmailSubscription): void {
  localStorage.setItem(SUB_KEY, JSON.stringify(sub));
}

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export interface EmailStats {
  sentThisMonth: number;
  month: string;
  limit: number;
  available: boolean;
}

export async function fetchEmailStats(email: string): Promise<EmailStats | null> {
  try {
    const res = await fetch(`/api/stats?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    return (await res.json()) as EmailStats;
  } catch {
    return null;
  }
}

export async function syncLibrary(email: string, quotes: StoredQuote[]): Promise<void> {
  await fetch("/api/library", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, quotes }),
  });
}

export async function subscribeDailyEmail(
  email: string,
  timezone: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, timezone }),
    });
    const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
    if (!res.ok) {
      return { ok: false, message: data.error ?? "Could not subscribe. Deploy to Vercel with KV + Resend." };
    }
    saveEmailSubscription({ email, timezone, subscribedAt: new Date().toISOString() });
    return { ok: true, message: data.message ?? "Subscribed to daily quotes at 8:00 AM." };
  } catch {
    saveEmailSubscription({ email, timezone, subscribedAt: new Date().toISOString() });
    return {
      ok: false,
      message: "Saved locally. Deploy and subscribe again to enable 8 AM emails.",
    };
  }
}
