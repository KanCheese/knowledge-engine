import { useEffect, useMemo, useState } from "react";
import {
  detectTimezone,
  fetchEmailStats,
  loadEmailSubscription,
  subscribeDailyEmail,
  syncLibrary,
  type EmailStats,
} from "./lib/emailApi";
import { parseKindleNotebook } from "./lib/kindleParser";
import {
  getTotalSaved,
  loadLibrary,
  mergeIntoLibrary,
  type StoredQuote,
} from "./lib/quoteLibrary";

function SearchIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
  );
}

export default function App() {
  const [rawInput, setRawInput] = useState("");
  const [pasteQuotes, setPasteQuotes] = useState<StoredQuote[] | null>(null);
  const [totalSaved, setTotalSaved] = useState(getTotalSaved);
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState(() => loadEmailSubscription()?.email ?? "");
  const [timezone] = useState(detectTimezone);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);

  const subscription = loadEmailSubscription();

  useEffect(() => {
    setTotalSaved(getTotalSaved());
  }, [pasteQuotes]);

  useEffect(() => {
    if (!subscription?.email) {
      setEmailStats(null);
      return;
    }
    void fetchEmailStats(subscription.email).then(setEmailStats);
  }, [subscription?.email, pasteQuotes]);

  const filtered = useMemo(() => {
    if (!pasteQuotes) return [];
    const q = search.trim().toLowerCase();
    if (!q) return pasteQuotes;
    return pasteQuotes.filter(
      (item) =>
        item.text.toLowerCase().includes(q) ||
        item.bookTitle.toLowerCase().includes(q) ||
        (item.author?.toLowerCase().includes(q) ?? false),
    );
  }, [pasteQuotes, search]);

  const handleParse = async () => {
    const parsed = parseKindleNotebook(rawInput);
    const { newQuotes, totalSaved: total } = mergeIntoLibrary(parsed);
    setPasteQuotes(newQuotes);
    setTotalSaved(total);
    setSearch("");

    const sub = loadEmailSubscription();
    if (sub?.email) {
      syncLibrary(sub.email, loadLibrary()).catch(() => {});
    }
  };

  const handleReset = () => {
    setPasteQuotes(null);
    setSearch("");
  };

  const handleSubscribe = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailStatus("Enter a valid email address.");
      return;
    }
    setEmailLoading(true);
    setEmailStatus(null);
    const result = await subscribeDailyEmail(trimmed, timezone);
    setEmailLoading(false);
    setEmailStatus(result.message);
    if (result.ok) {
      syncLibrary(trimmed, loadLibrary()).catch(() => {});
      void fetchEmailStats(trimmed).then(setEmailStats);
    }
  };

  const showDashboard = pasteQuotes !== null;

  const emailStatsLabel = emailStats
    ? `${emailStats.sentThisMonth} email${emailStats.sentThisMonth === 1 ? "" : "s"} sent this month`
    : subscription
      ? "Email stats after deploy"
      : null;

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="relative mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
            Knowledge Engine
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Kindle highlights → daily quotes
          </h1>
          <p className="mt-2 max-w-lg text-sm text-[var(--color-muted)]">
            Paste from your notebook. New quotes are saved locally and can be emailed each morning at 8:00 AM.
          </p>
        </header>

        {!showDashboard ? (
          <section className="space-y-8">
            <label
              htmlFor="kindle-paste"
              className="flex min-h-[280px] cursor-text flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)]"
            >
              <div className="border-b border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-muted)]">
                Paste Kindle Notebook text
              </div>
              <textarea
                id="kindle-paste"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && rawInput.trim()) {
                    e.preventDefault();
                    void handleParse();
                  }
                }}
                placeholder="Cmd+A on read.amazon.com/notebook, Cmd+C, paste here…"
                className="min-h-[220px] flex-1 resize-y bg-transparent px-4 py-4 text-sm leading-relaxed text-white placeholder:text-[var(--color-muted)]/50 focus:outline-none"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[var(--color-muted)]">
                {totalSaved > 0 ? `${totalSaved} quotes saved · ` : ""}
                ⌘ Enter to parse
              </p>
              <button
                type="button"
                onClick={() => void handleParse()}
                disabled={!rawInput.trim()}
                className="rounded-lg bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-[#0c0d10] disabled:opacity-40"
              >
                Parse highlights
              </button>
            </div>

            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
              <h2 className="text-sm font-semibold text-white">Daily email · 8:00 AM</h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                One quote from your library, every morning ({timezone}).
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-white placeholder:text-[var(--color-muted)]/50 focus:border-[var(--color-accent)]/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => void handleSubscribe()}
                  disabled={emailLoading}
                  className="rounded-lg border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-white hover:border-[var(--color-accent)]/50 disabled:opacity-50"
                >
                  {subscription ? "Update subscription" : "Subscribe"}
                </button>
              </div>
              {emailStatus && (
                <p className={`mt-3 text-xs ${emailStatus.includes("8:00") || emailStatus.includes("Subscribed") ? "text-emerald-400" : "text-amber-400"}`}>
                  {emailStatus}
                </p>
              )}
              {emailStatsLabel && (
                <p className="mt-3 text-xs text-[var(--color-muted)]">
                  {emailStatsLabel}
                  {emailStats?.available && (
                    <span className="text-[var(--color-muted)]/60">
                      {" "}
                      · {emailStats.limit - emailStats.sentThisMonth} left on free tier
                    </span>
                  )}
                </p>
              )}
              <p className="mt-2 text-xs text-[var(--color-muted)]/70">
                Requires deploy with Resend + Vercel KV. Quotes sync when you subscribe.
              </p>
            </div>
          </section>
        ) : (
          <section>
            {subscription && emailStatsLabel && (
              <p className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-muted)]">
                <span className="font-semibold text-white">{emailStatsLabel}</span>
                {emailStats?.available && emailStats.sentThisMonth > 0 && (
                  <span className="ml-1 text-xs">
                    ({Math.round((emailStats.sentThisMonth / emailStats.limit) * 100)}% of free monthly limit)
                  </span>
                )}
              </p>
            )}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search this paste…"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-[var(--color-muted)]/60 focus:border-[var(--color-accent)]/50 focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[var(--color-accent)]/15 px-4 py-2 text-sm font-semibold text-[var(--color-accent)]">
                  {totalSaved} saved
                </span>
                {subscription && emailStats?.available && (
                  <span className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)]">
                    {emailStats.sentThisMonth} emailed this month
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] hover:text-white"
                >
                  Paste again
                </button>
              </div>
            </div>

            {pasteQuotes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--color-border)] py-16 text-center">
                <p className="text-sm text-[var(--color-muted)]">
                  No new quotes — {totalSaved} already saved.
                </p>
                <p className="mt-2 text-xs text-[var(--color-muted)]/70">
                  Re-pasting the same highlights won&apos;t create duplicate cards.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--color-border)] py-16 text-center">
                <p className="text-sm text-[var(--color-muted)]">No quotes match your search.</p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-xs text-[var(--color-muted)]">
                  {pasteQuotes.length} new this paste
                  {search.trim() ? ` · showing ${filtered.length}` : ""}
                </p>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {filtered.map((quote) => (
                    <li
                      key={quote.id}
                      className="flex flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5"
                    >
                      <blockquote className="flex-1 text-sm leading-relaxed text-white/95">
                        {/^["'“‘«]/.test(quote.text) ? quote.text : `“${quote.text}”`}
                      </blockquote>
                      <footer className="mt-4 border-t border-[var(--color-border)]/60 pt-3">
                        <p className="text-xs font-semibold text-white">{quote.bookTitle}</p>
                        {quote.author && (
                          <p className="mt-0.5 text-xs text-[var(--color-muted)]">{quote.author}</p>
                        )}
                      </footer>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
