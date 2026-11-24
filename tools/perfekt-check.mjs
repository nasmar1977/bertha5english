#!/usr/bin/env node
// =====================================================================
// Fehlerfinder für die Verbdaten des Perfekt-Baukastens (latein-perfekt.html)
//
//   node tools/perfekt-check.mjs        alle Prüfungen
//   node tools/perfekt-check.mjs -v     zusätzlich die Zählung je Gruppe
//
// Exit-Code 0 = sauber, 1 = mindestens ein FEHLER.
// Geprüft wird gegen das Vokabelheft in index.html (vokabelheftData), gegen das Wortschatz-Blatt der
// nächsten Klassenarbeit (vokabelheftData.ka1226) und gegen die Präsens- und Perfektformen, die dort
// schon für einzelne Verben hinterlegt sind (latinData).
// =====================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const laut = process.argv.includes('-v');

// ---- Perfekt-Baukasten: der reine Datenteil zwischen den Marken --------
const PERF = fs.readFileSync(path.join(ROOT, 'latein-perfekt.html'), 'utf8');
const a = PERF.indexOf('//#REIN-ANFANG'), e = PERF.indexOf('//#REIN-ENDE');
if (a < 0 || e < 0) { console.error('Marken //#REIN-ANFANG und //#REIN-ENDE nicht gefunden'); process.exit(1); }
const P = new Function(PERF.slice(a, e) + '\nreturn { VERBEN, SPAETER, ARBEIT, praes, impf, perf, infPf, pfad, pfadRoh, ohneM, alleFormen, TAB };')();
const { VERBEN, SPAETER, ARBEIT, praes, impf, perf, pfad, pfadRoh, ohneM } = P;

// ---- Vokabelheft und Trainingsdaten aus index.html ---------------------
const JS = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function constBlock(name) {
  const i = JS.indexOf('const ' + name + ' = ');
  let depth = 0; const start = JS.indexOf('{', i);
  for (let k = start; k < JS.length; k++) {
    if (JS[k] === '{') depth++;
    else if (JS[k] === '}' && --depth === 0) return JS.slice(start, k + 1);
  }
  throw new Error('unbalanciert: ' + name);
}
const { latinData, vokabelheftData } = new Function(`const latinData = ${constBlock('latinData')}; const vokabelheftData = ${constBlock('vokabelheftData')}; return { latinData, vokabelheftData };`)();

const found = [];
const err = (check, msg) => found.push({ lvl: 'FEHLER', check, msg });
const warn = (check, msg) => found.push({ lvl: 'WARNUNG', check, msg });
const info = (check, msg) => found.push({ lvl: 'HINWEIS', check, msg });

// =====================================================================
// 1  Grundform der Daten
// =====================================================================
const seen = new Set(), stems = new Map();
for (const v of VERBEN) {
  if (seen.has(v.inf)) err('doppelt', `${v.inf} steht zweimal in den Daten`); seen.add(v.inf);
  if (stems.has(v.ps)) err('doppelt', `${v.inf} und ${stems.get(v.ps)} haben denselben Perfektstamm ${v.ps}-`); stems.set(v.ps, v.inf);
  if ((v.z.match(/\+/g) || []).length > 1 || (v.z.match(/\[/g) || []).length !== (v.z.match(/\]/g) || []).length) err('zerlegung', `${v.inf}: Zerlegung „${v.z}“ ist nicht lesbar`);
  if (!/^[a-zāēīōū]+$/.test(v.ps)) err('zerlegung', `${v.inf}: Perfektstamm „${v.ps}“ enthält fremde Zeichen`);
  const kl = /^(ad|ab|de)?esse$|^posse$|^velle$|^nōlle$/.test(v.inf) ? 'x' : v.inf === 'dare' || /āre$/.test(v.inf) ? 'a' : /ēre$/.test(v.inf) ? 'e' : /īre$/.test(v.inf) ? 'i' : /ere$/.test(v.inf) ? (/iō$/.test(v.pr) ? 'ki' : 'k') : '?';
  if (kl !== v.k) err('konjugation', `${v.inf}, ${v.pr}: als „${v.k}“ eingetragen, die Formen sprechen für „${kl}“`);
  if (!v.de) err('bedeutung', `${v.inf}: Bedeutung fehlt`);
  const st = pfad(v), letzter = st[st.length - 1][0];
  if (pfadRoh(letzter) !== v.ps) err('weg', `${v.inf}: Der letzte Schritt des Wegs („${letzter}“) ergibt nicht den Perfektstamm ${v.ps}-`);
  if (st.some(s => !s[1])) err('weg', `${v.inf}: ein Schritt des Wegs hat keine Erklärung`);
  if (v.einzel && !v.n) err('hinweis', `${v.inf}: Einzelfall ohne Hinweis`);
  for (const f of [...praes(v), ...impf(v), ...perf(v)]) if (!f || /undefined|null/.test(f)) err('formen', `${v.inf}: unvollständige Form „${f}“`);
}

// =====================================================================
// 2  Untergruppen: In jeder gilt für ALLE Verben genau dieselbe Regel.
//    Und kein Einzelfall darf heimlich in eine Regel seiner Tabelle passen.
// =====================================================================
const LANG = { a: 'ā', e: 'ē', i: 'ī', o: 'ō', u: 'ū' };
const letzter = (s, re, fn) => { const m = [...s.matchAll(re)].pop(); return m ? s.slice(0, m.index) + fn(m[0]) + s.slice(m.index + m[0].length) : null; };
const REGEL = {
  o1: v => v.pr.slice(0, -1) + 'ī',                                   // -ō weg, -ī dran
  v1: v => v.inf.slice(0, -2) + 'vī',                                 // -re weg, -vī dran
  v2: v => v.inf.slice(0, -3) + 'īvī',                                // -ere weg, -īvī dran
  u1: v => /ēre$/.test(v.inf) ? v.inf.slice(0, -3) + 'uī' : null,     // -ēre weg, -uī dran
  u2: v => /(ere|īre)$/.test(v.inf) ? v.inf.slice(0, -3) + 'uī' : null,
  s1: v => /cere$/.test(v.inf) ? v.inf.slice(0, -4) + 'xī' : null,    // c + s = x
  s2: v => /dēre$/.test(v.inf) ? v.inf.slice(0, -4) + 'sī' : null,    // d fällt weg
  s3: v => /cēdere$/.test(v.inf) ? v.inf.replace(/cēdere$/, 'cessī') : null,
  s4: v => /mittere$/.test(v.inf) ? v.inf.replace(/mittere$/, 'mīsī') : null,
  d1: v => { const r = letzter(v.inf.slice(0, -3), /[aeiou]/g, c => LANG[c]); return r && r + 'ī'; },   // nur der Längenstrich
  d2: v => { const r = letzter(v.inf.slice(0, -3), /a/g, () => 'ē'); return r && r + 'ī'; },           // a → ē
  d3: v => { const r = letzter(v.inf.slice(0, -3), /i/g, () => 'ē'); return r && r + 'ī'; },           // i → ē
  d4: v => { const r = letzter(v.inf.slice(0, -3), /in/g, () => 'ī'); return r && r + 'ī'; },          // n fällt weg, i lang
  r1: v => /dere$/.test(v.inf) ? v.inf.replace(/dere$/, 'didī') : null,
  r2: v => /sistere$/.test(v.inf) ? v.inf.replace(/sistere$/, 'stitī') : null,
  // Zusammensetzung von cadere, currere, tangere: Vorsilbe + Perfekt des Grundverbs ohne die Verdopplungssilbe
  r3: v => { const g = VERBEN.find(x => x.inf === { accidere: 'cadere', occurrere: 'currere', attingere: 'tangere' }[v.inf]); return g ? v.inf.slice(0, 2) + g.ps.slice(2) + 'ī' : null; }
};
const gruppen = {};
for (const v of VERBEN) (gruppen[v.g] = gruppen[v.g] || []).push(v);
for (const [g, vs] of Object.entries(gruppen)) {
  if (REGEL[g]) for (const v of vs) { const soll = REGEL[g](v); if (soll !== v.pf) err('gruppenregel', `${v.inf} steht in Gruppe ${g}, aber die Regel ergibt „${soll}“ statt ${v.pf}`); }
  else if (!/E$/.test(g) && !['r0', 'x1', 'x2'].includes(g)) err('gruppenregel', `Gruppe ${g} hat keine Regel in perfekt-check.mjs`);
}
for (const v of VERBEN.filter(x => /E$/.test(x.g) || x.g === 'r0'))
  for (const [g, fn] of Object.entries(REGEL)) if (g[0] === v.t && fn(v) === v.pf) warn('gruppenregel', `${v.inf} gilt als Einzelfall, passt aber in die Regel der Gruppe ${g}`);
// Die Faustregel-Marke muss zur Konjugation passen
for (const v of VERBEN) {
  const erwartet = v.k === 'a' ? v.pf === v.inf.slice(0, -2) + 'vī' : v.k === 'e' ? v.pf === v.inf.slice(0, -3) + 'uī' : v.k === 'i' ? v.pf === v.inf.slice(0, -2) + 'vī' : false;
  if (erwartet !== v.regel) err('faustregel', `${v.inf}: als ${v.regel ? '' : 'nicht '}regelmäßig geführt, die Form ${v.pf} sagt das Gegenteil`);
}

// =====================================================================
// 3  Abgleich mit dem Vokabelheft (index.html)
//    Lektion 2 fehlt dort; ihre Verben sind von den Heft-Fotos abgeschrieben.
// =====================================================================
const istVerb = r => /^[^\s,]+(re|sse|lle)$/.test(r.w) && !/_[mfn]_|_Adv|_Präp|_Subj/.test(r.f);
const heft = {};   // Infinitiv → { erste: Lektion, pr, pf, pfL, d: [Bedeutungen] }
for (const ch of Object.keys(vokabelheftData).filter(k => /^chapter\d+$/.test(k))) {
  const lek = +ch.replace('chapter', '');
  for (const p of vokabelheftData[ch].packets) for (const r of p.rows) {
    if (!istVerb(r)) continue;
    const h = heft[r.w] = heft[r.w] || { erste: lek, pr: '', pf: '', pfL: 0, d: [] };
    h.erste = Math.min(h.erste, lek); h.d.push(r.d);
    const m = r.f.replace(/\n/g, ' ').match(/^([^\s,_(]+)(?:, ([^\s,_(]+))?/);
    if (m && m[1] && !h.pr) h.pr = m[1];
    if (m && m[2] && !h.pf) { h.pf = m[2]; h.pfL = lek; }
  }
}
const spaet = new Set(SPAETER.map(s => s[0]));
for (const [inf, h] of Object.entries(heft)) {
  const v = VERBEN.find(x => x.inf === inf);
  if (!v) { if (!spaet.has(inf)) err('heft-abgleich', `${inf} (Lektion ${h.erste}) steht im Vokabelheft, fehlt aber im Perfekt-Baukasten`); else if (h.pf) err('heft-abgleich', `${inf} gilt als „später“, das Heft nennt aber das Perfekt ${h.pf}`); continue; }
  if (h.pr && h.pr !== v.pr) err('heft-abgleich', `${inf}: 1. Person im Heft ${h.pr}, im Baukasten ${v.pr}`);
  if (h.pf && h.pf !== v.pf) err('heft-abgleich', `${inf}: Perfekt im Heft ${h.pf}, im Baukasten ${v.pf}`);
  if (h.pfL !== v.h) err('heft-abgleich', `${inf}: Das Heft nennt das Perfekt ${h.pfL ? 'in Lektion ' + h.pfL : 'gar nicht'}, eingetragen ist ${v.h || 'keine Lektion'}`);
  if (v.l !== h.erste && !(v.l === 2 && h.erste > 2)) err('heft-abgleich', `${inf}: erstes Vorkommen im Heft Lektion ${h.erste}, eingetragen ist Lektion ${v.l}`);
  const alle = h.d.join(' | ');
  for (const teil of v.de.split(', ')) if (!alle.includes(teil)) warn('heft-abgleich', `${inf}: Bedeutung „${teil}“ steht so nicht im Heft (${h.d[0]})`);
}
const L2 = VERBEN.filter(v => v.l === 2).map(v => v.inf);
for (const v of VERBEN) if (!heft[v.inf] && v.l !== 2) err('heft-abgleich', `${v.inf} (Lektion ${v.l}) steht nicht im Vokabelheft von index.html`);
// Lernstufe 1: Das Perfekt ist Lernstoff – es steht im Heft von Lektion 8 oder 9 oder auf dem Wortschatz-Blatt der Arbeit
for (const v of VERBEN) { const p = v.h === 8 || v.h === 9 || ARBEIT.blatt.includes(v.inf) ? 1 : v.l === 10 ? 3 : 2; if (p !== v.prio) err('lernstufe', `${v.inf}: Lernstufe ${v.prio}, erwartet ${p}`); }
for (const s of SPAETER) if (!heft[s[0]]) err('heft-abgleich', `${s[0]} (später) steht nicht im Vokabelheft`); else if (heft[s[0]].pr && heft[s[0]].pr !== s[1]) err('heft-abgleich', `${s[0]}: 1. Person im Heft ${heft[s[0]].pr}, eingetragen ${s[1]}`);

// =====================================================================
// 4  Stoff der Klassenarbeit: ARBEIT.blatt / ARBEIT.ohnePerfekt gegen das Wortschatz-Blatt,
//    das index.html als vokabelheftData.ka1226 führt (Zeilen wie { w:'accidere', f:'accidō, accidī' })
// =====================================================================
{
  const doppelt = a => a.filter((x, i) => a.indexOf(x) !== i);
  for (const inf of doppelt(ARBEIT.blatt.concat(ARBEIT.ohnePerfekt))) err('blatt', `${inf} steht zweimal in ARBEIT (blatt/ohnePerfekt)`);
  for (const inf of ARBEIT.blatt.concat(ARBEIT.ohnePerfekt)) if (!VERBEN.some(v => v.inf === inf)) err('blatt', `${inf} steht in ARBEIT, fehlt aber in den Verbdaten`);
  for (const v of VERBEN) if (v.arbeit !== ARBEIT.blatt.includes(v.inf)) err('blatt', `${v.inf}: Marke „für die Arbeit“ passt nicht zu ARBEIT.blatt`);
  const ka = vokabelheftData.ka1226;
  if (!ka) info('blatt-abgleich', 'index.html führt (noch) kein vokabelheftData.ka1226 – ARBEIT.blatt ist nicht gegen das Wortschatz-Blatt geprüft');
  else {
    const dort = new Map();   // Infinitiv → [1. Sg. Präsens, 1. Sg. Perfekt oder '']
    for (const p of ka.packets) for (const r of p.rows) {
      const m = istVerb(r) && r.f.replace(/\n/g, ' ').match(/^([^\s,_(]+(?:ō|um))(?:, ([^\s,_(]+))?/);
      if (m) dort.set(r.w, [m[1], m[2] || '']);
    }
    for (const [inf, [pr, pf]] of dort) {
      const v = VERBEN.find(x => x.inf === inf);
      if (!v) { if (pf) err('blatt-abgleich', `${inf} steht mit Perfekt ${pf} auf dem Wortschatz-Blatt, fehlt aber im Perfekt-Baukasten`); continue; }   // ohne Perfekt und nicht im Heft: kein Lernwort (crocīre)
      if (pr !== v.pr) err('blatt-abgleich', `${inf}: 1. Person auf dem Blatt ${pr}, im Baukasten ${v.pr}`);
      if (pf && pf !== v.pf) err('blatt-abgleich', `${inf}: Perfekt auf dem Blatt ${pf}, im Baukasten ${v.pf}`);
      const bed = (ka.packets.flatMap(p => p.rows).find(r => r.w === inf) || {}).d || '';
      if (pf && ARBEIT.de && ARBEIT.de[inf] !== bed.replace(/_/g, '')) err('blatt-abgleich', `${inf}: Bedeutung in ARBEIT.de „${ARBEIT.de[inf]}“, auf dem Wortschatz-Blatt „${bed.replace(/_/g, '')}“`);
      if (pf && !ARBEIT.blatt.includes(inf)) err('blatt-abgleich', `${inf} steht mit Perfekt auf dem Wortschatz-Blatt, fehlt aber in ARBEIT.blatt`);
      if (!pf && !ARBEIT.ohnePerfekt.includes(inf)) err('blatt-abgleich', `${inf} steht ohne Perfekt auf dem Wortschatz-Blatt, fehlt aber in ARBEIT.ohnePerfekt`);
    }
    for (const inf of ARBEIT.blatt) if (!dort.has(inf)) err('blatt-abgleich', `${inf} steht in ARBEIT.blatt, aber nicht auf dem Wortschatz-Blatt (ka1226)`); else if (!dort.get(inf)[1]) err('blatt-abgleich', `${inf} steht in ARBEIT.blatt, auf dem Wortschatz-Blatt aber ohne Perfekt`);
    for (const inf of ARBEIT.ohnePerfekt) if (!dort.has(inf)) err('blatt-abgleich', `${inf} steht in ARBEIT.ohnePerfekt, aber nicht auf dem Wortschatz-Blatt (ka1226)`); else if (dort.get(inf)[1]) err('blatt-abgleich', `${inf} steht in ARBEIT.ohnePerfekt, auf dem Wortschatz-Blatt aber mit Perfekt ${dort.get(inf)[1]}`);
  }
}

// =====================================================================
// 5  Abgleich mit den Formen, die index.html für einzelne Verben schon führt
// =====================================================================
// verglichen wird der Weg (v.weg): posse, velle und nōlle stehen in Tabelle 7, gelten aber als u-Perfekt
const TYP = { v: 'v', u: 'u', s: 's', dehn: 'd', red: 'r', ohne: 'o', irr: 'x' };
let verglichen = 0;
for (const ch of Object.keys(latinData)) for (const f of latinData[ch].verbForms || []) {
  const v = VERBEN.find(x => x.inf === f.infinitive); if (!v) continue;
  if (f.present && f.present.sg2) {
    const dort = [f.firstPerson, f.present.sg2, f.present.sg3, f.present.pl1, f.present.pl2, f.present.pl3], hier = praes(v); verglichen++;
    dort.forEach((x, i) => { if (x && x !== hier[i]) err('praesens-abgleich', `${v.inf}: ${['1. Sg.', '2. Sg.', '3. Sg.', '1. Pl.', '2. Pl.', '3. Pl.'][i]} in index.html ${x}, hier gebildet ${hier[i]}`); });
  }
  if (f.perfect && f.perfect !== v.pf) err('perfekt-abgleich', `${v.inf}: Perfekt in index.html ${f.perfect}, hier ${v.pf}`);
  if (f.perfectType && TYP[f.perfectType] !== v.weg) info('typ-abgleich', `${v.inf} (${ch}): in index.html als „${f.perfectType}“ geführt, hier ist der Weg „${v.weg}“`);
}

// ---- Ausgabe -------------------------------------------------------------
const zahl = l => found.filter(f => f.lvl === l).length;
for (const f of found) console.log(`${f.lvl.padEnd(8)} ${f.check.padEnd(18)} ${f.msg}`);
if (laut) for (const [g, vs] of Object.entries(gruppen)) console.log(`  ${g.padEnd(3)} ${String(vs.length).padStart(3)}  ${vs.slice(0, 6).map(v => v.inf).join(', ')}${vs.length > 6 ? ' …' : ''}`);
console.log(`\n${VERBEN.length} Verben (Lernstufe 1/2/3: ${[1, 2, 3].map(p => VERBEN.filter(v => v.prio === p).length).join('/')}; für die Arbeit: ${VERBEN.filter(v => v.arbeit).length}), ${Object.keys(gruppen).length} Gruppen, ` +
  `${Object.keys(heft).length} Verben im Vokabelheft, ${L2.length} aus Lektion 2 (nur Fotos), Präsens von ${verglichen} Verben gegengeprüft.`);
console.log(`${zahl('FEHLER')} Fehler, ${zahl('WARNUNG')} Warnungen, ${zahl('HINWEIS')} Hinweise`);
process.exit(zahl('FEHLER') ? 1 : 0);
