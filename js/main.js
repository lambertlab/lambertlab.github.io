(function () {
  "use strict";

  var storageKey = "theme";
  var root = document.documentElement;
  var config = window.__APP_CONFIG__ || {};
  var flags = config.FLAGS || {};
  var isDarkToggleEnabled = flags.ENABLE_DARKMODE_PLACEHOLDER === true;
  var homepageSnapshotCache = window.__HOME_CONTENT_SNAPSHOT__ || null;
  var homepageSnapshotRequest = null;
  var systemStatusCacheKey = "system-status-cache-v1";

  function getStoredTheme() {
    try {
      var value = localStorage.getItem(storageKey);
      if (value === "dark" || value === "light") {
        return value;
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      /* ignore storage errors */
    }
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      root.classList.add("dark");
      return;
    }

    root.classList.remove("dark");
  }

  function updateToggleState(button, theme) {
    var isDark = theme === "dark";
    var icon = button.querySelector("[data-theme-icon]");
    var text = button.querySelector("[data-theme-text]");
    button.setAttribute("aria-pressed", isDark ? "true" : "false");
    button.setAttribute("aria-label", isDark ? "切换到亮色模式" : "切换到暗色模式");

    if (icon) {
      icon.textContent = isDark ? "light_mode" : "dark_mode";
    }

    if (text) {
      text.textContent = isDark ? "亮色" : "暗色";
    }
  }

  function initTheme() {
    var theme = getStoredTheme() || "light";
    var toggleButtons = document.querySelectorAll("[data-theme-toggle]");
    applyTheme(theme);

    if (!isDarkToggleEnabled) {
      toggleButtons.forEach(function (button) {
        button.classList.add("hidden");
        button.setAttribute("aria-hidden", "true");
      });
      return;
    }

    toggleButtons.forEach(function (button) {
      button.classList.remove("hidden");
      button.removeAttribute("aria-hidden");
      updateToggleState(button, theme);
    });

    toggleButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        theme = root.classList.contains("dark") ? "light" : "dark";
        applyTheme(theme);
        saveTheme(theme);

        toggleButtons.forEach(function (toggleButton) {
          updateToggleState(toggleButton, theme);
        });
      });
    });
  }

  function initMobileMenu() {
    var menuButton = document.getElementById("mobile-menu-button");
    var mobileMenu = document.getElementById("mobile-menu");

    if (!menuButton || !mobileMenu) {
      return;
    }

    function closeMenu() {
      menuButton.setAttribute("aria-expanded", "false");
      mobileMenu.classList.add("hidden");
    }

    function openMenu() {
      menuButton.setAttribute("aria-expanded", "true");
      mobileMenu.classList.remove("hidden");
    }

    menuButton.addEventListener("click", function () {
      if (mobileMenu.classList.contains("hidden")) {
        openMenu();
        return;
      }

      closeMenu();
    });

    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", function (event) {
      var clickedOutsideMenu = !mobileMenu.contains(event.target);
      var clickedOutsideButton = !menuButton.contains(event.target);

      if (clickedOutsideMenu && clickedOutsideButton && !mobileMenu.classList.contains("hidden")) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !mobileMenu.classList.contains("hidden")) {
        closeMenu();
        menuButton.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 768) {
        closeMenu();
      }
    });
  }

  function initScrollbarVisibility() {
    var rootElement = document.documentElement;
    if (!rootElement) {
      return;
    }

    var hideDelayMs = 900;
    var hideTimer = null;

    function showScrollbar() {
      rootElement.classList.add("show-scrollbar");
      if (hideTimer) {
        clearTimeout(hideTimer);
      }

      hideTimer = setTimeout(function () {
        rootElement.classList.remove("show-scrollbar");
      }, hideDelayMs);
    }

    window.addEventListener("wheel", showScrollbar, { passive: true });
    window.addEventListener("touchmove", showScrollbar, { passive: true });
    window.addEventListener("scroll", function () {
      if (!rootElement.classList.contains("show-scrollbar")) {
        return;
      }
      showScrollbar();
    }, { passive: true });
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

  function getCardTextElement(card, selector) {
    var node = card.querySelector(selector);
    if (!node) {
      return null;
    }

    return node;
  }

  function applyCardSnapshot(card, snapshot) {
    if (!card || !snapshot || typeof snapshot !== "object") {
      return;
    }

    var accent = getCardTextElement(card, ".accent-label");
    if (accent && typeof snapshot.accent === "string" && snapshot.accent.trim()) {
      accent.textContent = snapshot.accent.trim();
    }

    var title = getCardTextElement(card, "h3");
    if (title && typeof snapshot.title === "string" && snapshot.title.trim()) {
      title.textContent = snapshot.title.trim();
    }

    var description = getCardTextElement(card, "p");
    if (description && typeof snapshot.description === "string") {
      if (snapshot.description.trim()) {
        description.hidden = false;
        description.textContent = snapshot.description.trim();
      } else {
        description.hidden = true;
      }
    }

    if (card.tagName === "A") {
      if (typeof snapshot.href === "string" && snapshot.href.trim()) {
        card.setAttribute("href", snapshot.href.trim());
      }

      if (snapshot.external === true) {
        card.setAttribute("target", "_blank");
        card.setAttribute("rel", "noreferrer");
      }

      if (snapshot.external === false) {
        card.removeAttribute("target");
        card.removeAttribute("rel");
      }
    }
  }

  function applyPanelSnapshot(panelPurpose, cardsSnapshot) {
    if (!Array.isArray(cardsSnapshot)) {
      return;
    }

    var cards = document.querySelectorAll('.panel[data-purpose="' + panelPurpose + '"] .panel-content-grid .bento-card');
    if (!cards.length) {
      return;
    }

    var size = Math.min(cards.length, cardsSnapshot.length);
    for (var index = 0; index < size; index += 1) {
      applyCardSnapshot(cards[index], cardsSnapshot[index]);
    }
  }

  function applyHomepageSnapshot(payload) {
    if (!payload || typeof payload !== "object") {
      return false;
    }
    if (!Array.isArray(payload.technology) || !Array.isArray(payload.life)) {
      return false;
    }

    applyPanelSnapshot("tech-panel", payload.technology);
    applyPanelSnapshot("life-panel", payload.life);
    return true;
  }

  function requestHomepageSnapshot(endpoint, timeoutMs) {
    if (homepageSnapshotCache) {
      return Promise.resolve(homepageSnapshotCache);
    }
    if (homepageSnapshotRequest) {
      return homepageSnapshotRequest;
    }

    homepageSnapshotRequest = fetchWithTimeout(endpoint, timeoutMs)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("HTTP_" + response.status);
        }
        return response.json();
      })
      .then(function (payload) {
        if (!payload || payload.ok !== true) {
          throw new Error("INVALID_PAYLOAD");
        }
        homepageSnapshotCache = payload;
        window.__HOME_CONTENT_SNAPSHOT__ = payload;
        return payload;
      })
      .finally(function () {
        homepageSnapshotRequest = null;
      });

    return homepageSnapshotRequest;
  }

  function initHomepageContent() {
    var splitLayout = document.querySelector("[data-split-layout]");
    if (!splitLayout) {
      return;
    }

    var runtimeConfig = window.__APP_CONFIG__ || {};
    var apiBase = normalizeApiBase(runtimeConfig.API_BASE);
    var contentPath = normalizeApiPath(runtimeConfig.HOME_CONTENT_PATH, "/home-content");
    var timeoutMs = getPositiveInteger(runtimeConfig.REQUEST_TIMEOUT_MS, 3000);
    if (!apiBase) {
      return;
    }

    requestHomepageSnapshot(apiBase + contentPath, timeoutMs)
      .then(function (payload) {
        applyHomepageSnapshot(payload);
      })
      .catch(function () {
        /* keep static fallback content when request fails */
      });
  }

  function getStatusElements(rootElement) {
    return {
      badge: rootElement.querySelector("[data-system-status-badge]"),
      title: rootElement.querySelector("[data-system-status-title]"),
      description: rootElement.querySelector("[data-system-status-description]"),
      retry: rootElement.querySelector("[data-system-status-retry]")
    };
  }

  function setSystemStatus(rootElement, state, badgeText, titleText, descriptionText, showRetryButton) {
    var elements = getStatusElements(rootElement);
    var statusSummary = titleText;
    if (descriptionText) {
      statusSummary = titleText + "：" + descriptionText;
    }
    rootElement.setAttribute("data-status-state", state);
    rootElement.setAttribute("aria-label", statusSummary);
    rootElement.setAttribute("title", statusSummary);

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

  function buildHealthMessage(payload) {
    var service = typeof payload.service === "string" && payload.service ? payload.service : "backend";
    var version = typeof payload.version === "string" && payload.version ? payload.version : "unknown";
    return "后端服务可用（" + service + " v" + version + "）";
  }

  function getStatusReason(payload, fallback) {
    if (
      payload &&
      typeof payload.reason === "string" &&
      payload.reason.trim()
    ) {
      return payload.reason.trim();
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
    if (summaryStatus === "green") {
      return "ok";
    }
    if (summaryStatus === "yellow") {
      return "partial";
    }
    if (summaryStatus === "red") {
      return "error";
    }

    if (
      payload.partial === true ||
      payload.status === "partial" ||
      payload.ok === "partial"
    ) {
      return "partial";
    }

    if (payload.ok === true) {
      return "ok";
    }
    if (payload.ok === false) {
      return "error";
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
    if (healthState === "partial") {
      setSystemStatus(
        statusRoot,
        "partial",
        "部分异常",
        "系统部分状态异常",
        getStatusReason(payload, "检测到部分子系统异常，详细判定规则后续补充。"),
        false
      );
      return true;
    }

    if (healthState === "error") {
      setSystemStatus(
        statusRoot,
        "error",
        "异常",
        "系统状态异常",
        getStatusReason(payload, "核心系统不可用或健康检查失败。"),
        false
      );
      return true;
    }

    if (healthState === "ok") {
      setSystemStatus(
        statusRoot,
        "ok",
        "正常",
        "系统状态正常",
        getStatusReason(payload, buildHealthMessage(payload)),
        false
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
        "未配置",
        "系统状态未配置",
        "未检测到 API_BASE，请先完成前端运行时配置。",
        false
      );
      return;
    }

    function requestProbe(attempt, silentMode) {
      if (!silentMode) {
        setSystemStatus(
          statusRoot,
          "loading",
          "检查中",
          "系统状态检查中",
          "正在连接后端服务，请稍候...",
          false
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

          var message = "暂时无法连接后端服务，请稍后重试。";
          if (error && (error.message === "HTTP_404" || error.message === "HTTP_405")) {
            message = "后端未提供状态摘要接口，请检查 STATUS_SUMMARY_PATH 或后端版本。";
          } else if (error && error.message && error.message.indexOf("HTTP_4") === 0) {
            message = "请求配置异常，请检查 API_BASE 与 HEALTH_PATH。";
          } else if (error && error.name === "AbortError") {
            message = "连接后端超时，请检查网络或稍后重试。";
          }

          setSystemStatus(statusRoot, "error", "异常", "系统状态异常", message, true);
        })
        .finally(function () {
          isProbing = false;
        });
    }

    if (retryButton) {
      retryButton.addEventListener("click", function () {
        requestProbe(0, false);
      });
    }

    function onManualRefresh() {
      if (isProbing) {
        return;
      }
      requestProbe(0, false);
    }

    statusRoot.addEventListener("click", onManualRefresh);
    statusRoot.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      onManualRefresh();
    });

    var cachedPayload = getFreshSystemStatusCache(summaryEndpoint, cacheTtlMs);
    if (cachedPayload && applyResolvedStatus(statusRoot, cachedPayload)) {
      requestProbe(0, true);
      return;
    }

    requestProbe(0, false);
  }

  initScrollbarVisibility();
  initTheme();
  initMobileMenu();
  initHomepageContent();
  initSystemHealthProbe();
})();
