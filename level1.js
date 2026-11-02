/* Level 1: Werkstatt – zum Kennenlernen
   Ein Level besteht aus Abschnitten, die von links nach rechts
   aneinandergehängt werden. Abschnitte mit weniger als 12 Zeilen
   werden unten ausgerichtet (oben wird mit Luft aufgefüllt).
   Zeichenerklärung: siehe README.md */
window.KW_LEVELS = window.KW_LEVELS || [];
window.KW_LEVELS.push({
  nummer: 1,
  name: 'Werkstatt',
  thema: 'werkstatt',
  zeit: 200,          // Sekunden
  gegnerTempo: 40,    // Pixel pro Sekunde
  plattformWeite: 5,  // Kacheln, die waagerechte Plattformen zurücklegen
  plattformHoehe: 4,  // Kacheln, die senkrechte Plattformen zurücklegen
  plattformDauer: 4,  // Sekunden für einmal hin und zurück
  abschnitte: [
    [ // Start
      '......?B?B....',
      '..............',
      '..............',
      '..S......o.o..',
      '##############',
      '##############'
    ],
    [ // erster Gegner, kleine Kiste
      '..o.o.......',
      '.........##.',
      '....E....##.',
      '############',
      '############'
    ],
    [ // kleine Lücke, dann über die Kiste auf die Ziegel klettern
      '.........ooo..',
      '........BB?BB.',
      '..............',
      '......#.......',
      '......#.......',
      '##...#########',
      '##...#########'
    ],
    [ // Treppe + Checkpoint
      '..........#.',
      '.........##.',
      '........###.',
      '..K....####.',
      '############',
      '############'
    ],
    [ // Stacheln und zwei Gegner
      '....o.o.o.....',
      '..............',
      '..............',
      '...^^..E...E..',
      '##############',
      '##############'
    ],
    [ // bewegliche Plattform über eine Grube
      '...o.o.o......',
      '.-............',
      '..............',
      '#.........####',
      '#.........####'
    ],
    [ // Bröselbrücke
      '.....o.o.o....',
      '..............',
      '..............',
      '###CCCCCCCC###',
      '###........###'
    ],
    [ // Ziel
      '......oOo.....',
      '..............',
      '..E........Z..',
      '##############',
      '##############'
    ]
  ]
});
