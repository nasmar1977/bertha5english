#!/usr/bin/env python3
"""Erzeugt aus pauki-logo.svg (Quer-Logo, Original) die Bilder für Browser-Tab und Home-Bildschirm.

    python3 tools/pauki-assets.py

Schreibt neben index.html:
    pauki-eule.svg          nur die Eule, quadratisch, durchsichtig (Favicon in modernen Browsern)
    favicon-32.png          dieselbe Eule als PNG, 32 px (ältere Browser)
    apple-touch-icon.png    180 px, Eule auf Creme, ohne Durchsicht (iPhone/iPad „Zum Home-Bildschirm“)
    icon-192.png, icon-512.png   für manifest.webmanifest (Android), mit Rand für runde Masken

Die Eule und der Schriftzug stecken außerdem als Inline-SVG in den Seiten (Startseite und Kopfleisten);
die Formen dort stammen aus derselben Datei. Braucht Playwright für Python mit einem Chromium.
"""
import glob
import os
import re

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CREME = '#FFF4E6'


def eule_inhalt():
    """Die Formen der Eule aus dem Original-Logo (Koordinaten im eigenen Raster, ca. 28…172 × 24…186)."""
    s = open(os.path.join(ROOT, 'pauki-logo.svg'), encoding='utf-8').read()
    m = re.search(r'<g transform="translate\(7\.82 12\.42\) scale\(1\.1493\)">(.*?)</g>', s, re.S)
    if not m:
        raise SystemExit('pauki-logo.svg: Eule nicht gefunden')
    return m.group(1).strip()


def eule_svg(rand=0.0, grund=None):
    """Quadratische Eule. rand: Anteil Luft je Seite (0.2 = 20 %), grund: Hintergrundfarbe oder None."""
    x, y, g = 17, 21, 166                       # Quadrat um die Eule
    r = g * rand / (1 - 2 * rand) if rand else 0
    vb = f'{x - r:.1f} {y - r:.1f} {g + 2 * r:.1f} {g + 2 * r:.1f}'
    hg = f'<rect x="{x - r:.1f}" y="{y - r:.1f}" width="{g + 2 * r:.1f}" height="{g + 2 * r:.1f}" fill="{grund}"/>' if grund else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{hg}{eule_inhalt()}</svg>'


def chromium(p):
    try:
        return p.chromium.launch()
    except Exception:
        kand = sorted(glob.glob(os.path.expanduser('~/.cache/ms-playwright/chromium-*/chrome-linux/chrome')))
        if not kand:
            raise
        return p.chromium.launch(executable_path=kand[-1])


def main():
    with open(os.path.join(ROOT, 'pauki-eule.svg'), 'w', encoding='utf-8') as f:
        f.write(eule_svg() + '\n')
    pngs = [('favicon-32.png', 32, eule_svg(0.02), True),
            ('apple-touch-icon.png', 180, eule_svg(0.12, CREME), False),
            ('icon-192.png', 192, eule_svg(0.18, CREME), False),
            ('icon-512.png', 512, eule_svg(0.18, CREME), False)]
    with sync_playwright() as p:
        b = chromium(p)
        for name, px, svg, durchsichtig in pngs:
            page = b.new_page(viewport={'width': px, 'height': px})
            bild = svg.replace('<svg ', '<svg width="%d" height="%d" ' % (px, px), 1)
            page.set_content('<html><body style="margin:0;background:transparent">' + bild + '</body></html>')
            page.screenshot(path=os.path.join(ROOT, name), omit_background=durchsichtig,
                            clip={'x': 0, 'y': 0, 'width': px, 'height': px})
            page.close()
        b.close()
    print('ok: pauki-eule.svg, ' + ', '.join(n for n, *_ in pngs))


if __name__ == '__main__':
    main()
