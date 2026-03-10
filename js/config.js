/**
 * Runtime config (Minimal, no secrets)
 * - Keep API_BASE configurable to avoid hard-coding environments.
 */
window.__APP_CONFIG__ = {
  API_BASE: "http://18.140.127.154:8000", // e.g. "http://YOUR_PUBLIC_API_HOST" or "https://api.your-domain.com"
  STATUS_SUMMARY_PATH: "/status/summary",
  HEALTH_PATH: "/healthz",
  HOME_CONTENT_PATH: "/home-content",
  STATUS_CACHE_TTL_MS: 300000,
  REQUEST_TIMEOUT_MS: 3000,
  RETRY_TIMES: 1,
  FLAGS: {
    ENABLE_DARKMODE_PLACEHOLDER: true
  }
};
