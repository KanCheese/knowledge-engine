import { useCallback, useEffect, useState } from "react";
import { sampleSlides } from "../lib/sampleImages";
import { SampleCard } from "./SampleCard";

type SampleCarouselProps = {
  lang: "hi" | "en";
};

export function SampleCarousel({ lang }: SampleCarouselProps) {
  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const count = sampleSlides.length;

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const timer = setInterval(() => go(1), 5000);
    return () => clearInterval(timer);
  }, [go]);

  const current = sampleSlides[index];

  return (
    <section className="relative -mx-1 w-full py-4">
      <div
        className="flex min-h-[380px] items-center justify-center"
        onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStart === null) return;
          const diff = touchStart - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 40) go(diff > 0 ? 1 : -1);
          setTouchStart(null);
        }}
      >
        <button
          type="button"
          onClick={() => go(-1)}
          className="absolute left-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-xl text-white backdrop-blur-sm"
          aria-label="Previous"
        >
          ‹
        </button>

        <SampleCard
          image={current.image}
          label={lang === "hi" ? current.labelHi : current.labelEn}
          scene={lang === "hi" ? current.sceneHi : current.sceneEn}
        />

        <button
          type="button"
          onClick={() => go(1)}
          className="absolute right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-xl text-white backdrop-blur-sm"
          aria-label="Next"
        >
          ›
        </button>
      </div>

      <div className="mt-5 flex justify-center gap-1.5">
        {sampleSlides.map((slide, i) => (
          <button
            key={slide.image}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-8 bg-amber-400" : "w-1.5 bg-white/25"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
