# Workshop-Jumper

Ein kleines 2D-Jump-and-Run der **KreativWerkstatt Ried e.V.** – mit HTML5 Canvas und reinem JavaScript, ohne Frameworks und ohne externe Abhängigkeiten.

## Starten

- **Lokal:** `index.html` per Doppelklick im Browser öffnen – fertig. (Alle Skripte sind normale `<script>`-Dateien, daher funktioniert das auch ohne Server.)
- **Hosting:** Den kompletten Ordner auf einen beliebigen Webspace hochladen (statische Website, keine Datenbank, kein PHP nötig). Für GitHub Pages siehe den Abschnitt „Auf GitHub veröffentlichen“.
- **Vor dem Veröffentlichen:** Impressum und Datenschutzhinweise sind für GitHub Pages als Hosting ausgefüllt. Wer anderswo hostet oder die Online-Rangliste einschaltet, muss `datenschutz.html` anpassen (siehe unten).

## Auf GitHub veröffentlichen

Das Spiel besteht nur aus statischen Dateien und läuft deshalb direkt auf **GitHub Pages**. Es sind keine Build-Schritte nötig; die Datei `.nojekyll` sorgt dafür, dass GitHub nichts umbaut.

1. Auf github.com ein neues Repository anlegen (z. B. `werkstatt-huepfer`, öffentlich).
2. Die ZIP-Datei **entpacken** und den **Inhalt** des Ordners `werkstatt-huepfer-main` ins Repository hochladen: „Add file → Upload files“, alle Dateien und Ordner hineinziehen (`index.html` muss direkt auf der obersten Ebene des Repositorys liegen, nicht in einem Unterordner) und „Commit changes“ wählen. Alternativ mit Git: `git init`, `git add .`, `git commit`, `git remote add origin …`, `git push`.
3. Im Repository unter **Settings → Pages** bei „Build and deployment“ die Quelle „Deploy from a branch“, den Branch `main` und den Ordner `/ (root)` wählen und speichern.
4. Nach ein bis zwei Minuten ist das Spiel unter `https://<benutzername>.github.io/<repository>/` erreichbar. Alle Verweise im Projekt sind relativ, es funktioniert also auch in einem Unterpfad.

Hinweise:

- Der Ordner `server/` wird von GitHub Pages nur als gewöhnliche Dateien mit ausgeliefert und läuft dort **nicht**. Er wird nur gebraucht, wenn man die Online-Rangliste betreibt; sonst kann man ihn weglassen oder löschen.
- Die Datenschutzhinweise nennen GitHub (GitHub Inc., USA) als Hosting-Anbieter, weil das Spiel dort gehostet wird. Beim Wechsel des Hosters müssen die Angaben in Abschnitt 4 angepasst werden.
- Eine Seite aus einem öffentlichen Repository ist öffentlich lesbar – das gilt auch für den gesamten Quelltext einschließlich aller Codes (siehe „Code einlösen“).

## Projektstruktur

```
index.html          Startseite mit Menüs und Spiel
impressum.html      Impressum
datenschutz.html    Datenschutzhinweise zum Spiel
css/style.css       Gestaltung, responsives Layout, Touch-Knöpfe
js/speicher.js      localStorage-Zugriff (mit try/catch abgesichert)
js/i18n.js          Sprachen (Englisch/Deutsch) und alle Anzeigetexte
js/audio.js         Soundeffekte mit der Web Audio API
js/einstellungen.js Grafik- und Toneinstellungen
js/rangliste.js     lokale Rangliste (Top 10)
js/config.js        Betriebs-Einstellungen (hier schaltet man die Online-Rangliste ein)
js/online.js        Online-Rangliste (optional, standardmäßig aus)
js/konto.js         Münzkonto, Level-Kauf und Skins
js/input.js         Tastatur und Touch-Steuerung
js/grafik.js        Pixel-Art, Kacheln, Hintergründe, Themen
js/level.js         Level-Aufbau, Kollision, Blöcke, Gegner, Effekte
js/player.js        Spielfigur und Physik
js/ui.js            Menüs und HUD
js/game.js          Spielschleife, Zustände, Punkte, Kamera
levels/level1-25.js Level-Daten
werkzeuge/levelpruefer.js  automatischer Level-Prüfer (nur für Entwickler)
server/rangliste-server.js  kleiner Server für die Online-Rangliste (optional, Node.js)
```

## Level

| Nr. | Name | Besonderheit |
|-----|------|--------------|
| 1 | Werkstatt | Einstieg: Blöcke, erste Gegner, Plattform, Bröselbrücke |
| 2 | Holzlager | Aufzug, Holzstapel mit Stacheln |
| 3 | Farbatelier | Inseln, zwei Plattformen hintereinander |
| 4 | Töpferei | schwebende Regale, Bröseltreppe |
| 5 | Dachboden | alles zusammen, schnellere Gegner |
| 6 | Metallwerkstatt | **neu:** Trampoline, Trampolin-Kette über Stacheln |
| 7 | Nähstube | einzelne Bröselrollen, Bonus-Regal per Trampolin |
| 8 | Elektroniklabor | alle Elemente, Ziel-Tür nur per Trampolin erreichbar |
| 9 | Lackierraum | Inseln, Trampolin zur Wand, zwei Plattformen |
| 10 | Brennofen | schwebende Säulen, Aufzüge, Bröseltreppe |
| 11 | Schweißecke | lange Trampolin-Kette, bröselnder Boden |
| 12 | Stofflager | Bröselrollen, Aufzug, Bonus-Regal |
| 13 | Lötstation | Säulen, Aufzüge und Plattformen über Stacheln |
| 14 | Sägewerk | Holzstapel, Aufzug, lange Bröselbretter |
| 15 | Materiallager | Pyramide, weite Inseln, schnelle Plattformen |
| 16 | Glasurküche | Bröseltreppe gleich am Start, Trampoline, morscher Boden |
| 17 | Schmiede | Werkbank, Säulen, Plattformen – Ziel per Trampolin |
| 18 | Serverraum | zwei Checkpoints, alles in schnell |
| 19 | Dachstuhl | viel Bröseln, zwei Checkpoints |
| 20 | Werkschau | Zwischenfinale: alle Hindernisse, hohes Tempo |
| 21 | Kistenlager | Kistentreppe, drei Plattformen, Aufzüge, hohe Werkbank per Trampolin |
| 22 | Siebdruckerei | breite Inseln mit Gegnern, Bröseltreppe, Trampolin-Kette, morscher Boden |
| 23 | Gießerei | lange Trampolin-Kette, Säulen, Aufzug zu Bröselbrettern – Ziel per Trampolin |
| 24 | Prüfstand | Bröselrollen, Inseln, Werkbank, Aufzüge, Bröseltreppe – alles sehr schnell |
| 25 | Meisterprüfung | großes Finale: alle Hindernisse, drei Checkpoints, höchstes Tempo |

Mit jedem Level steigen Gegnertempo (40 → 130 px/s) und Plattformgeschwindigkeit; ab Level 18 gibt es zwei Checkpoints, Level 25 hat drei.

## Münzkonto, Level-Freischaltung und Skins

- Gesammelte Münzen (große Münze = 5) werden aufs **Münzkonto** gebucht, sobald ein Level endet – geschafft, Game over, Neustart oder Rückkehr ins Hauptmenü.
- **Level freischalten:** Hat man ein Level geschafft, kann man das nächste für Münzen kaufen (Level 2: 8 Münzen, dann +1 pro Level bis 31 für Level 25). Das geht im Ergebnisbildschirm oder in „Level wählen“. Ein eigener Preis lässt sich in der Level-Datei mit `preis: 30` setzen.
- Fehlen Münzen, spielt man geschaffte Level einfach noch einmal – so kann niemand feststecken.
- **Skins** (Menü „Skins“): Handwerker (gratis), Malerin 40, Schreiner 60, Näherin 70, Töpferin 80, Holzfäller 90, Bauarbeiter 100, Schweißer 120, Frostmeister 140, Elektronikerin 150, Piratin 160, Ninja 180, Nachtschicht 200, Vulkan 220, Astronaut 250, Roboter 300, Goldener Meister 400. Skins ändern nur Kleidung und Farben. Neue Skins trägt man in `js/konto.js` in die Liste `SKINS` ein (Farben: `H`/`h` Mütze, `W` Hemd, `B`/`b` Hose, `D` Schuhe, `R` Pinselstiel, `P` Farbe).
- **Code einlösen:** Oben im Skin-Shop gibt es ein Feld „Code einlösen“. Groß-/Kleinschreibung und Leerzeichen sind egal. Es gibt zwei öffentliche Codes:
  - `SHINY` – Spezial-Skin „Glitzer“ (silberblau, ein Lichtreflex wandert über die Figur).
  - `COINS` – 100 Münzen. Dieser Code zählt pro Gerät nur **einmal** (nach „Gespeicherte Daten löschen“ geht er wieder).

Der Spezial-Skin ist in der Skin-Liste animiert und lila umrandet, erscheint im Shop erst nach dem Einlösen und lässt sich nicht kaufen. Neue Codes trägt man in `js/konto.js` in `CODES` ein: `{ skin: 'id' }` für einen Skin (mit `nurPerCode: true`) oder `{ muenzen: 50 }` für Münzen. Achtung: Die Codes stehen im Quelltext und sind damit kein Geheimnis.
- Alles ist reine Spielwährung und wird nur lokal gespeichert. Ältere Spielstände werden übernommen (bisher freigeschaltete Level bleiben frei).

## Einstellungen

Erreichbar über das Hauptmenü und das Pausemenü. Alles wird sofort angewendet und lokal gespeichert:

- **Sprache / Language** – Englisch oder Deutsch (siehe Abschnitt „Sprachen“)
- **Helligkeit, Kontrast, Farbsättigung** – als CSS-Filter auf dem Canvas (kostet keine Spielleistung)
- **Lautstärke** – zusätzlich zum Ton-an/aus-Schalter
- **Grafikqualität** – „Niedrig“ blendet Parallax-Hintergründe und Funken aus (für schwache Geräte)
- **Pixel-Darstellung** – scharf (Retro) oder weich geglättet
- **Röhrenfernseher-Effekt** – Scanlines und dunkle Ränder
- **FPS anzeigen** – Bildrate oben rechts
- **Vollbild** – nur wenn der Browser es unterstützt (auf dem iPhone z. B. nicht)

## Sprachen

Beim allerersten Start ist das Spiel immer **Englisch**, egal welche Sprache der Browser hat. Unter „Settings“ / „Einstellungen“ lässt sich auf **Deutsch** umstellen; die Wahl wird lokal gespeichert, gilt sofort und bleibt auch nach „Gespeicherte Daten löschen“ erhalten. Die Standardwerte-Taste setzt die Sprache nicht zurück.

- Alle Texte stehen in `js/i18n.js` (Wörterbuch `TEXTE`, je Sprache ein Block mit denselben Schlüsseln).
- Feste Texte in `index.html` tragen `data-i18n="schlüssel"` (bzw. `data-i18n-aria` für Beschriftungen) und werden beim Start und bei jedem Sprachwechsel ersetzt. Der Text im HTML ist die englische Fassung.
- Texte im Code: `KW.I18n.t('schlüssel', { platzhalter: wert })`, z. B. `{n}` oder `{name}` im Text.
- Level- und Skin-Namen: Deutsch steht in den Level-Dateien bzw. in `js/konto.js`, die englischen Namen in `LEVELNAMEN_EN` (Schlüssel: Levelnummer) und `SKINNAMEN_EN` (Schlüssel: Skin-ID) in `js/i18n.js`. Ohne Eintrag wird der deutsche Name gezeigt – bei neuen Leveln oder Skins also bitte den englischen Namen dort ergänzen.
- Neue Sprache: Block in `TEXTE` und Eintrag in `SPRACHEN` ergänzen sowie eine Option im Auswahlfeld `#einstellung-sprache` in `index.html`.
- Das Impressum und die Datenschutzhinweise sind rechtliche Texte und nur auf Deutsch verfügbar.

## Rangliste

Nach einem Game over oder nach dem letzten Level kann man sich mit einem Namen (max. 12 Zeichen) in die Top 10 eintragen. Standardmäßig liegt die Rangliste **nur im localStorage des jeweiligen Geräts** – es gibt keinen Server, und das Spiel sendet nichts ins Netz. Eine geräteübergreifende Rangliste ist als Option eingebaut (nächster Abschnitt).

## Online-Rangliste (optional)

Eine Rangliste, die für alle Spielerinnen und Spieler gleich ist, braucht einen Ort, an dem die Einträge liegen. Auf GitHub Pages gibt es den nicht (nur statische Dateien). Deshalb gehört ein kleiner Server dazu, den der Verein selbst betreibt (`server/rangliste-server.js`). Ohne Eintrag in `js/config.js` ist die Online-Rangliste **aus**, und alles verhält sich wie oben beschrieben.

**So funktioniert sie im Spiel**

- In der Rangliste erscheinen zwei Reiter: „Dieses Gerät“ und „Online“ (Top 10 für alle). Die Online-Liste wird nur geladen, wenn man den Reiter öffnet.
- Beim Eintragen gibt es einen Haken „Meinen Eintrag auch in der öffentlichen Online-Rangliste zeigen“. Er ist **nie vorangekreuzt**; ohne Haken geht nichts ins Netz.
- Reichen die Punkte nicht für die lokale Top 10, erscheint stattdessen die Frage „Punktestand in der öffentlichen Online-Rangliste veröffentlichen?“ mit dem Knopf „Veröffentlichen“.
- Gesendet werden nur Spitzname, Punkte, Level und Datum. Der Hinweis „Spitzname statt echtem Namen“ steht direkt am Haken.
- Ist der Server nicht erreichbar, bleibt der lokale Eintrag erhalten und es erscheint eine Meldung.

**Einrichten**

1. Server auf einem Rechner starten, der dauerhaft läuft (Node.js 18 oder neuer, keine weiteren Pakete): `node server/rangliste-server.js`. Einstellungen über Umgebungsvariablen stehen als Kommentar am Anfang der Datei (`PORT`, `ALLOWED_ORIGIN`, `MAX_PUNKTE`, `RATE_MAX`, `TRUST_PROXY`, `ADMIN_TOKEN`, `DATEI`).
2. Den Server hinter HTTPS betreiben, weil die Spielseite auf GitHub Pages verschlüsselt ausgeliefert wird und der Browser unverschlüsselte Anfragen sperrt. Mit Caddy genügt zum Beispiel: `rangliste.example.org { reverse_proxy 127.0.0.1:8787 }` (dann `TRUST_PROXY=1` und `ALLOWED_ORIGIN=https://<verein>.github.io` setzen).
3. In `js/config.js` eintragen: `online: { typ: 'rest', url: 'https://rangliste.example.org' }`. Zum Ausprobieren auf dem eigenen Rechner reicht `url: 'http://127.0.0.1:8787'`.
4. **Datenschutzhinweise ergänzen** (Textbaustein unten), bevor das Spiel mit eingeschalteter Online-Rangliste veröffentlicht wird.

**Was der Server tut** – und was nicht

- Er speichert höchstens die besten 100 Einträge in einer Datei (`server/scores.json`) und liefert sie sortiert aus. Er prüft Name (max. 12 Zeichen, ohne Steuerzeichen), Punkte (ganze Zahl von 1 bis `MAX_PUNKTE`) und Level, begrenzt die Größe einer Anfrage und lässt pro Absender nur `RATE_MAX` Einträge pro Stunde zu.
- IP-Adressen werden weder gespeichert noch protokolliert; für das Limit liegt nur ein Hash kurz im Arbeitsspeicher.
- Einzelne Einträge (z. B. unpassende Namen oder auf Wunsch einer Person) löscht man mit `curl -X DELETE -H "Authorization: Bearer <ADMIN_TOKEN>" https://rangliste.example.org/scores/<id>`. Die `id` steht in `server/scores.json`.
- **Grenze:** Die Punktzahl kommt aus dem Browser und lässt sich dort fälschen. Der Server kann nur Unmögliches (zu hohe Zahlen, zu viele Einträge) abfangen, keine geschickt gefälschten Werte. Für ein Vereinsspiel ist das meist in Ordnung; Namen sollte man trotzdem gelegentlich ansehen.
- Der Server filtert keine unpassenden Namen automatisch.

**Datenschutz-Textbaustein** (für `datenschutz.html`, nur wenn die Online-Rangliste eingeschaltet ist; die Stellen in eckigen Klammern ausfüllen; keine Rechtsberatung, bitte vom Verein prüfen lassen):

> **Online-Rangliste (freiwillig).** Wenn Sie beim Eintragen den Haken „Meinen Eintrag auch in der öffentlichen Online-Rangliste zeigen“ setzen oder auf „Veröffentlichen“ klicken, senden wir Ihren Spitznamen, Ihre Punktzahl, das erreichte Level und das Datum an unseren Rangliste-Server und zeigen diese Angaben allen Besucherinnen und Besuchern des Spiels an. Ohne diese Handlung werden keine Daten übertragen.Bitte verwenden Sie einen Spitznamen statt Ihres echten Namens.
> Wenn Sie den Reiter „Online“ in der Rangliste öffnen, wird die Liste vom Server abgerufen; dabei wird technisch bedingt Ihre IP-Adresse an den Server übermittelt. Sie wird nicht gespeichert; zum Schutz vor Missbrauch (Begrenzung der Eintragszahl) wird ein Hashwert kurzzeitig im Arbeitsspeicher vorgehalten.

**Testversion in der Claude-App:** Dort ist die Online-Rangliste mit dem gemeinsamen Speicher der Testumgebung verbunden (`typ: 'artifact'`), damit man sie ohne eigenen Server ausprobieren kann. Das ist nur für Tests gedacht und nicht für die Veröffentlichung auf GitHub Pages.

## Leben

Man startet einen Durchgang mit 3 Leben. Die Leben, die man beim Schaffen eines Levels noch hat, gelten auch im nächsten Level – egal ob man direkt über „Nächstes Level“ weiterspielt oder zwischendurch ins Hauptmenü geht und das Level über die Level-Auswahl startet (das Spiel merkt sich das lokal). Nach einem Game over beginnt ein frischer Durchgang mit 3 Leben; ebenso ein Level, das nicht direkt auf das zuletzt geschaffte folgt (z. B. ein früheres Level erneut spielen). „Level neu starten“ im Pausemenü behält die aktuellen Leben.

## Steuerung

| Aktion   | Tastatur                     | Handy                  |
|----------|------------------------------|------------------------|
| Laufen   | ← → oder A / D               | Knöpfe unten links     |
| Springen | Leertaste, ↑ oder W (halten = höher) | Knopf unten rechts |
| Pause    | P oder Esc                   | Knopf oben rechts      |

## Ein neues Level hinzufügen

1. Eine vorhandene Datei kopieren, z. B. `levels/level5.js` → `levels/level6.js`.
2. In der neuen Datei `nummer`, `name`, `thema` und die `abschnitte` anpassen.
3. In `index.html` die Datei **vor** `js/game.js` einbinden:
   ```html
   <script src="levels/level6.js"></script>
   ```
4. Fertig. Das Level erscheint automatisch in der Level-Auswahl und kann nach dem Abschluss des vorherigen Levels mit Münzen freigeschaltet werden. Die Reihenfolge ergibt sich aus `nummer`.

> Warum JavaScript-Dateien und kein JSON? Browser blockieren das Nachladen von JSON per `fetch`, wenn man `index.html` direkt von der Festplatte öffnet. Die Level-Dateien sind trotzdem reine Daten: ein Objekt mit Einstellungen und Textzeilen.

### Aufbau einer Level-Datei

```js
window.KW_LEVELS = window.KW_LEVELS || [];
window.KW_LEVELS.push({
  nummer: 6,
  name: 'Keller',
  thema: 'werkstatt',   // werkstatt | holzlager | farbatelier | toepferei | dachboden
                        // metallwerkstatt | naehstube | elektroniklabor
  zeit: 240,            // Zeitlimit in Sekunden
  gegnerTempo: 60,      // Pixel pro Sekunde
  plattformWeite: 5,    // Kacheln, die waagerechte Plattformen fahren
  plattformHoehe: 4,    // Kacheln, die senkrechte Plattformen fahren
  plattformDauer: 4,    // Sekunden für einmal hin und zurück
  abschnitte: [
    [
      '......?B!B....',
      '..............',
      '..............',
      '..S......o.o..',
      '##############',
      '##############'
    ],
    [
      '..........Z..',
      '#############',
      '#############'
    ]
  ]
});
```

- Ein Level ist **12 Kacheln hoch** (eine Kachel = 32 Pixel).
- Die **Abschnitte** werden von links nach rechts aneinandergehängt. So bleibt jeder Abschnitt klein und übersichtlich.
- Abschnitte mit weniger als 12 Zeilen werden **unten ausgerichtet**; oben wird automatisch mit Luft aufgefüllt. Kürzere Zeilen werden rechts mit `.` aufgefüllt.
- Jedes Level braucht genau ein `S` (Start) und ein `Z` (Ziel). Ein `K` (Checkpoint) wird empfohlen.

### Zeichenerklärung

| Zeichen | Bedeutung |
|---------|-----------|
| `.` | leer (Luft) |
| `#` | Bodenblock (fest) |
| `B` | Ziegel – von unten zerstörbar |
| `?` | Fragezeichen-Block mit Münze |
| `!` | Fragezeichen-Block mit Power-up (Sprungfeder: 10 s Doppelsprung) |
| `C` | zerbröselnde Plattform – fällt kurz nach dem Betreten, kehrt nach 5 s zurück |
| `^` | Stacheln (tödlich) |
| `T` | Trampolin – am besten bündig im Boden; Sprungtaste halten = ca. 6,5 Kacheln hoch, sonst ca. 2,5 |
| `o` | Münze (+10 Punkte) |
| `O` | große Münze (+100 Punkte) |
| `E` | Gegner (läuft hin und her, Draufspringen = +50) |
| `-` | bewegliche Plattform, waagerecht (3 Kacheln breit, fährt nach rechts) |
| `\|` | bewegliche Plattform, senkrecht (3 Kacheln breit, fährt nach oben) |
| `S` | Startpunkt der Spielfigur |
| `K` | Checkpoint (Fahne) |
| `Z` | Ziel (Tür, 2 Kacheln hoch) |

### Level automatisch prüfen

Öffne das Spiel mit dem Zusatz `?pruefen`, also z. B. `index.html?pruefen` (geht auch direkt von der Festplatte). Dann wird `werkzeuge/levelpruefer.js` nachgeladen und prüft **jedes** Level:

1. **Struktur** – genau ein Start `S` und ein Ziel `Z`, mindestens ein Checkpoint `K`, nichts schwebt, bekanntes Thema, keine unbekannten Zeichen, Zeitlimit nicht zu knapp.
2. **Schaffbarkeit** – ein Löser sucht mit der echten Spielphysik einen Weg zum Ziel (Laufen, Sprünge mit unterschiedlicher Lenkung, Warten auf Plattformen, Trampolin-Ketten). Ist ein Level nicht schaffbar, steht im Bericht die Spalte, an der der Löser hängen bleibt.
3. **Fuzz-Test** – Zufallseingaben überall im Level; meldet Fehler, ungültige Werte oder wenn die Figur in einer Wand stecken bleibt.

Mit `index.html?pruefen&muenzen` erkundet der Löser zusätzlich das ganze Level und meldet jede Münze, die man nicht erreichen kann (z. B. Münzen, die zu hoch über einer Plattform schweben). Das dauert einige Minuten.

Der Bericht erscheint nach ca. 1–2 Minuten über dem Spiel. Der Löser ist bewusst etwas großzügig (er ignoriert Gegner und nimmt vollen Anlauf an) – „schaffbar“ heißt also „mit sauberem Spiel schaffbar“. Testspielen ersetzt er nicht.

### Tipps zum Leveldesign

- Die Figur springt knapp **3 Kacheln hoch** und bei gleicher Höhe etwa **4 Kacheln weit**. Lücken von 2–3 Kacheln sind angenehm, 4 Kacheln sind schwer.
- Blöcke zum Anstoßen am besten 4 Reihen über dem Boden platzieren (3 Kacheln Platz darunter).
- Auf solche Blöcke kommt man **nicht** direkt vom Boden aus. Münzen darauf brauchen einen Aufstieg (z. B. eine 2 Kacheln hohe Kiste daneben).
- Münzen höchstens 4 Reihen über dem Boden platzieren, auf dem man steht. Sonst sind sie unerreichbar.
- Gegner drehen an Wänden, Kanten und vor Stacheln um.
- Bewegliche Plattformen sind nur von oben begehbar (man kann von unten durchspringen).

## Punkte

| Ereignis | Punkte |
|----------|--------|
| Münze | +10 |
| große Münze | +100 |
| Gegner besiegt | +50 |
| Zeitbonus am Levelende | +5 pro verbleibender Sekunde |

Highscore, Rangliste, Münzkonto, Skins, freigeschaltete Level, Einstellungen und die gewählte Sprache werden nur lokal im Browser gespeichert (localStorage) und können im Hauptmenü über „Gespeicherte Daten löschen“ entfernt werden.

## Technik

- Feste Physik-Schrittweite (1/120 s) mit Zeit-Akkumulator und `requestAnimationFrame` – gleiches Spielgefühl auf 60/120/144-Hz-Bildschirmen.
- Achsengetrennte AABB-Kollision gegen das Kachelraster; Coyote-Zeit und Sprungpuffer für eine faire Steuerung.
- Die Spielwelt wird in 640×360 gezeichnet und pixelgenau hochskaliert; HUD-Texte werden in voller Auflösung darübergelegt.
- Keine Cookies, kein Tracking, keine externen Ressourcen.
