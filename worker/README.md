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
ein Zeitstempel. Keine IP-Adresse, kein Lernfortschritt, keine Taler. Nach sieben
Tagen ohne Lebenszeichen verschwindet die Zeile von selbst.
