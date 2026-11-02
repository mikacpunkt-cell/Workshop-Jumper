/* =========================================================
   game.js – Spielschleife, Zustände, Punkte, Kamera
   Die Physik läuft mit fester Schrittweite (1/120 s) über einen
   Zeit-Akkumulator; gezeichnet wird mit requestAnimationFrame.
   So bleibt das Spiel auf 60-, 120- oder 144-Hz-Bildschirmen gleich schnell.
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW;
  const T = KW.TILE;
  const BREITE = KW.Grafik.BREITE, HOEHE = KW.Grafik.HOEHE;
  const SCHRITT = 1 / 120;   // feste Physik-Schrittweite in Sekunden
  const MAX_DT = 0.1;        // max. Zeit pro Bild (z. B. nach Tab-Wechsel)
  const START_LEBEN = 3;
  const SPIEL_ZUSTAENDE = ['spielen', 'stirbt', 'geschafft'];

  function ueberlappt(a, x, y, w, h) {
    return a.x < x + w && a.x + a.w > x && a.y < y + h && a.y + a.h > y;
  }

  const Spiel = {
    zustand: 'menue',   // menue | spielen | pause | stirbt | geschafft | ergebnis | gameover
    levelIndex: 0,
    level: null,
    demo: null,
    spieler: null,
    punkte: 0,
    muenzen: 0,
    leben: START_LEBEN,
    zeit: 0,
    checkpoint: null,
    punkteBeiStart: 0,
    muenzenBeiStart: 0,
    muenzenVerbucht: 0, // Münzen dieses Durchgangs, die schon aufs Konto gebucht sind
    zustandTimer: 0,
    kamera: { x: 0, y: 0 },
    laufzeit: 0,
    akku: 0,
    letzteZeit: 0,
    skala: 1,
    fps: 60,

    init() {
      this.canvas = document.getElementById('spiel-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.container = document.getElementById('spiel');

      // Die Spielwelt wird in einen Puffer mit fester Auflösung gezeichnet
      // und dann pixelgenau auf das sichtbare Canvas skaliert.
      this.puffer = KW.Grafik.neueCanvas(BREITE, HOEHE);
      this.pctx = this.puffer.getContext('2d');

      KW.LEVELS = (window.KW_LEVELS || []).slice().sort((a, b) => (a.nummer || 0) - (b.nummer || 0));
      if (!KW.LEVELS.length) throw new Error('Keine Level gefunden – sind die Dateien in levels/ eingebunden?');

      KW.Input.init();
      KW.Input.spielLaeuft = () => SPIEL_ZUSTAENDE.includes(this.zustand);
      KW.Input.beiPause = (code) => this.pauseTaste(code);
      KW.UI.init(this);
      KW.Einstellungen.anwenden();

      this.demo = new KW.Level(KW.LEVELS[0], 0);

      // Audio darf erst nach einer Nutzeraktion starten
      const audioStart = () => KW.Audio.init();
      window.addEventListener('pointerdown', audioStart);
      window.addEventListener('keydown', audioStart);

      // Größe an Fenster anpassen
      window.addEventListener('resize', () => this.groesseAnpassen());
      if (window.ResizeObserver) new ResizeObserver(() => this.groesseAnpassen()).observe(this.container);
      this.groesseAnpassen();

      // Automatisch pausieren, wenn der Tab verlassen wird
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.pausieren(); });
      window.addEventListener('blur', () => this.pausieren());

      this.setzeZustand('menue');
      KW.UI.zeige('menue-start');

      // Entwickler-Werkzeug: index.html?pruefen prüft alle Level automatisch
      if (/[?&]pruefen\b/.test(window.location.search)) {
        const skript = document.createElement('script');
        skript.src = 'werkzeuge/levelpruefer.js';
        skript.onload = () => KW.Pruefer.bericht();
        document.body.appendChild(skript);
      }

      requestAnimationFrame((t) => {
        this.letzteZeit = t;
        requestAnimationFrame((t2) => this.schleife(t2));
      });
    },

    /** Canvas-Auflösung an die angezeigte Größe und Pixeldichte anpassen. */
    groesseAnpassen() {
      const r = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const b = Math.max(320, Math.round(r.width * dpr));
      const h = Math.round(b * HOEHE / BREITE);
      if (this.canvas.width !== b || this.canvas.height !== h) {
        this.canvas.width = b;
        this.canvas.height = h;
      }
      this.skala = b / BREITE;
    },

    setzeZustand(z) {
      this.zustand = z;
      this.container.classList.toggle('laeuft', SPIEL_ZUSTAENDE.includes(z));
    },

    /* ---------- Hauptschleife ---------- */

    schleife(jetzt) {
      let dt = (jetzt - this.letzteZeit) / 1000;
      this.letzteZeit = jetzt;
      if (!(dt > 0)) dt = 0;
      dt = Math.min(dt, MAX_DT);
      this.laufzeit += dt;
      if (dt > 0) this.fps += (1 / dt - this.fps) * 0.05; // geglättete Bildrate

      this.akku += dt;
      while (this.akku >= SCHRITT) {
        this.update(SCHRITT);
        this.akku -= SCHRITT;
      }

      this.zeichnen();
      requestAnimationFrame((t) => this.schleife(t));
    },

    update(dt) {
      switch (this.zustand) {
        case 'menue':
          this.demo.update(dt, null);
          this.demoKamera();
          break;
        case 'spielen':
          this.updateSpielen(dt);
          break;
        case 'stirbt':
          this.level.update(dt, this.spieler);
          this.spieler.updateTod(dt);
          this.zustandTimer -= dt;
          if (this.zustandTimer <= 0) this.nachDemTod();
          break;
        case 'geschafft':
          this.level.update(dt, null);
          this.zustandTimer -= dt;
          this.spieler.alpha = Math.max(0, this.zustandTimer / 1.2);
          if (this.zustandTimer <= 0) this.zeigeErgebnis();
          break;
        default:
          break; // Pause, Ergebnis, Game over: Welt steht still
      }
    },

    updateSpielen(dt) {
      this.zeit -= dt;
      if (this.zeit <= 0) {
        this.zeit = 0;
        this.stirb();
        return;
      }
      this.level.update(dt, this.spieler);
      this.spieler.update(dt, this.level);
      this.pruefeBeruehrungen();
      if (this.zustand === 'spielen' && this.spieler.y > this.level.pixelHoehe + 32) this.stirb();
      this.kameraNachfuehren(dt, false);
    },

    /* ---------- Kamera ---------- */

    kameraNachfuehren(dt, sofort) {
      const s = this.spieler, l = this.level;
      const zielX = s.x + s.w / 2 - BREITE / 2 + s.blick * 32;
      const zielY = s.y + s.h / 2 - HOEHE * 0.55;
      const f = sofort ? 1 : Math.min(1, dt * 5);
      this.kamera.x += (zielX - this.kamera.x) * f;
      this.kamera.y += (zielY - this.kamera.y) * f;
      this.kamera.x = Math.max(0, Math.min(this.kamera.x, Math.max(0, l.pixelBreite - BREITE)));
      this.kamera.y = Math.max(0, Math.min(this.kamera.y, Math.max(0, l.pixelHoehe - HOEHE)));
    },

    /** Im Hauptmenü fährt die Kamera langsam durch Level 1. */
    demoKamera() {
      const weite = Math.max(1, this.demo.pixelBreite - BREITE);
      const p = (this.laufzeit * 25) % (2 * weite);
      this.kamera.x = p < weite ? p : 2 * weite - p;
      this.kamera.y = Math.max(0, this.demo.pixelHoehe - HOEHE);
    },

    /* ---------- Berührungen mit Objekten ---------- */

    pruefeBeruehrungen() {
      const s = this.spieler, l = this.level;

      // Münzen
      for (const m of l.muenzen) {
        if (m.weg) continue;
        const r = m.gross ? 14 : 9;
        if (ueberlappt(s, m.x - r, m.y - r, 2 * r, 2 * r)) {
          m.weg = true;
          this.muenzeEinsammeln(m.gross, m.x, m.y);
        }
      }

      // Power-up: Doppelsprung für 10 Sekunden
      for (const it of l.items) {
        if (!it.weg && ueberlappt(s, it.x, it.y, it.w, it.h)) {
          it.weg = true;
          s.dsZeit = 10;
          s.dsVerbraucht = false;
          KW.Audio.spielen('powerup');
          l.text(it.x + 12, it.y - 6, KW.I18n.t('hud.doubleJump'), '#ffd23f');
        }
      }

      // Gegner: von oben besiegen, sonst Treffer
      for (const g of l.gegner) {
        if (!g.lebendig || !ueberlappt(s, g.x, g.y, g.w, g.h)) continue;
        if (s.vy > 0 && s.y + s.h - g.y < 14) {
          this.gegnerBesiegt(g);
          s.vy = KW.Input.halten('sprung') ? -580 : -380;
          s.y = g.y - s.h;
        } else if (s.unverwundbar <= 0) {
          this.stirb();
          return;
        }
      }

      // Stacheln (Trefferfläche nur im unteren, spitzen Teil der Kachel)
      const x0 = Math.floor(s.x / T), x1 = Math.floor((s.x + s.w) / T);
      const y0 = Math.floor(s.y / T), y1 = Math.floor((s.y + s.h) / T);
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          if (l.kachel(tx, ty) === '^' && ueberlappt(s, tx * T + 4, ty * T + 14, 24, 18)) {
            this.stirb();
            return;
          }
        }
      }

      // Checkpoints (hohe Trefferfläche, damit man nicht darüber springen kann)
      for (const cp of l.checkpoints) {
        if (!cp.aktiv && ueberlappt(s, cp.tx * T, (cp.ty - 5) * T, T, 6 * T)) {
          cp.aktiv = true;
          this.checkpoint = cp;
          KW.Audio.spielen('checkpoint');
          l.text(cp.tx * T + 16, cp.ty * T - 40, KW.I18n.t('hud.checkpoint'), '#7dff8a');
        }
      }

      // Ziel
      const z = l.ziel;
      if (z && ueberlappt(s, z.tx * T + 8, (z.ty - 5) * T, 16, 6 * T)) this.levelGeschafft();
    },

    muenzeEinsammeln(gross, x, y) {
      this.muenzen += gross ? 5 : 1; // große Münze zählt 5 Münzen
      const wert = gross ? 100 : 10;
      this.punkte += wert;
      KW.Audio.spielen(gross ? 'grosseMuenze' : 'muenze');
      if (this.level) this.level.text(x, y - 12, '+' + wert, '#ffd23f');
    },

    gegnerBesiegt(g) {
      g.lebendig = false;
      g.plattZeit = 0.5;
      this.punkte += 50;
      KW.Audio.spielen('stampfen');
      this.level.text(g.x + g.w / 2, g.y - 8, '+50', '#fff');
      this.level.funken(g.x + g.w / 2, g.y + g.h / 2, 8, this.level.thema.gegner.G);
    },

    /* ---------- Leben, Tod, Levelende ---------- */

    stirb() {
      if (this.zustand !== 'spielen') return;
      this.leben -= 1;
      this.spieler.sterben();
      KW.Audio.spielen('treffer');
      this.zustandTimer = 1.6;
      this.setzeZustand('stirbt');
    },

    nachDemTod() {
      if (this.leben <= 0) {
        this.gameOver();
        return;
      }
      // Neustart am letzten Checkpoint (oder am Levelstart)
      const ort = this.checkpoint || this.level.start;
      const pos = KW.Spieler.ausKachel(ort.tx, ort.ty);
      this.spieler.zuruecksetzen(pos.x, pos.y);
      this.spieler.unverwundbar = 1.5;
      this.zeit = this.level.zeitLimit;
      KW.Input.reset();
      this.kameraNachfuehren(0, true);
      this.setzeZustand('spielen');
    },

    gameOver() {
      KW.Speicher.schreiben('lebenWeiter', null);   // nach Game over beginnt ein frischer Durchgang
      this.muenzenVerbuchen();
      const rekord = this.highscoreSpeichern();
      this.setzeZustand('gameover');
      KW.Audio.spielen('gameOver');
      KW.UI.zeigeGameOver(this.punkte, rekord, this.level.nummer);
    },

    levelGeschafft() {
      if (this.zustand !== 'spielen') return;
      this.spieler.vx = 0;
      this.zustandTimer = 1.2;
      KW.Audio.spielen('levelEnde');
      // Level als geschafft merken – das nächste kann jetzt mit Münzen gekauft werden
      KW.Konto.setzeGeschafft(this.level.nummer);
      // Die übrigen Leben gelten für das nächste Level (auch nach einem Umweg übers Menü)
      KW.Speicher.schreiben('lebenWeiter', { level: this.levelIndex + 1, leben: this.leben });
      this.setzeZustand('geschafft');
    },

    zeigeErgebnis() {
      const restzeit = Math.ceil(this.zeit);
      const bonus = restzeit * 5;
      this.punkte += bonus;
      this.zeit = 0;
      const rekord = this.highscoreSpeichern();
      const verdient = this.muenzen - this.muenzenBeiStart;
      this.muenzenVerbuchen();
      this.setzeZustand('ergebnis');
      KW.UI.zeigeGeschafft({
        nummer: this.level.nummer,
        verdient,
        naechstes: this.levelIndex + 1,
        restzeit,
        bonus,
        punkte: this.punkte,
        rekord,
        letztes: this.levelIndex >= KW.LEVELS.length - 1
      });
    },

    /**
     * Gesammelte, noch nicht gebuchte Münzen aufs Konto übertragen.
     * Wird bei jedem Levelende aufgerufen (geschafft, Game over, Neustart,
     * Hauptmenü), damit keine Münzen verloren gehen oder doppelt zählen.
     */
    muenzenVerbuchen() {
      const neu = this.muenzen - this.muenzenVerbucht;
      if (neu > 0) KW.Konto.gutschreiben(neu);
      this.muenzenVerbucht = this.muenzen;
    },

    /** Speichert den Highscore; liefert true bei neuem Rekord. */
    highscoreSpeichern() {
      const alt = KW.Speicher.lesen('highscore', 0);
      if (this.punkte > alt) {
        KW.Speicher.schreiben('highscore', this.punkte);
        return true;
      }
      return false;
    },

    freigeschaltet() {
      return KW.Konto.freigeschaltet();
    },

    /* ---------- Spielablauf / Menüaktionen ---------- */

    neuesSpiel(index) {
      this.punkte = 0;
      this.muenzen = 0;
      this.leben = this.lebenFuerLevel(index);
      this.ladeLevel(index);
    },

    /**
     * Mit wie vielen Leben startet das Level mit diesem Index?
     * Hat man das Level davor geschafft, geht man mit den Leben weiter, die man
     * dabei noch hatte – auch wenn man zwischendurch im Hauptmenü war oder das Level
     * über die Level-Auswahl startet. Sonst (neuer Durchgang, nach Game over) gibt es
     * die vollen START_LEBEN.
     */
    lebenFuerLevel(index) {
      const gemerkt = KW.Speicher.lesen('lebenWeiter', null);
      if (gemerkt && gemerkt.level === index && Number.isInteger(gemerkt.leben)
          && gemerkt.leben >= 1 && gemerkt.leben <= START_LEBEN) {
        return gemerkt.leben;
      }
      return START_LEBEN;
    },

    ladeLevel(index) {
      this.levelIndex = index;
      this.punkteBeiStart = this.punkte;
      this.muenzenBeiStart = this.muenzen;
      this.muenzenVerbucht = this.muenzen;
      this.level = new KW.Level(KW.LEVELS[index], index);
      this.level.spiel = this;
      const pos = KW.Spieler.ausKachel(this.level.start.tx, this.level.start.ty);
      this.spieler = new KW.Spieler(pos.x, pos.y);
      this.checkpoint = null;
      this.zeit = this.level.zeitLimit;
      this.akku = 0;
      KW.Input.reset();
      this.kameraNachfuehren(0, true);
      this.setzeZustand('spielen');
      KW.UI.zeige(null);
    },

    levelNeuStarten() {
      this.muenzenVerbuchen();
      this.punkte = this.punkteBeiStart;
      this.muenzen = this.muenzenBeiStart;
      this.ladeLevel(this.levelIndex);
    },

    naechstesLevel() {
      const naechstes = this.levelIndex + 1;
      if (naechstes < KW.LEVELS.length && KW.Konto.levelStatus(naechstes) === 'frei') this.ladeLevel(naechstes);
      else this.zumHauptmenue();
    },

    zumHauptmenue() {
      if (this.level) this.muenzenVerbuchen();
      this.highscoreSpeichern();
      this.level = null;
      this.spieler = null;
      this.setzeZustand('menue');
      KW.UI.aktualisiereHighscore();
      KW.UI.zeige('menue-start');
    },

    pausieren() {
      if (this.zustand !== 'spielen') return;
      this.setzeZustand('pause');
      KW.Input.reset();
      KW.UI.zeige('menue-pause');
    },

    fortsetzen() {
      if (this.zustand !== 'pause') return;
      KW.Input.reset();
      this.setzeZustand('spielen');
      KW.UI.zeige(null);
    },

    /** P oder Esc gedrückt. */
    pauseTaste(code) {
      if (this.zustand === 'spielen') this.pausieren();
      else if (this.zustand === 'pause' && KW.UI.aktuell !== 'menue-pause') KW.UI.zeige('menue-pause');
      else if (this.zustand === 'pause') this.fortsetzen();
      else if (this.zustand === 'menue' && code === 'Escape' && KW.UI.aktuell !== 'menue-start') {
        KW.UI.zeige('menue-start');
      }
    },

    /* ---------- Zeichnen ---------- */

    zeichnen() {
      const g = this.pctx;
      const l = this.level || this.demo;
      const kx = Math.round(this.kamera.x), ky = Math.round(this.kamera.y);

      g.imageSmoothingEnabled = false;
      KW.Grafik.zeichneHintergrund(g, l.thema, kx, ky, this.laufzeit);
      l.zeichne(g, kx, ky, this.laufzeit);
      if (this.level && this.spieler) this.spieler.zeichne(g, kx, ky, this.laufzeit);
      l.zeichneEffekte(g, kx, ky);

      // Puffer pixelgenau auf das sichtbare Canvas skalieren
      const c = this.ctx;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.imageSmoothingEnabled = KW.Einstellungen.werte.pixel === 'weich';
      c.drawImage(this.puffer, 0, 0, this.canvas.width, this.canvas.height);

      // HUD in voller Auflösung darüber (gestochen scharfe Schrift)
      if (this.level) {
        c.setTransform(this.skala, 0, 0, this.skala, 0, 0);
        KW.UI.zeichneHUD(c, this, kx, ky);
      }
    }
  };

  KW.Spiel = Spiel;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Spiel.init());
  } else {
    Spiel.init();
  }
})();
