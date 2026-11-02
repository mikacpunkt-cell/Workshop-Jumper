/* =========================================================
   rangliste.js – lokale Rangliste (Top 10; die Online-Rangliste steht in online.js)
   Die Einträge (Name, Punkte, erreichtes Level, Datum) werden
   nur im localStorage dieses Browsers gespeichert.
   ========================================================= */
(function () {
  'use strict';
  const KW = window.KW;
  const MAX = 10;
  const MAX_NAME = 12;

  const Rangliste = {
    MAX_NAME,

    /** Gespeicherte Liste laden und auf gültige Einträge prüfen. */
    laden() {
      const liste = KW.Speicher.lesen('rangliste', []);
      if (!Array.isArray(liste)) return [];
      return liste
        .filter((e) => e && typeof e.name === 'string' && Number.isFinite(e.punkte))
        .sort((a, b) => b.punkte - a.punkte)
        .slice(0, MAX);
    },

    /** Platz (0-basiert), den diese Punktzahl bekäme – oder -1. */
    platzFuer(punkte) {
      if (!(punkte > 0)) return -1;
      const liste = this.laden();
      let platz = liste.findIndex((e) => punkte > e.punkte);
      if (platz === -1) platz = liste.length;
      return platz < MAX ? platz : -1;
    },

    /** Name säubern (Steuerzeichen raus, auf MAX_NAME Zeichen kürzen, Ersatzname bei leerer Eingabe). */
    bereinigeName(name) {
      const sauber = String(name || '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
      return Array.from(sauber).slice(0, MAX_NAME).join('').trim() || KW.I18n.t('rank.anon');
    },

    /** Neuen Eintrag speichern; liefert den Platz (0-basiert) oder -1. */
    eintragen(name, punkte, level) {
      const platz = this.platzFuer(punkte);
      if (platz < 0) return -1;
      const sauber = this.bereinigeName(name);
      const liste = this.laden();
      liste.splice(platz, 0, {
        name: sauber,
        punkte,
        level,
        datum: new Date().toISOString().slice(0, 10)
      });
      KW.Speicher.schreiben('rangliste', liste.slice(0, MAX));
      KW.Speicher.schreiben('letzterName', sauber);
      return platz;
    }
  };

  KW.Rangliste = Rangliste;
})();
