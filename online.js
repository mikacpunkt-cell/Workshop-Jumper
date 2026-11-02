/* =========================================================
   online.js – Online-Rangliste (optional)

   Ist in config.js nichts eingetragen, ist die Online-Rangliste aus und
   das Spiel verhält sich wie bisher (alles nur im Browser).

   Schnittstelle für den Rest des Spiels:
     KW.Online.verfuegbar       true, wenn eine Online-Rangliste nutzbar ist
     KW.Online.bereit           Promise: erst danach steht verfuegbar fest
     KW.Online.laden()          Promise -> [{ name, punkte, level, datum }]
     KW.Online.senden(name, punkte, level)
                                Promise -> { ok, platz }   (platz 1-basiert oder null)

   Zwei Anbindungen (config.js, Feld typ):
     'rest'      eigener Server, siehe server/rangliste-server.js
     'artifact'  gemeinsamer Speicher der Claude-Testumgebung (nur dort)
   Daten von außen gelten immer als unzuverlässig und werden vor der
   Anzeige geprüft; angezeigt werden sie nur mit textContent.
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW;
  const CFG = (window.KW_CONFIG && window.KW_CONFIG.online) || null;
  const ANZAHL = 10;
  const MAX_NAME = 12;
  const ZEITLIMIT_MS = 8000;

  const mitZeitlimit = (versprechen, ms) => new Promise((ok, fehler) => {
    const uhr = setTimeout(() => fehler(new Error('timeout')), ms);
    versprechen.then((w) => { clearTimeout(uhr); ok(w); }, (e) => { clearTimeout(uhr); fehler(e); });
  });

  /** Einen Eintrag aus fremder Quelle prüfen und säubern; ungültige liefern null. */
  function pruefe(e) {
    if (!e || typeof e !== 'object') return null;
    const punkte = Number(e.punkte);
    if (!Number.isFinite(punkte) || punkte < 0) return null;
    const name = Array.from(String(e.name == null ? '' : e.name).replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, MAX_NAME).join('');
    const level = Number.isInteger(e.level) && e.level > 0 && e.level < 1000 ? e.level : 0;
    const datum = /^\d{4}-\d{2}-\d{2}$/.test(e.datum || '') ? e.datum : '';
    return { name: name || '?', punkte: Math.round(punkte), level, datum };
  }
  const pruefeListe = (liste) => (Array.isArray(liste) ? liste.map(pruefe).filter(Boolean) : [])
    .sort((a, b) => b.punkte - a.punkte).slice(0, ANZAHL);

  /* ---------- Anbindung 1: eigener Server ---------- */
  function restAnbindung(cfg) {
    let basis = String(cfg.url || '').trim().replace(/\/+$/, '');
    // nur verschlüsselte Adressen (zum Entwickeln ist localhost erlaubt)
    if (!/^https:\/\/[^\s/]+/i.test(basis) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(basis)) return null;
    const anfrage = (pfad, optionen) => {
      const abbruch = typeof AbortController === 'function' ? new AbortController() : null;
      const o = Object.assign({ credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' }, optionen);
      if (abbruch) o.signal = abbruch.signal;
      return mitZeitlimit(fetch(basis + pfad, o), ZEITLIMIT_MS).catch((e) => { if (abbruch) abbruch.abort(); throw e; });
    };
    return {
      async bereit() { return typeof fetch === 'function'; },
      async laden() {
        const antwort = await anfrage('/scores?limit=' + ANZAHL, { method: 'GET' });
        if (!antwort.ok) throw new Error('http ' + antwort.status);
        return pruefeListe((await antwort.json()).scores);
      },
      async senden(name, punkte, level) {
        const antwort = await anfrage('/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, punkte, level })
        });
        if (!antwort.ok) throw new Error('http ' + antwort.status);
        const daten = await antwort.json();
        return { ok: true, platz: Number.isInteger(daten.platz) && daten.platz > 0 ? daten.platz : null };
      }
    };
  }

  /* ---------- Anbindung 2: gemeinsamer Speicher der Testumgebung ---------- */
  function artifactAnbindung() {
    let dbVersprechen = null;
    const holeDb = () => {
      if (!dbVersprechen) {
        dbVersprechen = (window.claude && typeof window.claude.use === 'function')
          ? window.claude.use('db').catch(() => null)
          : Promise.resolve(null);
      }
      return dbVersprechen;
    };
    return {
      async bereit() { return !!(await holeDb()); },
      async laden() {
        const db = await holeDb();
        if (!db) throw new Error('db fehlt');
        const schnappschuss = await mitZeitlimit(db.collection('scores').orderBy('punkte', 'desc').limit(ANZAHL).get(), ZEITLIMIT_MS);
        return pruefeListe(schnappschuss.docs.map((d) => d.data()));
      },
      async senden(name, punkte, level) {
        const db = await holeDb();
        if (!db) throw new Error('db fehlt');
        await mitZeitlimit(db.collection('scores').add({
          name, punkte, level, datum: new Date().toISOString().slice(0, 10)
        }), ZEITLIMIT_MS);
        // Platz = Anzahl besserer Einträge + 1
        let platz = null;
        try {
          const besser = await mitZeitlimit(db.collection('scores').where('punkte', '>', punkte).limit(1000).get(), ZEITLIMIT_MS);
          platz = besser.size + 1;
        } catch (e) { /* Platz ist nur ein Zusatz */ }
        return { ok: true, platz };
      }
    };
  }

  /* ---------- Gesamtobjekt ---------- */
  let anbindung = null;
  if (CFG && CFG.typ === 'rest') anbindung = restAnbindung(CFG);
  else if (CFG && CFG.typ === 'artifact') anbindung = artifactAnbindung();

  const Online = {
    verfuegbar: false,
    typ: anbindung ? CFG.typ : null,
    bereit: Promise.resolve(false),

    async laden() {
      if (!anbindung) throw new Error('aus');
      return anbindung.laden();
    },

    /** Eintrag senden. Liefert immer { ok } – Fehler werfen nicht. */
    async senden(name, punkte, level) {
      if (!anbindung) return { ok: false };
      const p = Math.floor(Number(punkte)), l = Math.floor(Number(level));
      if (!(p > 0) || !(l > 0)) return { ok: false };
      try {
        return await anbindung.senden(KW.Rangliste.bereinigeName(name), p, l);
      } catch (e) {
        return { ok: false };
      }
    }
  };

  if (anbindung) {
    Online.bereit = anbindung.bereit().then((ok) => { Online.verfuegbar = !!ok; return Online.verfuegbar; }, () => false);
  }
  KW.Online = Online;
})();
