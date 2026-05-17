import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isStoreReady, saveLibrary, type QuoteRecord } from "./_lib/store";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, quotes } = req.body as { email?: string; quotes?: QuoteRecord[] };
  if (!email || !Array.isArray(quotes)) {
    return res.status(400).json({ error: "email and quotes required" });
  }

  if (!isStoreReady()) {
    return res.status(503).json({ error: "KV not configured" });
  }

  await saveLibrary(email.toLowerCase(), quotes);
  return res.status(200).json({ ok: true, count: quotes.length });
}
