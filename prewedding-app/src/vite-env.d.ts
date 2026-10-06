/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAYMENT_MONTHLY_URL: string;
  readonly VITE_PAYMENT_ANNUAL_URL: string;
  readonly VITE_META_PIXEL_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
