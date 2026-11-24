#!/usr/bin/env python3
"""Erzeugt latein-perfekt-tabellen.pdf aus latein-perfekt.html (?druck=1).

    python3 tools/perfekt-pdf.py            schreibt das PDF neben die HTML-Datei
    python3 tools/perfekt-pdf.py --pruefen  schreibt nichts, meldet nur Seitenzahl und Höhe je Blatt

Braucht Playwright für Python mit einem Chromium. Das PDF bettet die Schriften des Rechners ein,
auf dem es erzeugt wird. Nach jeder Änderung an den Verbdaten oder am Druck-Layout neu erzeugen
und mit einchecken – sonst zeigen Seite und PDF verschiedene Stände.
"""
import glob
import os
import re
import sys

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'file://' + os.path.join(ROOT, 'latein-perfekt.html') + '?druck=1'
ZIEL = os.path.join(ROOT, 'latein-perfekt-tabellen.pdf')
SEITE_MM = 297 - 2 * 11          # nutzbare Höhe: A4 minus die Ränder aus @page


def chromium(p):
    try:
        return p.chromium.launch()
    except Exception:                # Browser-Version passt nicht zur Bibliothek: einen vorhandenen nehmen
        kand = sorted(glob.glob(os.path.expanduser('~/.cache/ms-playwright/chromium-*/chrome-linux/chrome')))
        if not kand:
            raise
        return p.chromium.launch(executable_path=kand[-1])


def main():
    nur_pruefen = '--pruefen' in sys.argv
    with sync_playwright() as p:
        b = chromium(p)
        pg = b.new_page()
        fehler = []
        pg.on('pageerror', lambda e: fehler.append(str(e)))
        pg.goto(URL)
        pg.emulate_media(media='print')
        pg.set_viewport_size({'width': round(186 / 25.4 * 96), 'height': 1200})   # Satzspiegel 186 mm
        blaetter = pg.evaluate("""() => [...document.querySelectorAll('#druck .blatt')].map(b =>
            [b.querySelector('h2').textContent, Math.round(b.getBoundingClientRect().height / 96 * 25.4)])""")
        for titel, mm in blaetter:
            print(f'  {mm:4d} mm  {mm / SEITE_MM:4.2f} Seiten  {titel}')
        pdf = pg.pdf(format='A4', print_background=True, prefer_css_page_size=True)
        seiten = len(re.findall(rb'/Type\s*/Page[^s]', pdf))
        print(f'{len(blaetter)} Blätter, {seiten} Seiten, {len(pdf) // 1024} KB')
        if fehler:
            print('FEHLER auf der Seite:', fehler)
            sys.exit(1)
        if not nur_pruefen:
            with open(ZIEL, 'wb') as f:
                f.write(pdf)
            print('geschrieben:', ZIEL)
        b.close()


if __name__ == '__main__':
    main()
