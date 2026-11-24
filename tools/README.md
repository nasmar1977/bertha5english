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

Steht eine Klassenarbeit an: In `ARBEIT.wdh` die Lektionen eintragen, die dafür wiederholt werden, und `ARBEIT.text`
anpassen. „🎯 Für die Arbeit“ (Voreinstellung beim Üben) umfasst dann Lernstufe 1 plus die Verben dieser Lektionen.

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
| `lernstufe` | Lernstufe passt nicht zu Lektion und Heft-Lektion |
| `praesens-abgleich`, `perfekt-abgleich` | erzeugte Präsensformen bzw. das Perfekt weichen von dem ab, was `index.html` für das Verb schon führt |
| `typ-abgleich` | Hinweis: `index.html` ordnet den Perfekt-Typ anders ein (velle, nōlle: dort „u“, hier besondere Verben) |

Nicht prüfbar: Perfektformen, die das Heft noch nicht nennt (Lernstufe 2, unregelmäßig), und alle Erklärtexte.
Dafür braucht es Schritt 3.

## `perfekt-pdf.py`

`python3 tools/perfekt-pdf.py` schreibt `latein-perfekt-tabellen.pdf` aus `latein-perfekt.html?druck=1`,
`--pruefen` meldet nur Höhe und Seitenzahl je Blatt. Braucht Playwright für Python mit einem Chromium; passt der
Standard-Browser nicht zur Bibliothek, nimmt das Skript den neuesten unter `~/.cache/ms-playwright/`. Das PDF bettet
die Schriften des Rechners ein, auf dem es läuft – nach Layout- oder Datenänderungen neu erzeugen und mit einchecken.
Der Druck ist auf Arial-Maße ausgelegt (hier: Liberation Sans); jedes Blatt soll unter 275 mm bleiben.

## Seite im Test fahren

`latein-perfekt.html?ohnesperre` schaltet die Tipp-Sperre ab (sonst verschluckt die Seite jeden Klick in den ersten
400 ms nach einem Neuzeichnen – gewollt, aber für automatische Durchläufe hinderlich). Rückfragen („Runde beenden“,
„Übersicht“ mitten in einer Station) sind echte `confirm`-Dialoge und müssen im Test beantwortet werden.
