export type Lang = "hi" | "en";

export function placeholderNames(lang: Lang) {
  return lang === "hi"
    ? { groom: "Dulha", bride: "Dulhan" }
    : { groom: "Groom", bride: "Bride" };
}

export const copy = {
  hi: {
    appName: "ShaadiSnap",
    tagline: "Ghar baithe pre-wedding photo",
    stepTemplate: "Style chunein",
    stepPhotos: "Photo upload",
    stepGuide: "Photo tips",
    stepPreview: "Preview",
    stepDetails: "Naam & date",
    stepFinal: "Badhai ho! Photo taiyar hai ✨",
    pickTemplate: "Apni pasand ki theme chunein",
    uploadGroom: "Dulhe ki photo",
    uploadBride: "Dulhan ki photo",
    tapToUpload: "Yahan tap karein",
    groomName: "Dulhe ka naam (optional)",
    brideName: "Dulhan ka naam (optional)",
    weddingDate: "Shaadi ki date (optional)",
    quote: "Message (optional)",
    generate: "Photo banayein →",
    payCta: "Pay karein →",
    generateFinal: "Photo update karein →",
    generating: "Ban raha hai...",
    previewHint:
      "Yeh preview hai. Seedha HD download karein, ya neeche naam & date add karein (optional).",
    previewAddDetails: "Naam & date add karein →",
    download: "HD download",
    share: "WhatsApp par bhejein",
    freeLeft: "Free preview",
    oneShotBanner:
      "⚠️ Sirf 1 free preview — is device par ek hi mauka. Photos sahi se chunein!",
    oneShotUsed:
      "Aapka free preview use ho chuka hai. Pay karein aur app freely use karein!",
    oneShotOnGenerate:
      "Ek baar generate hone ke baad dubara free preview nahi milega.",
    regenLeft: "HD updates baaki",
    regenLimitReached:
      "Aapke saare HD updates use ho chuke hain. Nayi photo ke liye plan renew karein.",
    textChoiceTitle: "Photo mein text chahiye?",
    textChoiceSub:
      "Aapne naam ya date nahi bhari. Kaise download karna chahte hain?",
    textChoiceWithPlaceholders: "Dulha/Dulhan naam ke saath",
    textChoiceWithoutText: "Bina kisi text ke",
    textChoiceCancel: "Ruko, pehle bharte hain",
    paywallTitle: "HD photo download karein",
    paywallSub: "₹49/month — 5 HD updates",
    paywallAnnual: "₹299/saal (best deal)",
    paywallCta: "Abhi shuru karein",
    paywallSkip: "Baad mein",
    watermark: "PREVIEW",
    daysToGo: "din baaki",
    saveTheDate: "Save the Date",
    next: "Aage",
    nextChoosePhotos: "Apni photo chunein →",
    nextAddDetails: "Naam & date bharein →",
    back: "Peeche",
    errorUpload: "Dono photo upload karein",
    errorDate: "Sahi date chunein",
    guideTitle: "Saaf aur seedhi photo = behtar result",
    guideSub:
      "Behtar aur sundar photo ke liye, aisi photo chunein jisme chehra saaf, seedha, aur achhi roshni mein ho.",
    guideDoTitle: "Aisi photo chunein",
    guideDontTitle: "Inse bachhein",
    guideDoClear: "Saaf chehra",
    guideDoStraight: "Seedha face",
    guideDoLit: "Achhi lighting",
    guideDontSunglasses: "Sunglasses",
    guideDontSide: "Side face",
    guideDontDark: "Kam lighting",
    guideDontBusy: "Busy background",
    guideDontShow: "Dobara mat dikhao",
    guideCta: "Samajh gaya →",
  },
  en: {
    appName: "ShaadiSnap",
    tagline: "Pre-wedding photos at home",
    stepTemplate: "Pick style",
    stepPhotos: "Upload photos",
    stepGuide: "Photo tips",
    stepPreview: "Preview",
    stepDetails: "Names & date",
    stepFinal: "Congratulations! Your photo is ready ✨",
    pickTemplate: "Choose your theme",
    uploadGroom: "Groom photo",
    uploadBride: "Bride photo",
    tapToUpload: "Tap to upload",
    groomName: "Groom name (optional)",
    brideName: "Bride name (optional)",
    weddingDate: "Wedding date (optional)",
    quote: "Message (optional)",
    generate: "Create photo →",
    payCta: "Pay →",
    generateFinal: "Update photo →",
    generating: "Creating...",
    previewHint:
      "This is a preview. Download HD now, or optionally add names & date below.",
    previewAddDetails: "Add names & date →",
    download: "Download HD",
    share: "Share on WhatsApp",
    freeLeft: "Free preview",
    oneShotBanner:
      "⚠️ Only 1 free preview — one chance on this device. Choose photos carefully!",
    oneShotUsed:
      "Your free preview is used. Pay and use the app freely!",
    oneShotOnGenerate:
      "Once generated, you won't get another free preview.",
    regenLeft: "HD updates left",
    regenLimitReached:
      "You've used all HD updates. Renew your plan for a new photo.",
    textChoiceTitle: "Include text on photo?",
    textChoiceSub:
      "You didn't add names or date. How would you like to download?",
    textChoiceWithPlaceholders: "With placeholder names (Groom/Bride)",
    textChoiceWithoutText: "Without any text",
    textChoiceCancel: "Wait, let me fill details",
    paywallTitle: "Download HD photo",
    paywallSub: "₹49/month — 5 HD updates",
    paywallAnnual: "₹299/year (best deal)",
    paywallCta: "Start now",
    paywallSkip: "Maybe later",
    watermark: "PREVIEW",
    daysToGo: "days to go",
    saveTheDate: "Save the Date",
    next: "Next",
    nextChoosePhotos: "Choose your photos →",
    nextAddDetails: "Add names & date →",
    back: "Back",
    errorUpload: "Upload both photos",
    errorDate: "Pick a valid date",
    guideTitle: "Clear, front-facing photos work best",
    guideSub:
      "For accurate, beautiful results, pick a photo where your face is clear, facing forward, and well lit.",
    guideDoTitle: "What to pick",
    guideDontTitle: "What to avoid",
    guideDoClear: "Clear face",
    guideDoStraight: "Front-facing",
    guideDoLit: "Good lighting",
    guideDontSunglasses: "Sunglasses",
    guideDontSide: "Side profile",
    guideDontDark: "Poor lighting",
    guideDontBusy: "Busy background",
    guideDontShow: "Don't show again",
    guideCta: "Got it →",
  },
} as const;

export function t(lang: Lang) {
  return copy[lang];
}

export function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  return diff >= 0 ? diff : null;
}

export function formatDate(dateStr: string, lang: Lang): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
