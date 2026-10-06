import { useEffect, useState } from "react";
import { initMetaPixel, trackMetaEvent } from "./lib/metaPixel";
import { readUtmParams } from "./lib/utm";

type Lang = "hi" | "en";

const copy = {
  hi: {
    badge: "Sirf 1 free preview — jald launch",
    headline: "Ghar baithe pre-wedding photo",
    sub: "Apni photo upload karein, sundar Save the Date design paayein — naam aur date ke saath.",
    price: "₹299/saal · No coins · Hindi app",
    phone: "WhatsApp number",
    phoneHint: "10-digit mobile number",
    name: "Naam (optional)",
    cta: "Waitlist mein join karein →",
    submitting: "Join ho rahe hain...",
    successTitle: "Aap waitlist par hain! 🎉",
    successSub:
      "Launch hote hi aapko pehle message milega. Free preview ka 1 mauka reserved hai.",
    errorPhone: "Sahi 10-digit mobile number daalein",
    errorSubmit: "Kuch problem aayi. Dobara try karein.",
    trust: "500+ couples already waiting",
    previewLabel: "Preview — chehra clear, baaki blurred",
  },
  en: {
    badge: "Only 1 free preview — launching soon",
    headline: "Pre-wedding photos at home",
    sub: "Upload your photos, get a beautiful Save the Date design — with names and date.",
    price: "₹299/year · No coins · Hindi app",
    phone: "WhatsApp number",
    phoneHint: "10-digit mobile number",
    name: "Name (optional)",
    cta: "Join the waitlist →",
    submitting: "Joining...",
    successTitle: "You're on the waitlist! 🎉",
    successSub:
      "We'll message you first at launch. Your 1 free preview spot is reserved.",
    errorPhone: "Enter a valid 10-digit mobile number",
    errorSubmit: "Something went wrong. Please try again.",
    trust: "500+ couples already waiting",
    previewLabel: "Preview — face clear, rest blurred",
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

  const strings = copy[lang];

  useEffect(() => {
    initMetaPixel();
    trackMetaEvent("ViewContent", { content_name: "waitlist_landing" });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleaned = phone.replace(/\D/g, "");
    if (!isValidIndianPhone(cleaned)) {
      setError(strings.errorPhone);
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

      if (!res.ok && !import.meta.env.DEV) {
        throw new Error("submit failed");
      }

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
        setError(strings.errorSubmit);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-gradient-to-b from-[#1a0505] via-[#2d0a0a] to-[#1a0505]">
      <header className="safe-top flex items-center justify-between px-4 pb-2 pt-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-amber-100">
            ShaadiSnap
          </h1>
          <p className="text-sm text-rose-200/70">
            {lang === "hi" ? "Ghar baithe pre-wedding photo" : "Pre-wedding at home"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLang(lang === "hi" ? "en" : "hi")}
          className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200"
        >
          {lang === "hi" ? "EN" : "हिं"}
        </button>
      </header>

      <main className="flex flex-1 flex-col px-4 pb-8 pt-2">
        <div className="animate-fade-up mb-4 inline-flex self-center rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-200">
          {strings.badge}
        </div>

        <h2 className="animate-fade-up font-display text-3xl font-bold leading-tight text-amber-50">
          {strings.headline}
        </h2>
        <p className="mt-3 animate-fade-up text-base text-rose-200/80">
          {strings.sub}
        </p>
        <p className="mt-2 animate-fade-up text-sm font-semibold text-amber-300/90">
          {strings.price}
        </p>

        <div className="relative mx-auto my-6 w-full max-w-[260px] animate-fade-up">
          <div
            className="relative aspect-[9/16] overflow-hidden rounded-2xl shadow-2xl shadow-black/50"
            style={{
              background:
                "linear-gradient(160deg, #450a0a 0%, #7f1d1d 45%, #b45309 100%)",
            }}
          >
            <div className="absolute inset-0 backdrop-blur-md" />
            <div
              className="absolute left-[18%] top-[28%] h-[22%] w-[28%] overflow-hidden rounded-full border-4 border-amber-400/80 bg-rose-900/40"
              style={{ filter: "none" }}
            >
              <div className="h-full w-full bg-gradient-to-br from-rose-300/30 to-amber-600/20" />
            </div>
            <div
              className="absolute right-[18%] top-[28%] h-[22%] w-[28%] overflow-hidden rounded-full border-4 border-amber-400/80 bg-rose-900/40"
            >
              <div className="h-full w-full bg-gradient-to-br from-rose-300/30 to-amber-600/20" />
            </div>
            <p className="absolute bottom-8 left-0 right-0 text-center text-[10px] font-semibold uppercase tracking-wider text-white/50">
              {strings.previewLabel}
            </p>
            <p
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-25deg] text-4xl font-bold text-white/20"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              PREVIEW
            </p>
          </div>
        </div>

        {done ? (
          <div className="animate-fade-up rounded-2xl border border-green-500/30 bg-green-900/20 p-6 text-center">
            <h3 className="font-display text-xl font-bold text-green-100">
              {strings.successTitle}
            </h3>
            <p className="mt-2 text-sm text-green-200/80">{strings.successSub}</p>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="animate-fade-up space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-amber-100">
                {strings.phone}
              </span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={strings.phoneHint}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-lg text-rose-50 placeholder:text-rose-300/30 outline-none focus:border-amber-500/60"
                maxLength={14}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-amber-100">
                {strings.name}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul & Priya"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-rose-50 placeholder:text-rose-300/30 outline-none focus:border-amber-500/60"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-red-900/40 px-3 py-2 text-center text-sm text-red-200">
                {error}
              </p>
            )}

            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
              aria-hidden="true"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-base font-bold text-amber-950 disabled:opacity-50"
            >
              {loading ? strings.submitting : strings.cta}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-rose-300/40">{strings.trust}</p>
      </main>
    </div>
  );
}
