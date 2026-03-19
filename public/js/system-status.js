(function () {
  "use strict";

  var root = document.documentElement;
  var systemStatusCacheKey = "system-status-cache-v1";
  var validUiLocales = {
    "zh-CN": true,
    en: true
  };

  function normalizeUiLocale(value) {
    return Object.prototype.hasOwnProperty.call(validUiLocales, value) ? value : "zh-CN";
  }

  function getUiLocale() {
    var htmlLocale = root.getAttribute("data-ui-locale") || root.getAttribute("lang");
    if (Object.prototype.hasOwnProperty.call(validUiLocales, htmlLocale)) {
      return htmlLocale;
    }
    if (window.__LL_UI_LOCALE__ && Object.prototype.hasOwnProperty.call(validUiLocales, window.__LL_UI_LOCALE__)) {
      return window.__LL_UI_LOCALE__;
    }
    return "zh-CN";
  }

  function isEnglishUi() {
    return normalizeUiLocale(getUiLocale()) === "en";
  }

  function getUiText(zhText, enText) {
    return isEnglishUi() ? enText : zhText;
  }

  function getPositiveInteger(value, fallback) {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return fallback;
    }

    if (value < 0) {
      return fallback;
    }

    return Math.floor(value);
  }

  function normalizeApiBase(value) {
    if (typeof value !== "string") {
      return null;
    }

    var trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    try {
      var parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return null;
      }
    } catch (error) {
      return null;
    }

    if (trimmed.endsWith("/")) {
      return trimmed.slice(0, -1);
    }

    return trimmed;
  }

  function normalizeHealthPath(value) {
    if (typeof value !== "string" || !value.trim()) {
      return "/healthz";
    }

    var path = value.trim();
    if (path.charAt(0) !== "/") {
      return "/" + path;
    }

    return path;
  }

  function normalizeApiPath(value, fallback) {
    if (typeof value !== "string" || !value.trim()) {
      return fallback;
    }

    var path = value.trim();
    if (path.charAt(0) !== "/") {
      return "/" + path;
    }

    return path;
  }

  function getStatusElements(rootElement) {

    return {
      badge: rootElement.querySelector("[data-system-status-badge]"),
      title: rootElement.querySelector("[data-system-status-title]"),
      description: rootElement.querySelector("[data-system-status-description]"),
      retry: rootElement.querySelector("[data-system-status-retry]")
    };
  }

  function setSystemStatus(rootElement, state, badgeText, titleText, descriptionText, showRetryButton, snapshot) {
    var elements = getStatusElements(rootElement);
    var statusSummary = titleText;
    if (descriptionText) {
      statusSummary = titleText + (isEnglishUi() ? ": " : "：") + descriptionText;
    }
    rootElement.setAttribute("data-status-state", state);
    rootElement.setAttribute("aria-label", statusSummary);
    rootElement.setAttribute("title", statusSummary);
    rootElement.__llSystemStatusSnapshot = snapshot || null;

    if (elements.badge) {
      elements.badge.textContent = badgeText;
    }
    if (elements.title) {
      elements.title.textContent = titleText;
    }
    if (elements.description) {
      elements.description.textContent = descriptionText;
    }
    if (elements.retry) {
      elements.retry.hidden = !showRetryButton;
    }
  }

  function reapplySystemStatus(statusRoot) {
    if (!statusRoot || !statusRoot.__llSystemStatusSnapshot) {
      return;
    }

    var snapshot = statusRoot.__llSystemStatusSnapshot;
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    if (snapshot.kind === "loading") {
      setSystemStatus(
        statusRoot,
        "loading",
        getUiText("检查中", "Checking"),
        getUiText("功能可用性检查中", "Checking availability"),
        getUiText("正在获取系统健康摘要，请稍候...", "Fetching the latest system health summary."),
        false,
        snapshot
      );
      return;
    }

    if (snapshot.kind === "unconfigured") {
      setSystemStatus(
        statusRoot,
        "unconfigured",
        getUiText("未配置", "Unconfigured"),
        getUiText("功能可用性未配置", "Availability not configured"),
        getUiText("未检测到后端地址配置，请先完成前端运行时配置。", "No backend endpoint is configured yet. Please finish the frontend runtime setup first."),
        false,
        snapshot
      );
      return;
    }

    if (snapshot.kind === "error") {
      var descriptionText = getUiText("当前无法获取系统健康摘要，暂时无法确认功能可用性。", "The latest system health summary is unavailable, so availability cannot be confirmed right now.");
      if (snapshot.reason === "summary-missing") {
        descriptionText = getUiText("后端未提供状态摘要接口，暂时无法确认功能可用性。", "The backend does not expose a status summary endpoint, so availability cannot be confirmed right now.");
      } else if (snapshot.reason === "bad-config") {
        descriptionText = getUiText("状态摘要请求配置异常，暂时无法确认功能可用性。", "The status summary request is misconfigured, so availability cannot be confirmed right now.");
      } else if (snapshot.reason === "timeout") {
        descriptionText = getUiText("状态摘要请求超时，暂时无法确认功能可用性。", "The status summary request timed out, so availability cannot be confirmed right now.");
      }

      setSystemStatus(
        statusRoot,
        "red",
        getUiText("异常", "Error"),
        getUiText("功能可用性未知", "Availability unknown"),
        descriptionText,
        true,
        snapshot
      );
      return;
    }

    if (snapshot.kind === "payload" && snapshot.payload) {
      applyResolvedStatus(statusRoot, snapshot.payload);
    }
  }

  function fetchWithTimeout(url, timeoutMs) {
    if (typeof AbortController !== "function") {
      return fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
    }

    var controller = new AbortController();
    var timeoutId = setTimeout(function () {
      controller.abort();
    }, timeoutMs);

    return fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal
    }).finally(function () {
      clearTimeout(timeoutId);
    });
  }

  function buildFunctionalAvailabilityMessage(payload) {
    return getUiText("核心与扩展功能可用。", "Core and non-core capabilities are available.");
  }

  function containsChineseCharacter(value) {
    return typeof value === "string" && /[\u3400-\u9fff]/.test(value);
  }

  function containsLatinLetter(value) {
    return typeof value === "string" && /[A-Za-z]/.test(value);
  }

  function localizeReasonText(reasonText, healthState) {
    if (typeof reasonText !== "string") {
      return "";
    }

    var normalizedReason = reasonText.trim();
    if (!normalizedReason) {
      return "";
    }

    if (!containsLatinLetter(normalizedReason)) {
      return normalizedReason;
    }

    var loweredReason = normalizedReason.toLowerCase();
    if (loweredReason.indexOf("all core and non-core services are healthy") !== -1) {
      return getUiText("核心与扩展功能可用。", "Core and non-core capabilities are available.");
    }

    if (healthState === "green") {
      return getUiText("核心与扩展功能可用。", "Core and non-core capabilities are available.");
    }
    if (healthState === "yellow") {
      return getUiText("部分能力受限，核心功能仍可用。", "Some capabilities are limited, but core functionality remains available.");
    }
    if (healthState === "red") {
      return getUiText("检测到核心组件异常，关键功能暂不可用。", "A core component is degraded, so key functionality is temporarily unavailable.");
    }

    return "";
  }

  function getComponentDisplayName(component, fallbackIndex) {
    if (component && typeof component.name === "string" && component.name.trim()) {
      var componentName = component.name.trim();
      if (containsChineseCharacter(componentName)) {
        return componentName;
      }
    }
    if (component && typeof component.key === "string" && component.key.trim()) {
      var componentKey = component.key.trim();
      if (containsChineseCharacter(componentKey)) {
        return componentKey;
      }
    }
    return getUiText("组件#", "Component #") + fallbackIndex;
  }

  function formatImpactedComponentNames(names) {
    if (!Array.isArray(names) || names.length === 0) {
      return "";
    }
    if (names.length <= 2) {
      return isEnglishUi() ? names.join(", ") : names.join("、");
    }
    return isEnglishUi()
      ? names.slice(0, 2).join(", ") + " and " + names.length + " total"
      : names.slice(0, 2).join("、") + " 等" + names.length + "项";
  }

  function buildComponentsReason(payload, healthState) {
    if (!payload || !Array.isArray(payload.components) || payload.components.length === 0) {
      return "";
    }

    var impactedCore = [];
    var impactedNonCore = [];

    payload.components.forEach(function (component, index) {
      if (!component || typeof component !== "object") {
        return;
      }

      var health = "";
      if (typeof component.health === "string") {
        health = component.health.trim().toLowerCase();
      }
      if (health === "up") {
        return;
      }

      var role = "";
      if (typeof component.role === "string") {
        role = component.role.trim().toLowerCase();
      }

      var displayName = getComponentDisplayName(component, index + 1);
      if (role === "core") {
        impactedCore.push(displayName);
        return;
      }
      impactedNonCore.push(displayName);
    });

    if (healthState === "red") {
      if (impactedCore.length > 0) {
        return getUiText(
          "核心组件异常（" + formatImpactedComponentNames(impactedCore) + "），关键功能暂不可用。",
          "Core components are degraded (" + formatImpactedComponentNames(impactedCore) + "), so key functionality is temporarily unavailable."
        );
      }
      return getUiText("检测到系统异常，关键功能暂不可用。", "System degradation detected, so key functionality is temporarily unavailable.");
    }

    if (healthState === "yellow") {
      if (impactedNonCore.length > 0) {
        return getUiText(
          "部分能力受限（" + formatImpactedComponentNames(impactedNonCore) + "），核心功能仍可用。",
          "Some capabilities are limited (" + formatImpactedComponentNames(impactedNonCore) + "), but core functionality remains available."
        );
      }
      return getUiText("部分能力受限，核心功能仍可用。", "Some capabilities are limited, but core functionality remains available.");
    }

    if (healthState === "green") {
      return getUiText("核心与扩展功能可用。", "Core and non-core capabilities are available.");
    }

    return "";
  }

  function getStatusReason(payload, fallback, healthState) {
    if (
      payload &&
      typeof payload.reason === "string" &&
      payload.reason.trim()
    ) {
      var localizedReason = localizeReasonText(payload.reason, healthState);
      if (localizedReason) {
        return localizedReason;
      }
    }

    var componentsReason = buildComponentsReason(payload, healthState);
    if (componentsReason) {
      return componentsReason;
    }

    return fallback;
  }

  function resolveHealthState(payload) {
    if (!payload || typeof payload !== "object") {
      return "invalid";
    }

    var summaryStatus = "";
    if (typeof payload.status === "string") {
      summaryStatus = payload.status.trim().toLowerCase();
    }
    if (summaryStatus === "green" || summaryStatus === "yellow" || summaryStatus === "red") {
      return summaryStatus;
    }
    if (summaryStatus === "ok") {
      return "green";
    }
    if (summaryStatus === "partial") {
      return "yellow";
    }
    if (summaryStatus === "error") {
      return "red";
    }

    if (
      payload.partial === true ||
      payload.ok === "partial"
    ) {
      return "yellow";
    }

    if (payload.ok === true) {
      return "green";
    }
    if (payload.ok === false) {
      return "red";
    }

    return "invalid";
  }

  function readSystemStatusCache() {
    try {
      var raw = localStorage.getItem(systemStatusCacheKey);
      if (!raw) {
        return null;
      }
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function saveSystemStatusCache(endpoint, payload) {
    try {
      localStorage.setItem(
        systemStatusCacheKey,
        JSON.stringify({
          endpoint: endpoint,
          saved_at_ms: Date.now(),
          payload: payload
        })
      );
    } catch (error) {
      /* ignore storage errors */
    }
  }

  function getFreshSystemStatusCache(endpoint, ttlMs) {
    var cache = readSystemStatusCache();
    if (!cache) {
      return null;
    }
    if (cache.endpoint !== endpoint) {
      return null;
    }
    if (typeof cache.saved_at_ms !== "number") {
      return null;
    }
    if (Date.now() - cache.saved_at_ms > ttlMs) {
      return null;
    }
    if (!cache.payload || typeof cache.payload !== "object") {
      return null;
    }

    return cache.payload;
  }

  function fetchJsonPayload(url, timeoutMs) {
    return fetchWithTimeout(url, timeoutMs).then(function (response) {
      if (!response.ok) {
        throw new Error("HTTP_" + response.status);
      }
      return response.json();
    });
  }

  function requestSystemStatusPayload(summaryEndpoint, healthEndpoint, timeoutMs) {
    return fetchJsonPayload(summaryEndpoint, timeoutMs).catch(function (error) {
      var isSummaryUnavailable = error && (
        error.message === "HTTP_404" ||
        error.message === "HTTP_405"
      );
      if (!isSummaryUnavailable || healthEndpoint === summaryEndpoint) {
        throw error;
      }

      return fetchJsonPayload(healthEndpoint, timeoutMs);
    });
  }

  function applyResolvedStatus(statusRoot, payload) {
    var healthState = resolveHealthState(payload);
    if (healthState === "yellow") {
      setSystemStatus(
        statusRoot,
        "yellow",
        getUiText("受限", "Limited"),
        getUiText("部分功能受限", "Partial degradation"),
        getStatusReason(payload, getUiText("检测到非核心组件异常，部分能力受限。", "Non-core components are degraded, so some capabilities are limited."), "yellow"),
        false
        ,
        { kind: "payload", payload: payload }
      );
      return true;
    }

    if (healthState === "red") {
      setSystemStatus(
        statusRoot,
        "red",
        getUiText("异常", "Error"),
        getUiText("关键功能不可用", "Key functionality unavailable"),
        getStatusReason(payload, getUiText("检测到核心组件异常，关键功能暂不可用。", "Core components are degraded, so key functionality is temporarily unavailable."), "red"),
        false
        ,
        { kind: "payload", payload: payload }
      );
      return true;
    }

    if (healthState === "green") {
      setSystemStatus(
        statusRoot,
        "green",
        getUiText("可用", "Available"),
        getUiText("功能可用", "Capabilities available"),
        getStatusReason(payload, buildFunctionalAvailabilityMessage(payload), "green"),
        false
        ,
        { kind: "payload", payload: payload }
      );
      return true;
    }

    return false;
  }

  function initSystemHealthProbe() {
    var statusRoot = document.querySelector("[data-system-status]");
    if (!statusRoot) {
      return;
    }

    var runtimeConfig = window.__APP_CONFIG__ || {};
    var apiBase = normalizeApiBase(runtimeConfig.API_BASE);
    var summaryPath = normalizeApiPath(runtimeConfig.STATUS_SUMMARY_PATH, "/status/summary");
    var healthPath = normalizeHealthPath(runtimeConfig.HEALTH_PATH);
    var cacheTtlMs = getPositiveInteger(runtimeConfig.STATUS_CACHE_TTL_MS, 300000);
    var timeoutMs = getPositiveInteger(runtimeConfig.REQUEST_TIMEOUT_MS, 3000);
    var retryTimes = getPositiveInteger(runtimeConfig.RETRY_TIMES, 1);
    var summaryEndpoint = apiBase ? apiBase + summaryPath : "";
    var healthEndpoint = apiBase ? apiBase + healthPath : "";
    var retryButton = statusRoot.querySelector("[data-system-status-retry]");
    var isProbing = false;

    if (!apiBase) {
      setSystemStatus(
        statusRoot,
        "unconfigured",
        getUiText("未配置", "Unconfigured"),
        getUiText("功能可用性未配置", "Availability not configured"),
        getUiText("未检测到后端地址配置，请先完成前端运行时配置。", "No backend endpoint is configured yet. Please finish the frontend runtime setup first."),
        false
        ,
        { kind: "unconfigured" }
      );
      return;
    }

    function requestProbe(attempt, silentMode) {
      if (!silentMode) {
        setSystemStatus(
          statusRoot,
          "loading",
          getUiText("检查中", "Checking"),
          getUiText("功能可用性检查中", "Checking availability"),
          getUiText("正在获取系统健康摘要，请稍候...", "Fetching the latest system health summary."),
          false
          ,
          { kind: "loading" }
        );
      }
      isProbing = true;

      requestSystemStatusPayload(summaryEndpoint, healthEndpoint, timeoutMs)
        .then(function (payload) {
          if (!applyResolvedStatus(statusRoot, payload)) {
            throw new Error("INVALID_PAYLOAD");
          }
          saveSystemStatusCache(summaryEndpoint, payload);
        })
        .catch(function (error) {
          if (attempt < retryTimes) {
            requestProbe(attempt + 1, false);
            return;
          }

          var message = getUiText("当前无法获取系统健康摘要，暂时无法确认功能可用性。", "The latest system health summary is unavailable, so availability cannot be confirmed right now.");
          var snapshotReason = "generic";
          if (error && (error.message === "HTTP_404" || error.message === "HTTP_405")) {
            message = getUiText("后端未提供状态摘要接口，暂时无法确认功能可用性。", "The backend does not expose a status summary endpoint, so availability cannot be confirmed right now.");
            snapshotReason = "summary-missing";
          } else if (error && error.message && error.message.indexOf("HTTP_4") === 0) {
            message = getUiText("状态摘要请求配置异常，暂时无法确认功能可用性。", "The status summary request is misconfigured, so availability cannot be confirmed right now.");
            snapshotReason = "bad-config";
          } else if (error && error.name === "AbortError") {
            message = getUiText("状态摘要请求超时，暂时无法确认功能可用性。", "The status summary request timed out, so availability cannot be confirmed right now.");
            snapshotReason = "timeout";
          }

          setSystemStatus(
            statusRoot,
            "red",
            getUiText("异常", "Error"),
            getUiText("功能可用性未知", "Availability unknown"),
            message,
            true,
            { kind: "error", reason: snapshotReason }
          );
        })
        .finally(function () {
          isProbing = false;
        });
    }

    if (retryButton) {
      retryButton.addEventListener("click", function () {
        requestProbe(0, true);
      });
    }

    function onManualRefresh() {
      if (isProbing) {
        return;
      }
      requestProbe(0, true);
    }

    statusRoot.addEventListener("click", onManualRefresh);
    statusRoot.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      onManualRefresh();
    });
    window.addEventListener("ll-ui-locale-change", function () {
      reapplySystemStatus(statusRoot);
    });

    var cachedPayload = getFreshSystemStatusCache(summaryEndpoint, cacheTtlMs);
    if (cachedPayload && applyResolvedStatus(statusRoot, cachedPayload)) {
      requestProbe(0, true);
      return;
    }

    requestProbe(0, false);
  }

  initSystemHealthProbe();
})();
