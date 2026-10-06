import { type ReactNode } from "react";
import { t, type Lang } from "../lib/i18n";

export const GUIDE_SKIP_KEY = "shaadisnap_skip_upload_guide";

export function shouldSkipUploadGuide(): boolean {
  try {
    return localStorage.getItem(GUIDE_SKIP_KEY) === "1";
  } catch {
    return false;
  }
}

type Props = {
  lang: Lang;
  dontShow: boolean;
  onDontShowChange: (value: boolean) => void;
};

export function UploadGuide({ lang, dontShow, onDontShowChange }: Props) {
  const strings = t(lang);

  return (
    <section className="animate-fade-up space-y-5">
      <div className="text-center">
        <h2 className="font-display text-xl leading-snug text-amber-50">
          {strings.guideTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-rose-200/75">
          {strings.guideSub}
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300/80">
          {strings.guideDoTitle}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <ExampleCard
            label={strings.guideDoClear}
            tone="good"
            icon={<FaceIcon variant="clear" />}
          />
          <ExampleCard
            label={strings.guideDoStraight}
            tone="good"
            icon={<FaceIcon variant="straight" />}
          />
          <ExampleCard
            label={strings.guideDoLit}
            tone="good"
            icon={<FaceIcon variant="lit" />}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-300/80">
          {strings.guideDontTitle}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <ExampleCard
            label={strings.guideDontSunglasses}
            tone="bad"
            icon={<FaceIcon variant="sunglasses" />}
          />
          <ExampleCard
            label={strings.guideDontSide}
            tone="bad"
            icon={<FaceIcon variant="side" />}
          />
          <ExampleCard
            label={strings.guideDontDark}
            tone="bad"
            icon={<FaceIcon variant="dark" />}
          />
          <ExampleCard
            label={strings.guideDontBusy}
            tone="bad"
            icon={<FaceIcon variant="busy" />}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <input
          type="checkbox"
          checked={dontShow}
          onChange={(e) => onDontShowChange(e.target.checked)}
          className="h-4 w-4 accent-amber-500"
        />
        <span className="text-sm text-rose-100/80">{strings.guideDontShow}</span>
      </label>
    </section>
  );
}

function ExampleCard({
  label,
  tone,
  icon,
}: {
  label: string;
  tone: "good" | "bad";
  icon: ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-2 text-center ${
        tone === "good"
          ? "border-emerald-500/30 bg-emerald-950/30"
          : "border-rose-500/30 bg-rose-950/30"
      }`}
    >
      <div className="mx-auto flex h-16 w-full items-center justify-center rounded-lg bg-black/20">
        {icon}
      </div>
      <p className="mt-1.5 text-[11px] font-medium leading-tight text-rose-50/90">
        {label}
      </p>
      <span
        className={`absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
          tone === "good"
            ? "bg-emerald-500 text-emerald-950"
            : "bg-rose-500 text-rose-50"
        }`}
      >
        {tone === "good" ? "✓" : "✕"}
      </span>
    </div>
  );
}

type FaceVariant =
  | "clear"
  | "straight"
  | "lit"
  | "sunglasses"
  | "side"
  | "dark"
  | "busy";

function FaceIcon({ variant }: { variant: FaceVariant }) {
  const dim =
    variant === "dark" ? "opacity-35" : variant === "busy" ? "opacity-70" : "";

  return (
    <svg
      viewBox="0 0 64 64"
      className={`h-12 w-12 ${dim}`}
      aria-hidden
      fill="none"
    >
      {variant === "busy" && (
        <>
          <rect x="4" y="8" width="14" height="20" rx="2" fill="#78716c" />
          <rect x="46" y="12" width="12" height="28" rx="2" fill="#57534e" />
          <circle cx="14" cy="48" r="6" fill="#a8a29e" />
        </>
      )}

      {variant === "side" ? (
        <>
          <ellipse cx="38" cy="32" rx="14" ry="18" fill="#f5d0c5" />
          <circle cx="44" cy="28" r="2" fill="#44403c" />
          <path
            d="M40 36c2 2 4 2 6 0"
            stroke="#a16207"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle
            cx="32"
            cy="30"
            r="16"
            fill={variant === "lit" ? "#fde8d8" : "#e8b4a0"}
          />
          {variant === "lit" && (
            <circle cx="22" cy="18" r="5" fill="#fef3c7" opacity="0.7" />
          )}
          {variant === "sunglasses" ? (
            <>
              <rect x="20" y="24" width="10" height="7" rx="2" fill="#1c1917" />
              <rect x="34" y="24" width="10" height="7" rx="2" fill="#1c1917" />
              <path d="M30 27.5h4" stroke="#1c1917" strokeWidth="2" />
            </>
          ) : (
            <>
              <circle cx="26" cy="28" r="2" fill="#44403c" />
              <circle cx="38" cy="28" r="2" fill="#44403c" />
            </>
          )}
          <path
            d="M27 36c2.5 2.5 7.5 2.5 10 0"
            stroke="#a16207"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {variant === "straight" && (
            <path
              d="M32 12v4M32 44v4M18 30h-4M50 30h-4"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          )}
        </>
      )}
    </svg>
  );
}
