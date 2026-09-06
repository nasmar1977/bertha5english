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

### 🇬🇧 Englisch
- Spelling-Modus (DE→EN): Buchstaben-Tiles zum englischen Wort zusammensetzen
- Multiple-Choice-Modus (EN→DE): 5 Optionen mit kuratierten Distraktoren
- Zufällige Modus-Zuweisung pro Wort in jeder Runde
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
- **Alles gemischt**: Kombination aller Module (ohne Tabellentraining)
- Makron-Unterstützung: Tiles zeigen ā/ē/ī/ō/ū, Tastatur-Eingabe 'a' passt zu 'ā'

## 🎯 Aktueller Stand

**Version:** 2.12.0
**Datum:** 06.09.2026
**Englisch:** 199 Vokabeln (Theme 2: 77 + Theme 3: 98 + Vokabeln April: 24) + 27 Redewendungen
**Latein:** Lektion 1 + 3 + 4 + 5 + 6 + 7 – 239 Vokabeln + 31 Mehrwort-Ausdrücke,
71 Verb-Formen, 62 Substantive, 57 Beispielsätze

| Lektion | Thema | Vokabeln | Verben | Substantive | Sätze | Module |
|---|---|---:|---:|---:|---:|---|
| 1 | Davus & Syrus | 37 | – | – | – | Vokabeln, Rakete, Profi-Rakete |
| 3 | Circus Maximus | 35 (+7) | 18 | 9 | 12 | alle |
| 4 | Diana & Verwandlung | 39 (+4) | 14 | 9 | 9 | alle |
| 5 | Prometheus & Minerva | 45 (+4) | 16 | 20 | 12 | alle |
| 6 | Merkur & Apollon | 42 (+8) | 7 | 11 | 12 | alle |
| 7 | Forum & Händler | 41 (+8) | 16 | 13 | 12 | alle |

(Zahl in Klammern = Mehrwort-Ausdrücke)

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
