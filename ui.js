/* =========================================================
   ui.js – Menüs (HTML-Overlays) und HUD (auf dem Canvas)
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW;
  const $ = (id) => document.getElementById(id);

  const UI = {
    spiel: null,
    aktuell: null,

    init(spiel) {
      this.spiel = spiel;
      document.querySelectorAll('[data-aktion]').forEach((knopf) => {
        knopf.addEventListener('click', () => {
          KW.Audio.init();
          KW.Audio.spielen('klick');
          this.aktion(knopf.dataset.aktion);
        });
      });
      this.einstellungenVerknuepfen();
      this.aktualisiereTon();
      this.aktualisiereHighscore();

      // Vollbild nur anbieten, wenn der Browser es kann (z. B. nicht auf dem iPhone)
      const vollbild = $('knopf-vollbild');
      if (!document.fullscreenEnabled) vollbild.hidden = true;
      const vollbildText = () => {
        vollbild.textContent = KW.I18n.t(document.fullscreenElement ? 'ui.fullscreen.exit' : 'ui.fullscreen');
      };
      document.addEventListener('fullscreenchange', vollbildText);

      // Sprache: Auswahlfeld in den Einstellungen; alle festen Texte der Seite übersetzen
      $('einstellung-sprache').addEventListener('change', (e) => KW.I18n.setzen(e.target.value));
      KW.I18n.beiWechsel.push(vollbildText);
      KW.I18n.seite();
    },

    /**
     * Eigener Dialog statt window.confirm/alert – die werden in eingebetteten
     * Seiten (iframes, App-Ansichten) oft stillschweigend blockiert.
     * Liefert ein Promise mit true (OK) oder false (Abbrechen).
     * Ohne `nein` wird nur ein OK-Knopf gezeigt (Hinweis).
     */
    frage(text, ja, nein) {
      const dialog = $('dialog'), jaKnopf = $('dialog-ja'), neinKnopf = $('dialog-nein');
      const vorherFokus = document.activeElement;
      $('dialog-text').textContent = text;
      jaKnopf.textContent = ja || KW.I18n.t('ui.ok');
      neinKnopf.textContent = nein || KW.I18n.t('ui.cancel');
      neinKnopf.hidden = !nein;
      dialog.hidden = false;
      jaKnopf.focus({ preventScroll: true });
      return new Promise((fertig) => {
        const schliessen = (antwort) => {
          dialog.hidden = true;
          jaKnopf.onclick = neinKnopf.onclick = null;
          document.removeEventListener('keydown', taste);
          if (vorherFokus && vorherFokus.focus && document.contains(vorherFokus)) vorherFokus.focus({ preventScroll: true });
          fertig(antwort);
        };
        // Esc schließt nur den Dialog (und nicht zusätzlich das Menü dahinter)
        const taste = (e) => {
          if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); schliessen(false); }
        };
        jaKnopf.onclick = () => schliessen(true);
        neinKnopf.onclick = () => schliessen(false);
        document.addEventListener('keydown', taste);
      });
    },

    hinweis(text) {
      return this.frage(text, KW.I18n.t('ui.ok'), null);
    },

    /** Regler, Auswahlfelder und Schalter mit den Einstellungen verbinden. */
    einstellungenVerknuepfen() {
      // Ton an/aus (eigener Speicherwert, damit alte Einstellungen erhalten bleiben)
      $('einstellung-ton').addEventListener('change', (e) => {
        if (e.target.checked !== KW.Audio.an) KW.Audio.umschalten();
        if (KW.Audio.an) { KW.Audio.init(); KW.Audio.spielen('klick'); }
      });

      document.querySelectorAll('[data-einstellung]').forEach((feld) => {
        const schluessel = feld.dataset.einstellung;
        const ereignis = feld.type === 'checkbox' || feld.tagName === 'SELECT' ? 'change' : 'input';
        feld.addEventListener(ereignis, () => {
          let wert;
          if (feld.type === 'checkbox') wert = feld.checked;
          else if (feld.type === 'range') wert = Number(feld.value);
          else wert = feld.value;
          KW.Einstellungen.setzen(schluessel, wert);
          this.fuelleEinstellungen();
        });
      });
    },

    /** Aktuelle Werte in die Bedienelemente schreiben. */
    fuelleEinstellungen() {
      const w = KW.Einstellungen.werte;
      $('einstellung-sprache').value = KW.I18n.sprache;
      document.querySelectorAll('[data-einstellung]').forEach((feld) => {
        const wert = w[feld.dataset.einstellung];
        if (feld.type === 'checkbox') feld.checked = !!wert;
        else feld.value = wert;
        const ausgabe = feld.parentElement.querySelector('output');
        if (ausgabe) ausgabe.textContent = wert + ' %';
      });
    },

    zeigeEinstellungen() {
      // Merken, ob wir aus dem Haupt- oder dem Pausemenü kommen
      this.einstellungenVon = this.spiel.zustand === 'pause' ? 'menue-pause' : 'menue-start';
      this.fuelleEinstellungen();
      this.aktualisiereTon();
      this.zeige('menue-einstellungen');
    },

    vollbildUmschalten() {
      try {
        if (document.fullscreenElement) document.exitFullscreen();
        else $('spiel').requestFullscreen().catch(() => {});
      } catch (e) {
        /* Vollbild nicht möglich */
      }
    },

    /**
     * Rangliste anzeigen. `tab` ist 'lokal' (dieses Gerät) oder 'online'; die
     * Online-Ansicht gibt es nur, wenn eine Online-Rangliste eingerichtet ist.
     */
    zeigeRangliste(neuerPlatz, tab) {
      const online = tab === 'online' && KW.Online.verfuegbar;
      const token = this.ranglisteToken = (this.ranglisteToken || 0) + 1; // verwirft späte Antworten
      $('rangliste-tabs').hidden = !KW.Online.verfuegbar;
      $('tab-lokal').setAttribute('aria-pressed', String(!online));
      $('tab-online').setAttribute('aria-pressed', String(online));
      $('rangliste-hinweis').textContent = KW.I18n.t(online ? 'rank.online.hint' : 'rank.local');
      const status = $('rangliste-status');
      const inhalt = $('rangliste-inhalt');

      const zeichne = (liste, markiert) => {
        inhalt.innerHTML = '';
        liste.forEach((e, i) => {
          const zeile = document.createElement('tr');
          if (i === markiert) zeile.className = 'neu';
          const datumOk = /^\d{4}-\d{2}-\d{2}$/.test(e.datum || '');
          // Deutsch: TT.MM.JJJJ, sonst das eindeutige Format JJJJ-MM-TT
          const datum = !datumOk ? '' : KW.I18n.sprache === 'de' ? e.datum.split('-').reverse().join('.') : e.datum;
          // textContent statt innerHTML: Namen werden nie als HTML interpretiert
          [i + 1, e.name, e.punkte, e.level || '', datum].forEach((wert) => {
            const zelle = document.createElement('td');
            zelle.textContent = wert;
            zeile.appendChild(zelle);
          });
          inhalt.appendChild(zeile);
        });
      };

      if (!online) {
        const liste = KW.Rangliste.laden();
        zeichne(liste, neuerPlatz);
        status.hidden = true;
        $('rangliste-leer').hidden = liste.length > 0;
      } else {
        zeichne([], -1);
        $('rangliste-leer').hidden = true;
        status.hidden = false;
        status.textContent = KW.I18n.t('rank.loading');
        KW.Online.laden().then((liste) => {
          if (token !== this.ranglisteToken) return;
          zeichne(liste, -1);
          status.hidden = liste.length > 0;
          status.textContent = KW.I18n.t('rank.online.empty');
        }).catch(() => {
          if (token !== this.ranglisteToken) return;
          status.hidden = false;
          status.textContent = KW.I18n.t('rank.online.error');
        });
      }
      this.zeige('menue-rangliste');
    },

    /**
     * Namenseingabe im Game-over- bzw. Ergebnis-Menü.
     * - Reichen die Punkte für die lokale Top 10, trägt man sich dort ein und kann
     *   sich zusätzlich (Haken, nie vorangekreuzt) in die Online-Rangliste eintragen.
     * - Reichen sie nicht, gibt es bei eingerichteter Online-Rangliste nur noch die
     *   Frage, ob man den Punktestand öffentlich veröffentlichen möchte.
     */
    zeigeNamensEingabe(menueId, punkte, level) {
      const menue = $(menueId);
      const form = menue.querySelector('.namens-form');
      const ok = menue.querySelector('.namens-ok');
      ok.hidden = true;
      const platz = KW.Rangliste.platzFuer(punkte);
      const onlineMoeglich = KW.Online.verfuegbar && punkte > 0;
      if (platz < 0 && !onlineMoeglich) {
        form.hidden = true;
        form.onsubmit = null;
        return;
      }
      const nurOnline = platz < 0;
      form.hidden = false;
      form.querySelector('.namens-platz').textContent = platz + 1;
      const pre = form.querySelector('[data-i18n="rank.pre"]');
      const platzZahl = form.querySelector('.namens-platz');
      const post = form.querySelector('.namens-post') || form.querySelector('[data-i18n="rank.post"], [data-i18n="rank.nameOnly"]');
      post.classList.add('namens-post');
      const knopfSenden = form.querySelector('button[type="submit"]');
      const haken = form.querySelector('.online-haken');
      pre.hidden = platzZahl.hidden = nurOnline;
      post.dataset.i18n = nurOnline ? 'rank.nameOnly' : 'rank.post';
      post.textContent = KW.I18n.t(post.dataset.i18n);
      knopfSenden.dataset.i18n = nurOnline ? 'rank.submitOnline' : 'rank.submit';
      knopfSenden.textContent = KW.I18n.t(knopfSenden.dataset.i18n);
      haken.checked = false;                              // Einwilligung nie vorangekreuzt
      haken.parentElement.hidden = nurOnline || !onlineMoeglich;

      const feld = form.querySelector('.namens-feld');
      feld.value = KW.Speicher.lesen('letzterName', '');
      form.onsubmit = (e) => {
        e.preventDefault();
        const imNetz = nurOnline || haken.checked;
        let text = '';
        if (!nurOnline) {
          const p = KW.Rangliste.eintragen(feld.value, punkte, level);
          text = KW.I18n.t('rank.entered', { n: p + 1 });
        } else {
          KW.Speicher.schreiben('letzterName', KW.Rangliste.bereinigeName(feld.value));
        }
        form.hidden = true;
        ok.hidden = false;
        ok.textContent = imNetz ? (text ? text + ' ' : '') + KW.I18n.t('rank.sending') : text;
        KW.Audio.spielen('checkpoint');
        const knopf = menue.querySelector('button:not([hidden])');
        if (knopf) knopf.focus();
        if (imNetz) {
          KW.Online.senden(feld.value, punkte, level).then((r) => {
            const nachricht = !r.ok ? KW.I18n.t('rank.onlineFailed')
              : r.platz ? KW.I18n.t('rank.onlineEntered', { n: r.platz }) : KW.I18n.t('rank.onlineSent');
            ok.textContent = (text ? text + ' ' : '') + nachricht;
          });
        }
      };
      // Auf Touch-Geräten nicht automatisch die Bildschirmtastatur öffnen
      if (!document.body.classList.contains('touch')) feld.focus();
    },

    /** Verarbeitet einen Klick auf einen Menüknopf. */
    aktion(name) {
      const s = this.spiel;
      switch (name) {
        case 'spielen': s.neuesSpiel(0); break;
        case 'levelwahl': this.zeigeLevelwahl(); break;
        case 'editor': KW.Editor.oeffnen(); break;
        case 'erfolge': KW.Erfolge.zeigen(); break;
        case 'steuerung': this.zeige('menue-steuerung'); break;
        case 'rangliste': this.zeigeRangliste(-1, 'lokal'); break;
        case 'ranglisteLokal': this.zeigeRangliste(-1, 'lokal'); break;
        case 'ranglisteOnline': this.zeigeRangliste(-1, 'online'); break;
        case 'shop': this.zeigeShop(); break;
        case 'naechstesKaufen':
          if (KW.Konto.levelKaufen(s.levelIndex + 1)) {
            KW.Audio.spielen('powerup');
            s.naechstesLevel();
          }
          break;
        case 'einstellungen': this.zeigeEinstellungen(); break;
        case 'einstellungenZurueck': this.zeige(this.einstellungenVon || 'menue-start'); break;
        case 'standard': KW.Einstellungen.zuruecksetzen(); this.fuelleEinstellungen(); break;
        case 'vollbild': this.vollbildUmschalten(); break;
        case 'zurueck': this.zeige('menue-start'); break;
        case 'ton': KW.Audio.umschalten(); this.aktualisiereTon(); break;
        case 'pause': s.pausieren(); break;
        case 'weiter': s.fortsetzen(); break;
        case 'neustart': s.levelNeuStarten(); break;
        case 'hauptmenue': s.zumHauptmenue(); break;
        case 'nochmal': s.neuesSpiel(s.levelIndex); break;
        case 'naechstesLevel': s.naechstesLevel(); break;
        case 'datenLoeschen':
          this.frage(KW.I18n.t('data.confirm'), KW.I18n.t('data.yes'), KW.I18n.t('ui.cancel')).then((ja) => {
            if (!ja) return;
            KW.Speicher.allesLoeschen();
            KW.Erfolge.neuLaden();
            KW.Speicher.schreiben('sprache', KW.I18n.sprache); // die Sprache bleibt
            KW.Einstellungen.neuLaden();
            KW.Audio.an = true;
            this.aktualisiereTon();
            this.aktualisiereHighscore();
          });
          break;
        default: break;
      }
    },

    /** Zeigt ein Menü (oder keins bei id = null). */
    zeige(id) {
      document.querySelectorAll('.menue').forEach((m) => m.classList.toggle('sichtbar', m.id === id));
      this.aktuell = id;
      if (id) {
        const erster = $(id).querySelector('button:not([disabled]):not([hidden])');
        if (erster) erster.focus({ preventScroll: true });
      } else if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
    },

    zeigeLevelwahl(fokusIndex) {
      const raster = $('level-raster');
      raster.innerHTML = '';
      const konto = KW.Konto.muenzen();
      let fokus = null;
      KW.LEVELS.forEach((lv, i) => {
        const knopf = document.createElement('button');
        const status = KW.Konto.levelStatus(i);
        const preis = KW.Konto.levelPreis(i);
        const nummer = lv.nummer || i + 1;
        knopf.className = 'knopf' + (status === 'kaufbar' ? ' kaufbar' : '') +
          (status === 'kaufbar' && preis > konto ? ' zu-teuer' : '');
        let zusatz = '';
        const levelName = KW.I18n.levelName(nummer, lv.name);
        if (status === 'kaufbar') zusatz = '<small class="preis">' + KW.I18n.t('lv.unlockPrice', { p: preis }) + '</small>';
        else if (status === 'gesperrt') zusatz = '<small>&#128274; ' + KW.I18n.t('lv.locked') + '</small>';
        knopf.disabled = status === 'gesperrt';
        knopf.innerHTML = KW.I18n.t('lv.level', { n: nummer }) + '<small>' + levelName + '</small>' + zusatz;
        knopf.addEventListener('click', () => {
          if (status === 'frei') {
            KW.Audio.spielen('klick');
            this.spiel.neuesSpiel(i);
          } else if (konto < preis) {
            KW.Audio.spielen('block');
            this.hinweis(KW.I18n.t('lv.missing', { n: preis - konto }));
          } else {
            this.frage(KW.I18n.t('lv.confirm', { n: nummer, name: levelName, p: preis }),
              KW.I18n.t('lv.unlockBtn'), KW.I18n.t('ui.cancel')).then((ja) => {
              if (!ja || !KW.Konto.levelKaufen(i)) return;
              KW.Audio.spielen('powerup');
              this.zeigeLevelwahl(i);
            });
          }
        });
        if (i === fokusIndex) fokus = knopf;
        raster.appendChild(knopf);
      });
      this.aktualisiereKonto();
      this.zeige('menue-levelwahl');
      if (fokus) fokus.focus({ preventScroll: true });
    },

    /** Skin-Shop: Vorschau, Kaufen und Auswählen. */
    zeigeShop(fokusId) {
      const raster = $('skin-raster');
      raster.innerHTML = '';
      let fokusKnopf = null;
      const aktiv = KW.Konto.aktiverSkin().id;
      // Vorschau-Bild eines Skins; Regenbogen-Skins werden unten laufend neu gezeichnet
      const zeichneVorschau = (leinwand, sk) => {
        const g = leinwand.getContext('2d');
        g.clearRect(0, 0, 24, 32);
        g.drawImage(KW.Grafik.spielerBild('stehen', false, sk), 0, 0);
      };
      const animiert = [];
      // Code-Einlösefeld
      const codeForm = $('code-form'), codeFeld = $('code-feld');
      codeForm.onsubmit = (e) => {
        e.preventDefault();
        const ergebnis = KW.Konto.codeEinloesen(codeFeld.value);
        codeFeld.value = '';
        if (ergebnis.status === 'neu' && ergebnis.skin) {
          KW.Audio.spielen('powerup');
          this.zeigeShop(ergebnis.skin.id);
          this.hinweis(KW.I18n.t('shop.redeemed', { name: KW.I18n.skinName(ergebnis.skin) }));
        } else if (ergebnis.status === 'neu') {
          KW.Audio.spielen('powerup');
          this.zeigeShop();   // aktualisiert auch den Münzstand
          this.hinweis(KW.I18n.t('shop.coinsRedeemed', { n: ergebnis.muenzen }));
        } else if (ergebnis.status === 'schon' && ergebnis.skin) {
          KW.Audio.spielen('klick');
          this.hinweis(KW.I18n.t('shop.already', { name: KW.I18n.skinName(ergebnis.skin) }));
        } else if (ergebnis.status === 'schon') {
          KW.Audio.spielen('klick');
          this.hinweis(KW.I18n.t('shop.coinsAlready'));
        } else {
          KW.Audio.spielen('block');
          this.hinweis(KW.I18n.t('shop.invalid'));
        }
      };
      KW.Konto.sichtbareSkins().forEach((skin) => {
        const karte = document.createElement('div');
        karte.className = 'skin-karte' + (skin.id === aktiv ? ' aktiv' : '');
        // Vorschau: das echte Spielfigur-Sprite in den Skin-Farben
        const vorschau = document.createElement('canvas');
        vorschau.width = 24;
        vorschau.height = 32;
        zeichneVorschau(vorschau, skin);
        if (skin.animiert) animiert.push([vorschau, skin]);
        const name = document.createElement('span');
        name.className = 'skin-name';
        name.textContent = KW.I18n.skinName(skin);
        const knopf = document.createElement('button');
        knopf.className = 'knopf klein';
        if (skin.animiert) karte.classList.add('spezial');
        const besitzt = KW.Konto.besitzt(skin.id);
        if (skin.id === aktiv) {
          knopf.textContent = KW.I18n.t('shop.selected');
          knopf.disabled = true;
        } else if (besitzt) {
          knopf.textContent = KW.I18n.t('shop.select');
        } else {
          knopf.textContent = KW.I18n.t('shop.price', { p: skin.preis });
          knopf.classList.add('kaufbar');
          if (skin.preis > KW.Konto.muenzen()) knopf.classList.add('zu-teuer');
        }
        knopf.addEventListener('click', () => {
          if (besitzt) {
            KW.Konto.skinWaehlen(skin.id);
            KW.Audio.spielen('klick');
            this.zeigeShop(skin.id);
          } else if (KW.Konto.muenzen() < skin.preis) {
            KW.Audio.spielen('block');
            this.hinweis(KW.I18n.t('shop.missing', { name: KW.I18n.skinName(skin), n: skin.preis - KW.Konto.muenzen() }));
          } else {
            this.frage(KW.I18n.t('shop.confirm', { name: KW.I18n.skinName(skin), p: skin.preis }),
              KW.I18n.t('shop.buy'), KW.I18n.t('ui.cancel')).then((ja) => {
              if (!ja || !KW.Konto.skinKaufen(skin.id)) return;
              KW.Audio.spielen('powerup');
              this.zeigeShop(skin.id);
              // Frisch gekauft: gleich zum Zeichnen einladen
              if (skin.eigen) KW.SkinEditor.oeffnen({ beiSchliessen: () => this.zeigeShop(skin.id) });
            });
          }
        });
        if (skin.id === fokusId) fokusKnopf = knopf;
        karte.append(vorschau, name, knopf);
        // Der eigene Skin lässt sich nach dem Kauf jederzeit bearbeiten
        if (skin.eigen && besitzt) {
          const bearbeiten = document.createElement('button');
          bearbeiten.className = 'knopf klein';
          bearbeiten.style.marginTop = '4px';
          bearbeiten.textContent = KW.I18n.t('shop.edit');
          bearbeiten.addEventListener('click', () => {
            KW.Audio.spielen('klick');
            KW.SkinEditor.oeffnen({ beiSchliessen: () => this.zeigeShop(skin.id) });
          });
          karte.append(bearbeiten);
        }
        raster.appendChild(karte);
      });
      // Regenbogen-Vorschau animieren, solange der Shop offen ist
      clearInterval(this.shopTimer);
      this.shopTimer = null;
      if (animiert.length) {
        this.shopTimer = setInterval(() => {
          if (this.aktuell !== 'menue-shop') { clearInterval(this.shopTimer); this.shopTimer = null; return; }
          animiert.forEach(([leinwand, sk]) => zeichneVorschau(leinwand, sk));
        }, 100);
      }
      this.aktualisiereKonto();
      this.zeige('menue-shop');
      // Nach Kauf/Auswahl bleibt der Fokus auf der Karte (der Knopf ist dann "Ausgewählt")
      if (fokusKnopf) (fokusKnopf.disabled ? $('menue-shop').querySelector('[data-aktion="zurueck"]') : fokusKnopf).focus({ preventScroll: true });
    },

    zeigeGameOver(punkte, rekord, levelNummer) {
      $('go-punkte').textContent = punkte;
      $('go-rekord').hidden = !rekord;
      this.aktualisiereHighscore();
      this.zeige('menue-gameover');
      this.zeigeNamensEingabe('menue-gameover', punkte, levelNummer);
    },

    zeigeGeschafft(info) {
      $('gs-titel').textContent = KW.I18n.t('gs.title', { n: info.nummer });
      $('gs-muenzen').textContent = '+' + info.verdient;
      $('gs-bonus').textContent = info.restzeit + ' s × 5 = +' + info.bonus;
      $('gs-punkte').textContent = info.punkte;
      $('gs-rekord').hidden = !info.rekord;
      $('gs-ende').hidden = !info.letztes;
      const geist = info.geist;
      $('gs-zeit').textContent = geist ? KW.Geist.format(geist.zeit) : '–';
      $('gs-bestzeit').textContent = geist && geist.bestzeit !== null ? KW.Geist.format(geist.bestzeit) : '–';
      $('gs-neuezeit').hidden = !(geist && geist.neu);

      // Nächstes Level: direkt weiter, freischalten oder (zu wenig Münzen) Hinweis
      const status = info.letztes ? 'ende' : KW.Konto.levelStatus(info.naechstes);
      const preis = info.letztes ? 0 : KW.Konto.levelPreis(info.naechstes);
      const fehlt = preis - KW.Konto.muenzen();
      $('gs-weiter').hidden = status !== 'frei';
      $('gs-kaufen').hidden = status !== 'kaufbar' || fehlt > 0;
      $('gs-kaufen').textContent = KW.I18n.t('gs.unlock', { n: info.nummer + 1, p: preis });
      $('gs-fehlt').hidden = status !== 'kaufbar' || fehlt <= 0;
      $('gs-fehlt').textContent = KW.I18n.t('gs.missing', { n: info.nummer + 1, p: preis, m: fehlt });

      this.aktualisiereHighscore();
      this.aktualisiereKonto();
      this.zeige('menue-geschafft');
      // Nach dem letzten Level endet der Durchgang -> Eintrag in die Rangliste
      if (info.letztes) {
        this.zeigeNamensEingabe('menue-geschafft', info.punkte, info.nummer);
      } else {
        $('menue-geschafft').querySelector('.namens-form').hidden = true;
        $('menue-geschafft').querySelector('.namens-ok').hidden = true;
      }
    },

    aktualisiereTon() {
      $('einstellung-ton').checked = KW.Audio.an;
    },

    aktualisiereHighscore() {
      const hs = KW.Speicher.lesen('highscore', 0);
      document.querySelectorAll('.anzeige-highscore').forEach((e) => { e.textContent = hs; });
      this.aktualisiereKonto();
    },

    aktualisiereKonto() {
      const stand = KW.Konto.muenzen();
      document.querySelectorAll('.anzeige-konto').forEach((e) => { e.textContent = stand; });
    },

    /* ---------- HUD (wird in Spielkoordinaten 640x360 gezeichnet) ---------- */
    zeichneHUD(g, s, kx, ky) {
      const text = KW.Grafik.text;
      const l = s.level;

      // Punkte-Texte im Spielfeld
      for (const t of l.texte) {
        g.globalAlpha = Math.min(1, t.leben * 2);
        text(g, t.inhalt, t.x - kx, t.y - ky, 10, t.farbe, 'center');
      }
      g.globalAlpha = 1;

      // Leiste oben
      g.fillStyle = 'rgba(0,0,0,0.45)';
      g.fillRect(0, 0, 640, 22);
      text(g, KW.I18n.t('hud.score') + ' ' + String(s.punkte).padStart(6, '0'), 8, 11, 12, '#fff');

      g.imageSmoothingEnabled = false;
      g.drawImage(KW.Grafik.muenzBild(false), 150, 4, 14, 14);
      text(g, '× ' + s.muenzen, 168, 11, 12, '#ffd23f');

      g.drawImage(KW.Grafik.herzBild(), 222, 5, 14, 12);
      text(g, '× ' + Math.max(0, s.leben), 240, 11, 12, '#ff8a8a');

      text(g, KW.I18n.t('hud.level') + ' ' + l.nummer + ': ' + KW.I18n.levelName(l.nummer, l.name), 290, 11, 12, '#fff');

      const zeit = Math.ceil(s.zeit);
      text(g, KW.I18n.t('hud.time') + ' ' + zeit, 632, 11, 12, zeit <= 30 ? '#ff6b6b' : '#fff', 'right');

      // Doppelsprung-Anzeige
      const ds = s.spieler ? s.spieler.dsZeit : 0;
      if (ds > 0) {
        text(g, KW.I18n.t('hud.double'), 8, 32, 10, '#ffd23f');
        g.fillStyle = 'rgba(0,0,0,0.5)';
        g.fillRect(90, 28, 82, 8);
        g.fillStyle = '#ffd23f';
        g.fillRect(91, 29, Math.round(80 * ds / 10), 6);
      }

      // Bilder pro Sekunde (optional)
      if (KW.Einstellungen.werte.fps) {
        text(g, 'FPS ' + Math.round(s.fps), 632, 32, 10, '#7dff8a', 'right');
      }
    }
  };

  KW.UI = UI;
})();
