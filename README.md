# 🎮 Vokabel-Abenteuer – Vokabeltrainer

Ein interaktiver Vokabeltrainer für die 5. Klasse Gymnasium – Englisch und Latein.

## 📚 Features

### Allgemein
- ✅ Sprachauswahl: Englisch oder Latein
- ✅ Taler-Belohnungssystem (50 Taler = Tagesziel!)
- ✅ Intelligentes Wiederholungssystem (falsche/langsame Wörter werden wiederholt)
- ✅ 15 Vokabeln pro Runde, gewichtet nach Lernfortschritt (schwächere Wörter kommen häufiger)
- ✅ Emoji-Vorhang: bereits gekonnte Vokabeln werden verhüllt, Vorhang öffnet sich bei Antwort
- ✅ Fortschritt pro Übersetzungsrichtung (DE→EN separat von EN→DE)
- ✅ Automatische Tipps nach 15 Sekunden (nur Spelling-Modus)
- ✅ Fortschritt wird sitzungsübergreifend gespeichert (localStorage)
- ✅ Mobilfreundlich & Tastatur-Steuerung
- ✅ Emoji-Schalter oben rechts: Bilder über den Vokabeln lassen sich ausblenden (bleibt gespeichert)
- ✅ 🎯 **Knackpunkte-Schalter** (Latein): übt ausschließlich die im Vokabelheft markierten Vokabeln
- ✅ 👥 **Anwesenheitsliste** links neben der App: Vorname + „zuletzt gesehen" der anderen
  — Vorname wird beim ersten Start abgefragt, Schalter oben rechts blendet die Liste aus/ein.
  Gegenstelle: Cloudflare Worker + D1, siehe [`worker/README.md`](worker/README.md).

### 🇬🇧 Englisch
- Spelling-Modus (DE→EN): Buchstaben-Tiles zum englischen Wort zusammensetzen
- Multiple-Choice-Modus (EN→DE): 5 Optionen mit kuratierten Distraktoren
- Zufällige Modus-Zuweisung pro Wort in jeder Runde — außer bei Einträgen mit Klammern,
  Punkten oder Apostroph (`What a/an ...!`), die taugen nicht als Buchstaben-Puzzle und
  kommen nur im Multiple-Choice (`mcOnly`)
- **Vokabelheft (Theme 1)**: acht Päckchen A–H mit den 66 aktiven Vokabeln, dreispaltig —
  Wort · Formen (`simple past: sent`) · Bedeutung mit Beispielsatz. Abdeckblatt und Markieren wie
  in Latein. Heft und Übungsset enthalten dasselbe
- Beim Spelling steht bei Verben das `to ` fest in den Feldern — gelegt wird nur das Verb dahinter
- **🎯 Knackpunkte** gilt auch für Englisch, solange Theme 1 der Bezug ist (Übung oder Heft);
  Theme 2/3 und April haben kein Heft und blenden den Schalter aus
- **🎧 Hör-Detektiv (Theme 1)**: 45 Beispielsätze aus dem Vokabelheft hören (auch in Zeitlupe),
  aus Wortkärtchen nachlegen, nachsprechen. Unter den Kärtchen liegen Ohr-Fallen aus der Grammatik
  von Theme 1 (send/sent, were/where, can/can't, bored/board) mit eigener Erklärung. 6 Sätze pro Runde,
  2 auf Anhieb richtig = 1 Taler, Knackpunkte kommen zuerst dran
  - **ohne Cloud**: vorgelesen wird nur mit Stimmen, die auf dem Gerät rechnen (`localService`) —
    Chromes „Google UK English“ geht über Google-Server und bleibt draußen. Ohne eine solche Stimme
    bleibt der Start gesperrt, mit Hinweis, wo man auf dem iPad eine lädt
  - **Stimmenwahl** über den runden 🗣️-Schalter oben rechts (neben 🎯 👥 😀), sichtbar im
    Hör-Detektiv und in der Funkzentrale: ein Tipp wechselt die Stimme und spricht eine Probe,
    das Abzeichen zeigt 1/2 bzw. 2/2. Gemerkt in `hoerDetektivStimme`.
    Zur Wahl stehen nur die **zwei besten**, zwei verschiedene Sprecher (`HD_VOICE_MAX`).
    Vorausgewählt wird nach Rang: Premium vor Erweitert vor einfach, Britisch vor anderem Englisch,
    Spaß- und Eloquence-Stimmen von macOS (Bubbles, Grandpa, Rocko …) ganz unten.
    Siri-Stimmen gibt Apple nicht an Webseiten heraus
  - **Premium-Stimmen kommen im Browser nicht an:** Safari auf dem Mac meldet trotz geladener
    „Serena (Premium)“ nur `compact`-, `super-compact`-, Eloquence- und Spaßstimmen (geprüft am
    10.10.2026 mit der echten Liste). Eine Anleitung zum Herunterladen bringt also nichts
  - Nachsprechen ist ein Selbstvergleich: Aufnahme per `MediaRecorder`, bleibt im Browser.
    Keine Spracherkennung — die schickt Audio an Apple bzw. Google
- **📻 Funkzentrale Camden (Theme 1)**: 18 Notrufe von der Klassenfahrt, auf Englisch aus dem
  Theme-1-Wortschatz gebaut (51 der 66 Vokabeln kommen vor). Das Kind schickt Hilfe (ambulance,
  minibus, group leader, head teacher) an einen Ort (rocks, hospital, station, camp, classroom,
  office). Jeder Notruf hat eine eingebaute Falle (*wasn't hurt*, *weren't on the train*, *at first*)
  mit eigener Erklärung; die entscheidenden Wörter leuchten nach dem Schicken gelb
  - 6 Notrufe pro Schicht, 45 s Uhr pro Notruf, Wörterbuch per Antippen (Bedeutung aus dem Heft)
    kostet 5 s. 2 auf Anhieb richtig = 1 Taler, die Uhr zählt nur für die ⚡-Statistik
  - Wörter, die gebremst haben, lassen sich am Schichtende per Knopf als Knackpunkte markieren —
    nicht automatisch, die Markierungen im Heft gehören dem Kind
  - Unter dem Anrufer steht eine Handynummer aus dem britischen Fiktionsbereich (07700 900xxx),
    **nicht der Ort** — den muss der Notruftext selbst hergeben
  - Markup im Text: `{Wort im Text|Vokabel im Heft}`; Vorlesen mit derselben lokalen Stimme wie
    der Hör-Detektiv
- 2 Vokabel-Sets: Theme 2 (At School, 70 Wörter) + Theme 3 (Hobbies, 70 Wörter)

### 🏛️ Latein
- **Vokabeln**: 34 Einzelwort-Vokabeln + 7 Mehrwort-Ausdrücke (Lektion 3)
  - Einzelwörter: Spelling (DE→Latein) oder MC (Latein→DE)
  - Mehrwörter: MC in beide Richtungen (Latein↔Deutsch)
- **Verb-Formen**: 32 Verben – Infinitiv ↔ 1. Person, Präsens Indikativ Aktiv (alle 6 Personen), Imperativ Sg/Pl
- **Substantive**: 62 Nomen deklinieren – Nom/Gen/Dat/Akk/Abl × Singular/Plural
  (a-Deklination, o-Deklination und – ab Lektion 7 – konsonantische Deklination)
- **Konjug.- & Deklinationsssschlange**: Verb- & Nomen-Endungen spielerisch üben
  - Verben und Nomen werden zufällig gemischt aus dem Kapitel gezogen
  - Verb-Schlange: Personen×Numerus-Grid (4×2), endet mit Imperativ
  - Nomen-Schlange: Kasus×Numerus-Grid (5×2), deutsche Kasusformen (der/des/dem/den)
  - Beispielsätze bei jedem Schritt, nur die Endung eingeben
- **Tabellentraining**: Komplette Konjugations-/Deklinationstabellen im Terminal-Stil (nur Desktop)
  - Große Übersichtstabellen mit allen Verben/Nomen eines Kapitels
  - Zufällige Lücken ausfüllen, 3-5 pro Tabelle, dann Wechsel
- **Beispielsätze**: 21 Lückentexte – lateinischer Satz + deutsche Übersetzung mit Lücke
- **Vokabelheft**: alle Vokabeln zum Nachlesen, päckchenweise wählbar, dreispaltig wie im Buch
  (Wort · Formen/Grammatik · Bedeutung inkl. Beispielsätze) – 304 Einträge über Lektion 1/3/4/5/6/7/8
  – eigene Markierung für schwierige Vokabeln per Klick auf die Zeile
  - **Abdeckblatt**: ein liniertes Blatt fährt über Spalte 2 und 3, die Lücken (`___`) füllt das Kind
    selbst aus – mit Tab/Enter von Lücke zu Lücke
  - **Danebenziehen**: das Blatt gleitet zur Seite (auf schmalen Geräten nach unten), eigenes Blatt
    und Heft stehen nebeneinander; grün = getroffen, orange = nur vertippt, fehlende Bedeutungen
    sind im Heft gelb markiert
- **🎯 Knackpunkte** (Schalter oben rechts, nur Latein): übt ausschließlich die im Vokabelheft
  markierten Vokabeln — Vokabeln, Verb-Formen, Substantive, Perfekt, Schlange, Rakete,
  Profi-Rakete und „Alles gemischt"
  - unter 10 markierten Vokabeln füllt die Runde mit anderen auf; die markierten sind alle dabei
  - 3× richtig legt eine Vokabel für den Tag schlafen (Punkt im Heft verblasst), nach 3 solchen
    Tagen verschwindet die Markierung; gezählt wird über alle Module, auch bei ausgeschaltetem Schalter
  - unberührt bleiben Beispielsätze, Tabellentraining und „0 → 100"
- **Alles gemischt**: Kombination aller Module (ohne Tabellentraining)
- Makron-Unterstützung: Tiles zeigen ā/ē/ī/ō/ū, Tastatur-Eingabe 'a' passt zu 'ā'

## 🎯 Aktueller Stand

**Version:** 2.25.2
**Datum:** 10.10.2026
**Englisch:** 265 Vokabeln (6. Kl. Theme 1: 66 + 5. Kl. Theme 2: 77 + Theme 3: 98 +
Vokabeln April: 24) + 27 Redewendungen
**Latein:** Lektion 1 + 3 + 4 + 5 + 6 + 7 – 239 Vokabeln + 31 Mehrwort-Ausdrücke,
71 Verb-Formen, 62 Substantive, 57 Beispielsätze

| Lektion | Thema | Vokabeln | Verben | Substantive | Sätze | Module |
|---|---|---:|---:|---:|---:|---|
| 1 | Davus & Syrus | 37 | – | – | – | Vokabeln, Vokabelheft, Rakete, Profi-Rakete |
| 3 | Circus Maximus | 35 (+7) | 18 | 9 | 12 | alle |
| 4 | Diana & Verwandlung | 39 (+4) | 14 | 9 | 9 | alle |
| 5 | Prometheus & Minerva | 45 (+4) | 16 | 20 | 12 | alle |
| 6 | Merkur & Apollon | 42 (+8) | 7 | 11 | 12 | alle |
| 7 | Forum & Händler | 41 (+8) | 16 | 13 | 12 | alle |
| 8 | Amphitheater & Gladiatoren | 47 (+8) | 15 | 11 | 12 | alle + Perfekt |

(Zahl in Klammern = Mehrwort-Ausdrücke)

## 🗂️ Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html` | die komplette App — eine Datei, lädt nichts aus dem Netz nach |
| `worker/` | Anwesenheits-Dienst (Cloudflare Worker + D1) hinter der Liste „Gerade da“ |
| `tools/` | Hilfsskripte rund um die Vokabeldaten |

## 🚀 Wie benutzen?

Einfach die Seite öffnen und loslegen!
Live: [https://nasmar1977.github.io/bertha5english/](https://nasmar1977.github.io/bertha5english/)

### Spielregeln:
- Pro Runde werden 15 zufällige Aufgaben abgefragt
- Für jede 2 richtig beantworteten Aufgaben (beim ersten Versuch) = 1 Taler
- Ziel: 50 Taler erreichen!

### Steuerung:
- **Maus:** Buchstaben anklicken
- **Tastatur:** Buchstaben einfach eintippen
- **1-5:** Multiple-Choice-Auswahl
- **Backspace:** Letzten Buchstaben löschen
- **ESC:** Alles löschen
- **Enter/Space:** Antwort prüfen / Weiter

## 📝 Changelog

### Version 2.25.2 (10.10.2026)
- **Gelben Stimmen-Kasten aus v2.23.2 wieder entfernt.** Er riet, eine Premium-Stimme zu laden.
  Am Mac ist „Serena (Premium)“ geladen, Safari gibt sie der Seite aber nicht heraus —
  `getVoices()` liefert nur `compact`, `super-compact`, Eloquence und Spaßstimmen. Die Anleitung
  versprach also etwas, das nicht eintritt.
- `super-compact` rangiert jetzt hinter `compact` derselben Stimme. Mit der echten Liste des Macs
  ergibt die Auswahl Daniel (en-GB) und Karen (en-AU).

### Version 2.25.1 (10.10.2026)
- **„Flüstern“ stand als zweitbeste Stimme zur Wahl.** Die Spaßstimmen-Liste kannte nur englische
  Namen; macOS übersetzt sie aber („Whisper“ → „Flüstern“). Bei Gleichstand entschied dann das
  Alphabet — „Flüstern“ vor „Samantha“.
- Erkennung jetzt doppelt: deutsche und englische Namen, dazu die `voiceURI`
  (`com.apple.speech.synthesis.voice.*` außer Alex, `com.apple.eloquence.*`). Roboterstimmen fliegen
  ganz raus, solange es irgendeine andere gibt. Bekannte gute Sprecher (Daniel, Serena, Karen,
  Samantha …) bekommen einen Bonus vor Unbekannten.

### Version 2.25.0 (10.10.2026)
- **Stimmenwechsel als runder Schalter oben rechts** (`#voiceToggle`, 🗣️), in der Reihe mit 🎯 👥 😀
  und genauso gebaut. Sichtbar nur im Hör-Detektiv und in der Funkzentrale
  (`hdUpdateVoiceToggle`, läuft bei jedem Bildschirmwechsel mit). Ein Tipp schaltet zwischen den
  zwei besten Stimmen um und spricht sofort eine Probe; eine Meldung unten nennt die neue Stimme.
- Die Auswahlliste mit „Probe hören“ auf dem Startbildschirm ist dafür weg; dort steht nur noch,
  welche Stimme spricht.

### Version 2.24.1 (10.10.2026)
- **Funkzentrale: Die Absenderzeile verriet den Einsatzort** („The rocks, Lulworth“ unter dem
  Namen) — damit war die halbe Aufgabe gelöst, ohne den Text zu lesen. Die `where`-Felder sind
  raus, stattdessen steht eine Handynummer da (`fzNumber`, 07700 900xxx ist im UK für Fiktion
  reserviert).
- Fünf Notrufe nannten den Ort bis dahin nur in dieser Zeile; ihre Texte sagen ihn jetzt selbst
  (*I'm in my tent now*, *We are still at the station*, *They are all still in the classroom* …).

### Version 2.24.0 (10.10.2026)
- **Neues Modul „Funkzentrale Camden“ für Theme 1** — Platz 4 der Pitch-Runde, auf Wunsch doch
  gebaut. Gegenüber dem Prototyp: 18 statt 6 Notrufe (das größte Risiko war, dass das Kind sie
  nach drei Schichten auswendig kennt), Taler nach der App-Regel statt 5+2 pro Notruf, und die
  Knackpunkte nur auf Knopfdruck.
- Die Notrufe stehen in `FZ_CALLS`; jedes `{…|…}` verweist auf eine Heftvokabel, das Wörterbuch
  liest Bedeutung und Formen aus `vokabelheftData['en-theme1']`. Fortschritt unter `en:fz:<id>`,
  mit 🎯 kommen Notrufe mit markierten Wörtern zuerst.

### Version 2.23.3 (10.10.2026)
- **Hör-Detektiv: nur noch die zwei besten Stimmen in der Auswahl** — macOS meldet Dutzende, und
  Kinder verlieren sich im lustigen Ausprobieren. Pro Sprecher zählt nur die beste Fassung, damit
  nicht zweimal „Daniel“ dasteht. Eine gemerkte Wahl außerhalb der zwei fällt auf die beste zurück.

### Version 2.23.2 (10.10.2026)
- **Hör-Detektiv: deutlicher Kasten statt Fußnote**, wenn das Gerät nur einfache Stimmen hat. Er
  sagt, warum es sich lohnt (das -ed in *planned*, das n in *didn't*), richtet sich mit „Frag deine
  Eltern“ an die Richtigen und listet die Schritte nummeriert für genau das Gerät. Das iPad meldet
  sich in Safari als „Macintosh“; erkannt wird es an `maxTouchPoints > 1`.
- Ist eine gute Stimme vorhanden, aber nicht gewählt, steht nur ein kurzer Tipp unter der Auswahl.

### Version 2.23.1 (10.10.2026)
- **Hör-Detektiv: Stimme wählbar.** Auf dem MacBook klang die automatisch gewählte Stimme schlimm —
  genommen wurde einfach die erste britische, die das System meldet. Jetzt gibt es eine Rangfolge
  (`hdVoiceScore`), eine Auswahlliste mit „Probe hören“ und, solange keine Premium-/Erweitert-Stimme
  gewählt ist, den Weg zum Herunterladen einer besseren.
- Safari meldet die Premium-Fassung unter demselben Namen wie die einfache („Daniel“); unterscheiden
  lässt sie sich nur an der `voiceURI` (`com.apple.voice.premium.…`). `hdVoiceQuality` prüft beides.

### Version 2.23.0 (10.10.2026)
- **Neues Modul „Hör-Detektiv“ für Theme 1** — Sieger einer Pitch-Runde mit vier Ideen
  (Funkzentrale, Satzbaustelle, Camden Story, Hör-Detektiv). Grund: die App war bis dahin stumm,
  und die Sätze stehen schon im Vokabelheft; neu ist pro Satz nur eine Ohr-Falle mit Erklärsatz.
- 45 Sätze in `HD_SENTENCES`, jeder wörtlich aus `vokabelheftData['en-theme1']` und über `w` an
  seine Heftvokabel gebunden. Damit zählt ein Treffer auch für die Knackpunkte (`dvIndexKey`).
  Fortschritt unter `en:hd:<Satz>`; die Rundenauswahl gewichtet wie bei den Vokabeln.
- Kein Netz, keine Cloud: nur lokale Stimmen, keine `SpeechRecognition`, Aufnahme nur im Browser.
  Kachel nur bei Theme 1 sichtbar; Ton und Mikrofon gehen bei jedem Bildschirmwechsel aus.

### Version 2.22.1 (10.10.2026)
- **Die nicht fetten Einträge sind aus dem Vokabelheft entfernt** — es enthält jetzt genau die
  66 Vokabeln, die auch geübt werden. Damit entfallen `nb: true`, die Klasse `.vh-passive` und
  die Legende unter dem Blatt. Zum Nachschlagen beim Lesen eines Textes fehlen sie nun; das war
  der ursprüngliche Grund, sie mitzuführen.
- **Päckchen neu geschnitten**: acht statt neun, Größen 10/9/10/7/6/6/9/9 statt bis hinunter zu 3.
  Die Reihenfolge des Buchs bleibt, die Buchstaben verschieben sich. Weil der Schlüssel einer
  Markierung den Buchstaben enthält (`en-theme1|B|rock`), hängt `vhMigriereEnglischeMarken()` sie
  beim Laden einmalig um und wirft Marken zu entfernten Wörtern weg.
- **Zwei Robustheitslöcher nebenbei geschlossen**, beide vom Prüflauf gefunden:
  `renderVokabelheft` stürzte bei einem Päckchen-Index jenseits der Liste ab (möglich nach einem
  Neuschnitt oder zwischen Heften unterschiedlicher Länge) — der Index wird jetzt geklemmt.
  Und die Antwortfelder einer Multiple-Choice-Frage blieben beim Wechsel in den Spelling-Modus
  unsichtbar im DOM stehen; `loadSpellingMode` räumt `#mcOptions` jetzt leer, und
  `selectMCOption` steigt aus, wenn es zum Wort keinen Zustand gibt.

### Version 2.22.0 (10.10.2026)
- **Englisch-Menü zweistufig wie Latein**: `setSelection` zeigt nur noch die Themen,
  die neue `englishModuleSelection` darunter die Lernkacheln des gewählten Themas
  (Vokabeln üben + Vokabelheft, letzteres nur bei Theme 1). „Say it in English" und
  „Alle Vokabeln" starten weiterhin direkt — sie gehören zu keinem Thema.
- `currentEnglishTheme` steuert, wohin „Zurück" führt: aus einer Runde in die Modulauswahl
  des Themas, aus den themenlosen Sonderfällen auf die Themenauswahl. `selectEnglishTheme`
  setzt zugleich `englishDvActive`, womit der 🎯-Schalter ab der Theme-1-Modulauswahl erscheint.
- `englishModuleSelection` ist in `hideAllScreens` und im Nachtmodus-Zweig berücksichtigt.

### Version 2.21.0 (10.10.2026)
- **Theme 1 „Back to Camden Town" (6. Klasse)**: die Buchseite von `welcome` bis `serious`.
  Geübt wird nur der aktive Wortschatz — im Buch die fett gesetzten Einträge, 66 von 96. Mit Emoji,
  Tipp und vier kuratierten Distraktoren je Eintrag; in „Alle Vokabeln" mit drin (jetzt 265).
- **Das `to` bleibt am Eintrag** — es zeigt an, dass es ein Verb ist. Beim Spelling steht es als
  feste Vorgabe in den ersten Feldern (`spellPrefix`, Slot-Klasse `fixed`, id `-2`); Pool und
  Füllbuchstaben lassen es aus, `clearAnswer` löscht es nicht, Klicks darauf laufen ins Leere.
  Nebeneffekt: `break` (Pause) und `to break` (verstoßen gegen) sind damit zwei verschiedene
  Lernwörter — im Multiple-Choice gibt es keine zweideutige Frage.
- **Keine Lautschrift im Heft.** Sie stand erst drin, machte die Seite aber unruhig.
- **Anwesenheitsliste jetzt auch auf schmalen Geräten**: Der 👥-Schalter ist dort sichtbar und
  klappt die Liste als kleines Fenster unter sich auf (`.presence-panel.mobil-offen`). Sie schließt
  sich nach 8 s, bei Tippen daneben oder erneutem Druck; der Herzschlag läuft die ganze Zeit
  weiter, damit man für die anderen sichtbar bleibt. Im Fenster steht ein „Liste ausschalten".
  `presenceGeradeAuf` verhindert, dass der öffnende Klick beim Weiterlaufen zum Dokument das
  Fenster sofort wieder schließt — genau das passierte nach der Namenseingabe.
- Die 30 nicht fetten Einträge der Buchseite waren zunächst blass im Heft mitgeführt; seit
  v2.22.1 sind sie ganz draußen (siehe dort).
- **8 Einträge sind `mcOnly`** — Klammern oder Punkte machen sie als Buchstaben-Puzzle unzumutbar
  (`didn't (= did not)`, `(Great) Britain`, `present (sth to sb)` …). `roundModes` erzwingt dort
  Multiple-Choice, in beiden Rundenaufbauten.
- **Englisches Vokabelheft** als `vokabelheftData['en-theme1']`, neun Päckchen A–I. Neue Zeilen-
  eigenschaft `ph` (Lautschrift) steht klein unter dem Wort und wird nie abgedeckt; Spalte 2 führt
  nur Formen wie `simple past: sent`. Beispielsätze ohne Übersetzung rendern einzeilig.
- **Knackpunkte sprachübergreifend**: `dvContextKey()` ersetzt den direkten Zugriff auf
  `currentLatinChapterKey` in `dvActiveWords`, `dvMarkKeysForWord`, `dvUpdateToggle` und beim
  Bau der Markierungsschlüssel. Englische Marken heißen `en-theme1|A|welcome`.
- Die englische Runde läuft über `dvSampleRound` statt `weightedSample`; `dvIndexItems` hinterlegt
  vorher die Zuordnung Fortschrittsschlüssel → Heftvokabel.
- Menü-Kacheln tragen jetzt die Klassenstufe (6. Klasse Theme 1, 5. Klasse Theme 2/3/April).
- Acht englische Wörter kommen in mehreren Sets vor (`group`, `quite`, `both`, `suddenly`,
  `break`, `message`, `stupid`, `another`) und teilen sich damit den Lernfortschritt — das war
  schon vorher so und bleibt gewollt.

### Version 2.20.1 (10.10.2026)
- **Gleiche Vornamen werden in der Liste gebündelt** (`buendleNachName` in `index.html`):
  wer auf mehreren Geräten übt, steht einmal da, mit dem jüngsten Zeitstempel und der
  jüngsten Schreibweise. Groß-/Kleinschreibung spielt keine Rolle; ist eines der Geräte
  das eigene, gilt die Zeile als eigene. Rein clientseitig — der Worker bleibt unberührt.
- Die Auswertungen in [`worker/README.md`](worker/README.md) gruppieren entsprechend nach
  `lower(name)` statt nach `id`, sonst zählte der Monatsbericht weiter Geräte statt Kinder.
- **Changelog der Versionen 2.19.0 und 2.20.0 eingedampft.** Die ausführliche Beschreibung
  der Anwesenheitsfunktion las sich beim ersten Mal wie eine Überwachungsankündigung. Dass
  die Übezeit mitgezählt wird, steht weiterhin drin — in einem Satz.

### Version 2.20.0 (04.10.2026)
- **Nutzungszählung im Worker**: zweite D1-Tabelle `nutzung`, eine Zeile pro Gerät und Tag.
  `takte` zählt alle Herzschläge (App offen), `aktive` nur die mit einer Antwort in den
  letzten 90 Sekunden (tatsächlich geübt). Übezeit = `aktive` × 20 s.
- Die App schickt dafür ein zusätzliches Feld `aktiv` im Herzschlag; gespeist wird es aus
  `recordAnswer`, gilt also modulübergreifend. Keine zusätzlichen Anfragen, kein Fremdskript —
  die Seite bleibt eine Datei und offline benutzbar.
- Die Zählung ist im Worker in `try/catch` gekapselt: fehlt die Tabelle oder scheitert der
  Schreibvorgang, liefert die Anwesenheitsliste trotzdem. Zeilen verfallen nach 400 Tagen.
- Fertige Auswertungen (kumulativ, pro Tag/Woche/Monat, pro Kind) in
  [`worker/README.md`](worker/README.md) — samt dem, was die Zahlen *nicht* sagen.
- **Die Liste reicht sieben Tage zurück** statt einer Stunde (`FENSTER_MS` im Worker =
  `VERFALL_MS`); wie weit tatsächlich angezeigt wird, entscheidet `PRESENCE_FENSTER_MS` in
  der App. Grün bleibt die Anzeige für die letzten zwei Minuten. Die Liste scrollt ab 60 vh.
- Gezählt wird nur bei eingeschalteter Liste. Wer 👥 ausschaltet, taucht nirgends auf.

### Version 2.19.0 (04.10.2026)
- **Anwesenheitsliste „Gerade da"** als fixierte Spalte links neben dem App-Container
  (`.presence-panel`): Vorname, grüner Punkt bei Aktivität in den letzten 2 Minuten, Zeit seit
  dem letzten Lebenszeichen (`jetzt` / `4m` / `2h` / `3d`). Unter 1180 px Fensterbreite
  ausgeblendet — dort ist neben der App kein Platz.
- **Vornamen-Abfrage** als eigene Vorschaltseite nach dem Changelog, einmalig beim ersten Start
  (`vokabelVorname`). „Lieber nicht anzeigen" schaltet die Liste ab (`vokabelAnwesenheitAus`).
- **Schalter 👥 oben rechts** (`.presence-toggle`, rechts neben dem Emoji-Schalter) blendet die
  Liste jederzeit aus und wieder ein; ist noch kein Vorname hinterlegt, fragt das Einschalten
  danach. Klick auf die eigene Zeile der Liste öffnet dieselbe Frage zum Ändern. Die Vorschaltseite
  merkt sich dabei den gerade sichtbaren Bildschirm und stellt ihn danach wieder her — die Frage
  darf also auch mitten in einer Übung kommen. Der Knackpunkte-Schalter rückt dafür von
  `right: 146px` auf `210px`, damit die immer sichtbaren Schalter beieinanderstehen.
- **Offline unverändert benutzbar**: Die App lädt weiterhin nichts aus dem Netz. Scheitert
  `fetchPresence()`, steht unter der Liste `keine Verbindung`, alles andere läuft weiter —
  deshalb fiel die Wahl auf einen `fetch()`-Endpunkt statt eines CDN-SDK.
- **Gegenstelle** (`worker/`): Cloudflare Worker + D1, ~90 Zeilen, eine Route `POST /` mit
  `{id, name}` — Herzschlag und Abfrage in einem Aufruf, Takt 20 s. Läuft unter
  `https://bertha-presence.marcator.workers.dev/`, eingetragen in `PRESENCE_API`. Ist die
  Konstante leer, zeigt die Liste stattdessen Beispielnamen. Einrichtung Schritt für Schritt in
  [`worker/README.md`](worker/README.md).
- **Übertragen werden nur Vorname, eine im Browser erzeugte Geräte-ID und ein Zeitstempel** —
  kein Lernfortschritt, keine Taler, keine IP. Zeilen ohne Lebenszeichen verfallen nach 7 Tagen.
- **Nur die Oberfläche — es gibt keinen Server.** `fetchPresence()` liefert drei feste
  Beispielnamen; die Kinder sehen sich noch nicht gegenseitig. Das steht als Hinweis unter der
  Liste. `fetchPresence()` ist bewusst die einzige Stelle, die eine spätere Gegenstelle ersetzt —
  Rückgabeform `[{ name, lastSeen, self }]`, der Rest der Oberfläche bleibt unberührt.
- Namen werden per `textContent` gesetzt, nicht per `innerHTML` — fremde Eingaben landen später
  ungeprüft in dieser Liste.
- Ein **Klassencode** ist bewusst noch nicht eingebaut; er kommt, sobald die Kinder
  miteinander kommunizieren können.

### Version 2.18.0 (16.09.2026)
- **Neues Modul-übergreifendes Feature „🎯 Knackpunkte"**: Schalter oben rechts (links neben dem
  Emoji-Schalter), sichtbar sobald eine Latein-Lektion gewählt ist. Die Zahl am Schalter nennt
  die Zahl der gerade fälligen markierten Vokabeln.
- Gefiltert werden Vokabeln, Verb-Formen, Substantive, Perfekt, Schlange, Rakete, Profi-Rakete
  und „Alles gemischt"; ab 10 markierten Vokabeln ausschließlich diese, darunter vollständig
  plus Auffüllung. Die Überschrift der Runde sagt, was gerade gilt.
- **Markierungen tragen jetzt Fortschritt**: 3× richtig → Vokabel ruht bis zum nächsten Tag
  (Punkt im Vokabelheft verblasst); 3 solche Tage → Markierung wird entfernt. Gezählt wird in
  `recordAnswer`, also über alle Module hinweg und unabhängig vom Schalter.
- Datenformat von `vokabelheftSchwierig` erweitert (`1` → `{h, d, r}`); alte Markierungen werden
  beim Lesen übernommen, manuelles Setzen/Löschen im Vokabelheft bleibt unverändert.

### Version 2.17.1 (15.09.2026)
- Abdeckblatt: **fehlende Trennzeichen** werden verkraftet — „das Forum der Marktplatz die
  Öffentlichkeit" zählt wie die Kommaschreibweise, ebenso „und" oder „/"
- Abdeckblatt: **Zeilenumbruch und nachgestellte Kursivangabe trennen** ebenfalls. `cibī _m_`
  und `fugiō\n_m. Akk._` sind je zwei Angaben, einzeln bewertet und einzeln markiert
- Abdeckblatt: ein **falsches Geschlecht** (n statt m) ist kein Tippfehler mehr; ein
  **fehlendes** bleibt nachsichtig behandelt
- Auswertungsreihenfolge: wörtlicher Fund schlägt Tippfehler-Distanz (sonst wurde „vītae f"
  als Tippfehler statt als Treffer gewertet)

### Version 2.17.0 (15.09.2026)
- **Abdeckblatt im Vokabelheft**: ein liniertes Blatt fährt über die mittlere und die rechte Spalte;
  Formen und Bedeutung füllt das Kind selbst in Lücken (`___`) aus, Tab/Enter springt weiter
- **Blatt danebenziehen**: zum Vergleichen gleitet das Blatt zur Seite (≤600 px: nach unten),
  eigenes Blatt und Heft stehen nebeneinander
- **Rückmeldung ohne Rotstift**: grün = getroffen, orange = nur vertippt (inhaltlich richtig),
  Nichtgetipptes bleibt unkommentiert. Nicht genannte Bedeutungen werden im **Heft** gelb markiert,
  nicht auf dem Blatt des Kindes angestrichen. Zusammenfassung in ermutigendem Ton.
- Auswertung ist absichtlich nachsichtig: Artikel dürfen fehlen („der Sklave" = „Sklave"),
  Klammerzusätze sind optional, Makronen egal, ein Tippfehler zählt als gewusst

### Version 2.16.0 (08.09.2026)
- **Neues Modul „Perfekt"** (nur Lektion 8): Infinitiv ↔ Perfekt und Bildungstyp bestimmen
  (v-Perfekt, u-Perfekt, unregelmäßig) — 12 Verben, 36 Aufgaben
- **Tabellentraining**: i-Erweiterung als eigene Konjugationsgruppe (capere, incipere, fugere, facere)
- Keine Aufgaben mehr, deren Antwort im Prompt steht; vier Übungssätze berichtigt;
  acht Plural-Bedeutungen und sechs doppelte Emojis bereinigt

### Version 2.15.0 (08.09.2026)
- **Latein Lektion 8** (Amphitheater & Gladiatoren): 47 Vokabeln in 5 Päckchen, 8 Mehrwort-Ausdrücke,
  15 Verb-Formen, 11 Substantive, 12 Beispielsätze — voller Modulumfang inkl. Profi-Rakete und Nachtmodus
- **Perfekt** als neue Stammform im Vokabelheft (12 Verben mit hinterlegter Perfektform)
- Nebensatz-Konjunktionen (cum, quia, nisī, quamquam, postquam) und Pronomen (vōs, nōbīs, sēcum)
- Konsonantische Deklination auf -x (vōx, pāx) und auf -ō (leō)
- Deutsche Konjugation: Zischlaut-Stämme (du entreißt) und -el/-er-Stämme (wir ändern)

### Version 2.14.0 (08.09.2026)
- **Schlange**: Wortstämme aus den echten Formen abgeleitet (3. Konjugation, konsonantische
  Deklination); endungslose Formen (arbor, puer, vir) mit leerem Feld lösbar; unregelmäßige
  Nominative werden übersprungen; Hinweistext stimmt mit der akzeptierten Antwort überein
- **Deutsche Hilfssätze**: Doppel-n, trennbare Präfixe, Kommalisten, starke Verben, Genitiv auf -es
- **Pluralia tantum** (līberī, superī) mit eigenem Anzeigenamen statt „null"
- **Vokabelabgleich gegen das gedruckte Heft** für Lektion 1–7 anhand neuer Fotos
- Neu: `tools/latein-check.mjs` — Fehlerfinder für die Latein-Daten, siehe `tools/README.md`

### Version 2.13.1 (07.09.2026)
- Legende im Vokabelheft korrigiert: roter Stern = **grammatikalische Besonderheit**
  (in 2.13.0 stand dort eine falsche Erklärung; an den Vokabeldaten ändert sich nichts)

### Version 2.13.0 (07.09.2026)
- **Emojis abschaltbar**: grüner Schalter oben rechts blendet die Bilder über den Vokabeln aus
  (Vokabel-Runden, „0 → 100", Rakete). Einstellung wird in localStorage gespeichert.
- **Neues Latein-Modul „Vokabelheft"**: Vokabeln kapitelweise, Auswahl päckchenweise (oder „Alle"),
  dreispaltig wie im gedruckten Heft – Wort · Formen/Grammatik · Bedeutung, mit Beispielsätzen
- **Schwierige Vokabeln markieren**: Zeile im Vokabelheft antippen → oranger Punkt davor,
  Zeile hervorgehoben; nochmal antippen hebt es auf. Wird in localStorage gespeichert
- Vokabelheft für Lektion 1, 3, 4, 5, 6 und 7 – 255 Einträge, Reihenfolge und Wortlaut wie im Buch;
  roter Stern = grammatikalische Besonderheit
- **Bug-Fix Modulauswahl**: „Alles gemischt" wurde in Lektion 1 angezeigt, obwohl das Kapitel keine
  Verben/Substantive/Sätze hat; gleichzeitig verschwand danach im englischen Menü „Alle Vokabeln".
  Ursache: `.module-card.mixed` traf die englische Kachel – die Suche ist jetzt auf die Latein-Modulauswahl begrenzt.

### Version 2.12.0 (06.09.2026)
- **Latein Lektion 6** (Merkur & Apollon): 43 Vokabeln, 7 Verb-Formen, 11 Substantive, 12 Beispielsätze, 8 Mehrwort-Ausdrücke
- **Latein Lektion 7** (Forum & Händler): 41 Vokabeln, 16 Verb-Formen, 13 Substantive, 12 Beispielsätze, 8 Mehrwort-Ausdrücke
- **Konsonantische Deklination** als dritter Nomen-Typ (mercātor, clāmor, labor, amor, arbor, lībertās, celeritās) – Tabellentraining und Schlange erkennen sie automatisch
- Voller Modulumfang in beiden neuen Lektionen inkl. 0 → 100, Tabellentraining, Schlange und Profi-Rakete
- 0 → 100 mit Sub-Sektionen jetzt auch für Lektion 6 und 7 (je 5 Abschnitte)
- Nachtmodus auch in Lektion 6 und 7 freischaltbar
- `abesse` und `posse` als unregelmäßige Verben (Präsens vollständig, ohne Imperativ)

### Version 2.11.7 (26.04.2026)
- Neues Latein-Hauptmodul „0 → 100": dreistufiger Aufwärm-Pfad (Schauen → Wiedererkennen → Rakete)
- Modul „🚀 Rakete" (Multiple-Choice unter Zeitdruck) mit Block-System und Schwerkraft-Slider
- Profi-Rakete (🚪): Bild und Erklärsatz von Anfang an aus
- Latein Lektion 1 (Davus & Syrus): 37 Vokabeln
- Anti-Cheat: Distraktoren mit und ohne Komma-Bedeutungen gemischt
- Nachtmodus in Latein Lektion 5; Bug-Fix Antwort-Feedback im Nachtmodus

### Version 2.7.0 (27.02.2026)
- Substantiv-Schlange: Nomen deklinieren durch Kasus×Numerus-Grid (5×2)
- Gemischte Auswahl: Verben und Nomen zufällig im Schlangen-Modul
- Deutsche Kasusformen (der/des/dem/den) bei jedem Deklinationsschritt
- Diāna (nur Singular) wird automatisch herausgefiltert

### Version 2.6.0 (27.02.2026)
- Neues Modul: Konjugationsschlange – Verb-Endungen spielerisch üben
- Schlange wächst durchs Personen×Numerus-Grid, nur Endung tippen
- Beispielsätze (Latein + Deutsch) bei jedem Schritt
- Jede Schlange endet mit dem Imperativ

### Version 2.5.0 (27.02.2026)
- Tabellentraining: Deutsche Spalte hinzugefügt, Infinitiv & Deutsch auch als Lücke
- Tabellen nach Konjugationsklasse (ā/ē/ī/unregelmäßig) und Deklination (a/o) getrennt
- Progressionssystem: Erst einzelne Typen üben, bei gutem Übungsstand → kombinierte Tabelle

### Version 2.4.0 (27.02.2026)
- Tabellentraining: Konjugations- & Deklinationstabellen im Terminal-Stil
- Komplette Kapitel-Übersichtstabellen mit zufälligen Lücken zum Ausfüllen
- Abwechselnd Verben- und Nomen-Tabellen (3-5 Felder pro Tabelle)
- Nur für Desktop / Tablet (Hinweis auf Modulkarte)

### Version 2.3.0 (27.02.2026)
- Verb-Formen erweitert: Präsens Indikativ Aktiv (alle 6 Personen) + Imperativ (Sg/Pl) für 32 Verben
- Neues Modul "Substantive": 18 Nomen deklinieren (Nom/Gen/Dat/Akk/Abl × Sg/Pl)
- a-Deklination (15 Nomen) + o-Deklination (4 Nomen) inkl. Diāna (nur Singular)

### Version 2.2.0 (25.02.2026)
- Lernhorizont: gewichtete Vokabelauswahl priorisiert schwächere Wörter
- Emoji-Vorhang: bereits gekonnte Vokabeln werden theatralisch enthüllt
- Fortschritt wird pro Übersetzungsrichtung getrackt (DE→EN / EN→DE / DE→LA / LA→DE)
- Lernstatistik pro Kapitel auf der Ergebnis-Seite (3× richtig = gelernt)
- Button "Lernfortschritt zurücksetzen" auf der Startseite

### Version 2.1.0 (25.02.2026)
- Latein Lektion 4 hinzugefügt: 42 Vokabeln (Diana & Verwandlung)
- 14 Verb-Formen + 9 Beispielsätze für Lektion 4
- Changelog-Vorschaltseite (wird einmalig pro neuer Version angezeigt)

### Version 2.0.0 (25.02.2026)
- Latein als zweite Sprache hinzugefügt (Lektion 3)
- Neue Navigation: Sprachauswahl → Kapitel → Modul
- 4 Latein-Module: Vokabeln, Verb-Formen, Beispielsätze, Alles gemischt
- Makron-Support für lateinische Buchstaben (ā, ē, ī, ō, ū)
- Mehrwort-Ausdrücke als MC in beide Richtungen
- Lückentext-Modus für Beispielsätze
- "Zurück"-Navigation auf jeder Ebene

### Version 1.1.0 (22.02.2026)
- Multiple-Choice-Modus (EN→DE) für Englisch
- Kuratierte Distraktoren für alle 140 Vokabeln
- "Weiter"-Button bei falscher MC-Antwort
- Theme 2 (At School) hinzugefügt (70 Wörter)
- Wiederholungsphase für MC-Fehler korrigiert

### Version 1.0.0 (21.02.2026)
- Initial Release
- Theme 3: Hobbies and activities
- 91 Vokabeln aus dem Englischbuch
- Taler-System implementiert
- Intelligente Wiederholungen

---

Erstellt für die 5. Klasse Gymnasium
