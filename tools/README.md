# Fehlerfinder & Review-Loop für neue Vokabeln

Jedes Mal, wenn eine Lektion oder auch nur eine einzelne Vokabel dazukommt, wird dieser
Ablauf durchlaufen. Er ist aus den Fehlern entstanden, die am 07./08.09.2026 live waren —
jeder Prüfpunkt entspricht einem Fehler, der einem Kind eine Aufgabe kaputtgemacht hat.

## Der Loop

```
  1  Fotos ablegen        →  new vocabulary/latein/_fotos_<datum>/ + README mit Foto→Seite→Lektion
  2  Daten eintragen      →  vokabelheftData  UND  latinData  (beide, sonst laufen sie auseinander)
  3  node tools/latein-check.mjs
        FEHLER > 0  →  beheben, zurück zu 3
  4  Agent-Gegenprüfung   →  Fotos gegen Daten, Schwerpunkt Spalte 2 (Formen/Grammatik)
        Befunde  →  beheben, zurück zu 3
  5  Browser-Stichprobe   →  betroffene Module wirklich spielen (Schlange, 0→100, Rakete)
  6  Version + Changelog + Tag, dann Release
```

Schritt 3 ist die Pflicht, Schritt 4 die Kür — aber ohne 4 wären die Makronen in Spalte 2
nie aufgefallen, weil kein Skript sie gegen das gedruckte Heft halten kann.

## Was `latein-check.mjs` prüft

Aufruf: `node tools/latein-check.mjs` (alles) oder `node tools/latein-check.mjs chapter8`.
Exit-Code 0 = sauber, 1 = mindestens ein FEHLER.

| Prüfung | findet |
|---|---|
| `stamm+endung` | Schlange zeigt einen Stamm, der mit der Endung nicht die Zielform ergibt (war: `animadverte` + `ō`) |
| `hinweistext` | Die Auflösung nennt eine andere Endung als die, die akzeptiert wird (war: „tis" statt „itis") |
| `endungslos` | Formen ohne Endung (arbor, puer, vir) — müssen mit leerem Feld lösbar sein |
| `nom_sg-null` | Pluralia tantum erzeugen Aufgaben „null (die Kinder)" und kollidierende Fortschritts-Schlüssel |
| `doppelte-id` | Zwei Vokabeln teilen sich eine ID und damit den Lernstand (war: zweimal `v_in`) |
| `abschnitte` | Die 0→100-Päckchen weichen von den `// Abschnitt`-Markern ab |
| `distraktor` | Ein Distraktor ist die richtige Antwort oder teilt eine Bedeutung mit ihr |
| `mehrdeutig` | Zwei Vokabeln eines Kapitels haben dieselbe Bedeutung → 0→100-Stufe 2 wird unentscheidbar |
| `buchstabenkacheln` | Lösungen mit Leerzeichen oder `/` erzeugen leere, unbeschriftete Kacheln |
| `deutsch` | Kommalisten und trennbare Präfixe im `german`-Feld erzeugen Sätze wie „Ich bitten, angreife Hilfe." |
| `genitiv` | Deutsche Genitiv-Hilfe nach Zischlaut ohne -es („des Stolzs") |
| `heft-abgleich` | Vokabelheft und Trainingsdaten sagen verschiedene Dinge |
| `makronen` | Dasselbe Wort wird an verschiedenen Stellen verschieden geschrieben |
| `verraeter-klammer` | Lösung hat eine Klammer, aber höchstens ein Distraktor (Fehler). Das Kind hatte gemerkt: „Die mit Klammer ist immer richtig.“ Zwei braucht es, weil die Rakete nur 3 von 4 Distraktoren zieht. |
| `verraeter-bedeutungen` | Lösung hat mindestens 3 Bedeutungen, kein Distraktor kommt auf eine weniger (Warnung) |
| `verraeter-laenge` | Lösung mit mehreren Bedeutungen ist über ein Viertel länger als jeder Distraktor (Warnung) |

## Was der Fehlerfinder NICHT kann

Dafür braucht es Schritt 4 und ein Augenpaar:

- **Spalte 2 gegen das Foto.** Genitiv, Genus, Adjektivendungen, Rektionsangaben, Makronen —
  ein Skript kennt das gedruckte Heft nicht.
- **Kasus gegen Übersetzung.** `Puella in arbore cōnsīdit.` („auf dem Baum") mit der Übersetzung
  „auf den Baum" ist grammatisch beides für sich korrekt, zusammen aber falsch.
- **Ob eine Bedeutung stimmt.** Der Abgleich merkt nur, dass Heft und Training sich widersprechen,
  nicht wer recht hat.
- **Ob ein Beispielsatz sinnvoll ist.** „Ich komme mit dem Tempel." ist grammatisch tadellos.
- **Ob ein Distraktor eine Nebenbedeutung trifft**, die nicht im Buch-Eintrag steht. `cum` (als
  Subjunktion) heißt später auch „weil“, „obwohl“ und „nachdem“, `causa` auch „Schuld“. Solche
  Distraktoren lehren später etwas Falsches. Das findet nur ein Blick ins Wörterbuch.

## Neue Prüfung ergänzen

Die Prüfungen stehen als nummerierte Blöcke in `latein-check.mjs`, jeder mit `err()`,
`warn()` oder `info()`. Wenn ein neuer Fehler auftaucht, der einem Kind eine Aufgabe
kaputtmacht: erst hier eine Prüfung ergänzen, dann den Fehler beheben. So kann er nicht
zweimal passieren.

# Perfekt-Baukasten (`latein-perfekt.html`)

Die Seite hat eigene Verbdaten (`ROH`): Infinitiv, 1. Person Präsens, zerlegter Perfektstamm, Konjugation,
Untergruppe, Lektion, Bedeutung, Heft-Lektion des Perfekts, Hinweis. Die Schreibweise steht im Kommentar über `ROH`.

## Wenn eine Lektion oder ein Verb dazukommt

```
  1  Zeile in ROH ergänzen     →  in die Untergruppe, deren Regel das Verb zu 100 % erfüllt; sonst als Einzelfall (…E)
                                   mit Hinweis und eigenem Weg in PFAD_X
  2  node tools/perfekt-check.mjs
        FEHLER > 0  →  beheben, zurück zu 2
  3  Agent-Gegenprüfung        →  Perfektformen und Längenstriche, die das Heft (noch) nicht nennt
  4  python3 tools/perfekt-pdf.py   →  PDF neu erzeugen, Seitenzahl ansehen (jedes Blatt soll auf eine Seite passen)
  5  Version + Changelog + Tag, dann Release
```

Rückt die Klasse eine Lektion weiter, ändert sich nur die Lernstufe: Sie wird in `VERBEN` aus Lektion und Heft-Lektion
berechnet (`v.prio`) – dort die Grenzen anpassen, ebenso die Erwartung in Prüfung 3 des Skripts.

Steht eine Klassenarbeit an: In `ARBEIT` den Namen und die beiden Listen ersetzen – `blatt` (Verben, die auf dem
Wortschatz-Blatt der Arbeit **mit** Perfekt stehen) und `ohnePerfekt` (stehen dort ohne Perfekt). Daraus rechnet die
Seite alles Weitere: „🎯 Für die Arbeit“ (Voreinstellung beim Üben), die 🎯-Marken in den Tabellen, das Blatt
„Klassenarbeit“ und Lernstufe 1 (Perfekt im Heft von Lektion 8/9 **oder** auf dem Blatt). Das Wortschatz-Blatt selbst
steht als `vokabelheftData.ka1226` in `index.html`; die Prüfung `blatt-abgleich` vergleicht beides. Bekommt die
nächste Arbeit einen anderen Schlüssel, ihn im Prüfskript nachziehen.

Tabelle und Weg sind zweierlei: `v.t` ist die Tabelle (erster Buchstabe der Gruppe), `v.weg` der Weg zum Perfektstamm.
Sie unterscheiden sich nur bei posse, velle, nōlle (Gruppe `x2`): Tabelle 7, Weg u-Perfekt. Übungen, Rückmeldungen
und der Typ-Abgleich mit `index.html` nehmen `v.weg`.

Rücksprung: `latein-perfekt.html?von=arbeit` macht aus dem Zurück-Link „← Klassenarbeit“ (`index.html#latein-arbeit`).

## Was `perfekt-check.mjs` prüft

Aufruf: `node tools/perfekt-check.mjs` (mit `-v` zusätzlich die Zählung je Gruppe). Exit-Code 0 = sauber.
Das Skript wertet nur den Teil der Seite zwischen `//#REIN-ANFANG` und `//#REIN-ENDE` aus (Daten und Formenbildung).

| Prüfung | findet |
|---|---|
| `doppelt` | ein Verb zweimal, oder zwei Verben mit demselben Perfektstamm (dann wäre „Zurück zum Verb“ unlösbar) |
| `zerlegung` | unlesbare Zerlegung des Perfektstamms (`+`, `[]`), fremde Zeichen |
| `konjugation` | eingetragene Konjugation passt nicht zu Infinitiv und 1. Person |
| `weg` | der letzte Schritt des Wegs ergibt nicht den Perfektstamm, oder ein Schritt hat keine Erklärung |
| `gruppenregel` | ein Verb erfüllt die Regel seiner Untergruppe nicht (Fehler) – oder ein Einzelfall passt doch in eine Regel (Warnung) |
| `faustregel` | die Marke „geht nach der Faustregel“ widerspricht der Form |
| `heft-abgleich` | 1. Person, Perfekt, erste Lektion und Heft-Lektion weichen vom Vokabelheft in `index.html` ab; ein Heft-Verb fehlt |
| `lernstufe` | Lernstufe passt nicht zu Lektion, Heft-Lektion und Wortschatz-Blatt |
| `blatt` | `ARBEIT` nennt ein Verb doppelt oder eines, das es in den Verbdaten nicht gibt |
| `blatt-abgleich` | `ARBEIT.blatt` / `ohnePerfekt` weichen vom Wortschatz-Blatt in `index.html` (`vokabelheftData.ka1226`) ab: Verb fehlt, steht dort mit bzw. ohne Perfekt, 1. Person oder Perfekt lauten anders. Fehlt `ka1226`, gibt es nur einen Hinweis |
| `praesens-abgleich`, `perfekt-abgleich` | erzeugte Präsensformen bzw. das Perfekt weichen von dem ab, was `index.html` für das Verb schon führt |
| `typ-abgleich` | Hinweis: `index.html` ordnet den Perfekt-Typ anders ein als der Weg (`v.weg`) hier |

Nicht prüfbar: Perfektformen, die das Heft noch nicht nennt (Lernstufe 2, unregelmäßig), und alle Erklärtexte.
Dafür braucht es Schritt 3.

## `perfekt-pdf.py`

`python3 tools/perfekt-pdf.py` schreibt `latein-perfekt-tabellen.pdf` aus `latein-perfekt.html?druck=1`,
`--pruefen` meldet nur Höhe und Seitenzahl je Blatt. Braucht Playwright für Python mit einem Chromium; passt der
Standard-Browser nicht zur Bibliothek, nimmt das Skript den neuesten unter `~/.cache/ms-playwright/`. Das PDF bettet
die Schriften des Rechners ein, auf dem es läuft – nach Layout- oder Datenänderungen neu erzeugen und mit einchecken.
Der Druck ist auf Arial-Maße ausgelegt (hier: Liberation Sans); jedes Blatt soll unter 275 mm bleiben.

## Klassenarbeit: `arbeit-check.mjs` und `arbeit-pdf.py`

`node tools/arbeit-check.mjs` liest den Daten-Block von `latein-arbeit.html` (zwischen `//#REIN-ANFANG` und
`//#REIN-ENDE`) und gleicht ihn mit `index.html` und dem Perfekt-Baukasten ab.

| Prüfung | findet |
|---|---|
| `wortliste` | `LEX` und das Vokabelheft `vokabelheftData.ka1226` weichen ab (Wort, Formen, Bedeutung, Päckchen) |
| `verben` | die Verben mit Perfekt hier, in der Perfekt-Übung des Sets und in `ARBEIT.blatt` des Baukastens sind nicht dieselben |
| `familie` | Kopfverb nicht geführt, Infinitiv Perfekt passt nicht zum Perfekt vom Blatt, zu wenige oder gleiche dass-Sätze, Kopfverb sieht in beiden Zeiten gleich aus, Subjekt/Verb des Hauptsatzes fehlen, Rollentausch-Fassung gleicht einer richtigen |
| `satz` | Klammer, Infinitiv und Kopfverb eines erzeugten Satzes passen nicht zusammen (alle Fälle und Wortstellungen), Großschreibung am Satzanfang oder mitten im Satz |
| `ohne` | ein „Satz ohne AcI“ hat an der markierten Stelle keinen Infinitiv Präsens, sein Prädikat ist doch ein Kopfverb oder steht nicht auf dem Wortschatz-Blatt |
| `text` | Stichwort fehlt in der Wortliste, Fußnote fehlt oder bleibt unbenutzt, AcI-Marken unstimmig, Infinitiv ohne AcI hat keine Erklärung |
| `baustein` | Musterlösung oder „auch richtig“-Fassung erfüllt einen Baustein nicht – auch in Umschrift (ae, oe, ue, ss), klein geschrieben oder mit zerlegten Umlauten; eine als `falsch` hinterlegte Fassung geht durch; ein AcI-Satz geht ohne „dass“ durch (alles Fehler). Warnung: AcI-Satz ohne Gegenprobe, Muster trifft mitten im Wort oder auf beliebigen Text |
| `wortschatz` | ein Wort der Übersetzungstexte steht nicht auf dem Wortschatz-Blatt (die Lehrerin hat zugesagt, dass der Text der Arbeit diesen Wortschatz hat) |
| `markieren` | ein Wort lässt sich nach dem Nachschlagen im Vokabelheft markieren, wird im Set aber nicht geübt (die Marke verschwände nie) |

Nicht prüfbar: ob das Latein der Sätze und Texte stimmt und ob die Musterlösungen treffen. Dafür braucht es die
Agent-Gegenprüfung.

Die Daten des Sets `ka1226` in `index.html` sind einmalig aus dem abgeschriebenen Blatt erzeugt worden (Bild, Tipp und
falsche Antworten aus den Lektionen übernommen) und werden seitdem von Hand gepflegt. Kommt ein Wort dazu: Zeile im
Vokabelheft (`vokabelheftData.ka1226`), Eintrag in `latinData.ka1226.vocabulary` (Abschnittsgrenzen in
`introSectionsByChapter.ka1226` nachziehen) und Zeile in `LEX` in `latein-arbeit.html` – dann beide Prüfskripte.

Neuer Übersetzungstext: Eintrag in `TEXTE`. Schreibweise eines Satzes: Wörter mit Leerzeichen, `Form=Stichwort` zum
Nachschlagen (`_` statt Leerzeichen), `( … )` um den AcI vom Akkusativ bis zum Infinitiv, `@` hinter dem Infinitiv,
`#` hinter dem Kopfverb, `^1` für eine Fußnote. Zu jedem Satz gehören Musterlösung (`de`), weitere richtige Fassungen
(`auch`, ganze Sätze), Bausteine (`bau`: Anzeige, Muster, optional was nicht vorkommen darf – ohne Umlaute und ß, mit
`\\b` an den Wortgrenzen) und Gegenproben (`falsch`: typische falsche Übersetzungen, die nicht durchgehen dürfen –
falsche Zeit im dass-Satz, vertauschte Rollen). `zeit: 'pr'` am Satz, wenn seine Haupthandlung anders als im übrigen
Text im Präsens steht; `merk` für einen Hinweis zur Lösung.

`python3 tools/arbeit-pdf.py` schreibt `latein-arbeit-blaetter.pdf` (Spickzettel, je Text Arbeitsblatt und Lösung),
`--pruefen` meldet nur Höhe und Seitenzahl. Jedes Blatt soll unter 271 mm bleiben.

## Spaß-Datei: `gimmicks-check.mjs`

`gimmicks.js` gehört zu allen Seiten. Drei Dinge können dabei auseinanderlaufen, und genau die prüft das Skript:

| Prüfung | Was sie findet |
|---|---|
| `einbindung` | Seite bindet die Datei nicht, doppelt oder mit altem Fingerabdruck ein (`gimmicks.js?v=…`) |
| `betriebsart` | unbekanntes `data-gim`; `haupt` außerhalb von `index.html`; `voll` ohne Kopfleiste oder mit einer anderen Zahl von Melde-Stellen (`Gimmicks.antwort`) als in `HAKEN` hinterlegt; eine Seite meldet Antworten, hat aber keine Leiste |
| `abgleich` | Speicher-Schlüssel, Server-Adresse der Liste „Gerade da“, Punkte je Antwort, Länge der Serie, Takt der Liste und Schwelle des Nachtmodus stehen in `gimmicks.js` anders als in `index.html` |

```bash
node tools/gimmicks-check.mjs            # prüfen
node tools/gimmicks-check.mjs --setzen   # nach jeder Änderung an gimmicks.js: Fingerabdruck in alle Seiten eintragen
```

Kommentare zählen bei alledem nicht mit – eine auskommentierte Einbindung ist keine. Das Skript läuft nicht von
selbst: vor jedem Commit, der `gimmicks.js` oder eine Seite anfasst, von Hand aufrufen.

Der Fingerabdruck sind die ersten acht Zeichen der SHA-256-Summe der Datei. Er steht nur in der Adresse, damit der
Browser nach einer Änderung nicht die alte Fassung aus seinem Zwischenspeicher nimmt. Eine neue Seite bekommt die Zeile
`<script src="gimmicks.js?v=…" data-gim="knoepfe"></script>` direkt vor `</body>`; Seiten, die nicht zum Trainer
gehören, stehen im Skript in der Liste `OHNE`. Hat die Seite keine Kopfleiste (`.bar .in`), bekommt sie dort, wo
die zwei Knöpfe sitzen sollen, ein `<div class="gim-hier"></div>` – sonst schweben sie bei jeder Breite unten links
über dem Inhalt (das Skript warnt). Anordnen muss die Seite diesen Platz selbst, am besten als Teil einer Flex-Zeile
(`klassenarbeit.html`: `.kopfzeile`); ein `float` quetscht den Block darunter zusammen.

Soll eine Seite Punkte vergeben, braucht sie `data-gim="voll"`, die Kopfleiste `<div class="bar"><div class="in">`,
im `<head>` die Zeile, die den gemerkten Nachtmodus sofort setzt (aus `latein-arbeit.html` übernehmen), und
an jeder Stelle, an der eine Antwort feststeht, `if (window.Gimmicks) window.Gimmicks.antwort(richtig)` – mit einer
zweiten Angabe `0`, wenn die Antwort für die Serie zählen soll, aber keine Punkte bringt. Ein Fehlgriff wird sofort
gemeldet, nicht erst bei „Weiter“ (in den zwei Latein-Seiten macht das `fehlgriff()`). Die Zahl der Melde-Stellen
gehört danach in `HAKEN` im Prüfskript.

## Seite im Test fahren

**Netz sperren.** Der Server der Liste „Gerade da“ ist echt. Im Playwright-Test deshalb
`ctx.route(re.compile(r'^https?://'), lambda r: r.abort())`; ohne gespeicherten Vornamen (`vokabelVorname`) senden die
Unterseiten ohnehin nichts. Einen Regen löst `Gimmicks.regen('konfetti' | 'schnee')` aus, `Gimmicks.laeuft()` sagt, ob
noch einer läuft.


`latein-perfekt.html?ohnesperre` und `latein-arbeit.html?ohnesperre` schalten die Tipp-Sperre ab (sonst verschluckt die Seite jeden Klick in den ersten
400 ms nach einem Neuzeichnen – gewollt, aber für automatische Durchläufe hinderlich). Rückfragen („Runde beenden“,
„Übersicht“ mitten in einer Station) sind echte `confirm`-Dialoge und müssen im Test beantwortet werden.
