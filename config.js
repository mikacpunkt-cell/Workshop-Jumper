/* =========================================================
   config.js – Einstellungen für den Betrieb des Spiels

   Online-Rangliste: standardmäßig AUS. Das Spiel speichert dann nichts
   außerhalb des Browsers, und die Datenschutzhinweise stimmen wie sie sind.

   Einschalten: einen Rangliste-Server betreiben (siehe server/ und den
   Abschnitt „Online-Rangliste“ in der README), die Adresse unten eintragen
   und die Datenschutzhinweise ergänzen (Textbaustein steht in der README).

   Beispiel:
     online: { typ: 'rest', url: 'https://rangliste.example.org' }
   ========================================================= */
window.KW_CONFIG = {
  online: null
};
