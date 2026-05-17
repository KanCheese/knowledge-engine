/** Run: node scripts/verify-parser.mjs (uses inline parser mirror) */

const SAMPLE_CLASSIC = `Atomic Habits
James Clear

You do not rise to the level of your goals. You fall to the level of your systems.
Yellow highlight | Location 123-456 | Added on Monday, January 15, 2024

Every action you take is a vote for the type of person you wish to become.
Yellow highlight | Location 789-790 | Added on Tuesday, January 16, 2024`;

const SAMPLE_KINDLE_WEB = `Kindle
Your Notes and Highlights
Settings
Annotated books from your library (Most recently accessed shown first)
Anna Karenina: Love, Society, and the Cost of Moral Choice By: Leo Tolstoy
Steppenwolf: A Novel By: Hermann Hesse
Steppenwolf
By: Hermann Hesse
216 Highlights | 0 Notes
Last accessed on Monday, 16 February 2026

One ought to take pride in pain – all pain is a reminder of our exalted rank.
Yellow highlight | Location 100-101 | Added on Wednesday, March 1, 2024

For mad people only
Yellow highlight | Location 200-201 | Added on Thursday, March 2, 2024`;

// Mirror of src/App.tsx parser (keep in sync)
const SKIP_LINE =
  /^(your notebook|kindle notebook|notebook|sign in|menu|search|library|export|share|delete all|show more|show less|back to top|kindle)$/i;
const CHROME_LINE =
  /annotated books from your library|your notes and highlights|most recently accessed|last accessed on|^settings$|read\.amazon\.com/i;

function isMetadataLine(line) {
  const t = line.trim();
  if (!t) return false;
  if (/^(yellow|blue|pink|orange|green|purple|red)\s+highlight\b/i.test(t)) return true;
  if (/\blocation\s+[\d,]+(-[\d,]+)?\b/i.test(t) && t.length < 200) return true;
  if (/\bpage\s+\d+\b/i.test(t) && /\badded on\b/i.test(t)) return true;
  if (/^(note|your note)\s*[-–—|:]/i.test(t)) return true;
  if ((t.includes("|") || t.includes("·")) && /\b(location|page|added on)\b/i.test(t) && t.length < 250) return true;
  return false;
}
function isBookStatsLine(line) { return /^\d+\s+highlights?\s*\|\s*\d+\s+notes?/i.test(line.trim()); }
function isChromeLine(line) {
  const t = line.trim();
  if (!t) return true;
  if (SKIP_LINE.test(t) || CHROME_LINE.test(t) || /^https?:\/\//i.test(t)) return true;
  return false;
}
function looksLikeAuthor(line) {
  const t = line.trim();
  if (t.length < 2 || t.length > 120 || isMetadataLine(t) || isChromeLine(t)) return false;
  if (/^by:?\s+/i.test(t)) return true;
  if (/^[A-Z][\w'.-]+,\s+[A-Z]/.test(t)) return true;
  if (/^[A-Z][\w'.-]+(\s+[A-Z][\w'.-]+){0,4}$/.test(t)) return true;
  return false;
}
function normalizeAuthor(line) { return line.replace(/^by:?\s+/i, "").trim(); }
function parseTitleAuthorLine(line) {
  const m = line.trim().match(/^(.+?)\s+By:\s*(.+)$/i);
  if (!m) return null;
  const title = m[1].trim(), author = m[2].trim();
  if (title.length < 2 || title.length > 250 || author.length < 2) return null;
  if (CHROME_LINE.test(title)) return null;
  return { title, author };
}
function cleanQuoteText(text) {
  return text.trim().replace(/^[\s"'«»“”]+|[\s"'«»“”]+$/g, "").trim();
}
function isValidQuote(text) {
  const t = cleanQuoteText(text);
  if (t.length < 12 || CHROME_LINE.test(t)) return false;
  if ((t.match(/\s+By:\s+/gi) ?? []).length > 1) return false;
  if (/annotated books|your notes and highlights/i.test(t)) return false;
  return !isMetadataLine(t);
}
function applyStatsBookContext(lines, statsIndex) {
  for (let j = statsIndex - 1; j >= Math.max(0, statsIndex - 4); j--) {
    const prev = lines[j]?.trim() ?? "";
    if (!prev || isChromeLine(prev)) continue;
    const inline = parseTitleAuthorLine(prev);
    if (inline) return inline;
    if (/^by:?\s+/i.test(prev)) {
      const titleLine = lines[j - 1]?.trim() ?? "";
      if (titleLine && !isChromeLine(titleLine)) return { title: titleLine, author: normalizeAuthor(prev) };
    }
  }
  return null;
}
function findActiveBookFromPaste(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (!isBookStatsLine(lines[i] ?? "")) continue;
    const ctx = applyStatsBookContext(lines, i);
    if (ctx) return ctx;
  }
  for (let i = lines.length - 2; i >= 0; i--) {
    const titleLine = lines[i]?.trim() ?? "";
    const authorLine = lines[i + 1]?.trim() ?? "";
    if (titleLine && /^by:?\s+/i.test(authorLine) && !isChromeLine(titleLine) && titleLine.length < 200)
      return { title: titleLine, author: normalizeAuthor(authorLine) };
  }
  let last = null;
  for (const line of lines) {
    const inline = parseTitleAuthorLine(line.trim());
    if (inline) last = inline;
  }
  return last;
}
function parseParagraphFallback(raw, book) {
  return raw.split(/\n{2,}/).map(cleanQuoteText).filter(isValidQuote).map((text, i) => ({
    id: `${i}`, bookTitle: book.title, author: book.author, text,
  }));
}
function parseKindleNotebook(raw) {
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return [];
  const lines = normalized.split("\n");
  const hasMetadata = lines.some((l) => isMetadataLine(l.trim()));
  const activeBook = findActiveBookFromPaste(lines);
  let bookTitle = activeBook?.title ?? "Unknown Book";
  let author = activeBook?.author ?? null;
  const quotes = [];
  let buffer = [];
  const makeId = (text) => `${quotes.length}-${text.slice(0, 16)}`;
  const setBook = (title, auth) => { if (title) bookTitle = title; if (auth !== undefined) author = auth; };
  const discardBuffer = () => { buffer = []; };
  const flushHighlight = () => {
    const text = cleanQuoteText(buffer.join("\n"));
    buffer = [];
    if (!isValidQuote(text)) return;
    quotes.push({ id: makeId(text), bookTitle, author, text });
  };
  const tryApplyBookHeader = (line) => {
    const inline = parseTitleAuthorLine(line);
    if (inline) { discardBuffer(); setBook(inline.title, inline.author); return true; }
    if (/^by:?\s+/i.test(line) && buffer.length === 1) {
      setBook(buffer[0].trim(), normalizeAuthor(line)); discardBuffer(); return true;
    }
    return false;
  };
  const tryConsumeBufferAsBookHeader = () => {
    if (buffer.length !== 2) return false;
    const [a, b] = buffer.map((l) => l.trim());
    if (a && b && looksLikeAuthor(b) && a.length <= 200) {
      setBook(a, normalizeAuthor(b)); discardBuffer(); return true;
    }
    return false;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (isChromeLine(line)) continue;
    if (isBookStatsLine(line)) { const ctx = applyStatsBookContext(lines, i); if (ctx) setBook(ctx.title, ctx.author); flushHighlight(); continue; }
    if (tryApplyBookHeader(line)) continue;
    if (isMetadataLine(line)) { flushHighlight(); continue; }
    if (/^by:?\s+/i.test(line) && line.length < 120) {
      if (buffer.length === 1) { setBook(buffer[0].trim(), normalizeAuthor(line)); buffer = []; continue; }
      author = normalizeAuthor(line); continue;
    }
    if (!line) { if (!hasMetadata && buffer.length) flushHighlight(); continue; }
    buffer.push(lines[i].trimEnd());
    if (tryConsumeBufferAsBookHeader()) continue;
    const single = buffer.length === 1 ? buffer[0].trim() : "";
    if (single && parseTitleAuthorLine(single)) { const p = parseTitleAuthorLine(single); buffer = []; setBook(p.title, p.author); continue; }
    if (hasMetadata && i + 1 < lines.length && isMetadataLine(lines[i + 1].trim())) flushHighlight();
  }
  flushHighlight();
  if (quotes.length === 0) return parseParagraphFallback(normalized, activeBook ?? { title: bookTitle, author });
  const seen = new Set();
  const deduped = quotes.filter((q) => { const k = q.text; if (seen.has(k)) return false; seen.add(k); return true; });
  if (deduped.length && deduped.every((q) => q.bookTitle === "Unknown Book") && activeBook)
    return deduped.map((q) => ({ ...q, bookTitle: activeBook.title, author: activeBook.author }));
  return deduped;
}

function assert(name, cond, detail = "") {
  if (!cond) { console.error("FAIL:", name, detail); process.exit(1); }
  console.log("PASS:", name);
}

const classic = parseKindleNotebook(SAMPLE_CLASSIC);
assert("classic count", classic.length === 2);
assert("classic book", classic[0].bookTitle === "Atomic Habits");

const web = parseKindleNotebook(SAMPLE_KINDLE_WEB);
assert("web count", web.length >= 2, web.length);
assert("web book", web.some((q) => q.bookTitle.includes("Steppenwolf")), web[0]?.bookTitle);
assert("web author", web.some((q) => q.author?.includes("Hesse")));
assert("web no chrome", !web.some((q) => /annotated books/i.test(q.text)));

console.log("\nAll parser checks passed.");
