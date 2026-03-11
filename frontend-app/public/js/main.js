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
  var mainScriptElement = document.currentScript || document.querySelector('script[src$="js/main.js"]');
  var homepageSnapshotCache = window.__HOME_CONTENT_SNAPSHOT__ || null;
  var homepageSnapshotRequest = null;
  var systemStatusCacheKey = "system-status-cache-v1";
  var colorModeOptions = [
    { value: "system", text: "跟随系统" },
    { value: "light", text: "亮色" },
    { value: "dark", text: "暗色" }
  ];

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

  function buildFunctionalAvailabilityMessage(payload) {
    return "核心与扩展功能可用。";
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
      return "核心与扩展功能可用。";
    }

    if (healthState === "green") {
      return "核心与扩展功能可用。";
    }
    if (healthState === "yellow") {
      return "部分能力受限，核心功能仍可用。";
    }
    if (healthState === "red") {
      return "检测到核心组件异常，关键功能暂不可用。";
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
    return "组件#" + fallbackIndex;
  }

  function formatImpactedComponentNames(names) {
    if (!Array.isArray(names) || names.length === 0) {
      return "";
    }
    if (names.length <= 2) {
      return names.join("、");
    }
    return names.slice(0, 2).join("、") + " 等" + names.length + "项";
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
        return "核心组件异常（" + formatImpactedComponentNames(impactedCore) + "），关键功能暂不可用。";
      }
      return "检测到系统异常，关键功能暂不可用。";
    }

    if (healthState === "yellow") {
      if (impactedNonCore.length > 0) {
        return "部分能力受限（" + formatImpactedComponentNames(impactedNonCore) + "），核心功能仍可用。";
      }
      return "部分能力受限，核心功能仍可用。";
    }

    if (healthState === "green") {
      return "核心与扩展功能可用。";
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
        "受限",
        "部分功能受限",
        getStatusReason(payload, "检测到非核心组件异常，部分能力受限。", "yellow"),
        false
      );
      return true;
    }

    if (healthState === "red") {
      setSystemStatus(
        statusRoot,
        "red",
        "异常",
        "关键功能不可用",
        getStatusReason(payload, "检测到核心组件异常，关键功能暂不可用。", "red"),
        false
      );
      return true;
    }

    if (healthState === "green") {
      setSystemStatus(
        statusRoot,
        "green",
        "可用",
        "功能可用",
        getStatusReason(payload, buildFunctionalAvailabilityMessage(payload), "green"),
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
        "功能可用性未配置",
        "未检测到后端地址配置，请先完成前端运行时配置。",
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
          "功能可用性检查中",
          "正在获取系统健康摘要，请稍候...",
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

          var message = "当前无法获取系统健康摘要，暂时无法确认功能可用性。";
          if (error && (error.message === "HTTP_404" || error.message === "HTTP_405")) {
            message = "后端未提供状态摘要接口，暂时无法确认功能可用性。";
          } else if (error && error.message && error.message.indexOf("HTTP_4") === 0) {
            message = "状态摘要请求配置异常，暂时无法确认功能可用性。";
          } else if (error && error.name === "AbortError") {
            message = "状态摘要请求超时，暂时无法确认功能可用性。";
          } else {
            message = "当前无法获取系统健康摘要，暂时无法确认功能可用性。";
          }

          setSystemStatus(statusRoot, "red", "异常", "功能可用性未知", message, true);
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
