/* =========================================================
   audio.js – Soundeffekte mit der Web Audio API
   Alle Töne werden zur Laufzeit synthetisch erzeugt,
   es werden keine Audiodateien geladen.
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW;

  const Audio = {
    ctx: null,
    master: null,
    rauschPuffer: null,
    an: KW.Speicher.lesen('ton', true),
    lautstaerke: 0.7, // 0..1, wird von den Einstellungen gesetzt

    /**
     * Browser erlauben Audio erst nach einer Nutzeraktion.
     * Daher wird der AudioContext beim ersten Klick/Tastendruck erstellt.
     */
    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.32 * this.lautstaerke;
        this.master.connect(this.ctx.destination);
      } catch (e) {
        this.ctx = null;
      }
    },

    /** Ton an/aus umschalten und Einstellung merken. */
    umschalten() {
      this.an = !this.an;
      KW.Speicher.schreiben('ton', this.an);
      return this.an;
    },

    /** Gesamtlautstärke setzen (0..1). */
    setzeLautstaerke(wert) {
      this.lautstaerke = Math.max(0, Math.min(1, wert));
      if (this.master) this.master.gain.value = 0.32 * this.lautstaerke;
    },

    /** Einzelner Ton mit Frequenzverlauf und abklingender Lautstärke. */
    ton(freqStart, freqEnde, dauer, typ, lautstaerke, verzoegerung) {
      const c = this.ctx;
      const t = c.currentTime + (verzoegerung || 0);
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = typ || 'square';
      osc.frequency.setValueAtTime(freqStart, t);
      if (freqEnde !== freqStart) osc.frequency.exponentialRampToValueAtTime(freqEnde, t + dauer);
      g.gain.setValueAtTime(lautstaerke || 0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dauer);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t);
      osc.stop(t + dauer + 0.03);
    },

    /** Gefiltertes Rauschen (für Zerbrechen/Bröseln). */
    rauschen(dauer, lautstaerke, filterFreq, verzoegerung) {
      const c = this.ctx;
      const t = c.currentTime + (verzoegerung || 0);
      if (!this.rauschPuffer) {
        const laenge = Math.floor(c.sampleRate * 0.6);
        this.rauschPuffer = c.createBuffer(1, laenge, c.sampleRate);
        const daten = this.rauschPuffer.getChannelData(0);
        for (let i = 0; i < laenge; i++) daten[i] = Math.random() * 2 - 1;
      }
      const quelle = c.createBufferSource();
      quelle.buffer = this.rauschPuffer;
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq || 1500;
      const g = c.createGain();
      g.gain.setValueAtTime(lautstaerke, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dauer);
      quelle.connect(filter);
      filter.connect(g);
      g.connect(this.master);
      quelle.start(t);
      quelle.stop(t + dauer + 0.03);
    },

    /** Mehrere Töne nacheinander. */
    melodie(noten, notenDauer, typ, lautstaerke) {
      noten.forEach((f, i) => this.ton(f, f, notenDauer * 1.3, typ, lautstaerke, i * notenDauer));
    },

    /** Benannten Soundeffekt abspielen. */
    spielen(name) {
      if (!this.an || !this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      try {
        switch (name) {
          case 'sprung':       this.ton(320, 640, 0.16, 'square', 0.25); break;
          case 'doppelsprung': this.ton(500, 1000, 0.16, 'square', 0.25); break;
          case 'muenze':
            this.ton(988, 988, 0.06, 'square', 0.25);
            this.ton(1319, 1319, 0.2, 'square', 0.25, 0.06);
            break;
          case 'grosseMuenze': this.melodie([784, 988, 1175, 1568], 0.06, 'square', 0.25); break;
          case 'stampfen':     this.ton(500, 110, 0.16, 'triangle', 0.6); break;
          case 'treffer':      this.ton(520, 70, 0.5, 'sawtooth', 0.35); break;
          case 'ziegel':
            this.rauschen(0.2, 0.6, 1800);
            this.ton(220, 70, 0.12, 'square', 0.25);
            break;
          case 'block':        this.ton(160, 120, 0.08, 'square', 0.3); break;
          case 'itemErscheint': this.melodie([392, 523, 659], 0.07, 'triangle', 0.4); break;
          case 'powerup':      this.melodie([523, 659, 784, 1047, 1319], 0.07, 'square', 0.22); break;
          case 'checkpoint':   this.melodie([660, 880, 1100], 0.08, 'triangle', 0.45); break;
          case 'broeseln':     this.rauschen(0.3, 0.35, 700); break;
          case 'levelEnde':    this.melodie([523, 659, 784, 1047, 784, 1047, 1319], 0.11, 'square', 0.22); break;
          case 'gameOver':     this.melodie([392, 330, 262, 196], 0.2, 'triangle', 0.5); break;
          case 'trampolin':
            this.ton(140, 620, 0.28, 'sine', 0.7);
            this.ton(280, 900, 0.18, 'triangle', 0.25, 0.04);
            break;
          case 'klick':        this.ton(700, 700, 0.04, 'square', 0.15); break;
          default: break;
        }
      } catch (e) {
        /* Audiofehler sollen das Spiel nie stoppen */
      }
    }
  };

  KW.Audio = Audio;
})();
