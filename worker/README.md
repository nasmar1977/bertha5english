# Anwesenheits-Dienst — Einrichtung Schritt für Schritt

Der kleine Server hinter der Liste „Gerade da" im Vokabeltrainer. Er läuft als
**Cloudflare Worker** mit einer **D1**-Datenbank und tut genau zwei Dinge: den
eigenen Zeitstempel eintragen und die Liste der letzten sieben Tage zurückgeben.

Drei Dateien, mehr ist es nicht:

| Datei | wozu |
|---|---|
| `src/worker.js` | der Dienst selbst (~90 Zeilen) |
| `schema.sql` | die eine Tabelle |
| `wrangler.toml` | Name, Einstiegspunkt, Datenbank-Bindung |

Von hausdev aus gibt es keinen Weg nach draußen — eingerichtet wird also
entweder im Browser oder auf dem Mac, nicht von der Entwicklungssitzung aus.

---

Es gibt zwei Wege. **Weg A braucht nichts außer dem Browser** — kein Node, kein
wrangler, keinen Clone. Nimm den, solange auf dem Mac noch nichts eingerichtet
ist. Weg B ist der Kommandozeilenweg; er lohnt erst, wenn du öfter am Worker
änderst.

---

# Weg A — nur im Cloudflare-Dashboard

Konto anlegen (kostenlos, ohne Kreditkarte): https://dash.cloudflare.com/sign-up

## A1 — Datenbank anlegen

**Storage & databases → D1 SQL database → Create Database**

Name: `bertha-presence`. Standort-Hinweis kannst du leer lassen. **Create.**

## A2 — Tabelle anlegen

In der neuen Datenbank auf **Console**. Die beiden Zeilen aus
[`schema.sql`](schema.sql) **nacheinander einzeln** eingeben, jeweils
**Execute**:

```sql
CREATE TABLE IF NOT EXISTS presence (id TEXT PRIMARY KEY, name TEXT NOT NULL, seen INTEGER NOT NULL);
```

```sql
CREATE INDEX IF NOT EXISTS presence_seen ON presence (seen);
```

```sql
CREATE TABLE IF NOT EXISTS nutzung (tag TEXT NOT NULL, id TEXT NOT NULL, name TEXT NOT NULL, takte INTEGER NOT NULL DEFAULT 0, aktive INTEGER NOT NULL DEFAULT 0, erste INTEGER NOT NULL, letzte INTEGER NOT NULL, PRIMARY KEY (tag, id));
```

```sql
CREATE INDEX IF NOT EXISTS nutzung_tag ON nutzung (tag);
```

> Die Konsole macht aus allem, was man hineinkopiert, **eine einzige Zeile**.
> Ein SQL-Kommentar (`--`) würde deshalb den gesamten Rest verschlucken, und die
> Antwort wäre `incomplete input: SQLITE_ERROR`. Darum steht in `schema.sql` kein
> Kommentar: `id` ist die Geräte-ID aus der App, `name` der Vorname (höchstens 16
> Zeichen), `seen` das letzte Lebenszeichen in Millisekunden seit 1970.

Danach `/tables` eingeben — `presence` und `nutzung` müssen in der Liste stehen.

## A3 — Worker anlegen

**Compute → Workers → Create** (im neuen Dashboard heißt der Knopf auf der
Startseite auch *Create app*). Dort die Vorlage **Hello World** wählen — nicht
den Git- oder Zip-Weg — und auf **Deploy** klicken.

Name: `bertha-presence`. Die Adresse lautet danach
`https://bertha-presence.DEIN-NAME.workers.dev`.

## A4 — Datenbank an den Worker binden

Im Worker auf **Bindings → Add binding → D1 database**:

| Feld | Wert |
|---|---|
| Variable name | `DB` |
| D1 database | `bertha-presence` |

**Add binding.** Der Name `DB` muss genau so geschrieben sein — der Worker sucht
danach.

## A5 — Code einsetzen

Im Worker auf **Edit code**, den vorhandenen Beispielcode **vollständig**
löschen, den Inhalt von [`src/worker.js`](src/worker.js) hineinkopieren und
**Deploy** drücken.

## A6 — Gegenprobe

Die Worker-Adresse im Browser aufrufen. Richtig ist:

```json
{"fehler":"nur POST"}
```

Das ist kein Fehler, sondern der Beweis, dass der Code läuft: die Schnittstelle
nimmt nur POST an, und ein Browser schickt GET.

- Steht dort noch **„Hello World!"**, ist der Code aus A5 nicht angekommen.
- Kommt **„no such table: presence"**, fehlt A2.
- Kommt ein Fehler über `env.DB`, fehlt oder heißt die Bindung aus A4 anders.

Danach: **Adresse an mich**, ich trage sie in `PRESENCE_API` ein.

---

# KI-Korrektur für „Sätze schreiben“ (Route `/korrektur`)

Seit App-Version 2.27.0 fragt das Modul „Sätze schreiben“ den Worker um eine
Zweitmeinung, wenn ein Satz zu keiner hinterlegten Musterlösung passt. Der
Worker reicht ihn an **Google Gemini** weiter. Der Schlüssel liegt nur im Worker,
die App kennt ihn nicht.

Solange die Schritte unten fehlen, antwortet die Route mit 503, und die App
prüft wie bisher allein. Ausfallen kann also nichts.

## K1 — Zähltabelle anlegen

D1-Datenbank → **Console**, einzeln und ohne Kommentar:

```sql
CREATE TABLE IF NOT EXISTS korrektur (tag TEXT NOT NULL, id TEXT NOT NULL, anzahl INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (tag, id));
```

Ohne diese Tabelle fragt der Worker die KI absichtlich gar nicht. Eine
Korrektur ohne Deckel soll es nicht geben.

## K2 — Gemini-Schlüssel als Secret

Schlüssel holen: https://aistudio.google.com/apikey → **Create API key**.
Am besten einen **neuen** nehmen, nicht den aus dem Klassenarbeit-Link: Der steht
schon in Links und Browserverläufen.

Im Worker: **Settings → Variables and Secrets → Add**

| Feld | Wert |
|---|---|
| Type | **Secret** (nicht *Text*) |
| Variable name | `GEMINI_KEY` |
| Value | der Schlüssel (`AIza…`) |

**Deploy** bzw. **Save**.

Ist das Hauptmodell überlastet (Google antwortet 503/500/504) oder im
Minutenlimit (429), fragt der Worker einmal ein Ersatzmodell
(`gemini-flash-latest`, ein Alias auf das jeweils aktuelle Flash-Modell mit
eigener Kapazität). Gezählt wird nur einmal. Mit der *Text*-Variable
`GEMINI_FALLBACK` lässt sich ein anderes Ersatzmodell eintragen; leer heißt
„kein zweiter Versuch“.

Optional als *Text*-Variable `GEMINI_MODEL`, falls Google
`gemini-3.1-flash-lite` einmal abschaltet. Dann lässt sich das Modell ohne
neuen Code tauschen. (Im Oktober 2026 nötig gewesen: `gemini-2.5-flash-lite`
gab neuen Projekten nur noch 404.)

## K3 — Code einsetzen

Wie A5: **Edit code**, alles ersetzen durch [`src/worker.js`](src/worker.js), **Deploy**.

## K4 — Gegenprobe

```bash
curl -s -X POST https://bertha-presence.marcator.workers.dev/korrektur \
  -H 'Content-Type: application/json' \
  -d '{"id":"probe-12345","de":"Er schickte Lara ins Krankenhaus.","loesung":"He sent Lara to hospital.","antwort":"He sent Lara into the hospital."}'
```

Richtig ist eine Antwort wie `{"ok":false,"korrigiert":"…","erklaerung":"…","rest":39}`.

| Antwort | Ursache |
|---|---|
| `keine KI eingerichtet` (503) | K2 fehlt, oder der Name ist nicht genau `GEMINI_KEY` |
| `zähler fehlt` (503) | K1 fehlt |
| `ki` (502), `status` 404 | Modell für dieses Projekt nicht (mehr) da → `GEMINI_MODEL` setzen |
| `ki` (502), `status` 402 | Kein Guthaben: Bezahlstufe ohne Prepaid-Guthaben in AI Studio |
| `ki` (502), sonst | Gemini lehnt ab, z. B. Schlüssel falsch |
| `limit` (429) | Tageslimit erreicht (40 pro Gerät, 400 insgesamt) |
| `ki-belegt` (503) | Hauptmodell **und** Ersatzmodell überlastet (Google-503/500/504) oder im Minutenlimit (429) – gleich nochmal versuchen |
| `name fehlt` (400) | Der alte Code läuft noch, K3 fehlt |

## Klassenarbeit: `/pruefen`, `/text`, `/lernplan`

Für `klassenarbeit.html`. Gleicher Schlüssel, gleiche Zähltabelle `korrektur`,
gleiches Tageslimit (40 Fragen pro Gerät **über alle Routen zusammen**, 400 insgesamt).
Nach dem Einsetzen des neuen Codes (K3) prüfen:

```bash
curl -s -X POST https://bertha-presence.marcator.workers.dev/pruefen \
  -H 'Content-Type: application/json' \
  -d '{"id":"testgeraet-1234","aufgabe":"Verneine den Satz im simple past: \"Tom went home.\"","loesung":"Tom didn'"'"'t go home.","antwort":"Tom did not go home"}'
```

Erwartet: `{"richtig":true,"erklaerung":"…","rest":…}`. Kommt `name fehlt` (400), läuft noch der alte Code.

| Route | schickt | bekommt |
|---|---|---|
| `/pruefen` | `id, aufgabe, loesung, antwort` | `richtig, erklaerung, rest` |
| `/text` | `id, text` (ab 20 Wörtern), optional `story` (`A`–`E`, sonst A) | `punkte` 0–18, `kriterien{wwww, rahmen, past, adjektive, connectives, speech}`, `lob[]`, `fehler[{original, besser, warum}]`, `tipps[]`, `rest` |
| `/lernplan` | `id, ergebnis, fehler` (Text) | `plan, rest` |

Die Seite fragt beim Laden `/pruefen` nur mit `id` an. Der neue Code antwortet
`aufgabe, loesung und antwort nötig` (400), **ohne** zu zählen. Erst dann zeigt sie
die KI-Knöpfe. Bei 429 (Tageslimit) und 503 verschwinden die Knöpfe für die Sitzung,
außer bei 503 `ki-belegt`: Das ist Geminis Minutenlimit, dann heißt es „gleich nochmal“.

**Was der Worker selbst entscheidet**, statt es der KI zu glauben:

- `/pruefen`: `richtig` wird auf `false` gesetzt, wenn die Antwort länger als
  2 × Musterlösung + 15 Zeichen ist, Steuerwörter enthält (ignore, instruction,
  Anweisung, Regel, richtig, correct, true, system, prompt) oder weniger als die
  Hälfte der Wörter der Musterlösung trifft. Bei Lösungen mit 1–3 Wörtern
  (Vokabeln, Verbformen) entfällt die Überlappungsprüfung, Synonyme bleiben möglich.
- `/text`: Gemini liefert sechs Kriterien je 0–3. Der Worker summiert. Ohne
  Anführungszeichen im Text gibt es bei speech höchstens 1, mit weniger als zwei
  connectives aus der Seitenliste bei connectives höchstens 1. Unter 80 Wörtern
  gilt ¾ der Summe. Ist eine Zahl ungültig, kommt `ki` (502) statt einer Null.

`ki-belegt` (503) kommt jetzt auch von `/korrektur`, wenn Gemini das Minutenlimit
meldet. Bisher war das ein 429 `limit` und hat in der App die KI für die Sitzung
abgeschaltet.

## Was die KI bekommt

Den deutschen Satz, die Musterlösung und die Antwort des Kindes, mehr nicht
(bei der Klassenarbeit: Aufgabe, Musterlösung, Antwort bzw. die Geschichte oder die Fehlerliste). Kein
Vorname, keine Geräte-ID (die bleibt im Worker und dient nur dem Zähler).
In der Gratis-Stufe darf Google die Eingaben zum Verbessern seiner Modelle nutzen.
Hier sind das Schulsätze ohne persönliche Daten.

**Absicherung in der App:** Findet die eigene Prüfung eine falsche Form
desselben Worts (send/sent, fall/fell, want/wanted), zählt ein „ok“ der KI
nicht. Die Grammatik von Theme 1 entscheidet also nie die KI allein.

---

# Weg B — Kommandozeile (wrangler)

Nur nötig, wenn du am Worker weiterarbeiten willst. Voraussetzung: **Node 18+**
auf dem Mac (`node -v`), dazu dieses Verzeichnis — das Repo ist öffentlich, also
genügt `git clone https://github.com/nasmar1977/bertha5english.git`.

Alle Befehle im Ordner `worker/`:

```bash
npx wrangler login                       # Browser öffnet sich, bestätigen
npx wrangler d1 create bertha-presence   # gibt die database_id aus
#   → die ID in wrangler.toml eintragen, wo HIER_DIE_ID_EINSETZEN steht
npx wrangler d1 execute bertha-presence --remote --file=./schema.sql
npx wrangler deploy                      # nennt am Ende die Adresse
```

> `--remote` ist wichtig. Ohne das Wort landet die Tabelle nur in einer lokalen
> Testdatenbank auf dem Mac, und der Worker findet sie nicht.

Gegenprobe:

```bash
curl -X POST https://bertha-presence.DEIN-NAME.workers.dev \
  -H 'Content-Type: application/json' \
  -d '{"id":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee","name":"Testkind"}'
```

Richtig ist eine Antwort dieser Form:

```json
{"now":1791134548676,"liste":[{"id":"aaaaaaaa-...","name":"Testkind","lastSeen":1791134548676}]}
```

**Hast du Weg A genommen, lass `wrangler.toml` wie sie ist.** Die Datei stört
dort nicht; sie wird erst gebraucht, wenn du später auf die Kommandozeile
wechselst — dann gehört die `database_id` aus dem Dashboard hinein
(D1 → `bertha-presence` → Settings).

---

## Die App anschließen

In `index.html` steht die Worker-Adresse (mit abschließendem `/`):

```js
const PRESENCE_API = "https://bertha-presence.marcator.workers.dev/";
```

Seit 2026-10-04 steht dort die laufende Adresse. Leert man die Konstante, fällt
die Liste auf Beispielnamen zurück — die App läuft also auch ohne Server.

**Nach dem Testen aufräumen:** Probeläufe stehen **bis zu einer Woche** in der
Liste der Kinder — die Liste reicht so weit zurück. In der D1-Konsole wegräumen:

```sql
DELETE FROM presence;
```

---

## Danach

**Was das kostet:** nichts. Die Freistufe liegt bei 100.000 Worker-Anfragen und
100.000 D1-Schreibvorgängen am Tag. Fünf Kinder mit je einer halben Stunde
Üben kommen auf rund 450 Anfragen — gut zwei Promille davon. Ohne Kreditkarte im
Konto kann auch nichts überlaufen und abgerechnet werden.

**Nachsehen und aufräumen geht auch im Dashboard**: D1 → `bertha-presence` →
**Console**, und dort `SELECT * FROM presence` oder `DELETE FROM presence`
ausführen. Mit wrangler auf dem Mac geht dasselbe so:

**Nachsehen, wer drinsteht:**

```bash
npx wrangler d1 execute bertha-presence --remote \
  --command "SELECT name, datetime(seen/1000,'unixepoch','localtime') AS zuletzt FROM presence ORDER BY seen DESC"
```

**Liste leeren** (etwa nach dem Testen):

```bash
npx wrangler d1 execute bertha-presence --remote --command "DELETE FROM presence"
```

**Alles wieder abschalten:** im Dashboard den Worker unter *Settings* löschen und
die D1-Datenbank ebenso — oder auf dem Mac:

```bash
npx wrangler delete                       # Worker weg
npx wrangler d1 delete bertha-presence    # Datenbank weg
```

Danach `PRESENCE_API` wieder auf `''` setzen — die App fällt auf die
Beispielnamen zurück, sonst ändert sich nichts.

---

## Auswertung — Übezeit und Kinderzahl

Jeder Herzschlag erhöht in `nutzung` eine Zeile pro **Gerät und Tag**:

| Spalte | bedeutet |
|---|---|
| `takte` | alle Herzschläge — **App war offen** |
| `aktive` | nur Herzschläge mit frischer Antwort — **es wurde geübt** |
| `erste` / `letzte` | erster und letzter Kontakt des Tages |

Ein Takt sind 20 Sekunden. **Übezeit = `aktive` × 20 s.** Alle Abfragen in der
D1-Konsole, jeweils einzeilig eingeben:

**Kumulativ, alles zusammen**

```sql
SELECT ROUND(SUM(aktive)*20/3600.0, 1) AS stunden_geuebt, ROUND(SUM(takte)*20/3600.0, 1) AS stunden_offen, COUNT(DISTINCT lower(name)) AS kinder, MIN(tag) AS seit FROM nutzung;
```

**Pro Tag**

```sql
SELECT tag, ROUND(SUM(aktive)*20/60.0) AS minuten, COUNT(DISTINCT lower(name)) AS kinder FROM nutzung GROUP BY tag ORDER BY tag DESC LIMIT 30;
```

**Pro Woche**

```sql
SELECT strftime('%Y-KW%W', tag) AS woche, ROUND(SUM(aktive)*20/60.0) AS minuten, COUNT(DISTINCT lower(name)) AS kinder FROM nutzung GROUP BY woche ORDER BY woche DESC;
```

**Pro Monat** — hier steht auch die Zahl der Kinder, die den Trainer in dem Monat genutzt haben

```sql
SELECT substr(tag,1,7) AS monat, ROUND(SUM(aktive)*20/3600.0, 1) AS stunden, COUNT(DISTINCT lower(name)) AS kinder FROM nutzung GROUP BY monat ORDER BY monat DESC;
```

**Pro Kind, gesamt**

```sql
SELECT MAX(name) AS kind, ROUND(SUM(aktive)*20/60.0) AS minuten, COUNT(DISTINCT tag) AS tage, MAX(tag) AS zuletzt FROM nutzung GROUP BY lower(name) ORDER BY minuten DESC;
```

**Pro Kind und Monat**

```sql
SELECT substr(tag,1,7) AS monat, MAX(name) AS kind, ROUND(SUM(aktive)*20/60.0) AS minuten, COUNT(DISTINCT tag) AS tage FROM nutzung GROUP BY monat, lower(name) ORDER BY monat DESC, minuten DESC;
```

### Was die Zahlen nicht sagen

- **Nur Kinder mit eingeschalteter Liste werden gezählt.** Wer den Schalter 👥
  ausgeschaltet oder „Lieber nicht anzeigen" geklickt hat, meldet sich nie beim
  Worker — und soll das auch nicht, sonst wäre der Schalter eine Attrappe.
- **Gezählt wird nach Vorname.** Wer auf Tablet und Laptop übt, erscheint
  einmal — die Übezeiten beider Geräte werden addiert. Zwei Kinder mit
  demselben Vornamen wären dagegen eins; für `pro Gerät` statt `pro Kind`
  in den Abfragen `lower(name)` durch `id` ersetzen.
- **Die Übezeit ist auf 20 Sekunden genau** und immer eine Schätzung nach oben:
  der letzte Takt vor dem Schließen zählt voll.
- **`takte` minus `aktive`** ist die Zeit, in der die App offen stand, ohne dass
  jemand antwortete — Nachschlagen im Vokabelheft gehört dazu, Vergessen auch.
- Der Tag wechselt um Mitternacht **deutscher** Zeit.

## Was bewusst fehlt

- **Kein Klassencode.** Wer die Adresse kennt, kann einen Vornamen in die Liste
  schreiben. Mehr gibt die Schnittstelle nicht her: keine Fortschritte, keine
  Nachrichten, kein Lesen fremder Daten. Sobald die Kinder einander schreiben
  können, gehört hier eine Prüfung hinein — vorher wäre sie Zierde.
- **Keine Anmeldung, keine Konten.** Die Geräte-ID erzeugt der Browser selbst und
  behält sie im `localStorage`; sie sorgt nur dafür, dass ein geänderter Vorname
  dieselbe Zeile überschreibt.
- **Kein Cron.** Zeilen älter als sieben Tage räumt der Worker nebenbei weg.

## Gespeichert wird

Vorname (max. 16 Zeichen, auf Buchstaben gefiltert), eine zufällige Geräte-ID und
ein Zeitstempel. Für die KI-Korrektur zusätzlich je Tag und Gerät nur die
**Anzahl** der Anfragen (Tabelle `korrektur`, nach 30 Tagen weg), nicht die Sätze. Keine IP-Adresse, kein Lernfortschritt, keine Taler. Nach sieben
Tagen ohne Lebenszeichen verschwindet die Zeile von selbst.
