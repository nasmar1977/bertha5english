/* =====================================================================
   gimmicks.js – die Spaß-Teile für alle Seiten des Trainers

   Konfetti (der Staubsauger räumt auf) und Schnee (der Schneeschieber räumt auf) gibt es nur als Belohnung:
   Die zwei Knöpfe sind gesperrt, bis zehn Richtige in Folge geschafft sind. Dann leuchten sie und die Punkte-Pille;
   ein Tipp auf einen der drei löst die Belohnung ein (Pille: das große Konfetti), und die Serie beginnt von vorn.
   Deshalb stehen die Knöpfe nur dort, wo es Punkte gibt: im Haupttrainer und auf den Unterseiten mit Leiste.
   Die Unterseiten mit Leiste bekommen zusätzlich, was der Haupttrainer oben zeigt: Punkte mit Serie, die Liste
   „Gerade da“ und den Nachtmodus, den man sich mit fünf Richtigen in Folge verdient.

   Einbinden (am Ende von <body>):
     <script src="gimmicks.js?v=…" data-gim="haupt"></script>     index.html: nur Regen und die zwei Knöpfe (neben der
                                                                  Punkte-Pille); Punkte, Serie, Liste, Nachtmodus hat sie
                                                                  selbst und sagt über window.gimmicksHaupt, ob die
                                                                  Belohnung frei ist ({ frei, einloesen, hinweis })
     <script src="gimmicks.js?v=…" data-gim="voll"></script>      Unterseiten mit Kopfleiste (.bar .in):
                                                                  Punkte, Knöpfe, „Gerade da“, Nachtmodus
     <script src="gimmicks.js?v=…" data-gim="knoepfe"></script>   Seiten ohne Punkte: zeigt nichts (ohne Punkte keine
                                                                  Belohnung). Bekommt eine solche Seite Aufgaben, wird sie
                                                                  „voll“ und meldet ihre Antworten.
   Im Haupttrainer sitzen die zwei Knöpfe am Handy (bis 700 px) unten links in der Ecke. Die Leiste der Unterseiten
   steht am Handy (bis 743 px) in einer eigenen Zeile unter der Kopfleiste, damit die klebende Kopfleiste nicht
   doppelt so hoch wird.
   Das v=… ist der Fingerabdruck dieser Datei: Nach jeder Änderung hier „node tools/gimmicks-check.mjs --setzen“
   aufrufen, sonst holt sich der Browser noch die alte Fassung aus dem Zwischenspeicher.
   Für die Seite:
     Gimmicks.antwort(true | false)   eine Antwort verbuchen (Punkte, Serie, Nachtmodus-Zähler) – wirkt nur, wo die
                                      Leiste steht ("voll"); mit zweiter Angabe 0: Serie ja, Punkte nein
     Gimmicks.aktiv()                 „hier wird gerade geübt“, ohne Punkte und Serie anzufassen (für die Liste „Gerade da“)
     Gimmicks.regen('konfetti' | 'schnee', { gross: true })      liefert false, wenn gerade schon ein Regen läuft
     Gimmicks.auffrischen()           Haupttrainer: Die Belohnung ist frei geworden oder verbraucht – Knöpfe neu zeichnen

   Speicher, mit dem Haupttrainer geteilt: punkteGesamt, vokabelVorname, vokabelGeraeteId, vokabelAnwesenheitAus.
   Fehlt diese Datei, laufen alle Seiten trotzdem – sie fragen vor jedem Aufruf nach window.Gimmicks.
   ===================================================================== */
(function () {
  'use strict';
  if (window.Gimmicks) return;
  const skript = document.currentScript;
  const MODUS = (skript && skript.dataset.gim) || 'knoepfe';
  const lesen = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const schreiben = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };      // false: Speicher gesperrt oder voll – gilt dann nur für diese Seite
  const el = (tag, klasse, html) => { const e = document.createElement(tag); if (klasse) e.className = klasse; if (html) e.innerHTML = html; return e; };
  const medium = q => !!(window.matchMedia && window.matchMedia(q).matches);

  // ===================================================================
  // Stil
  // ===================================================================
  document.head.appendChild(el('style', '', `
#konfettiCanvas{position:fixed;left:0;top:0;pointer-events:none;z-index:3000}
.konfetti-sonde{position:fixed;bottom:0;height:0;padding-bottom:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none}
.gim-spass{display:flex;gap:8px;align-items:center}
.gim-k{position:relative;flex:0 0 auto;width:46px;height:46px;border-radius:50%;border:none;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;
  font-family:inherit;font-size:22px;line-height:1;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.2);transition:transform .2s ease,box-shadow .2s ease,opacity .2s ease;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
@media (hover:hover){.gim-k:hover{transform:translateY(-2px);box-shadow:0 5px 14px rgba(0,0,0,.28)}}      /* am Tablet bliebe der Schwebe-Zustand nach dem Tippen kleben */
.gim-k:focus-visible,.gim-pill:focus-visible{outline:3px solid #5a4fcf;outline-offset:3px;box-shadow:0 0 0 3px #fff}
.gim-k.konfetti{background:linear-gradient(135deg,#f472b6 0%,#8b5cf6 100%)}
.gim-k.schnee{background:linear-gradient(135deg,#7dd3fc 0%,#2563eb 100%)}
.gim-k:disabled,.gim-k.gesperrt{opacity:.45;cursor:default;transform:none;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.gim-k.gesperrt{filter:grayscale(55%)}
/* Belohnung frei: Die zwei Knöpfe leuchten und pulsieren wie die Pille „Konfetti!“ */
.gim-k.konfetti.bereit{box-shadow:0 0 14px rgba(236,72,153,.75),0 2px 6px rgba(0,0,0,.2);animation:gimPuls 1.6s ease-in-out infinite}
.gim-k.schnee.bereit{box-shadow:0 0 14px rgba(59,130,246,.8),0 2px 6px rgba(0,0,0,.2);animation:gimPuls 1.6s ease-in-out infinite}
.gim-spass.inleiste{margin-left:12px}           /* Haupttrainer: Abstand zum Abzeichen „10/10“ der Punkte-Pille, auch wenn sie pulsiert */
/* Ecke unten links: am Handy (oben ist kein Platz mehr) und auf Seiten ohne Kopfleiste. Damit die Knöpfe nichts auf
   Dauer verdecken, bekommt die Seite unten so viel Luft, dass sich alles über sie hinwegschieben lässt. */
.gim-spass.ecke{position:fixed;left:max(12px,env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:19;margin:0}
.gim-spass.ecke .gim-k{width:42px;height:42px;font-size:20px}
.gim-spass.ecke .gim-k:not(:disabled):not(.gesperrt){opacity:.94}      /* gesperrt bleibt blass */
html.gim-platz{padding-bottom:calc(62px + env(safe-area-inset-bottom,0px))}
/* Leiste der Unterseiten: rechts in der Kopfleiste; bis 743 px in einer eigenen Zeile darunter (.gim-zeile), die mitrollt */
.gim-leiste{position:relative;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px 8px;align-items:center;margin-left:auto;max-width:100%;font-family:Verdana,system-ui,sans-serif}
.gim-leiste .gim-k{width:40px;height:40px;font-size:19px}
.gim-zeile{display:none;max-width:860px;margin:0 auto;padding:10px max(16px,env(safe-area-inset-right,0px)) 0 max(16px,env(safe-area-inset-left,0px))}
.gim-zeile.an{display:flex}
@media (max-width:374px){.gim-leiste{gap:10px 6px}.gim-pill{margin-right:4px}}
@media (max-width:339px){.gim-leiste{gap:8px 4px}.gim-leiste .gim-k{width:36px;height:36px;font-size:17px}.gim-pill{height:36px;margin-right:2px;padding:0 10px 0 8px}}      /* 320 px: sonst bräche die Leiste um */
@media (max-width:480px){.gim-pill.bereit .gim-zahl{display:none}}      /* „Konfetti!“ braucht den Platz der Zahl */
.gim-pill{position:relative;flex:0 0 auto;height:40px;padding:0 14px 0 10px;margin-right:8px;border:none;border-radius:20px;display:flex;align-items:center;gap:6px;cursor:pointer;
  background:linear-gradient(135deg,#ffd54f 0%,#ff9800 100%);color:#4a2c00;font-family:inherit;font-size:16px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.2);touch-action:manipulation}
.gim-pill svg{width:18px;height:18px;flex-shrink:0}
.gim-pill .gim-kt{display:none}
.gim-abz{position:absolute;bottom:-8px;right:-8px;background:#455a64;color:#fff;border-radius:12px;padding:1px 6px;font-size:11px;font-weight:700;line-height:1.4;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.gim-pill.bereit{color:#fff;background:linear-gradient(135deg,#ec4899 0%,#8b5cf6 50%,#3b82f6 100%);box-shadow:0 0 16px rgba(236,72,153,.7),0 2px 6px rgba(0,0,0,.2);animation:gimPuls 1.6s ease-in-out infinite}
.gim-pill.bereit .gim-kt{display:inline}
.gim-pill.bereit .gim-abz{background:#be185d}
@keyframes gimPuls{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.gim-plus{position:absolute;left:30px;top:2px;pointer-events:none;font-weight:700;color:#16a34a;text-shadow:0 1px 0 #fff;animation:gimPlus .9s ease-out forwards}
@keyframes gimPlus{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(24px)}}
@media (prefers-reduced-motion:reduce){.gim-pill.bereit,.gim-k.nacht.bereit,.gim-k.konfetti.bereit,.gim-k.schnee.bereit{animation:none}.gim-plus{animation-duration:.01s}}
/* ein Hinweis-Feld für die ganze Leiste: hängt rechts unter ihr und bleibt so auch am Handy im Bild */
.gim-tip{position:absolute;top:calc(100% + 10px);right:0;z-index:40;width:min(270px,calc(100vw - 24px));background:#263238;color:#fff;padding:9px 13px;border-radius:10px;font-size:13px;font-weight:400;line-height:1.35;text-align:left;
  border:1px solid rgba(255,255,255,.16);box-shadow:0 4px 14px rgba(0,0,0,.3);opacity:0;pointer-events:none;transform:translateY(-4px);transition:opacity .15s ease,transform .15s ease}
.gim-tip.an{opacity:1;transform:none}
.gim-k.da{background:linear-gradient(135deg,#7e8ff5 0%,#5a4fcf 100%)}
.gim-k.da.aus{background:linear-gradient(135deg,#b0bec5 0%,#546e7a 100%)}
.gim-k.nacht{background:linear-gradient(135deg,#cfd8dc 0%,#90a4ae 100%);opacity:.6;filter:grayscale(60%);cursor:not-allowed}
.gim-k.nacht.an{opacity:1;filter:none;background:linear-gradient(135deg,#3949ab 0%,#1a237e 100%)}
.gim-k.nacht.bereit{cursor:pointer;opacity:1;filter:none;background:linear-gradient(135deg,#ffd54f 0%,#ff8f00 100%);box-shadow:0 0 16px rgba(255,179,0,.8),0 2px 6px rgba(0,0,0,.2);animation:gimPuls 1.6s ease-in-out infinite}
.gim-k.nacht.bereit.an{background:linear-gradient(135deg,#7e57c2 0%,#3949ab 100%)}
.gim-k.nacht.bereit .gim-abz{background:#e65100}
/* Gerade da: breit steht die Liste links neben der Seite, sonst klappt sie unter dem Knopf auf */
.gim-da{display:none;position:fixed;left:16px;top:50%;transform:translateY(-50%);width:176px;z-index:50;background:rgba(255,255,255,.95);color:#333;border-radius:18px;padding:14px 14px 10px;
  box-shadow:0 10px 30px rgba(0,0,0,.22);font-family:Verdana,system-ui,sans-serif;font-size:15px;line-height:1.4}
.gim-da.an{display:block}
.gim-da h6{margin:0 0 10px;font-size:11px;font-weight:400;letter-spacing:.08em;text-transform:uppercase;color:#8a8a9e;text-align:center}
.gim-da .liste{max-height:60vh;overflow-y:auto}
.gim-da .zeile{display:flex;align-items:center;gap:7px;padding:5px 0}
.gim-da .punkt{flex:0 0 auto;width:9px;height:9px;border-radius:50%;background:#c8ccd6}
.gim-da .zeile.online .punkt{background:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,.18)}
.gim-da .name{flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gim-da .zeile.ich .name{font-weight:700;color:#5a4fcf}
.gim-da .zeit{flex:0 0 auto;color:#9aa0ae;font-size:12px}
.gim-da .notiz{margin-top:10px;padding-top:8px;border-top:1px solid #ececf2;font-size:11px;color:#9aa0ae;text-align:center}
.gim-da .notiz:empty{display:none}
.gim-da .ausknopf{display:none;margin:8px auto 0;padding:4px 8px;border:0;background:none;font:inherit;font-size:11px;color:#8a8a9e;text-decoration:underline;cursor:pointer}
@media (max-width:1259px){
  .gim-da.an{display:none}
  .gim-da.an.offen{display:block;top:64px;left:auto;right:12px;transform:none;width:min(230px,72vw);z-index:60}   /* top setzt das Skript unter den Knopf */
  .gim-da .ausknopf{display:block}
}
:root[data-theme="dark"] .gim-da{background:rgba(27,35,33,.96);color:#e6ecea}
:root[data-theme="dark"] .gim-da .notiz{border-top-color:#33403c}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .gim-da{background:rgba(27,35,33,.96);color:#e6ecea}:root:not([data-theme="light"]) .gim-da .notiz{border-top-color:#33403c}}
@media print{.gim-spass,.gim-leiste,.gim-zeile,.gim-da,#konfettiCanvas{display:none!important}html.gim-platz{padding-bottom:0!important}}
`));

  // ===================================================================
  // REGEN – Konfetti mit Staubsauger, Schnee mit Schneeschieber (alles gezeichnet)
  // Die Teile fallen, bleiben am Boden liegen, dann fährt das Gerät von rechts nach links durch und räumt auf.
  // Es läuft immer nur ein Regen; solange sind die Knöpfe gesperrt.
  // ===================================================================
  let laeuft = false;
  const knoepfe = [];

  function regen(art, opt) {
    opt = opt || {};
    if (laeuft || document.getElementById('konfettiCanvas')) return false;
    laeuft = true; knoepfeAuffrischen();
    const schnee = art === 'schnee';
    const ruhig = medium('(prefers-reduced-motion: reduce)');
    const c = document.createElement('canvas');
    c.id = 'konfettiCanvas';
    c.setAttribute('aria-hidden', 'true');
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    if (!ctx) { c.remove(); laeuft = false; knoepfeAuffrischen(); return false; }      // kein Zeichenfeld zu bekommen: dann eben kein Regen
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const sonde = el('div', 'konfetti-sonde');
    document.body.appendChild(sonde);
    let W = 0, H = 0, teile = [];
    const groesse = () => {
      // iOS: 100vh reicht hinter die Leiste – der Boden ist das, was man wirklich sieht
      const vv = window.visualViewport;
      W = Math.round(vv ? vv.width : window.innerWidth);
      H = Math.round(vv ? vv.height : window.innerHeight);
      H -= sonde.offsetHeight;               // über dem Home-Balken landen (safe-area unten)
      c.style.width = W + 'px'; c.style.height = H + 'px';
      c.style.top = (vv ? vv.offsetTop : 0) + 'px'; c.style.left = (vv ? vv.offsetLeft : 0) + 'px';
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Beim Drehen: was schon liegt, rutscht auf den neuen Boden
      teile.forEach(t => { if (t.liegt && !t.saug && !t.schub) t.y = H - t.abstand; });
    };
    groesse();
    window.addEventListener('resize', groesse);
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', groesse); window.visualViewport.addEventListener('scroll', groesse); }

    const FARBEN = ['#ef4444', '#f59e0b', '#facc15', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    // Falltempo an die Höhe gekoppelt: Auf hohen Schirmen (iPad hochkant) fällt alles entsprechend schneller. So liegt
    // alles, bevor das Gerät kommt – sonst spränge der Rest in einem einzigen Bild auf den Boden.
    const fall = Math.max(1, H / (schnee ? 660 : 860));
    // Flocken: bläulich gefüllt – weiß auf einer hellen Seite oder Karte sähe aus wie Ringe. Weiß sind sie nur auf
    // wirklich dunklem Grund (Nachtmodus). Maßgeblich ist der Grund der Seite (bei einem Verlauf dessen erste Farbe).
    const dunklerGrund = (() => {
      const st = getComputedStyle(document.body), quelle = (st.backgroundImage && st.backgroundImage !== 'none' ? st.backgroundImage : st.backgroundColor) || '';
      const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(quelle);
      return !!m && (m[4] === undefined || +m[4] > 0.5) && (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) < 90;
    })();
    const FLOCKE = dunklerGrund ? '#fff' : '#d6e6ff', FLOCKENRAND = dunklerGrund ? 'rgba(59,102,170,.5)' : 'rgba(37,99,235,.6)';
    const dichte = Math.round(W * H / 3200) * (opt.gross ? 1.5 : 1) * (schnee ? 1.15 : 1);
    const anzahl = ruhig ? 60 : Math.max(120, Math.min(opt.gross ? 480 : 360, Math.round(dichte)));
    for (let i = 0; i < anzahl; i++) {
      const t = schnee
        ? { x: Math.random() * W, y: -10 - Math.random() * H * 0.9, vx: (Math.random() - 0.5) * 0.6, vy: (0.5 + Math.random() * 1.1) * fall,
            r: 1.6 + Math.random() * 3.4, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.04, phase: Math.random() * Math.PI * 2,
            abstand: 1 + Math.random() * Math.random() * 16 }
        : { x: Math.random() * W, y: -10 - Math.random() * H * 0.9, vx: (Math.random() - 0.5) * 1.4, vy: (1 + Math.random() * 2) * fall,
            w: 6 + Math.random() * 6, h: 3 + Math.random() * 3, rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.25,
            farbe: FARBEN[i % FARBEN.length], rund: Math.random() < 0.25, stern: !!opt.gross && i % 9 === 0,
            phase: Math.random() * Math.PI * 2, abstand: 2 + Math.random() * 12 };
      t.liegt = false; t.weg = false; t.saug = 0; t.schub = false;
      if (schnee) t.kristall = t.r > 3.6 && Math.random() < 0.5;
      if (ruhig) { t.liegt = true; t.y = H - t.abstand; t.rot = 0; }
      teile.push(t);
    }

    const geraet = { x: 0, aktiv: false, start: 0, geschoben: 0 };
    // Tempo des Geräts (Pixel je Bild): auf breiten Schirmen schneller, damit die Fahrt überall ähnlich lange dauert
    const tempo = ruhig ? Math.max(6, W / 140) : Math.max(schnee ? 2 : 2.1, W / 420);
    let beendet = false;
    const t0 = performance.now();
    let zuletzt = t0;

    function zeichneKonfetti(t, s) {
      ctx.save();
      ctx.translate(t.x, t.y); ctx.rotate(t.rot); ctx.scale(s, s);
      ctx.fillStyle = t.stern ? '#fbbf24' : t.farbe;
      if (t.stern) {                        // kleiner Stern im großen Konfetti (nach einer vollen Serie)
        ctx.beginPath();
        for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.6 : 6.2, a = i * Math.PI / 5; ctx.lineTo(Math.sin(a) * r, -Math.cos(a) * r); }
        ctx.closePath(); ctx.fill();
      } else if (t.rund) { ctx.beginPath(); ctx.arc(0, 0, t.h, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-t.w / 2, -t.h / 2, t.w, t.h);
      ctx.restore();
    }
    // Flocke: weiß mit blauem Rand, damit man sie auf hellem wie auf dunklem Grund sieht
    function zeichneFlocke(t) {
      ctx.save();
      ctx.translate(t.x, t.y);
      if (t.kristall) {
        ctx.rotate(t.rot); ctx.lineCap = 'round';
        for (const [farbe, breite] of [[dunklerGrund ? 'rgba(59,102,170,.6)' : 'rgba(37,99,235,.7)', 2.6], [FLOCKE, 1.2]]) {
          ctx.strokeStyle = farbe; ctx.lineWidth = breite;
          for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * t.r * 1.5, Math.sin(a) * t.r * 1.5); ctx.lineTo(-Math.cos(a) * t.r * 1.5, -Math.sin(a) * t.r * 1.5); ctx.stroke(); }
        }
      } else {
        ctx.fillStyle = FLOCKE; ctx.strokeStyle = FLOCKENRAND; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, t.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }

    // Das rote Gerät auf Rädern – beim Konfetti mit Schlauch und Düse, beim Schnee mit Schild davor
    function zeichneGehaeuse(x, boden) {
      ctx.fillStyle = '#e11d48';
      ctx.beginPath(); ctx.moveTo(x + 6, boden - 14);
      ctx.lineTo(x + 6, boden - 40); ctx.quadraticCurveTo(x + 8, boden - 58, x + 40, boden - 58);
      ctx.lineTo(x + 96, boden - 58); ctx.quadraticCurveTo(x + 118, boden - 58, x + 118, boden - 36);
      ctx.lineTo(x + 118, boden - 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#9f1239'; ctx.fillRect(x + 6, boden - 22, 112, 8);
      // Griff
      ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + 46, boden - 58); ctx.quadraticCurveTo(x + 64, boden - 78, x + 84, boden - 58); ctx.stroke();
      // Lüftungsschlitze
      ctx.strokeStyle = '#fda4af'; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + 90 + i * 7, boden - 48); ctx.lineTo(x + 90 + i * 7, boden - 30); ctx.stroke(); }
      // Räder
      [x + 28, x + 96].forEach(rx => {
        ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.arc(rx, boden - 10, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.arc(rx, boden - 10, 3.5, 0, Math.PI * 2); ctx.fill();
      });
    }
    // Bodenstaubsauger, fährt nach links; Düse vorne, Schlauch zum Gerät
    function zeichneSauger(x, zeit, saugt) {
      const boden = H - 2, wackel = saugt ? Math.sin(zeit / 40) * 0.8 : 0;
      ctx.save();
      ctx.translate(0, wackel);
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 7; ctx.lineCap = 'round';           // Schlauch
      ctx.beginPath(); ctx.moveTo(x + 8, boden - 34);
      ctx.bezierCurveTo(x - 20, boden - 70, x - 52, boden - 66, x - 62, boden - 48); ctx.stroke();
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 5;                                  // Saugrohr
      ctx.beginPath(); ctx.moveTo(x - 62, boden - 48); ctx.lineTo(x - 74, boden - 12); ctx.stroke();
      ctx.fillStyle = '#64748b';                                                       // Düse
      ctx.beginPath(); ctx.moveTo(x - 98, boden); ctx.lineTo(x - 54, boden);
      ctx.lineTo(x - 62, boden - 12); ctx.lineTo(x - 88, boden - 12); ctx.closePath(); ctx.fill();
      zeichneGehaeuse(x, boden);
      if (saugt) {                                                                     // Sog-Striche vor der Düse
        ctx.strokeStyle = 'rgba(100,116,139,0.55)'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const off = ((zeit / 6) + i * 9) % 26;
          ctx.beginPath(); ctx.moveTo(x - 128 + off, boden - 6 - i * 5); ctx.lineTo(x - 116 + off, boden - 6 - i * 5); ctx.stroke();
        }
      }
      ctx.restore();
    }
    // Schneeschieber: dasselbe Gerät, vorn ein gebogenes Schild an zwei Stangen, oben ein gelbes Blinklicht.
    // Vor dem Schild wächst der Schneehaufen (breite × hoehe).
    const haufen = () => { const n = geraet.geschoben; return { b: Math.min(96, 16 + Math.sqrt(n) * 5.2), h: Math.min(50, 5 + Math.sqrt(n) * 3.1) }; };
    const SCHILD = 90;                       // so weit vor dem Gerät steht die Vorderkante des Schilds
    function zeichneSchieber(x, zeit, schiebt) {
      const boden = H - 2, wackel = schiebt ? Math.sin(zeit / 55) * 0.6 : 0, hf = haufen(), sx = x - SCHILD;
      ctx.save();
      ctx.translate(0, wackel);
      if (geraet.geschoben > 0) {                                                      // Schneehaufen
        ctx.fillStyle = FLOCKE; ctx.strokeStyle = FLOCKENRAND; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(sx + 4, boden + 3); ctx.lineTo(sx + 2, boden - hf.h);
        ctx.quadraticCurveTo(sx - hf.b * 0.45, boden - hf.h * 1.02, sx - hf.b, boden + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 5; ctx.lineCap = 'round';           // Schubstangen
      ctx.beginPath(); ctx.moveTo(x + 8, boden - 32); ctx.lineTo(sx + 12, boden - 26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 8, boden - 18); ctx.lineTo(sx + 10, boden - 8); ctx.stroke();
      ctx.fillStyle = '#2563eb';                                                       // Schild, nach vorn gebogen
      ctx.beginPath(); ctx.moveTo(sx + 14, boden); ctx.lineTo(sx + 2, boden);
      ctx.quadraticCurveTo(sx + 10, boden - 24, sx - 6, boden - 46); ctx.lineTo(sx + 3, boden - 48);
      ctx.quadraticCurveTo(sx + 21, boden - 24, sx + 14, boden); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#bfdbfe'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx + 5, boden - 4); ctx.quadraticCurveTo(sx + 12, boden - 24, sx - 2, boden - 43); ctx.stroke();
      zeichneGehaeuse(x, boden);
      const an = Math.floor(zeit / 320) % 2 === 0;                                     // Blinklicht
      ctx.fillStyle = '#374151'; ctx.fillRect(x + 20, boden - 62, 14, 4);
      ctx.fillStyle = an ? '#fbbf24' : '#b45309';
      ctx.beginPath(); ctx.moveTo(x + 21, boden - 62); ctx.quadraticCurveTo(x + 27, boden - 76, x + 33, boden - 62); ctx.closePath(); ctx.fill();
      if (an && !ruhig) { ctx.strokeStyle = 'rgba(251,191,36,.7)'; ctx.lineWidth = 2;
        [[-9, -8], [0, -12], [9, -8]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.moveTo(x + 27 + dx * 0.6, boden - 70 + dy * 0.6); ctx.lineTo(x + 27 + dx, boden - 70 + dy); ctx.stroke(); }); }
      ctx.restore();
    }

    function ende() {
      if (beendet) return;
      beendet = true;
      window.removeEventListener('resize', groesse);
      if (window.visualViewport) { window.visualViewport.removeEventListener('resize', groesse); window.visualViewport.removeEventListener('scroll', groesse); }
      c.width = c.height = 0;                // gibt den Bildspeicher gleich frei (iPad: der Vorrat für Zeichenfelder ist knapp)
      sonde.remove(); c.remove();
      laeuft = false; knoepfeAuffrischen();
      if (typeof opt.fertig === 'function') opt.fertig();
    }

    function schritt(jetzt) {
      const k = Math.min(3, (jetzt - zuletzt) / 16.7);
      zuletzt = jetzt;
      ctx.clearRect(0, 0, W, H);
      let fallend = 0;
      for (const t of teile) {
        if (t.weg || t.liegt) continue;
        fallend++;
        if (schnee) {
          t.vy = Math.min(1.9 * fall, t.vy + 0.012 * fall * k);
          t.x += (t.vx + Math.sin(t.phase + t.y / (38 * fall)) * 0.9) * k;
        } else {
          t.vy = Math.min(3.4 * fall, t.vy + 0.045 * fall * k);
          t.x += (t.vx + Math.sin(t.phase + t.y / (45 * fall)) * 0.7) * k;
        }
        t.y += t.vy * k;
        t.rot += t.vr * k;
        if (t.y >= H - t.abstand) {
          t.y = H - t.abstand; t.liegt = true;
          if (!schnee) t.rot = Math.round(t.rot / Math.PI) * Math.PI + (Math.random() - 0.5) * 0.5;
        }
      }
      // Das Gerät kommt, wenn alles liegt (spätestens nach 9 s, beim langsameren Schnee nach 13 s)
      const alter = jetzt - t0;
      if (!geraet.aktiv && (fallend === 0 || alter > (schnee ? 13000 : 9000))) {
        geraet.aktiv = true; geraet.x = W + 150; geraet.start = jetzt;
        teile.forEach(t => { if (!t.liegt) { t.liegt = true; t.y = H - t.abstand; } });
      }
      let arbeitet = false;
      if (geraet.aktiv && !schnee) {
        geraet.x -= tempo * k;
        const mund = geraet.x - 76;
        for (const t of teile) {
          if (t.weg || !t.liegt) continue;
          if (t.saug > 0 || (t.x > mund - 34 && t.x < mund + 30)) {
            t.saug = Math.min(1, t.saug + 0.09 * k);
            t.x += (mund - t.x) * 0.25 * k;
            t.y += (H - 8 - t.y) * 0.25 * k;
            arbeitet = true;
            if (t.saug >= 1) t.weg = true;
          } else if (t.x > mund + 30) {
            t.saug = 0.01;                   // schon überfahren, ohne erfasst zu werden: nachträglich einsaugen
          }
        }
      }
      if (geraet.aktiv && schnee) {
        geraet.x -= tempo * k;
        const sx = geraet.x - SCHILD;
        for (const t of teile) {
          if (t.weg) continue;
          if (!t.schub && t.x >= sx - 2) {   // das Schild erreicht die Flocke: Sie wandert in den Haufen davor
            t.schub = true; geraet.geschoben++;
            t.ab = Math.random(); t.hoch = Math.random();
          }
          if (t.schub) {
            const hf = haufen(), ab = t.ab * hf.b * 0.92;
            t.x = sx - ab; t.y = H - 3 - t.hoch * hf.h * Math.pow(1 - ab / hf.b, 0.8);
            arbeitet = true;
            if (t.x < -12) t.weg = true;
          }
        }
      }
      if (schnee && geraet.aktiv) zeichneSchieber(geraet.x, jetzt - geraet.start, arbeitet);
      for (const t of teile) if (!t.weg) { if (schnee) zeichneFlocke(t); else zeichneKonfetti(t, 1 - t.saug * 0.8); }
      if (!schnee && geraet.aktiv) zeichneSauger(geraet.x, jetzt - geraet.start, arbeitet);

      if (geraet.aktiv && geraet.x < -150 - (schnee ? haufen().b : 0) && teile.every(t => t.weg)) return ende();
      if (geraet.aktiv && jetzt - geraet.start > 60000) return ende();     // Notbremse, falls etwas hängen bleibt
      requestAnimationFrame(bild);
    }
    // Ein Fehler beim Zeichnen darf nichts gesperrt zurücklassen: Dann räumt ende() auf.
    function bild(jetzt) { try { schritt(jetzt); } catch (e) { ende(); } }
    requestAnimationFrame(bild);
    return true;
  }

  // ===================================================================
  // Die zwei Knöpfe: Konfetti und Schnee – nur als Belohnung für zehn Richtige in Folge.
  // Die Serie führt im Haupttrainer index.html (window.gimmicksHaupt), auf den Unterseiten diese Datei.
  // Gesperrt bleiben sie antippbar (kein disabled): Ein Tipp erklärt, wie man sie sich verdient.
  // ===================================================================
  const haupt = () => (MODUS === 'haupt' && window.gimmicksHaupt) || null;
  const frei = () => MODUS === 'haupt' ? !!(haupt() && haupt().frei()) : konfettiBereit;
  function einloesen() {
    if (MODUS === 'haupt') { const h = haupt(); if (h) h.einloesen(); return; }
    konfettiBereit = false; serie = 0; punkteZeigen(0); standMerken();
  }
  function knoepfeAuffrischen() {
    const ok = frei();
    knoepfe.forEach(b => {
      b.disabled = laeuft;
      b.classList.toggle('gesperrt', !laeuft && !ok);
      b.classList.toggle('bereit', !laeuft && ok);
      b.setAttribute('aria-label', b.tipText());
      if (MODUS !== 'voll') b.title = b.tipText();
    });
    tipAuffrischen();
  }
  function knopf(art, zeichen, text) {
    const b = el('button', 'gim-k ' + art, zeichen);
    b.type = 'button';
    const tt = () => frei()
      ? text + '. Das löst deine Belohnung ein – danach beginnt die Serie von vorn.'
      : (art === 'schnee' ? 'Schnee' : 'Konfetti') + ' gibt es als Belohnung: Schaffe ' + SERIE_ZIEL + ' richtige Antworten in Folge' +
        (MODUS === 'voll' ? ' (im Moment ' + Math.min(serie, SERIE_ZIEL) + ' von ' + SERIE_ZIEL + ')' : '') + ' – dann leuchtet dieser Knopf.';
    if (MODUS === 'voll') tipAnbinden(b, tt); else b.tipText = tt;
    b.addEventListener('mousedown', e => e.preventDefault());           // der Klick soll einem Eingabefeld nicht den Fokus nehmen
    b.addEventListener('click', e => {
      e.stopPropagation();
      if (laeuft) return;
      if (!frei()) {                                                     // noch nicht verdient: nur erklären
        if (MODUS === 'voll') tipUmschalten(b); else { const h = haupt(); if (h && h.hinweis) h.hinweis(); }
        return;
      }
      tipWeg();
      if (regen(art)) einloesen();
      else if (MODUS === 'voll') tipKurz('Das klemmt gerade. Versuch es gleich noch einmal – deine Belohnung bleibt dir erhalten.');
    });
    knoepfe.push(b);
    return b;
  }
  function spassKnoepfe() {
    const box = el('div', 'gim-spass');
    box.appendChild(knopf('konfetti', '🎉', 'Konfetti regnen lassen – der Staubsauger räumt auf'));
    box.appendChild(knopf('schnee', '❄️', 'Schnee rieseln lassen – der Schneeschieber räumt auf'));
    return box;
  }
  // Wohin mit den zwei Knöpfen? Breit: in die Leiste der Seite. Am Handy ist dort kein Platz – dann sitzen sie unten
  // links in der Ecke (ebenso auf Seiten ohne Leiste), und die Seite bekommt unten Luft (html.gim-platz).
  // Beim Drehen des Geräts oder Verkleinern des Fensters ziehen sie um.
  const SCHMAL = '(max-width: 700px)';
  function knoepfeSetzen(leiste, klasse) {
    const box = spassKnoepfe();
    const setzen = () => {
      const ecke = !leiste || medium(SCHMAL);
      box.className = 'gim-spass ' + (ecke ? 'ecke' : klasse);
      const ziel = ecke ? document.body : leiste;
      if (box.parentNode !== ziel) ziel.appendChild(box);
      document.documentElement.classList.toggle('gim-platz', ecke);
    };
    setzen();
    if (leiste && window.matchMedia) { const m = window.matchMedia(SCHMAL); if (m.addEventListener) m.addEventListener('change', setzen); else if (m.addListener) m.addListener(setzen); }
  }

  // ===================================================================
  // Unterseiten: Punkte und Serie
  // Dieselben Punkte wie im Haupttrainer (Speicher „punkteGesamt“). Zehn Richtige in Folge: Die Pille wird bunt,
  // ein Tipp darauf lässt das große Konfetti regnen.
  // ===================================================================
  const PUNKTE_KEY = 'punkteGesamt', PUNKTE_JE_ANTWORT = 10, SERIE_ZIEL = 10, NACHT_ZIEL = 5;
  const punkteLesen = () => Math.max(0, parseInt(lesen(PUNKTE_KEY), 10) || 0);
  let punkte = punkteLesen(), serie = 0, konfettiBereit = false, pill = null, letzteAntwort = 0;
  // Serie, verdiente Belohnung und Nachtmodus gelten, solange das Fenster offen ist – auch beim Wechsel zwischen den
  // Unterseiten und nach dem Neuladen (sessionStorage). Der Haupttrainer führt seine Serie für sich.
  const STAND_KEY = 'gimStand';
  function standMerken() {
    try {
      sessionStorage.setItem(STAND_KEY, JSON.stringify({ serie: Math.min(serie, SERIE_ZIEL), bereit: konfettiBereit,
        nachtSerie: Math.min(nachtSerie, NACHT_ZIEL), nachtBereit: nachtBereit, thema: document.documentElement.getAttribute('data-theme') || '' }));
    } catch (e) { /* gesperrter Speicher: dann gilt es nur für diese Seite */ }
  }
  function standHolen() {
    try {
      const s = JSON.parse(sessionStorage.getItem(STAND_KEY) || 'null');
      if (!s || typeof s !== 'object') return;
      serie = Math.max(0, Math.min(SERIE_ZIEL, parseInt(s.serie, 10) || 0)); konfettiBereit = !!s.bereit;
      nachtSerie = Math.max(0, Math.min(NACHT_ZIEL, parseInt(s.nachtSerie, 10) || 0)); nachtBereit = !!s.nachtBereit;
      if (s.thema === 'dark' || s.thema === 'light') document.documentElement.setAttribute('data-theme', s.thema);
    } catch (e) { /* kaputter oder gesperrter Speicher: von vorn */ }
  }

  function punkteZeigen(neu) {
    if (!pill) return;
    const s = Math.min(serie, SERIE_ZIEL);
    pill.querySelector('.gim-zahl').textContent = punkte.toLocaleString('de-DE');
    pill.querySelector('.gim-abz').textContent = s + '/' + SERIE_ZIEL;
    pill.classList.toggle('bereit', konfettiBereit);
    knoepfeAuffrischen();
    pill.setAttribute('aria-label', konfettiBereit ? 'Großes Konfetti regnen lassen' : punkte + ' Punkte, Serie ' + s + ' von ' + SERIE_ZIEL);
    if (neu > 0) { const plus = el('span', 'gim-plus', '+' + neu); pill.appendChild(plus); setTimeout(() => plus.remove(), 900); }
  }
  function punkteDazu(n) {
    if (!n) return;
    punkte = Math.max(punkte, punkteLesen()) + n;        // frisch lesen: ein zweiter Tab soll nichts überschreiben
    schreiben(PUNKTE_KEY, String(punkte));
    punkteZeigen(n);
  }
  function antwort(richtig, n) {
    if (!pill) return;                       // ohne Leiste wird nichts verbucht – sonst liefen Punkte unsichtbar auf
    letzteAntwort = Date.now();
    if (richtig) {
      serie++; if (serie >= SERIE_ZIEL) konfettiBereit = true;
      nachtSerie++; if (nachtSerie >= NACHT_ZIEL) nachtBereit = true;
      punkteDazu(n === undefined ? PUNKTE_JE_ANTWORT : n);
      if (n === 0) punkteZeigen(0);
    } else {
      serie = 0; nachtSerie = 0; nachtBereit = false;
      punkteZeigen(0);
    }
    nachtZeigen(); standMerken();
  }
  const aktiv = () => { letzteAntwort = Date.now(); };
  // Hinweise: Jeder Knopf bringt seinen Text mit (b.tipText). Mit der Maus erscheint er beim Darüberfahren,
  // am Tablet nach einem Tipp für sechs Sekunden.
  let tipFeld = null, tipVon = null, tipUhr = null;
  function tipZeigen(b) { if (!tipFeld || !b.tipText) return; tipVon = b; tipFeld.textContent = b.tipText(); tipFeld.classList.add('an'); }
  function tipWeg() { tipVon = null; clearTimeout(tipUhr); if (tipFeld) tipFeld.classList.remove('an'); }
  function tipAuffrischen() { if (tipVon && tipFeld) tipFeld.textContent = tipVon.tipText(); }
  function tipKurz(text) {                   // eine Meldung statt des Hinweises eines Knopfs, vier Sekunden lang
    if (!tipFeld) return;
    tipVon = null; tipFeld.textContent = text; tipFeld.classList.add('an');
    clearTimeout(tipUhr); tipUhr = setTimeout(tipWeg, 4000);
  }
  function tipUmschalten(b) {
    if (tipVon === b) {                      // mit der Maus steht der Hinweis schon vom Darüberfahren: stehen lassen
      if (medium('(hover: hover)')) { clearTimeout(tipUhr); return; }
      tipWeg(); return;
    }
    tipZeigen(b); clearTimeout(tipUhr); tipUhr = setTimeout(tipWeg, 6000);
  }
  function tipAnbinden(b, text) {
    b.tipText = text;
    b.addEventListener('mouseenter', () => { if (medium('(hover: hover)')) { clearTimeout(tipUhr); tipZeigen(b); } });
    b.addEventListener('mouseleave', () => { if (tipVon === b && medium('(hover: hover)')) tipWeg(); });
  }
  function pillBauen() {
    pill = el('button', 'gim-pill', '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" stroke="#b45309" stroke-width="1.2" d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.1 6.1 20.3l1.3-6.5L2.5 9.3l6.6-.8z"/></svg>' +
      '<span class="gim-zahl">0</span><span class="gim-kt">Konfetti!</span><span class="gim-abz">0/10</span>');
    pill.type = 'button';
    tipAnbinden(pill, () => konfettiBereit
      ? 'Du hast ' + SERIE_ZIEL + ' richtige Antworten in Folge geschafft. Tipp drauf – das große Konfetti gehört dir! Oder such dir einen der Knöpfe 🎉 oder ❄️ aus.'
      : 'Für jede richtige Antwort gibt es ' + PUNKTE_JE_ANTWORT + ' Punkte. Sie zählen zu deinen Punkten auf der Startseite dazu. Schaffst du ' + SERIE_ZIEL +
        ' richtige in Folge, gibt es das große Konfetti – oder Konfetti oder Schnee mit den Knöpfen 🎉 und ❄️. Im Moment ' + Math.min(serie, SERIE_ZIEL) + ' von ' + SERIE_ZIEL + '. Eine falsche Antwort setzt die Serie auf null.');
    pill.addEventListener('click', e => {
      e.stopPropagation();
      if (konfettiBereit) {
        // Läuft gerade schon ein Regen, bleibt die Belohnung stehen – und die Leiste sagt, warum nichts passiert
        if (laeuft) { tipKurz('Gleich! Warte, bis alles weggeräumt ist – dann tipp noch einmal drauf.'); return; }
        tipWeg();
        if (regen('konfetti', { gross: true })) { konfettiBereit = false; serie = 0; punkteZeigen(0); standMerken(); }
        else tipKurz('Das Konfetti klemmt gerade. Versuch es gleich noch einmal – es bleibt dir erhalten.');
        return;
      }
      tipUmschalten(pill);
    });
    return pill;
  }

  // ===================================================================
  // Unterseiten: Nachtmodus – wie im Haupttrainer erst nach fünf Richtigen in Folge umschaltbar.
  // Die Unterseiten folgen sonst der Einstellung des Geräts; der Knopf schaltet auf das jeweils andere.
  // ===================================================================
  let nachtSerie = 0, nachtBereit = false, nachtKnopf = null;
  const istDunkel = () => { const t = document.documentElement.getAttribute('data-theme'); return t ? t === 'dark' : medium('(prefers-color-scheme: dark)'); };
  function nachtZeigen() {
    if (!nachtKnopf) return;
    const dunkel = istDunkel(), z = Math.min(nachtSerie, NACHT_ZIEL);
    nachtKnopf.classList.toggle('an', dunkel);
    nachtKnopf.classList.toggle('bereit', nachtBereit);
    nachtKnopf.querySelector('.gim-z').textContent = dunkel ? '☀️' : '🌙';
    nachtKnopf.querySelector('.gim-abz').textContent = z + '/' + NACHT_ZIEL;
    nachtKnopf.setAttribute('aria-label', 'Nachtmodus ' + (dunkel ? 'ausschalten' : 'einschalten') + ': ' + z + ' von ' + NACHT_ZIEL + ' richtigen Antworten in Folge');
    tipAuffrischen();
  }
  function nachtBauen() {
    nachtKnopf = el('button', 'gim-k nacht', '<span class="gim-z">🌙</span><span class="gim-abz">0/5</span>');
    nachtKnopf.type = 'button';
    tipAnbinden(nachtKnopf, () => { const dunkel = istDunkel(), z = Math.min(nachtSerie, NACHT_ZIEL);
      return nachtBereit
        ? 'Super, ' + NACHT_ZIEL + ' in Folge! Tipp drauf, um den Nachtmodus ' + (dunkel ? 'auszuschalten' : 'einzuschalten') + '. Danach steht der Zähler wieder auf 0.'
        : 'Sammle ' + NACHT_ZIEL + ' richtige Antworten in Folge, dann kannst du den Nachtmodus ' + (dunkel ? 'ausschalten' : 'einschalten') + '. Eine falsche Antwort setzt den Zähler zurück. (Im Moment ' + z + ' von ' + NACHT_ZIEL + ')'; });
    nachtKnopf.addEventListener('click', e => {
      e.stopPropagation();
      if (!nachtBereit) { tipUmschalten(nachtKnopf); return; }
      document.documentElement.setAttribute('data-theme', istDunkel() ? 'light' : 'dark');
      nachtSerie = 0; nachtBereit = false; tipWeg();
      nachtZeigen(); standMerken();
    });
    if (window.matchMedia) { const m = window.matchMedia('(prefers-color-scheme: dark)'); if (m.addEventListener) m.addEventListener('change', nachtZeigen); }
    return nachtKnopf;
  }

  // ===================================================================
  // Unterseiten: „Gerade da“ – dieselbe Liste und derselbe Server wie im Haupttrainer (worker/README.md).
  // Gesendet wird nur, wenn dort ein Vorname eingetragen wurde und die Liste nicht ausgeschaltet ist.
  // Schlägt die Verbindung fehl, steht unter der Liste „keine Verbindung“; die Seite läuft unverändert weiter.
  // ===================================================================
  const NAME_KEY = 'vokabelVorname', GERAET_KEY = 'vokabelGeraeteId', AUS_KEY = 'vokabelAnwesenheitAus';
  const DA_API = 'https://bertha-presence.marcator.workers.dev/';     // dieselbe Adresse wie PRESENCE_API in index.html
  const DA_TAKT_MS = 20000, DA_ONLINE_MS = 120000, DA_FENSTER_MS = 7 * 24 * 60 * 60 * 1000, AKTIV_MS = 90000;
  let daName = '', daAus = false, daUhr = null, daOffen = false, daZu = null, daGeradeAuf = false, daKnopf = null, daBox = null;
  let daOhneSpeicher = false;              // true, sobald sich der Schalter nicht speichern ließ: Dann gilt, was diese Seite weiß
  const daMerken = aus => { daAus = aus; if (!schreiben(AUS_KEY, aus ? '1' : '0')) daOhneSpeicher = true; };
  const daSchmal = () => medium('(max-width: 1259px)');
  function geraeteId() {
    let id = lesen(GERAET_KEY) || '';
    if (!id) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      schreiben(GERAET_KEY, id);
    }
    return id;
  }
  // gleiche Vornamen (Tablet und Laptop) zu einer Zeile zusammenziehen, der jüngste Zeitstempel gilt
  function buendeln(liste) {
    const nach = new Map();
    liste.forEach(e => {
      const k = (e.name || '').toLocaleLowerCase('de-DE'), da = nach.get(k);
      if (!da) { nach.set(k, { name: e.name, lastSeen: e.lastSeen, ich: !!e.ich }); return; }
      if (e.ich) da.ich = true;
      if (e.lastSeen > da.lastSeen) { da.lastSeen = e.lastSeen; da.name = e.name; }
    });
    return [...nach.values()];
  }
  async function daHolen() {
    const id = geraeteId();
    const antw = await fetch(DA_API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, name: daName, aktiv: (Date.now() - letzteAntwort) < AKTIV_MS }),
      signal: (window.AbortSignal && AbortSignal.timeout) ? AbortSignal.timeout(8000) : undefined
    });
    if (!antw.ok) throw new Error('Server antwortet ' + antw.status);
    const daten = await antw.json(), versatz = Date.now() - (daten.now || Date.now());      // falsch gestellte Uhr ausgleichen
    return buendeln((daten.liste || []).map(e => ({ name: e.name, lastSeen: e.lastSeen + versatz, ich: e.id === id })).filter(e => (Date.now() - e.lastSeen) < DA_FENSTER_MS));
  }
  function seit(lastSeen) {
    const sek = Math.max(0, Math.round((Date.now() - lastSeen) / 1000));
    if (sek < 45) return 'jetzt';
    const min = Math.round(sek / 60); if (min < 60) return min + 'm';
    const std = Math.round(min / 60); if (std < 24) return std + 'h';
    return Math.round(std / 24) + 'd';
  }
  function daMalen(liste) {
    const box = daBox.querySelector('.liste');
    box.textContent = '';
    liste.slice().sort((a, b) => b.lastSeen - a.lastSeen).forEach(p => {
      const zeile = el('div', 'zeile' + (Date.now() - p.lastSeen < DA_ONLINE_MS ? ' online' : '') + (p.ich ? ' ich' : ''));
      const name = el('span', 'name'); name.textContent = p.name;       // bewusst textContent
      const zeit = el('span', 'zeit'); zeit.textContent = seit(p.lastSeen);
      zeile.appendChild(el('span', 'punkt')); zeile.appendChild(name); zeile.appendChild(zeit);
      box.appendChild(zeile);
    });
  }
  // Vor jedem Senden frisch nachsehen: Die Liste kann inzwischen im Haupttrainer oder in einem zweiten Fenster aus- oder
  // eingeschaltet, der Vorname gelöscht worden sein. „Aus“ heißt ab sofort: Es wird nichts mehr gesendet.
  // Liefert true, wenn sich etwas geändert hat – dann ist schon gestoppt oder neu gestartet.
  function daAbgleichen() {
    if (!daBox || daOhneSpeicher) return false;
    const name = lesen(NAME_KEY) || '', aus = lesen(AUS_KEY) === '1';
    if (name === daName && aus === daAus) return false;
    daName = name; daAus = aus;
    if (daAus || !daName) daStopp(); else daStart();
    return true;
  }
  async function daAuffrischen() {
    if (daAbgleichen() || daAus || !daName) return;
    const notiz = daBox.querySelector('.notiz');
    try { daMalen(await daHolen()); notiz.textContent = ''; } catch (e) { notiz.textContent = 'keine Verbindung'; }
  }
  const daLaeuft = () => !daAus && !!daName && !!daUhr;
  function daSicht() {
    if (!daBox) return;
    daBox.classList.toggle('an', daLaeuft());
    daBox.classList.toggle('offen', daLaeuft() && daOffen);
    daKnopf.classList.toggle('aus', daAus || !daName);
    daKnopf.querySelector('.gim-z').textContent = (daAus || !daName) ? '🙈' : '👥';
    // aufgeklappt sitzt die Liste unter dem Knopf (die Leiste ist am Handy zwei Zeilen hoch)
    const auf = daLaeuft() && daOffen && daSchmal(), r = auf ? daKnopf.getBoundingClientRect() : null;
    daBox.style.top = auf ? Math.round(r.bottom + 10) + 'px' : '';
    daBox.style.right = auf ? Math.max(12, Math.round(window.innerWidth - r.right)) + 'px' : '';      // bündig unter dem Knopf, nicht am Fensterrand
    daKnopf.setAttribute('aria-label', 'Liste „Gerade da“ – ' + (!daName ? 'noch ohne Vornamen' : daAus ? 'ausgeschaltet' : 'eingeschaltet'));
    tipAuffrischen();
  }
  function daStart() {
    if (daAus || !daName) { daSicht(); return; }
    daAuffrischen();
    if (daAus || !daName) return;            // der Abgleich darin hat gerade gestoppt
    clearInterval(daUhr);
    daUhr = setInterval(() => { if (!document.hidden) daAuffrischen(); }, DA_TAKT_MS);
    daSicht();
  }
  function daStopp() { daOffen = false; clearInterval(daUhr); daUhr = null; daSicht(); }
  function daAuf(ohneHolen) {
    daOffen = true; daGeradeAuf = true; setTimeout(() => { daGeradeAuf = false; }, 0);
    if (!ohneHolen) daAuffrischen();
    daSicht();
    clearTimeout(daZu); daZu = setTimeout(daZuklappen, 8000);           // von selbst wieder weg
  }
  function daZuklappen() { daOffen = false; clearTimeout(daZu); daSicht(); }
  function daBauen() {
    daName = lesen(NAME_KEY) || ''; daAus = lesen(AUS_KEY) === '1';
    daKnopf = el('button', 'gim-k da', '<span class="gim-z">👥</span>');
    daKnopf.type = 'button'; daKnopf.setAttribute('aria-label', 'Liste „Gerade da“');
    tipAnbinden(daKnopf, () => !daName
      ? 'Die Liste „Gerade da“ zeigt, wer sonst gerade übt. Trag dafür einmal deinen Vornamen auf der Startseite ein.'
      : daAus ? 'Die Liste „Gerade da“ ist aus. Tipp drauf, um sie einzublenden.'
      : daSchmal() ? 'Tipp drauf: Dann siehst du kurz, wer gerade übt.' : 'Die Liste „Gerade da“ ist an. Tipp drauf, um sie auszublenden.');
    daBox = el('div', 'gim-da', '<h6>Gerade da</h6><div class="liste"></div><div class="notiz"></div><button type="button" class="ausknopf">Liste ausschalten</button>');
    document.body.appendChild(daBox);
    daKnopf.addEventListener('click', e => {
      e.stopPropagation();
      if (!daName) { tipUmschalten(daKnopf); return; }
      tipWeg();
      if (daAus) { daMerken(false); daStart(); if (daSchmal()) daAuf(true); return; }      // daStart hat schon geholt
      if (daSchmal()) { if (daOffen) daZuklappen(); else daAuf(); return; }
      daMerken(true); daStopp();                                       // breit: ganz abschalten
    });
    daBox.querySelector('.ausknopf').addEventListener('click', e => { e.stopPropagation(); daMerken(true); daStopp(); });
    document.addEventListener('click', e => {                          // Tippen irgendwo sonst schließt das Fenster
      if (!daOffen || daGeradeAuf) return;
      if (e.target.closest('.gim-da') || e.target.closest('.gim-k.da')) return;
      daZuklappen();
    });
    window.addEventListener('resize', daSicht);
    // Bis 743 px steht die Leiste in einer Zeile, die mit dem Inhalt rollt: Das Fenster hinge sonst ohne seinen Knopf da
    window.addEventListener('scroll', () => { if (daOffen && medium('(max-width: 743px)')) daZuklappen(); }, { passive: true });
    return daKnopf;
  }

  // ===================================================================
  // Aufbau je nach Seite
  // ===================================================================
  function aufbauen() {
    if (MODUS === 'haupt') { knoepfeSetzen(document.getElementById('punkteLeiste'), 'inleiste'); knoepfeAuffrischen(); return; }   // index.html: neben die Punkte-Pille
    const kopf = document.querySelector('.bar .in');
    if (MODUS !== 'voll' || !kopf) return;          // Seite ohne Punkte: ohne Serie keine Belohnung, also auch keine Knöpfe
    const leiste = el('div', 'gim-leiste');
    leiste.appendChild(pillBauen());
    const zwei = spassKnoepfe(); [...zwei.children].forEach(b => leiste.appendChild(b));
    leiste.appendChild(daBauen());
    leiste.appendChild(nachtBauen());
    tipFeld = el('span', 'gim-tip'); tipFeld.setAttribute('role', 'status');
    leiste.appendChild(tipFeld);
    // Breit sitzt die Leiste rechts in der Kopfleiste (die Brotkrumen-Zeile weicht ihr). Bis 743 px bekommt sie eine eigene
    // Zeile darunter, die mit dem Inhalt rollt: Die klebende Kopfleiste bleibt so hoch wie vorher, und nichts springt,
    // wenn die Pille zu „Konfetti!“ wird.
    const spur = kopf.querySelector('.crumb'), zeile = el('div', 'gim-zeile'), ENG = '(max-width: 743px)';
    kopf.parentNode.parentNode.insertBefore(zeile, kopf.parentNode.nextSibling);
    const leisteSetzen = () => {
      const unten = medium(ENG);
      if (leiste.parentNode !== (unten ? zeile : kopf)) (unten ? zeile : kopf).appendChild(leiste);
      zeile.classList.toggle('an', unten);
      if (spur) spur.style.display = unten ? '' : 'none';
      if (daBox) daSicht();
    };
    leisteSetzen();
    if (window.matchMedia) { const m = window.matchMedia(ENG); if (m.addEventListener) m.addEventListener('change', leisteSetzen); else if (m.addListener) m.addListener(leisteSetzen); }
    standHolen();
    punkteZeigen(0); nachtZeigen(); daStart();
    // Punkte, Vorname und der Schalter der Liste können sich im Haupttrainer oder in einem zweiten Fenster ändern –
    // oder die Seite kommt mit „Zurück“ aus dem Seiten-Cache des Browsers wieder
    window.addEventListener('storage', e => {
      if (e.key === PUNKTE_KEY || e.key === null) { punkte = Math.max(punkte, punkteLesen()); punkteZeigen(0); }
      if (e.key === NAME_KEY || e.key === AUS_KEY || e.key === null) daAbgleichen();
    });
    window.addEventListener('pageshow', e => {
      if (!e.persisted) return;
      punkte = Math.max(punkte, punkteLesen()); standHolen(); punkteZeigen(0); nachtZeigen(); daAbgleichen();
    });
    document.addEventListener('click', tipWeg);                        // Tipp irgendwo sonst: Hinweis weg
  }
  window.Gimmicks = { regen: regen, antwort: antwort, aktiv: aktiv, auffrischen: knoepfeAuffrischen, laeuft: () => laeuft, modus: MODUS };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aufbauen); else aufbauen();
})();
