type SampleCardProps = {
  image: string;
  label: string;
  scene: string;
};

export function SampleCard({ image, label, scene }: SampleCardProps) {
  return (
    <div className="relative aspect-[3/4] w-[min(78vw,300px)] shrink-0 overflow-hidden rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.65)] ring-1 ring-amber-500/20">
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="eager"
        decoding="async"
      />
      {/* Warm Bollywood-grade overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a0505] via-[#7f1d1d]/20 to-amber-900/10 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.35)_100%)]" />

      <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300/90">
          {scene}
        </p>
        <p className="mt-1.5 font-display text-[1.35rem] font-bold leading-tight text-white">
          {label}
        </p>
        <p className="mt-2 text-[9px] font-semibold uppercase tracking-widest text-white/35">
          AI · realistic · your photos
        </p>
      </div>
    </div>
  );
}
