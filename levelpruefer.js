/* =========================================================
   levelpruefer.js – prüft automatisch, ob Level schaffbar sind

   Ein Löser durchsucht jedes Level (Breitensuche) mit der echten
   Spielphysik: Von jeder Standposition aus werden Laufen, kurze
   und lange Sprünge mit unterschiedlicher Lenkung simuliert.
   Bewegliche Plattformen werden über ihre Phase (Zeitpunkt im
   Bewegungszyklus) berücksichtigt, Warten ist ein eigener Schritt.

   Vereinfachungen (bewusst etwas großzügig):
   - Gegner werden ignoriert (man kann sie besiegen oder umgehen).
   - Ziegel/?-Blöcke bleiben unverändert, Bröselplattformen fallen nicht.
   - Ein Anlauf mit voller Geschwindigkeit wird angenommen.
   Zusätzlich gibt es einen Fuzz-Test mit Zufallseingaben, der
   Laufzeitfehler und "in der Wand stecken" aufspürt.
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW;
  const T = KW.TILE;
  const DT = 1 / 120;

  function stachelTreffer(l, s) {
    for (let ty = Math.floor(s.y / T); ty <= Math.floor((s.y + s.h) / T); ty++) {
      for (let tx = Math.floor(s.x / T); tx <= Math.floor((s.x + s.w) / T); tx++) {
        if (l.kachel(tx, ty) === '^' && s.x < tx * T + 28 && s.x + s.w > tx * T + 4 &&
            s.y < ty * T + 32 && s.y + s.h > ty * T + 14) return true;
      }
    }
    return false;
  }

  // Aktionen von einer Standposition aus
  // hj = wie lange die Sprungtaste gehalten wird (4 s = dauerhaft, wichtig für Trampoline)
  const AKTIONEN = [];
  [0, 210].forEach((v0) => [0.1, 0.6, 4].forEach((hj) => [0.1, 0.25, 0.45, 0.7, 1.0].forEach((hd) =>
    AKTIONEN.push({ typ: 'sprung', dir: 1, v0, hj, hd }))));
  [0.2, 0.5].forEach((hd) => AKTIONEN.push({ typ: 'sprung', dir: -1, v0: 0, hj: 0.6, hd }));
  [1, -1].forEach((dir) => [0.15, 0.4].forEach((hd) => [0, 4].forEach((hj) =>
    AKTIONEN.push({ typ: 'lauf', dir, v0: 0, hj, hd }))));

  // Lenken in der Luft nach einem Trampolin-Absprung
  const LUFT_AKTIONEN = [{ typ: 'luft', dir: 1, hd: 0, hj: 4 }, { typ: 'luft', dir: 1, hd: 0, hj: 0 }];
  [1, -1].forEach((dir) => [0.15, 0.3, 0.5, 0.8, 1.2].forEach((hd) => [4, 0].forEach((hj) =>
    LUFT_AKTIONEN.push({ typ: 'luft', dir, hd, hj }))));

  /**
   * Prüft ein Level. Liefert { ok, zustaende, simulationen, weitesteX } (x in Kacheln).
   * Mit { alleMuenzen: true } wird das ganze Level erkundet und zusätzlich
   * `unerreichbar` geliefert: Münzen, die der Löser nie berührt hat.
   */
  function loese(index, optionen) {
    const alleMuenzen = !!(optionen && optionen.alleMuenzen);
    const I = KW.Input;
    const daten = KW.LEVELS[index];
    const L = new KW.Level(daten, index);
    L.gegner = [];
    L.stossVonUnten = () => {};
    L.betreten = () => {};
    L.funken = () => {};
    L.text = () => {};
    let feder = false;
    L.trampolinStoss = () => { feder = true; };
    const P = L.plattformDauer;
    const NPH = 16, dP = P / NPH;
    const z = L.ziel;

    // Nur in der Nähe von Plattformen ist die Phase wichtig
    const phaseWichtig = (x) => L.plattformen.some((p) => x > p.sx - 10 * T && x < p.sx + p.weite + 12 * T);

    const setzeZeit = (t) => {
      L.zeit = t - 1e-4;
      L.update(1e-4, null);
      L.plattformen.forEach((p) => { p.dx = 0; p.dy = 0; });
    };

    const besucht = new Set();
    const schlange = [];
    let weitesteX = 0, simulationen = 0, zielErreicht = false;
    const muenzen = L.muenzen.map((m) => ({ x: m.x, y: m.y, r: m.gross ? 14 : 9, gross: m.gross }));
    const beruehrt = new Set();
    const muenzenPruefen = (s) => {
      for (let m = 0; m < muenzen.length; m++) {
        const c = muenzen[m];
        if (beruehrt.has(m) || Math.abs(c.x - s.x) > 48) continue;
        if (s.x < c.x + c.r && s.x + s.w > c.x - c.r && s.y < c.y + c.r && s.y + s.h > c.y - c.r) beruehrt.add(m);
      }
    };

    function zustandAus(s, ph, gefedert) {
      if (gefedert) {
        // Absprung von einem Trampolin: Position, Kachelreihe und Tempo merken
        const ty = Math.round((s.y + s.h) / T);
        const xb = Math.round(s.x / 8) * 8;
        const vxb = Math.round((s.vx + s.mitnahme) / 35) * 35;
        const phx = phaseWichtig(xb) ? ph : 0;
        return { art: 't', x: xb, ty, vx: vxb, ph: phx, key: 't' + xb + ',' + ty + ',' + vxb + ',' + phx };
      }
      if (s.plattform) {
        const i = L.plattformen.indexOf(s.plattform);
        const off = Math.round((s.x - s.plattform.x) / 8) * 8;
        return { art: 'p', i, off, ph, key: 'p' + i + ',' + off + ',' + ph };
      }
      const ty = Math.round((s.y + s.h) / T);
      const xb = Math.round(s.x / 16) * 16;
      const phx = phaseWichtig(xb) ? ph : 0;
      return { art: 'k', x: xb, ty, ph: phx, key: 'k' + xb + ',' + ty + ',' + phx };
    }

    function hinzu(zst) {
      if (besucht.has(zst.key)) return;
      besucht.add(zst.key);
      schlange.push(zst);
    }

    function sim(start, a) {
      simulationen++;
      setzeZeit(start.ph * dP);
      const s = new KW.Spieler(0, 0);
      if (start.art === 'k') {
        s.x = start.x;
        s.y = start.ty * T - s.h;
      } else if (start.art === 't') {
        // knapp über dem Trampolin, im nächsten Schritt federt die Figur ab
        s.x = start.x;
        s.y = start.ty * T - s.h - 0.5;
        s.vy = 60;
      } else {
        const p = L.plattformen[start.i];
        s.x = p.x + start.off;
        s.y = p.y - s.h;
        s.plattform = p;
      }
      s.amBoden = start.art !== 't';
      s.coyote = start.art !== 't' ? 0.09 : 0;
      s.vx = start.art === 't' ? start.vx : a.v0 * a.dir;
      I.reset();
      if (a.typ === 'sprung') I.flanken.sprung = true;
      let el = 0, abgehoben = false;
      for (let i = 0; i < 480; i++) {
        I.touch.sprung = el < a.hj;
        const halten = el < a.hd;
        I.touch.rechts = a.dir > 0 && halten;
        I.touch.links = a.dir < 0 && halten;
        feder = false;
        L.update(DT, s);
        s.update(DT, L);
        el += DT;
        if (alleMuenzen) muenzenPruefen(s);
        if (feder && el > 0.05) {
          weitesteX = Math.max(weitesteX, s.x / T);
          return zustandAus(s, Math.round((start.ph * dP + el) / dP) % NPH, true);
        }
        if (s.y > L.pixelHoehe || stachelTreffer(L, s)) return null;
        if (z && s.x < z.tx * T + 24 && s.x + s.w > z.tx * T + 8 &&
            s.y < (z.ty + 1) * T && s.y + s.h > (z.ty - 5) * T) return 'ziel';
        if (!s.amBoden) abgehoben = true;
        if (s.amBoden) {
          if (abgehoben && el > 0.03) break;
          if (!abgehoben && el >= a.hd && Math.abs(s.vx + s.mitnahme) < 1 && (!s.plattform || a.typ === 'lauf')) break;
        }
      }
      if (!s.amBoden) return null;
      const ph = Math.round((start.ph * dP + el) / dP) % NPH;
      weitesteX = Math.max(weitesteX, s.x / T);
      return zustandAus(s, ph);
    }

    const ton = KW.Audio.an;
    KW.Audio.an = false;
    try {
      const st = KW.Spieler.ausKachel(L.start.tx, L.start.ty);
      hinzu({ art: 'k', x: Math.round(st.x / 16) * 16, ty: L.start.ty + 1, ph: 0,
        key: 'k' + Math.round(st.x / 16) * 16 + ',' + (L.start.ty + 1) + ',0' });
      while (schlange.length) {
        const zst = schlange.shift();
        // Warten (Plattform-Phase weiterdrehen) – nicht auf Bröselplattformen
        const aufBroesel = zst.art === 'k' && L.kachel(Math.floor((zst.x + 9) / T), zst.ty) === 'C';
        if ((zst.art === 'p' || (zst.art === 'k' && phaseWichtig(zst.x))) && !aufBroesel) {
          const w = Object.assign({}, zst, { ph: (zst.ph + 1) % NPH });
          w.key = w.key.replace(/,\d+$/, ',' + w.ph);
          hinzu(w);
        }
        for (const a of (zst.art === 't' ? LUFT_AKTIONEN : AKTIONEN)) {
          const erg = sim(zst, a);
          if (erg === 'ziel') {
            zielErreicht = true;
            if (!alleMuenzen) return { ok: true, zustaende: besucht.size, simulationen, weitesteX: Math.round(weitesteX) };
            continue;
          }
          if (erg) hinzu(erg);
        }
      }
      const ergebnis = { ok: zielErreicht, zustaende: besucht.size, simulationen, weitesteX: Math.round(weitesteX), breite: L.breite };
      if (alleMuenzen) {
        ergebnis.unerreichbar = muenzen.filter((_, m) => !beruehrt.has(m))
          .map((c) => ({ tx: Math.floor(c.x / T), ty: Math.floor(c.y / T), gross: c.gross }));
        ergebnis.muenzen = muenzen.length;
      }
      return ergebnis;
    } finally {
      KW.Audio.an = ton;
      KW.Input.reset();
    }
  }

  /** Grundlegende Strukturprüfung eines Levels. */
  function struktur(index) {
    const d = KW.LEVELS[index];
    const fehler = [];
    let L;
    try { L = new KW.Level(d, index); } catch (e) { return [e.message]; }
    const zeilen = KW.Level.zusammensetzen(d);
    const anzahl = (zeichen) => zeilen.join('').split(zeichen).length - 1;
    if (anzahl('S') !== 1) fehler.push('genau ein S erwartet, gefunden: ' + anzahl('S'));
    if (anzahl('Z') !== 1) fehler.push('genau ein Z erwartet, gefunden: ' + anzahl('Z'));
    if (anzahl('K') < 1) fehler.push('kein Checkpoint K');
    if (!KW.THEMEN[d.thema]) fehler.push('unbekanntes Thema "' + d.thema + '"');
    const erlaubt = /^[.#B?!C^oOE\-|SKZT]*$/;
    zeilen.forEach((z, r) => { if (!erlaubt.test(z)) fehler.push('unbekanntes Zeichen in Zeile ' + (r + 1)); });
    // Ziel-Tür braucht festen Boden darunter
    if (L.ziel && !L.istFest(L.ziel.tx, L.ziel.ty + 1)) fehler.push('Tür schwebt (kein Boden unter Z)');
    if (L.checkpoints.some((k) => !L.istFest(k.tx, k.ty + 1))) fehler.push('Checkpoint schwebt');
    const s = L.start;
    if (!L.istFest(s.tx, s.ty + 1)) fehler.push('Start schwebt');
    // Zeitlimit grob abschätzen: Laufen mit halber Höchstgeschwindigkeit
    const minZeit = (L.pixelBreite / 105);
    if (L.zeitLimit < minZeit) fehler.push('Zeit wahrscheinlich zu knapp (' + L.zeitLimit + ' s)');
    return fehler;
  }

  /**
   * Fuzz-Test: zufällige Eingaben über das echte Spiel (inkl. Gegner,
   * Blöcke, Bröseln). Prüft auf Ausnahmen, NaN und Feststecken in Wänden.
   */
  function fuzz(index, sekunden, saat) {
    const S = KW.Spiel, I = KW.Input;
    let zufall = saat || 1;
    const rnd = () => { zufall = (zufall * 16807) % 2147483647; return zufall / 2147483647; };
    const probleme = [];
    const ton = KW.Audio.an;
    KW.Audio.an = false;
    const eigenerTest = !KW.Speicher.testAktiv();
    if (eigenerTest) KW.Speicher.testBeginnen(); // echten Spielstand schützen
    try {
      S.neuesSpiel(index);
      S.leben = 99;
      // Mögliche Standplätze im ganzen Level (fester Boden, darüber Luft)
      const l0 = S.level, orte = [];
      for (let tx = 1; tx < l0.breite - 1; tx++) {
        for (let ty = 1; ty < l0.hoehe; ty++) {
          if (l0.istFest(tx, ty) && !l0.istFest(tx, ty - 1) && l0.kachel(tx, ty - 1) !== '^' &&
              !l0.istFest(tx, ty - 2)) orte.push([tx, ty - 1]);
        }
      }
      let rechts = true, links = false, sprung = false, wechsel = 0;
      for (let i = 0; i < sekunden * 120; i++) {
        // Alle 5 s an einen zufälligen Ort springen, damit das ganze Level getestet wird
        if (i % 600 === 0 && S.zustand === 'spielen' && orte.length) {
          const [tx, ty] = orte[Math.floor(rnd() * orte.length)];
          const p = KW.Spieler.ausKachel(tx, ty);
          S.spieler.zuruecksetzen(p.x, p.y);
          S.zeit = S.level.zeitLimit;
        }
        if (--wechsel <= 0) {
          wechsel = 10 + Math.floor(rnd() * 60);
          const r = rnd();
          rechts = r < 0.75; links = r > 0.88;
          sprung = rnd() < 0.5;
          if (sprung) I.flanken.sprung = true;
        }
        I.touch.rechts = rechts; I.touch.links = links; I.touch.sprung = sprung;
        S.update(DT);
        const s = S.spieler;
        if (!s) break;
        if (!Number.isFinite(s.x) || !Number.isFinite(s.y) || !Number.isFinite(S.kamera.x)) {
          probleme.push('NaN bei Schritt ' + i);
          break;
        }
        if (S.zustand === 'spielen') {
          // Steckt die Figur in einer festen Kachel?
          const l = S.level;
          for (let ty = Math.floor((s.y + 2) / T); ty <= Math.floor((s.y + s.h - 2) / T); ty++) {
            for (let tx = Math.floor((s.x + 2) / T); tx <= Math.floor((s.x + s.w - 2) / T); tx++) {
              if (l.istFest(tx, ty) && probleme.length < 5) {
                probleme.push('steckt in Kachel ' + tx + '/' + ty + ' (' + l.kachel(tx, ty) + ') bei x=' + (s.x / T).toFixed(1));
              }
            }
          }
        }
        if (S.zustand === 'ergebnis' || S.zustand === 'gameover') break;
        if (i % 1200 === 0) S.zeichnen(); // auch das Zeichnen prüfen
      }
    } catch (e) {
      probleme.push('Ausnahme: ' + e.message);
    } finally {
      if (eigenerTest) { S.zumHauptmenue(); KW.Speicher.testBeenden(); }
      KW.Audio.an = ton;
      I.reset();
    }
    return probleme;
  }

  /**
   * Prüft alle Level nacheinander und zeigt einen Bericht über dem Spiel.
   * Aufruf: index.html?pruefen
   */
  function bericht() {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;inset:10px;z-index:99;overflow:auto;background:#111c;color:#eee;' +
      'font:13px/1.5 monospace;padding:12px;border:2px solid #e8742a;border-radius:8px';
    box.innerHTML = '<b>Level-Prüfer</b> – läuft …<br>';
    document.body.appendChild(box);
    const zeile = (html) => { box.insertAdjacentHTML('beforeend', html + '<br>'); };
    const ergebnisse = [];
    let i = 0;
    // Der Prüfer spielt echte Level durch – Spielstand, Münzen und Highscore
    // dürfen dabei nicht verändert werden.
    KW.Speicher.testBeginnen();
    function naechstes() {
      if (i >= KW.LEVELS.length) {
        KW.Spiel.zumHauptmenue();
        KW.Speicher.testBeenden();
        KW.UI.aktualisiereHighscore();
        const alleOk = ergebnisse.every((e) => e);
        zeile('<b style="color:' + (alleOk ? '#7dff8a' : '#ff6b6b') + '">' +
          (alleOk ? 'Alle Level bestanden.' : 'Es gibt Probleme (siehe oben).') + '</b>');
        window.KW_PRUEFBERICHT = box.innerText;
        return;
      }
      const d = KW.LEVELS[i];
      const t0 = performance.now();
      const fehler = struktur(i);
      // index.html?pruefen&muenzen prüft zusätzlich, ob jede Münze erreichbar ist (dauert länger)
      const mitMuenzen = /[?&]muenzen\b/.test(window.location.search);
      const l = fehler.length ? { ok: false } : loese(i, { alleMuenzen: mitMuenzen });
      const muenzFehler = l.unerreichbar && l.unerreichbar.length ?
        l.unerreichbar.map((u) => (u.gross ? 'große Münze' : 'Münze') + ' bei Spalte ' + u.tx + '/Zeile ' + (u.ty + 1)) : [];
      if (muenzFehler.length) fehler.push('nicht erreichbar: ' + muenzFehler.join(', '));
      const f = fuzz(i, 90, 7 + i);
      const ok = !fehler.length && l.ok && !f.length;
      ergebnisse.push(ok);
      zeile('<span style="color:' + (ok ? '#7dff8a' : '#ff6b6b') + '">' + (ok ? 'OK  ' : 'FEHLER') + '</span> ' +
        'Level ' + (d.nummer || i + 1) + ' ' + d.name + ' – ' +
        (l.ok ? 'schaffbar' : 'NICHT schaffbar' + (l.weitesteX != null ? ' (hängt bei Spalte ~' + l.weitesteX + ')' : '')) +
        (fehler.length ? ' | Struktur: ' + fehler.join('; ') : '') +
        (f.length ? ' | Fuzz: ' + f.join('; ') : '') +
        ' <span style="opacity:.6">(' + Math.round(performance.now() - t0) + ' ms)</span>');
      i++;
      setTimeout(naechstes, 10);
    }
    setTimeout(naechstes, 50);
  }

  KW.Pruefer = { loese, struktur, fuzz, bericht };
})();
