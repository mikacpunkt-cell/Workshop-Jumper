/* =========================================================
   grafik.js – Pixel-Art, Kacheln, Hintergründe und Themen
   Alle Grafiken werden im Code gezeichnet (keine Bilddateien).
   Sprites werden einmalig in Offscreen-Canvas vorgerendert.
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW;
  const T = KW.TILE = 32;          // Kachelgröße in Spielpixeln
  const BREITE = 640, HOEHE = 360; // interne Auflösung

  /* ---------------------------------------------------------
     Themen der fünf Bereiche der KreativWerkstatt
     --------------------------------------------------------- */
  KW.THEMEN = {
    werkstatt: {
      himmelOben: '#3f2e24', himmelUnten: '#7b5a42',
      boden: '#6f6a64', bodenOben: '#a39c92', bodenDunkel: '#57534e',
      ziegel: '#b5562f', fuge: '#6e2f17',
      broesel: '#a27a52', broeselDunkel: '#6a4f36',
      plattform: '#c08a4a', plattformDunkel: '#7a5228',
      gegner: { g: '#8c8c99', G: '#b9b9c6', D: '#4b4b55' },
      deko: 'werkstatt'
    },
    holzlager: {
      himmelOben: '#1f2b1c', himmelUnten: '#52653a',
      boden: '#7a4a24', bodenOben: '#b07a3c', bodenDunkel: '#5b3519',
      ziegel: '#9c6b3a', fuge: '#4f3118',
      broesel: '#c49a5e', broeselDunkel: '#7d5a2e',
      plattform: '#d4a35c', plattformDunkel: '#8a6230',
      gegner: { g: '#a0703c', G: '#cf9b62', D: '#5b3519' },
      deko: 'holzlager'
    },
    farbatelier: {
      himmelOben: '#cfc5ea', himmelUnten: '#f3ece0',
      boden: '#d9d2c6', bodenOben: '#ffffff', bodenDunkel: '#b4ab9d',
      ziegel: '#5b8bd6', fuge: '#2f4f86',
      broesel: '#f2a65a', broeselDunkel: '#b06a26',
      plattform: '#7ac27a', plattformDunkel: '#3f7f3f',
      gegner: { g: '#e05297', G: '#f59ac3', D: '#8c2a5a' },
      deko: 'farbatelier'
    },
    toepferei: {
      himmelOben: '#4f271b', himmelUnten: '#b8643a',
      boden: '#8c4a2f', bodenOben: '#c2734a', bodenDunkel: '#6a3422',
      ziegel: '#c26a3a', fuge: '#6e3218',
      broesel: '#d9a07a', broeselDunkel: '#8c5a3a',
      plattform: '#e0b07a', plattformDunkel: '#94643a',
      gegner: { g: '#b5784f', G: '#dca47e', D: '#6a3422' },
      deko: 'toepferei'
    },
    dachboden: {
      himmelOben: '#121022', himmelUnten: '#35304f',
      boden: '#5b4636', bodenOben: '#8a6c50', bodenDunkel: '#3e2f24',
      ziegel: '#7b5e4a', fuge: '#3a2b20',
      broesel: '#8f7a64', broeselDunkel: '#54453a',
      plattform: '#a3876a', plattformDunkel: '#5e4a38',
      gegner: { g: '#8f7fc0', G: '#c0b4e8', D: '#4a3f73' },
      deko: 'dachboden'
    },
    metallwerkstatt: {
      himmelOben: '#1b222b', himmelUnten: '#46525e',
      boden: '#5d6670', bodenOben: '#8c96a0', bodenDunkel: '#3e454d',
      ziegel: '#7a828c', fuge: '#3a4048',
      broesel: '#b06a3c', broeselDunkel: '#6a3a1e',
      plattform: '#a4aeb8', plattformDunkel: '#5a636c',
      gegner: { g: '#c0703a', G: '#e39c62', D: '#5a2e14' },
      deko: 'metall'
    },
    naehstube: {
      himmelOben: '#4f3554', himmelUnten: '#a87494',
      boden: '#8a6a5a', bodenOben: '#c9a07a', bodenDunkel: '#5e4638',
      ziegel: '#d0607a', fuge: '#8a3048',
      broesel: '#ead9b0', broeselDunkel: '#a88f5e',
      plattform: '#6ab0c0', plattformDunkel: '#3a7080',
      gegner: { g: '#7aa0e0', G: '#b4cbf2', D: '#3a5a90' },
      deko: 'naehstube'
    },
    elektroniklabor: {
      himmelOben: '#08130e', himmelUnten: '#1d3a2b',
      boden: '#2f4a3a', bodenOben: '#4caf7a', bodenDunkel: '#1d3226',
      ziegel: '#3a6e9a', fuge: '#1c3a55',
      broesel: '#c8a848', broeselDunkel: '#7a6420',
      plattform: '#c0c8d0', plattformDunkel: '#6a7480',
      gegner: { g: '#e0c040', G: '#fff080', D: '#7a6010' },
      deko: 'elektronik'
    }
  };

  /* ---------------------------------------------------------
     Hilfsfunktionen
     --------------------------------------------------------- */
  function neueCanvas(b, h) {
    const c = document.createElement('canvas');
    c.width = b;
    c.height = h;
    return c;
  }

  /** Malt mit einer Funktion in eine neue Canvas und gibt sie zurück. */
  function male(b, h, fn) {
    const c = neueCanvas(b, h);
    fn(c.getContext('2d'));
    return c;
  }

  /**
   * Pixel-Sprite aus Zeichenketten erzeugen.
   * Jedes Zeichen ist ein Pixel, '.' ist transparent,
   * andere Zeichen werden über die Palette in Farben übersetzt.
   */
  function sprite(zeilen, palette, skala, spiegeln) {
    skala = skala || 2;
    const b = Math.max(...zeilen.map((z) => z.length));
    const h = zeilen.length;
    return male(b * skala, h * skala, (g) => {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < b; x++) {
          const zeichen = zeilen[y][x];
          const farbe = zeichen && palette[zeichen];
          if (!farbe) continue;
          g.fillStyle = farbe;
          const px = spiegeln ? (b - 1 - x) : x;
          g.fillRect(px * skala, y * skala, skala, skala);
        }
      }
    });
  }

  /** Einfache, reproduzierbare Pseudozufallszahl (0..1) für Deko. */
  function zufall(i, k) {
    const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  /* ---------------------------------------------------------
     Spielfigur: kleiner Handwerker mit Mütze und Pinsel
     (12 x 16 Pixel, doppelt skaliert = 24 x 32)
     --------------------------------------------------------- */
  const SPIELER_PALETTE = {
    H: '#e8742a', h: '#b8561a',   // Mütze
    S: '#f2c29b', E: '#2a1d14',   // Haut, Augen
    W: '#ffd23f',                 // Hemd
    B: '#2f62b0', b: '#1f437d',   // Latzhose
    D: '#4a2e1a',                 // Schuhe
    R: '#8a5a2b', P: '#e23b3b'    // Pinselstiel, Farbe
  };
  const SPIELER_OBEN = [
    '...HHHHH....',
    '..HHHHHHH...',
    '..HHHHHHHHh.',
    '..SSSSSSS...',
    '..SSESSES.P.',
    '..SSSSSSS.P.',
    '...SSSSS..R.',
    '..WBWWWBW.R.',
    '.WWBBBBBWWR.',
    '.SWBBBBBWWS.',
    '...BBBBB....',
    '...BBbBB....'
  ];
  const SPIELER_BEINE = {
    stehen:  ['...BB.BB....', '...BB.BB....', '..DDD.DDD...', '..DDD.DDD...'],
    laufen1: ['..BB...BB...', '.BB.....BB..', 'DDD.....DDD.', 'DD.......DD.'],
    laufen2: ['....BBB.....', '....BBB.....', '...DDDD.....', '...DDDD.....'],
    sprung:  ['..BBB.BB....', '..DDD.BB....', '......DDD...', '............']
  };
  const spielerCache = {};

  /** Pixelbild aus einem Raster mit freien Farben ('' = durchsichtig, sonst '#rrggbb'). */
  function pixelSprite(zeilen, links, skala) {
    skala = skala || 2;
    const b = zeilen[0].length;
    const h = zeilen.length;
    return male(b * skala, h * skala, (g) => {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < b; x++) {
          const farbe = zeilen[y][x];
          if (!farbe) continue;
          g.fillStyle = farbe;
          g.fillRect((links ? b - 1 - x : x) * skala, y * skala, skala, skala);
        }
      }
    });
  }

  /** Die Standard-Figur (Handwerker) als Farbraster – Startpunkt für den eigenen Skin. */
  function spielerVorlage() {
    const palette = Object.assign({}, SPIELER_PALETTE, KW.Konto.SKINS[0].farben);
    const zeile = (z) => z.split('').map((c) => (c !== '.' && palette[c]) || '');
    const beine = {};
    Object.keys(SPIELER_BEINE).forEach((frame) => { beine[frame] = SPIELER_BEINE[frame].map(zeile); });
    return { koerper: SPIELER_OBEN.map(zeile), beine: beine };
  }

  /** Spielfigur; `skin` (optional) ersetzt die Farben der Kleidung. */
  function spielerBild(frame, links, skin) {
    // Eigener Skin: frei gezeichnete Pixel (statisch, ohne Farbeffekte)
    if (skin && skin.eigen) {
      const d = KW.Konto.eigenerSkinDaten();
      const endung = 'eigen' + d.rev;
      const k = frame + (links ? 'L' : 'R') + endung;
      if (!spielerCache[k]) {
        Object.keys(spielerCache).forEach((alt) => { if (alt.indexOf('eigen') > 0 && !alt.endsWith(endung)) delete spielerCache[alt]; });
        spielerCache[k] = pixelSprite(d.koerper.concat(d.beine[frame] || d.beine.stehen), links, 2);
      }
      return spielerCache[k];
    }
    // Animierte Skins: Regenbogen (Farben wandern langsam im Kreis, 24 Phasen à 250 ms = 6 s)
    // und Glanz (ein Lichtreflex läuft von der Mütze über das Hemd zur Hose, 20 Phasen à 110 ms)
    const phase = !skin ? -1 : skin.regenbogen ? Math.floor(Date.now() / 250) % 24
      : skin.glanz ? Math.floor(Date.now() / 110) % 20 : -1;
    const schluessel = frame + (links ? 'L' : 'R') + (skin ? skin.id : '') + (phase >= 0 ? phase : '');
    if (!spielerCache[schluessel]) {
      let palette = skin ? Object.assign({}, SPIELER_PALETTE, skin.farben) : SPIELER_PALETTE;
      if (phase >= 0 && skin.regenbogen) {
        const hsl = (grad, hell) => 'hsl(' + ((phase * 15 + grad) % 360) + ', 90%, ' + hell + '%)';
        palette = Object.assign(palette, {
          H: hsl(0, 55), h: hsl(0, 38), W: hsl(120, 60), B: hsl(240, 55), b: hsl(240, 38)
        });
      } else if (phase >= 0 && skin.glanz) {
        // Lichtreflex: je Körperteil leuchtet die Farbe kurz auf, wenn der Reflex vorbeikommt
        const t = (phase / 20) * Math.PI * 2;
        const glanz = (versatz) => Math.max(0, Math.sin(t - versatz));
        const hsl = (farbton, saettigung, hell, versatz, plus) => 'hsl(' + farbton + ', ' + saettigung + '%, ' + Math.round(hell + plus * glanz(versatz)) + '%)';
        palette = Object.assign(palette, {
          H: hsl(200, 22, 62, 0, 32), h: hsl(200, 26, 42, 0, 22),
          W: hsl(210, 16, 82, 1.0, 16),
          B: hsl(215, 28, 55, 2.0, 30), b: hsl(215, 32, 36, 2.0, 18),
          D: hsl(220, 14, 24, 3.0, 14),
          R: hsl(46, 95, 62, 0.5, 28), P: hsl(50, 100, 78, 0.5, 20)
        });
      }
      spielerCache[schluessel] = sprite(SPIELER_OBEN.concat(SPIELER_BEINE[frame]), palette, 2, links);
    }
    return spielerCache[schluessel];
  }

  /* ---------------------------------------------------------
     Gegner: "Staubknäuel" – Farbe je nach Thema
     --------------------------------------------------------- */
  const GEGNER_KOERPER = [
    '....gggg....',
    '..gggggggg..',
    '.gGGgggggggg',
    '.gWWggggWWg.',
    'ggWKggggWKgg',
    'gggggggggggg',
    'ggggKKKKgggg',
    '.gggggggggg.',
    '..gggggggg..'
  ];
  const GEGNER_FUESSE = ['..DD....DD..', '.DD......DD.'];
  const gegnerCache = {};
  function gegnerBild(farben, frame) {
    const schluessel = farben.g + frame;
    if (!gegnerCache[schluessel]) {
      const palette = { g: farben.g, G: farben.G, D: farben.D, W: '#ffffff', K: '#1a1a1a' };
      gegnerCache[schluessel] = sprite(GEGNER_KOERPER.concat([GEGNER_FUESSE[frame]]), palette, 2);
    }
    return gegnerCache[schluessel];
  }

  /* ---------------------------------------------------------
     Münzen (rund, programmatisch als Pixelkreis erzeugt)
     --------------------------------------------------------- */
  const muenzCache = {};
  function muenzBild(gross) {
    const schluessel = gross ? 'g' : 'k';
    if (muenzCache[schluessel]) return muenzCache[schluessel];
    const n = gross ? 14 : 10;
    const m = (n - 1) / 2, r = n / 2;
    const zeilen = [];
    for (let y = 0; y < n; y++) {
      let z = '';
      for (let x = 0; x < n; x++) {
        const d = Math.hypot(x - m, y - m);
        const sx = Math.abs(x - m), sy = Math.abs(y - m);
        let c;
        if (d > r - 0.25) c = '.';
        else if (d > r - 1.4) c = 'd';
        else if (x < m - 1 && y < m - 1 && d > r - 2.6) c = 'h';
        else c = 'g';
        if (c === 'g') {
          if (!gross && sx < 1 && sy < 2.6) c = 'd';
          if (gross && ((sx < 1 && sy < 4) || (sy < 1 && sx < 4) || (Math.abs(sx - sy) < 0.6 && sx < 2.6))) c = 'w';
        }
        z += c;
      }
      zeilen.push(z);
    }
    muenzCache[schluessel] = sprite(zeilen, { d: '#b8860b', g: '#ffd23f', h: '#fff3b0', w: '#fff8d6' }, 2);
    return muenzCache[schluessel];
  }

  /* Sprungfeder (Power-up: Doppelsprung) */
  let federBildCache = null;
  function federBild() {
    if (!federBildCache) {
      federBildCache = sprite([
        '..RRRRRRRR..',
        '.RrrrrrrrrR.',
        '..RRRRRRRR..',
        '...SSSSSS...',
        '....SSSS....',
        '...SSSSSS...',
        '....SSSS....',
        '...SSSSSS...',
        '....SSSS....',
        '..BBBBBBBB..',
        '.BbbbbbbbbB.',
        '..BBBBBBBB..'
      ], { R: '#e23b3b', r: '#ff8a8a', S: '#d4d6de', B: '#2f62b0', b: '#6f93d6' }, 2);
    }
    return federBildCache;
  }

  /* Herz für die Lebensanzeige */
  let herzBildCache = null;
  function herzBild() {
    if (!herzBildCache) {
      herzBildCache = sprite([
        '.xx.xx.',
        'xwxxxxx',
        'xxxxxxx',
        '.xxxxx.',
        '..xxx..',
        '...x...'
      ], { x: '#e23b3b', w: '#ff9a9a' }, 2);
    }
    return herzBildCache;
  }

  /* ---------------------------------------------------------
     Kacheln je Thema (werden pro Thema einmal gerendert)
     --------------------------------------------------------- */
  const FRAGEZEICHEN = [
    '.....xxxxx......',
    '....xx...xx.....',
    '....xx...xx.....',
    '.........xx.....',
    '........xx......',
    '.......xx.......',
    '.......xx.......',
    '................',
    '.......xx.......',
    '.......xx.......'
  ];
  const kachelCache = new Map();

  function bodenTextur(g, th) {
    g.fillStyle = th.boden;
    g.fillRect(0, 0, T, T);
    g.fillStyle = th.bodenDunkel;
    for (let i = 0; i < 9; i++) {
      g.fillRect(((i * 37) % 15) * 2, ((i * 53 + 7) % 15) * 2, 2, 2);
    }
    g.fillRect(0, T - 2, T, 2);
  }

  function kachelSatz(th) {
    if (kachelCache.has(th)) return kachelCache.get(th);
    const satz = {};

    satz.boden = male(T, T, (g) => bodenTextur(g, th));

    satz.bodenOben = male(T, T, (g) => {
      bodenTextur(g, th);
      g.fillStyle = th.bodenOben;
      g.fillRect(0, 0, T, 6);
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fillRect(0, 0, T, 2);
      g.fillStyle = th.bodenDunkel;
      g.fillRect(0, 6, T, 2);
    });

    satz.ziegel = male(T, T, (g) => {
      g.fillStyle = th.ziegel;
      g.fillRect(0, 0, T, T);
      g.fillStyle = 'rgba(255,255,255,0.18)';
      for (let r = 0; r < 4; r++) g.fillRect(0, r * 8 + 2, T, 2);
      g.fillStyle = th.fuge;
      for (let r = 0; r < 4; r++) {
        g.fillRect(0, r * 8, T, 2);
        const versatz = (r % 2) * 8;
        g.fillRect(versatz, r * 8, 2, 8);
        g.fillRect(versatz + 16, r * 8, 2, 8);
      }
      g.fillRect(0, T - 2, T, 2);
    });

    satz.frage = [0, 1].map((f) => male(T, T, (g) => {
      g.fillStyle = '#6b4510';
      g.fillRect(0, 0, T, T);
      g.fillStyle = f ? '#ffd65a' : '#f2b632';
      g.fillRect(2, 2, T - 4, T - 4);
      g.fillStyle = 'rgba(255,255,255,0.45)';
      g.fillRect(2, 2, T - 4, 2);
      g.fillStyle = '#a8741a';
      [[4, 4], [26, 4], [4, 26], [26, 26]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
      g.fillStyle = '#7a4a0c';
      FRAGEZEICHEN.forEach((zeile, y) => {
        for (let x = 0; x < zeile.length; x++) if (zeile[x] === 'x') g.fillRect(x * 2 + 1, y * 2 + 6, 2, 2);
      });
    }));

    satz.benutzt = male(T, T, (g) => {
      g.fillStyle = '#3a2a1a';
      g.fillRect(0, 0, T, T);
      g.fillStyle = '#8a6a4a';
      g.fillRect(2, 2, T - 4, T - 4);
      g.fillStyle = '#5e4630';
      [[4, 4], [26, 4], [4, 26], [26, 26]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
    });

    satz.broesel = male(T, T, (g) => {
      g.fillStyle = th.broeselDunkel;
      g.fillRect(0, 0, T, T);
      g.fillStyle = th.broesel;
      g.fillRect(2, 2, 28, 12);
      g.fillRect(2, 18, 28, 12);
      g.fillStyle = th.broeselDunkel;
      // Risse
      g.fillRect(10, 2, 2, 6); g.fillRect(12, 8, 2, 4);
      g.fillRect(22, 18, 2, 6); g.fillRect(20, 24, 2, 6);
      g.fillRect(6, 22, 4, 2);
      g.fillStyle = 'rgba(255,255,255,0.3)';
      g.fillRect(2, 2, 28, 2);
    });

    satz.stachel = male(T, T, (g) => {
      for (let i = 0; i < 2; i++) {
        const cx = i * 16 + 8;
        for (let y = 12; y < 30; y += 2) {
          const hb = Math.round(((y - 12) / 18) * 7);
          g.fillStyle = '#8b8f9c';
          g.fillRect(cx - hb, y, hb, 2);
          g.fillStyle = '#d4d7e0';
          g.fillRect(cx, y, Math.max(hb, 1), 2);
        }
      }
      g.fillStyle = '#5a5e6a';
      g.fillRect(0, 28, T, 4);
    });

    // Trampolin: [0] entspannt, [1] eingedrückt
    satz.trampolin = [0, 10].map((druck) => male(T, T, (g) => {
      g.fillStyle = '#3a3a44';
      g.fillRect(0, 26, T, 6);
      g.fillStyle = '#c9ccd6';
      const oben = 6 + druck, hoehe = 26 - oben;
      for (let i = 0; i < 3; i++) {
        const sx = 5 + i * 9;
        for (let y = 0; y < hoehe; y += 4) g.fillRect(sx + ((y / 4) % 2 ? 2 : 0), oben + y, 4, 2);
      }
      g.fillStyle = '#b02a2a';
      g.fillRect(0, druck, T, 7);
      g.fillStyle = '#e23b3b';
      g.fillRect(1, druck + 1, T - 2, 4);
      g.fillStyle = '#ff9a9a';
      g.fillRect(2, druck + 1, T - 4, 1);
    }));

    satz.plattform = male(T * 3, 14, (g) => {
      g.fillStyle = th.plattformDunkel;
      g.fillRect(0, 0, T * 3, 14);
      g.fillStyle = th.plattform;
      g.fillRect(2, 2, T * 3 - 4, 8);
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fillRect(2, 2, T * 3 - 4, 2);
      g.fillStyle = th.plattformDunkel;
      for (let x = 30; x < T * 3; x += 32) g.fillRect(x, 2, 2, 8);
      g.fillStyle = '#c9ccd6';
      [6, T * 3 - 10].forEach((x) => g.fillRect(x, 5, 4, 4));
    });

    kachelCache.set(th, satz);
    return satz;
  }

  /* ---------------------------------------------------------
     Checkpoint-Fahne und Ziel-Tür
     --------------------------------------------------------- */
  function zeichneCheckpoint(g, x, y, aktiv, t) {
    // x/y = linke obere Ecke der Kachel, Fahne ist 2 Kacheln hoch
    const fussY = y + T;
    g.fillStyle = '#3a3a44';
    g.fillRect(x + 6, fussY - 4, 14, 4);
    g.fillStyle = '#c9ccd6';
    g.fillRect(x + 12, fussY - 58, 3, 54);
    g.fillStyle = aktiv ? '#ffd23f' : '#9a9a9a';
    g.fillRect(x + 11, fussY - 62, 5, 5);
    const farbe = aktiv ? '#4caf50' : '#d8d8d8';
    const dunkel = aktiv ? '#2e7d32' : '#a0a0a0';
    for (let i = 0; i < 4; i++) {
      const welle = Math.round(Math.sin(t * 6 + i * 0.9) * 2);
      g.fillStyle = i % 2 ? dunkel : farbe;
      g.fillRect(x + 15 + i * 4, fussY - 56 + welle, 4, 14);
    }
  }

  function zeichneTuer(g, x, y) {
    // Tür über 2 Kacheln (x/y = obere linke Ecke)
    g.fillStyle = '#2a1a10';
    g.fillRect(x - 2, y - 2, T + 4, 2 * T + 2);
    g.fillStyle = '#8a5a2b';
    g.fillRect(x + 2, y + 2, T - 4, 2 * T - 2);
    g.fillStyle = '#6e4520';
    for (let i = 1; i < 4; i++) g.fillRect(x + 2 + i * 7, y + 4, 2, 2 * T - 6);
    g.fillStyle = '#ffd23f';
    g.fillRect(x + T - 10, y + T + 2, 4, 4);
    // Schild mit Stern
    g.fillStyle = '#e8742a';
    g.fillRect(x + 4, y - 16, T - 8, 12);
    g.fillStyle = '#fff8d6';
    g.fillRect(x + 14, y - 14, 4, 8);
    g.fillRect(x + 12, y - 12, 8, 4);
  }

  /* ---------------------------------------------------------
     Hintergründe (Parallax) je Thema
     --------------------------------------------------------- */
  function wiederhole(kx, faktor, abstand, fn) {
    const versatz = kx * faktor;
    const start = Math.floor(versatz / abstand) - 1;
    const ende = Math.floor((versatz + BREITE) / abstand) + 1;
    for (let i = start; i <= ende; i++) fn(i, Math.round(i * abstand - versatz));
  }

  /** Zahnrad (für die Metallwerkstatt). */
  function zahnrad(g, cx, cy, r, zaehne, winkel, farbe) {
    g.save();
    g.translate(cx, cy);
    g.rotate(winkel);
    g.fillStyle = farbe;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fill();
    for (let z = 0; z < zaehne; z++) {
      g.rotate((Math.PI * 2) / zaehne);
      g.fillRect(-4, -r - 8, 8, 10);
    }
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath();
    g.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  const DEKO = {
    metall(g, th, kx, ky, t) {
      const oy = Math.round(-ky * 0.3);
      // Zahnräder an der Wand drehen sich langsam
      wiederhole(kx, 0.2, 340, (i, x) => {
        const richtung = i % 2 ? 1 : -1;
        zahnrad(g, x + 80, 90 + oy, 46, 12, t * 0.4 * richtung, 'rgba(120,135,150,0.35)');
        zahnrad(g, x + 152, 150 + oy, 26, 8, -t * 0.7 * richtung, 'rgba(120,135,150,0.3)');
      });
      wiederhole(kx, 0.4, 270, (i, x) => {
        // Regal mit Rohren und Kisten
        g.fillStyle = '#323a43';
        g.fillRect(x + 10, 120 + oy, 120, 6);
        g.fillRect(x + 10, 190 + oy, 120, 6);
        g.fillRect(x + 14, 120 + oy, 6, 220);
        g.fillRect(x + 120, 120 + oy, 6, 220);
        g.fillStyle = '#7a8794';
        g.fillRect(x + 22, 112 + oy, 96, 8);
        g.fillRect(x + 30, 104 + oy, 70, 8);
        g.fillStyle = '#5a4a3a';
        g.fillRect(x + 28, 160 + oy, 34, 30);
        g.fillRect(x + 70, 168 + oy, 40, 22);
        // Amboss
        g.fillStyle = '#2a3038';
        g.fillRect(x + 168, 276 + oy, 64, 14);
        g.fillRect(x + 156, 278 + oy, 14, 6);
        g.fillRect(x + 186, 290 + oy, 28, 22);
        g.fillRect(x + 176, 312 + oy, 48, 10);
        // Schweißfunken blitzen auf
        if (Math.sin(t * 6 + i * 2.3) > 0.55) {
          const takt = Math.floor(t * 14);
          for (let f = 0; f < 7; f++) {
            g.fillStyle = f % 2 ? '#fff4a0' : '#ffb040';
            g.fillRect(x + 200 + (zufall(i * 31 + takt, f) - 0.5) * 40, 262 + oy - zufall(i * 17 + takt, f + 3) * 26, 2, 2);
          }
        }
      });
    },

    naehstube(g, th, kx, ky, t) {
      const oy = Math.round(-ky * 0.3);
      const farben = ['#e8a0b4', '#a0c4e8', '#f0d890', '#b0e0b0', '#d0b0f0'];
      // Stoffbahnen hängen von der Decke und wehen leicht
      wiederhole(kx, 0.2, 90, (i, x) => {
        g.fillStyle = farben[Math.floor(zufall(i, 1) * farben.length)];
        g.globalAlpha = 0.35;
        const laenge = 80 + zufall(i, 2) * 120;
        for (let y = 0; y < laenge; y += 8) {
          const welle = Math.round(Math.sin(t * 2 + y * 0.05 + i) * 3);
          g.fillRect(x + welle, y + oy, 26, 8);
        }
        g.globalAlpha = 1;
      });
      // Nähmaschinen auf Tischen und ein Regal mit Garnrollen
      wiederhole(kx, 0.4, 250, (i, x) => {
        g.fillStyle = '#6a4a3a';
        g.fillRect(x + 20, 250 + oy, 150, 10);
        g.fillRect(x + 30, 260 + oy, 8, 80);
        g.fillRect(x + 152, 260 + oy, 8, 80);
        g.fillStyle = '#ece4d4';
        g.fillRect(x + 50, 236 + oy, 90, 14);
        g.fillRect(x + 120, 196 + oy, 20, 40);
        g.fillRect(x + 60, 196 + oy, 80, 14);
        g.fillRect(x + 60, 210 + oy, 10, 16);
        g.fillStyle = '#c04060';
        g.fillRect(x + 66, 200 + oy, 30, 4);
        const nadel = Math.round(Math.abs(Math.sin(t * 10 + i)) * 4);
        g.fillStyle = '#d0d0d0';
        g.fillRect(x + 64, 226 + oy + nadel, 2, 6);
        g.fillStyle = '#6a4a3a';
        g.fillRect(x + 175, 246 + oy, 64, 6);
        for (let s = 0; s < 3; s++) {
          g.fillStyle = '#d9b98a';
          g.fillRect(x + 180 + s * 18, 222 + oy, 14, 4);
          g.fillRect(x + 180 + s * 18, 242 + oy, 14, 4);
          g.fillStyle = farben[(((i + s) % 5) + 5) % 5];
          g.fillRect(x + 182 + s * 18, 226 + oy, 10, 16);
        }
      });
    },

    elektronik(g, th, kx, ky, t) {
      const oy = Math.round(-ky * 0.3);
      const leds = ['#ff4040', '#40ff80', '#40a0ff'];
      // Leiterbahnen mit blinkenden LEDs
      wiederhole(kx, 0.2, 160, (i, x) => {
        const y1 = 40 + Math.floor(zufall(i, 1) * 8) * 20 + oy;
        g.fillStyle = 'rgba(80,200,140,0.2)';
        g.fillRect(x, y1, 100, 3);
        g.fillRect(x + 100, y1, 3, 60);
        g.fillRect(x + 100, y1 + 60, 60, 3);
        g.fillStyle = 'rgba(120,240,170,0.35)';
        g.fillRect(x + 97, y1 - 3, 9, 9);
        g.fillRect(x + 157, y1 + 57, 9, 9);
        const an = Math.sin(t * 3 + i * 1.7) > 0;
        g.fillStyle = an ? leds[((i % 3) + 3) % 3] : 'rgba(0,0,0,0.35)';
        g.fillRect(x + 40, y1 + 20, 6, 6);
      });
      // Oszilloskop, Tisch und Lötkolben
      wiederhole(kx, 0.4, 300, (i, x) => {
        g.fillStyle = '#2a3038';
        g.fillRect(x + 30, 170 + oy, 120, 90);
        g.fillStyle = '#082a16';
        g.fillRect(x + 40, 180 + oy, 80, 60);
        g.fillStyle = '#50ff90';
        for (let px = 0; px < 80; px += 2) {
          const y = Math.round(Math.sin(px * 0.15 + t * 4 + i) * 18);
          g.fillRect(x + 40 + px, 209 + y + oy, 2, 2);
        }
        g.fillStyle = '#606870';
        g.fillRect(x + 126, 186 + oy, 14, 10);
        g.fillRect(x + 126, 206 + oy, 14, 10);
        g.fillStyle = 'rgba(20,30,25,0.75)';
        g.fillRect(x + 10, 260 + oy, 230, 10);
        g.fillRect(x + 20, 270 + oy, 10, 70);
        g.fillRect(x + 220, 270 + oy, 10, 70);
        g.fillStyle = '#c0c0c0';
        g.fillRect(x + 180, 230 + oy, 4, 30);
        g.fillStyle = '#e04040';
        g.fillRect(x + 176, 216 + oy, 12, 16);
      });
    },

    werkstatt(g, th, kx, ky) {
      const oy = Math.round(-ky * 0.3);
      g.fillStyle = 'rgba(0,0,0,0.13)';
      wiederhole(kx, 0.15, 48, (i, x) => g.fillRect(x, 0, 2, HOEHE));
      wiederhole(kx, 0.35, 300, (i, x) => {
        // Lochwand mit Werkzeug
        g.fillStyle = '#8a6a4c';
        g.fillRect(x + 20, 50 + oy, 150, 96);
        g.fillStyle = '#6e5238';
        for (let px = 6; px < 150; px += 12) for (let py = 6; py < 96; py += 12) g.fillRect(x + 20 + px, 50 + oy + py, 2, 2);
        g.fillStyle = '#4a3020'; g.fillRect(x + 42, 72 + oy, 6, 50);          // Hammerstiel
        g.fillStyle = '#9aa0aa'; g.fillRect(x + 32, 64 + oy, 26, 10);         // Hammerkopf
        g.fillStyle = '#c9ccd6'; g.fillRect(x + 70, 74 + oy, 48, 16);         // Sägeblatt
        g.fillStyle = '#7a4a24'; g.fillRect(x + 116, 70 + oy, 14, 24);        // Sägegriff
        g.fillStyle = '#9aa0aa'; g.fillRect(x + 148, 68 + oy, 6, 56);         // Schraubenschlüssel
        g.fillRect(x + 143, 62 + oy, 16, 8);
        // Fenster
        g.fillStyle = '#2b3d52'; g.fillRect(x + 205, 36 + oy, 64, 76);
        g.fillStyle = '#9fc4e8';
        g.fillRect(x + 209, 40 + oy, 26, 32); g.fillRect(x + 239, 40 + oy, 26, 32);
        g.fillRect(x + 209, 76 + oy, 26, 32); g.fillRect(x + 239, 76 + oy, 26, 32);
        // Werkbank
        g.fillStyle = 'rgba(40,25,15,0.55)';
        g.fillRect(x + 10, 236 + oy, 170, 12);
        g.fillRect(x + 20, 248 + oy, 10, 90);
        g.fillRect(x + 160, 248 + oy, 10, 90);
      });
    },

    holzlager(g, th, kx, ky) {
      const oy = Math.round(-ky * 0.3);
      // Stützbalken
      g.fillStyle = 'rgba(0,0,0,0.2)';
      wiederhole(kx, 0.2, 180, (i, x) => { g.fillRect(x, 0, 14, HOEHE); g.fillRect(x - 40, 30, 94, 10); });
      // Holzstapel (Stammenden)
      wiederhole(kx, 0.4, 230, (i, x) => {
        const reihen = 3 + Math.floor(zufall(i, 1) * 2);
        for (let r = 0; r < reihen; r++) {
          for (let s = 0; s < reihen - r; s++) {
            const cx = x + 40 + s * 30 + r * 15, cy = 300 + oy - r * 26;
            g.fillStyle = '#6b4a2a'; g.beginPath(); g.arc(cx, cy, 14, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#c9a06a'; g.beginPath(); g.arc(cx, cy, 10, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#a07a48'; g.fillRect(cx - 4, cy - 1, 8, 2); g.fillRect(cx - 1, cy - 4, 2, 8);
          }
        }
        // Bretterstapel
        g.fillStyle = '#8a6036';
        for (let b = 0; b < 5; b++) g.fillRect(x + 150, 250 + oy + b * 10, 70, 7);
      });
    },

    farbatelier(g, th, kx, ky, t) {
      const oy = Math.round(-ky * 0.3);
      const farben = ['#e23b3b', '#3b7be2', '#ffd23f', '#4caf50', '#b05ae0', '#ff8c3f'];
      // Farbkleckse an der Wand
      wiederhole(kx, 0.15, 120, (i, x) => {
        g.fillStyle = farben[Math.floor(zufall(i, 2) * farben.length)];
        g.globalAlpha = 0.25;
        const y = 30 + zufall(i, 3) * 120;
        g.beginPath(); g.arc(x + 40, y + oy, 10 + zufall(i, 4) * 14, 0, Math.PI * 2); g.fill();
        g.fillRect(x + 37, y + oy, 6, 30 + zufall(i, 5) * 30);
        g.globalAlpha = 1;
      });
      // Staffeleien mit Bildern
      wiederhole(kx, 0.4, 260, (i, x) => {
        g.fillStyle = '#7a4a24';
        g.fillRect(x + 50, 150 + oy, 6, 190);
        g.fillRect(x + 110, 150 + oy, 6, 190);
        g.fillRect(x + 40, 250 + oy, 90, 6);
        g.fillStyle = '#ffffff';
        g.fillRect(x + 36, 150 + oy, 96, 96);
        g.fillStyle = farben[Math.floor(zufall(i, 6) * farben.length)];
        g.fillRect(x + 44, 200 + oy, 80, 38);
        g.fillStyle = farben[Math.floor(zufall(i, 7) * farben.length)];
        g.beginPath(); g.arc(x + 100, 180 + oy, 14, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#2a1d14';
        g.fillRect(x + 56, 214 + oy, 30, 4);
      });
    },

    toepferei(g, th, kx, ky) {
      const oy = Math.round(-ky * 0.3);
      // Brennofen
      wiederhole(kx, 0.2, 420, (i, x) => {
        g.fillStyle = 'rgba(40,15,8,0.5)';
        g.fillRect(x + 260, 120 + oy, 120, 240);
        g.beginPath(); g.arc(x + 320, 120 + oy, 60, Math.PI, 0); g.fill();
        g.fillStyle = 'rgba(255,140,40,0.35)';
        g.fillRect(x + 295, 220 + oy, 50, 40);
      });
      // Regale mit Töpfen und Vasen
      wiederhole(kx, 0.4, 240, (i, x) => {
        for (let r = 0; r < 2; r++) {
          const ry = 110 + r * 90 + oy;
          g.fillStyle = '#5a2e1c';
          g.fillRect(x + 10, ry, 180, 8);
          for (let p = 0; p < 4; p++) {
            const art = zufall(i * 7 + r, p);
            const px = x + 22 + p * 44;
            g.fillStyle = art > 0.5 ? '#d98a5a' : '#a85a36';
            if (art > 0.66) {          // Vase
              g.beginPath(); g.ellipse(px + 14, ry - 18, 14, 16, 0, 0, Math.PI * 2); g.fill();
              g.fillRect(px + 9, ry - 44, 10, 14);
            } else if (art > 0.33) {   // Schale
              g.beginPath(); g.ellipse(px + 14, ry - 8, 18, 10, 0, 0, Math.PI); g.fill();
              g.fillRect(px - 4, ry - 10, 36, 4);
            } else {                   // Krug
              g.fillRect(px + 2, ry - 34, 24, 34);
              g.fillRect(px + 26, ry - 28, 6, 18);
            }
            g.fillStyle = 'rgba(255,255,255,0.25)';
            g.fillRect(px + 6, ry - 26, 3, 10);
          }
        }
      });
    },

    dachboden(g, th, kx, ky, t) {
      const oy = Math.round(-ky * 0.3);
      // Rundfenster mit Mond
      wiederhole(kx, 0.1, 520, (i, x) => {
        g.fillStyle = '#4a3a2a';
        g.beginPath(); g.arc(x + 260, 110 + oy, 46, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#1e2a52';
        g.beginPath(); g.arc(x + 260, 110 + oy, 40, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#f4f1c9';
        g.beginPath(); g.arc(x + 272, 98 + oy, 12, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#ffffff';
        for (let s = 0; s < 6; s++) g.fillRect(x + 230 + zufall(i, s) * 50, 80 + oy + zufall(i, s + 9) * 50, 2, 2);
        g.fillStyle = '#4a3a2a';
        g.fillRect(x + 258, 66 + oy, 4, 88);
        g.fillRect(x + 216, 108 + oy, 88, 4);
      });
      // Dachsparren
      g.strokeStyle = 'rgba(80,60,45,0.75)';
      g.lineWidth = 12;
      wiederhole(kx, 0.3, 320, (i, x) => {
        g.beginPath();
        g.moveTo(x, 240 + oy); g.lineTo(x + 160, -30 + oy); g.lineTo(x + 320, 240 + oy);
        g.stroke();
      });
      // Kisten und Spinnweben
      wiederhole(kx, 0.45, 280, (i, x) => {
        g.fillStyle = '#4e3b2c';
        g.fillRect(x + 40, 270 + oy, 60, 50);
        g.fillRect(x + 60, 236 + oy, 40, 34);
        g.fillStyle = '#3a2b20';
        g.fillRect(x + 40, 292 + oy, 60, 3);
        g.fillRect(x + 60, 250 + oy, 40, 3);
        g.strokeStyle = 'rgba(220,220,235,0.25)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x + 180, 0); g.lineTo(x + 230, 40 + oy);
        g.moveTo(x + 200, 0); g.lineTo(x + 222, 30 + oy);
        g.moveTo(x + 192, 14 + oy); g.lineTo(x + 214, 6 + oy);
        g.stroke();
      });
    }
  };

  const verlaufCache = new Map();
  function zeichneHintergrund(g, th, kx, ky, t) {
    let verlauf = verlaufCache.get(th);
    if (!verlauf) {
      verlauf = g.createLinearGradient(0, 0, 0, HOEHE);
      verlauf.addColorStop(0, th.himmelOben);
      verlauf.addColorStop(1, th.himmelUnten);
      verlaufCache.set(th, verlauf);
    }
    g.fillStyle = verlauf;
    g.fillRect(0, 0, BREITE, HOEHE);
    // Bei niedriger Grafikqualität nur der Farbverlauf (spart Rechenzeit)
    if (KW.Einstellungen && KW.Einstellungen.niedrig) return;
    const deko = DEKO[th.deko];
    if (deko) deko(g, th, kx, ky, t);
  }

  /** Text mit dunkler Kontur zeichnen (gut lesbar auf jedem Hintergrund). */
  function text(g, inhalt, x, y, groesse, farbe, ausrichtung) {
    g.font = 'bold ' + groesse + 'px "Courier New", Courier, monospace';
    g.textAlign = ausrichtung || 'left';
    g.textBaseline = 'middle';
    g.lineWidth = Math.max(2, groesse / 4);
    g.strokeStyle = '#000';
    g.lineJoin = 'round';
    g.strokeText(inhalt, x, y);
    g.fillStyle = farbe || '#fff';
    g.fillText(inhalt, x, y);
  }

  KW.Grafik = {
    BREITE, HOEHE,
    neueCanvas, sprite, spielerBild, pixelSprite, spielerVorlage, gegnerBild, muenzBild, federBild, herzBild,
    kachelSatz, zeichneCheckpoint, zeichneTuer, zeichneHintergrund, text
  };
})();
