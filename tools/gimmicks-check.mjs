#!/usr/bin/env node
// =====================================================================
// Fehlerfinder für die gemeinsame Spaß-Datei gimmicks.js (Konfetti, Schnee, Punkte-Leiste der Unterseiten)
//
//   node tools/gimmicks-check.mjs            alle Prüfungen
//   node tools/gimmicks-check.mjs --setzen   trägt den Fingerabdruck der Datei in alle Seiten ein (…gimmicks.js?v=…)
//
// Exit-Code 0 = sauber, 1 = mindestens ein FEHLER.
//
// Geprüft wird:
//   einbindung   Jede Seite bindet gimmicks.js genau einmal ein, mit einer gültigen Betriebsart (data-gim) und mit
//                dem Fingerabdruck der jetzigen Datei. Stimmt er nicht, holt der Browser nach einer Änderung noch
//                die alte Fassung aus seinem Zwischenspeicher – Seite und Spaß-Datei passen dann nicht zusammen.
//   betriebsart  „haupt“ nur in index.html; „voll“ nur auf Seiten mit Kopfleiste (.bar .in), die auch Antworten
//                melden (Gimmicks.antwort) – sonst steht die Punkte-Pille da und bewegt sich nie. Wie viele Stellen
//                einer Seite melden, steht unten in HAKEN: Fällt eine weg, fällt es auf.
//   Kommentare zählen nicht: Eine auskommentierte Einbindung ist keine.
//   abgleich     Was gimmicks.js aus index.html wiederholt, muss dort genauso stehen: Speicher-Schlüssel,
//                Server-Adresse der Liste „Gerade da“, Punkte je Antwort, Länge der Serie, Takt der Liste.
// =====================================================================
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const setzen = process.argv.includes('--setzen');
// Seiten, die nicht zum Trainer gehören und deshalb nichts einbinden müssen
const OHNE = new Set(['datenschutz.html', 'rocket-prototype.html']);
const ARTEN = new Set(['haupt', 'voll', 'knoepfe']);
// So viele Stellen melden auf diesen Seiten eine Antwort (Gimmicks.antwort). Kommt eine dazu oder fällt eine weg: hier nachziehen.
const HAKEN = { 'latein-arbeit.html': 4, 'latein-perfekt.html': 4 };
// HTML-Kommentare, Blockkommentare und Zeilenkommentare entfernen (ein // hinter einem Doppelpunkt ist eine Adresse)
const ohneKommentare = t => t.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');

let fehler = 0, warnungen = 0;
const err = (art, text) => { fehler++; console.log(`FEHLER   [${art}] ${text}`); };
const warn = (art, text) => { warnungen++; console.log(`WARNUNG  [${art}] ${text}`); };

const GIM = fs.readFileSync(path.join(ROOT, 'gimmicks.js'), 'utf8');
const abdruck = crypto.createHash('sha256').update(GIM).digest('hex').slice(0, 8);
try { new Function(GIM); } catch (e) { err('datei', `gimmicks.js lässt sich nicht lesen: ${e.message}`); }

// ---- einbindung, betriebsart ---------------------------------------
const TAG = /<script src="gimmicks\.js(?:\?v=([^"]*))?"(?: data-gim="([^"]*)")?><\/script>/g;
const seiten = fs.readdirSync(ROOT).filter(n => n.endsWith('.html')).sort();
let eingebunden = 0, gesetzt = 0;
for (const name of seiten) {
  const datei = path.join(ROOT, name);
  let html = fs.readFileSync(datei, 'utf8');
  const rein = ohneKommentare(html);
  const treffer = [...rein.matchAll(TAG)];
  // jede Einbindung zählt, in welcher Schreibweise auch immer (./gimmicks.js, mit defer …)
  const alle = (rein.match(/<script\b[^>]*\bsrc="[^"]*gimmicks\.js[^"]*"[^>]*>/g) || []).length;
  if (!treffer.length) {
    if (alle && !OHNE.has(name)) err('einbindung', `${name}: bindet gimmicks.js ein, aber nicht in der erwarteten Form <script src="gimmicks.js?v=…" data-gim="…"></script>`);
    else if (!OHNE.has(name)) err('einbindung', `${name}: bindet gimmicks.js nicht ein (oder die Seite gehört in die Liste OHNE in diesem Skript)`);
    continue;
  }
  eingebunden++;
  if (alle > 1) err('einbindung', `${name}: bindet gimmicks.js ${alle}-mal ein`);
  const [ganz, v, art] = treffer[0];
  if (!ARTEN.has(art)) err('betriebsart', `${name}: data-gim="${art ?? ''}" gibt es nicht (haupt, voll, knoepfe)`);
  if ((art === 'haupt') !== (name === 'index.html')) err('betriebsart', `${name}: data-gim="${art}" – „haupt“ gehört zu index.html und nur dorthin`);
  const haken = (rein.match(/Gimmicks\.antwort\(/g) || []).length;
  if (art === 'voll') {
    if (!/<div class="bar"><div class="in">/.test(rein)) err('betriebsart', `${name}: „voll“ braucht die Kopfleiste <div class="bar"><div class="in">`);
    if (!haken) err('betriebsart', `${name}: „voll“, aber die Seite meldet keine Antworten (Gimmicks.antwort) – die Punkte bewegen sich nie`);
    else if (HAKEN[name] === undefined) warn('betriebsart', `${name}: meldet an ${haken} Stellen Antworten – in HAKEN (dieses Skript) eintragen, damit ein fehlender Haken auffällt`);
    else if (haken !== HAKEN[name]) err('betriebsart', `${name}: meldet an ${haken} Stellen Antworten (Gimmicks.antwort), erwartet sind ${HAKEN[name]} – Haken verloren oder HAKEN nicht nachgezogen`);
    // der gemerkte Nachtmodus muss schon im Kopf gesetzt werden, sonst blitzt die Seite beim Wechsel hell auf
    if (!/<head>[\s\S]*sessionStorage\.getItem\('gimStand'\)[\s\S]*<\/head>/.test(rein)) err('betriebsart', `${name}: „voll“, aber im <head> fehlt die Zeile, die den gemerkten Nachtmodus (sessionStorage „gimStand“) sofort setzt`);
  } else if (haken) err('betriebsart', `${name}: meldet Antworten (Gimmicks.antwort), zeigt aber keine Punkte-Leiste (data-gim="${art}") – es würde nichts verbucht`);
  if (art === 'knoepfe' && !/<div class="bar"><div class="in">/.test(rein) && !/class="gim-hier"/.test(rein)) warn('betriebsart', `${name}: weder Kopfleiste (.bar .in) noch fester Platz (<div class="gim-hier">) – die zwei Knöpfe schweben dann bei jeder Breite unten links über dem Inhalt`);
  if (html.indexOf(ganz) < html.lastIndexOf('</main>') && html.includes('</main>')) warn('einbindung', `${name}: gimmicks.js steht vor dem Ende des Inhalts – gedacht ist die Zeile direkt vor </body>`);
  if (v !== abdruck) {
    if (setzen) {
      html = html.replace(TAG, (g, _v, a) => `<script src="gimmicks.js?v=${abdruck}"${a === undefined ? '' : ` data-gim="${a}"`}></script>`);
      fs.writeFileSync(datei, html); gesetzt++;
    } else err('einbindung', `${name}: bindet gimmicks.js?v=${v ?? ''} ein, die Datei hat jetzt den Fingerabdruck ${abdruck} → node tools/gimmicks-check.mjs --setzen`);
  }
}

// ---- abgleich mit index.html ---------------------------------------
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
// Wert einer Konstanten: steht allein hinter „const“ oder in einer Reihe, mit Komma getrennt (const A = 1, B = 2;)
const wert = (quelle, name) => { const m = new RegExp(`(?:const|,)\\s*${name}\\s*=\\s*('[^']*'|"[^"]*"|[^,;\\n]+)`).exec(quelle); return m ? m[1].trim().replace(/^"(.*)"$/, "'$1'") : null; };
const rechne = s => { try { return String(new Function(`return (${s});`)()); } catch (e) { return s; } };
const PAARE = [   // [Name in gimmicks.js, Name in index.html, was es ist]
  ['PUNKTE_KEY', 'PUNKTE_KEY', 'Speicher der Punkte'],
  ['NAME_KEY', 'NAME_KEY', 'Speicher des Vornamens'],
  ['GERAET_KEY', 'DEVICE_KEY', 'Speicher der Geräte-Kennung'],
  ['AUS_KEY', 'PRESENCE_OFF_KEY', 'Speicher „Liste ausgeschaltet“'],
  ['DA_API', 'PRESENCE_API', 'Server-Adresse der Liste „Gerade da“'],
  ['PUNKTE_JE_ANTWORT', 'PUNKTE_JE_ANTWORT', 'Punkte je richtiger Antwort'],
  ['SERIE_ZIEL', 'SERIE_ZIEL', 'Richtige in Folge bis zum großen Konfetti'],
  ['DA_TAKT_MS', 'PRESENCE_REFRESH_MS', 'Takt der Liste'],
  ['DA_ONLINE_MS', 'PRESENCE_ONLINE_MS', 'so lange gilt jemand als „online“'],
  ['DA_FENSTER_MS', 'PRESENCE_FENSTER_MS', 'so weit zurück zeigt die Liste'],
  ['AKTIV_MS', 'AKTIV_FENSTER_MS', 'so lange nach einer Antwort gilt jemand als „übt gerade“']
];
let verglichen = 0;
for (const [hier, dort, was] of PAARE) {
  const a = wert(GIM, hier), b = wert(INDEX, dort);
  if (a === null) { err('abgleich', `gimmicks.js: ${hier} nicht gefunden (${was})`); continue; }
  if (b === null) { err('abgleich', `index.html: ${dort} nicht gefunden (${was})`); continue; }
  verglichen++;
  if (rechne(a) !== rechne(b)) err('abgleich', `${was}: gimmicks.js hat ${hier} = ${a}, index.html hat ${dort} = ${b}`);
}
// Nachtmodus: im Haupttrainer steht die Fünf direkt im Code
const nacht = wert(GIM, 'NACHT_ZIEL');
if (nacht === null) err('abgleich', 'gimmicks.js: NACHT_ZIEL nicht gefunden');
else if (!new RegExp(`aprilStreak >= ${nacht}\\b`).test(INDEX)) err('abgleich', `Nachtmodus: gimmicks.js verlangt ${nacht} Richtige in Folge, index.html nicht (gesucht: „aprilStreak >= ${nacht}“)`);
// Der Haupttrainer verlässt sich auf diesen Aufruf
if (!/Gimmicks\.regen\('konfetti', \{ gross: true \}\)/.test(INDEX)) err('abgleich', 'index.html ruft das große Konfetti nicht mehr über Gimmicks.regen auf');

if (setzen) console.log(`Fingerabdruck ${abdruck} in ${gesetzt} Seite${gesetzt === 1 ? '' : 'n'} eingetragen.`);
console.log(`gimmicks.js (Fingerabdruck ${abdruck}), ${eingebunden} von ${seiten.length} Seiten binden sie ein, ${verglichen} Werte mit index.html verglichen.`);
console.log(`${fehler} Fehler, ${warnungen} Warnungen`);
process.exit(fehler ? 1 : 0);
