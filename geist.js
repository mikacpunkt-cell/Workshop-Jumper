/* =========================================================
   geist.js – Geister-Wiederholung
   Zeichnet den Lauf durch ein Level auf (20 Positionen pro Sekunde)
   und speichert den schnellsten Lauf pro Level lokal im Browser.
   Beim nächsten Versuch läuft dieser Lauf als blasser blauer Geist mit.
   Es werden nur Positionen im Level gespeichert – nichts davon
   verlässt den Browser.
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW;

  const SCHRITTE_PRO_SEKUNDE = 120;  // wie SCHRITT (1/120 s) in game.js
  const SCHRITTE_PRO_PROBE = 6;      // alle 6 Schritte eine Probe = 20 pro Sekunde
  const PROBEN_PRO_SEKUNDE = SCHRITTE_PRO_SEKUNDE / SCHRITTE_PRO_PROBE;
  const MAX_PROBEN = PROBEN_PRO_SEKUNDE * 900;  // Obergrenze: 15 Minuten
  const SPRUNG_PX = 100;             // größere Sprünge (Neustart am Checkpoint) nicht überblenden
  const ABBLENDEN = 1;               // Sekunden, die der Geist nach seinem Ziel noch sichtbar bleibt
  const DECKKRAFT = 0.5;
  const BILDER = ['stehen', 'laufen1', 'laufen2', 'sprung'];

  const schluessel = (nummer) => 'geist.' + nummer;

  /** Gespeicherte Daten prüfen (schützt vor beschädigten Werten). */
  function pruefen(roh) {
    if (!roh || typeof roh !== 'object') return null;
    const zeit = roh.zeit, d = roh.d;
    if (!Number.isFinite(zeit) || zeit <= 0 || !Array.isArray(d)) return null;
    if (d.length < 6 || d.length % 3 !== 0 || d.length / 3 > MAX_PROBEN) return null;
    for (let i = 0; i < d.length; i++) if (!Number.isFinite(d[i])) return null;
    return { zeit: zeit, d: d };
  }

  // Bläuliche Kopie der Figur, damit man den Geist vom Spieler unterscheidet
  const getoent = new WeakMap();
  function geisterBild(bild) {
    let b = getoent.get(bild);
    if (!b) {
      b = KW.Grafik.neueCanvas(bild.width, bild.height);
      const c = b.getContext('2d');
      c.drawImage(bild, 0, 0);
      c.globalCompositeOperation = 'source-atop';
      c.fillStyle = 'rgba(110,190,255,0.55)';
      c.fillRect(0, 0, b.width, b.height);
      getoent.set(bild, b);
    }
    return b;
  }

  const Geist = {
    aufnahme: null,     // läuft gerade mit: { n, d, voll }
    wiedergabe: null,   // gespeicherte Bestzeit: { zeit, d, n }
    bestzeit: null,

    /** Neues Level beginnt: Bestzeit laden und Aufnahme starten. */
    start(nummer) {
      const gespeichert = pruefen(KW.Speicher.lesen(schluessel(nummer), null));
      this.bestzeit = gespeichert ? gespeichert.zeit : null;
      this.aufnahme = { n: 0, d: [], voll: false };
      this.wiedergabe = gespeichert ? { zeit: gespeichert.zeit, d: gespeichert.d, n: 0 } : null;
    },

    verwerfen() {
      this.aufnahme = null;
      this.wiedergabe = null;
      this.bestzeit = null;
    },

    /** Ein Physik-Schritt im Spiel (nur im Zustand „spielen“). */
    schritt(spieler) {
      const a = this.aufnahme;
      if (!a) return;
      if (a.n % SCHRITTE_PRO_PROBE === 0) {
        if (a.d.length / 3 >= MAX_PROBEN) a.voll = true;
        else a.d.push(Math.round(spieler.x), Math.round(spieler.y), probe(spieler));
      }
      a.n++;
      if (this.wiedergabe) this.wiedergabe.n++;
    },

    /**
     * Ziel erreicht: Zeit festhalten und – falls schneller als die bisherige
     * Bestzeit – den Lauf speichern. Liefert { zeit, bestzeit, neu }.
     */
    beenden(nummer, spieler) {
      const a = this.aufnahme;
      if (!a) return null;
      this.aufnahme = null;
      const zeit = Math.round(a.n / SCHRITTE_PRO_SEKUNDE * 1000) / 1000;
      if (a.n % SCHRITTE_PRO_PROBE !== 0 && !a.voll) {
        a.d.push(Math.round(spieler.x), Math.round(spieler.y), probe(spieler)); // Zielposition
      }
      const neu = !a.voll && zeit > 0 && (this.bestzeit === null || zeit < this.bestzeit);
      if (neu) KW.Speicher.schreiben(schluessel(nummer), { zeit: zeit, d: a.d });
      return { zeit: zeit, bestzeit: neu ? zeit : this.bestzeit, neu: neu, vorher: this.bestzeit };
    },

    /** Geist ins Spielfeld zeichnen (vor der Spielfigur). */
    zeichne(g, kx, ky) {
      const w = this.wiedergabe;
      if (!w || !KW.Einstellungen.werte.geist) return;
      const t = w.n / SCHRITTE_PRO_SEKUNDE;
      let alpha = DECKKRAFT;
      if (t > w.zeit) {
        alpha *= 1 - (t - w.zeit) / ABBLENDEN;
        if (alpha <= 0) return;
      }
      const anzahl = w.d.length / 3;
      const pos = Math.min(t * PROBEN_PRO_SEKUNDE, anzahl - 1);
      const i = Math.floor(pos), f = pos - i, a = i * 3;
      let x = w.d[a], y = w.d[a + 1];
      const marke = w.d[a + 2];
      if (f > 0 && a + 5 < w.d.length) {
        const bx = w.d[a + 3], by = w.d[a + 4];
        if (Math.abs(bx - x) <= SPRUNG_PX && Math.abs(by - y) <= SPRUNG_PX) {
          x += (bx - x) * f;
          y += (by - y) * f;
        }
      }
      const bild = KW.Grafik.spielerBild(BILDER[(marke >> 1) & 3], (marke & 1) === 1, KW.Konto.aktiverSkin());
      g.globalAlpha = alpha;
      g.drawImage(geisterBild(bild), Math.round(x - 3 - kx), Math.round(y - 4 - ky));
      g.globalAlpha = 1;
    },

    /** Zeit als m:ss.s, z. B. 1:23.4 */
    format(sekunden) {
      const zehntel = Math.floor(sekunden * 10);
      const m = Math.floor(zehntel / 600);
      const s = (zehntel % 600) / 10;
      return m + ':' + s.toFixed(1).padStart(4, '0');
    }
  };

  /** Bild und Blickrichtung in eine Zahl packen. */
  function probe(spieler) {
    const bild = Math.max(0, BILDER.indexOf(spieler.aktuellesBild()));
    return bild * 2 + (spieler.blick < 0 ? 1 : 0);
  }

  KW.Geist = Geist;
})();
