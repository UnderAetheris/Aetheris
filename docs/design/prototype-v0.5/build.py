"""Build aetheris-prototype-v0.5.html: one self-contained file (styles, fonts, icons, data, script).

Usage: python build.py   (no dependencies, no network)
"""
import pathlib

d = pathlib.Path(__file__).parent
fonts = ''.join(
    f'@font-face{{font-family:"{family}";src:url(data:font/woff2;base64,{(d / "fonts" / f"{name}.woff2.b64").read_text().strip()}) format("woff2");font-weight:100 900;font-display:swap}}'
    for family, name in (("Geist", "geist"), ("Geist Mono", "geist-mono"))
)
css = fonts + (d / "tokens.css").read_text() + (d / "app.css").read_text()
js = "".join((d / f).read_text() + "\n" for f in ("icons.js", "data.js", "app.js"))
html = (
    '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width,initial-scale=1">'
    f"<title>Aetheris \u00b7 prototype v0.5</title><style>{css}</style></head>"
    f"<body><script>{js}</script></body></html>"
)
(d / "aetheris-prototype-v0.5.html").write_text(html, encoding="utf-8")
print(f"wrote aetheris-prototype-v0.5.html ({len(html):,} bytes)")
