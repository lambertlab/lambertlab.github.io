(function () {
  "use strict";

  var colorModeStorageKey = "ll-color-mode-v1";
  var legacyThemeStorageKey = "theme";
  var validColorModes = {
    system: true,
    light: true,
    dark: true
  };
  var root = document.documentElement;
  var config = window.__APP_CONFIG__ || {};
  var systemDarkQuery = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
  var reducedMotionQuery = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
  var themeTransitionDurationMs = 520;
  var themeTransitionInProgress = false;
  var mainScriptElement = document.currentScript || document.querySelector('script[src$="js/theme-runtime.js"]');
  var systemStatusCacheKey = "system-status-cache-v1";
  var colorModeOptions = [
    { value: "system", text: "跟随系统" },
    { value: "light", text: "亮色" },
    { value: "dark", text: "暗色" }
  ];
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

  function ensureThemeStylesheet() {
    if (!document.head || document.getElementById("ll-theme-system-stylesheet")) {
      return;
    }

    var fallbackHref = "/css/theme-system.css";
    var resolvedHref = fallbackHref;
    var scriptSrc = mainScriptElement && mainScriptElement.getAttribute("src");

    if (scriptSrc) {
      try {
        resolvedHref = new URL("../css/theme-system.css", new URL(scriptSrc, window.location.href)).toString();
      } catch (error) {
        resolvedHref = fallbackHref;
      }
    }

    var existingThemeLink = document.querySelector('link[href*="theme-system.css"]');
    if (existingThemeLink) {
      var existingHref = existingThemeLink.getAttribute("href") || "";
      try {
        var existingResolved = new URL(existingHref, window.location.href).toString();
        var targetResolved = new URL(resolvedHref, window.location.href).toString();
        if (existingResolved === targetResolved) {
          existingThemeLink.id = "ll-theme-system-stylesheet";
          return;
        }
      } catch (error) {
        /* keep fallback injection */
      }
    }

    var link = document.createElement("link");
    link.id = "ll-theme-system-stylesheet";
    link.rel = "stylesheet";
    link.href = resolvedHref;
    document.head.appendChild(link);
  }

  function syncLegacyThemePreference(theme) {
    try {
      localStorage.setItem(legacyThemeStorageKey, theme);
    } catch (error) {
      /* ignore storage errors */
    }
  }

  function getLegacyThemePreference() {
    try {
      var legacyTheme = localStorage.getItem(legacyThemeStorageKey);
      if (legacyTheme === "dark" || legacyTheme === "light") {
        return legacyTheme;
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function getStoredColorMode() {
    try {
      var value = localStorage.getItem(colorModeStorageKey);
      if (value && Object.prototype.hasOwnProperty.call(validColorModes, value)) {
        return value;
      }
    } catch (error) {
      return "system";
    }

    var legacyTheme = getLegacyThemePreference();
    if (legacyTheme === "dark" || legacyTheme === "light") {
      return legacyTheme;
    }

    return "system";
  }

  function saveColorMode(mode) {
    try {
      localStorage.setItem(colorModeStorageKey, mode);
    } catch (error) {
      /* ignore storage errors */
    }
  }

  function normalizeColorMode(mode) {
    return Object.prototype.hasOwnProperty.call(validColorModes, mode)
      ? mode
      : "system";
  }

  function resolveTheme(mode) {
    if (mode === "dark") {
      return "dark";
    }
    if (mode === "light") {
      return "light";
    }
    if (systemDarkQuery && systemDarkQuery.matches) {
      return "dark";
    }
    return "light";
  }

  function applyColorMode(mode, shouldPersist) {
    var normalizedMode = normalizeColorMode(mode);
    var resolvedTheme = resolveTheme(normalizedMode);

    root.setAttribute("data-color-mode", normalizedMode);
    root.setAttribute("data-resolved-theme", resolvedTheme);

    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    syncLegacyThemePreference(resolvedTheme);

    if (shouldPersist !== false) {
      saveColorMode(normalizedMode);
    }

    return normalizedMode;
  }

  function cleanupThemeTransitionStyles() {
    root.classList.remove("ll-theme-transitioning");
    root.style.removeProperty("--ll-theme-transition-x");
    root.style.removeProperty("--ll-theme-transition-y");
    root.style.removeProperty("--ll-theme-transition-radius");
    themeTransitionInProgress = false;
  }

  function canAnimateThemeSwitch() {
    if (themeTransitionInProgress) {
      return false;
    }
    if (typeof document.startViewTransition !== "function") {
      return false;
    }
    if (reducedMotionQuery && reducedMotionQuery.matches) {
      return false;
    }
    var cores = typeof navigator.hardwareConcurrency === "number"
      ? navigator.hardwareConcurrency
      : 8;
    var memory = typeof navigator.deviceMemory === "number"
      ? navigator.deviceMemory
      : 8;
    if (cores <= 4 || memory <= 4) {
      return false;
    }
    return true;
  }

  function getTransitionOrigin(interactionEvent) {
    if (
      interactionEvent &&
      typeof interactionEvent.clientX === "number" &&
      typeof interactionEvent.clientY === "number"
    ) {
      return {
        x: interactionEvent.clientX,
        y: interactionEvent.clientY
      };
    }

    var target = interactionEvent && interactionEvent.currentTarget;
    if (target && typeof target.getBoundingClientRect === "function") {
      var rect = target.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }

    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
  }

  function getRevealRadius(x, y) {
    var maxX = Math.max(x, window.innerWidth - x);
    var maxY = Math.max(y, window.innerHeight - y);
    return Math.sqrt(maxX * maxX + maxY * maxY);
  }

  function applyColorModeWithReveal(mode, interactionEvent) {
    var normalizedMode = normalizeColorMode(mode);
    var currentResolvedTheme = root.getAttribute("data-resolved-theme");
    if (currentResolvedTheme !== "dark" && currentResolvedTheme !== "light") {
      currentResolvedTheme = resolveTheme(getStoredColorMode());
    }

    var nextResolvedTheme = resolveTheme(normalizedMode);
    if (!canAnimateThemeSwitch() || currentResolvedTheme === nextResolvedTheme) {
      return applyColorMode(normalizedMode);
    }

    var origin = getTransitionOrigin(interactionEvent);
    var radius = getRevealRadius(origin.x, origin.y);
    root.style.setProperty("--ll-theme-transition-x", origin.x + "px");
    root.style.setProperty("--ll-theme-transition-y", origin.y + "px");
    root.style.setProperty("--ll-theme-transition-radius", radius + "px");
    root.classList.add("ll-theme-transitioning");

    var transition = null;
    themeTransitionInProgress = true;

    try {
      transition = document.startViewTransition(function () {
        applyColorMode(normalizedMode);
      });
    } catch (error) {
      cleanupThemeTransitionStyles();
      return applyColorMode(normalizedMode);
    }

    if (transition && transition.finished && typeof transition.finished.finally === "function") {
      transition.finished.finally(cleanupThemeTransitionStyles);
    } else {
      setTimeout(cleanupThemeTransitionStyles, themeTransitionDurationMs + 80);
    }

    return normalizedMode;
  }

  function getColorModeIndex(mode) {
    if (mode === "light") {
      return 1;
    }
    if (mode === "dark") {
      return 2;
    }
    return 0;
  }

  function updateThemeSwitchState(wrapper, mode) {
    var selectedMode = Object.prototype.hasOwnProperty.call(validColorModes, mode)
      ? mode
      : "system";
    var buttons = wrapper.querySelectorAll("[data-theme-mode-option]");

    wrapper.setAttribute("data-theme-mode", selectedMode);
    wrapper.style.setProperty("--ll-theme-index", String(getColorModeIndex(selectedMode)));

    buttons.forEach(function (button) {
      var isActive = button.getAttribute("data-theme-mode-option") === selectedMode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function createThemeOptionIcon(mode) {
    var namespace = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(namespace, "svg");

    svg.setAttribute("class", "ll-theme-option-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    function appendElement(tagName, attributes) {
      var node = document.createElementNS(namespace, tagName);
      Object.keys(attributes).forEach(function (key) {
        node.setAttribute(key, attributes[key]);
      });
      svg.appendChild(node);
    }

    if (mode === "system") {
      appendElement("rect", { x: "4", y: "5", width: "16", height: "11", rx: "2" });
      appendElement("line", { x1: "9", y1: "20", x2: "15", y2: "20" });
      appendElement("line", { x1: "12", y1: "16", x2: "12", y2: "20" });
      return svg;
    }

    if (mode === "light") {
      appendElement("circle", { cx: "12", cy: "12", r: "3.5" });
      appendElement("line", { x1: "12", y1: "2.5", x2: "12", y2: "5" });
      appendElement("line", { x1: "12", y1: "19", x2: "12", y2: "21.5" });
      appendElement("line", { x1: "2.5", y1: "12", x2: "5", y2: "12" });
      appendElement("line", { x1: "19", y1: "12", x2: "21.5", y2: "12" });
      appendElement("line", { x1: "5.3", y1: "5.3", x2: "7.1", y2: "7.1" });
      appendElement("line", { x1: "16.9", y1: "16.9", x2: "18.7", y2: "18.7" });
      appendElement("line", { x1: "16.9", y1: "7.1", x2: "18.7", y2: "5.3" });
      appendElement("line", { x1: "5.3", y1: "18.7", x2: "7.1", y2: "16.9" });
      return svg;
    }

    appendElement("path", { d: "M20.5 14.5A7.5 7.5 0 1 1 9.5 3.5 6.2 6.2 0 0 0 20.5 14.5Z" });
    return svg;
  }

  function buildThemeSwitch(currentMode) {
    var wrapper = document.createElement("div");
    var segmented = document.createElement("div");
    var glider = document.createElement("span");
    var buttons = [];

    wrapper.className = "ll-theme-switch ll-theme-static-sync";
    wrapper.setAttribute("data-theme-mode-switch", "");

    segmented.className = "ll-theme-segmented";
    segmented.setAttribute("role", "group");
    segmented.setAttribute("aria-label", "颜色模式");

    glider.className = "ll-theme-glider";
    glider.setAttribute("aria-hidden", "true");
    segmented.appendChild(glider);

    colorModeOptions.forEach(function (item) {
      var button = document.createElement("button");

      button.type = "button";
      button.className = "ll-theme-option";
      button.setAttribute("data-theme-mode-option", item.value);
      button.setAttribute("aria-label", item.text);
      button.appendChild(createThemeOptionIcon(item.value));
      segmented.appendChild(button);
      buttons.push(button);
    });

    wrapper.appendChild(segmented);
    updateThemeSwitchState(wrapper, currentMode);

    return {
      wrapper: wrapper,
      buttons: buttons
    };
  }

  function attachSystemModeListener(onChange) {
    if (!systemDarkQuery) {
      return;
    }

    if (typeof systemDarkQuery.addEventListener === "function") {
      systemDarkQuery.addEventListener("change", onChange);
      return;
    }

    if (typeof systemDarkQuery.addListener === "function") {
      systemDarkQuery.addListener(onChange);
    }
  }

  function initTheme() {
    ensureThemeStylesheet();

    var currentMode = applyColorMode(getStoredColorMode(), false);
    var hosts = document.querySelectorAll(".ll-nav, .topbar nav");
    var controls = [];

    hosts.forEach(function (host) {
      if (!host) {
        return;
      }

      var control = null;
      var existingWrapper = host.querySelector("[data-theme-mode-switch]");

      if (existingWrapper) {
        var existingButtons = existingWrapper.querySelectorAll("[data-theme-mode-option]");
        if (existingButtons.length === colorModeOptions.length) {
          existingWrapper.classList.add("ll-theme-static-sync");
          control = {
            wrapper: existingWrapper,
            buttons: Array.prototype.slice.call(existingButtons)
          };
          updateThemeSwitchState(existingWrapper, currentMode);
        } else {
          existingWrapper.remove();
        }
      }

      if (!control) {
        control = buildThemeSwitch(currentMode);
        host.appendChild(control.wrapper);
      }

      controls.push(control);
    });

    function releaseStaticSyncClass() {
      controls.forEach(function (control) {
        control.wrapper.classList.remove("ll-theme-static-sync");
      });
    }

    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(releaseStaticSyncClass);
    } else {
      setTimeout(releaseStaticSyncClass, 0);
    }

    function syncControls(mode) {
      controls.forEach(function (control) {
        updateThemeSwitchState(control.wrapper, mode);
      });
    }

    controls.forEach(function (control) {
      control.buttons.forEach(function (button) {
        button.addEventListener("click", function (event) {
          var nextMode = button.getAttribute("data-theme-mode-option") || "system";
          currentMode = applyColorModeWithReveal(nextMode, event);
          syncControls(currentMode);
        });
      });

      control.wrapper.addEventListener("keydown", function (event) {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
          return;
        }

        var currentIndex = getColorModeIndex(currentMode);
        var delta = event.key === "ArrowRight" ? 1 : -1;
        var nextIndex = (currentIndex + delta + colorModeOptions.length) % colorModeOptions.length;
        var nextMode = colorModeOptions[nextIndex].value;
        currentMode = applyColorModeWithReveal(nextMode, event);
        syncControls(currentMode);
        event.preventDefault();
      });
    });

    attachSystemModeListener(function () {
      if (currentMode !== "system") {
        return;
      }

      applyColorMode("system", false);
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
  initScrollbarVisibility();
  initTheme();
})();
