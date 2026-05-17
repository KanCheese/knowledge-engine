import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  currentYearMonth,
  getEmailsSentThisMonth,
  isStoreReady,
  RESEND_FREE_MONTHLY_LIMIT,
} from "./_lib/store";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = typeof req.query.email === "string" ? req.query.email.trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Valid email query required" });
  }

  if (!isStoreReady()) {
    return res.status(200).json({
      sentThisMonth: 0,
      month: currentYearMonth(),
      limit: RESEND_FREE_MONTHLY_LIMIT,
      available: false,
    });
  }

  const sentThisMonth = await getEmailsSentThisMonth(email);
  return res.status(200).json({
    sentThisMonth,
    month: currentYearMonth(),
    limit: RESEND_FREE_MONTHLY_LIMIT,
    available: true,
  });
}
