import { useCallback, useMemo, useState } from "react";
import {
  GUIDE_SKIP_KEY,
  shouldSkipUploadGuide,
  UploadGuide,
} from "./components/UploadGuide";
import {
  dataUrlToBlob,
  generatePreWeddingPhoto,
} from "./lib/canvas";
import { formatDate, placeholderNames, t, type Lang } from "./lib/i18n";
import { getTemplate, templates, type TemplateId } from "./lib/templates";

type Step = "template" | "guide" | "photos" | "preview" | "details" | "final";

const FREE_GENERATIONS = 1;
const PAID_REGEN_LIMIT = 5;
const STORAGE_KEY = "shaadisnap_gens";
const REGEN_STORAGE_KEY = "shaadisnap_regens";

function readGenCount(): number {
  try {
    return Number(localStorage.getItem(STORAGE_KEY) ?? "0");
  } catch {
    return 0;
  }
}

function bumpGenCount() {
  try {
    localStorage.setItem(STORAGE_KEY, String(readGenCount() + 1));
  } catch {
    /* ignore */
  }
}

function readRegenCount(): number {
  try {
    return Number(localStorage.getItem(REGEN_STORAGE_KEY) ?? "0");
  } catch {
    return 0;
  }
}

function bumpRegenCount() {
  try {
    localStorage.setItem(REGEN_STORAGE_KEY, String(readRegenCount() + 1));
  } catch {
    /* ignore */
  }
}

type PendingAction = "previewDownload" | "finalize" | null;
type TextIncludeChoice = boolean | null;

const PAYMENT_MONTHLY =
  import.meta.env.VITE_PAYMENT_MONTHLY_URL ?? "https://rzp.io/l/your-monthly-link";
const PAYMENT_ANNUAL =
  import.meta.env.VITE_PAYMENT_ANNUAL_URL ?? "https://rzp.io/l/your-annual-link";

const progressSteps: Exclude<Step, "guide">[] = [
  "template",
  "photos",
  "preview",
  "details",
  "final",
];

export default function App() {
  const [lang, setLang] = useState<Lang>("hi");
  const [step, setStep] = useState<Step>("template");
  const [templateId, setTemplateId] = useState<TemplateId>("royal-maroon");
  const [groomFile, setGroomFile] = useState<string | null>(null);
  const [brideFile, setBrideFile] = useState<string | null>(null);
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [quote, setQuote] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [genCount, setGenCount] = useState(readGenCount);
  const [regenCount, setRegenCount] = useState(readRegenCount);
  const [guideDontShow, setGuideDontShow] = useState(false);
  const [visitedDetails, setVisitedDetails] = useState(false);
  const [showTextChoice, setShowTextChoice] = useState(false);
  const [textIncludeChoice, setTextIncludeChoice] = useState<TextIncludeChoice>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const strings = t(lang);
  const template = useMemo(() => getTemplate(templateId), [templateId]);
  const previewUsed = genCount >= FREE_GENERATIONS;
  const regensRemaining = Math.max(0, PAID_REGEN_LIMIT - regenCount);
  const progressKey: Exclude<Step, "guide"> =
    step === "guide" ? "photos" : step;
  const stepIndex = progressSteps.indexOf(progressKey);

  const onFile = useCallback((file: File, setter: (v: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const generateImage = useCallback(
    async (
      mode: "preview" | "final",
      opts?: { paid?: boolean; includeText?: boolean },
    ) => {
      if (!groomFile || !brideFile) return null;
      const placeholders = placeholderNames(lang);
      const paid = opts?.paid ?? isPaid;
      const watermark = mode === "preview" ? true : !paid;
      const previewBlur = mode === "preview";
      const includeText =
        opts?.includeText ?? (textIncludeChoice !== false);
      const resolvedGroom = groomName.trim() || placeholders.groom;
      const resolvedBride = brideName.trim() || placeholders.bride;

      return generatePreWeddingPhoto({
        template,
        groomImage: groomFile,
        brideImage: brideFile,
        groomName:
          mode === "preview"
            ? placeholders.groom
            : includeText
              ? resolvedGroom
              : "",
        brideName:
          mode === "preview"
            ? placeholders.bride
            : includeText
              ? resolvedBride
              : "",
        weddingDate: mode === "preview" || !includeText ? "" : weddingDate,
        quote: mode === "preview" || !includeText ? "" : quote,
        lang,
        watermark,
        includeText: mode === "preview" ? true : includeText,
        previewBlur,
      });
    },
    [
      groomFile,
      brideFile,
      lang,
      isPaid,
      template,
      groomName,
      brideName,
      weddingDate,
      quote,
      textIncludeChoice,
    ],
  );

  const hasEmptyTextFields =
    !groomName.trim() &&
    !brideName.trim() &&
    !weddingDate &&
    !quote.trim();

  const needsTextChoice = () =>
    hasEmptyTextFields && textIncludeChoice === null;

  const consumeRegenIfNeeded = (isRepeat: boolean) => {
    if (!isRepeat) return true;
    if (readRegenCount() >= PAID_REGEN_LIMIT) return false;
    bumpRegenCount();
    setRegenCount(readRegenCount());
    return true;
  };

  const canNext =
    step === "guide" ||
    step === "preview" ||
    step === "details" ||
    (step === "template" && !!templateId) ||
    (step === "photos" &&
      (previewUsed || (!!groomFile && !!brideFile)));

  const progressLabel = (s: Step) => {
    if (s === "template") return strings.stepTemplate;
    if (s === "guide") return strings.stepGuide;
    if (s === "photos") return strings.stepPhotos;
    if (s === "preview") return strings.stepPreview;
    if (s === "details") return strings.stepDetails;
    return strings.stepFinal;
  };

  const previousStep = (): Step | null => {
    if (step === "guide") return "template";
    if (step === "photos") {
      return shouldSkipUploadGuide() ? "template" : "guide";
    }
    if (step === "preview") return "photos";
    if (step === "details") return "preview";
    if (step === "final") return visitedDetails ? "details" : "preview";
    return null;
  };

  const finalizePhoto = async (opts?: {
    autoDownload?: boolean;
    paid?: boolean;
    includeText?: boolean;
  }) => {
    const isRepeat = !!resultUrl;
    if (isRepeat && !consumeRegenIfNeeded(true)) {
      setError(strings.regenLimitReached);
      return;
    }

    setLoading(true);
    try {
      const url = await generateImage("final", {
        paid: opts?.paid ?? isPaid,
        includeText: opts?.includeText,
      });
      if (!url) return;
      setResultUrl(url);
      setStep("final");
      if (opts?.autoDownload) downloadUrl(url);
    } catch {
      setError("Photo banane mein problem aayi. Dobara try karein.");
    } finally {
      setLoading(false);
    }
  };

  const handleTextChoice = (includeText: boolean) => {
    setTextIncludeChoice(includeText);
    setShowTextChoice(false);
    const action = pendingAction;
    setPendingAction(null);
    if (action === "previewDownload") {
      if (!isPaid) {
        setShowPaywall(true);
        return;
      }
      void finalizePhoto({ autoDownload: true, paid: true, includeText });
    } else if (action === "finalize") {
      void finalizePhoto({ includeText });
    }
  };

  const goNext = async () => {
    setError("");
    if (step === "template") {
      setStep(shouldSkipUploadGuide() ? "photos" : "guide");
    } else if (step === "guide") {
      if (guideDontShow) {
        try {
          localStorage.setItem(GUIDE_SKIP_KEY, "1");
        } catch {
          /* ignore */
        }
      }
      setStep("photos");
    } else if (step === "photos") {
      if (previewUsed) {
        setShowPaywall(true);
        return;
      }
      if (!groomFile || !brideFile) {
        setError(strings.errorUpload);
        return;
      }
      setLoading(true);
      try {
        const url = await generateImage("preview");
        if (!url) return;
        setPreviewUrl(url);
        bumpGenCount();
        setGenCount(readGenCount());
        setStep("preview");
      } catch {
        setError("Photo banane mein problem aayi. Dobara try karein.");
      } finally {
        setLoading(false);
      }
    } else if (step === "preview") {
      setVisitedDetails(true);
      setStep("details");
    } else if (step === "details") {
      if (needsTextChoice()) {
        setPendingAction("finalize");
        setShowTextChoice(true);
        return;
      }
      await finalizePhoto();
    }
  };

  const showBack = step !== "template";

  const goBack = () => {
    setError("");
    if (step === "guide") setStep("template");
    else if (step === "photos") {
      setStep(shouldSkipUploadGuide() ? "template" : "guide");
    } else if (step === "preview") setStep("photos");
    else if (step === "details") setStep("preview");
    else if (step === "final") {
      setStep(visitedDetails ? "details" : "preview");
    }
  };

  const backLabel = (() => {
    const prev = previousStep();
    if (!prev) return strings.back;
    return `← ${progressLabel(prev)}`;
  })();

  const nextLabel = (() => {
    if (step === "template") return strings.nextChoosePhotos;
    if (step === "guide") return strings.guideCta;
    if (step === "photos") return previewUsed ? strings.payCta : strings.generate;
    if (step === "preview") return strings.previewAddDetails;
    if (step === "details") return strings.generateFinal;
    return strings.next;
  })();

  const stepLabel = progressLabel(step === "guide" ? "photos" : step);

  const downloadUrl = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `shaadisnap-${Date.now()}.jpg`;
    a.click();
  };

  const requestDownload = () => {
    if (!isPaid) {
      setShowPaywall(true);
      return;
    }
    if (resultUrl) downloadUrl(resultUrl);
  };

  const requestPreviewDownload = () => {
    if (needsTextChoice()) {
      setPendingAction("previewDownload");
      setShowTextChoice(true);
      return;
    }
    if (!isPaid) {
      setShowPaywall(true);
      return;
    }
    void finalizePhoto({ autoDownload: true, paid: true });
  };

  const shareWhatsApp = () => {
    if (!resultUrl || !isPaid) return;
    const text = encodeURIComponent(
      lang === "hi"
        ? "Meri pre-wedding photo dekho! Tum bhi banao:"
        : "Check out my pre-wedding photo! Create yours:",
    );
    const link = encodeURIComponent(window.location.href);
    window.open(`https://wa.me/?text=${text}%20${link}`, "_blank");
  };

  const regeneratePaid = async () => {
    if (!groomFile || !brideFile) return;
    if (!consumeRegenIfNeeded(true)) {
      setError(strings.regenLimitReached);
      return;
    }
    setLoading(true);
    try {
      const url = await generateImage("final", { paid: true });
      if (url) setResultUrl(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-full min-h-dvh max-w-md flex-col bg-gradient-to-b from-[#1a0505] via-[#2d0a0a] to-[#1a0505]">
      <header className="safe-top flex items-center justify-between px-4 pb-2 pt-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-amber-100">
            {strings.appName}
          </h1>
          <p className="text-sm text-rose-200/70">{strings.tagline}</p>
        </div>
        <button
          type="button"
          onClick={() => setLang(lang === "hi" ? "en" : "hi")}
          className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200"
        >
          {lang === "hi" ? "EN" : "हिं"}
        </button>
      </header>

      <div className="px-4 py-2">
        <div className="flex gap-1">
          {progressSteps.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? "bg-amber-400" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-rose-200/60">{stepLabel}</p>
      </div>

      <main className="flex flex-1 flex-col overflow-y-auto px-4 pb-36 pt-2">
        {step === "guide" && (
          <UploadGuide
            lang={lang}
            dontShow={guideDontShow}
            onDontShowChange={setGuideDontShow}
          />
        )}

        {step === "template" && (
          <section className="animate-fade-up space-y-3">
            {!previewUsed && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {strings.oneShotBanner}
              </div>
            )}
            <h2 className="font-display text-xl text-amber-50">
              {strings.pickTemplate}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setTemplateId(tpl.id)}
                  className={`overflow-hidden rounded-2xl border-2 text-left transition-transform active:scale-[0.98] ${
                    templateId === tpl.id
                      ? "border-amber-400 shadow-lg shadow-amber-900/40"
                      : "border-white/10"
                  }`}
                >
                  <div
                    className="flex h-28 flex-col justify-end p-3"
                    style={{ background: tpl.bg }}
                  >
                    <span className="text-sm font-semibold text-white drop-shadow">
                      {lang === "hi" ? tpl.nameHi : tpl.nameEn}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === "photos" && (
          <section className="animate-fade-up space-y-4">
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {previewUsed ? strings.oneShotUsed : strings.oneShotBanner}
            </div>
            <h2 className="font-display text-xl text-amber-50">
              {strings.stepPhotos}
            </h2>
            <UploadSlot
              label={strings.uploadGroom}
              hint={strings.tapToUpload}
              preview={groomFile}
              onPick={(f) => onFile(f, setGroomFile)}
            />
            <UploadSlot
              label={strings.uploadBride}
              hint={strings.tapToUpload}
              preview={brideFile}
              onPick={(f) => onFile(f, setBrideFile)}
            />
          </section>
        )}

        {step === "preview" && previewUrl && (
          <section className="animate-fade-up flex flex-col items-center gap-4">
            <h2 className="font-display text-xl text-amber-50">
              {strings.stepPreview}
            </h2>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full max-w-[280px] rounded-2xl shadow-2xl shadow-black/50"
            />
            <p className="text-center text-sm text-rose-200/70">
              {strings.previewHint}
            </p>
          </section>
        )}

        {step === "details" && (
          <section className="animate-fade-up space-y-4">
            <h2 className="font-display text-xl text-amber-50">
              {strings.stepDetails}
            </h2>
            <Field
              label={strings.groomName}
              value={groomName}
              onChange={setGroomName}
              placeholder="Rahul"
            />
            <Field
              label={strings.brideName}
              value={brideName}
              onChange={setBrideName}
              placeholder="Priya"
            />
            <Field
              label={strings.weddingDate}
              type="date"
              value={weddingDate}
              onChange={setWeddingDate}
            />
            {weddingDate && (
              <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-100">
                {formatDate(weddingDate, lang)}
              </p>
            )}
            <Field
              label={strings.quote}
              value={quote}
              onChange={setQuote}
              placeholder={
                lang === "hi" ? "Hamari kahani shuru..." : "Our story begins..."
              }
            />
          </section>
        )}

        {step === "final" && resultUrl && (
          <section className="animate-fade-up flex flex-col items-center gap-4">
            <h2 className="font-display text-xl text-amber-50">
              {strings.stepFinal}
            </h2>
            <img
              src={resultUrl}
              alt="Pre-wedding"
              className="w-full max-w-[280px] rounded-2xl shadow-2xl shadow-black/50"
            />
            {isPaid && (
              <>
                <p className="text-center text-xs text-rose-200/60">
                  {strings.regenLeft}: {regensRemaining}/{PAID_REGEN_LIMIT}
                </p>
                <button
                  type="button"
                  onClick={regeneratePaid}
                  disabled={loading || regensRemaining <= 0}
                  className="text-sm text-amber-300 underline disabled:opacity-40"
                >
                  {loading ? strings.generating : "↻ HD regenerate"}
                </button>
              </>
            )}
          </section>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-900/40 px-3 py-2 text-center text-sm text-red-200">
            {error}
          </p>
        )}
      </main>

      <StepFooter
        step={step}
        showBack={showBack}
        backLabel={backLabel}
        onBack={goBack}
        canNext={canNext}
        loading={loading}
        loadingLabel={strings.generating}
        nextLabel={nextLabel}
        onNext={() => void goNext()}
        downloadLabel={strings.download}
        shareLabel={strings.share}
        onPreviewDownload={requestPreviewDownload}
        onDownload={requestDownload}
        onShare={shareWhatsApp}
        isPaid={isPaid}
        hint={
          step === "photos" && !previewUsed
            ? strings.oneShotOnGenerate
            : step === "final" && isPaid
              ? `${strings.regenLeft}: ${regensRemaining}/${PAID_REGEN_LIMIT}`
              : undefined
        }
      />

      {showTextChoice && (
        <TextChoiceModal
          strings={strings}
          onWithPlaceholders={() => handleTextChoice(true)}
          onWithoutText={() => handleTextChoice(false)}
          onCancel={() => {
            setShowTextChoice(false);
            setPendingAction(null);
          }}
        />
      )}

      {showPaywall && (
        <Paywall
          strings={strings}
          onClose={() => setShowPaywall(false)}
          onPaid={() => {
            setIsPaid(true);
            setShowPaywall(false);
            void finalizePhoto({
              autoDownload: true,
              paid: true,
              includeText: textIncludeChoice !== false,
            });
          }}
          monthlyUrl={PAYMENT_MONTHLY}
          annualUrl={PAYMENT_ANNUAL}
        />
      )}
    </div>
  );
}

function StepFooter({
  step,
  showBack,
  backLabel,
  onBack,
  canNext,
  loading,
  loadingLabel,
  nextLabel,
  onNext,
  downloadLabel,
  shareLabel,
  onPreviewDownload,
  onDownload,
  onShare,
  isPaid,
  hint,
}: {
  step: Step;
  showBack: boolean;
  backLabel: string;
  onBack: () => void;
  canNext: boolean;
  loading: boolean;
  loadingLabel: string;
  nextLabel: string;
  onNext: () => void;
  downloadLabel: string;
  shareLabel: string;
  onPreviewDownload: () => void;
  onDownload: () => void;
  onShare: () => void;
  isPaid: boolean;
  hint?: string;
}) {
  const backBtnClass =
    "shrink-0 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-rose-100";
  const primaryBtnClass =
    "flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-bold text-amber-950 disabled:opacity-40";

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md border-t border-white/10 bg-[#1a0505]/95 px-4 py-4 backdrop-blur">
      {step === "final" ? (
        <div className="space-y-3">
          <div className="flex gap-3">
            <button type="button" onClick={onBack} className={backBtnClass}>
              {backLabel}
            </button>
            <button type="button" onClick={onDownload} className={primaryBtnClass}>
              {downloadLabel}
            </button>
          </div>
          {isPaid && (
            <button
              type="button"
              onClick={onShare}
              className="w-full rounded-xl border border-green-500/50 bg-green-600/20 py-3 text-sm font-bold text-green-200"
            >
              {shareLabel}
            </button>
          )}
        </div>
      ) : step === "preview" ? (
        <div className="space-y-3">
          <div className="flex gap-3">
            {showBack && (
              <button type="button" onClick={onBack} className={backBtnClass}>
                {backLabel}
              </button>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={onPreviewDownload}
              className={primaryBtnClass}
            >
              {loading ? (
                <span className="animate-pulse-soft">{loadingLabel}</span>
              ) : (
                downloadLabel
              )}
            </button>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onNext}
            className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 py-3 text-sm font-semibold text-amber-100"
          >
            {nextLabel}
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-3">
            {showBack && (
              <button type="button" onClick={onBack} className={backBtnClass}>
                {backLabel}
              </button>
            )}
            <button
              type="button"
              disabled={!canNext || loading}
              onClick={onNext}
              className={primaryBtnClass}
            >
              {loading ? (
                <span className="animate-pulse-soft">{loadingLabel}</span>
              ) : (
                nextLabel
              )}
            </button>
          </div>
          {hint && (
            <p className="mt-2 text-center text-xs text-rose-300/50">{hint}</p>
          )}
        </>
      )}
    </footer>
  );
}

function UploadSlot({
  label,
  hint,
  preview,
  onPick,
}: {
  label: string;
  hint: string;
  preview: string | null;
  onPick: (f: File) => void;
}) {
  return (
    <label className="block cursor-pointer">
      <span className="mb-2 block text-sm font-semibold text-amber-100">
        {label}
      </span>
      <div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-amber-500/30 bg-white/5">
        {preview ? (
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="text-center text-rose-200/60">
            <div className="text-3xl">📷</div>
            <p className="mt-2 text-sm">{hint}</p>
          </div>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-amber-100">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-rose-50 placeholder:text-rose-300/30 outline-none focus:border-amber-500/60"
      />
    </label>
  );
}

function TextChoiceModal({
  strings,
  onWithPlaceholders,
  onWithoutText,
  onCancel,
}: {
  strings: ReturnType<typeof t>;
  onWithPlaceholders: () => void;
  onWithoutText: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4">
      <div className="animate-fade-up w-full max-w-md rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#3d1010] to-[#1a0505] p-6">
        <h3 className="font-display text-xl font-bold text-amber-100">
          {strings.textChoiceTitle}
        </h3>
        <p className="mt-2 text-sm text-rose-200/70">{strings.textChoiceSub}</p>
        <button
          type="button"
          onClick={onWithPlaceholders}
          className="mt-5 block w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 py-4 text-center text-sm font-bold text-amber-950"
        >
          {strings.textChoiceWithPlaceholders}
        </button>
        <button
          type="button"
          onClick={onWithoutText}
          className="mt-3 block w-full rounded-xl border border-amber-500/40 py-3 text-center text-sm font-semibold text-amber-200"
        >
          {strings.textChoiceWithoutText}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full py-2 text-sm text-rose-300/60"
        >
          {strings.textChoiceCancel}
        </button>
      </div>
    </div>
  );
}

function Paywall({
  strings,
  onClose,
  onPaid,
  monthlyUrl,
  annualUrl,
}: {
  strings: ReturnType<typeof t>;
  onClose: () => void;
  onPaid: () => void;
  monthlyUrl: string;
  annualUrl: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4">
      <div className="animate-fade-up w-full max-w-md rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#3d1010] to-[#1a0505] p-6">
        <h3 className="font-display text-2xl font-bold text-amber-100">
          {strings.paywallTitle}
        </h3>
        <p className="mt-2 text-sm text-rose-200/70">{strings.paywallSub}</p>
        <a
          href={annualUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 block w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 py-4 text-center text-sm font-bold text-amber-950"
        >
          {strings.paywallAnnual}
        </a>
        <a
          href={monthlyUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block w-full rounded-xl border border-amber-500/40 py-3 text-center text-sm font-semibold text-amber-200"
        >
          {strings.paywallSub}
        </a>
        <button
          type="button"
          onClick={onPaid}
          className="mt-3 w-full text-center text-xs text-green-400/80 underline"
        >
          [Dev] Mark as paid
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-rose-300/60"
        >
          {strings.paywallSkip}
        </button>
      </div>
    </div>
  );
}

export { dataUrlToBlob };
