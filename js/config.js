/**
 * Runtime config (Minimal, no secrets)
 * - Keep API_BASE configurable to avoid hard-coding environments.
 */
window.__APP_CONFIG__ = {
  API_BASE: "", // e.g. "http://YOUR_PUBLIC_API_HOST" or "https://api.your-domain.com"
  FLAGS: {
    ENABLE_DARKMODE_PLACEHOLDER: true
  }
};
