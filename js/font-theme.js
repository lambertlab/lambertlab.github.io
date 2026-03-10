(function () {
  "use strict";

  var STORAGE_KEY = "ll-font-theme";
  var DEFAULT_THEME = "classic";

  var THEMES = {
    classic: {
      sans: '"Inter", "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, -apple-system, "Segoe UI", sans-serif',
      zh: '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Source Han Sans SC", sans-serif',
      en: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
      mono: '"JetBrains Mono", "Cascadia Code", "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace'
    }
  };

  function applyTheme(themeName) {
    var theme = THEMES[themeName] || THEMES[DEFAULT_THEME];
    var root = document.documentElement;

    root.setAttribute("data-font-theme", themeName in THEMES ? themeName : DEFAULT_THEME);
    root.style.setProperty("--ll-font-sans", theme.sans);
    root.style.setProperty("--ll-font-zh", theme.zh);
    root.style.setProperty("--ll-font-en", theme.en);
    root.style.setProperty("--ll-font-mono", theme.mono);
  }

  function getStoredTheme() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);
      if (value && Object.prototype.hasOwnProperty.call(THEMES, value)) {
        return value;
      }
    } catch (error) {
      return DEFAULT_THEME;
    }

    return DEFAULT_THEME;
  }

  function setTheme(themeName) {
    if (!Object.prototype.hasOwnProperty.call(THEMES, themeName)) {
      return false;
    }

    applyTheme(themeName);

    try {
      localStorage.setItem(STORAGE_KEY, themeName);
    } catch (error) {
      /* ignore storage errors */
    }

    return true;
  }

  var initialTheme = getStoredTheme();
  applyTheme(initialTheme);

  window.LambertLabFontTheme = {
    defaultTheme: DEFAULT_THEME,
    availableThemes: Object.keys(THEMES),
    getTheme: getStoredTheme,
    setTheme: setTheme,
    applyTheme: applyTheme
  };
})();
