/** Indian mobile: 10 digits, starts with 6–9 */
const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 10);
}

export function isValidIndianPhone(phone: string): boolean {
  return INDIAN_MOBILE.test(normalizePhone(phone));
}

export function phoneError(lang: "hi" | "en", phone: string): string | null {
  const digits = normalizePhone(phone);
  if (digits.length === 0) {
    return lang === "hi" ? "Mobile number daalein" : "Enter your mobile number";
  }
  if (digits.length < 10) {
    return lang === "hi"
      ? `${10 - digits.length} digit aur chahiye`
      : `${10 - digits.length} more digit${10 - digits.length === 1 ? "" : "s"} needed`;
  }
  if (!INDIAN_MOBILE.test(digits)) {
    return lang === "hi"
      ? "10-digit number hona chahiye (6, 7, 8 ya 9 se shuru)"
      : "Must be 10 digits starting with 6, 7, 8, or 9";
  }
  return null;
}
