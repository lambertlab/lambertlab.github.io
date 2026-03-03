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

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 768) {
        closeMenu();
      }
    });
  }

  initTheme();
  initMobileMenu();
})();
