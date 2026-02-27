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
- **Substantive**: 18 Nomen deklinieren – Nom/Gen/Dat/Akk/Abl × Singular/Plural (a- und o-Deklination)
- **Beispielsätze**: 21 Lückentexte – lateinischer Satz + deutsche Übersetzung mit Lücke
- **Alles gemischt**: Kombination aller Module
- Makron-Unterstützung: Tiles zeigen ā/ē/ī/ō/ū, Tastatur-Eingabe 'a' passt zu 'ā'

## 🎯 Aktueller Stand

**Version:** 2.3.0
**Datum:** 27.02.2026
**Englisch:** 175 Vokabeln (Theme 2: 77 + Theme 3: 98)
**Latein:** Lektion 3 + 4 – 85 Vokabeln, 32 Verb-Formen (mit Präsens + Imperativ), 18 Substantive, 21 Beispielsätze

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
