/* =========================================================
   konto.js – Münzkonto, Level-Freischaltung und Skins

   - Münzen aus einem Level werden beim Levelende aufs Konto gebucht.
   - Ein Level kann gekauft werden, sobald das vorherige geschafft ist.
   - Bereits geschaffte Level lassen sich immer wieder spielen,
     um Münzen zu sammeln (niemand kann feststecken).
   Alles wird nur lokal im Browser gespeichert.
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW;

  /* Skins: nur die Kleidung/Farben ändern sich (Haut bleibt gleich) */
  const SKINS = [
    { id: 'handwerker', name: 'Handwerker', preis: 0,
      farben: { H: '#e8742a', h: '#b8561a', W: '#ffd23f', B: '#2f62b0', b: '#1f437d', D: '#4a2e1a', R: '#8a5a2b', P: '#e23b3b' } },
    { id: 'malerin', name: 'Malerin', preis: 40,
      farben: { H: '#ffffff', h: '#c9c9c9', W: '#7ac0ff', B: '#f2f2f2', b: '#c8c8c8', D: '#3a3a3a', R: '#8a5a2b', P: '#3b7be2' } },
    { id: 'schreiner', name: 'Schreiner', preis: 60,
      farben: { H: '#3f7f3f', h: '#2a5a2a', W: '#e8d8b0', B: '#8a5a2b', b: '#5e3b1a', D: '#2a1a10', R: '#c08a4a', P: '#c9a06a' } },
    { id: 'naeherin', name: 'Näherin', preis: 70,
      farben: { H: '#d6558f', h: '#9c3a68', W: '#fde8f1', B: '#8e5aa8', b: '#5f3a75', D: '#3a1f33', R: '#e9c46a', P: '#ff7fb0' } },
    { id: 'toepferin', name: 'Töpferin', preis: 80,
      farben: { H: '#c2734a', h: '#8c4a2f', W: '#f0e0c8', B: '#a85a36', b: '#6a3422', D: '#3e2418', R: '#8a5a2b', P: '#d98a5a' } },
    { id: 'holzfaeller', name: 'Holzfäller', preis: 90,
      farben: { H: '#2e2e2e', h: '#161616', W: '#c0392b', B: '#3b4f6b', b: '#26364d', D: '#4a3a2a', R: '#7a5230', P: '#e0e0e0' } },
    { id: 'bauarbeiter', name: 'Bauarbeiter', preis: 100,
      farben: { H: '#ffe14d', h: '#c9a800', W: '#ff7a1a', B: '#555f6e', b: '#363d48', D: '#2b2b2b', R: '#9aa3ad', P: '#ffffff' } },
    { id: 'schweisser', name: 'Schweißer', preis: 120,
      farben: { H: '#4a525c', h: '#2a3038', W: '#ff8c3f', B: '#6a737d', b: '#454c55', D: '#1a1a1a', R: '#3a3a3a', P: '#ffd23f' } },
    { id: 'frost', name: 'Frostmeister', preis: 140,
      farben: { H: '#aee4ff', h: '#6fb6e0', W: '#ffffff', B: '#4a8fd0', b: '#2f5f96', D: '#2a4a70', R: '#d0f0ff', P: '#7fe0ff' } },
    { id: 'elektronikerin', name: 'Elektronikerin', preis: 150,
      farben: { H: '#40c080', h: '#2a8a5a', W: '#202830', B: '#3a6e9a', b: '#1c3a55', D: '#101010', R: '#c0c0c0', P: '#e04040' } },
    { id: 'pirat', name: 'Piratin', preis: 160,
      farben: { H: '#222222', h: '#111111', W: '#f0e6cc', B: '#9c2a2a', b: '#6a1a1a', D: '#3a2412', R: '#c9a020', P: '#ffd23f' } },
    { id: 'ninja', name: 'Ninja', preis: 180,
      farben: { H: '#1c1c24', h: '#0e0e14', W: '#2a2a36', B: '#1c1c24', b: '#0e0e14', D: '#101018', R: '#b0262a', P: '#e03a3a' } },
    { id: 'nachtschicht', name: 'Nachtschicht', preis: 200,
      farben: { H: '#6a4ac0', h: '#45308a', W: '#2a2440', B: '#1e1a33', b: '#120f22', D: '#000000', R: '#8f7fc0', P: '#c0b4e8' } },
    { id: 'vulkan', name: 'Vulkan', preis: 220,
      farben: { H: '#ff4a1a', h: '#b02a0a', W: '#2a1a18', B: '#4a2a24', b: '#2a1612', D: '#120a08', R: '#ffb347', P: '#ffd23f' } },
    { id: 'astronaut', name: 'Astronaut', preis: 250,
      farben: { H: '#e8e8f0', h: '#a8a8c0', W: '#ffffff', B: '#dcdce8', b: '#9c9cb4', D: '#4a4a60', R: '#ff5a36', P: '#3ad0ff' } },
    { id: 'roboter', name: 'Roboter', preis: 300,
      farben: { H: '#9aa6b2', h: '#6a7480', W: '#c4ccd4', B: '#7a8692', b: '#4e5964', D: '#2e343a', R: '#40e0ff', P: '#40ff9a' } },
    { id: 'gold', name: 'Goldener Meister', preis: 400,
      farben: { H: '#ffd23f', h: '#c9a020', W: '#fff3b0', B: '#e0b030', b: '#a8801a', D: '#7a5a10', R: '#fff8d6', P: '#ffffff' } },
    // Eigener Skin: kostet einmalig 500 Münzen und lässt sich danach jederzeit im Skin-Editor
    // bearbeiten. Er ist statisch (kein Farbwechsel, kein Glitzern) – die Pixel stehen im Speicher.
    { id: 'eigener', name: 'Eigener Skin', preis: 500, eigen: true, farben: {} },
    { id: 'dev', name: 'Entwickler', preis: 0, nurPerCode: true, regenbogen: true, animiert: true,
      farben: { H: '#ff3b3b', h: '#b01e1e', W: '#3bd0ff', B: '#a64bff', b: '#6a2fb0', D: '#222222', R: '#ffffff', P: '#ffd23f' } },
    { id: 'shiny', name: 'Glitzer', preis: 0, nurPerCode: true, glanz: true, animiert: true,
      farben: { H: '#9fb6c4', h: '#6f8794', W: '#e4ebf0', B: '#7d9bbd', b: '#52698a', D: '#3a4350', R: '#ffe27a', P: '#fff6c2' } }
  ];

  /* Codes zum Einlösen im Skin-Shop (Großbuchstaben):
       { skin: 'id' }     schaltet einen Skin frei (der Skin hat `nurPerCode: true`)
       { muenzen: 50 }    schreibt Münzen gut – jeder Code zählt pro Gerät nur einmal
     Hinweis: Die Codes stehen im Quelltext – das sind Spaß-/Entwickler-Codes, kein Geheimnis. */
  const CODES = {
    DEVSKIN: { skin: 'dev' },
    SHINY: { skin: 'shiny' },
    COINS: { muenzen: 50 }
  };

  const ganzzahl = (wert, standard) => {
    const n = parseInt(wert, 10);
    return Number.isFinite(n) && n >= 0 ? n : standard;
  };

  /* ---------- Eigener Skin: Pixelraster prüfen ---------- */
  const POSEN = ['stehen', 'laufen1', 'laufen2', 'sprung'];
  const HEX_FARBE = /^#[0-9a-f]{6}$/i;
  /** Zeilenraster prüfen: `anzahl` Zeilen mit je 12 Zellen ('' oder '#rrggbb'); sonst null. */
  function zeilenPruefen(zeilen, anzahl) {
    if (!Array.isArray(zeilen) || zeilen.length !== anzahl) return null;
    const ergebnis = [];
    for (let y = 0; y < anzahl; y++) {
      const z = zeilen[y];
      if (!Array.isArray(z) || z.length !== 12) return null;
      const reihe = [];
      for (let x = 0; x < 12; x++) {
        const c = z[x];
        if (typeof c !== 'string' || (c !== '' && !HEX_FARBE.test(c))) return null;
        reihe.push(c.toLowerCase());
      }
      ergebnis.push(reihe);
    }
    return ergebnis;
  }
  /** Gesamten Skin prüfen; liefert { koerper, beine } oder null. */
  function skinRasterPruefen(roh) {
    if (!roh || typeof roh !== 'object') return null;
    const koerper = zeilenPruefen(roh.koerper, 12);
    if (!koerper || !roh.beine || typeof roh.beine !== 'object') return null;
    const beine = {};
    for (let i = 0; i < POSEN.length; i++) {
      beine[POSEN[i]] = zeilenPruefen(roh.beine[POSEN[i]], 4);
      if (!beine[POSEN[i]]) return null;
    }
    return { koerper, beine };
  }
  let skinZwischenspeicher = null;   // { zeit, daten } – das Spiel fragt den Skin oft ab

  const Konto = {
    SKINS,

    /* ---------- Münzen ---------- */
    muenzen() { return ganzzahl(KW.Speicher.lesen('muenzKonto', 0), 0); },
    gutschreiben(anzahl) {
      if (anzahl > 0) KW.Speicher.schreiben('muenzKonto', this.muenzen() + anzahl);
    },
    /** Bezahlen; liefert false, wenn das Geld nicht reicht. */
    ausgeben(betrag) {
      const stand = this.muenzen();
      if (betrag > stand) return false;
      KW.Speicher.schreiben('muenzKonto', stand - betrag);
      return true;
    },

    /* ---------- Level ---------- */
    anzahlLevel() { return (KW.LEVELS || []).length || 1; },

    /** Höchste geschaffte Levelnummer (0 = noch keins). */
    geschafft() {
      let wert = KW.Speicher.lesen('geschafft', null);
      if (wert === null) {
        // Übernahme aus älteren Spielständen: freigeschaltet = n hieß "Level 1..n spielbar"
        wert = Math.max(0, ganzzahl(KW.Speicher.lesen('freigeschaltet', 1), 1) - 1);
      }
      return Math.min(this.anzahlLevel(), ganzzahl(wert, 0));
    },
    setzeGeschafft(nummer) {
      if (nummer > this.geschafft()) KW.Speicher.schreiben('geschafft', nummer);
    },

    /** Anzahl spielbarer Level (Level 1..n). */
    freigeschaltet() {
      const wert = ganzzahl(KW.Speicher.lesen('freigeschaltet', 1), 1);
      return Math.max(1, Math.min(this.anzahlLevel(), wert));
    },

    /** Preis eines Levels (Index 0-basiert); Level-Dateien können `preis` selbst setzen. */
    levelPreis(index) {
      const d = KW.LEVELS[index];
      if (!d || index === 0) return 0;
      if (Number.isFinite(d.preis)) return Math.max(0, d.preis);
      return 6 + (d.nummer || index + 1);
    },

    /** 'frei' | 'kaufbar' | 'gesperrt' */
    levelStatus(index) {
      if (index < this.freigeschaltet()) return 'frei';
      if (index === this.freigeschaltet() && this.geschafft() >= index) return 'kaufbar';
      return 'gesperrt';
    },

    levelKaufen(index) {
      if (this.levelStatus(index) !== 'kaufbar') return false;
      if (!this.ausgeben(this.levelPreis(index))) return false;
      KW.Speicher.schreiben('freigeschaltet', index + 1);
      return true;
    },

    /* ---------- Skins ---------- */
    skin(id) { return SKINS.find((s) => s.id === id) || SKINS[0]; },
    besitzt(id) {
      if (id === SKINS[0].id) return true;
      const liste = KW.Speicher.lesen('skins', []);
      return Array.isArray(liste) && liste.includes(id);
    },
    aktiverSkin() {
      const id = KW.Speicher.lesen('skin', SKINS[0].id);
      return this.besitzt(id) ? this.skin(id) : SKINS[0];
    },
    skinKaufen(id) {
      const s = SKINS.find((x) => x.id === id);
      if (!s || s.nurPerCode || this.besitzt(id)) return false;
      if (!this.ausgeben(s.preis)) return false;
      const liste = KW.Speicher.lesen('skins', []);
      KW.Speicher.schreiben('skins', (Array.isArray(liste) ? liste : []).concat(id));
      KW.Speicher.schreiben('skin', id);
      return true;
    },
    skinWaehlen(id) {
      if (this.besitzt(id)) KW.Speicher.schreiben('skin', id);
    },

    /** Die gezeichneten Pixel des eigenen Skins (oder die Handwerker-Vorlage, solange nichts gespeichert ist). */
    eigenerSkinDaten() {
      const jetzt = Date.now();
      if (skinZwischenspeicher && jetzt - skinZwischenspeicher.zeit < 500) return skinZwischenspeicher.daten;
      const roh = KW.Speicher.lesen('eigenerSkin', null);
      const raster = skinRasterPruefen(roh);
      let daten;
      if (raster) {
        daten = { rev: ganzzahl(roh.rev, 0), koerper: raster.koerper, beine: raster.beine };
      } else {
        const vorlage = KW.Grafik.spielerVorlage();
        daten = { rev: 0, koerper: vorlage.koerper, beine: vorlage.beine };
      }
      skinZwischenspeicher = { zeit: jetzt, daten: daten };
      return daten;
    },
    /** Speichert den eigenen Skin (nur, wenn er gekauft ist und die Daten gültig sind). */
    eigenerSkinSpeichern(daten) {
      if (!this.besitzt('eigener')) return false;
      const raster = skinRasterPruefen(daten);
      if (!raster) return false;
      const alt = KW.Speicher.lesen('eigenerSkin', null);
      const rev = ganzzahl(alt && alt.rev, 0) + 1;
      KW.Speicher.schreiben('eigenerSkin', { rev: rev, koerper: raster.koerper, beine: raster.beine });
      skinZwischenspeicher = null;
      return true;
    },

    /** Skins, die im Shop angezeigt werden (Code-Skins erst nach dem Einlösen). */
    sichtbareSkins() { return SKINS.filter((s) => !s.nurPerCode || this.besitzt(s.id)); },

    /**
     * Löst einen Code ein. Liefert { status, skin?, muenzen? }:
     * 'neu' (Skin freigeschaltet und angezogen bzw. Münzen gutgeschrieben),
     * 'schon' (diesen Code hatte man bereits), 'ungueltig'.
     */
    codeEinloesen(eingabe) {
      const code = String(eingabe || '').replace(/\s+/g, '').toUpperCase();
      if (!code || !Object.prototype.hasOwnProperty.call(CODES, code)) return { status: 'ungueltig' };
      const eintrag = CODES[code];

      if (eintrag.skin) {
        const skin = SKINS.find((x) => x.id === eintrag.skin);
        if (!skin) return { status: 'ungueltig' };
        if (this.besitzt(skin.id)) return { status: 'schon', skin };
        const liste = KW.Speicher.lesen('skins', []);
        KW.Speicher.schreiben('skins', (Array.isArray(liste) ? liste : []).concat(skin.id));
        KW.Speicher.schreiben('skin', skin.id);
        return { status: 'neu', skin };
      }

      if (eintrag.muenzen > 0) {
        const benutzt = KW.Speicher.lesen('codes', []);
        const liste = Array.isArray(benutzt) ? benutzt : [];
        if (liste.includes(code)) return { status: 'schon', muenzen: eintrag.muenzen };
        KW.Speicher.schreiben('codes', liste.concat(code));
        this.gutschreiben(eintrag.muenzen);
        return { status: 'neu', muenzen: eintrag.muenzen };
      }
      return { status: 'ungueltig' };
    }
  };

  KW.Konto = Konto;
})();
