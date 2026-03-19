(function () {
  "use strict";

  var colorModeStorageKey = "ll-color-mode-v1";
  var legacyThemeStorageKey = "theme";
  var validColorModes = {
    light: true,
    dark: true
  };
  var root = document.documentElement;
  var systemDarkQuery = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
  var reducedMotionQuery = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
  var themeTransitionDurationMs = 220;
  var themeTransitionInProgress = false;
  var mainScriptElement = document.currentScript || document.querySelector('script[src$="js/theme-runtime.js"]');
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

  function normalizeColorMode(mode) {
    return Object.prototype.hasOwnProperty.call(validColorModes, mode) ? mode : "light";
  }

  function getStoredColorMode() {
    try {
      var value = localStorage.getItem(colorModeStorageKey);
      if (value === "dark" || value === "light") {
        return value;
      }
      if (value === "system") {
        return systemDarkQuery && systemDarkQuery.matches ? "dark" : "light";
      }
    } catch (error) {
      /* ignore storage errors */
    }

    var legacyTheme = getLegacyThemePreference();
    if (legacyTheme === "dark" || legacyTheme === "light") {
      return legacyTheme;
    }

    var resolvedTheme = root.getAttribute("data-resolved-theme");
    return resolvedTheme === "dark" ? "dark" : "light";
  }

  function saveColorMode(mode) {
    try {
      localStorage.setItem(colorModeStorageKey, mode);
    } catch (error) {
      /* ignore storage errors */
    }
  }

  function applyColorMode(mode, shouldPersist) {
    var normalizedMode = normalizeColorMode(mode);

    root.setAttribute("data-color-mode", normalizedMode);
    root.setAttribute("data-resolved-theme", normalizedMode);

    if (normalizedMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    syncLegacyThemePreference(normalizedMode);

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
    var cores = typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : 8;
    var memory = typeof navigator.deviceMemory === "number" ? navigator.deviceMemory : 8;
    return !(cores <= 4 || memory <= 4);
  }

  function getTransitionOrigin(interactionEvent) {
    if (interactionEvent && typeof interactionEvent.clientX === "number" && typeof interactionEvent.clientY === "number") {
      return { x: interactionEvent.clientX, y: interactionEvent.clientY };
    }

    var target = interactionEvent && interactionEvent.currentTarget;
    if (target && typeof target.getBoundingClientRect === "function") {
      var rect = target.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  function getRevealRadius(x, y) {
    var maxX = Math.max(x, window.innerWidth - x);
    var maxY = Math.max(y, window.innerHeight - y);
    return Math.sqrt(maxX * maxX + maxY * maxY);
  }

  function getNextColorMode(mode) {
    return normalizeColorMode(mode) === "dark" ? "light" : "dark";
  }

  function applyColorModeWithReveal(mode, interactionEvent) {
    var normalizedMode = normalizeColorMode(mode);
    var currentResolvedTheme = root.getAttribute("data-resolved-theme");
    if (currentResolvedTheme !== "dark" && currentResolvedTheme !== "light") {
      currentResolvedTheme = getStoredColorMode();
    }

    if (!canAnimateThemeSwitch() || currentResolvedTheme === normalizedMode) {
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

  function updateThemeSwitchState(button, mode) {
    var selectedMode = normalizeColorMode(mode);
    var nextMode = getNextColorMode(selectedMode);
    var toggleLabel = nextMode === "dark"
      ? getUiText("\u5207\u6362\u5230\u6697\u8272\u6a21\u5f0f", "Switch to dark mode")
      : getUiText("\u5207\u6362\u5230\u4eae\u8272\u6a21\u5f0f", "Switch to light mode");
    var copy = button.querySelector("[data-theme-toggle-copy]");

    button.setAttribute("data-theme-mode", selectedMode);
    button.setAttribute("aria-label", toggleLabel);
    button.setAttribute("title", toggleLabel);

    if (copy) {
      copy.textContent = getUiText("\u989c\u8272\u6a21\u5f0f / ", "Color mode / ") + toggleLabel;
    }
  }

  function initTheme() {
    ensureThemeStylesheet();

    var currentMode = applyColorMode(getStoredColorMode(), false);
    var controls = document.querySelectorAll('[data-theme-mode-switch]');

    controls.forEach(function (control) {
      updateThemeSwitchState(control, currentMode);
      control.addEventListener('click', function (event) {
        currentMode = applyColorModeWithReveal(getNextColorMode(currentMode), event);
        controls.forEach(function (button) {
          updateThemeSwitchState(button, currentMode);
        });
      });
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
