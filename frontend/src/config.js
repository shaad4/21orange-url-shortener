export const SHORTENER_URL = import.meta.env.VITE_SHORTENER_URL;
export const STATS_URL = import.meta.env.VITE_STATS_URL;
export const QR_URL = import.meta.env.VITE_QR_URL;

if (!SHORTENER_URL || !STATS_URL || !QR_URL) {
  console.error("Missing required environment variables VITE_SHORTENER_URL, VITE_STATS_URL, or VITE_QR_URL.");
}
