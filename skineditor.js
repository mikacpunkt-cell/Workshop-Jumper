/* =========================================================
   skineditor.js – Skin-Editor
   Pixel-Editor für den eigenen Skin (im Shop einmalig für 500 Münzen
   zu kaufen, danach jederzeit bearbeitbar).

   Die Figur ist 12 × 16 Pixel groß:
   - die oberen 12 Zeilen (Körper) sind in allen Posen gleich,
   - die unteren 4 Zeilen (Beine) gibt es für jede der 4 Posen einzeln.
   Der Skin ist statisch: kein Farbwechsel, kein Glitzern.
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW;

  const BREITE = 12;
  const KOERPER = 12;      // Zeilen, die für alle Posen gelten
  const BEINE = 4;
  const ZEILEN = KOERPER + BEINE;
  const POSEN = ['stehen', 'laufen1', 'laufen2', 'sprung'];

  const TEXTE = {
    de: {
      titel: 'Skin-Editor', rueckgaengig: 'Rückgängig', wiederholen: 'Wiederholen', vorlage: 'Vorlage laden',
      speichern: 'Speichern', schliessen: 'Schließen',
      stift: 'Stift', radierer: 'Radierer', fuellen: 'Füllen', pipette: 'Pipette', symmetrie: 'Symmetrie',
      farbe: 'Farbe', zuletzt: 'Zuletzt benutzt', vorschau: 'So sieht dein Skin im Spiel aus',
      'pose.stehen': 'Stehen', 'pose.laufen1': 'Laufen 1', 'pose.laufen2': 'Laufen 2', 'pose.sprung': 'Springen',
      vorschauLinks: 'Nach links',
      legende: 'Über der gelben Linie liegt der Körper (in allen Posen gleich), darunter die Beine der gewählten Pose.',
      gespeichert: 'Gespeichert.', vorlageGeladen: 'Handwerker-Vorlage geladen – mit „Rückgängig“ kommst du zurück.',
      frageTitel: 'Ungespeicherte Änderungen', frage: 'Du hast Änderungen nicht gespeichert. Was soll damit passieren?',
      verwerfen: 'Verwerfen', weiter: 'Weiter bearbeiten'
    },
    en: {
      titel: 'Skin editor', rueckgaengig: 'Undo', wiederholen: 'Redo', vorlage: 'Load template',
      speichern: 'Save', schliessen: 'Close',
      stift: 'Pencil', radierer: 'Eraser', fuellen: 'Fill', pipette: 'Picker', symmetrie: 'Symmetry',
      farbe: 'Colour', zuletzt: 'Recently used', vorschau: 'How your skin looks in the game',
      'pose.stehen': 'Standing', 'pose.laufen1': 'Walking 1', 'pose.laufen2': 'Walking 2', 'pose.sprung': 'Jumping',
      vorschauLinks: 'Facing left',
      legende: 'Above the yellow line is the body (the same in all poses), below it the legs of the selected pose.',
      gespeichert: 'Saved.', vorlageGeladen: 'Craftsman template loaded – use “Undo” to go back.',
      frageTitel: 'Unsaved changes', frage: 'You have unsaved changes. What should happen to them?',
      verwerfen: 'Discard', weiter: 'Keep editing'
    }
  };
  function t(schluessel) {
    const sprache = KW.I18n && KW.I18n.sprache === 'en' ? 'en' : 'de';
    const s = TEXTE[sprache][schluessel];
    return s !== undefined ? s : (TEXTE.de[schluessel] !== undefined ? TEXTE.de[schluessel] : schluessel);
  }

  /* ---------- Zustand ---------- */
  let wurzel = null, cv = null, g = null, feldEl = null, toastEl = null, farbFeld = null, swatchEl = null, zuletztEl = null;
  let btnUndo = null, btnRedo = null, symmetrieHaken = null;
  let posenKnoepfe = {}, werkzeugKnoepfe = {}, vorschauLeinwaende = {};
  let d = null;                       // { koerper: [12][12], beine: { pose: [4][12] } }, Zellen '' oder '#rrggbb'
  let pose = 'stehen', werkzeug = 'stift', farbe = '#e8742a', symmetrie = false;
  let undoStapel = [], redoStapel = [];
  let geaendert = false, istOffen = false;
  let zelle = 20, dpr = 1;
  let maus = null, hover = null;
  let zuletzt = [];
  let optionen = null;
  let dialogWand = null;
  let toastTimer = 0;
  let zeichnenGeplant = false;

  const kopie = (daten) => JSON.parse(JSON.stringify(daten));

  /* ---------- Zugriff auf Zellen ---------- */
  function lesen(x, y) {
    return y < KOERPER ? d.koerper[y][x] : d.beine[pose][y - KOERPER][x];
  }
  function schreiben(x, y, wert) {
    if (y < KOERPER) d.koerper[y][x] = wert; else d.beine[pose][y - KOERPER][x] = wert;
  }

  /** Setzt eine Zelle (mit Spiegelung, wenn aktiv). Liefert true, wenn sich etwas geändert hat. */
  function setze(x, y, wert, strich) {
    let veraendert = false;
    const ziele = symmetrie ? [x, BREITE - 1 - x] : [x];
    ziele.forEach((px) => {
      if (px < 0 || px >= BREITE || y < 0 || y >= ZEILEN) return;
      if (lesen(px, y) === wert) return;
      if (strich && !strich.gemerkt) { merke(); strich.gemerkt = true; }
      schreiben(px, y, wert);
      veraendert = true;
    });
    return veraendert;
  }

  function linie(x0, y0, x1, y1, wert, strich) {
    let veraendert = false;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let fehler = dx + dy;
    for (;;) {
      if (setze(x0, y0, wert, strich)) veraendert = true;
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * fehler;
      if (e2 >= dy) { fehler += dy; x0 += sx; }
      if (e2 <= dx) { fehler += dx; y0 += sy; }
    }
    return veraendert;
  }

  /** Füllt die zusammenhängende Fläche gleicher Farbe (4er-Nachbarschaft). */
  function fluten(x, y, wert) {
    if (x < 0 || y < 0 || x >= BREITE || y >= ZEILEN) return false;
    const ziel = lesen(x, y);
    if (ziel === wert) return false;
    const strich = { gemerkt: false };
    const stapel = [[x, y]];
    while (stapel.length) {
      const p = stapel.pop();
      const px = p[0], py = p[1];
      if (px < 0 || py < 0 || px >= BREITE || py >= ZEILEN || lesen(px, py) !== ziel) continue;
      setze(px, py, wert, strich);
      stapel.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
    }
    return strich.gemerkt;
  }

  /* ---------- Rückgängig / Wiederholen ---------- */
  function merke() {
    undoStapel.push(JSON.stringify(d));
    if (undoStapel.length > 80) undoStapel.shift();
    redoStapel = [];
    knoepfeAktualisieren();
  }
  function rueckgaengig() {
    if (!undoStapel.length) return;
    redoStapel.push(JSON.stringify(d));
    d = JSON.parse(undoStapel.pop());
    geaendert = true;
    alleNeuzeichnen();
  }
  function wiederholen() {
    if (!redoStapel.length) return;
    undoStapel.push(JSON.stringify(d));
    d = JSON.parse(redoStapel.pop());
    geaendert = true;
    alleNeuzeichnen();
  }
  function knoepfeAktualisieren() {
    if (!btnUndo) return;
    btnUndo.disabled = !undoStapel.length;
    btnRedo.disabled = !redoStapel.length;
  }
  function alleNeuzeichnen() {
    knoepfeAktualisieren();
    vorschauZeichnen();
    neuzeichnen();
  }

  /* ---------- Zeichnen ---------- */
  function neuzeichnen() {
    if (zeichnenGeplant || !istOffen) return;
    zeichnenGeplant = true;
    requestAnimationFrame(zeichnen);
  }

  function zeichnen() {
    zeichnenGeplant = false;
    if (!istOffen || !d || !cv.width) return;
    const px = zelle * dpr;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height);
    const halb = px / 2;
    for (let y = 0; y < ZEILEN; y++) {
      for (let x = 0; x < BREITE; x++) {
        const x0 = x * px, y0 = y * px;
        // Schachbrett für durchsichtige Pixel
        g.fillStyle = '#7a7a7a';
        g.fillRect(x0, y0, px, px);
        g.fillStyle = '#5c5c5c';
        g.fillRect(x0, y0, halb, halb);
        g.fillRect(x0 + halb, y0 + halb, halb, halb);
        const farbe = lesen(x, y);
        if (farbe) { g.fillStyle = farbe; g.fillRect(x0, y0, px, px); }
      }
    }
    // feines Raster
    g.strokeStyle = 'rgba(0,0,0,0.28)';
    g.lineWidth = 1;
    g.beginPath();
    for (let x = 0; x <= BREITE; x++) { const p = Math.round(x * px) + 0.5; g.moveTo(p, 0); g.lineTo(p, ZEILEN * px); }
    for (let y = 0; y <= ZEILEN; y++) { const p = Math.round(y * px) + 0.5; g.moveTo(0, p); g.lineTo(BREITE * px, p); }
    g.stroke();
    // gelbe Linie zwischen Körper und Beinen
    g.strokeStyle = '#ffd23f';
    g.lineWidth = Math.max(2, 2 * dpr);
    g.setLineDash([6 * dpr, 4 * dpr]);
    g.beginPath(); g.moveTo(0, KOERPER * px); g.lineTo(BREITE * px, KOERPER * px); g.stroke();
    g.setLineDash([]);
    // Zelle unter der Maus
    if (hover && hover.x >= 0 && hover.y >= 0 && hover.x < BREITE && hover.y < ZEILEN) {
      g.strokeStyle = '#fff';
      g.lineWidth = Math.max(2, 2 * dpr);
      g.strokeRect(hover.x * px + dpr, hover.y * px + dpr, px - 2 * dpr, px - 2 * dpr);
      if (symmetrie) {
        const sx = BREITE - 1 - hover.x;
        g.strokeStyle = 'rgba(255,255,255,0.55)';
        g.strokeRect(sx * px + dpr, hover.y * px + dpr, px - 2 * dpr, px - 2 * dpr);
      }
    }
  }

  function zeilenFuerPose(p) { return d.koerper.concat(d.beine[p]); }

  function vorschauZeichnen() {
    if (!d) return;
    POSEN.forEach((p) => {
      const c = vorschauLeinwaende[p].getContext('2d');
      c.clearRect(0, 0, 24, 32);
      c.drawImage(KW.Grafik.pixelSprite(zeilenFuerPose(p), false, 2), 0, 0);
    });
    const links = vorschauLeinwaende.links.getContext('2d');
    links.clearRect(0, 0, 24, 32);
    links.drawImage(KW.Grafik.pixelSprite(zeilenFuerPose('laufen1'), true, 2), 0, 0);
  }

  function groesseAnpassen() {
    if (!istOffen) return;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    const b = feldEl.clientWidth, h = feldEl.clientHeight;
    zelle = Math.max(8, Math.min(40, Math.floor(Math.min(b / BREITE, h / ZEILEN))));
    cv.width = Math.round(BREITE * zelle * dpr);
    cv.height = Math.round(ZEILEN * zelle * dpr);
    cv.style.width = (BREITE * zelle) + 'px';
    cv.style.height = (ZEILEN * zelle) + 'px';
    neuzeichnen();
  }

  /* ---------- Maus und Touch ---------- */
  function zelleBei(e) {
    const r = cv.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - r.left) / zelle),
      y: Math.floor((e.clientY - r.top) / zelle)
    };
  }

  function farbeMerken(hex) {
    zuletzt = [hex].concat(zuletzt.filter((f) => f !== hex)).slice(0, 12);
    zuletztZeichnen();
  }

  function beiDruecken(e) {
    if (e.button !== undefined && e.button > 0) return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* egal */ }
    const p = zelleBei(e);
    hover = p;
    if (p.x < 0 || p.y < 0 || p.x >= BREITE || p.y >= ZEILEN) return;
    if (werkzeug === 'stift' || werkzeug === 'radierer') {
      const wert = werkzeug === 'radierer' ? '' : farbe;
      if (werkzeug === 'stift') farbeMerken(farbe);
      maus = { art: 'zeichnen', wert: wert, last: p, strich: { gemerkt: false } };
      if (setze(p.x, p.y, wert, maus.strich)) geaendert = true;
      vorschauZeichnen();
    } else if (werkzeug === 'fuellen') {
      farbeMerken(farbe);
      if (fluten(p.x, p.y, farbe)) { geaendert = true; vorschauZeichnen(); }
    } else if (werkzeug === 'pipette') {
      const gefunden = lesen(p.x, p.y);
      if (gefunden) farbeSetzen(gefunden);
    }
    neuzeichnen();
  }

  function beiBewegen(e) {
    const p = zelleBei(e);
    hover = p;
    if (maus && maus.art === 'zeichnen') {
      if (linie(maus.last.x, maus.last.y, p.x, p.y, maus.wert, maus.strich)) { geaendert = true; vorschauZeichnen(); }
      maus.last = p;
    }
    neuzeichnen();
  }

  function beiLoslassen() {
    if (maus) { maus = null; knoepfeAktualisieren(); }
  }

  /* ---------- Bedienelemente ---------- */
  function el(tag, klasse, text, eltern) {
    const e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined && text !== null) e.textContent = text;
    if (eltern) eltern.appendChild(e);
    return e;
  }
  function knopf(schluessel, klasse, beiKlick, eltern) {
    const b = el('button', 'kws-btn' + (klasse ? ' ' + klasse : ''), '', eltern);
    b.type = 'button';
    b.dataset.t = schluessel;
    b.addEventListener('click', beiKlick);
    return b;
  }

  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('zu-sehen');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('zu-sehen'), 2600);
  }

  function farbeSetzen(hex) {
    farbe = hex.toLowerCase();
    farbFeld.value = farbe;
    swatchEl.querySelectorAll('.kws-farbe').forEach((b) => b.classList.toggle('aktiv', b.dataset.farbe === farbe));
    zuletztEl.querySelectorAll('.kws-farbe').forEach((b) => b.classList.toggle('aktiv', b.dataset.farbe === farbe));
  }

  function farbknopf(hex, eltern) {
    const b = el('button', 'kws-farbe', null, eltern);
    b.type = 'button';
    b.dataset.farbe = hex;
    b.style.background = hex;
    b.title = hex;
    b.setAttribute('aria-label', hex);
    b.addEventListener('click', () => { farbeSetzen(hex); if (werkzeug === 'radierer' || werkzeug === 'pipette') werkzeugWaehlen('stift'); });
    if (hex === farbe) b.classList.add('aktiv');
  }

  function zuletztZeichnen() {
    zuletztEl.innerHTML = '';
    zuletzt.forEach((hex) => farbknopf(hex, zuletztEl));
  }

  function werkzeugWaehlen(w) {
    werkzeug = w;
    Object.keys(werkzeugKnoepfe).forEach((n) => werkzeugKnoepfe[n].classList.toggle('aktiv', n === w));
  }

  function poseWaehlen(p) {
    pose = p;
    Object.keys(posenKnoepfe).forEach((n) => posenKnoepfe[n].classList.toggle('aktiv', n === p));
    neuzeichnen();
  }

  function beschriftungen() {
    wurzel.querySelectorAll('[data-t]').forEach((e) => { e.textContent = t(e.dataset.t); });
  }

  /* ---------- Aufbau ---------- */
  function aufbauen() {
    const css = el('style', null, [
      '.kws{position:fixed;inset:0;z-index:2100;display:none;flex-direction:column;background:#1a110c;color:#f4e9dc;font:14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif}',
      '.kws.offen{display:flex}',
      '.kws button,.kws input{font:inherit}',
      '.kws-kopf{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 8px;background:#2b1d14;border-bottom:2px solid #000}',
      '.kws-kopf strong{color:#ffd23f;margin-right:auto}',
      '.kws-btn{padding:6px 10px;border:2px solid #000;border-radius:6px;background:#5a4a40;color:#fff;cursor:pointer;box-shadow:0 2px 0 #000}',
      '.kws-btn:hover:not(:disabled){filter:brightness(1.15)}',
      '.kws-btn:disabled{opacity:.4;cursor:default}',
      '.kws-btn.primaer{background:#d9731f}',
      '.kws-btn.aktiv{outline:3px solid #ffd23f}',
      '.kws-haupt{flex:1;min-height:0;display:flex;gap:12px;padding:10px;overflow:auto}',
      '.kws-links{flex:1 1 320px;min-width:240px;min-height:0;display:flex;flex-direction:column;align-items:center;gap:8px}',
      '.kws-posen{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}',
      '.kws-feld{flex:1;min-height:200px;width:100%;display:flex;align-items:center;justify-content:center}',
      '.kws-feld canvas{display:block;touch-action:none;cursor:crosshair;border:2px solid #000;background:#444}',
      '.kws-legende{font-size:12px;opacity:.75;text-align:center;max-width:44ch}',
      '.kws-rechts{flex:0 0 260px;display:flex;flex-direction:column;gap:10px;min-width:220px}',
      '.kws-box{background:#2b1d14;border:2px solid #000;border-radius:8px;padding:8px}',
      '.kws-box h4{margin:0 0 6px;font-size:13px;color:#ffd23f}',
      '.kws-werkzeuge{display:flex;flex-wrap:wrap;gap:6px}',
      '.kws-sym{display:flex;gap:6px;align-items:center;margin-top:8px}',
      '.kws-farbzeile{display:flex;gap:8px;align-items:center;margin-bottom:6px}',
      '.kws-farbzeile input[type=color]{width:56px;height:36px;padding:0;border:2px solid #000;border-radius:6px;background:#fff;cursor:pointer}',
      '.kws-farben{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;min-height:6px}',
      '.kws-farbe{width:24px;height:24px;padding:0;border:2px solid #000;border-radius:4px;cursor:pointer}',
      '.kws-farbe.aktiv{outline:3px solid #ffd23f}',
      '.kws-vorschau{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;background:#46688a;border-radius:6px;padding:8px}',
      '.kws-vorschau figure{margin:0;text-align:center;font-size:11px}',
      '.kws-vorschau canvas{width:48px;height:64px;image-rendering:pixelated;display:block;margin:0 auto 2px}',
      '.kws-wand{position:absolute;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:12px;z-index:5}',
      '.kws-dialog{background:#2b1d14;border:3px solid #000;border-radius:8px;padding:14px 16px;max-width:460px;width:100%;box-shadow:0 6px 0 #000}',
      '.kws-dialog h3{margin:0 0 10px;color:#ffd23f;font-size:18px}',
      '.kws-dialog p{margin:0 0 8px}',
      '.kws-dialogknoepfe{display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap}',
      '.kws-toast{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);background:#000c;color:#fff;padding:8px 14px;border-radius:20px;opacity:0;pointer-events:none;transition:opacity .2s;max-width:90%;text-align:center;z-index:6}',
      '.kws-toast.zu-sehen{opacity:1}',
      '@media (max-width:640px){.kws-rechts{flex:1 1 100%}}'
    ].join('\n'));
    document.head.appendChild(css);

    wurzel = el('div', 'kws', null, document.body);
    wurzel.setAttribute('role', 'application');

    const kopf = el('div', 'kws-kopf', null, wurzel);
    const titel = el('strong', null, '', kopf); titel.dataset.t = 'titel';
    btnUndo = knopf('rueckgaengig', '', rueckgaengig, kopf);
    btnRedo = knopf('wiederholen', '', wiederholen, kopf);
    knopf('vorlage', '', vorlageLaden, kopf);
    knopf('speichern', 'primaer', speichern, kopf);
    knopf('schliessen', '', versucheSchliessen, kopf);

    const haupt = el('div', 'kws-haupt', null, wurzel);
    const links = el('div', 'kws-links', null, haupt);
    const posenZeile = el('div', 'kws-posen', null, links);
    POSEN.forEach((p) => {
      const b = knopf('pose.' + p, '', () => poseWaehlen(p), posenZeile);
      posenKnoepfe[p] = b;
    });
    feldEl = el('div', 'kws-feld', null, links);
    cv = el('canvas', null, null, feldEl);
    g = cv.getContext('2d');
    cv.addEventListener('pointerdown', beiDruecken);
    cv.addEventListener('pointermove', beiBewegen);
    cv.addEventListener('pointerup', beiLoslassen);
    cv.addEventListener('pointercancel', beiLoslassen);
    cv.addEventListener('pointerleave', () => { if (!maus) { hover = null; neuzeichnen(); } });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    const legende = el('div', 'kws-legende', '', links); legende.dataset.t = 'legende';

    const rechts = el('div', 'kws-rechts', null, haupt);
    const werkzeugBox = el('div', 'kws-box', null, rechts);
    const werkzeugZeile = el('div', 'kws-werkzeuge', null, werkzeugBox);
    ['stift', 'radierer', 'fuellen', 'pipette'].forEach((w) => {
      werkzeugKnoepfe[w] = knopf(w, '', () => werkzeugWaehlen(w), werkzeugZeile);
    });
    const symZeile = el('label', 'kws-sym', null, werkzeugBox);
    symmetrieHaken = el('input', null, null, symZeile);
    symmetrieHaken.type = 'checkbox';
    symmetrieHaken.addEventListener('change', () => { symmetrie = symmetrieHaken.checked; neuzeichnen(); });
    const symText = el('span', null, '', symZeile); symText.dataset.t = 'symmetrie';

    const farbBox = el('div', 'kws-box', null, rechts);
    const farbTitel = el('h4', null, '', farbBox); farbTitel.dataset.t = 'farbe';
    const farbZeile = el('div', 'kws-farbzeile', null, farbBox);
    farbFeld = el('input', null, null, farbZeile);
    farbFeld.type = 'color';
    farbFeld.value = farbe;
    farbFeld.addEventListener('input', () => {
      farbeSetzen(farbFeld.value);
      if (werkzeug === 'radierer' || werkzeug === 'pipette') werkzeugWaehlen('stift');
    });
    swatchEl = el('div', 'kws-farben', null, farbBox);
    const zuletztTitel = el('h4', null, '', farbBox); zuletztTitel.dataset.t = 'zuletzt';
    zuletztEl = el('div', 'kws-farben', null, farbBox);

    const vorschauBox = el('div', 'kws-box', null, rechts);
    const vorschauTitel = el('h4', null, '', vorschauBox); vorschauTitel.dataset.t = 'vorschau';
    const vorschau = el('div', 'kws-vorschau', null, vorschauBox);
    POSEN.concat('links').forEach((p) => {
      const fig = el('figure', null, null, vorschau);
      const c = el('canvas', null, null, fig);
      c.width = 24; c.height = 32;
      vorschauLeinwaende[p] = c;
      const bu = el('figcaption', null, '', fig);
      bu.dataset.t = p === 'links' ? 'vorschauLinks' : 'pose.' + p;
    });

    toastEl = el('div', 'kws-toast', '', wurzel);

    window.addEventListener('keydown', beiTaste, true);
    window.addEventListener('resize', groesseAnpassen);
    if (window.ResizeObserver) new ResizeObserver(groesseAnpassen).observe(feldEl);
  }

  function swatchesAufbauen() {
    swatchEl.innerHTML = '';
    const vorlage = KW.Grafik.spielerVorlage();
    const farben = [];
    zeilenFuerAlle(vorlage).forEach((zeilen) => zeilen.forEach((z) => z.forEach((c) => { if (c && farben.indexOf(c) < 0) farben.push(c); })));
    ['#000000', '#ffffff'].forEach((c) => { if (farben.indexOf(c) < 0) farben.push(c); });
    farben.slice(0, 16).forEach((hex) => farbknopf(hex, swatchEl));
  }
  function zeilenFuerAlle(daten) {
    return [daten.koerper].concat(POSEN.map((p) => daten.beine[p]));
  }

  /* ---------- Aktionen ---------- */
  function vorlageLaden() {
    merke();
    d = kopie({ koerper: KW.Grafik.spielerVorlage().koerper, beine: KW.Grafik.spielerVorlage().beine });
    geaendert = true;
    alleNeuzeichnen();
    toast(t('vorlageGeladen'));
  }

  function speichern() {
    if (!KW.Konto.eigenerSkinSpeichern(kopie(d))) return false;
    geaendert = false;
    toast(t('gespeichert'));
    return true;
  }

  function dialogOeffnen(titel, text, knoepfe) {
    dialogSchliessen();
    dialogWand = el('div', 'kws-wand', null, wurzel);
    const box = el('div', 'kws-dialog', null, dialogWand);
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    el('h3', null, titel, box);
    el('p', null, text, box);
    const zeile = el('div', 'kws-dialogknoepfe', null, box);
    knoepfe.forEach((k) => {
      const b = el('button', 'kws-btn' + (k.primaer ? ' primaer' : ''), k.text, zeile);
      b.type = 'button';
      b.addEventListener('click', () => { dialogSchliessen(); if (k.aktion) k.aktion(); });
    });
    const erster = zeile.querySelector('.primaer') || zeile.querySelector('button');
    if (erster) setTimeout(() => erster.focus(), 0);
  }
  function dialogSchliessen() {
    if (dialogWand && dialogWand.parentNode) dialogWand.parentNode.removeChild(dialogWand);
    dialogWand = null;
  }

  function versucheSchliessen() {
    if (!geaendert) { schliessen(); return; }
    dialogOeffnen(t('frageTitel'), t('frage'), [
      { text: t('weiter') },
      { text: t('verwerfen'), aktion: schliessen },
      { text: t('speichern'), primaer: true, aktion: () => { if (speichern()) schliessen(); } }
    ]);
  }

  function schliessen() {
    istOffen = false;
    dialogSchliessen();
    wurzel.classList.remove('offen');
    const beiSchliessen = optionen && optionen.beiSchliessen;
    optionen = null;
    if (beiSchliessen) beiSchliessen();
  }

  function beiTaste(e) {
    if (!istOffen) return;
    const ziel = e.target && e.target.tagName;
    const tippen = ziel === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'color';
    // Das Spiel darunter soll auf Esc/P nicht reagieren
    if ((e.code === 'Escape' || e.code === 'KeyP') && !tippen) {
      e.stopImmediatePropagation();
      if (e.code === 'Escape') { e.preventDefault(); if (dialogWand) dialogSchliessen(); else versucheSchliessen(); }
      return;
    }
    if (tippen || dialogWand) return;
    const strg = e.ctrlKey || e.metaKey;
    if (strg && e.code === 'KeyZ') { e.preventDefault(); if (e.shiftKey) wiederholen(); else rueckgaengig(); return; }
    if (strg && e.code === 'KeyY') { e.preventDefault(); wiederholen(); return; }
    if (strg && e.code === 'KeyS') { e.preventDefault(); speichern(); return; }
    if (strg) return;
    const k = { KeyB: 'stift', KeyE: 'radierer', KeyG: 'fuellen', KeyI: 'pipette' }[e.code];
    if (k) werkzeugWaehlen(k);
  }

  /* ---------- Öffnen ---------- */
  /**
   * Öffnet den Editor. Nur möglich, wenn der eigene Skin gekauft ist.
   * optionen.beiSchliessen wird beim Schließen aufgerufen.
   */
  function oeffnen(opt) {
    if (!KW.Konto.besitzt('eigener')) return false;
    if (!wurzel) aufbauen();
    optionen = opt || null;
    d = kopie(KW.Konto.eigenerSkinDaten());
    delete d.rev;
    undoStapel = []; redoStapel = [];
    geaendert = false;
    maus = null; hover = null;
    zuletzt = [];
    pose = 'stehen'; symmetrie = false; symmetrieHaken.checked = false;
    farbe = '#e8742a';
    swatchesAufbauen();
    zuletztZeichnen();
    farbeSetzen(farbe);
    werkzeugWaehlen('stift');
    poseWaehlen('stehen');
    istOffen = true;
    wurzel.classList.add('offen');
    beschriftungen();
    knoepfeAktualisieren();
    groesseAnpassen();
    vorschauZeichnen();
    neuzeichnen();
    return true;
  }

  KW.SkinEditor = { oeffnen };
})();
