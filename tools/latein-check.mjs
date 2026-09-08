#!/usr/bin/env node
// =====================================================================
// Fehlerfinder für die Latein-Daten in index.html
//
//   node tools/latein-check.mjs            alle Kapitel
//   node tools/latein-check.mjs chapter8   nur ein Kapitel
//
// Exit-Code 0 = sauber, 1 = mindestens ein FEHLER.
// Jede Prüfung entspricht einem Fehler, der schon einmal live war —
// die Nummern in Klammern verweisen auf die Befundliste vom 08.09.2026.
// =====================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const JS   = HTML.match(/<script>([\s\S]*?)<\/script>/)[1];
const only = process.argv[2] || null;

// ---- Quelltext-Stücke herausschneiden --------------------------------
function block(sig) {
  const i = JS.indexOf(sig);
  if (i < 0) throw new Error('nicht gefunden: ' + sig);
  let depth = 0;
  for (let k = JS.indexOf('{', i); k < JS.length; k++) {
    if (JS[k] === '{') depth++;
    else if (JS[k] === '}' && --depth === 0) return JS.slice(i, k + 1);
  }
  throw new Error('unbalanciert: ' + sig);
}
function constBlock(name) {
  const i = JS.indexOf('const ' + name + ' = ');
  let depth = 0, start = JS.indexOf(JS[JS.indexOf('=', i) + 2] === '[' ? '[' : '{', i);
  const open = JS[start], close = open === '[' ? ']' : '}';
  for (let k = start; k < JS.length; k++) {
    if (JS[k] === open) depth++;
    else if (JS[k] === close && --depth === 0) return JS.slice(start, k + 1);
  }
  throw new Error('unbalanciert: ' + name);
}

const FN = ['stripMacrons','getEnding','commonStem','getNounStem','getLatinStem',
            'getVerbStem','getVerbForm','conjugateGermanSimple','getSnakeContext',
            'makeSnakeSentence','getGermanCaseForm','snakeNoEnding','nounKeyFitsStem']
  .filter(n => JS.includes('function ' + n + '('))
  .map(n => block('function ' + n + '(')).join('\n');

const env = new Function(`
  const macronMap = { 'ā':'a','ē':'e','ī':'i','ō':'o','ū':'u' };
  const latinData = ${constBlock('latinData')};
  const vokabelheftData = ${constBlock('vokabelheftData')};
  ${FN}
  return { latinData, vokabelheftData, ${
    FN.match(/function (\w+)\(/g).map(m => m.slice(9, -1)).join(', ')} };
`)();

const { latinData, vokabelheftData } = env;
const chapters = Object.keys(latinData).filter(c => !only || c === only);

// ---- Befund-Sammlung --------------------------------------------------
const found = [];
const err  = (check, msg, where='') => found.push({ lvl:'FEHLER',  check, msg, where });
const warn = (check, msg, where='') => found.push({ lvl:'WARNUNG', check, msg, where });
const info = (check, msg, where='') => found.push({ lvl:'HINWEIS', check, msg, where });

const NK = ['nom_sg','gen_sg','dat_sg','akk_sg','abl_sg','nom_pl','gen_pl','dat_pl','akk_pl','abl_pl'];
const VK = ['sg1','sg2','sg3','pl1','pl2','pl3','imp_sg','imp_pl'];
const snakeVerbs = ch => (latinData[ch].verbForms||[]).filter(v => v.present && v.imperative &&
  [v.firstPerson,v.present.sg2,v.present.sg3,v.present.pl1,v.present.pl2,v.present.pl3,
   v.imperative.sg,v.imperative.pl].every(f => f && !f.includes(' ')));
const snakeNouns = ch => (latinData[ch].nouns||[]).filter(n => NK.every(k => n[k]));

// =====================================================================
// 1  Schlange: Stamm + Endung muss die Zielform ergeben
//    und der Hinweistext muss der akzeptierten Antwort entsprechen
// =====================================================================
for (const ch of chapters) {
  for (const n of snakeNouns(ch)) {
    const st = env.getNounStem(n);
    for (const k of NK) {
      // Formen, die nicht mit dem Stamm anfangen, sind unregelmäßig gebildet
      // (Nom. Sg. von mercātor, lībertās …). Sie dürfen nicht abgefragt werden.
      if (env.nounKeyFitsStem && !env.nounKeyFitsStem(n, k, st)) {
        info('unregelmaessig', `${n[k]} lässt sich nicht als "${st}" + Endung schreiben — wird übersprungen`,
             `${ch} ${n.nom_sg} ${k}`);
        continue;
      }
      const e = env.getEnding(n[k], st);
      if (st + e !== n[k])
        err('stamm+endung', `"${st}"+"${e}" ergibt nicht ${n[k]}`, `${ch} ${n.nom_sg} ${k}`);
      if (e !== n[k].slice(st.length))
        err('hinweistext', `Hinweis "${n[k].slice(st.length)}" ≠ Antwort "${e}"`, `${ch} ${n.nom_sg} ${k}`);
      if (e === '') info('endungslos', `${n[k]} hat keine Endung (muss leer eingebbar sein)`, `${ch} ${n.nom_sg} ${k}`);
    }
    // Die Endungen müssen die des Paradigmas sein, nicht erfundene.
    const SOLL = {
      'a-Deklination':   { gen_sg:'ae', dat_sg:'ae', akk_sg:'am', abl_sg:'ā', gen_pl:'ārum', akk_pl:'ās' },
      'o-Deklination':   { gen_sg:'ī',  dat_sg:'ō',  akk_sg:'um', abl_sg:'ō', gen_pl:'ōrum', akk_pl:'ōs' },
      'kons. Deklination': { gen_sg:'is', dat_sg:'ī', akk_sg:'em', abl_sg:'e', gen_pl:'um', dat_pl:'ibus' },
    };
    const soll = SOLL[(n.declension||'').replace(/\s*\(.*\)/,'')];
    if (soll) for (const [k, wanted] of Object.entries(soll)) {
      if (!n[k] || !env.nounKeyFitsStem(n, k, st)) continue;
      const e = env.getEnding(n[k], st);
      // Neutra weichen im Akkusativ ab, das ist regelhaft
      if (k.startsWith('akk') && n.akk_sg === n.nom_sg) continue;
      if (e !== wanted)
        err('paradigma', `Endung "${e}" statt "${wanted}" (${n.declension})`, `${ch} ${n.nom_sg} ${k}`);
    }
  }
  for (const v of snakeVerbs(ch)) {
    const st = env.getVerbStem(v);
    for (const k of VK) {
      const f = env.getVerbForm(v, k); if (!f) continue;
      const e = env.getEnding(f, st);
      if (st + e !== f)
        err('stamm+endung', `"${st}"+"${e}" ergibt nicht ${f}`, `${ch} ${v.infinitive} ${k}`);
      if (e !== f.slice(st.length))
        err('hinweistext', `Hinweis "${f.slice(st.length)}" ≠ Antwort "${e}"`, `${ch} ${v.infinitive} ${k}`);
      if (e === '') info('endungslos', `${f} hat keine Endung`, `${ch} ${v.infinitive} ${k}`);
    }
  }
}

// =====================================================================
// 2  nom_sg === null darf nie in einen Aufgabentext oder Schlüssel geraten  (Befund 2)
// =====================================================================
for (const ch of chapters)
  for (const n of latinData[ch].nouns || [])
    if (!n.nom_sg && !n.label)
      err('nom_sg-null', `Pluraletantum ohne label → Aufgabe "null (${n.german})" und Schlüssel "…_null"`,
          `${ch} ${n.german}`);

// =====================================================================
// 3  Eindeutige IDs                                                     (Befund 4)
// =====================================================================
for (const ch of chapters) {
  const seen = {};
  for (const v of latinData[ch].vocabulary || []) {
    const id = 'v_' + (v.vid || v.latin);
    if (seen[id]) err('doppelte-id', `${id} doppelt: "${seen[id]}" und "${v.german}"`, ch);
    else seen[id] = v.german;
  }
  const nid = {};
  for (const n of latinData[ch].nouns || []) {
    const id = 'noun_' + (n.label || n.nom_sg || n.nom_pl);
    if (nid[id]) err('doppelte-id', `${id} doppelt`, ch); else nid[id] = 1;
  }
}
{ // Satz-IDs sind kapitelübergreifend
  const sid = {};
  for (const ch of Object.keys(latinData))
    for (const s of latinData[ch].sentences || []) {
      const id = 'sent_' + s.answer;
      if (sid[id] && sid[id] !== ch) warn('doppelte-id', `sent_${s.answer} in ${sid[id]} und ${ch}`, '');
      else sid[id] = ch;
    }
}

// =====================================================================
// 4  0→100: Abschnittsgrenzen müssen den "// Abschnitt"-Markern folgen   (Befund 3)
// =====================================================================
{
  const ld = HTML.indexOf('const latinData = {');
  const secs = {};
  const m = HTML.match(/introSections\s*=\s*\{([\s\S]*?)\n\s{8}\};/);
  const src = m ? m[1] : HTML;
  for (const ch of chapters) {
    const st = HTML.indexOf(ch + ': {', ld); if (st < 0) continue;
    const en = HTML.indexOf('multiWord:', st);
    let idx = 0; const real = [];
    for (const line of HTML.slice(st, en).split('\n')) {
      if (/\/\/\s*Abschnitt/.test(line)) real.push(idx);
      if (/\{\s*latin:/.test(line)) idx++;
    }
    if (!real.length) continue;
    const cm = src.match(new RegExp(ch + ':\\s*\\[([\\s\\S]*?)\\]\\s*,?\\s*\\n'));
    if (!cm) { info('abschnitte', `keine 0→100-Abschnitte hinterlegt (${real.length} Marker im Text)`, ch); continue; }
    const coded = [...cm[1].matchAll(/range:\s*\[(\d+),\s*(\d+)\]/g)].map(x => +x[1]);
    if (JSON.stringify(coded) !== JSON.stringify(real))
      err('abschnitte', `Grenzen hinterlegt ${JSON.stringify(coded)}, tatsächlich ${JSON.stringify(real)}`, ch);
  }
}

// =====================================================================
// 5  Distraktoren: keiner darf richtig sein                             (Befund 6, 12)
// =====================================================================
const norm = s => s.toLowerCase().replace(/[()]/g,'').split(/[,;/]| oder /).map(x=>x.trim()).filter(Boolean);
for (const ch of chapters) {
  for (const v of latinData[ch].vocabulary || []) {
    const right = new Set(norm(v.german));
    for (const d of v.distractors || []) {
      if (d.trim().toLowerCase() === v.german.trim().toLowerCase())
        err('distraktor', `Distraktor ist die richtige Antwort: "${d}"`, `${ch} ${v.latin}`);
      const shared = norm(d).filter(x => right.has(x) && x.length > 2);
      if (shared.length)
        warn('distraktor', `Distraktor "${d}" teilt Bedeutung "${shared.join('/')}" mit der Lösung`, `${ch} ${v.latin}`);
    }
    const dd = (v.distractors||[]).map(x=>x.toLowerCase());
    if (new Set(dd).size !== dd.length) err('distraktor', 'Distraktoren doppelt', `${ch} ${v.latin}`);
  }
  // Wörter des Kapitels, die dieselbe Bedeutung tragen → 0→100-Stufe 2 wird mehrdeutig
  const byMeaning = {};
  for (const v of latinData[ch].vocabulary || [])
    for (const m of norm(v.german)) (byMeaning[m] ||= []).push(v.latin);
  for (const [m, ws] of Object.entries(byMeaning))
    if (ws.length > 1 && m.length > 3)
      warn('mehrdeutig', `"${m}" ist Bedeutung von ${ws.join(' und ')} — Stufe 2 kann beides anbieten`, ch);
}

// =====================================================================
// 6  Buchstaben-Aufgaben: Leerzeichen / Sonderzeichen in der Lösung     (Befund 5)
// =====================================================================
for (const ch of chapters)
  for (const v of latinData[ch].vocabulary || [])
    if (/[ \/?]/.test(v.latin))
      info('buchstabenkacheln', `"${v.latin}" hat Leerzeichen/Sonderzeichen → wird auf Multiple Choice geleitet (nicht buchstabierbar)`, ch);

// =====================================================================
// 7  Deutsche Hilfssätze der Schlange                                   (Befund 1, 7, 8)
// =====================================================================
const TRENNBAR = /^(an|auf|ab|aus|ein|mit|nach|vor|zu|zurück|her|hin|weg|los|bei|fest|frei|statt|teil)(?=[a-zäöüß]{3,})/;
const UNTRENNBAR = new Set(['antworten','umringen','beabsichtigen','anbeten','bemerken','beginnen','besuchen','bewirtschaften']);
for (const ch of chapters)
  for (const v of snakeVerbs(ch)) {
    const ctx = env.getSnakeContext(v.infinitive) || {};
    if (ctx.deExplicit) continue;
    const clean = v.german.replace(/\s*\(.*?\)/g,'').replace(/^sich\s+/,'').replace(/\s+für$/,'').trim();
    if (/,/.test(v.german))
      err('deutsch', `german "${v.german}" ist eine Kommaliste → "${env.makeSnakeSentence(v,'sg1',env.getVerbForm(v,'sg1'),ctx).de}"`,
          `${ch} ${v.infinitive}`);
    if (TRENNBAR.test(clean) && !UNTRENNBAR.has(clean))
      err('deutsch', `"${clean}" hat ein trennbares Präfix → "${env.makeSnakeSentence(v,'sg1',env.getVerbForm(v,'sg1'),ctx).de}"`,
          `${ch} ${v.infinitive}`);
    // Stamm muss im erzeugten Satz unversehrt vorkommen
    const st = /en$/.test(clean) ? clean.replace(/en$/,'') : clean.replace(/n$/,'');
    for (const k of VK) {
      const de = env.makeSnakeSentence(v, k, env.getVerbForm(v,k), ctx).de;
      if (st.length > 3 && !de.toLowerCase().includes(st.toLowerCase()))
        err('deutsch', `Stamm "${st}" fehlt in "${de}"`, `${ch} ${v.infinitive} ${k}`);
    }
  }

// =====================================================================
// 8  Deutsche Genitiv-Hilfe der Nomen-Schlange                          (Befund 9)
// =====================================================================
if (env.getGermanCaseForm)
  for (const ch of chapters)
    for (const n of snakeNouns(ch)) {
      const g = env.getGermanCaseForm(n, 'gen_sg');
      const wort = g.replace(/^des\s+/, '');
      // Nach Zischlaut ist -es Pflicht — das ist zweifelsfrei falsch.
      if (/(s|ß|z|tz|x)s$/.test(wort)) err('genitiv', `"${g}" — nach s/ß/z/x steht -es`, `${ch} ${n.nom_sg}`);
      // Einsilber (eine Vokalgruppe) schwanken zwischen -s und -es. Nicht maschinell
      // entscheidbar, deshalb nur zur Sichtprüfung auflisten.
      else if (/s$/.test(wort) && (wort.slice(0,-1).match(/[aeiouäöüy]+/g)||[]).length === 1)
        info('genitiv-sicht', `"${g}" — Einsilber, -es prüfen (des ${wort.slice(0,-1)}es?)`, `${ch} ${n.nom_sg}`);
    }

// =====================================================================
// 9  Vokabelheft gegen Trainingsdaten                                   (Befund 11)
// =====================================================================
for (const ch of chapters) {
  const vh = vokabelheftData[ch]; if (!vh) continue;
  const heft = new Map();                       // ein Wort kann mehrfach vorkommen (L4: zwei "in")
  for (const p of vh.packets) for (const r of p.rows) {
    const k = env.stripMacrons(r.w.toLowerCase());
    (heft.get(k) || heft.set(k, []).get(k)).push(r);
  }
  const plain = t => t.replace(/_/g,'').replace(/\s*\(.*?\)/g,'').trim();   // Kursiv-Marker und Klammern raus
  for (const v of latinData[ch].vocabulary || []) {
    const rows = heft.get(env.stripMacrons(v.latin.toLowerCase()));
    if (!rows) { info('heft-abgleich', `"${v.latin}" steht nicht im Vokabelheft`, ch); continue; }
    if (!rows.some(r => r.w.replace(/[?]/g,'') === v.latin.replace(/[?]/g,'')))
      err('heft-abgleich', `Schreibweise: Heft "${rows[0].w}" ≠ Training "${v.latin}"`, ch);
    // Nur melden, wenn KEINE der Heft-Zeilen zu dieser Bedeutung passt.
    const passt = rows.some(r => {
      const a = norm(plain(r.d)); if (!a.length) return true;   // Heft ohne Klartext (z.B. "(unübersetzt)")
      return norm(plain(v.german)).every(x => a.some(y => y.includes(x) || x.includes(y)));
    });
    if (!passt) {
      const r = rows[0], a = norm(plain(r.d)), b = norm(plain(v.german));
      const fehlt = b.filter(x => !a.some(y => y.includes(x) || x.includes(y)));
      const zuviel = a.filter(x => !b.some(y => y.includes(x) || x.includes(y)));
      // Ersetzung (Heft hat etwas anderes) ist ein Fehler, bloßes Kürzen nur eine Warnung.
      (zuviel.length && fehlt.length ? err : warn)('heft-abgleich',
        `Training "${fehlt.join('/')}" ↔ Heft "${zuviel.join('/') || '—'}"  (Heft: "${plain(r.d)}")`,
        `${ch} ${v.latin}`);
    }
  }
}

// =====================================================================
// 10  Makronen-Konsistenz: dasselbe Wort überall gleich geschrieben
// =====================================================================
{
  const spell = {};
  const collect = (w, where) => {
    const k = env.stripMacrons(String(w).toLowerCase());
    if (!/^[a-zāēīōū]{4,}$/.test(k)) return;
    (spell[k] ||= new Map()).set(String(w).toLowerCase(), where);
  };
  for (const ch of Object.keys(latinData)) {
    for (const v of latinData[ch].vocabulary || []) collect(v.latin, ch+'/vocabulary');
    for (const v of latinData[ch].verbForms || []) collect(v.infinitive, ch+'/verbForms');
    for (const n of latinData[ch].nouns || []) collect(n.nom_sg, ch+'/nouns');
    for (const p of (vokabelheftData[ch]?.packets)||[]) for (const r of p.rows) collect(r.w, ch+'/vokabelheft');
  }
  for (const [k, variants] of Object.entries(spell))
    if (variants.size > 1)
      err('makronen', `"${k}" wird verschieden geschrieben: ` +
          [...variants].map(([v,w]) => `${v} (${w})`).join(', '), '');
}

// ---- Ausgabe ----------------------------------------------------------
const order = { FEHLER:0, WARNUNG:1, HINWEIS:2 };
found.sort((a,b) => order[a.lvl]-order[b.lvl] || a.check.localeCompare(b.check));
let last = '';
for (const f of found) {
  const head = f.lvl + ' · ' + f.check;
  if (head !== last) { console.log('\n' + head); last = head; }
  console.log('   ' + (f.where ? f.where.padEnd(28) : '').slice(0,28) + ' ' + f.msg);
}
const n = l => found.filter(f => f.lvl === l).length;
console.log(`\n${'='.repeat(70)}`);
console.log(`Kapitel: ${chapters.join(', ')}`);
console.log(`FEHLER ${n('FEHLER')}   WARNUNG ${n('WARNUNG')}   HINWEIS ${n('HINWEIS')}`);
console.log(n('FEHLER') === 0 ? 'Keine Fehler.' : 'Bitte die FEHLER beheben und erneut laufen lassen.');
process.exit(n('FEHLER') ? 1 : 0);
