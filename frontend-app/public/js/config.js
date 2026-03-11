/**
 * Runtime config (Minimal, no secrets)
 * - Keep API_BASE configurable to avoid hard-coding environments.
 * - Use local backend automatically when running on localhost.
 */
(function () {
  var host = (window.location && window.location.hostname) || "";
  var isLocalHost = host === "localhost" || host === "127.0.0.1";
  var localApiBase = "http://127.0.0.1:8000";
  var remoteApiBase = "http://18.140.127.154:8000"; // e.g. "http://YOUR_PUBLIC_API_HOST" or "https://api.your-domain.com"

  window.__APP_CONFIG__ = {
    API_BASE: isLocalHost ? localApiBase : remoteApiBase,
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
})();
