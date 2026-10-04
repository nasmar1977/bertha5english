/**
 * Anwesenheits-Dienst für den Vokabeltrainer (bertha5english).
 *
 * Eine einzige Route: POST / mit { id, name }.
 * Der Aufruf ist Herzschlag und Abfrage in einem — er trägt den eigenen
 * Zeitstempel ein und gibt die Liste aller zurück, die in der letzten Stunde
 * da waren. Die App ruft ihn alle 20 Sekunden.
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

const FENSTER_MS   = 60 * 60 * 1000;          // so lange bleibt jemand in der Liste
const VERFALL_MS   = 7 * 24 * 60 * 60 * 1000; // so lange bleibt eine Zeile überhaupt stehen
const MAX_EINTRAEGE = 30;

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
        const id   = String(body.id || '').slice(0, 40);
        const name = saeubereName(body.name);

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

        // Gelegentlich alte Zeilen wegräumen — kein Cron nötig.
        if (Math.random() < 0.02) {
            await env.DB.prepare('DELETE FROM presence WHERE seen < ?1')
                .bind(jetzt - VERFALL_MS).run();
        }

        // "now" geht mit, damit die App eine falsch gestellte Uhr ausgleichen kann.
        return json({
            now: jetzt,
            liste: (results || []).map(r => ({ id: r.id, name: r.name, lastSeen: r.seen })),
        });
    },
};
