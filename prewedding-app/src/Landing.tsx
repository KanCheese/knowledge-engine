import { useEffect, useState } from "react";
import { SampleCarousel } from "./components/SampleCarousel";
import { initMetaPixel, trackMetaEvent } from "./lib/metaPixel";
import { readUtmParams } from "./lib/utm";

type Lang = "hi" | "en";

const copy = {
  hi: {
    headline: "AI pre-wedding photo",
    headlineAccent: "real jaisi, ghar baithe",
    tagline: "Photographer se tez · sasta · 5 minute",
    steps: ["Theme", "Upload", "Preview"],
    waitlistHint: "Launch par pehle try karenge",
    phone: "WhatsApp",
    name: "Naam",
    cta: "Waitlist join karein",
    submitting: "Join ho rahe hain...",
    successTitle: "List mein hain! 🎉",
    successSub: "Launch par WhatsApp karenge.",
    errorPhone: "Sahi number daalein",
    errorSubmit: "Dobara try karein",
  },
  en: {
    headline: "AI pre-wedding photos",
    headlineAccent: "realistic, at home",
    tagline: "Faster · cheaper · 5 minutes",
    steps: ["Theme", "Upload", "Preview"],
    waitlistHint: "First access at launch",
    phone: "WhatsApp",
    name: "Name",
    cta: "Join waitlist",
    submitting: "Joining...",
    successTitle: "You're on the list! 🎉",
    successSub: "We'll WhatsApp you at launch.",
    errorPhone: "Enter valid number",
    errorSubmit: "Try again",
  },
};

function isValidIndianPhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""));
}

export default function Landing() {
  const [lang, setLang] = useState<Lang>("hi");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const s = copy[lang];

  useEffect(() => {
    initMetaPixel();
    trackMetaEvent("ViewContent", { content_name: "waitlist_landing" });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleaned = phone.replace(/\D/g, "");
    if (!isValidIndianPhone(cleaned)) {
      setError(s.errorPhone);
      return;
    }

    setLoading(true);
    const payload = {
      phone: cleaned,
      name: name.trim(),
      lang,
      website: honeypot,
      ...readUtmParams(),
      referrer: document.referrer,
      page_url: window.location.href,
      signed_up_at: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok && !import.meta.env.DEV) throw new Error();
      trackMetaEvent("Lead", {
        content_name: "waitlist_signup",
        utm_source: payload.utm_source,
        utm_campaign: payload.utm_campaign,
      });
      setDone(true);
    } catch {
      if (import.meta.env.DEV) {
        trackMetaEvent("Lead", { content_name: "waitlist_signup_dev" });
        setDone(true);
      } else {
        setError(s.errorSubmit);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-[#140404]">
      {/* Header */}
      <header className="safe-top flex items-center justify-between px-5 pt-5 pb-1">
        <span className="font-display text-2xl font-bold tracking-tight text-amber-50">
          ShaadiSnap
        </span>
        <button
          type="button"
          onClick={() => setLang(lang === "hi" ? "en" : "hi")}
          className="text-xs font-bold uppercase tracking-widest text-amber-400/80"
        >
          {lang === "hi" ? "EN" : "हिं"}
        </button>
      </header>

      {/* Scrollable content — visual first */}
      <main className="flex-1 overflow-y-auto px-5 pb-52 pt-3">
        <h1 className="font-display text-[2rem] font-bold leading-[1.1] tracking-tight text-amber-50">
          {s.headline}
          <span className="block text-amber-400">{s.headlineAccent}</span>
        </h1>

        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.15em] text-rose-300/50">
          {s.tagline}
        </p>

        <SampleCarousel lang={lang} />

        {/* Process — icon strip, minimal */}
        <div className="mt-2 flex justify-center gap-6">
          {s.steps.map((step, i) => (
            <div key={step} className="flex flex-col items-center gap-1.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/30 font-display text-sm font-bold text-amber-300">
                {i + 1}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-200/40">
                {step}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center font-display text-sm italic text-rose-200/35">
          {s.waitlistHint}
        </p>
      </main>

      {/* Fixed bottom — form lives here */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md border-t border-white/10 bg-[#140404]/95 px-5 py-4 backdrop-blur-lg">
        {done ? (
          <div className="py-2 text-center">
            <p className="font-display text-lg font-bold text-green-300">
              {s.successTitle}
            </p>
            <p className="mt-1 text-sm text-green-200/60">{s.successSub}</p>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={`${s.phone} · 98XXX XXXXX`}
                className="min-w-0 flex-[3] rounded-xl border border-white/10 bg-white/5 px-3 py-3.5 font-semibold text-rose-50 placeholder:text-rose-300/25 outline-none focus:border-amber-500/50"
                maxLength={14}
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={s.name}
                className="min-w-0 flex-[2] rounded-xl border border-white/10 bg-white/5 px-3 py-3.5 text-sm text-rose-50 placeholder:text-rose-300/25 outline-none focus:border-amber-500/50"
              />
            </div>

            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="absolute left-[-9999px] opacity-0"
              aria-hidden="true"
            />

            {error && (
              <p className="text-center text-xs font-semibold text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 font-display text-base font-bold tracking-wide text-amber-950 disabled:opacity-50"
            >
              {loading ? s.submitting : `${s.cta} →`}
            </button>
          </form>
        )}
      </footer>
    </div>
  );
}
