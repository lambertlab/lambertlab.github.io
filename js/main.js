(function () {
  "use strict";

  var storageKey = "theme";
  var root = document.documentElement;
  var config = window.__APP_CONFIG__ || {};
  var flags = config.FLAGS || {};
  var isDarkToggleEnabled = flags.ENABLE_DARKMODE_PLACEHOLDER === true;

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
    rootElement.setAttribute("data-status-state", state);

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

  function initSystemHealthProbe() {
    var statusRoot = document.querySelector("[data-system-status]");
    if (!statusRoot) {
      return;
    }

    var runtimeConfig = window.__APP_CONFIG__ || {};
    var apiBase = normalizeApiBase(runtimeConfig.API_BASE);
    var healthPath = normalizeHealthPath(runtimeConfig.HEALTH_PATH);
    var timeoutMs = getPositiveInteger(runtimeConfig.REQUEST_TIMEOUT_MS, 3000);
    var retryTimes = getPositiveInteger(runtimeConfig.RETRY_TIMES, 1);
    var endpoint = apiBase ? apiBase + healthPath : "";
    var retryButton = statusRoot.querySelector("[data-system-status-retry]");

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

    function requestProbe(attempt) {
      setSystemStatus(
        statusRoot,
        "loading",
        "检查中",
        "系统状态检查中",
        "正在连接后端服务，请稍候...",
        false
      );

      fetchWithTimeout(endpoint, timeoutMs)
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

          setSystemStatus(
            statusRoot,
            "ok",
            "正常",
            "系统状态正常",
            buildHealthMessage(payload),
            false
          );
        })
        .catch(function (error) {
          if (attempt < retryTimes) {
            requestProbe(attempt + 1);
            return;
          }

          var message = "暂时无法连接后端服务，请稍后重试。";
          if (error && error.message && error.message.indexOf("HTTP_4") === 0) {
            message = "请求配置异常，请检查 API_BASE 与 HEALTH_PATH。";
          }
          if (error && error.name === "AbortError") {
            message = "连接后端超时，请检查网络或稍后重试。";
          }

          setSystemStatus(statusRoot, "error", "异常", "系统状态异常", message, true);
        });
    }

    if (retryButton) {
      retryButton.addEventListener("click", function () {
        requestProbe(0);
      });
    }

    requestProbe(0);
  }

  initTheme();
  initMobileMenu();
  initSystemHealthProbe();
})();
