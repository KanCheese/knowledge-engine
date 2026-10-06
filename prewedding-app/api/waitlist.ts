type WaitlistBody = {
  phone: string;
  name?: string;
  lang?: string;
  website?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  page_url?: string;
  signed_up_at?: string;
};

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function isValidPhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone);
}

function getClientIp(
  headers: Record<string, string | string[] | undefined> = {},
) {
  const forwarded = headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

export default async function handler(
  req: {
    method?: string;
    body?: WaitlistBody;
    headers?: Record<string, string | string[] | undefined>;
  },
  res: {
    status: (code: number) => {
      json: (body: unknown) => void;
      end: () => void;
    };
    setHeader: (key: string, value: string) => void;
  },
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = getClientIp(req.headers);
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const body = req.body ?? ({} as WaitlistBody);

  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  const phone = String(body.phone ?? "").replace(/\D/g, "");

  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: "Invalid phone number" });
  }

  const entry = {
    phone,
    name: body.name ?? "",
    lang: body.lang ?? "hi",
    utm_source: body.utm_source ?? "",
    utm_medium: body.utm_medium ?? "",
    utm_campaign: body.utm_campaign ?? "",
    utm_content: body.utm_content ?? "",
    utm_term: body.utm_term ?? "",
    referrer: body.referrer ?? "",
    page_url: body.page_url ?? "",
    signed_up_at: body.signed_up_at ?? new Date().toISOString(),
  };

  const webhookUrl = process.env.WAITLIST_WEBHOOK_URL;
  const webhookSecret = process.env.WAITLIST_WEBHOOK_SECRET;

  if (webhookUrl) {
    try {
      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(webhookSecret ? { "X-Waitlist-Secret": webhookSecret } : {}),
        },
        body: JSON.stringify(entry),
      });
      if (!webhookRes.ok) {
        console.error("Webhook failed:", webhookRes.status, await webhookRes.text());
      }
    } catch (err) {
      console.error("Webhook error:", err);
    }
  } else {
    console.log("[waitlist]", JSON.stringify(entry));
  }

  return res.status(200).json({ ok: true });
}
