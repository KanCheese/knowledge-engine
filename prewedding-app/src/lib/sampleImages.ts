/** Bollywood-inspired pre-wedding scenes — replace with real AI outputs per theme later */

export type SampleSlide = {
  image: string;
  labelHi: string;
  labelEn: string;
  sceneHi: string;
  sceneEn: string;
};

function pexels(id: number) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=960&h=1280&fit=crop`;
}

export const sampleSlides: SampleSlide[] = [
  {
    image: pexels(32404924),
    labelHi: "Pahadon pe pyaar",
    labelEn: "Love in the hills",
    sceneHi: "⛰️ Manali vibe",
    sceneEn: "⛰️ Mountain top",
  },
  {
    image: pexels(16770401),
    labelHi: "Beach pe walk",
    labelEn: "Beach walk",
    sceneHi: "🏖️ Gokarna · DDLJ feel",
    sceneEn: "🏖️ Gokarna beach",
  },
  {
    image: pexels(28159637),
    labelHi: "Goa sunset",
    labelEn: "Goa sunset",
    sceneHi: "🌊 Sea & sherwani",
    sceneEn: "🌊 Goa by the sea",
  },
  {
    image: pexels(31832621),
    labelHi: "Sheher ki raat",
    labelEn: "City night",
    sceneHi: "🌆 Delhi · filmy lights",
    sceneEn: "🌆 City lights",
  },
  {
    image: pexels(16314538),
    labelHi: "Saath baithe",
    labelEn: "Sitting together",
    sceneHi: "💑 Close & candid",
    sceneEn: "💑 Intimate moment",
  },
  {
    image: pexels(32792654),
    labelHi: "Sunset wala scene",
    labelEn: "Sunset moment",
    sceneHi: "🌅 Nadi ke kinare",
    sceneEn: "🌅 Riverside golden hour",
  },
  {
    image: pexels(37912250),
    labelHi: "Rocky romance",
    labelEn: "Rocky romance",
    sceneHi: "🎬 Poster jaisa shot",
    sceneEn: "🎬 Bollywood poster",
  },
];
