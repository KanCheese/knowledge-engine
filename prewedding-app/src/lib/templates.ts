export type TemplateId =
  | "royal-maroon"
  | "goa-sunset"
  | "palace-gold"
  | "cinematic"
  | "traditional-red"
  | "save-the-date";

export type Template = {
  id: TemplateId;
  nameHi: string;
  nameEn: string;
  bg: string;
  accent: string;
  textLight: string;
  overlay: string;
};

export const templates: Template[] = [
  {
    id: "royal-maroon",
    nameHi: "Royal Shaadi",
    nameEn: "Royal Wedding",
    bg: "linear-gradient(160deg, #450a0a 0%, #7f1d1d 45%, #b45309 100%)",
    accent: "#fbbf24",
    textLight: "#fef3c7",
    overlay: "radial-gradient(circle at 50% 30%, rgba(251,191,36,0.15), transparent 60%)",
  },
  {
    id: "goa-sunset",
    nameHi: "Beach Pre-Wedding",
    nameEn: "Beach Sunset",
    bg: "linear-gradient(180deg, #1e3a5f 0%, #f97316 55%, #fdba74 100%)",
    accent: "#fff7ed",
    textLight: "#ffffff",
    overlay: "radial-gradient(ellipse at 50% 80%, rgba(255,255,255,0.2), transparent 50%)",
  },
  {
    id: "palace-gold",
    nameHi: "Mahal Look",
    nameEn: "Palace Gold",
    bg: "linear-gradient(145deg, #292524 0%, #78350f 50%, #eab308 100%)",
    accent: "#fde68a",
    textLight: "#fffbeb",
    overlay: "radial-gradient(circle at 50% 20%, rgba(253,230,138,0.2), transparent 55%)",
  },
  {
    id: "cinematic",
    nameHi: "Film Jaisa",
    nameEn: "Cinematic",
    bg: "linear-gradient(200deg, #0f172a 0%, #334155 40%, #64748b 100%)",
    accent: "#e2e8f0",
    textLight: "#f8fafc",
    overlay: "linear-gradient(to top, rgba(0,0,0,0.5), transparent 40%)",
  },
  {
    id: "traditional-red",
    nameHi: "Traditional Laal",
    nameEn: "Traditional Red",
    bg: "linear-gradient(170deg, #7f1d1d 0%, #dc2626 50%, #991b1b 100%)",
    accent: "#fcd34d",
    textLight: "#fef2f2",
    overlay: "radial-gradient(circle at 30% 40%, rgba(252,211,77,0.12), transparent 50%)",
  },
  {
    id: "save-the-date",
    nameHi: "Save the Date",
    nameEn: "Save the Date",
    bg: "linear-gradient(180deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)",
    accent: "#9d174d",
    textLight: "#831843",
    overlay: "none",
  },
];

export function getTemplate(id: TemplateId): Template {
  return templates.find((t) => t.id === id) ?? templates[0];
}
