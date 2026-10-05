# Mockups

Static HTML mockups used to evaluate visual direction. They are **not** product code and contain illustrative data only.

| File | What | Rendered |
| --- | --- | --- |
| `brand-v0.2-home.html` | Home dashboard in the proposed "Instrument" brand (BRAND_DIRECTION.md) | [`../assets/brand-v0.2-home.svg`](../assets/brand-v0.2-home.svg) |

## Re-render

Fonts are OFL and not committed here. Put them in `docs/design/mockups/fonts/`:

```bash
mkdir -p docs/design/mockups/fonts && cd docs/design/mockups/fonts
curl -L -o InstrumentSans.ttf "https://github.com/google/fonts/raw/main/ofl/instrumentsans/InstrumentSans%5Bwdth,wght%5D.ttf"
curl -L -o Newsreader.ttf "https://github.com/google/fonts/raw/main/ofl/newsreader/Newsreader%5Bopsz,wght%5D.ttf"
curl -L -o JetBrainsMono.ttf "https://github.com/google/fonts/raw/main/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf"
```

Then open the HTML in a browser at 1440x900, or `chromium --headless --window-size=1440,900 --screenshot=home.png brand-v0.2-home.html`.
