#!/usr/bin/env node
/* =========================================================
   rangliste-server.js – kleiner Server für die Online-Rangliste
   Läuft mit Node.js 18 oder neuer, ohne zusätzliche Pakete.

   Starten:   node server/rangliste-server.js
   Einstellungen (Umgebungsvariablen, alle optional):
     PORT             Port (Standard 8787)
     HOST             Adresse (Standard 127.0.0.1 – hinter einem
                      Reverse-Proxy mit HTTPS betreiben)
     ALLOWED_ORIGIN   Adresse des Spiels, z. B. https://verein.github.io
                      (Standard * = jede Seite darf zugreifen)
     DATEI            Speicherdatei (Standard server/scores.json)
     MAX_PUNKTE       größte erlaubte Punktzahl (Standard 1000000)
     RATE_MAX         Einträge pro Stunde und Absender (Standard 10)
     TRUST_PROXY=1    Absender aus X-Forwarded-For lesen (nur hinter
                      einem eigenen Reverse-Proxy einschalten!)
     ADMIN_TOKEN      Geheimwort zum Löschen einzelner Einträge
                      (ohne Wert ist das Löschen abgeschaltet)

   Schnittstelle:
     GET    /scores?limit=10   -> { "scores": [ { name, punkte, level, datum } ] }
     POST   /scores            -> { "platz": 3 }   (Body: JSON { name, punkte, level })
     DELETE /scores/<id>       -> Eintrag löschen (Header Authorization: Bearer <ADMIN_TOKEN>)
     GET    /health            -> { "ok": true }

   Datenschutz: Es werden nur Name, Punkte, Level und Datum gespeichert.
   Absender-Adressen (IP) bleiben nur kurz im Arbeitsspeicher, um Missbrauch
   zu begrenzen, und werden weder gespeichert noch protokolliert.
   Grenze: Punktzahlen kommen aus dem Browser und lassen sich dort fälschen.
   Der Server prüft nur, ob sie plausibel aussehen (Obergrenze, Rate-Limit).
   ========================================================= */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const DATEI = process.env.DATEI || path.join(__dirname, 'scores.json');
const ERLAUBTE_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const MAX_PUNKTE = Number(process.env.MAX_PUNKTE || 1000000);
const MAX_LEVEL = Number(process.env.MAX_LEVEL || 99);
const RATE_MAX = Number(process.env.RATE_MAX || 10);
const RATE_FENSTER_MS = 60 * 60 * 1000;
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const MAX_EINTRAEGE = 100;   // mehr behalten wir nicht
const MAX_NAME = 12;
const MAX_BODY = 2048;       // Byte

/* ---------- Speicher ---------- */
let eintraege = [];
try {
  const roh = JSON.parse(fs.readFileSync(DATEI, 'utf8'));
  if (Array.isArray(roh)) eintraege = roh.filter((e) => e && typeof e.id === 'string' && Number.isInteger(e.punkte));
} catch (e) { /* noch keine Datei: leer starten */ }

function speichern() {
  const temp = DATEI + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(eintraege));
  fs.renameSync(temp, DATEI); // atomar: nie eine halb geschriebene Datei
}

/* ---------- Rate-Limit (nur im Arbeitsspeicher) ---------- */
const versuche = new Map();
setInterval(() => {
  const grenze = Date.now() - RATE_FENSTER_MS;
  for (const [k, liste] of versuche) {
    const neu = liste.filter((t) => t > grenze);
    if (neu.length) versuche.set(k, neu); else versuche.delete(k);
  }
}, 10 * 60 * 1000).unref();

function absender(req) {
  let ip = req.socket.remoteAddress || '';
  if (TRUST_PROXY && req.headers['x-forwarded-for']) ip = String(req.headers['x-forwarded-for']).split(',')[0].trim();
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16); // nicht die IP selbst merken
}
function darfSenden(schluessel) {
  const jetzt = Date.now();
  const liste = (versuche.get(schluessel) || []).filter((t) => t > jetzt - RATE_FENSTER_MS);
  if (liste.length >= RATE_MAX) { versuche.set(schluessel, liste); return false; }
  liste.push(jetzt);
  versuche.set(schluessel, liste);
  return true;
}

/* ---------- Hilfsfunktionen ---------- */
function bereinigeName(name) {
  const sauber = String(name == null ? '' : name).replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return Array.from(sauber).slice(0, MAX_NAME).join('').trim() || 'Anonymous';
}

function antwort(res, status, daten, extra) {
  const text = daten == null ? '' : JSON.stringify(daten);
  res.writeHead(status, Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': ERLAUBTE_ORIGIN,
    'Vary': 'Origin'
  }, extra || {}));
  res.end(text);
}

function leseBody(req) {
  return new Promise((ok, fehler) => {
    let groesse = 0;
    let fertig = false;
    const teile = [];
    req.on('data', (c) => {
      if (fertig) return;               // Rest einer zu großen Anfrage wird verworfen
      groesse += c.length;
      if (groesse > MAX_BODY) { fertig = true; fehler(Object.assign(new Error('zu gross'), { status: 413 })); return; }
      teile.push(c);
    });
    req.on('end', () => { if (!fertig) ok(Buffer.concat(teile).toString('utf8')); });
    req.on('error', (e) => { if (!fertig) fehler(e); });
  });
}

function platzVon(punkte, id) {
  return eintraege.findIndex((e) => e.id === id) + 1 || null;
}

/* ---------- Anfragen ---------- */
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'OPTIONS') {
      return antwort(res, 204, null, {
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      });
    }
    if (req.method === 'GET' && url.pathname === '/health') return antwort(res, 200, { ok: true });

    if (req.method === 'GET' && url.pathname === '/scores') {
      const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit'), 10) || 10));
      return antwort(res, 200, {
        scores: eintraege.slice(0, limit).map((e) => ({ name: e.name, punkte: e.punkte, level: e.level, datum: e.datum }))
      });
    }

    if (req.method === 'POST' && url.pathname === '/scores') {
      if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) return antwort(res, 415, { fehler: 'JSON erwartet' });
      let daten;
      try { daten = JSON.parse(await leseBody(req)); } catch (e) {
        if (e.status === 413) {
          // zuerst antworten, dann die Verbindung schließen (der Absender sendet evtl. noch)
          res.on('finish', () => req.socket.destroy());
          return antwort(res, 413, { fehler: 'Anfrage zu gross' }, { 'Connection': 'close' });
        }
        return antwort(res, 400, { fehler: 'Ungueltiges JSON' });
      }
      if (!daten || typeof daten !== 'object' || Array.isArray(daten)) return antwort(res, 400, { fehler: 'Ungueltige Daten' });
      const { punkte, level } = daten;
      if (!Number.isInteger(punkte) || punkte < 1 || punkte > MAX_PUNKTE) return antwort(res, 422, { fehler: 'Ungueltige Punktzahl' });
      if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL) return antwort(res, 422, { fehler: 'Ungueltiges Level' });
      if (!darfSenden(absender(req))) return antwort(res, 429, { fehler: 'Zu viele Eintraege, bitte spaeter noch einmal' }, { 'Retry-After': '3600' });

      const eintrag = {
        id: crypto.randomBytes(8).toString('hex'),
        name: bereinigeName(daten.name),
        punkte,
        level,
        datum: new Date().toISOString().slice(0, 10)
      };
      // nach Punkten absteigend einsortieren; bei Gleichstand steht der ältere Eintrag vorn
      let pos = eintraege.findIndex((e) => punkte > e.punkte);
      if (pos === -1) pos = eintraege.length;
      eintraege.splice(pos, 0, eintrag);
      eintraege = eintraege.slice(0, MAX_EINTRAEGE);
      speichern();
      return antwort(res, 201, { platz: platzVon(punkte, eintrag.id) });
    }

    const loeschen = req.method === 'DELETE' && url.pathname.match(/^\/scores\/([0-9a-f]{16})$/);
    if (loeschen) {
      if (!ADMIN_TOKEN) return antwort(res, 404, { fehler: 'Nicht gefunden' });
      const gegeben = Buffer.from(String(req.headers.authorization || ''));
      const erwartet = Buffer.from('Bearer ' + ADMIN_TOKEN);
      if (gegeben.length !== erwartet.length || !crypto.timingSafeEqual(gegeben, erwartet)) return antwort(res, 401, { fehler: 'Nicht erlaubt' });
      const vorher = eintraege.length;
      eintraege = eintraege.filter((e) => e.id !== loeschen[1]);
      if (eintraege.length !== vorher) speichern();
      return antwort(res, eintraege.length !== vorher ? 200 : 404, { geloescht: vorher - eintraege.length });
    }

    return antwort(res, 404, { fehler: 'Nicht gefunden' });
  } catch (e) {
    return antwort(res, 500, { fehler: 'Serverfehler' });
  }
});

server.requestTimeout = 10000;
server.headersTimeout = 10000;

if (require.main === module) {
  server.listen(PORT, HOST, () => console.log('Rangliste-Server läuft auf http://' + HOST + ':' + PORT));
}
module.exports = server;
