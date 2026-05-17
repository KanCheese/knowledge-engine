import { Resend } from "resend";
import type { QuoteRecord } from "./store";

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export function pickDailyQuote(quotes: QuoteRecord[]): QuoteRecord | null {
  if (quotes.length === 0) return null;
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return quotes[dayIndex % quotes.length] ?? quotes[0] ?? null;
}

export async function sendDailyQuoteEmail(
  to: string,
  quote: QuoteRecord,
): Promise<void> {
  const resend = getResend();
  if (!resend) throw new Error("RESEND_API_KEY not configured");

  const from = process.env.EMAIL_FROM ?? "Knowledge Engine <onboarding@resend.dev>";
  const text = quote.text;
  const attribution = [quote.bookTitle, quote.author].filter(Boolean).join(" · ");

  await resend.emails.send({
    from,
    to,
    subject: `Your quote — ${quote.bookTitle}`,
    html: `
      <div style="font-family: 'Titillium Web', Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #111;">
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #666;">Knowledge Engine</p>
        <blockquote style="font-size: 20px; line-height: 1.5; margin: 24px 0; font-weight: 400;">
          “${text.replace(/"/g, "&quot;")}”
        </blockquote>
        <p style="font-size: 14px; color: #444; font-weight: 600;">${attribution}</p>
        <p style="font-size: 12px; color: #888; margin-top: 32px;">Delivered daily at 8:00 AM your time.</p>
      </div>
    `,
  });
}
