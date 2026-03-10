# lambertlab.github.io
Lambert's digital home — thinking, engineering, and experiments.

## Font Theme

- Active theme: `classic`
- Font stack:
  - English: `Inter`
  - Chinese: `Noto Sans SC`
  - Code: `JetBrains Mono`

### Runtime switch API

- Global object: `window.LambertLabFontTheme`
- Set theme: `window.LambertLabFontTheme.setTheme("classic")`
- Get current theme: `window.LambertLabFontTheme.getTheme()`
- Available themes: `window.LambertLabFontTheme.availableThemes`

### Add future themes

1. Add a new theme entry in `js/font-theme.js` under `THEMES`.
2. Keep `css/font-themes.css` loaded in all pages.
3. Call `window.LambertLabFontTheme.setTheme("<new-theme-name>")` to apply globally.
