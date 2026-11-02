/* =========================================================
   input.js – Tastatur- und Touch-Eingaben
   Liefert "gehaltene" Aktionen (links/rechts/sprung) und
   "Flanken" (Sprungtaste gerade neu gedrückt).
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW;

  // Tastenbelegung: KeyboardEvent.code -> Aktion
  const BELEGUNG = {
    ArrowLeft: 'links', KeyA: 'links',
    ArrowRight: 'rechts', KeyD: 'rechts',
    Space: 'sprung', ArrowUp: 'sprung', KeyW: 'sprung',
    KeyP: 'pause', Escape: 'pause'
  };

  const Input = {
    gehalten: new Set(),                                // aktuell gedrückte Tasten (codes)
    touch: { links: false, rechts: false, sprung: false },
    flanken: { sprung: false },
    spielLaeuft: () => false,                           // wird von game.js gesetzt
    beiPause: null,                                     // Rückruf für P/Esc

    init() {
      window.addEventListener('keydown', (e) => {
        const aktion = BELEGUNG[e.code];
        if (!aktion) return;
        // Beim Tippen (z. B. Name für die Rangliste) keine Spielsteuerung
        const ziel = e.target && e.target.tagName;
        if (ziel === 'INPUT' || ziel === 'SELECT' || ziel === 'TEXTAREA') return;
        const laeuft = this.spielLaeuft();
        // Im Spiel kein Scrollen und kein Auslösen fokussierter Knöpfe
        if (laeuft) e.preventDefault();
        if (aktion === 'pause') {
          if (!e.repeat && this.beiPause) this.beiPause(e.code);
          return;
        }
        if (!laeuft) return; // In Menüs normale Tastaturbedienung zulassen
        if (aktion === 'sprung' && !this.gehalten.has(e.code)) this.flanken.sprung = true;
        this.gehalten.add(e.code);
      });

      window.addEventListener('keyup', (e) => {
        if (!BELEGUNG[e.code]) return;
        if (this.spielLaeuft()) e.preventDefault();
        this.gehalten.delete(e.code);
      });

      // Fenster verliert Fokus -> keine "klemmenden" Tasten
      window.addEventListener('blur', () => this.reset());

      // Touch-Geräte erkennen
      const istTouch = ('ontouchstart' in window) ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      if (istTouch) document.body.classList.add('touch');
      window.addEventListener('touchstart', () => document.body.classList.add('touch'), { once: true, passive: true });

      // Touch-Knöpfe (Pointer Events funktionieren für Finger, Stift und Maus)
      document.querySelectorAll('[data-steuer]').forEach((knopf) => {
        const aktion = knopf.dataset.steuer;
        const druecken = (e) => {
          e.preventDefault();
          KW.Audio.init();
          if (aktion === 'sprung' && !this.touch.sprung) this.flanken.sprung = true;
          this.touch[aktion] = true;
          knopf.classList.add('aktiv');
          try { knopf.setPointerCapture(e.pointerId); } catch (err) { /* egal */ }
        };
        const loslassen = () => {
          this.touch[aktion] = false;
          knopf.classList.remove('aktiv');
        };
        knopf.addEventListener('pointerdown', druecken);
        knopf.addEventListener('pointerup', loslassen);
        knopf.addEventListener('pointercancel', loslassen);
        knopf.addEventListener('lostpointercapture', loslassen);
        knopf.addEventListener('contextmenu', (e) => e.preventDefault());
      });
    },

    /** Ist eine Aktion gerade gedrückt (Tastatur oder Touch)? */
    halten(aktion) {
      if (this.touch[aktion]) return true;
      for (const code of this.gehalten) {
        if (BELEGUNG[code] === aktion) return true;
      }
      return false;
    },

    /** Liefert true genau einmal pro neuem Tastendruck. */
    nimmFlanke(aktion) {
      const wert = this.flanken[aktion];
      this.flanken[aktion] = false;
      return wert;
    },

    /** Alle Eingaben zurücksetzen (z. B. beim Levelstart oder Pausieren). */
    reset() {
      this.gehalten.clear();
      Object.keys(this.touch).forEach((k) => { this.touch[k] = false; });
      this.flanken.sprung = false;
      document.querySelectorAll('[data-steuer].aktiv').forEach((k) => k.classList.remove('aktiv'));
    }
  };

  KW.Input = Input;
})();
