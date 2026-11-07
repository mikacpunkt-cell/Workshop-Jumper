/* =========================================================
   player.js – Spielfigur: Laufen, Springen, Schwerkraft
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW;
  const T = KW.TILE;

  // Physik-Werte (Pixel und Sekunden)
  const PHYSIK = {
    laufBeschl: 1500,      // Beschleunigung am Boden
    luftBeschl: 1050,      // Beschleunigung in der Luft
    bremsen: 1900,         // Abbremsen am Boden ohne Eingabe
    luftBremsen: 500,      // Abbremsen in der Luft ohne Eingabe
    maxLauf: 210,          // Höchstgeschwindigkeit
    schwerkraft: 1900,
    sprungKraft: 640,      // ergibt ca. 3,3 Kacheln Sprunghöhe
    doppelSprungKraft: 580,
    abbruchFaktor: 2.6,    // stärkere Schwerkraft, wenn Sprungtaste losgelassen -> variable Sprunghöhe
    maxFall: 820,
    trampolinKraft: 900,   // gehalten ca. 6,5 Kacheln hoch, losgelassen ca. 2,5
    coyoteZeit: 0.09,      // kurz nach Verlassen einer Kante darf noch gesprungen werden
    sprungPuffer: 0.12     // Sprung kurz vor der Landung wird gemerkt
  };

  class Spieler {
    constructor(x, y) {
      this.w = 18;
      this.h = 28;
      this.zuruecksetzen(x, y);
    }

    /** Pixelposition für eine Startkachel (Figur steht auf dem Boden der Kachel). */
    static ausKachel(tx, ty) {
      return { x: tx * T + (T - 18) / 2, y: (ty + 1) * T - 28 };
    }

    zuruecksetzen(x, y) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.amBoden = false;
      this.blick = 1;
      this.coyote = 0;
      this.puffer = 0;
      this.dsZeit = 0;            // verbleibende Doppelsprung-Zeit
      this.dsVerbraucht = false;  // Doppelsprung in diesem Sprung schon genutzt?
      this.unverwundbar = 0;
      this.tot = false;
      this.plattform = null;
      this.mitnahme = 0;          // Schwung einer verlassenen Plattform (px/s)
      this.laufAnim = 0;
      this.alpha = 1;
    }

    update(dt, level) {
      const P = PHYSIK;
      const eingabe = KW.Input;

      if (this.unverwundbar > 0) this.unverwundbar -= dt;
      if (this.dsZeit > 0) this.dsZeit = Math.max(0, this.dsZeit - dt);

      // --- Horizontal ---
      const richtung = (eingabe.halten('rechts') ? 1 : 0) - (eingabe.halten('links') ? 1 : 0);
      if (richtung !== 0) {
        const beschl = this.amBoden ? P.laufBeschl : P.luftBeschl;
        const wenden = Math.sign(this.vx) === -richtung ? 2 : 1; // schneller umdrehen
        this.vx += richtung * beschl * wenden * dt;
        this.blick = richtung;
      } else {
        const brems = (this.amBoden ? P.bremsen : P.luftBremsen) * dt;
        this.vx = Math.abs(this.vx) <= brems ? 0 : this.vx - Math.sign(this.vx) * brems;
      }
      this.vx = Math.max(-P.maxLauf, Math.min(P.maxLauf, this.vx));

      // --- Springen (mit Puffer und Coyote-Zeit) ---
      this.puffer = Math.max(0, this.puffer - dt);
      if (eingabe.nimmFlanke('sprung')) this.puffer = P.sprungPuffer;
      this.coyote = this.amBoden ? P.coyoteZeit : Math.max(0, this.coyote - dt);

      if (this.puffer > 0) {
        if (this.coyote > 0) {
          this.vy = -P.sprungKraft;
          // Beim Absprung von einer Plattform deren Schwung übernehmen
          if (this.plattform) {
            this.mitnahme = this.plattform.dx / dt;
            if (this.plattform.dy < 0) this.vy += this.plattform.dy / dt;
          }
          this.amBoden = false;
          this.coyote = 0;
          this.puffer = 0;
          this.plattform = null;
          KW.Audio.spielen('sprung');
        } else if (this.dsZeit > 0 && !this.dsVerbraucht) {
          this.vy = -P.doppelSprungKraft;
          this.dsVerbraucht = true;
          this.puffer = 0;
          KW.Audio.spielen('doppelsprung');
          level.funken(this.x + this.w / 2, this.y + this.h, 10, '#ffd23f');
        }
      }

      // --- Schwerkraft (variable Sprunghöhe) ---
      const abbruch = this.vy < 0 && !eingabe.halten('sprung');
      this.vy = Math.min(this.vy + P.schwerkraft * (abbruch ? P.abbruchFaktor : 1) * dt, P.maxFall);

      // --- Von beweglicher Plattform mitnehmen ---
      if (this.plattform) {
        const p = this.plattform;
        this.x += p.dx;
        level.kollisionX(this, p.dx);
        this.y += p.dy;
      }

      // --- Bewegung X mit Kollision (inkl. Plattform-Schwung in der Luft) ---
      const dx = (this.vx + this.mitnahme) * dt;
      this.x += dx;
      if (level.kollisionX(this, dx)) { this.vx = 0; this.mitnahme = 0; }

      // --- Bewegung Y mit Kollision ---
      const vorherUnten = this.y + this.h;
      this.amBoden = false;
      const dy = this.vy * dt;
      this.y += dy;
      const r = level.kollisionY(this, dy);
      if (r.unten) {
        this.vy = 0;
        this.amBoden = true;
        this.plattform = null;
      }
      if (r.oben) {
        this.vy = 0;
        level.stossVonUnten(r.kopfX, r.kopfY);
      }

      // --- Bewegliche Plattformen (nur von oben begehbar) ---
      if (!this.amBoden && this.vy >= 0) {
        for (const p of level.plattformen) {
          const vorherOben = p.y - p.dy;
          if (this.x + this.w > p.x && this.x < p.x + p.w &&
              vorherUnten <= vorherOben + 4 && this.y + this.h >= p.y) {
            this.y = p.y - this.h;
            this.vy = 0;
            this.amBoden = true;
            this.plattform = p;
            break;
          }
        }
      }
      if (!this.amBoden && this.plattform) {
        // Von der Plattformkante gelaufen: Schwung behalten
        this.mitnahme = this.plattform.dx / dt;
        this.plattform = null;
      }
      if (this.amBoden) this.mitnahme = 0;

      // --- Landen: Doppelsprung wieder bereit, Bröselplattformen auslösen ---
      if (this.amBoden) {
        this.dsVerbraucht = false;
        if (!this.plattform) {
          const ty = Math.floor((this.y + this.h + 1) / T);
          let trampolinX = -1;
          for (let tx = Math.floor(this.x / T); tx <= Math.floor((this.x + this.w - 0.01) / T); tx++) {
            level.betreten(tx, ty);
            if (level.kachel(tx, ty) === 'T') trampolinX = tx;
          }
          // Trampolin: sofort hochschleudern
          if (trampolinX >= 0) {
            this.vy = -P.trampolinKraft;
            this.amBoden = false;
            this.coyote = 0;
            this.puffer = 0; // verhindert, dass direkt ein Doppelsprung verpufft
            level.trampolinStoss(trampolinX, ty);
            KW.Audio.spielen('trampolin');
            if (KW.Erfolge) KW.Erfolge.ereignis('trampolin');
          }
        }
      }

      // --- Animation ---
      if (this.amBoden && Math.abs(this.vx) > 10) this.laufAnim += Math.abs(this.vx) * dt;
      else if (this.amBoden) this.laufAnim = 0;

      // Funken während des Power-ups
      if (this.dsZeit > 0 && Math.random() < dt * 12) {
        level.funken(this.x + Math.random() * this.w, this.y + Math.random() * this.h, 1, '#ffd23f');
      }
    }

    /** Sterbe-Animation starten: kurz hochhüpfen und aus dem Bild fallen. */
    sterben() {
      this.tot = true;
      this.vx = 0;
      this.vy = -480;
      this.dsZeit = 0;
    }

    updateTod(dt) {
      this.vy = Math.min(this.vy + 1500 * dt, 900);
      this.y += this.vy * dt;
    }

    aktuellesBild() {
      if (this.tot || !this.amBoden) return 'sprung';
      if (Math.abs(this.vx) > 10) return ['laufen1', 'stehen', 'laufen2', 'stehen'][Math.floor(this.laufAnim / 16) % 4];
      return 'stehen';
    }

    zeichne(g, kx, ky, t) {
      // Blinken nach dem Wiedereinstieg
      if (this.unverwundbar > 0 && !this.tot && Math.floor(t * 20) % 2 === 0) return;
      const bild = KW.Grafik.spielerBild(this.aktuellesBild(), this.blick < 0, KW.Konto.aktiverSkin());
      const x = Math.round(this.x - 3 - kx);
      const y = Math.round(this.y - 4 - ky);
      g.globalAlpha = this.alpha;

      // Leuchtender Rand während Doppelsprung (blinkt in den letzten 2 s)
      if (this.dsZeit > 0 && (this.dsZeit > 2 || Math.floor(t * 8) % 2 === 0)) {
        g.fillStyle = 'rgba(255,210,63,0.35)';
        g.fillRect(x - 2, y - 2, bild.width + 4, bild.height + 4);
      }

      if (this.tot) {
        // kopfüber
        g.save();
        g.translate(x, y + bild.height);
        g.scale(1, -1);
        g.drawImage(bild, 0, 0);
        g.restore();
      } else {
        g.drawImage(bild, x, y);
      }
      g.globalAlpha = 1;
    }
  }

  KW.Spieler = Spieler;
  KW.PHYSIK = PHYSIK;
})();
