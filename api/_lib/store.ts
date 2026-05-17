import { kv } from "@vercel/kv";

export interface Subscriber {
  email: string;
  timezone: string;
  subscribedAt: string;
}

export interface QuoteRecord {
  id: string;
  bookTitle: string;
  author: string | null;
  text: string;
  addedAt: string;
}

const SUBSCRIBERS_KEY = "ke:subscribers";
const libraryKey = (email: string) => `ke:library:${email.toLowerCase()}`;

function kvReady(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function getSubscribers(): Promise<Subscriber[]> {
  if (!kvReady()) return [];
  const list = await kv.get<Subscriber[]>(SUBSCRIBERS_KEY);
  return list ?? [];
}

export async function upsertSubscriber(sub: Subscriber): Promise<void> {
  if (!kvReady()) throw new Error("KV not configured");
  const list = await getSubscribers();
  const email = sub.email.toLowerCase();
  const next = list.filter((s) => s.email.toLowerCase() !== email);
  next.push({ ...sub, email: sub.email.toLowerCase() });
  await kv.set(SUBSCRIBERS_KEY, next);
}

export async function saveLibrary(email: string, quotes: QuoteRecord[]): Promise<void> {
  if (!kvReady()) throw new Error("KV not configured");
  await kv.set(libraryKey(email), quotes);
}

export async function getLibrary(email: string): Promise<QuoteRecord[]> {
  if (!kvReady()) return [];
  const lib = await kv.get<QuoteRecord[]>(libraryKey(email));
  return lib ?? [];
}

export function isStoreReady(): boolean {
  return kvReady();
}

const emailStatsKey = (email: string, yearMonth: string) =>
  `ke:email-stats:${email.toLowerCase()}:${yearMonth}`;

export function currentYearMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function incrementEmailsSent(email: string): Promise<number> {
  if (!kvReady()) return 0;
  const ym = currentYearMonth();
  const key = emailStatsKey(email, ym);
  const count = await kv.incr(key);
  return count;
}

export async function getEmailsSentThisMonth(email: string): Promise<number> {
  if (!kvReady()) return 0;
  const key = emailStatsKey(email, currentYearMonth());
  const count = await kv.get<number>(key);
  return count ?? 0;
}

/** Resend free tier — display only */
export const RESEND_FREE_MONTHLY_LIMIT = 3000;
