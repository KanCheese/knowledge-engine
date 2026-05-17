import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pickDailyQuote, sendDailyQuoteEmail } from "../_lib/email";
import { getLibrary, getSubscribers, incrementEmailsSent, isStoreReady } from "../_lib/store";

const TARGET_HOUR = 8;

function isEightAmInTimezone(timezone: string, now = new Date()): boolean {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? -1);
    return hour === TARGET_HOUR;
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization;
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!isStoreReady()) {
    return res.status(503).json({ error: "KV not configured" });
  }

  const subscribers = await getSubscribers();
  const results: { email: string; status: string }[] = [];

  for (const sub of subscribers) {
    if (!isEightAmInTimezone(sub.timezone)) {
      results.push({ email: sub.email, status: "skipped-not-8am" });
      continue;
    }

    const library = await getLibrary(sub.email);
    const quote = pickDailyQuote(library);
    if (!quote) {
      results.push({ email: sub.email, status: "skipped-no-quotes" });
      continue;
    }

    try {
      await sendDailyQuoteEmail(sub.email, quote);
      await incrementEmailsSent(sub.email);
      results.push({ email: sub.email, status: "sent" });
    } catch (e) {
      results.push({
        email: sub.email,
        status: `error: ${e instanceof Error ? e.message : "unknown"}`,
      });
    }
  }

  return res.status(200).json({ ok: true, results });
}
