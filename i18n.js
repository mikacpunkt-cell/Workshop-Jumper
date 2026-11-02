/* =========================================================
   i18n.js – Sprachen (Englisch ist Standard, Deutsch wählbar)
   - Beim allerersten Start ist das Spiel immer Englisch, egal
     welche Sprache der Browser hat.
   - Die Wahl wird im Menü „Settings / Einstellungen“ getroffen
     und lokal gespeichert (Schlüssel „sprache“).
   - Feste Texte in index.html tragen data-i18n="schlüssel"
     (Text), data-i18n-aria="schlüssel" (aria-label).
   - Texte im Code: KW.I18n.t('schlüssel', { platzhalter: wert })
   Neue Sprache: Eintrag in TEXTE, SPRACHEN und im Auswahlfeld
   #einstellung-sprache in index.html ergänzen.
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW = window.KW || {};

  const SPRACHEN = ['en', 'de'];

  const TEXTE = {
    en: {
      'head.title': 'Werkstatt-Hüpfer – a jump & run by KreativWerkstatt Ried',
      'head.desc': 'Werkstatt-Hüpfer: a small 2D jump-and-run browser game by KreativWerkstatt Ried e.V.',
      'head.sub': 'A jump & run by KreativWerkstatt Ried',
      'aria.canvas': 'Game area',
      'aria.done': 'Level complete',

      'menu.tagline': 'Help the little craftsman through the KreativWerkstatt!',
      'menu.play': 'Play',
      'menu.levels': 'Select level',
      'menu.skins': 'Skins',
      'menu.leaderboard': 'Leaderboard',
      'menu.settings': 'Settings',
      'menu.controls': 'Controls',
      'menu.deleteData': 'Delete saved data',
      'menu.highscore': 'Highscore:',
      'menu.coins': 'Coins:',
      'menu.main': 'Main menu',
      'back': 'Back',
      'coins.yours': 'Your coins:',

      'lv.hint': 'Finished a level? Then unlock the next one with coins.',
      'lv.level': 'Level {n}',
      'lv.unlockPrice': 'Unlock: {p} coins',
      'lv.locked': 'locked',
      'lv.missing': 'You still need {n} coins. Replay finished levels and collect more!',
      'lv.confirm': 'Unlock level {n} ({name}) for {p} coins?',
      'lv.unlockBtn': 'Unlock',

      'shop.codeLabel': 'Redeem code:',
      'shop.redeemBtn': 'Redeem',
      'shop.redeemed': 'Code redeemed! You got the skin “{name}” and are wearing it now.',
      'shop.already': 'You have already redeemed this code – you can find the skin “{name}” in the list.',
      'shop.invalid': 'This code is not valid. Please check the spelling.',
      'shop.coinsRedeemed': 'Code redeemed! You got {n} coins.',
      'shop.coinsAlready': 'You have already redeemed this code.',
      'shop.selected': 'Selected',
      'shop.select': 'Select',
      'shop.price': '{p} coins',
      'shop.missing': 'You still need {n} coins for “{name}”.',
      'shop.confirm': 'Buy the skin “{name}” for {p} coins and wear it?',
      'shop.buy': 'Buy',

      'ctl.walk.k': 'Walk',
      'ctl.walk.v': 'Arrow keys ← → or A / D',
      'ctl.jump.k': 'Jump',
      'ctl.jump.v': 'Space, ↑ or W – hold longer = jump higher',
      'ctl.pause.k': 'Pause',
      'ctl.pause.v': 'P or Esc',
      'ctl.phone.k': 'Phone',
      'ctl.phone.v': 'Touch buttons at the bottom: left (walk) and right (jump)',
      'ctl.tip1': 'Bump bricks and ? blocks from below.',
      'ctl.tip2': 'Jump on enemies to defeat them (+50).',
      'ctl.tip3': 'The spring gives you 10\u00a0seconds of double jump.',
      'ctl.tip4': 'Touch the flag – that is where you continue after a mistake.',
      'ctl.tip5': 'Trampoline: hold the jump button and you fly really high.',
      'ctl.tip6': 'Coins go to your account – use them to unlock levels and buy skins.',

      'points': 'Points',
      'rank.th.name': 'Name',
      'rank.th.date': 'Date',
      'rank.empty': 'No entries yet – start playing!',
      'rank.local': 'The leaderboard is only saved on this device.',
      'rank.pre': 'Place',
      'rank.post': 'on the leaderboard! Your name:',
      'rank.submit': 'Submit',
      'rank.entered': 'Entered: place {n} on the leaderboard!',
      'rank.anon': 'Anonymous',
      'rank.tab.local': 'This device',
      'rank.tab.online': 'Online',
      'rank.loading': 'Loading …',
      'rank.online.error': 'The online leaderboard cannot be reached right now.',
      'rank.online.empty': 'No online entries yet – be the first!',
      'rank.online.hint': 'Online entries are public: nickname, points, level and date.',
      'rank.onlineCheck': 'Also show my entry on the public online leaderboard (use a nickname – everyone can see it)',
      'rank.nameOnly': 'Publish your score on the public online leaderboard? Your nickname:',
      'rank.submitOnline': 'Publish',
      'rank.sending': 'Sending …',
      'rank.onlineEntered': 'Online: place {n}!',
      'rank.onlineSent': 'Sent to the online leaderboard!',
      'rank.onlineFailed': 'Could not send to the online leaderboard.',

      'set.language': 'Language',
      'set.sound': 'Sound on',
      'set.volume': 'Volume',
      'set.brightness': 'Brightness',
      'set.contrast': 'Contrast',
      'set.saturation': 'Color saturation',
      'set.quality': 'Graphics quality',
      'set.q.high': 'High',
      'set.q.low': 'Low (faster)',
      'set.pixel': 'Pixel rendering',
      'set.p.sharp': 'Sharp (retro)',
      'set.p.soft': 'Soft',
      'set.crt': 'Old TV effect',
      'set.fps': 'Show FPS',
      'set.defaults': 'Default values',
      'ui.fullscreen': 'Fullscreen',
      'ui.fullscreen.exit': 'Exit fullscreen',
      'ui.ok': 'OK',
      'ui.cancel': 'Cancel',

      'pause.resume': 'Resume',
      'pause.restart': 'Restart level',

      'go.points': 'Points:',
      'go.newHigh': 'New highscore!',
      'go.again': 'Try again',

      'gs.title': 'Level {n} complete!',
      'gs.coins': 'Coins collected',
      'gs.balance': 'Coin balance',
      'gs.timebonus': 'Time bonus',
      'gs.end': 'You finished all levels – awesome!',
      'gs.next': 'Next level',
      'gs.unlock': 'Unlock level {n} ({p} coins)',
      'gs.missing': 'You need {p} coins for level {n} – you still need {m}. Replay finished levels and collect more!',

      'data.confirm': 'Really delete highscore, leaderboard, coins, skins, unlocked levels and settings?',
      'data.yes': 'Yes, delete',

      'hud.score': 'SCORE',
      'hud.level': 'LEVEL',
      'hud.time': 'TIME',
      'hud.double': 'DOUBLE JUMP',
      'hud.doubleJump': 'DOUBLE JUMP!',
      'hud.checkpoint': 'CHECKPOINT',

      'hint.rotate': 'Tip: turn your phone sideways to make the playing field bigger.',
      'foot.imprint': 'Legal notice',
      'foot.privacy': 'Privacy'
    },

    de: {
      'head.title': 'Werkstatt-Hüpfer – ein Jump & Run der KreativWerkstatt Ried',
      'head.desc': 'Werkstatt-Hüpfer: ein kleines 2D-Jump-and-Run-Browserspiel der KreativWerkstatt Ried e.V.',
      'head.sub': 'Ein Jump & Run der KreativWerkstatt Ried',
      'aria.canvas': 'Spielfläche',
      'aria.done': 'Level geschafft',

      'menu.tagline': 'Hilf dem kleinen Handwerker durch die KreativWerkstatt!',
      'menu.play': 'Spielen',
      'menu.levels': 'Level wählen',
      'menu.skins': 'Skins',
      'menu.leaderboard': 'Rangliste',
      'menu.settings': 'Einstellungen',
      'menu.controls': 'Steuerung',
      'menu.deleteData': 'Gespeicherte Daten löschen',
      'menu.highscore': 'Highscore:',
      'menu.coins': 'Münzen:',
      'menu.main': 'Hauptmenü',
      'back': 'Zurück',
      'coins.yours': 'Deine Münzen:',

      'lv.hint': 'Level geschafft? Dann das nächste mit Münzen freischalten.',
      'lv.level': 'Level {n}',
      'lv.unlockPrice': 'Freischalten: {p} Münzen',
      'lv.locked': 'gesperrt',
      'lv.missing': 'Dir fehlen noch {n} Münzen. Spiel geschaffte Level noch einmal und sammle mehr!',
      'lv.confirm': 'Level {n} ({name}) für {p} Münzen freischalten?',
      'lv.unlockBtn': 'Freischalten',

      'shop.codeLabel': 'Code einlösen:',
      'shop.redeemBtn': 'Einlösen',
      'shop.redeemed': 'Code eingelöst! Du hast den Skin „{name}“ bekommen und trägst ihn jetzt.',
      'shop.already': 'Diesen Code hast du schon eingelöst – den Skin „{name}“ findest du in der Liste.',
      'shop.invalid': 'Dieser Code ist ungültig. Bitte prüfe die Schreibweise.',
      'shop.coinsRedeemed': 'Code eingelöst! Du hast {n} Münzen bekommen.',
      'shop.coinsAlready': 'Diesen Code hast du schon eingelöst.',
      'shop.selected': 'Ausgewählt',
      'shop.select': 'Auswählen',
      'shop.price': '{p} Münzen',
      'shop.missing': 'Für „{name}“ fehlen dir noch {n} Münzen.',
      'shop.confirm': 'Skin „{name}“ für {p} Münzen kaufen und anziehen?',
      'shop.buy': 'Kaufen',

      'ctl.walk.k': 'Laufen',
      'ctl.walk.v': 'Pfeiltasten ← → oder A / D',
      'ctl.jump.k': 'Springen',
      'ctl.jump.v': 'Leertaste, ↑ oder W – länger halten = höher springen',
      'ctl.pause.k': 'Pause',
      'ctl.pause.v': 'P oder Esc',
      'ctl.phone.k': 'Handy',
      'ctl.phone.v': 'Touch-Knöpfe unten links (laufen) und rechts (springen)',
      'ctl.tip1': 'Stoß Ziegel und ?-Blöcke von unten an.',
      'ctl.tip2': 'Spring auf Gegner, um sie zu besiegen (+50).',
      'ctl.tip3': 'Die Sprungfeder schenkt dir 10\u00a0Sekunden Doppelsprung.',
      'ctl.tip4': 'Berühre die Fahne – dort geht es nach einem Fehler weiter.',
      'ctl.tip5': 'Trampolin: Sprungtaste gedrückt halten, dann fliegst du richtig hoch.',
      'ctl.tip6': 'Münzen landen auf deinem Konto – damit schaltest du Level frei und kaufst Skins.',

      'points': 'Punkte',
      'rank.th.name': 'Name',
      'rank.th.date': 'Datum',
      'rank.empty': 'Noch keine Einträge – spiel los!',
      'rank.local': 'Die Rangliste wird nur auf diesem Gerät gespeichert.',
      'rank.pre': 'Platz',
      'rank.post': 'in der Rangliste! Dein Name:',
      'rank.submit': 'Eintragen',
      'rank.entered': 'Eingetragen: Platz {n} der Rangliste!',
      'rank.anon': 'Anonym',
      'rank.tab.local': 'Dieses Gerät',
      'rank.tab.online': 'Online',
      'rank.loading': 'Lade …',
      'rank.online.error': 'Die Online-Rangliste ist gerade nicht erreichbar.',
      'rank.online.empty': 'Noch keine Online-Einträge – sei die oder der Erste!',
      'rank.online.hint': 'Online-Einträge sind öffentlich: Spitzname, Punkte, Level und Datum.',
      'rank.onlineCheck': 'Meinen Eintrag auch in der öffentlichen Online-Rangliste zeigen (nimm einen Spitznamen – alle können ihn sehen)',
      'rank.nameOnly': 'Punktestand in der öffentlichen Online-Rangliste veröffentlichen? Dein Spitzname:',
      'rank.submitOnline': 'Veröffentlichen',
      'rank.sending': 'Wird gesendet …',
      'rank.onlineEntered': 'Online: Platz {n}!',
      'rank.onlineSent': 'An die Online-Rangliste gesendet!',
      'rank.onlineFailed': 'Senden an die Online-Rangliste hat nicht geklappt.',

      'set.language': 'Sprache',
      'set.sound': 'Ton an',
      'set.volume': 'Lautstärke',
      'set.brightness': 'Helligkeit',
      'set.contrast': 'Kontrast',
      'set.saturation': 'Farbsättigung',
      'set.quality': 'Grafikqualität',
      'set.q.high': 'Hoch',
      'set.q.low': 'Niedrig (schneller)',
      'set.pixel': 'Pixel-Darstellung',
      'set.p.sharp': 'Scharf (Retro)',
      'set.p.soft': 'Weich',
      'set.crt': 'Röhrenfernseher-Effekt',
      'set.fps': 'FPS anzeigen',
      'set.defaults': 'Standardwerte',
      'ui.fullscreen': 'Vollbild',
      'ui.fullscreen.exit': 'Vollbild beenden',
      'ui.ok': 'OK',
      'ui.cancel': 'Abbrechen',

      'pause.resume': 'Weiterspielen',
      'pause.restart': 'Level neu starten',

      'go.points': 'Punkte:',
      'go.newHigh': 'Neuer Highscore!',
      'go.again': 'Nochmal versuchen',

      'gs.title': 'Level {n} geschafft!',
      'gs.coins': 'Münzen gesammelt',
      'gs.balance': 'Münzkonto',
      'gs.timebonus': 'Zeitbonus',
      'gs.end': 'Du hast alle Level geschafft – super!',
      'gs.next': 'Nächstes Level',
      'gs.unlock': 'Level {n} freischalten ({p} Münzen)',
      'gs.missing': 'Für Level {n} brauchst du {p} Münzen – es fehlen noch {m}. Spiel geschaffte Level noch einmal und sammle mehr!',

      'data.confirm': 'Highscore, Rangliste, Münzen, Skins, freigeschaltete Level und Einstellungen wirklich löschen?',
      'data.yes': 'Ja, löschen',

      'hud.score': 'PUNKTE',
      'hud.level': 'LEVEL',
      'hud.time': 'ZEIT',
      'hud.double': 'DOPPELSPRUNG',
      'hud.doubleJump': 'DOPPELSPRUNG!',
      'hud.checkpoint': 'CHECKPOINT',

      'hint.rotate': 'Tipp: Dreh dein Handy quer, dann wird das Spielfeld größer.',
      'foot.imprint': 'Impressum',
      'foot.privacy': 'Datenschutz'
    }
  };

  /* Namen der Level und Skins: Deutsch steht in den Level-/Skin-Daten selbst,
     hier stehen nur die englischen Namen (Schlüssel: Levelnummer bzw. Skin-ID). */
  const LEVELNAMEN_EN = {
    1: 'Workshop', 2: 'Wood Store', 3: 'Paint Studio', 4: 'Pottery', 5: 'Attic',
    6: 'Metal Shop', 7: 'Sewing Room', 8: 'Electronics Lab', 9: 'Paint Booth', 10: 'Kiln',
    11: 'Welding Corner', 12: 'Fabric Store', 13: 'Soldering Station', 14: 'Sawmill', 15: 'Material Store',
    16: 'Glaze Kitchen', 17: 'Forge', 18: 'Server Room', 19: 'Rafters', 20: 'Showcase',
    21: 'Crate Storage', 22: 'Print Shop', 23: 'Foundry', 24: 'Test Bench', 25: 'Master Exam'
  };
  const SKINNAMEN_EN = {
    handwerker: 'Craftsman', malerin: 'Painter', schreiner: 'Carpenter', naeherin: 'Seamstress',
    toepferin: 'Potter', holzfaeller: 'Lumberjack', bauarbeiter: 'Builder', schweisser: 'Welder',
    frost: 'Frost Master', elektronikerin: 'Electrician', pirat: 'Pirate', ninja: 'Ninja',
    nachtschicht: 'Night Shift', vulkan: 'Volcano', astronaut: 'Astronaut', roboter: 'Robot',
    gold: 'Golden Master', dev: 'Developer', shiny: 'Shiny'
  };

  const I18n = {
    sprache: 'en',
    SPRACHEN,
    TEXTE,
    /** Wird nach jedem Sprachwechsel aufgerufen (z. B. für Knopftexte, die per Code gesetzt werden). */
    beiWechsel: [],

    /** Gespeicherte Sprache laden – ohne Speicherwert immer Englisch. */
    init() {
      const gespeichert = KW.Speicher.lesen('sprache', null);
      this.sprache = SPRACHEN.indexOf(gespeichert) >= 0 ? gespeichert : 'en';
    },

    /** Text zum Schlüssel; {platzhalter} werden ersetzt. Fehlt der Schlüssel, gilt Englisch. */
    t(schluessel, werte) {
      let text = TEXTE[this.sprache][schluessel];
      if (text == null) text = TEXTE.en[schluessel];
      if (text == null) return schluessel;
      if (werte) {
        text = text.replace(/\{(\w+)\}/g, (treffer, name) => (name in werte ? werte[name] : treffer));
      }
      return text;
    },

    levelName(nummer, deutsch) {
      return this.sprache === 'en' && LEVELNAMEN_EN[nummer] ? LEVELNAMEN_EN[nummer] : (deutsch || '');
    },

    skinName(skin) {
      return this.sprache === 'en' && SKINNAMEN_EN[skin.id] ? SKINNAMEN_EN[skin.id] : skin.name;
    },

    /** Sprache wechseln, speichern und die ganze Seite übersetzen. */
    setzen(sprache) {
      if (SPRACHEN.indexOf(sprache) < 0) return;
      this.sprache = sprache;
      KW.Speicher.schreiben('sprache', sprache);
      this.seite();
    },

    /** Alle festen Texte der Seite in die aktuelle Sprache bringen. */
    seite() {
      document.documentElement.lang = this.sprache;
      document.title = this.t('head.title');
      const beschreibung = document.querySelector('meta[name="description"]');
      if (beschreibung) beschreibung.setAttribute('content', this.t('head.desc'));
      document.querySelectorAll('[data-i18n]').forEach((e) => { e.textContent = this.t(e.dataset.i18n); });
      document.querySelectorAll('[data-i18n-aria]').forEach((e) => { e.setAttribute('aria-label', this.t(e.dataset.i18nAria)); });
      this.beiWechsel.forEach((f) => f());
    }
  };

  I18n.init();
  KW.I18n = I18n;
})();
