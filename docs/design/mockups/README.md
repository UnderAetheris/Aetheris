# Mockups

Static HTML mockups used to judge the design direction. Not product code. Sample data only.

| Folder | What | Rendered |
| --- | --- | --- |
| `v0.3/` | Task screen and "What it learned" screen (see `../BRAND_DIRECTION.md`). Add `class="dark"` or `class="light"` on `<body>` (the files contain the placeholder `__THEME__`). | `../assets/v0.3-*.svg` |

## Re-render

Fonts (IBM Plex, OFL) are not committed. Download them into `v0.3/fonts/`:

```bash
mkdir -p docs/design/mockups/v0.3/fonts && cd docs/design/mockups/v0.3/fonts
base=https://cdn.jsdelivr.net/fontsource/fonts
curl -sLo IBMPlexSans-Regular.woff2  $base/ibm-plex-sans@latest/latin-400-normal.woff2
curl -sLo IBMPlexSans-Medium.woff2   $base/ibm-plex-sans@latest/latin-500-normal.woff2
curl -sLo IBMPlexSans-SemiBold.woff2 $base/ibm-plex-sans@latest/latin-600-normal.woff2
curl -sLo IBMPlexMono-400.woff2      $base/ibm-plex-mono@latest/latin-400-normal.woff2
curl -sLo IBMPlexMono-500.woff2      $base/ibm-plex-mono@latest/latin-500-normal.woff2
```

Then, from `docs/design/mockups/v0.3/`:

```bash
sed 's/__THEME__/light/' task.html > task-light.html
chromium --headless --force-device-scale-factor=2 --window-size=1280,800 --screenshot=task-light.png "file://$PWD/task-light.html"
```
