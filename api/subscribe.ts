import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isStoreReady, upsertSubscriber } from "./_lib/store";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, timezone } = req.body as { email?: string; timezone?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Valid email required" });
  }

  if (!isStoreReady()) {
    return res.status(503).json({
      error: "Server storage not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN on Vercel.",
    });
  }

  const tz = timezone || "UTC";
  await upsertSubscriber({
    email: email.toLowerCase(),
    timezone: tz,
    subscribedAt: new Date().toISOString(),
  });

  return res.status(200).json({
    ok: true,
    message: `Subscribed. Daily quote at 8:00 AM (${tz}).`,
  });
}
