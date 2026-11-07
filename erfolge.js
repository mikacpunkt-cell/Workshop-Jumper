/* =========================================================
   erfolge.js – Erfolge
   Zählt im Hintergrund mit, was beim Spielen passiert, schaltet Erfolge
   frei, blendet beim Freischalten eine Meldung ein und zeigt alle Erfolge
   mit Fortschritt im Menü. Alles bleibt lokal im Browser.

   Ereignisse kommen über KW.Erfolge.ereignis(art, wert) aus dem Spiel.
   Im Editor-Test und im Speicher-Testmodus wird nichts gezählt.
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW;
  const SCHLUESSEL = 'erfolge';

  /**
   * Alle Erfolge. `zaehler` ist der Zähler, der den Erfolg bestimmt; `ziel` der Wert,
   * ab dem er freigeschaltet wird ('alle' = Anzahl aller Level).
   * Texte: [Name, Beschreibung] auf Deutsch und Englisch.
   */
  const ERFOLGE = [
    { id: 'erste', zaehler: 'abgeschlossen', ziel: 1,
      de: ['Erste Schicht', 'Schaffe dein erstes Level.'], en: ['First shift', 'Finish your first level.'] },
    { id: 'lehrling', zaehler: 'hoechstes', ziel: 5,
      de: ['Lehrling', 'Schaffe Level 5.'], en: ['Apprentice', 'Finish level 5.'] },
    { id: 'geselle', zaehler: 'hoechstes', ziel: 10,
      de: ['Geselle', 'Schaffe Level 10.'], en: ['Journeyman', 'Finish level 10.'] },
    { id: 'vorarbeiter', zaehler: 'hoechstes', ziel: 15,
      de: ['Vorarbeiter', 'Schaffe Level 15.'], en: ['Foreman', 'Finish level 15.'] },
    { id: 'meister', zaehler: 'hoechstes', ziel: 'alle',
      de: ['Werkstattmeister', 'Schaffe das letzte Level.'], en: ['Workshop master', 'Finish the final level.'] },

    { id: 'sauber', zaehler: 'ohneTod', ziel: 1,
      de: ['Saubere Arbeit', 'Schaffe ein Level, ohne dabei zu sterben.'], en: ['Clean work', 'Finish a level without dying.'] },
    { id: 'makellos', zaehler: 'ohneTod', ziel: 10,
      de: ['Makellos', 'Schaffe 10 Level, ohne in ihnen zu sterben.'], en: ['Flawless', 'Finish 10 levels without dying in them.'] },
    { id: 'alleMuenzen', zaehler: 'alleMuenzen', ziel: 1,
      de: ['Keine vergessen', 'Sammle in einem Level alle Münzen ein.'], en: ['Missed none', 'Collect every coin in a level.'] },
    { id: 'flink', zaehler: 'flink', ziel: 1,
      de: ['Flink', 'Schaffe ein Level mit mindestens der halben Zeit übrig.'], en: ['Swift', 'Finish a level with at least half the time left.'] },
    { id: 'geist', zaehler: 'geist', ziel: 1,
      de: ['Geisterjäger', 'Schlage deinen eigenen Geist.'], en: ['Ghost hunter', 'Beat your own ghost.'] },
    { id: 'geist5', zaehler: 'geist', ziel: 5,
      de: ['Immer schneller', 'Schlage deinen Geist 5-mal.'], en: ['Ever faster', 'Beat your ghost 5 times.'] },

    { id: 'muenzen100', zaehler: 'muenzen', ziel: 100,
      de: ['Kleingeld', 'Sammle 100 Münzen.'], en: ['Small change', 'Collect 100 coins.'] },
    { id: 'muenzen500', zaehler: 'muenzen', ziel: 500,
      de: ['Sparschwein', 'Sammle 500 Münzen.'], en: ['Piggy bank', 'Collect 500 coins.'] },
    { id: 'muenzen2000', zaehler: 'muenzen', ziel: 2000,
      de: ['Goldgräber', 'Sammle 2000 Münzen.'], en: ['Gold digger', 'Collect 2000 coins.'] },

    { id: 'gegner10', zaehler: 'gegner', ziel: 10,
      de: ['Aufräumer', 'Besiege 10 Gegner.'], en: ['Tidy-up crew', 'Defeat 10 enemies.'] },
    { id: 'gegner50', zaehler: 'gegner', ziel: 50,
      de: ['Schädlingsbekämpfer', 'Besiege 50 Gegner.'], en: ['Pest controller', 'Defeat 50 enemies.'] },
    { id: 'gegner200', zaehler: 'gegner', ziel: 200,
      de: ['Rausschmeißer', 'Besiege 200 Gegner.'], en: ['Bouncer', 'Defeat 200 enemies.'] },

    { id: 'trampolin', zaehler: 'trampolin', ziel: 25,
      de: ['Federleicht', 'Springe 25-mal auf ein Trampolin.'], en: ['Light as a spring', 'Bounce on a trampoline 25 times.'] },
    { id: 'powerup', zaehler: 'powerups', ziel: 10,
      de: ['Doppelt hält besser', 'Sammle 10-mal das Doppelsprung-Power-up ein.'], en: ['Better twice', 'Collect the double-jump power-up 10 times.'] },
    { id: 'checkpoint', zaehler: 'checkpoints', ziel: 20,
      de: ['Sicher ist sicher', 'Aktiviere 20 Checkpoints.'], en: ['Better safe than sorry', 'Activate 20 checkpoints.'] },
    { id: 'tode', zaehler: 'tode', ziel: 25,
      de: ['Aus Fehlern lernt man', 'Scheitere 25-mal. Jeder Meister hat einmal angefangen.'], en: ['Learning the hard way', 'Fail 25 times. Every master started somewhere.'] },

    { id: 'skin1', zaehler: 'skins', ziel: 1,
      de: ['Neuer Look', 'Kaufe deinen ersten Skin.'], en: ['New look', 'Buy your first skin.'] },
    { id: 'skin5', zaehler: 'skins', ziel: 5,
      de: ['Kleiderschrank', 'Besitze 5 Skins.'], en: ['Wardrobe', 'Own 5 skins.'] },
    { id: 'designer', zaehler: 'eigenerSkinGekauft', ziel: 1,
      de: ['Designer', 'Kaufe den eigenen Skin.'], en: ['Designer', 'Buy the custom skin.'] },
    { id: 'kuenstler', zaehler: 'eigenerSkinGezeichnet', ziel: 1,
      de: ['Künstler', 'Male deinen eigenen Skin und speichere ihn.'], en: ['Artist', 'Paint your own skin and save it.'] },
    { id: 'baumeister', zaehler: 'testLevel', ziel: 1,
      de: ['Baumeister', 'Baue im Level-Editor ein Level und schaffe es selbst.'], en: ['Builder', 'Build a level in the level editor and finish it yourself.'] }
  ];

  const TEXTE = {
    de: {
      kopf: 'Erfolg freigeschaltet', stand: '{a} von {b} freigeschaltet', am: 'Freigeschaltet am {d}',
      datum: 'de-DE'
    },
    en: {
      kopf: 'Achievement unlocked', stand: '{a} of {b} unlocked', am: 'Unlocked on {d}',
      datum: 'en-GB'
    }
  };
  const sprache = () => (KW.I18n && KW.I18n.sprache === 'en' ? 'en' : 'de');
  const t = (k, werte) => {
    let s = TEXTE[sprache()][k];
    if (werte) Object.keys(werte).forEach((n) => { s = s.split('{' + n + '}').join(werte[n]); });
    return s;
  };

  const ZAEHLER = {};
  ERFOLGE.forEach((e) => { ZAEHLER[e.zaehler] = true; });
  const ERFOLG_IDS = {};
  ERFOLGE.forEach((e) => { ERFOLG_IDS[e.id] = true; });

  /* ---------- Zustand ---------- */
  let zustand = null;           // { stat: { zaehler: Zahl }, frei: { id: Zeitpunkt } }
  let schmutzig = false;
  let speicherTimer = 0;
  let banner = null, bannerTimer = 0;
  let warteschlange = [];
  let bannerLaeuft = false;

  const zielWert = (e) => (e.ziel === 'alle' ? Math.max(1, KW.LEVELS ? KW.LEVELS.length : 25) : e.ziel);

  function ladeZustand() {
    const neu = { stat: {}, frei: {} };
    const roh = KW.Speicher.lesen(SCHLUESSEL, null);
    if (roh && typeof roh === 'object') {
      if (roh.stat && typeof roh.stat === 'object') {
        Object.keys(ZAEHLER).forEach((k) => {
          const n = Number(roh.stat[k]);
          if (Number.isFinite(n) && n > 0) neu.stat[k] = Math.min(Math.floor(n), 1e9);
        });
      }
      if (roh.frei && typeof roh.frei === 'object') {
        Object.keys(ERFOLG_IDS).forEach((id) => {
          const n = Number(roh.frei[id]);
          if (Number.isFinite(n) && n > 0) neu.frei[id] = n;
        });
      }
    }
    return neu;
  }
  function daten() {
    if (!zustand) zustand = ladeZustand();
    return zustand;
  }

  function speichern() {
    clearTimeout(speicherTimer);
    if (!schmutzig || !zustand || KW.Speicher.testAktiv()) return;
    KW.Speicher.schreiben(SCHLUESSEL, { stat: zustand.stat, frei: zustand.frei });
    schmutzig = false;
  }
  function speichernSpaeter() {
    clearTimeout(speicherTimer);
    speicherTimer = setTimeout(speichern, 800);
  }

  /* ---------- Zählen und Freischalten ---------- */
  const wert = (zaehler) => daten().stat[zaehler] || 0;
  function erhoehe(zaehler, um) {
    const d = daten();
    d.stat[zaehler] = Math.min(1e9, (d.stat[zaehler] || 0) + (um || 1));
  }
  function mindestens(zaehler, n) {
    const d = daten();
    if (!(n > (d.stat[zaehler] || 0))) return;
    d.stat[zaehler] = Math.min(1e9, Math.floor(n));
  }

  function skinAnzahl() {
    const standard = KW.Konto.SKINS[0].id;
    return KW.Konto.SKINS.filter((s) => s.id !== standard && KW.Konto.besitzt(s.id)).length;
  }

  function pruefen() {
    const d = daten();
    ERFOLGE.forEach((e) => {
      if (!d.frei[e.id] && wert(e.zaehler) >= zielWert(e)) freischalten(e);
    });
  }

  function freischalten(e) {
    const d = daten();
    d.frei[e.id] = Date.now();
    schmutzig = true;
    speichern();
    warteschlange.push(e);
    zeigeBanner();
    if (KW.UI && KW.UI.aktuell === 'menue-erfolge') liste();
  }

  /** Meldungen nacheinander einblenden. */
  function zeigeBanner() {
    if (bannerLaeuft || !warteschlange.length) return;
    const spielFlaeche = document.getElementById('spiel');
    if (!spielFlaeche) { warteschlange = []; return; }
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'erfolg-banner';
      banner.setAttribute('role', 'status');
      banner.setAttribute('aria-live', 'polite');
      spielFlaeche.appendChild(banner);
    }
    bannerLaeuft = true;
    const e = warteschlange.shift();
    const l = sprache();
    banner.innerHTML = '';
    const marke = document.createElement('div');
    marke.className = 'erfolg-marke frei';
    marke.textContent = '★';
    const text = document.createElement('div');
    const kopf = document.createElement('div');
    kopf.className = 'erfolg-kopf';
    kopf.textContent = t('kopf');
    const name = document.createElement('div');
    name.className = 'erfolg-name';
    name.textContent = e[l][0];
    const beschr = document.createElement('div');
    beschr.className = 'erfolg-text';
    beschr.textContent = e[l][1];
    text.append(kopf, name, beschr);
    banner.append(marke, text);
    if (KW.Audio) KW.Audio.spielen('powerup');
    requestAnimationFrame(() => banner.classList.add('zu-sehen'));
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => {
      banner.classList.remove('zu-sehen');
      setTimeout(() => { bannerLaeuft = false; zeigeBanner(); }, 450);
    }, 3800);
  }

  /* ---------- Ereignisse aus dem Spiel ---------- */
  function ereignis(art, info) {
    if (KW.Speicher.testAktiv()) return;     // Editor-Test und Level-Prüfer zählen nicht
    switch (art) {
      case 'muenze': erhoehe('muenzen', info || 1); break;
      case 'gegner': erhoehe('gegner'); break;
      case 'tod': erhoehe('tode'); break;
      case 'trampolin': erhoehe('trampolin'); break;
      case 'powerup': erhoehe('powerups'); break;
      case 'checkpoint': erhoehe('checkpoints'); break;
      case 'level': {
        const i = info || {};
        erhoehe('abgeschlossen');
        mindestens('hoechstes', Number(i.nummer) || 0);
        if (i.ohneTod) erhoehe('ohneTod');
        if (i.alleMuenzen) erhoehe('alleMuenzen');
        if (i.flink) erhoehe('flink');
        if (i.geist) erhoehe('geist');
        break;
      }
      case 'skin': mindestens('skins', skinAnzahl()); break;
      case 'eigenerSkinGekauft': mindestens('eigenerSkinGekauft', 1); mindestens('skins', skinAnzahl()); break;
      case 'eigenerSkinGezeichnet': mindestens('eigenerSkinGezeichnet', 1); break;
      case 'testLevel': mindestens('testLevel', 1); break;
      default: return;
    }
    schmutzig = true;
    pruefen();
    speichernSpaeter();
  }

  /* ---------- Anzeige im Menü ---------- */
  function liste() {
    const behaelter = document.getElementById('erfolg-liste');
    const zusammenfassung = document.getElementById('erfolge-zusammenfassung');
    if (!behaelter) return;
    const d = daten();
    const l = sprache();
    const anzahlFrei = ERFOLGE.filter((e) => d.frei[e.id]).length;
    zusammenfassung.textContent = t('stand', { a: anzahlFrei, b: ERFOLGE.length });
    behaelter.innerHTML = '';
    ERFOLGE.forEach((e) => {
      const frei = !!d.frei[e.id];
      const ziel = zielWert(e);
      const stand = Math.min(wert(e.zaehler), ziel);
      const karte = document.createElement('div');
      karte.className = 'erfolg-karte' + (frei ? ' frei' : '');
      const marke = document.createElement('div');
      marke.className = 'erfolg-marke' + (frei ? ' frei' : '');
      marke.textContent = frei ? '★' : '·';
      marke.setAttribute('aria-hidden', 'true');
      const text = document.createElement('div');
      text.className = 'erfolg-inhalt';
      const name = document.createElement('div');
      name.className = 'erfolg-name';
      name.textContent = e[l][0];
      const beschr = document.createElement('div');
      beschr.className = 'erfolg-text';
      beschr.textContent = e[l][1];
      text.append(name, beschr);
      if (frei) {
        const am = document.createElement('div');
        am.className = 'erfolg-stand';
        am.textContent = t('am', { d: new Date(d.frei[e.id]).toLocaleDateString(t('datum')) });
        text.append(am);
      } else if (ziel > 1) {
        const balken = document.createElement('div');
        balken.className = 'erfolg-balken';
        balken.setAttribute('role', 'progressbar');
        balken.setAttribute('aria-valuemin', '0');
        balken.setAttribute('aria-valuemax', String(ziel));
        balken.setAttribute('aria-valuenow', String(stand));
        const fuellung = document.createElement('span');
        fuellung.style.width = Math.round(stand / ziel * 100) + '%';
        balken.appendChild(fuellung);
        const zahl = document.createElement('div');
        zahl.className = 'erfolg-stand';
        zahl.textContent = stand + ' / ' + ziel;
        text.append(balken, zahl);
      }
      karte.append(marke, text);
      behaelter.appendChild(karte);
    });
  }

  function zeigen() {
    liste();
    KW.UI.zeige('menue-erfolge');
  }

  /** Nach „Gespeicherte Daten löschen“: Zustand neu aus dem Speicher lesen. */
  function neuLaden() {
    clearTimeout(speicherTimer);
    zustand = null;
    schmutzig = false;
    warteschlange = [];
  }

  /* ---------- Aussehen ---------- */
  const css = document.createElement('style');
  css.textContent = [
    '.erfolg-liste{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.45em;width:min(96%,44em);text-align:left}',
    '.erfolg-karte{display:flex;gap:.6em;align-items:flex-start;padding:.45em .55em;border:2px solid rgba(255,255,255,.15);border-radius:.5em;background:rgba(0,0,0,.35)}',
    '.erfolg-karte.frei{border-color:var(--gelb);background:rgba(255,210,63,.12)}',
    '.erfolg-marke{flex:none;width:2.1em;height:2.1em;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;background:#3a2f27;color:#8d7d6c;border:2px solid #000}',
    '.erfolg-marke.frei{background:var(--gelb);color:#5a3a00}',
    '.erfolg-inhalt{min-width:0;flex:1}',
    '.erfolg-name{font-weight:700;font-size:.9em}',
    '.erfolg-text{font-size:.78em;color:var(--text-leise)}',
    '.erfolg-balken{height:.45em;margin-top:.3em;background:rgba(255,255,255,.15);border-radius:.3em;overflow:hidden}',
    '.erfolg-balken>span{display:block;height:100%;background:var(--akzent)}',
    '.erfolg-stand{font-size:.72em;color:var(--text-leise);margin-top:.15em}',
    '@media (max-width:560px){.erfolg-liste{grid-template-columns:1fr}}',
    '.erfolg-banner{position:absolute;left:50%;top:2.6em;transform:translate(-50%,-220%);opacity:0;z-index:7;pointer-events:none;display:flex;gap:.7em;align-items:center;padding:.5em .9em;background:#2a201a;border:3px solid var(--gelb);border-radius:.6em;box-shadow:0 4px 0 #000;font-size:clamp(11px,2.1cqw,22px);max-width:92%;text-align:left;transition:transform .35s ease,opacity .35s ease}',
    '.erfolg-banner.zu-sehen{transform:translate(-50%,0);opacity:1}',
    '.erfolg-kopf{font-size:.7em;color:var(--gelb);text-transform:uppercase;letter-spacing:.06em}',
    '@media (prefers-reduced-motion:reduce){.erfolg-banner{transform:translate(-50%,0);transition:opacity .2s ease}}'
  ].join('\n');
  document.head.appendChild(css);

  // Beim Verlassen der Seite alles sichern; bei Sprachwechsel die Liste neu aufbauen
  window.addEventListener('pagehide', speichern);
  document.addEventListener('visibilitychange', () => { if (document.hidden) speichern(); });
  if (KW.I18n && KW.I18n.beiWechsel) {
    KW.I18n.beiWechsel.push(() => { if (KW.UI && KW.UI.aktuell === 'menue-erfolge') liste(); });
  }

  KW.Erfolge = { ereignis, zeigen, speichern, neuLaden, ERFOLGE };
})();
