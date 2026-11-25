#!/usr/bin/env node
// =====================================================================
// Fehlerfinder für latein-arbeit.html (Klassenarbeit Dezember: AcI und Übersetzen)
//
//   node tools/arbeit-check.mjs
//
// Liest den Daten-Block der Seite (zwischen //#REIN-ANFANG und //#REIN-ENDE) und gleicht ihn mit
// index.html (Set „ka1226“) und dem Perfekt-Baukasten ab. Exit-Code 0 = sauber, 1 = mindestens ein FEHLER.
// =====================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lies = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SEITE = lies('latein-arbeit.html');
const rein = SEITE.match(/\/\/#REIN-ANFANG[^\n]*\n([\s\S]*?)\/\/#REIN-ENDE/);
if (!rein) { console.error('REIN-Block nicht gefunden'); process.exit(1); }
const D = new Function(rein[1] + '\nreturn { LEX, VERBEN, infPf, ohneStrich, KOPF, KEINKOPF, ZEITEN, FAM, satz, FALL, alleSaetze, OHNE, TEXTE, teileSatz, lexZu, flach, bausteine, MARK_ALS, MARK_NICHT };')();

// index.html: latinData und vokabelheftData
const JS = lies('index.html').match(/<script>([\s\S]*?)<\/script>/)[1];
function constBlock(name) {
  const i = JS.indexOf('const ' + name + ' = '); let depth = 0;
  for (let k = JS.indexOf('{', i); k < JS.length; k++) { if (JS[k] === '{') depth++; else if (JS[k] === '}' && --depth === 0) return JS.slice(JS.indexOf('{', i), k + 1); }
}
const { latinData, vokabelheftData } = new Function(`const latinData = ${constBlock('latinData')}; const vokabelheftData = ${constBlock('vokabelheftData')}; return { latinData, vokabelheftData };`)();

const found = [];
const err = (c, m) => found.push(['FEHLER', c, m]), warn = (c, m) => found.push(['WARNUNG', c, m]);
const glatt = s => String(s || '').replace(/_/g, '').replace(/\n/g, ' ');

// 1  Wortliste = Vokabelheft „Klassenarbeit Dezember“
const heft = (vokabelheftData.ka1226 || { packets: [] }).packets.flatMap(p => p.rows.map(r => [r.w, glatt(r.f), glatt(r.d), p.label]));
const blatt = D.LEX.filter(e => e[3]);
if (!heft.length) err('wortliste', 'vokabelheftData.ka1226 fehlt in index.html');
const schluessel = e => e.join(' | ');
const hs = new Set(heft.map(schluessel)), bs = new Set(blatt.map(schluessel));
for (const e of blatt) if (!hs.has(schluessel(e))) err('wortliste', `steht hier, aber nicht (so) im Vokabelheft: ${schluessel(e)}`);
for (const e of heft) if (!bs.has(schluessel(e))) err('wortliste', `steht im Vokabelheft, aber nicht (so) hier: ${schluessel(e)}`);
if (blatt.length !== heft.length) err('wortliste', `${blatt.length} Einträge hier, ${heft.length} im Vokabelheft`);

// 2  Verben mit Perfekt = Perfekt-Übung des Sets = „Für die Arbeit“ im Baukasten
const vf = ((latinData.ka1226 || {}).verbForms || []).map(v => v.infinitive + ' ' + v.perfect).sort();
const hier = D.VERBEN.map(v => v.join(' ')).sort();
if (JSON.stringify(vf) !== JSON.stringify(hier)) err('verben', `Perfekt-Verben weichen ab: nur hier [${hier.filter(x => !vf.includes(x))}], nur im Set [${vf.filter(x => !hier.includes(x))}]`);
const bk = lies('latein-perfekt.html').match(/blatt:\s*\[([^\]]*)\]/);
if (!bk) warn('verben', 'ARBEIT.blatt im Perfekt-Baukasten nicht gefunden');
else { const b = [...bk[1].matchAll(/'([^']+)'/g)].map(m => m[1]).sort(), h = D.VERBEN.map(v => v[0]).sort();
  if (JSON.stringify(b) !== JSON.stringify(h)) err('verben', `Baukasten „Für die Arbeit“ weicht ab: nur hier [${h.filter(x => !b.includes(x))}], nur dort [${b.filter(x => !h.includes(x))}]`); }

// 3  Satzfamilien
const pf = Object.fromEntries(D.VERBEN), kopf = new Set(D.KOPF.map(k => k[0]));
for (const f of D.FAM) {
  if (!kopf.has(f.kv)) err('familie', `${f.k}: ${f.kv} ist nicht als Kopfverb geführt`);
  if (pf[f.inf[0]] && f.inf[1] !== D.infPf(pf[f.inf[0]])) err('familie', `${f.k}: Infinitiv Perfekt ${f.inf[1]} ≠ ${D.infPf(pf[f.inf[0]])} (aus ${pf[f.inf[0]]})`);
  if (!pf[f.inf[0]] && f.inf[1]) warn('familie', `${f.k}: ${f.inf[0]} steht nicht mit Perfekt auf dem Blatt, hat hier aber ${f.inf[1]}`);
  const n = f.inf[1] ? 4 : 2;
  if (f.d.filter(Boolean).length !== n || new Set(f.d.filter(Boolean)).size !== n) err('familie', `${f.k}: braucht ${n} verschiedene dass-Sätze`);
  if (!f.sub || !Array.isArray(f.hv) || f.hv.length !== 2 || f.hv[0] === f.hv[1]) err('familie', `${f.k}: Subjekt und zwei verschiedene Verbformen für den Hauptsatz nötig`);
  if (/^[A-ZĀĒĪŌŪ]/.test(f.s) && !/^(Aulus|Claudia|Gnaeus|Epidius|Mārcus)\b/.test(f.s)) err('familie', `${f.k}: Satzanfang klein schreiben, wenn es kein Name ist (${f.s.split(' ')[0]})`);
  for (const x of f.x || []) if (f.d.filter(Boolean).some(d => x.endsWith('dass ' + d))) err('familie', `${f.k}: Rollentausch-Fassung gleicht einer richtigen Fassung`);
  if (f.pr === f.vg[0]) err('familie', `${f.k}: Präsens und Vergangenheit des Kopfverbs sehen gleich aus (${f.pr})`);
}
for (const s of D.alleSaetze()) {
  const wo = `${s.f.k} ${s.zeit}/${s.zv}`;
  if (!(s.a >= 0 && s.b === s.inf && s.a < s.inf)) err('satz', `${wo}: Klammer ${s.a}–${s.b}, Infinitiv ${s.inf}`);
  if (s.kopf < 0 || (s.kopf >= s.a && s.kopf <= s.b)) err('satz', `${wo}: Kopfverb steht in der Klammer`);
  if ((s.zv === 'VZ') !== /isse$/.test(s.w[s.inf])) err('satz', `${wo}: ${s.w[s.inf]} passt nicht zu ${s.zv}`);
  if (!s.f.d[s.zi]) err('satz', `${wo}: keine Übersetzung für ${D.ZEITEN[s.zi]}`);
  if (!/^[A-ZĀĒĪŌŪ]/.test(s.w[0]) || s.h2.length !== 2 || !/^[A-ZÄÖÜ]/.test(s.h)) err('satz', `${wo}: Satzanfang nicht groß (${s.w[0]} / ${s.h})`);
  if (s.w.slice(1).some(w => /^(Tum|Subitō|Māter|Pater|Scīmus|Scīvimus)$/.test(w))) err('satz', `${wo}: Großschreibung mitten im Satz (${s.w.join(' ')})`);
}
for (const o of D.OHNE) {
  if (/isse$/.test(o.w[o.inf]) || !/(re|sse)$/.test(o.w[o.inf])) err('ohne', `${o.w.join(' ')}: Wort ${o.inf} ist kein Infinitiv Präsens`);
  const kv = o.kv.split(' ')[0];
  if (kopf.has(kv)) err('ohne', `${o.w.join(' ')}: ${kv} ist ein Kopfverb`);
  if (!blatt.some(e => e[0] === kv)) err('ohne', `${o.w.join(' ')}: ${kv} steht nicht auf dem Wortschatz-Blatt`);
  if (o.kopf < 0 || o.kopf >= o.w.length || o.inf === o.kopf) err('ohne', `${o.w.join(' ')}: Stelle des Prädikats stimmt nicht`);
  // die Form an der Stelle des Prädikats muss zu dem Verb gehören, das die Begründung nennt (posse: pot-, pos-)
  else { const fo = D.ohneStrich(o.w[o.kopf]).toLowerCase(), st = kv === 'posse' ? /^(pot|pos)/ : new RegExp('^' + D.ohneStrich(kv).slice(0, 5));
    if (!st.test(fo)) err('ohne', `${o.w.join(' ')}: „${o.w[o.kopf]}“ an der Stelle des Prädikats ist keine Form von ${kv}`); }
}

// 4  Texte
for (const t of D.TEXTE) {
  const benutzt = new Set();
  t.s.forEach((x, i) => {
    const wo = `${t.k} Satz ${i + 1}`, s = D.teileSatz(x.la);
    s.w.forEach((w, j) => {
      if (s.fn[j]) { benutzt.add(+s.fn[j]); if (+s.fn[j] > t.fuss.length) err('text', `${wo}: Fußnote ${s.fn[j]} gibt es nicht`); }
      // Namen stehen auch in der Wortliste (Aulus, Claudia …) – jedes Wort braucht also ein Stichwort
      if (!D.lexZu(s.key[j]).length) err('text', `${wo}: „${w}“ → Stichwort „${s.key[j]}“ steht nicht in der Wortliste`);
      // grobe Probe gegen ein vertauschtes Stichwort: Form und Stichwort beginnen gleich (esse: sum, est, erant, fuī)
      else { const fo = D.ohneStrich(w.replace(/[^A-Za-zĀĒĪŌŪāēīōū]/g, '')).toLowerCase(), an = s.key[j].split(/ \/ | /).map(k => D.ohneStrich(k)[0].toLowerCase());
        if (s.key[j] === 'esse' ? !/^[esf]/.test(fo) : !an.includes(fo[0])) err('text', `${wo}: „${w}“ passt nicht zum Stichwort „${s.key[j]}“`); }
      // Zusage der Lehrerin: Der Text der Arbeit hat den Wortschatz des Blatts. Die Übungstexte halten sich daran.
      if (D.lexZu(s.key[j]).length && !D.lexZu(s.key[j]).some(e => e[3])) err('wortschatz', `${wo}: „${w}“ (${s.key[j]}) steht nicht auf dem Wortschatz-Blatt`);
    });
    if (s.aci && !(s.inf === s.b && s.kopf >= 0 && (s.kopf < s.a || s.kopf > s.b))) err('text', `${wo}: AcI-Marken passen nicht (Klammer ${s.a}–${s.b}, Infinitiv ${s.inf}, Kopfverb ${s.kopf})`);
    if (!s.aci && s.inf >= 0 && !x.tipp) err('text', `${wo}: Infinitiv ohne AcI braucht eine Erklärung (tipp)`);
    if (!s.aci && / (dass|daß) /.test(x.de)) warn('text', `${wo}: Musterlösung hat einen dass-Satz, aber kein AcI ist markiert`);
    if (s.aci && !/, dass /.test(x.de)) err('text', `${wo}: AcI markiert, aber die Musterlösung hat keinen dass-Satz`);
    for (const [name, re] of x.bau) { try { new RegExp(re); } catch (e) { err('baustein', `${wo}: Muster „${re}“ ist ungültig`); } }
    // Bausteine mit Muster '.' prüfen nur ein Verbot (kein dass-Satz) – bei den Proben „mitten im Wort“ und „beliebiger Text“ zählen sie nicht
    const echte = t => D.bausteine(x, t).filter((b, i) => x.bau[i][1] !== '.');
    for (const b of x.bau) if (b[1] === '.' && !b[2]) err('baustein', `${wo}: Baustein „${b[0]}“ hat weder Muster noch Verbot`);
    if (!s.aci && s.inf >= 0 && !x.bau.some(b => b[2] && /dass/.test(b[2]))) warn('baustein', `${wo}: Infinitiv ohne AcI – ein dass-Satz sollte nicht durchgehen`);
    for (const b of D.bausteine(x, x.de)) if (!b.da) err('baustein', `${wo}: Musterlösung erfüllt den Baustein „${b.name}“ nicht`);
    for (const a of x.auch || []) {
      if (a.includes('…')) err('baustein', `${wo}: „auch“-Fassung bitte als ganzen Satz (${a})`);
      for (const b of D.bausteine(x, a)) if (!b.da) err('baustein', `${wo}: „${a}“ erfüllt den Baustein „${b.name}“ nicht`);
    }
    // Gegenproben: Was als falsch hinterlegt ist, darf nicht mit lauter Häkchen durchgehen
    for (const f of x.falsch || []) if (D.bausteine(x, f).every(b => b.da)) err('baustein', `${wo}: falsche Fassung geht durch: „${f}“`);
    if (!s.aci ? false : !(x.falsch || []).length) warn('baustein', `${wo}: AcI-Satz ohne Gegenprobe (falsch: […])`);
    // ohne „dass“ darf kein AcI-Satz durchgehen; Umschrift (ae, oe, ue, ss) und Kleinschreibung müssen gehen
    if (s.aci && D.bausteine(x, x.de.replace(/, dass /, ' ')).every(b => b.da)) err('baustein', `${wo}: geht auch ohne „dass“ durch`);
    const umschrift = x.de.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue');
    for (const v of [umschrift, x.de.toLowerCase(), x.de.normalize('NFD')]) for (const b of D.bausteine(x, v)) if (!b.da) err('baustein', `${wo}: „${v}“ erfüllt den Baustein „${b.name}“ nicht`);
    // ein angehängter Buchstabe an jedem Wort (weint → weinte) darf nicht durchgehen: Muster brauchen Wortgrenzen
    if (echte(x.de.replace(/([a-zäöüß]+)/gi, '$1x')).some(b => b.da)) warn('baustein', `${wo}: ein Muster trifft auch mitten im Wort (${echte(x.de.replace(/([a-zäöüß]+)/gi, '$1x')).filter(b => b.da).map(b => b.name).join(' · ')})`);
    if (echte('Ich weiß es nicht.').some(b => b.da)) warn('baustein', `${wo}: ein Baustein passt auf beliebigen Text`);
  });
  t.fuss.forEach((_, i) => { if (!benutzt.has(i + 1)) err('text', `${t.k}: Fußnote ${i + 1} wird nicht benutzt`); });
}

// 5  Markieren im Vokabelheft: Was sich markieren lässt, muss im Set auch geübt werden (sonst verschwindet die Marke nie)
{
  const geuebt = new Set(((latinData.ka1226 || {}).vocabulary || []).map(v => v.latin));
  for (const e of blatt) {
    if (e[3] === '10') continue;                                  // hochgestellte 0: wird nie markiert
    const ziel = D.MARK_ALS[e[0]] || e[0];
    if (!D.MARK_NICHT.includes(ziel) && !geuebt.has(ziel)) err('markieren', `${e[0]} lässt sich markieren, wird im Set aber nicht geübt`);
  }
  for (const k of Object.values(D.MARK_ALS).concat(Object.keys(D.MARK_ALS), D.MARK_NICHT)) if (!blatt.some(e => e[0] === k)) err('markieren', `${k} steht in MARK_ALS/MARK_NICHT, aber nicht in der Wortliste`);
}

// ---- Ausgabe ----
for (const [lvl, c, m] of found) console.log(`${lvl.padEnd(8)} ${c.padEnd(10)} ${m}`);
const n = l => found.filter(f => f[0] === l).length;
console.log(`\n${blatt.length} Wörter, ${D.VERBEN.length} Verben mit Perfekt, ${D.FAM.length} Satzfamilien (${D.alleSaetze().length} Sätze), ${D.OHNE.length} Sätze ohne AcI, ${D.TEXTE.length} Texte (${D.TEXTE.map(t => t.s.length).join(' + ')} Sätze).`);
console.log(`${n('FEHLER')} Fehler, ${n('WARNUNG')} Warnungen`);
process.exit(n('FEHLER') ? 1 : 0);
