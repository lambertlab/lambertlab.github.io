/**
 * Runtime config (Minimal, no secrets)
 * - Keep API_BASE configurable to avoid hard-coding environments.
 * - Use local backend automatically when running on localhost.
 */
(function () {
  var currentConfig = window.__APP_CONFIG__ || {};
  var host = (window.location && window.location.hostname) || "";
  var protocol = (window.location && window.location.protocol) || "https:";
  var origin = (window.location && window.location.origin) || "";
  var isLocalHost = host === "localhost" || host === "127.0.0.1";
  var localApiBase = "http://127.0.0.1:8000";
  var configuredApiBase =
    typeof currentConfig.API_BASE === "string" ? currentConfig.API_BASE.trim() : "";
  var globalApiBase =
    typeof window.__LL_API_BASE__ === "string" ? window.__LL_API_BASE__.trim() : "";
  var metaApiBase = "";
  var apiBaseMeta = document.querySelector('meta[name="ll-api-base"]');
  if (apiBaseMeta) {
    metaApiBase = (apiBaseMeta.getAttribute("content") || "").trim();
  }

  // In HTTPS pages default to same-origin API to avoid mixed-content blocking.
  var defaultRemoteApiBase = protocol === "https:" ? origin : "http://18.140.127.154:8000";
  var resolvedApiBase = isLocalHost
    ? localApiBase
    : metaApiBase || globalApiBase || configuredApiBase || defaultRemoteApiBase;

  window.__APP_CONFIG__ = {
    API_BASE: resolvedApiBase,
    STATUS_SUMMARY_PATH: currentConfig.STATUS_SUMMARY_PATH || "/status/summary",
    STATUS_PUBLIC_PATH: currentConfig.STATUS_PUBLIC_PATH || "/status/public",
    HEALTH_PATH: currentConfig.HEALTH_PATH || "/healthz",
    HOME_CONTENT_PATH: currentConfig.HOME_CONTENT_PATH || "/home-content",
    STATUS_CACHE_TTL_MS: currentConfig.STATUS_CACHE_TTL_MS || 300000,
    REQUEST_TIMEOUT_MS: currentConfig.REQUEST_TIMEOUT_MS || 3000,
    RETRY_TIMES: currentConfig.RETRY_TIMES || 1,
    FLAGS: Object.assign(
      {
        ENABLE_DARKMODE_PLACEHOLDER: true
      },
      currentConfig.FLAGS || {}
    )
  };
})();
