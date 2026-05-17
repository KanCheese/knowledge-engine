import type { ParsedQuote } from "./kindleParser";

export interface StoredQuote extends ParsedQuote {
  addedAt: string;
}

const LIBRARY_KEY = "ke-quote-library-v1";

export function normalizeForDedupe(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

export function dedupeKey(text: string, bookTitle: string): string {
  return `${normalizeForDedupe(bookTitle)}::${normalizeForDedupe(text)}`;
}

export function loadLibrary(): StoredQuote[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredQuote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLibrary(quotes: StoredQuote[]): void {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(quotes));
}

export function getTotalSaved(): number {
  return loadLibrary().length;
}

export interface MergeResult {
  /** Quotes new to the library from this paste */
  newQuotes: StoredQuote[];
  newCount: number;
  totalSaved: number;
}

export function mergeIntoLibrary(parsed: ParsedQuote[]): MergeResult {
  const library = loadLibrary();
  const existing = new Set(library.map((q) => dedupeKey(q.text, q.bookTitle)));
  const newQuotes: StoredQuote[] = [];

  for (const quote of parsed) {
    const key = dedupeKey(quote.text, quote.bookTitle);
    if (existing.has(key)) continue;
    existing.add(key);
    const stored: StoredQuote = {
      ...quote,
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
    };
    library.push(stored);
    newQuotes.push(stored);
  }

  saveLibrary(library);
  return { newQuotes, newCount: newQuotes.length, totalSaved: library.length };
}
