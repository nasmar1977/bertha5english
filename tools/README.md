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

## Was der Fehlerfinder NICHT kann

Dafür braucht es Schritt 4 und ein Augenpaar:

- **Spalte 2 gegen das Foto.** Genitiv, Genus, Adjektivendungen, Rektionsangaben, Makronen —
  ein Skript kennt das gedruckte Heft nicht.
- **Kasus gegen Übersetzung.** `Puella in arbore cōnsīdit.` („auf dem Baum") mit der Übersetzung
  „auf den Baum" ist grammatisch beides für sich korrekt, zusammen aber falsch.
- **Ob eine Bedeutung stimmt.** Der Abgleich merkt nur, dass Heft und Training sich widersprechen,
  nicht wer recht hat.
- **Ob ein Beispielsatz sinnvoll ist.** „Ich komme mit dem Tempel." ist grammatisch tadellos.

## Neue Prüfung ergänzen

Die Prüfungen stehen als nummerierte Blöcke in `latein-check.mjs`, jeder mit `err()`,
`warn()` oder `info()`. Wenn ein neuer Fehler auftaucht, der einem Kind eine Aufgabe
kaputtmacht: erst hier eine Prüfung ergänzen, dann den Fehler beheben. So kann er nicht
zweimal passieren.
