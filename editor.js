/* =========================================================
   editor.js – Level-Editor
   Baut sich beim ersten Öffnen selbst auf (eigenes DOM + CSS) und
   zeichnet mit denselben Kacheln und Figuren wie das Spiel.
   - Stift, Rechteck, Füllen, Verschieben; Rückgängig/Wiederholen
   - Eigene Level werden lokal im Browser gespeichert
   - „Testen“ spielt das Level im echten Spiel; nichts davon landet
     im Spielstand (Speicher-Testmodus, wie beim Level-Prüfer)
   - „Teilen“ erzeugt einen Text-Code zum Weitergeben und Importieren
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW;
  const T = KW.TILE;

  /* ---------- Texte (Deutsch / Englisch) ---------- */
  const TEXTE = {
    de: {
      titel: 'Level-Editor', neu: 'Neu', oeffnen: 'Öffnen', speichern: 'Speichern',
      rueckgaengig: 'Rückgängig', wiederholen: 'Wiederholen', eigenschaften: 'Eigenschaften',
      testen: '▶ Testen', teilen: 'Teilen', schliessen: 'Schließen',
      stift: 'Stift', rechteck: 'Rechteck', fuellen: 'Füllen', hand: 'Verschieben',
      raster: 'Raster', zoomMinus: 'Verkleinern', zoomPlus: 'Vergrößern',
      standardName: 'Mein Level', hinweis: 'Tipp: Mausrad = seitlich scrollen, Strg + Mausrad = Zoom, rechte Maustaste ziehen = verschieben.',
      abbrechen: 'Abbrechen', ok: 'OK', ja: 'Ja', nein: 'Nein', loeschen: 'Löschen', schliessenKlein: 'Schließen',
      'k.#': 'Boden', 'k.B': 'Ziegel', 'k.?': 'Münzblock', 'k.!': 'Power-up-Block (Doppelsprung)',
      'k.C': 'Bröckelnde Plattform', 'k.^': 'Stacheln', 'k.T': 'Trampolin', 'k.o': 'Münze', 'k.O': 'Große Münze',
      'k.E': 'Gegner', 'k.-': 'Plattform (waagerecht)', 'k.|': 'Plattform (senkrecht)',
      'k.K': 'Checkpoint', 'k.Z': 'Ziel (Tür)', 'k.S': 'Start', 'k..': 'Radierer',
      eigName: 'Name', eigThema: 'Thema', eigZeit: 'Zeit (Sekunden)', eigBreite: 'Breite (Kacheln)', eigHoehe: 'Höhe (Kacheln)',
      eigTempo: 'Gegner-Tempo', eigPlattWeite: 'Plattform: Strecke waagerecht (Kacheln)',
      eigPlattHoehe: 'Plattform: Strecke senkrecht (Kacheln)', eigPlattDauer: 'Plattform: Sekunden pro Runde',
      eigHinweis: 'Beim Ändern der Höhe wird oben angebaut oder abgeschnitten, der Boden bleibt unten.',
      neuFrage: 'Ungespeicherte Änderungen gehen verloren. Wirklich ein neues Level beginnen?',
      neuOk: 'Neues Level',
      listeTitel: 'Meine Level', listeLeer: 'Noch nichts gespeichert. Mit „Speichern“ legst du dein Level hier ab.',
      loeschFrage: '„{n}“ wirklich löschen?', gespeichert: 'Gespeichert.', geoeffnet: '„{n}“ geöffnet.',
      geloescht: 'Gelöscht.', neuGelegt: 'Neues Level angelegt.',
      testStart: 'Das Level braucht einen Start (S).', testZiel: 'Das Level braucht ein Ziel (Z).',
      testGeschafft: 'Geschafft – das Level ist spielbar!', testGameOver: 'Game over – vielleicht etwas leichter bauen?',
      teilenTitel: 'Level teilen', teilenCode: 'Teilen-Code (zum Weitergeben)', kopieren: 'Kopieren', kopiert: 'In die Zwischenablage kopiert.',
      kopierenFehler: 'Kopieren hat nicht geklappt – markiere den Text und kopiere ihn von Hand.',
      importTitel: 'Code einfügen und importieren', importieren: 'Importieren', importOk: 'Level importiert.',
      dateiTitel: 'Für Entwickler: Level-Datei für das Spiel',
      fehlerFormat: 'Das ist kein gültiger Level-Code.', fehlerBreite: 'Die Breite muss zwischen {a} und {b} Kacheln liegen.',
      fehlerHoehe: 'Die Höhe muss zwischen {a} und {b} Kacheln liegen.',
      datumFormat: 'de-DE', kacheln: 'Kacheln', schlossen: 'Editor geschlossen.'
    },
    en: {
      titel: 'Level editor', neu: 'New', oeffnen: 'Open', speichern: 'Save',
      rueckgaengig: 'Undo', wiederholen: 'Redo', eigenschaften: 'Properties',
      testen: '▶ Test', teilen: 'Share', schliessen: 'Close',
      stift: 'Pencil', rechteck: 'Rectangle', fuellen: 'Fill', hand: 'Move',
      raster: 'Grid', zoomMinus: 'Zoom out', zoomPlus: 'Zoom in',
      standardName: 'My level', hinweis: 'Tip: mouse wheel = scroll sideways, Ctrl + wheel = zoom, drag with right button = move.',
      abbrechen: 'Cancel', ok: 'OK', ja: 'Yes', nein: 'No', loeschen: 'Delete', schliessenKlein: 'Close',
      'k.#': 'Ground', 'k.B': 'Brick', 'k.?': 'Coin block', 'k.!': 'Power-up block (double jump)',
      'k.C': 'Crumbling platform', 'k.^': 'Spikes', 'k.T': 'Trampoline', 'k.o': 'Coin', 'k.O': 'Big coin',
      'k.E': 'Enemy', 'k.-': 'Platform (horizontal)', 'k.|': 'Platform (vertical)',
      'k.K': 'Checkpoint', 'k.Z': 'Goal (door)', 'k.S': 'Start', 'k..': 'Eraser',
      eigName: 'Name', eigThema: 'Theme', eigZeit: 'Time (seconds)', eigBreite: 'Width (tiles)', eigHoehe: 'Height (tiles)',
      eigTempo: 'Enemy speed', eigPlattWeite: 'Platform: horizontal distance (tiles)',
      eigPlattHoehe: 'Platform: vertical distance (tiles)', eigPlattDauer: 'Platform: seconds per round trip',
      eigHinweis: 'Changing the height adds or cuts off tiles at the top; the ground stays at the bottom.',
      neuFrage: 'Unsaved changes will be lost. Really start a new level?',
      neuOk: 'New level',
      listeTitel: 'My levels', listeLeer: 'Nothing saved yet. Use “Save” to keep your level here.',
      loeschFrage: 'Really delete “{n}”?', gespeichert: 'Saved.', geoeffnet: '“{n}” opened.',
      geloescht: 'Deleted.', neuGelegt: 'New level created.',
      testStart: 'The level needs a start (S).', testZiel: 'The level needs a goal (Z).',
      testGeschafft: 'Done – the level is playable!', testGameOver: 'Game over – maybe build it a bit easier?',
      teilenTitel: 'Share level', teilenCode: 'Share code (to pass on)', kopieren: 'Copy', kopiert: 'Copied to the clipboard.',
      kopierenFehler: 'Copying did not work – select the text and copy it by hand.',
      importTitel: 'Paste a code and import it', importieren: 'Import', importOk: 'Level imported.',
      dateiTitel: 'For developers: level file for the game',
      fehlerFormat: 'This is not a valid level code.', fehlerBreite: 'The width must be between {a} and {b} tiles.',
      fehlerHoehe: 'The height must be between {a} and {b} tiles.',
      datumFormat: 'en-GB', kacheln: 'tiles', schlossen: 'Editor closed.'
    }
  };

  const THEMEN = {
    werkstatt: ['Werkstatt', 'Workshop'], holzlager: ['Holzlager', 'Timber store'],
    farbatelier: ['Farbatelier', 'Paint studio'], toepferei: ['Töpferei', 'Pottery'],
    dachboden: ['Dachboden', 'Attic'], metallwerkstatt: ['Metallwerkstatt', 'Metal shop'],
    naehstube: ['Nähstube', 'Sewing room'], elektroniklabor: ['Elektroniklabor', 'Electronics lab']
  };

  // Reihenfolge der Palette
  const PALETTE = ['.', '#', 'B', '?', '!', 'C', '^', 'T', 'o', 'O', 'E', '-', '|', 'K', 'Z', 'S'];
  const ERLAUBT = '.#B?!C^ToOESKZ-|';
  const FESTE_KACHELN = '#B?!C^T';
  const ZOOMSTUFEN = [16, 24, 32, 48];

  const GRENZEN = {
    breite: [20, 300], hoehe: [10, 20], zeit: [30, 999], gegnerTempo: [10, 150],
    plattformWeite: [2, 12], plattformHoehe: [2, 8], plattformDauer: [2, 12]
  };
  const TEST_NUMMER = 99;                // Nummer des Testlevels (nur im Testmodus)
  const SCHLUESSEL_LISTE = 'editor.levels';
  const SCHLUESSEL_ARBEIT = 'editor.arbeit';

  function t(schluessel, werte) {
    const sprache = KW.I18n && KW.I18n.sprache === 'en' ? 'en' : 'de';
    let s = TEXTE[sprache][schluessel];
    if (s === undefined) s = TEXTE.de[schluessel];
    if (s === undefined) s = schluessel;
    if (werte) Object.keys(werte).forEach((k) => { s = s.split('{' + k + '}').join(werte[k]); });
    return s;
  }
  const themaName = (id) => THEMEN[id][KW.I18n && KW.I18n.sprache === 'en' ? 1 : 0];
  const begrenzen = (wert, grenze) => Math.min(grenze[1], Math.max(grenze[0], wert));

  /* ---------- Zustand ---------- */
  let wurzel = null, cv = null, g = null, bereich = null, rolle = null, nameAnzeige = null, status = null;
  let btnUndo = null, btnRedo = null, chips = {}, werkzeugKnoepfe = {};
  let level = null;
  let undoStapel = [], redoStapel = [];
  let aktuell = '#', werkzeug = 'stift';
  let ts = 32, ox = 0, oy = 0, rasterAn = true, dpr = 1;
  let offenId = null, geaendert = false, istOffen = false;
  let zeichnenGeplant = false, arbeitTimer = 0;
  let maus = null;          // laufende Mausaktion
  let hover = null;         // Kachel unter dem Mauszeiger
  let leertaste = false;
  let dialoge = [];
  let toastTimer = 0;

  /* ---------- Level-Modell ---------- */
  function neuesLevel() {
    const breite = 60, hoehe = 12;
    const r = [];
    for (let y = 0; y < hoehe; y++) r.push(new Array(breite).fill('.'));
    r[hoehe - 2].fill('#');
    r[hoehe - 1].fill('#');
    r[hoehe - 3][2] = 'S';
    r[hoehe - 3][breite - 4] = 'Z';
    return {
      name: t('standardName'), thema: 'werkstatt', zeit: 200, gegnerTempo: 40,
      plattformWeite: 5, plattformHoehe: 4, plattformDauer: 4,
      breite, hoehe, raster: r
    };
  }

  /** Spiel-Format: genau das, was KW.Level erwartet (ein Abschnitt als „karte“). */
  function datenAusLevel(l) {
    return {
      name: l.name, thema: l.thema, zeit: l.zeit, gegnerTempo: l.gegnerTempo,
      plattformWeite: l.plattformWeite, plattformHoehe: l.plattformHoehe, plattformDauer: l.plattformDauer,
      hoehe: l.hoehe, karte: l.raster.map((z) => z.join(''))
    };
  }

  /** Streng prüfen und in ein Level umwandeln; wirft bei ungültigen Daten einen Fehler. */
  function levelAusDaten(roh) {
    if (!roh || typeof roh !== 'object') throw new Error(t('fehlerFormat'));
    let karte = roh.karte;
    if (!Array.isArray(karte) && Array.isArray(roh.abschnitte) && roh.abschnitte.length === 1) karte = roh.abschnitte[0];
    if (!Array.isArray(karte) || !karte.length || !karte.every((z) => typeof z === 'string')) throw new Error(t('fehlerFormat'));
    const hoehe = karte.length;
    const breite = Math.max.apply(null, karte.map((z) => z.length));
    if (hoehe < GRENZEN.hoehe[0] || hoehe > GRENZEN.hoehe[1]) throw new Error(t('fehlerHoehe', { a: GRENZEN.hoehe[0], b: GRENZEN.hoehe[1] }));
    if (breite < GRENZEN.breite[0] || breite > GRENZEN.breite[1]) throw new Error(t('fehlerBreite', { a: GRENZEN.breite[0], b: GRENZEN.breite[1] }));
    const zahl = (k, standard) => {
      const n = Number(roh[k]);
      return begrenzen(Number.isFinite(n) ? Math.round(n) : standard, GRENZEN[k]);
    };
    const gesehen = { S: false, Z: false };
    const raster = karte.map((z) => z.padEnd(breite, '.').split('').map((c) => {
      if (!ERLAUBT.includes(c)) return '.';
      if (c === 'S' || c === 'Z') { // nur der erste Start / das erste Ziel zählt
        if (gesehen[c]) return '.';
        gesehen[c] = true;
      }
      return c;
    }));
    return {
      name: String(roh.name === undefined ? '' : roh.name).slice(0, 40) || t('standardName'),
      thema: THEMEN[roh.thema] ? roh.thema : 'werkstatt',
      zeit: zahl('zeit', 200), gegnerTempo: zahl('gegnerTempo', 40),
      plattformWeite: zahl('plattformWeite', 5), plattformHoehe: zahl('plattformHoehe', 4), plattformDauer: zahl('plattformDauer', 4),
      breite, hoehe, raster
    };
  }

  const momentaufnahme = () => JSON.stringify(datenAusLevel(level));

  function merke() {
    undoStapel.push(momentaufnahme());
    if (undoStapel.length > 60) undoStapel.shift();
    redoStapel = [];
    knoepfeAktualisieren();
  }

  function rueckgaengig() {
    if (!undoStapel.length) return;
    redoStapel.push(momentaufnahme());
    level = levelAusDaten(JSON.parse(undoStapel.pop()));
    nachAenderung(true);
  }

  function wiederholen() {
    if (!redoStapel.length) return;
    undoStapel.push(momentaufnahme());
    level = levelAusDaten(JSON.parse(redoStapel.pop()));
    nachAenderung(true);
  }

  function nachAenderung(vollstaendig) {
    geaendert = true;
    if (vollstaendig) { palettenZeichnen(); begrenzeAnsicht(); }
    knoepfeAktualisieren();
    neuzeichnen();
    arbeitSpeichernSpaeter();
  }

  /* ---------- Bearbeiten ---------- */
  /** Setzt eine Kachel; Start und Ziel gibt es nur einmal. Liefert true, wenn sich etwas geändert hat. */
  function setze(tx, ty, zeichen, strich) {
    if (tx < 0 || ty < 0 || tx >= level.breite || ty >= level.hoehe) return false;
    if (level.raster[ty][tx] === zeichen) return false;
    if (strich && !strich.gemerkt) { merke(); strich.gemerkt = true; }
    if (zeichen === 'S' || zeichen === 'Z') {
      for (let y = 0; y < level.hoehe; y++) {
        for (let x = 0; x < level.breite; x++) if (level.raster[y][x] === zeichen) level.raster[y][x] = '.';
      }
    }
    level.raster[ty][tx] = zeichen;
    return true;
  }

  function linie(x0, y0, x1, y1, zeichen, strich) {
    let geaendertHier = false;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let fehler = dx + dy;
    for (;;) {
      if (setze(x0, y0, zeichen, strich)) geaendertHier = true;
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * fehler;
      if (e2 >= dy) { fehler += dy; x0 += sx; }
      if (e2 <= dx) { fehler += dx; y0 += sy; }
    }
    return geaendertHier;
  }

  function rechteckFuellen(a, b, zeichen) {
    const strich = { gemerkt: false };
    if (zeichen === 'S' || zeichen === 'Z') { setze(b.tx, b.ty, zeichen, strich); return strich.gemerkt; }
    const x0 = Math.min(a.tx, b.tx), x1 = Math.max(a.tx, b.tx);
    const y0 = Math.min(a.ty, b.ty), y1 = Math.max(a.ty, b.ty);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setze(x, y, zeichen, strich);
    return strich.gemerkt;
  }

  function fluten(tx, ty, zeichen) {
    if (tx < 0 || ty < 0 || tx >= level.breite || ty >= level.hoehe) return false;
    const ziel = level.raster[ty][tx];
    if (ziel === zeichen) return false;
    const strich = { gemerkt: false };
    if (zeichen === 'S' || zeichen === 'Z') { setze(tx, ty, zeichen, strich); return strich.gemerkt; }
    const stapel = [[tx, ty]];
    while (stapel.length) {
      const p = stapel.pop();
      const x = p[0], y = p[1];
      if (x < 0 || y < 0 || x >= level.breite || y >= level.hoehe || level.raster[y][x] !== ziel) continue;
      setze(x, y, zeichen, strich);
      stapel.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    return strich.gemerkt;
  }

  /** Breite/Höhe ändern: rechts anbauen/abschneiden, oben anbauen/abschneiden (Boden bleibt unten). */
  function groesseAendern(breite, hoehe) {
    if (breite === level.breite && hoehe === level.hoehe) return;
    let r = level.raster.map((z) => z.slice());
    if (hoehe > level.hoehe) {
      for (let i = level.hoehe; i < hoehe; i++) r.unshift(new Array(level.breite).fill('.'));
    } else if (hoehe < level.hoehe) {
      r = r.slice(level.hoehe - hoehe);
    }
    r = r.map((z) => (breite > z.length ? z.concat(new Array(breite - z.length).fill('.')) : z.slice(0, breite)));
    level.raster = r;
    level.breite = breite;
    level.hoehe = hoehe;
  }

  /* ---------- Speichern / Laden ---------- */
  function ladeListe() {
    const l = KW.Speicher.lesen(SCHLUESSEL_LISTE, []);
    return Array.isArray(l) ? l.filter((e) => e && typeof e.id === 'string' && e.daten && typeof e.daten === 'object') : [];
  }

  function speichereListe(liste) { KW.Speicher.schreiben(SCHLUESSEL_LISTE, liste); }

  function arbeitSpeichern() {
    clearTimeout(arbeitTimer);
    if (!level || KW.Speicher.testAktiv()) return;
    KW.Speicher.schreiben(SCHLUESSEL_ARBEIT, { id: offenId, geaendert: geaendert, daten: datenAusLevel(level) });
  }

  function arbeitSpeichernSpaeter() {
    clearTimeout(arbeitTimer);
    arbeitTimer = setTimeout(arbeitSpeichern, 500);
  }

  function levelSpeichern() {
    const liste = ladeListe();
    const eintrag = { id: offenId || ('l' + Date.now().toString(36)), name: level.name, geaendert: Date.now(), daten: datenAusLevel(level) };
    const stelle = liste.findIndex((e) => e.id === eintrag.id);
    if (stelle >= 0) liste[stelle] = eintrag; else liste.unshift(eintrag);
    offenId = eintrag.id;
    speichereListe(liste);
    geaendert = false;
    arbeitSpeichern();
    kopfAktualisieren();
    toast(t('gespeichert'));
  }

  function levelLaden(daten, id, meldung) {
    level = levelAusDaten(daten);
    offenId = id || null;
    undoStapel = []; redoStapel = [];
    geaendert = false;
    ox = 0; oy = 0;
    palettenZeichnen();
    begrenzeAnsicht();
    knoepfeAktualisieren();
    kopfAktualisieren();
    neuzeichnen();
    arbeitSpeichern();
    if (meldung) toast(meldung);
  }

  /* ---------- Kleine Hilfen für die Oberfläche ---------- */
  function el(tag, klasse, text, eltern) {
    const e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined && text !== null) e.textContent = text;
    if (eltern) eltern.appendChild(e);
    return e;
  }

  function knopf(text, klasse, beiKlick, eltern) {
    const b = el('button', 'kwe-btn' + (klasse ? ' ' + klasse : ''), text, eltern);
    b.type = 'button';
    b.addEventListener('click', beiKlick);
    return b;
  }

  function toast(text) {
    if (!wurzel) return;
    let e = wurzel.querySelector('.kwe-toast');
    if (!e) e = el('div', 'kwe-toast', '', wurzel);
    e.textContent = text;
    e.classList.add('zu-sehen');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => e.classList.remove('zu-sehen'), 2800);
  }

  /** Einfacher Dialog über dem Editor. knoepfe: [{ text, primaer, aktion }]; aktion darf false liefern, um offen zu bleiben. */
  function dialog(titel, inhalt, knoepfe) {
    const wand = el('div', 'kwe-wand', null, wurzel);
    const box = el('div', 'kwe-dialog', null, wand);
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    el('h3', null, titel, box);
    if (inhalt) box.appendChild(inhalt);
    const zeile = el('div', 'kwe-dialogknoepfe', null, box);
    const d = {
      schliessen() {
        if (wand.parentNode) wand.parentNode.removeChild(wand);
        dialoge = dialoge.filter((x) => x !== d);
      }
    };
    (knoepfe || []).forEach((k) => {
      knopf(k.text, k.primaer ? 'primaer' : '', () => {
        if (!k.aktion || k.aktion() !== false) d.schliessen();
      }, zeile);
    });
    dialoge.push(d);
    const erster = box.querySelector('input, select, textarea, button.primaer, button');
    if (erster) setTimeout(() => erster.focus(), 0);
    return d;
  }

  function bestaetigen(frage, okText) {
    return new Promise((resolve) => {
      const p = el('p', null, frage);
      dialog(t('titel'), p, [
        { text: t('abbrechen'), aktion: () => resolve(false) },
        { text: okText || t('ja'), primaer: true, aktion: () => resolve(true) }
      ]);
    });
  }

  function kopieren(textfeld) {
    textfeld.focus();
    textfeld.select();
    let ok = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textfeld.value).then(() => toast(t('kopiert')), () => toast(t('kopierenFehler')));
        return;
      }
      ok = document.execCommand('copy');
    } catch (e) { ok = false; }
    toast(ok ? t('kopiert') : t('kopierenFehler'));
  }

  /* ---------- Zeichnen ---------- */
  function neuzeichnen() {
    if (zeichnenGeplant || !istOffen) return;
    zeichnenGeplant = true;
    requestAnimationFrame(zeichnen);
  }

  /**
   * Eine Kachel (oder ein Objekt) in Spielkoordinaten zeichnen.
   * Der Ursprung (0, 0) ist die linke obere Ecke der Kachel; f ist der Zoomfaktor.
   * vorschau = true: ohne Streckenanzeige (für die Palette).
   */
  function zelle(c, satz, th, k, x, y, f, tx, ty, vorschau) {
    c.save();
    c.translate(x, y);
    c.scale(f, f);
    switch (k) {
      case '#':
        c.drawImage(ty === 0 || level.raster[ty - 1][tx] !== '#' ? satz.bodenOben : satz.boden, 0, 0);
        break;
      case 'B': c.drawImage(satz.ziegel, 0, 0); break;
      case '?': c.drawImage(satz.frage[0], 0, 0); break;
      case '!':
        c.drawImage(satz.frage[0], 0, 0);
        c.font = 'bold 11px sans-serif';
        c.textAlign = 'center';
        c.lineWidth = 3;
        c.strokeStyle = '#000';
        c.strokeText('2×', T - 9, T - 4);
        c.fillStyle = '#fff';
        c.fillText('2×', T - 9, T - 4);
        break;
      case '^': c.drawImage(satz.stachel, 0, 0); break;
      case 'T': c.drawImage(satz.trampolin[0], 0, 0); break;
      case 'C': c.drawImage(satz.broesel, 0, 0); break;
      case 'o': case 'O': {
        const b = KW.Grafik.muenzBild(k === 'O');
        c.drawImage(b, Math.round(T / 2 - b.width / 2), Math.round(T / 2 - b.height / 2));
        break;
      }
      case 'E': c.drawImage(KW.Grafik.gegnerBild(th.gegner, 0), 4, 12); break;
      case 'S': c.drawImage(KW.Grafik.spielerBild('stehen', false, KW.Konto.aktiverSkin()), 4, 0); break;
      case 'K': KW.Grafik.zeichneCheckpoint(c, 0, 0, false, 0); break;
      case 'Z': KW.Grafik.zeichneTuer(c, 0, -T); break;
      case '-': {
        if (!vorschau) {
          const weite = level.plattformWeite * T;
          c.fillStyle = 'rgba(255,255,255,0.28)';
          c.fillRect(0, 6, weite + 3 * T, 2);
          c.globalAlpha = 0.35;
          c.drawImage(satz.plattform, weite, 0);
          c.globalAlpha = 1;
        }
        c.drawImage(satz.plattform, 0, 0);
        break;
      }
      case '|': {
        if (!vorschau) {
          const hoch = level.plattformHoehe * T;
          c.fillStyle = 'rgba(255,255,255,0.28)';
          c.fillRect(T * 1.5 - 1, -hoch, 2, hoch);
          c.globalAlpha = 0.35;
          c.drawImage(satz.plattform, 0, -hoch);
          c.globalAlpha = 1;
        }
        c.drawImage(satz.plattform, 0, 0);
        break;
      }
      default: break;
    }
    c.restore();
  }

  function zeichnen() {
    zeichnenGeplant = false;
    if (!istOffen || !level || !cv.width) return;
    const th = KW.THEMEN[level.thema] || KW.THEMEN.werkstatt;
    const satz = KW.Grafik.kachelSatz(th);
    const px = ts * dpr;
    const sx = Math.round(ox * dpr), sy = Math.round(oy * dpr);
    const f = px / T;

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    g.globalAlpha = 1;
    g.fillStyle = '#120c08';
    g.fillRect(0, 0, cv.width, cv.height);

    // Spielfeld mit dem Himmelsverlauf des Themas
    const lx = -sx, ly = -sy, lw = level.breite * px, lh = level.hoehe * px;
    const verlauf = g.createLinearGradient(0, ly, 0, ly + lh);
    verlauf.addColorStop(0, th.himmelOben);
    verlauf.addColorStop(1, th.himmelUnten);
    g.fillStyle = verlauf;
    g.fillRect(lx, ly, lw, lh);

    const x0 = Math.max(0, Math.floor(sx / px)), x1 = Math.min(level.breite - 1, Math.floor((sx + cv.width) / px));
    const y0 = Math.max(0, Math.floor(sy / px)), y1 = Math.min(level.hoehe - 1, Math.floor((sy + cv.height) / px));

    // Zuerst feste Kacheln, dann Objekte (hohe Objekte ragen in die Kachel darüber)
    for (let durchgang = 0; durchgang < 2; durchgang++) {
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const k = level.raster[ty][tx];
          if (k === '.') continue;
          if ((FESTE_KACHELN.indexOf(k) >= 0) !== (durchgang === 0)) continue;
          zelle(g, satz, th, k, tx * px - sx, ty * px - sy, f, tx, ty, false);
        }
      }
    }

    // Raster, Spaltenlineal und Rand
    if (rasterAn && ts >= 24) {
      g.strokeStyle = 'rgba(255,255,255,0.10)';
      g.lineWidth = 1;
      g.beginPath();
      for (let tx = x0; tx <= x1 + 1; tx++) { const x = Math.round(tx * px - sx) + 0.5; g.moveTo(x, Math.max(0, ly)); g.lineTo(x, Math.min(cv.height, ly + lh)); }
      for (let ty = y0; ty <= y1 + 1; ty++) { const y = Math.round(ty * px - sy) + 0.5; g.moveTo(Math.max(0, lx), y); g.lineTo(Math.min(cv.width, lx + lw), y); }
      g.stroke();
    }
    if (px >= 16 * dpr) {
      g.font = Math.round(10 * dpr) + 'px sans-serif';
      g.textAlign = 'left';
      for (let tx = Math.max(10, Math.ceil(x0 / 10) * 10); tx <= x1; tx += 10) {
        const x = Math.round(tx * px - sx);
        g.fillStyle = 'rgba(255,255,255,0.18)';
        g.fillRect(x, Math.max(0, ly), Math.max(1, dpr), Math.min(cv.height, lh));
        g.fillStyle = 'rgba(255,255,255,0.7)';
        g.fillText(String(tx), x + 3 * dpr, Math.max(0, ly) + 11 * dpr);
      }
    }
    g.strokeStyle = 'rgba(255,210,63,0.8)';
    g.lineWidth = 2 * dpr;
    g.strokeRect(lx, ly, lw, lh);

    // Vorschau der Mausaktion
    if (maus && maus.art === 'rechteck' && hover) {
      const ax = Math.min(maus.start.tx, hover.tx), bx = Math.max(maus.start.tx, hover.tx);
      const ay = Math.min(maus.start.ty, hover.ty), by = Math.max(maus.start.ty, hover.ty);
      g.fillStyle = 'rgba(255,255,255,0.18)';
      g.fillRect(ax * px - sx, ay * px - sy, (bx - ax + 1) * px, (by - ay + 1) * px);
      g.strokeStyle = '#fff';
      g.lineWidth = 2 * dpr;
      g.strokeRect(ax * px - sx, ay * px - sy, (bx - ax + 1) * px, (by - ay + 1) * px);
    } else if (hover && werkzeug !== 'hand' && hover.tx >= 0 && hover.ty >= 0 && hover.tx < level.breite && hover.ty < level.hoehe) {
      g.strokeStyle = '#fff';
      g.lineWidth = 2 * dpr;
      g.strokeRect(hover.tx * px - sx + dpr, hover.ty * px - sy + dpr, px - 2 * dpr, px - 2 * dpr);
    }
  }

  function chipZeichnen(canvas, k) {
    const c = canvas.getContext('2d');
    const s = canvas.width;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, s, s);
    c.imageSmoothingEnabled = false;
    if (k === '.') { // Radierer: Schachbrett mit rotem Kreuz
      const n = 4, q = s / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { c.fillStyle = (x + y) % 2 ? '#4a3a30' : '#6a574a'; c.fillRect(x * q, y * q, q, q); }
      c.strokeStyle = '#ff6b6b';
      c.lineWidth = Math.max(2, s / 10);
      c.beginPath(); c.moveTo(s * 0.2, s * 0.2); c.lineTo(s * 0.8, s * 0.8); c.moveTo(s * 0.8, s * 0.2); c.lineTo(s * 0.2, s * 0.8); c.stroke();
      return;
    }
    const th = KW.THEMEN[level.thema] || KW.THEMEN.werkstatt;
    const satz = KW.Grafik.kachelSatz(th);
    // Himmel hinter durchsichtigen Symbolen
    const v = c.createLinearGradient(0, 0, 0, s);
    v.addColorStop(0, th.himmelOben); v.addColorStop(1, th.himmelUnten);
    c.fillStyle = v;
    c.fillRect(0, 0, s, s);
    let f = s / T, x = 0, y = 0;
    if (k === 'Z') { f = s / 84; x = (s - T * f) / 2; y = (T + 18) * f; }
    else if (k === 'K') { f = s / 66; x = (s - T * f) / 2; y = 32 * f; }
    else if (k === '-' || k === '|') { f = s / (3 * T); y = (s - 14 * f) / 2; }
    else if (k === 'S') { f = s / 40; x = (s - 24 * f) / 2 - 4 * f; y = 2 * f; }
    zelle(c, satz, th, k, x, y, f, 0, 0, true);
    if (k === '-' || k === '|') {
      // Doppelpfeil als Hinweis auf die Bewegungsrichtung
      const a = s * 0.16, mx = s / 2, my = s * 0.28, l = s * 0.3;
      const pfeil = (c2) => {
        c2.beginPath();
        if (k === '-') {
          c2.moveTo(mx - l, my); c2.lineTo(mx + l, my);
          c2.moveTo(mx - l, my); c2.lineTo(mx - l + a, my - a); c2.moveTo(mx - l, my); c2.lineTo(mx - l + a, my + a);
          c2.moveTo(mx + l, my); c2.lineTo(mx + l - a, my - a); c2.moveTo(mx + l, my); c2.lineTo(mx + l - a, my + a);
        } else {
          c2.moveTo(mx, my - l * 0.7); c2.lineTo(mx, my + l * 0.7);
          c2.moveTo(mx, my - l * 0.7); c2.lineTo(mx - a, my - l * 0.7 + a); c2.moveTo(mx, my - l * 0.7); c2.lineTo(mx + a, my - l * 0.7 + a);
          c2.moveTo(mx, my + l * 0.7); c2.lineTo(mx - a, my + l * 0.7 - a); c2.moveTo(mx, my + l * 0.7); c2.lineTo(mx + a, my + l * 0.7 - a);
        }
        c2.stroke();
      };
      c.lineCap = 'round';
      c.strokeStyle = '#000'; c.lineWidth = s * 0.1; pfeil(c);
      c.strokeStyle = '#fff'; c.lineWidth = s * 0.05; pfeil(c);
    }
  }

  function palettenZeichnen() {
    PALETTE.forEach((k) => { if (chips[k]) chipZeichnen(chips[k].querySelector('canvas'), k); });
  }

  /* ---------- Ansicht (Scrollen, Zoom) ---------- */
  function ansichtGroesse() {
    return { b: bereich.clientWidth, h: bereich.clientHeight };
  }

  function begrenzeAnsicht() {
    if (!level) return;
    const a = ansichtGroesse();
    const maxX = Math.max(0, level.breite * ts - a.b), maxY = Math.max(0, level.hoehe * ts - a.h);
    ox = Math.min(maxX, Math.max(0, ox));
    oy = Math.min(maxY, Math.max(0, oy));
    rolle.max = String(Math.round(maxX));
    rolle.value = String(Math.round(ox));
    rolle.disabled = maxX <= 0;
  }

  function groesseAnpassen() {
    if (!istOffen) return;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    const a = ansichtGroesse();
    const b = Math.max(1, Math.round(a.b * dpr)), h = Math.max(1, Math.round(a.h * dpr));
    if (cv.width !== b || cv.height !== h) { cv.width = b; cv.height = h; }
    begrenzeAnsicht();
    neuzeichnen();
  }

  function zoomen(richtung) {
    const i = ZOOMSTUFEN.indexOf(ts);
    const neu = ZOOMSTUFEN[Math.min(ZOOMSTUFEN.length - 1, Math.max(0, i + richtung))];
    if (neu === ts) return;
    const a = ansichtGroesse();
    const faktor = neu / ts;
    ox = (ox + a.b / 2) * faktor - a.b / 2;
    oy = (oy + a.h / 2) * faktor - a.h / 2;
    ts = neu;
    begrenzeAnsicht();
    neuzeichnen();
  }

  /* ---------- Maus und Touch ---------- */
  function kachelBei(e) {
    const r = cv.getBoundingClientRect();
    return {
      tx: Math.floor((e.clientX - r.left + ox) / ts),
      ty: Math.floor((e.clientY - r.top + oy) / ts)
    };
  }

  function statusAktualisieren() {
    if (!status || !level) return;
    const ort = hover && hover.tx >= 0 && hover.ty >= 0 && hover.tx < level.breite && hover.ty < level.hoehe
      ? 'x ' + (hover.tx + 1) + ' · y ' + (level.hoehe - hover.ty) + '   ' : '';
    status.textContent = ort + level.breite + ' × ' + level.hoehe + ' ' + t('kacheln');
  }

  function beiMausDruecken(e) {
    if (!level) return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* egal */ }
    const verschieben = e.button === 1 || e.button === 2 || werkzeug === 'hand' || leertaste;
    if (verschieben) {
      maus = { art: 'schieben', x: e.clientX, y: e.clientY, ox: ox, oy: oy };
      cv.style.cursor = 'grabbing';
      return;
    }
    if (e.button !== 0) return;
    const p = kachelBei(e);
    hover = p;
    if (werkzeug === 'stift') {
      maus = { art: 'stift', last: p, strich: { gemerkt: false } };
      if (setze(p.tx, p.ty, aktuell, maus.strich)) nachAenderung(false);
    } else if (werkzeug === 'rechteck') {
      maus = { art: 'rechteck', start: p };
    } else if (werkzeug === 'fuellen') {
      if (fluten(p.tx, p.ty, aktuell)) nachAenderung(false);
    }
    neuzeichnen();
  }

  function beiMausBewegen(e) {
    if (!level) return;
    const p = kachelBei(e);
    hover = p;
    if (maus && maus.art === 'schieben') {
      ox = maus.ox - (e.clientX - maus.x);
      oy = maus.oy - (e.clientY - maus.y);
      begrenzeAnsicht();
    } else if (maus && maus.art === 'stift') {
      if (linie(maus.last.tx, maus.last.ty, p.tx, p.ty, aktuell, maus.strich)) nachAenderung(false);
      maus.last = p;
    }
    statusAktualisieren();
    neuzeichnen();
  }

  function beiMausLoslassen(e) {
    if (!maus) return;
    if (maus.art === 'rechteck') {
      const p = kachelBei(e);
      if (rechteckFuellen(maus.start, p, aktuell)) nachAenderung(false);
    }
    maus = null;
    cv.style.cursor = '';
    neuzeichnen();
  }

  function beiRad(e) {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) { zoomen(e.deltaY < 0 ? 1 : -1); return; }
    if (e.shiftKey) oy += e.deltaY; else ox += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY);
    begrenzeAnsicht();
    neuzeichnen();
  }

  /* ---------- Tastatur ---------- */
  function beiTaste(e) {
    if (!istOffen) return;
    const ziel = e.target && e.target.tagName;
    const tippen = ziel === 'INPUT' || ziel === 'SELECT' || ziel === 'TEXTAREA';
    // Das Spiel darunter soll auf Esc/P nicht reagieren, solange der Editor offen ist
    if ((e.code === 'Escape' || e.code === 'KeyP') && !tippen) {
      e.stopImmediatePropagation();
      if (e.code === 'Escape' && dialoge.length) { e.preventDefault(); dialoge[dialoge.length - 1].schliessen(); }
      return;
    }
    if (e.code === 'Escape' && tippen && dialoge.length) { e.stopImmediatePropagation(); dialoge[dialoge.length - 1].schliessen(); return; }
    if (tippen || dialoge.length) return;
    if (e.code === 'Space') { leertaste = true; e.preventDefault(); return; }
    const strg = e.ctrlKey || e.metaKey;
    if (strg && e.code === 'KeyZ') { e.preventDefault(); if (e.shiftKey) wiederholen(); else rueckgaengig(); return; }
    if (strg && e.code === 'KeyY') { e.preventDefault(); wiederholen(); return; }
    if (strg && e.code === 'KeyS') { e.preventDefault(); levelSpeichern(); return; }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      e.preventDefault();
      ox += (e.code === 'ArrowLeft' ? -1 : 1) * ts * 2;
      begrenzeAnsicht();
      neuzeichnen();
      return;
    }
    if (!strg && /^(Digit|Numpad)[0-9]$/.test(e.code)) {
      const n = Number(e.code.slice(-1));
      const k = PALETTE[n === 0 ? 9 : n - 1];
      if (k) palettenWahl(k);
    }
  }

  function beiTasteLos(e) { if (e.code === 'Space') leertaste = false; }

  /* ---------- Oberfläche: Werkzeuge, Palette, Knöpfe ---------- */
  function palettenWahl(k) {
    aktuell = k;
    if (werkzeug === 'hand') werkzeugWahl('stift');
    PALETTE.forEach((z) => chips[z] && chips[z].classList.toggle('aktiv', z === k));
  }

  function werkzeugWahl(w) {
    werkzeug = w;
    Object.keys(werkzeugKnoepfe).forEach((n) => werkzeugKnoepfe[n].classList.toggle('aktiv', n === w));
    cv.style.cursor = w === 'hand' ? 'grab' : '';
    neuzeichnen();
  }

  function knoepfeAktualisieren() {
    if (!btnUndo) return;
    btnUndo.disabled = !undoStapel.length;
    btnRedo.disabled = !redoStapel.length;
  }

  function kopfAktualisieren() {
    if (nameAnzeige && level) nameAnzeige.textContent = level.name + (geaendert ? ' *' : '');
  }

  function beschriftungen() {
    if (!wurzel) return;
    wurzel.querySelectorAll('[data-t]').forEach((e) => { e.textContent = t(e.dataset.t); });
    wurzel.querySelectorAll('[data-ttitel]').forEach((e) => { e.title = t(e.dataset.ttitel); e.setAttribute('aria-label', t(e.dataset.ttitel)); });
    PALETTE.forEach((k) => { if (chips[k]) { chips[k].title = t('k.' + k); chips[k].setAttribute('aria-label', t('k.' + k)); } });
    if (status) statusAktualisieren();
  }

  function aufbauen() {
    const css = el('style', null, [
      '.kwe{position:fixed;inset:0;z-index:2000;display:none;flex-direction:column;background:#1a110c;color:#f4e9dc;font:14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif}',
      '.kwe.offen{display:flex}',
      '.kwe button,.kwe select,.kwe input,.kwe textarea{font:inherit}',
      '.kwe-kopf{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 8px;background:#2b1d14;border-bottom:2px solid #000}',
      '.kwe-kopf strong{color:#ffd23f}',
      '.kwe-name{opacity:.85;margin-right:auto;max-width:28ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.kwe-btn{padding:6px 10px;border:2px solid #000;border-radius:6px;background:#5a4a40;color:#fff;cursor:pointer;box-shadow:0 2px 0 #000}',
      '.kwe-btn:hover:not(:disabled){filter:brightness(1.15)}',
      '.kwe-btn:disabled{opacity:.4;cursor:default}',
      '.kwe-btn.primaer{background:#d9731f}',
      '.kwe-btn.aktiv{outline:3px solid #ffd23f}',
      '.kwe-leiste{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 8px;background:#241811;border-bottom:2px solid #000}',
      '.kwe-trenner{flex:none;width:2px;align-self:stretch;background:#000;margin:0 4px}',
      '.kwe-chip{flex:none;width:44px;height:44px;padding:0;border:2px solid #000;border-radius:6px;background:#3a2a1f;cursor:pointer;display:flex;align-items:center;justify-content:center}',
      '.kwe-chip canvas{width:38px;height:38px;image-rendering:pixelated;border-radius:3px}',
      '.kwe-chip.aktiv{outline:3px solid #ffd23f}',
      '.kwe-bereich{flex:1;min-height:0;position:relative;background:#120c08}',
      '.kwe-bereich canvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}',
      '.kwe-fuss{display:flex;gap:10px;align-items:center;padding:4px 8px;background:#2b1d14;border-top:2px solid #000;font-size:12px;flex-wrap:wrap}',
      '.kwe-fuss input[type=range]{flex:1;min-width:120px}',
      '.kwe-fuss label{display:flex;gap:4px;align-items:center}',
      '.kwe-status{opacity:.85;white-space:nowrap}',
      '.kwe-hinweis{opacity:.65;font-size:11px;flex-basis:100%}',
      '.kwe-wand{position:absolute;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:12px;z-index:5}',
      '.kwe-dialog{background:#2b1d14;border:3px solid #000;border-radius:8px;padding:14px 16px;max-width:560px;width:100%;max-height:100%;overflow:auto;box-shadow:0 6px 0 #000}',
      '.kwe-dialog h3{margin:0 0 10px;color:#ffd23f;font-size:18px}',
      '.kwe-dialog p{margin:0 0 8px}',
      '.kwe-dialogknoepfe{display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap}',
      '.kwe-feld{display:grid;grid-template-columns:1fr 130px;gap:6px 10px;align-items:center;margin-bottom:6px}',
      '.kwe-feld input,.kwe-feld select{padding:5px 6px;border:2px solid #000;border-radius:5px;background:#f4e9dc;color:#1a110c;width:100%;box-sizing:border-box}',
      '.kwe-feld input.breit{grid-column:1/-1}',
      '.kwe-text{width:100%;box-sizing:border-box;min-height:90px;padding:6px;border:2px solid #000;border-radius:5px;background:#f4e9dc;color:#1a110c;font:12px/1.35 ui-monospace,Menlo,Consolas,monospace;resize:vertical}',
      '.kwe-liste{display:flex;flex-direction:column;gap:6px}',
      '.kwe-eintrag{display:flex;gap:8px;align-items:center;background:#3a2a1f;border-radius:6px;padding:6px 8px}',
      '.kwe-eintrag span{flex:1;min-width:0}',
      '.kwe-eintrag small{display:block;opacity:.7}',
      '.kwe-fehler{color:#ff8a8a;min-height:1.2em}',
      '.kwe-toast{position:absolute;left:50%;bottom:56px;transform:translateX(-50%);background:#000c;color:#fff;padding:8px 14px;border-radius:20px;opacity:0;pointer-events:none;transition:opacity .2s;max-width:90%;text-align:center;z-index:6}',
      '.kwe-toast.zu-sehen{opacity:1}'
    ].join('\n'));
    document.head.appendChild(css);

    wurzel = el('div', 'kwe', null, document.body);
    wurzel.setAttribute('role', 'application');

    // Kopfzeile
    const kopf = el('div', 'kwe-kopf', null, wurzel);
    const titel = el('strong', null, null, kopf);
    titel.dataset.t = 'titel';
    nameAnzeige = el('span', 'kwe-name', '', kopf);
    const mk = (schluessel, klasse, fn) => { const b = knopf('', klasse, fn, kopf); b.dataset.t = schluessel; return b; };
    mk('neu', '', beiNeu);
    mk('oeffnen', '', beiOeffnen);
    mk('speichern', '', () => levelSpeichern());
    btnUndo = mk('rueckgaengig', '', rueckgaengig);
    btnRedo = mk('wiederholen', '', wiederholen);
    mk('eigenschaften', '', beiEigenschaften);
    mk('teilen', '', beiTeilen);
    mk('testen', 'primaer', testen);
    mk('schliessen', '', schliessen);

    // Werkzeuge und Palette
    const leiste = el('div', 'kwe-leiste', null, wurzel);
    [['stift', 'stift'], ['rechteck', 'rechteck'], ['fuellen', 'fuellen'], ['hand', 'hand']].forEach((paar) => {
      const b = knopf('', '', () => werkzeugWahl(paar[0]), leiste);
      b.dataset.t = paar[1];
      werkzeugKnoepfe[paar[0]] = b;
    });
    el('div', 'kwe-trenner', null, leiste);
    PALETTE.forEach((k, i) => {
      const b = el('button', 'kwe-chip', null, leiste);
      b.type = 'button';
      const c = el('canvas', null, null, b);
      c.width = 76; c.height = 76;
      b.addEventListener('click', () => palettenWahl(k));
      chips[k] = b;
      void i;
    });

    // Zeichenfläche
    bereich = el('div', 'kwe-bereich', null, wurzel);
    cv = el('canvas', null, null, bereich);
    g = cv.getContext('2d');
    cv.addEventListener('pointerdown', beiMausDruecken);
    cv.addEventListener('pointermove', beiMausBewegen);
    cv.addEventListener('pointerup', beiMausLoslassen);
    cv.addEventListener('pointercancel', beiMausLoslassen);
    cv.addEventListener('pointerleave', () => { if (!maus) { hover = null; statusAktualisieren(); neuzeichnen(); } });
    cv.addEventListener('wheel', beiRad, { passive: false });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());

    // Fußzeile
    const fuss = el('div', 'kwe-fuss', null, wurzel);
    rolle = el('input', null, null, fuss);
    rolle.type = 'range';
    rolle.min = '0'; rolle.max = '0'; rolle.value = '0';
    rolle.addEventListener('input', () => { ox = Number(rolle.value); begrenzeAnsicht(); neuzeichnen(); });
    const minus = knopf('−', '', () => zoomen(-1), fuss); minus.dataset.ttitel = 'zoomMinus';
    const plus = knopf('+', '', () => zoomen(1), fuss); plus.dataset.ttitel = 'zoomPlus';
    const rasterLabel = el('label', null, null, fuss);
    const haken = el('input', null, null, rasterLabel);
    haken.type = 'checkbox'; haken.checked = rasterAn;
    haken.addEventListener('change', () => { rasterAn = haken.checked; neuzeichnen(); });
    const rasterText = el('span', null, '', rasterLabel); rasterText.dataset.t = 'raster';
    status = el('span', 'kwe-status', '', fuss);
    const tipp = el('div', 'kwe-hinweis', '', fuss); tipp.dataset.t = 'hinweis';

    window.addEventListener('keydown', beiTaste, true);
    window.addEventListener('keyup', beiTasteLos, true);
    window.addEventListener('resize', groesseAnpassen);
    if (window.ResizeObserver) new ResizeObserver(groesseAnpassen).observe(bereich);

    if (window.innerWidth < 700) ts = 24;
    palettenWahl('#');
    werkzeugWahl('stift');
  }

  /* ---------- Menüpunkte ---------- */
  function beiNeu() {
    const los = () => { levelLaden(datenAusLevel(neuesLevel()), null, t('neuGelegt')); };
    if (geaendert) bestaetigen(t('neuFrage'), t('neuOk')).then((ja) => { if (ja) los(); });
    else los();
  }

  function beiOeffnen() {
    const liste = ladeListe();
    const inhalt = el('div', 'kwe-liste');
    if (!liste.length) el('p', null, t('listeLeer'), inhalt);
    liste.forEach((e) => {
      const zeile = el('div', 'kwe-eintrag', null, inhalt);
      const info = el('span', null, null, zeile);
      el('strong', null, String(e.name || '?'), info);
      const breite = Array.isArray(e.daten.karte) && e.daten.karte.length ? Math.max.apply(null, e.daten.karte.map((z) => String(z).length)) : '?';
      const datum = e.geaendert ? new Date(e.geaendert).toLocaleDateString(t('datumFormat')) : '';
      el('small', null, breite + ' × ' + (e.daten.hoehe || '?') + ' · ' + datum, info);
      knopf(t('oeffnen'), 'primaer', () => {
        d.schliessen();
        try { levelLaden(e.daten, e.id, t('geoeffnet', { n: e.name })); } catch (err) { toast(err.message); }
      }, zeile);
      knopf(t('loeschen'), '', () => {
        bestaetigen(t('loeschFrage', { n: e.name }), t('loeschen')).then((ja) => {
          if (!ja) return;
          speichereListe(ladeListe().filter((x) => x.id !== e.id));
          if (offenId === e.id) offenId = null;
          d.schliessen();
          toast(t('geloescht'));
          beiOeffnen();
        });
      }, zeile);
    });
    const d = dialog(t('listeTitel'), inhalt, [{ text: t('schliessenKlein') }]);
  }

  function beiEigenschaften() {
    const form = el('div');
    const feld = el('div', 'kwe-feld', null, form);
    const zeile = (beschriftung, element) => { el('label', null, beschriftung, feld); feld.appendChild(element); return element; };
    const zahlFeld = (schluessel, wert) => {
      const i = el('input');
      i.type = 'number';
      i.min = GRENZEN[schluessel][0]; i.max = GRENZEN[schluessel][1]; i.step = '1';
      i.value = wert;
      return i;
    };
    const name = el('input'); name.type = 'text'; name.maxLength = 40; name.value = level.name;
    zeile(t('eigName'), name);
    const thema = el('select');
    Object.keys(THEMEN).forEach((id) => { const o = el('option', null, themaName(id), thema); o.value = id; });
    thema.value = level.thema;
    zeile(t('eigThema'), thema);
    const zeit = zeile(t('eigZeit'), zahlFeld('zeit', level.zeit));
    const breite = zeile(t('eigBreite'), zahlFeld('breite', level.breite));
    const hoehe = zeile(t('eigHoehe'), zahlFeld('hoehe', level.hoehe));
    const tempo = zeile(t('eigTempo'), zahlFeld('gegnerTempo', level.gegnerTempo));
    const pw = zeile(t('eigPlattWeite'), zahlFeld('plattformWeite', level.plattformWeite));
    const ph = zeile(t('eigPlattHoehe'), zahlFeld('plattformHoehe', level.plattformHoehe));
    const pd = zeile(t('eigPlattDauer'), zahlFeld('plattformDauer', level.plattformDauer));
    el('p', null, t('eigHinweis'), form).style.opacity = '.7';
    dialog(t('eigenschaften'), form, [
      { text: t('abbrechen') },
      {
        text: t('ok'), primaer: true, aktion: () => {
          const z = (feldEl, schluessel, alt) => {
            const n = Math.round(Number(feldEl.value));
            return begrenzen(Number.isFinite(n) && feldEl.value !== '' ? n : alt, GRENZEN[schluessel]);
          };
          merke();
          level.name = name.value.trim().slice(0, 40) || t('standardName');
          level.thema = thema.value;
          level.zeit = z(zeit, 'zeit', level.zeit);
          level.gegnerTempo = z(tempo, 'gegnerTempo', level.gegnerTempo);
          level.plattformWeite = z(pw, 'plattformWeite', level.plattformWeite);
          level.plattformHoehe = z(ph, 'plattformHoehe', level.plattformHoehe);
          level.plattformDauer = z(pd, 'plattformDauer', level.plattformDauer);
          groesseAendern(z(breite, 'breite', level.breite), z(hoehe, 'hoehe', level.hoehe));
          nachAenderung(true);
          kopfAktualisieren();
          return true;
        }
      }
    ]);
  }

  function levelDatei() {
    const d = datenAusLevel(level);
    const nummer = (KW.LEVELS ? KW.LEVELS.length : 25) + 1;
    const zeilen = d.karte.map((z) => "      '" + z + "'").join(',\n');
    return [
      '/* Level ' + nummer + ': ' + d.name.replace(/\*\//g, '') + ' (mit dem Level-Editor gebaut) */',
      'window.KW_LEVELS = window.KW_LEVELS || [];',
      'window.KW_LEVELS.push({',
      '  nummer: ' + nummer + ',',
      '  name: ' + JSON.stringify(d.name) + ',',
      "  thema: '" + d.thema + "',",
      '  zeit: ' + d.zeit + ',',
      '  gegnerTempo: ' + d.gegnerTempo + ',',
      '  plattformWeite: ' + d.plattformWeite + ',',
      '  plattformHoehe: ' + d.plattformHoehe + ',',
      '  plattformDauer: ' + d.plattformDauer + ',',
      '  hoehe: ' + d.hoehe + ',',
      '  abschnitte: [',
      '    [',
      zeilen,
      '    ]',
      '  ]',
      '});',
      ''
    ].join('\n');
  }

  function beiTeilen() {
    const inhalt = el('div');
    el('p', null, t('teilenCode'), inhalt);
    const code = el('textarea', 'kwe-text', null, inhalt);
    code.readOnly = true;
    code.value = JSON.stringify(datenAusLevel(level));
    code.addEventListener('focus', () => code.select());
    knopf(t('kopieren'), '', () => kopieren(code), inhalt);

    el('p', null, t('importTitel'), inhalt).style.marginTop = '12px';
    const eingabe = el('textarea', 'kwe-text', null, inhalt);
    eingabe.placeholder = '{"name": …}';
    const fehler = el('div', 'kwe-fehler', '', inhalt);
    const importKnopf = knopf(t('importieren'), 'primaer', () => {
      fehler.textContent = '';
      let neu;
      try {
        neu = levelAusDaten(JSON.parse(eingabe.value));
      } catch (err) {
        fehler.textContent = err instanceof SyntaxError ? t('fehlerFormat') : err.message;
        return;
      }
      merke();
      level = neu;
      offenId = null;
      ox = 0; oy = 0;
      nachAenderung(true);
      kopfAktualisieren();
      d.schliessen();
      toast(t('importOk'));
    }, inhalt);
    importKnopf.style.marginTop = '6px';

    el('p', null, t('dateiTitel'), inhalt).style.marginTop = '12px';
    const datei = el('textarea', 'kwe-text', null, inhalt);
    datei.readOnly = true;
    datei.value = levelDatei();
    datei.addEventListener('focus', () => datei.select());
    knopf(t('kopieren'), '', () => kopieren(datei), inhalt);
    const d = dialog(t('teilenTitel'), inhalt, [{ text: t('schliessenKlein') }]);
  }

  /* ---------- Testen ---------- */
  function pruefeSpielbar() {
    let start = 0, ziel = 0;
    level.raster.forEach((z) => z.forEach((k) => { if (k === 'S') start++; if (k === 'Z') ziel++; }));
    if (!start) return t('testStart');
    if (!ziel) return t('testZiel');
    return null;
  }

  function testen() {
    const problem = pruefeSpielbar();
    if (problem) { toast(problem); return; }
    arbeitSpeichern();           // vor dem Testmodus sichern: danach gehen Schreibzugriffe nur in den Zwischenspeicher
    const daten = datenAusLevel(level);
    daten.nummer = TEST_NUMMER;
    istOffen = false;
    wurzel.classList.remove('offen');
    KW.Spiel.editorTestStarten(daten, (ergebnis) => {
      oeffnen();
      if (ergebnis === 'geschafft') toast(t('testGeschafft'));
      else if (ergebnis === 'gameover') toast(t('testGameOver'));
    });
  }

  /* ---------- Öffnen und Schließen ---------- */
  function oeffnen() {
    if (!wurzel) aufbauen();
    if (!level) {
      const arbeit = KW.Speicher.lesen(SCHLUESSEL_ARBEIT, null);
      try {
        if (arbeit && arbeit.daten) {
          level = levelAusDaten(arbeit.daten);
          offenId = typeof arbeit.id === 'string' ? arbeit.id : null;
          geaendert = !!arbeit.geaendert;
        } else {
          level = neuesLevel();
        }
      } catch (err) {
        level = neuesLevel();
        offenId = null;
      }
      undoStapel = []; redoStapel = [];
    }
    istOffen = true;
    wurzel.classList.add('offen');
    beschriftungen();
    palettenZeichnen();
    kopfAktualisieren();
    knoepfeAktualisieren();
    groesseAnpassen();
    statusAktualisieren();
    neuzeichnen();
  }

  function schliessen() {
    arbeitSpeichern();
    istOffen = false;
    dialoge.slice().forEach((d) => d.schliessen());
    if (wurzel) wurzel.classList.remove('offen');
  }

  KW.Editor = { oeffnen, schliessen, beschriftungen };
})();
