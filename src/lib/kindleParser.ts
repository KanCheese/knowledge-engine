export interface ParsedQuote {
  id: string;
  bookTitle: string;
  author: string | null;
  text: string;
}

const SKIP_LINE =
  /^(your notebook|kindle notebook|notebook|sign in|menu|search|library|export|share|delete all|show more|show less|back to top|kindle)$/i;

const CHROME_LINE =
  /annotated books from your library|your notes and highlights|most recently accessed|last accessed on|^settings$|read\.amazon\.com/i;

function isMetadataLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^(yellow|blue|pink|orange|green|purple|red)\s+highlight\b/i.test(t))
    return true;
  if (/\blocation\s+[\d,]+(-[\d,]+)?\b/i.test(t) && t.length < 200) return true;
  if (/\bpage\s+\d+\b/i.test(t) && /\badded on\b/i.test(t)) return true;
  if (/^(note|your note)\s*[-–—|:]/i.test(t)) return true;
  if (/^·\s*location\b/i.test(t)) return true;
  if (
    (t.includes("|") || t.includes("·")) &&
    /\b(location|page|added on)\b/i.test(t) &&
    t.length < 250
  )
    return true;
  return false;
}

function isBookStatsLine(line: string): boolean {
  return /^\d+\s+highlights?\s*\|\s*\d+\s+notes?/i.test(line.trim());
}

function isChromeLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (SKIP_LINE.test(t)) return true;
  if (CHROME_LINE.test(t)) return true;
  if (/^https?:\/\//i.test(t)) return true;
  return false;
}

function looksLikeAuthor(line: string): boolean {
  const t = line.trim();
  if (t.length < 2 || t.length > 120) return false;
  if (isMetadataLine(t) || isChromeLine(t)) return false;
  if (/^by:?\s+/i.test(t)) return true;
  if (/^[A-Z][\w'.-]+,\s+[A-Z]/.test(t)) return true;
  if (/^[A-Z][\w'.-]+(\s+[A-Z][\w'.-]+){0,4}$/.test(t)) return true;
  return false;
}

function normalizeAuthor(line: string): string {
  return line.replace(/^by:?\s+/i, "").trim();
}

function parseTitleAuthorLine(line: string): { title: string; author: string } | null {
  const m = line.trim().match(/^(.+?)\s+By:\s*(.+)$/i);
  if (!m) return null;
  const title = m[1]!.trim();
  const auth = m[2]!.trim();
  if (title.length < 2 || title.length > 250 || auth.length < 2) return null;
  if (CHROME_LINE.test(title) || CHROME_LINE.test(auth)) return null;
  return { title, author: auth };
}

function cleanQuoteText(text: string): string {
  let t = text.trim();
  t = t.replace(/^[\s"'«»“”]+|[\s"'«»“”]+$/g, "");
  return t.trim();
}

function isValidQuote(text: string): boolean {
  const t = cleanQuoteText(text);
  if (t.length < 12) return false;
  if (CHROME_LINE.test(t)) return false;
  if ((t.match(/\s+By:\s+/gi) ?? []).length > 1) return false;
  if (/annotated books|your notes and highlights/i.test(t)) return false;
  if (/^\d+\s+highlights?\s*\|/i.test(t)) return false;
  if (isMetadataLine(t)) return false;
  return true;
}

function applyStatsBookContext(lines: string[], statsIndex: number): {
  title: string;
  author: string;
} | null {
  for (let j = statsIndex - 1; j >= Math.max(0, statsIndex - 4); j--) {
    const prev = lines[j]?.trim() ?? "";
    if (!prev || isChromeLine(prev)) continue;
    const inline = parseTitleAuthorLine(prev);
    if (inline) return inline;
    if (/^by:?\s+/i.test(prev)) {
      const titleLine = lines[j - 1]?.trim() ?? "";
      if (titleLine && !isChromeLine(titleLine) && !isBookStatsLine(titleLine)) {
        return { title: titleLine, author: normalizeAuthor(prev) };
      }
    }
  }
  return null;
}

function findActiveBookFromPaste(lines: string[]): { title: string; author: string } | null {
  for (let i = 0; i < lines.length; i++) {
    if (!isBookStatsLine(lines[i] ?? "")) continue;
    const ctx = applyStatsBookContext(lines, i);
    if (ctx) return ctx;
  }
  for (let i = lines.length - 2; i >= 0; i--) {
    const titleLine = lines[i]?.trim() ?? "";
    const authorLine = lines[i + 1]?.trim() ?? "";
    if (
      titleLine &&
      /^by:?\s+/i.test(authorLine) &&
      !isChromeLine(titleLine) &&
      titleLine.length < 200
    ) {
      return { title: titleLine, author: normalizeAuthor(authorLine) };
    }
  }
  let last: { title: string; author: string } | null = null;
  for (const line of lines) {
    const inline = parseTitleAuthorLine(line.trim());
    if (inline) last = inline;
  }
  return last;
}

function parseParagraphFallback(
  raw: string,
  book: { title: string; author: string | null },
): ParsedQuote[] {
  return raw
    .split(/\n{2,}/)
    .map((block) => cleanQuoteText(block))
    .filter(isValidQuote)
    .map((text, i) => ({
      id: `${i}-${text.slice(0, 32).replace(/\W/g, "_")}`,
      bookTitle: book.title,
      author: book.author,
      text,
    }));
}

/**
 * Parses raw text copied from read.amazon.com/notebook into quote cards.
 */
export function parseKindleNotebook(raw: string): ParsedQuote[] {
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return [];

  const lines = normalized.split("\n");
  const hasMetadata = lines.some((l) => isMetadataLine(l.trim()));

  const activeBook = findActiveBookFromPaste(lines);
  let bookTitle = activeBook?.title ?? "Unknown Book";
  let author: string | null = activeBook?.author ?? null;

  const quotes: ParsedQuote[] = [];
  let buffer: string[] = [];

  const makeId = (text: string) =>
    `${quotes.length}-${text.slice(0, 32).replace(/\W/g, "_")}`;

  const setBook = (title: string, auth?: string | null) => {
    if (title) bookTitle = title;
    if (auth !== undefined) author = auth;
  };

  const discardBuffer = () => {
    buffer = [];
  };

  const flushHighlight = () => {
    const text = cleanQuoteText(buffer.join("\n"));
    buffer = [];
    if (!isValidQuote(text)) return;
    quotes.push({ id: makeId(text), bookTitle, author, text });
  };

  const tryApplyBookHeader = (line: string): boolean => {
    const inline = parseTitleAuthorLine(line);
    if (inline) {
      discardBuffer();
      setBook(inline.title, inline.author);
      return true;
    }
    if (/^by:?\s+/i.test(line) && buffer.length === 1) {
      setBook(buffer[0]!.trim(), normalizeAuthor(line));
      discardBuffer();
      return true;
    }
    return false;
  };

  const tryConsumeBufferAsBookHeader = (): boolean => {
    if (buffer.length !== 2) return false;
    const [a, b] = buffer.map((l) => l.trim());
    if (a && b && looksLikeAuthor(b) && a.length <= 200 && !isMetadataLine(a)) {
      setBook(a, normalizeAuthor(b));
      discardBuffer();
      return true;
    }
    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();

    if (isChromeLine(line)) continue;

    if (isBookStatsLine(line)) {
      const ctx = applyStatsBookContext(lines, i);
      if (ctx) setBook(ctx.title, ctx.author);
      flushHighlight();
      continue;
    }

    if (tryApplyBookHeader(line)) continue;

    if (isMetadataLine(line)) {
      flushHighlight();
      continue;
    }

    if (/^by:?\s+/i.test(line) && line.length < 120) {
      if (buffer.length === 1) {
        setBook(buffer[0]!.trim(), normalizeAuthor(line));
        buffer = [];
        continue;
      }
      author = normalizeAuthor(line);
      continue;
    }

    if (!line) {
      if (!hasMetadata && buffer.length) flushHighlight();
      continue;
    }

    buffer.push(lines[i]!.trimEnd());

    if (tryConsumeBufferAsBookHeader()) continue;

    const single = buffer.length === 1 ? buffer[0]!.trim() : "";
    if (single && parseTitleAuthorLine(single)) {
      const parsed = parseTitleAuthorLine(single)!;
      buffer = [];
      setBook(parsed.title, parsed.author);
      continue;
    }

    if (hasMetadata && i + 1 < lines.length && isMetadataLine(lines[i + 1]!.trim())) {
      flushHighlight();
    }
  }

  flushHighlight();

  if (quotes.length === 0) {
    const fallbackBook = activeBook ?? { title: bookTitle, author };
    return parseParagraphFallback(normalized, fallbackBook);
  }

  const seen = new Set<string>();
  const deduped = quotes.filter((q) => {
    const key = `${q.bookTitle}::${q.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (deduped.length > 0 && deduped.every((q) => q.bookTitle === "Unknown Book") && activeBook) {
    return deduped.map((q) => ({
      ...q,
      bookTitle: activeBook.title,
      author: activeBook.author,
    }));
  }

  return deduped;
}

