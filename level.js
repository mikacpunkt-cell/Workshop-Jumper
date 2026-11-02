/* =========================================================
   level.js – Level laden, Kacheln, Kollision, Objekte, Gegner

   Zeichen in den Level-Daten (siehe README.md):
     .  leer               #  Boden (fest)
     B  Ziegel             ?  Fragezeichen-Block (Münze)
     !  Fragezeichen-Block (Power-up Doppelsprung)
     C  zerbröselnde Plattform   ^  Stacheln
     T  Trampolin (Sprungtaste halten = sehr hoch)
     o  Münze (+10)        O  große Münze (+100)
     E  Gegner             S  Startpunkt
     K  Checkpoint         Z  Ziel (Tür)
     -  bewegliche Plattform (waagerecht)
     |  bewegliche Plattform (senkrecht)
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW;
  const T = KW.TILE;

  // Kacheln, die immer fest sind ('C' wird gesondert behandelt)
  const FEST = new Set(['#', 'B', '?', '!', 'U', 'T']);
  const BROESEL_VERZOEGERUNG = 0.45; // s, bis die Plattform fällt
  const BROESEL_RUECKKEHR = 5;       // s, bis sie wieder erscheint

  /* ---------------------------------------------------------
     Gegner: läuft hin und her, dreht an Wänden, Kanten, Stacheln
     --------------------------------------------------------- */
  class Gegner {
    constructor(tx, ty, tempo) {
      this.w = 22;
      this.h = 20;
      this.x = tx * T + (T - this.w) / 2;
      this.y = (ty + 1) * T - this.h;
      this.vx = -tempo;
      this.vy = 0;
      this.lebendig = true;
      this.plattZeit = 0; // Dauer der "platt"-Animation nach dem Besiegen
      this.anim = Math.random();
      this.weg = false;
    }

    update(dt, level) {
      if (!this.lebendig) {
        this.plattZeit -= dt;
        if (this.plattZeit <= 0) this.weg = true;
        return;
      }
      this.anim += dt;
      this.vy = Math.min(this.vy + 1900 * dt, 800);

      const dx = this.vx * dt;
      this.x += dx;
      if (level.kollisionX(this, dx)) this.vx = -this.vx;

      const dy = this.vy * dt;
      this.y += dy;
      const r = level.kollisionY(this, dy);
      if (r.unten || r.oben) this.vy = 0;

      if (r.unten) {
        // Vor einer Kante oder vor Stacheln umdrehen
        const vorneX = this.vx > 0 ? this.x + this.w + 1 : this.x - 1;
        const tx = Math.floor(vorneX / T);
        const tyFuss = Math.floor((this.y + this.h + 1) / T);
        const tyKoerper = Math.floor((this.y + this.h - 1) / T);
        if (!level.istFest(tx, tyFuss) || level.kachel(tx, tyKoerper) === '^') this.vx = -this.vx;
      }
      if (this.y > level.pixelHoehe + 64) this.weg = true;
    }

    zeichne(g, kx, ky, th) {
      const bild = KW.Grafik.gegnerBild(th.gegner, Math.floor(this.anim * 6) % 2);
      const x = Math.round(this.x - 1 - kx);
      if (this.lebendig) {
        g.drawImage(bild, x, Math.round(this.y - ky));
      } else {
        // platt gedrückt
        g.drawImage(bild, x, Math.round(this.y + this.h - 8 - ky), bild.width, 8);
      }
    }
  }

  /* ---------------------------------------------------------
     Level
     --------------------------------------------------------- */
  class Level {
    constructor(daten, index) {
      this.daten = daten;
      this.index = index;
      this.nummer = daten.nummer || index + 1;
      this.name = daten.name || ('Level ' + this.nummer);
      this.thema = KW.THEMEN[daten.thema] || KW.THEMEN.werkstatt;
      this.zeitLimit = daten.zeit || 200;
      this.gegnerTempo = daten.gegnerTempo || 45;
      this.plattformWeite = (daten.plattformWeite || 5) * T;
      this.plattformHoehe = (daten.plattformHoehe || 4) * T;
      this.plattformDauer = daten.plattformDauer || 4;
      this.spiel = null; // wird von game.js gesetzt
      this.zeit = 0;

      const zeilen = Level.zusammensetzen(daten);
      this.hoehe = zeilen.length;
      this.breite = zeilen[0].length;
      this.pixelBreite = this.breite * T;
      this.pixelHoehe = this.hoehe * T;
      this.raster = zeilen.map((z) => z.split(''));

      this.muenzen = [];
      this.gegner = [];
      this.plattformen = [];
      this.items = [];
      this.checkpoints = [];
      this.partikel = [];
      this.texte = [];
      this.muenzPops = [];
      this.broesel = new Map();  // Schlüssel: ty * breite + tx
      this.stoesse = new Map();  // Anstoß-Animation von Blöcken
      this.federn = new Map();   // Eindrück-Animation von Trampolinen
      this.start = { tx: 1, ty: this.hoehe - 3 };
      this.ziel = null;

      this.objekteAuslesen();
    }

    /**
     * Setzt die Abschnitte eines Levels zu einem Raster zusammen.
     * Jeder Abschnitt ist ein Array von Zeilen; kürzere Abschnitte
     * werden unten ausgerichtet, kürzere Zeilen mit '.' aufgefüllt.
     */
    static zusammensetzen(daten) {
      const hoehe = daten.hoehe || 12;
      const zeilen = new Array(hoehe).fill('');
      const abschnitte = daten.abschnitte || [daten.karte];
      abschnitte.forEach((abschnitt, nr) => {
        if (abschnitt.length > hoehe) {
          throw new Error('Level "' + daten.name + '": Abschnitt ' + (nr + 1) + ' ist höher als ' + hoehe + ' Zeilen.');
        }
        const breite = Math.max(...abschnitt.map((z) => z.length));
        const versatz = hoehe - abschnitt.length;
        for (let r = 0; r < hoehe; r++) {
          const z = r >= versatz ? abschnitt[r - versatz] : '';
          zeilen[r] += z.padEnd(breite, '.');
        }
      });
      return zeilen;
    }

    /** Wandelt Sonderzeichen im Raster in Objekte um. */
    objekteAuslesen() {
      for (let ty = 0; ty < this.hoehe; ty++) {
        for (let tx = 0; tx < this.breite; tx++) {
          const k = this.raster[ty][tx];
          let leeren = true;
          switch (k) {
            case 'o': this.muenzen.push({ x: tx * T + T / 2, y: ty * T + T / 2, gross: false, weg: false }); break;
            case 'O': this.muenzen.push({ x: tx * T + T / 2, y: ty * T + T / 2, gross: true, weg: false }); break;
            case 'E': this.gegner.push(new Gegner(tx, ty, this.gegnerTempo)); break;
            case '-': this.plattformen.push(this.neuePlattform(tx, ty, 'h')); break;
            case '|': this.plattformen.push(this.neuePlattform(tx, ty, 'v')); break;
            case 'S': this.start = { tx, ty }; break;
            case 'K': this.checkpoints.push({ tx, ty, aktiv: false }); break;
            case 'Z': this.ziel = { tx, ty }; break;
            case 'C':
              this.broesel.set(ty * this.breite + tx, { zustand: 'fest', timer: 0, versatz: 0, vy: 0 });
              leeren = false;
              break;
            case '#': case 'B': case '?': case '!': case '^': case 'T':
              leeren = false;
              break;
            default: break; // '.' und unbekannte Zeichen -> leer
          }
          if (leeren) this.raster[ty][tx] = '.';
        }
      }
    }

    neuePlattform(tx, ty, typ) {
      return {
        typ,
        sx: tx * T, sy: ty * T,
        x: tx * T, y: ty * T,
        w: T * 3, h: 14,
        dx: 0, dy: 0,
        weite: typ === 'h' ? this.plattformWeite : this.plattformHoehe
      };
    }

    /* ---------- Kachel-Abfragen ---------- */

    kachel(tx, ty) {
      if (ty < 0 || ty >= this.hoehe || tx < 0 || tx >= this.breite) return '.';
      return this.raster[ty][tx];
    }

    istFest(tx, ty) {
      if (tx < 0 || tx >= this.breite) return true; // Levelränder sind Wände
      if (ty < 0 || ty >= this.hoehe) return false;
      const k = this.raster[ty][tx];
      if (k === 'C') {
        const b = this.broesel.get(ty * this.breite + tx);
        return b.zustand === 'fest' || b.zustand === 'wackelt';
      }
      return FEST.has(k);
    }

    /* ---------- Kollision (achsengetrennt gegen das Kachelraster) ---------- */

    /** Nach einer Bewegung in x: Objekt aus festen Kacheln schieben. */
    kollisionX(obj, dx) {
      if (dx === 0) return false;
      const oben = Math.floor(obj.y / T);
      const unten = Math.floor((obj.y + obj.h - 0.01) / T);
      const tx = dx > 0 ? Math.floor((obj.x + obj.w - 0.01) / T) : Math.floor(obj.x / T);
      for (let ty = oben; ty <= unten; ty++) {
        if (this.istFest(tx, ty)) {
          obj.x = dx > 0 ? tx * T - obj.w : (tx + 1) * T;
          return true;
        }
      }
      return false;
    }

    /** Nach einer Bewegung in y: Objekt aus festen Kacheln schieben. */
    kollisionY(obj, dy) {
      const ergebnis = { unten: false, oben: false, kopfX: -1, kopfY: -1 };
      if (dy === 0) return ergebnis;
      const links = Math.floor(obj.x / T);
      const rechts = Math.floor((obj.x + obj.w - 0.01) / T);
      const ty = dy > 0 ? Math.floor((obj.y + obj.h - 0.01) / T) : Math.floor(obj.y / T);
      let beste = -1, besterAbstand = Infinity;
      const mitte = obj.x + obj.w / 2;
      for (let tx = links; tx <= rechts; tx++) {
        if (!this.istFest(tx, ty)) continue;
        const abstand = Math.abs(tx * T + T / 2 - mitte);
        if (abstand < besterAbstand) { besterAbstand = abstand; beste = tx; }
      }
      if (beste >= 0) {
        if (dy > 0) {
          obj.y = ty * T - obj.h;
          ergebnis.unten = true;
        } else {
          obj.y = (ty + 1) * T;
          ergebnis.oben = true;
          ergebnis.kopfX = beste; // Block, der dem Kopf am nächsten ist
          ergebnis.kopfY = ty;
        }
      }
      return ergebnis;
    }

    /* ---------- Interaktion mit Blöcken ---------- */

    /** Spieler stößt von unten gegen einen Block. */
    stossVonUnten(tx, ty) {
      const k = this.kachel(tx, ty);
      const sp = this.spiel;
      const schluessel = ty * this.breite + tx;
      const cx = tx * T + T / 2, cy = ty * T;

      if (k === 'B') {
        this.raster[ty][tx] = '.';
        for (let i = 0; i < 4; i++) {
          this.partikel.push({
            x: tx * T + (i % 2) * 16 + 8, y: ty * T + Math.floor(i / 2) * 16 + 8,
            vx: (i % 2 ? 1 : -1) * (60 + Math.random() * 60), vy: -320 + Math.floor(i / 2) * 120,
            leben: 1.2, farbe: this.thema.ziegel, groesse: 8, schwerkraft: true
          });
        }
        KW.Audio.spielen('ziegel');
      } else if (k === '?') {
        this.raster[ty][tx] = 'U';
        this.stoesse.set(schluessel, 0.15);
        this.muenzPops.push({ x: cx, y: cy - 8, vy: -320, leben: 0.5 });
        if (sp) sp.muenzeEinsammeln(false, cx, cy - 16);
      } else if (k === '!') {
        this.raster[ty][tx] = 'U';
        this.stoesse.set(schluessel, 0.15);
        this.items.push({ x: tx * T + 4, y: ty * T, w: 24, h: 24, zielY: ty * T - 26, anim: 0, weg: false });
        KW.Audio.spielen('itemErscheint');
      } else {
        KW.Audio.spielen('block');
      }

      // Gegner, die auf dem angestoßenen Block stehen, werden besiegt
      if ((k === 'B' || k === '?' || k === '!') && sp) {
        for (const g of this.gegner) {
          if (!g.lebendig) continue;
          const fuss = g.y + g.h;
          if (fuss >= ty * T - 4 && fuss <= ty * T + 2 && g.x + g.w > tx * T && g.x < tx * T + T) {
            sp.gegnerBesiegt(g);
          }
        }
      }
    }

    /** Spieler steht auf einer Kachel – Bröselplattformen beginnen zu wackeln. */
    betreten(tx, ty) {
      if (this.kachel(tx, ty) !== 'C') return;
      const b = this.broesel.get(ty * this.breite + tx);
      if (b.zustand === 'fest') {
        b.zustand = 'wackelt';
        b.timer = BROESEL_VERZOEGERUNG;
      }
    }

    /** Trampolin wurde benutzt – kurz eindrücken. */
    trampolinStoss(tx, ty) {
      this.federn.set(ty * this.breite + tx, 0.15);
    }

    /* ---------- Effekte ---------- */

    funken(x, y, anzahl, farbe) {
      if (KW.Einstellungen.niedrig) return; // niedrige Grafikqualität: keine Funken
      for (let i = 0; i < anzahl; i++) {
        const winkel = Math.random() * Math.PI * 2;
        const tempo = 40 + Math.random() * 90;
        this.partikel.push({
          x, y, vx: Math.cos(winkel) * tempo, vy: Math.sin(winkel) * tempo,
          leben: 0.4 + Math.random() * 0.3, farbe, groesse: 3, schwerkraft: false
        });
      }
    }

    text(x, y, inhalt, farbe) {
      this.texte.push({ x, y, inhalt, farbe: farbe || '#fff', leben: 1 });
    }

    /* ---------- Aktualisieren ---------- */

    update(dt, spieler) {
      this.zeit += dt;

      // Bewegliche Plattformen (sanftes Hin und Her per Kosinus)
      const omega = (Math.PI * 2) / this.plattformDauer;
      const f = (1 - Math.cos(this.zeit * omega)) / 2;
      for (const p of this.plattformen) {
        const nx = p.typ === 'h' ? p.sx + f * p.weite : p.sx;
        const ny = p.typ === 'v' ? p.sy - f * p.weite : p.sy;
        p.dx = nx - p.x;
        p.dy = ny - p.y;
        p.x = nx;
        p.y = ny;
      }

      // Bröselplattformen
      for (const [schluessel, b] of this.broesel) {
        if (b.zustand === 'wackelt') {
          b.timer -= dt;
          if (b.timer <= 0) {
            b.zustand = 'faellt';
            b.timer = BROESEL_RUECKKEHR;
            b.versatz = 0;
            b.vy = 0;
            KW.Audio.spielen('broeseln');
          }
        } else if (b.zustand === 'faellt') {
          b.vy += 1200 * dt;
          b.versatz += b.vy * dt;
          b.timer -= dt;
          if (b.timer <= 0) {
            // Nur wieder erscheinen, wenn der Spieler nicht im Weg steht
            const tx = schluessel % this.breite, ty = Math.floor(schluessel / this.breite);
            const imWeg = spieler && spieler.x < tx * T + T && spieler.x + spieler.w > tx * T &&
              spieler.y < ty * T + T && spieler.y + spieler.h > ty * T;
            if (!imWeg) { b.zustand = 'fest'; b.versatz = 0; }
          }
        }
      }

      // Anstoß- und Trampolin-Animationen
      for (const karte of [this.stoesse, this.federn]) {
        for (const [schluessel, rest] of karte) {
          if (rest - dt <= 0) karte.delete(schluessel);
          else karte.set(schluessel, rest - dt);
        }
      }

      // Gegner
      for (const g of this.gegner) g.update(dt, this);
      if (this.gegner.some((g) => g.weg)) this.gegner = this.gegner.filter((g) => !g.weg);

      // Power-ups steigen aus dem Block
      for (const it of this.items) {
        it.anim += dt;
        if (it.y > it.zielY) it.y = Math.max(it.zielY, it.y - 60 * dt);
      }
      if (this.items.some((i) => i.weg)) this.items = this.items.filter((i) => !i.weg);

      // Partikel
      for (const p of this.partikel) {
        p.leben -= dt;
        if (p.schwerkraft) p.vy += 1400 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      if (this.partikel.length) this.partikel = this.partikel.filter((p) => p.leben > 0);

      // Münzen, die aus ?-Blöcken springen
      for (const m of this.muenzPops) {
        m.leben -= dt;
        m.vy += 1100 * dt;
        m.y += m.vy * dt;
      }
      if (this.muenzPops.length) this.muenzPops = this.muenzPops.filter((m) => m.leben > 0);

      // Punkte-Texte
      for (const t of this.texte) {
        t.leben -= dt;
        t.y -= 30 * dt;
      }
      if (this.texte.length) this.texte = this.texte.filter((t) => t.leben > 0);
    }

    /* ---------- Zeichnen ---------- */

    zeichne(g, kx, ky, t) {
      const satz = KW.Grafik.kachelSatz(this.thema);
      const x0 = Math.max(0, Math.floor(kx / T));
      const x1 = Math.min(this.breite - 1, Math.floor((kx + KW.Grafik.BREITE) / T));
      const y0 = Math.max(0, Math.floor(ky / T));
      const y1 = Math.min(this.hoehe - 1, Math.floor((ky + KW.Grafik.HOEHE) / T));
      const frageFrame = Math.floor(t * 3) % 2;

      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const k = this.raster[ty][tx];
          if (k === '.') continue;
          const schluessel = ty * this.breite + tx;
          const x = tx * T - kx;
          let y = ty * T - ky;
          const stoss = this.stoesse.get(schluessel);
          if (stoss) y -= Math.round(Math.sin((stoss / 0.15) * Math.PI) * 6);

          switch (k) {
            case '#': {
              const obenFrei = ty === 0 || this.raster[ty - 1][tx] !== '#';
              g.drawImage(obenFrei ? satz.bodenOben : satz.boden, x, y);
              break;
            }
            case 'B': g.drawImage(satz.ziegel, x, y); break;
            case '?': case '!': g.drawImage(satz.frage[frageFrame], x, y); break;
            case 'U': g.drawImage(satz.benutzt, x, y); break;
            case '^': g.drawImage(satz.stachel, x, y); break;
            case 'T': g.drawImage(satz.trampolin[this.federn.has(schluessel) ? 1 : 0], x, y); break;
            case 'C': {
              const b = this.broesel.get(schluessel);
              if (b.zustand === 'fest') {
                g.drawImage(satz.broesel, x, y);
              } else if (b.zustand === 'wackelt') {
                g.drawImage(satz.broesel, x + Math.round((Math.random() * 2 - 1) * 2), y);
              } else if (b.versatz < 300) {
                g.globalAlpha = Math.max(0, 1 - b.versatz / 300);
                g.drawImage(satz.broesel, x, y + Math.round(b.versatz));
                g.globalAlpha = 1;
              }
              break;
            }
            default: break;
          }
        }
      }

      // Bewegliche Plattformen
      for (const p of this.plattformen) {
        g.drawImage(satz.plattform, Math.round(p.x - kx), Math.round(p.y - ky));
      }

      // Checkpoints und Ziel
      for (const cp of this.checkpoints) {
        KW.Grafik.zeichneCheckpoint(g, cp.tx * T - kx, cp.ty * T - ky, cp.aktiv, t);
      }
      if (this.ziel) KW.Grafik.zeichneTuer(g, this.ziel.tx * T - kx, (this.ziel.ty - 1) * T - ky);

      // Münzen (drehen sich)
      for (const m of this.muenzen) {
        if (m.weg) continue;
        const sx = m.x - kx;
        if (sx < -32 || sx > KW.Grafik.BREITE + 32) continue;
        const bild = KW.Grafik.muenzBild(m.gross);
        const b = Math.max(0.2, Math.abs(Math.cos(t * 3 + m.x * 0.05))) * bild.width;
        g.drawImage(bild, Math.round(sx - b / 2), Math.round(m.y - ky - bild.height / 2), Math.round(b), bild.height);
      }

      // Power-ups (wippen leicht)
      for (const it of this.items) {
        const wippen = it.y <= it.zielY ? Math.round(Math.sin(it.anim * 5) * 2) : 0;
        g.drawImage(KW.Grafik.federBild(), Math.round(it.x - kx), Math.round(it.y - ky + wippen));
      }

      // Gegner
      for (const gg of this.gegner) gg.zeichne(g, kx, ky, this.thema);
    }

    /** Effekte, die über dem Spieler liegen. */
    zeichneEffekte(g, kx, ky) {
      for (const p of this.partikel) {
        g.globalAlpha = Math.min(1, p.leben * 2);
        g.fillStyle = p.farbe;
        g.fillRect(Math.round(p.x - kx - p.groesse / 2), Math.round(p.y - ky - p.groesse / 2), p.groesse, p.groesse);
      }
      g.globalAlpha = 1;
      const muenze = KW.Grafik.muenzBild(false);
      for (const m of this.muenzPops) {
        g.drawImage(muenze, Math.round(m.x - kx - 10), Math.round(m.y - ky - 10));
      }
    }
  }

  KW.Level = Level;
  KW.Gegner = Gegner;
})();
