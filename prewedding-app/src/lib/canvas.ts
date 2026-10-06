import type { Template } from "./templates";
import { daysUntil, formatDate, type Lang } from "./i18n";

export type GenerateInput = {
  template: Template;
  groomImage: string;
  brideImage: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  quote: string;
  lang: Lang;
  watermark: boolean;
  includeText: boolean;
  previewBlur: boolean;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const ir = img.width / img.height;
  const r = w / h;
  let sw: number, sh: number, sx: number, sy: number;
  if (ir > r) {
    sh = img.height;
    sw = sh * r;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / r;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPortraitFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number,
  accent: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  drawCover(ctx, img, cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
}

function applyPreviewBlur(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
) {
  const W = canvas.width;
  const H = canvas.height;
  const temp = document.createElement("canvas");
  temp.width = W;
  temp.height = H;
  const tctx = temp.getContext("2d");
  if (!tctx) return;

  tctx.drawImage(canvas, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.filter = "blur(22px)";
  ctx.drawImage(temp, 0, 0);
  ctx.filter = "none";
}

export async function generatePreWeddingPhoto(
  input: GenerateInput,
): Promise<string> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const grad = ctx.createLinearGradient(0, 0, W, H);
  const { template } = input;
  const isLight = template.id === "save-the-date";

  if (template.id === "royal-maroon") {
    grad.addColorStop(0, "#450a0a");
    grad.addColorStop(0.5, "#7f1d1d");
    grad.addColorStop(1, "#b45309");
  } else if (template.id === "goa-sunset") {
    grad.addColorStop(0, "#1e3a5f");
    grad.addColorStop(0.55, "#f97316");
    grad.addColorStop(1, "#fdba74");
  } else if (template.id === "palace-gold") {
    grad.addColorStop(0, "#292524");
    grad.addColorStop(0.5, "#78350f");
    grad.addColorStop(1, "#eab308");
  } else if (template.id === "cinematic") {
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(0.5, "#334155");
    grad.addColorStop(1, "#64748b");
  } else if (template.id === "traditional-red") {
    grad.addColorStop(0, "#7f1d1d");
    grad.addColorStop(0.5, "#dc2626");
    grad.addColorStop(1, "#991b1b");
  } else {
    grad.addColorStop(0, "#fdf2f8");
    grad.addColorStop(0.5, "#fce7f3");
    grad.addColorStop(1, "#fbcfe8");
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  if (!isLight) {
    const glow = ctx.createRadialGradient(W / 2, H * 0.28, 0, W / 2, H * 0.28, W * 0.6);
    glow.addColorStop(0, "rgba(255,255,255,0.12)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  const [groomImg, brideImg] = await Promise.all([
    loadImage(input.groomImage),
    loadImage(input.brideImage),
  ]);

  const groomCx = W * 0.32;
  const groomCy = H * 0.38;
  const brideCx = W * 0.68;
  const brideCy = H * 0.38;
  const faceRadius = 200;

  if (input.includeText) {
    ctx.strokeStyle = template.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(groomCx + 220, groomCy);
    ctx.quadraticCurveTo(W / 2, H * 0.32, brideCx - 220, brideCy);
    ctx.stroke();

    const displayFont = '"Playfair Display", serif';
    const bodyFont = '"Noto Sans Devanagari", sans-serif';

    ctx.textAlign = "center";
    ctx.fillStyle = template.textLight;

    ctx.font = `600 42px ${bodyFont}`;
    ctx.fillText(
      input.lang === "hi" ? "प्री-वेडिंग" : "PRE-WEDDING",
      W / 2,
      H * 0.58,
    );

    ctx.font = `700 72px ${displayFont}`;
    const coupleLine = `${input.groomName}  ♥  ${input.brideName}`;
    ctx.fillText(coupleLine, W / 2, H * 0.64);

    if (input.weddingDate) {
      ctx.font = `500 40px ${bodyFont}`;
      const dateLabel = formatDate(input.weddingDate, input.lang);
      ctx.fillText(dateLabel, W / 2, H * 0.69);

      const days = daysUntil(input.weddingDate);
      if (days !== null) {
        ctx.font = `700 56px ${displayFont}`;
        const daysText =
          input.lang === "hi"
            ? `${days} दिन बाकी`
            : `${days} days to go`;
        ctx.fillStyle = template.accent;
        ctx.fillText(daysText, W / 2, H * 0.745);
        ctx.fillStyle = template.textLight;
      }
    }

    if (input.quote.trim()) {
      ctx.font = `italic 36px ${bodyFont}`;
      ctx.fillText(`"${input.quote.trim()}"`, W / 2, H * 0.79, W * 0.85);
    }

    ctx.font = `600 38px ${displayFont}`;
    ctx.fillStyle = template.accent;
    ctx.fillText("Save the Date", W / 2, H * 0.86);

    roundRect(ctx, W * 0.15, H * 0.89, W * 0.7, 80, 40);
    ctx.fillStyle = isLight ? template.accent : "rgba(255,255,255,0.15)";
    ctx.fill();
    ctx.fillStyle = isLight ? "#fff" : template.textLight;
    ctx.font = `600 32px ${bodyFont}`;
    ctx.fillText("ShaadiSnap", W / 2, H * 0.895 + 28);
  }

  if (input.previewBlur) {
    applyPreviewBlur(canvas, ctx);
  }

  drawPortraitFrame(ctx, groomImg, groomCx, groomCy, faceRadius, template.accent);
  drawPortraitFrame(ctx, brideImg, brideCx, brideCy, faceRadius, template.accent);

  if (input.watermark) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.35);
    ctx.font = `bold 120px "Playfair Display", serif`;
    ctx.fillStyle = isLight ? "#831843" : "#ffffff";
    ctx.fillText("PREVIEW", 0, 0);
    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
