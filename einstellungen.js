/* =========================================================
   einstellungen.js – Grafik- und Toneinstellungen
   Werte werden lokal gespeichert und sofort angewendet.
   Helligkeit/Kontrast/Sättigung laufen als CSS-Filter auf dem
   Canvas (GPU-beschleunigt, kostet keine Spielleistung).
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW;

  const STANDARD = {
    helligkeit: 100,     // %
    kontrast: 100,       // %
    saettigung: 100,     // %
    lautstaerke: 70,     // %
    qualitaet: 'hoch',   // hoch | niedrig (ohne Parallax-Deko und Funken)
    pixel: 'scharf',     // scharf | weich
    scanlines: false,    // Röhrenfernseher-Effekt
    fps: false,          // Bilder pro Sekunde anzeigen
    geist: true          // Geist der Bestzeit anzeigen
  };

  // Erlaubte Bereiche – schützt vor beschädigten gespeicherten Werten
  const BEREICHE = {
    helligkeit: [50, 150], kontrast: [50, 150], saettigung: [0, 200], lautstaerke: [0, 100]
  };
  const AUSWAHL = { qualitaet: ['hoch', 'niedrig'], pixel: ['scharf', 'weich'] };

  function pruefen(roh) {
    const w = Object.assign({}, STANDARD);
    if (!roh || typeof roh !== 'object') return w;
    Object.keys(BEREICHE).forEach((k) => {
      const zahl = Number(roh[k]);
      if (Number.isFinite(zahl)) w[k] = Math.min(BEREICHE[k][1], Math.max(BEREICHE[k][0], zahl));
    });
    Object.keys(AUSWAHL).forEach((k) => { if (AUSWAHL[k].includes(roh[k])) w[k] = roh[k]; });
    ['scanlines', 'fps', 'geist'].forEach((k) => { if (typeof roh[k] === 'boolean') w[k] = roh[k]; });
    return w;
  }

  const Einstellungen = {
    werte: pruefen(KW.Speicher.lesen('einstellungen', null)),

    get niedrig() { return this.werte.qualitaet === 'niedrig'; },

    setzen(schluessel, wert) {
      const neu = Object.assign({}, this.werte, { [schluessel]: wert });
      this.werte = pruefen(neu);
      KW.Speicher.schreiben('einstellungen', this.werte);
      this.anwenden();
    },

    zuruecksetzen() {
      this.werte = Object.assign({}, STANDARD);
      KW.Speicher.schreiben('einstellungen', this.werte);
      this.anwenden();
    },

    /** Neu laden (z. B. nachdem alle Daten gelöscht wurden). */
    neuLaden() {
      this.werte = pruefen(KW.Speicher.lesen('einstellungen', null));
      this.anwenden();
    },

    anwenden() {
      const w = this.werte;
      const canvas = document.getElementById('spiel-canvas');
      if (canvas) {
        const filter = [];
        if (w.helligkeit !== 100) filter.push('brightness(' + w.helligkeit / 100 + ')');
        if (w.kontrast !== 100) filter.push('contrast(' + w.kontrast / 100 + ')');
        if (w.saettigung !== 100) filter.push('saturate(' + w.saettigung / 100 + ')');
        canvas.style.filter = filter.length ? filter.join(' ') : '';
        canvas.style.imageRendering = w.pixel === 'weich' ? 'auto' : '';
      }
      const spiel = document.getElementById('spiel');
      if (spiel) spiel.classList.toggle('scanlines', w.scanlines);
      KW.Audio.setzeLautstaerke(w.lautstaerke / 100);
    }
  };

  KW.Einstellungen = Einstellungen;
})();
