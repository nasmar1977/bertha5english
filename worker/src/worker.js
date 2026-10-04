/**
 * Anwesenheits-Dienst für den Vokabeltrainer (bertha5english).
 *
 * Eine einzige Route: POST / mit { id, name }.
 * Der Aufruf ist Herzschlag und Abfrage in einem — er trägt den eigenen
 * Zeitstempel ein und gibt die Liste aller zurück, die in den letzten sieben
 * Tagen da waren. Die App ruft ihn alle 20 Sekunden.
 *
 * Bewusst nicht enthalten: Konten, Schlüssel, Chat. Wer die Adresse kennt,
 * kann einen Vornamen in die Liste schreiben — mehr gibt die Schnittstelle
 * nicht her. Ein Klassencode kommt erst, wenn die Kinder miteinander reden
 * können; dann gehört hier eine Prüfung hinein.
 */

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

// Beides sieben Tage: Was noch gespeichert ist, darf auch in der Liste stehen.
// Wie weit zurück tatsächlich angezeigt wird, entscheidet die App.
const FENSTER_MS   = 7 * 24 * 60 * 60 * 1000; // so lange bleibt jemand in der Liste
const VERFALL_MS   = 7 * 24 * 60 * 60 * 1000; // so lange bleibt eine Zeile überhaupt stehen
const MAX_EINTRAEGE = 30;
const NUTZUNG_VERFALL_MS = 400 * 24 * 60 * 60 * 1000;

// Tagesschlüssel in deutscher Zeit, damit der Abend nicht auf zwei Tage fällt.
// Sollte die Zeitzonen-Tabelle fehlen, lieber UTC als gar nichts.
function tagesschluessel(jetzt) {
    try {
        return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date(jetzt));
    } catch (e) {
        return new Date(jetzt).toISOString().slice(0, 10);
    }
}

// Vornamen auf Buchstaben eindampfen: keine spitzen Klammern, keine Emoji-Wände.
// Die App zeigt Namen zwar per textContent an (also ungefährlich), aber in der
// Liste soll auch nichts Hässliches stehen.
function saeubereName(roh) {
    return String(roh || '')
        .replace(/[^\p{L}\p{N} '\-]/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 16);
}

function json(daten, status = 200) {
    return new Response(JSON.stringify(daten), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
    });
}

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
        if (request.method !== 'POST')    return json({ fehler: 'nur POST' }, 405);

        let body;
        try {
            body = await request.json();
        } catch (e) {
            return json({ fehler: 'kein gültiges JSON' }, 400);
        }

        // Geräte-ID: von der App erzeugt, liegt dort im localStorage. Sie sorgt
        // dafür, dass ein geänderter Vorname dieselbe Zeile überschreibt,
        // statt eine zweite anzulegen.
        const id    = String(body.id || '').slice(0, 40);
        const name  = saeubereName(body.name);
        const aktiv = body.aktiv === true ? 1 : 0;   // in den letzten 90 s eine Antwort gegeben

        if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) return json({ fehler: 'id fehlt oder ist ungültig' }, 400);
        if (name.length < 2)                   return json({ fehler: 'name fehlt' }, 400);

        const jetzt = Date.now();

        await env.DB.prepare(
            `INSERT INTO presence (id, name, seen) VALUES (?1, ?2, ?3)
             ON CONFLICT(id) DO UPDATE SET name = ?2, seen = ?3`
        ).bind(id, name, jetzt).run();

        const { results } = await env.DB.prepare(
            `SELECT id, name, seen FROM presence
             WHERE seen > ?1 ORDER BY seen DESC LIMIT ?2`
        ).bind(jetzt - FENSTER_MS, MAX_EINTRAEGE).all();

        // Nutzungszählung: eine Zeile pro Gerät und Tag. "takte" zählt alle
        // Herzschläge (App offen), "aktive" nur die mit frischer Antwort
        // (tatsächlich geübt). Übezeit = aktive × 20 s.
        //
        // Bewusst abgesichert: geht hier etwas schief — etwa weil die Tabelle
        // noch fehlt —, bleibt die Anwesenheitsliste davon unberührt.
        try {
            await env.DB.prepare(
                `INSERT INTO nutzung (tag, id, name, takte, aktive, erste, letzte)
                 VALUES (?1, ?2, ?3, 1, ?4, ?5, ?5)
                 ON CONFLICT(tag, id) DO UPDATE SET
                     name   = ?3,
                     takte  = takte + 1,
                     aktive = aktive + ?4,
                     letzte = ?5`
            ).bind(tagesschluessel(jetzt), id, name, aktiv, jetzt).run();
        } catch (e) {
            // absichtlich still
        }

        // Gelegentlich alte Zeilen wegräumen — kein Cron nötig.
        if (Math.random() < 0.02) {
            await env.DB.prepare('DELETE FROM presence WHERE seen < ?1')
                .bind(jetzt - VERFALL_MS).run();
            try {
                await env.DB.prepare('DELETE FROM nutzung WHERE letzte < ?1')
                    .bind(jetzt - NUTZUNG_VERFALL_MS).run();
            } catch (e) {}
        }

        // "now" geht mit, damit die App eine falsch gestellte Uhr ausgleichen kann.
        return json({
            now: jetzt,
            liste: (results || []).map(r => ({ id: r.id, name: r.name, lastSeen: r.seen })),
        });
    },
};
