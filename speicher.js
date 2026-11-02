/* =========================================================
   speicher.js – sicherer Zugriff auf localStorage
   Alle Zugriffe sind in try/catch gekapselt, weil localStorage
   im privaten Modus oder bei blockierten Websitedaten fehlen
   oder Fehler werfen kann. Dann läuft das Spiel trotzdem –
   die Werte gelten nur bis zum Neuladen der Seite.
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW = window.KW || {};

  const PRAEFIX = 'kwRiedHuepfer.';
  const ersatz = {}; // Ersatzspeicher im Arbeitsspeicher
  let test = null;   // Testmodus: Schreiben nur in diesen Zwischenspeicher

  KW.Speicher = {
    /**
     * Testmodus (für den Level-Prüfer): Änderungen landen nur in einem
     * Zwischenspeicher und werden beim Beenden verworfen.
     */
    testBeginnen() { test = {}; },
    testBeenden() { test = null; },
    testAktiv() { return test !== null; },

    /** Wert lesen; liefert `standard`, falls nichts gespeichert ist. */
    lesen(schluessel, standard) {
      if (test && schluessel in test) return test[schluessel];
      if (schluessel in ersatz) return ersatz[schluessel];
      try {
        const roh = window.localStorage.getItem(PRAEFIX + schluessel);
        if (roh !== null) return JSON.parse(roh);
      } catch (e) {
        /* localStorage nicht verfügbar oder Daten beschädigt */
      }
      return standard;
    },

    /** Wert speichern (als JSON). */
    schreiben(schluessel, wert) {
      if (test) { test[schluessel] = wert; return; }
      ersatz[schluessel] = wert;
      try {
        window.localStorage.setItem(PRAEFIX + schluessel, JSON.stringify(wert));
      } catch (e) {
        /* Speichern nicht möglich – Wert bleibt im Arbeitsspeicher */
      }
    },

    /** Alle Daten dieses Spiels entfernen (Highscore, Fortschritt, Einstellungen). */
    allesLoeschen() {
      Object.keys(ersatz).forEach((k) => delete ersatz[k]);
      try {
        const weg = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.indexOf(PRAEFIX) === 0) weg.push(k);
        }
        weg.forEach((k) => window.localStorage.removeItem(k));
      } catch (e) {
        /* nichts zu tun */
      }
    }
  };
})();
