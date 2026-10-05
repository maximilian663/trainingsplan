// Übungsbibliothek und Startpläne.
// Einträge mit nr/geraet stammen vom Trainingsblatt des Studios; extra: true = ergänzte Übungen.

const GROUPS = [
  { id: 'bauch', name: 'Bauchmuskulatur' },
  { id: 'beine', name: 'Oberschenkelmuskulatur' },
  { id: 'brust', name: 'Brustmuskulatur' },
  { id: 'ruecken', name: 'Rückenmuskulatur' },
  { id: 'schulter', name: 'Schultermuskulatur' },
  { id: 'trizeps', name: 'Armstreckermuskulatur (Trizeps)' },
  { id: 'bizeps', name: 'Armbeugemuskulatur (Bizeps)' },
  { id: 'gesaess', name: 'Gesäßmuskulatur' },
  { id: 'waden', name: 'Unterschenkelmuskulatur (Waden)' },
];

// [id, gruppe, nr, trainingsgerät, übung, extra?]
const BUILTIN_EXERCISES = [
  // Bauch
  ['bauch-16', 'bauch', '16', 'Bauchmaschine', 'Bauchpressen'],
  ['bauch-20', 'bauch', '20', 'Bauchmuskelbank', 'Bauchpressen'],
  ['bauch-19', 'bauch', '19', 'Up-Master, Bodenmatte', 'Bauchpressen'],
  ['bauch-17', 'bauch', '17', 'Twistermaschine', 'Bauchrotation'],
  ['bauch-matte-1', 'bauch', '', 'Gymnastikmatte', 'Bauchpressen'],
  ['bauch-12', 'bauch', '12', 'Beinhebegerät', 'Beinheben, hängend'],
  ['bauch-matte-2', 'bauch', '', 'Gymnastikmatte', 'Bauchpressen, schräg'],
  ['bauch-matte-3', 'bauch', '', 'Gymnastikmatte', 'Toe Touches'],
  ['bauch-matte-4', 'bauch', '', 'Gymnastikmatte', 'Seitstütz mit Drehung nach innen'],
  ['bauch-x1', 'bauch', '', 'Gymnastikmatte', 'Unterarmstütz (Plank)', true],
  ['bauch-x2', 'bauch', '', 'Gymnastikmatte', 'Russian Twists', true],
  ['bauch-x3', 'bauch', '11', 'Kabelzugstation, Seil', 'Kabel-Crunches, kniend', true],
  ['bauch-x4', 'bauch', '', 'Gymnastikmatte', 'Mountain Climbers', true],
  ['bauch-x5', 'bauch', '', 'Gymnastikmatte', 'Dead Bug', true],

  // Oberschenkel
  ['beine-21', 'beine', '21', 'Beinpresse sitzend', 'Beinpresse, sitzend'],
  ['beine-g80-1', 'beine', 'G80', 'Beinpresse, 45 Grad', 'Beinpresse, 45 Grad'],
  ['beine-14', 'beine', '14', 'Beinbeugemaschine, sitzend', 'Beinbeugen sitzend'],
  ['beine-13', 'beine', '13', 'Beinstreckmaschine', 'Beinstrecken'],
  ['beine-22', 'beine', '22', 'Adduktorenmaschine', 'Beinadduktion sitzend'],
  ['beine-23', 'beine', '23', 'Abduktorenmaschine', 'Beinabduktion sitzend'],
  ['beine-g80-2', 'beine', 'G80', 'Beinbeugemaschine, stehend', 'Beinbeuger stehend'],
  ['beine-g80-3', 'beine', 'G80', 'Hackenschmidtmaschine', 'Hackenschmidtkniebeugen'],
  ['beine-x1', 'beine', '', 'Langhantel, Kniebeugenständer', 'Kniebeugen', true],
  ['beine-x2', 'beine', '', 'Kurzhanteln', 'Ausfallschritte', true],
  ['beine-x3', 'beine', '', 'Kurzhanteln, Flachbank', 'Bulgarian Split Squats', true],
  ['beine-x4', 'beine', '', 'Langhantel', 'Rumänisches Kreuzheben', true],
  ['beine-x5', 'beine', '', 'Kurzhantel', 'Goblet Squats', true],
  ['beine-x6', 'beine', '', 'Beinbeugemaschine, liegend', 'Beinbeugen liegend', true],

  // Brust
  ['brust-6', 'brust', '6', 'Brustmaschine', 'Horizontaldrücken'],
  ['brust-g80-1', 'brust', 'G80', 'Flachbank, Langhantel', 'Bankdrücken'],
  ['brust-g80-2', 'brust', 'G80', 'Multipresse, Universalflachbank', 'Bankdrücken'],
  ['brust-5', 'brust', '5', 'Butterfly mit schwenkbaren Armen', 'Butterfly'],
  ['brust-pad', 'brust', '', 'Butterfly mit Pad', 'Butterfly'],
  ['brust-kabel', 'brust', '', 'Kabelzugstation', 'Kabelcross'],
  ['brust-10-1', 'brust', '10', 'Universalflachbank mit Kurzhanteln', 'Schrägbankdrücken'],
  ['brust-10-2', 'brust', '10', 'Universalflachbank mit Kurzhanteln', 'Kurzhantel Flies'],
  ['brust-x1', 'brust', '', 'Kurzhanteln, Flachbank', 'Kurzhantel-Bankdrücken', true],
  ['brust-x2', 'brust', '', 'Schrägbank, Langhantel', 'Schrägbankdrücken, Langhantel', true],
  ['brust-x3', 'brust', '', 'Boden', 'Liegestütze', true],
  ['brust-x4', 'brust', '', 'Kabelzugstation', 'Kabelcross, von unten nach oben', true],

  // Rücken
  ['ruecken-2-1', 'ruecken', '2', 'Zuggerät – vertikal', 'Latziehen weit zur Brust'],
  ['ruecken-2-2', 'ruecken', '2', 'Zuggerät – vertikal', 'Latziehen weit zum Nacken'],
  ['ruecken-2-3', 'ruecken', '2', 'Zuggerät – vertikal', 'Latziehen eng zur Brust'],
  ['ruecken-7', 'ruecken', '7', 'Rudermaschine', 'Rudern an der Maschine'],
  ['ruecken-g80-1', 'ruecken', 'G80', 'Rudermaschine T-Bar', 'T-Bar-Rudern'],
  ['ruecken-3', 'ruecken', '3', 'Zuggerät – horizontal', 'Rudern im Sitzen'],
  ['ruecken-1', 'ruecken', '1', 'Klimmzugmaschine (Gravitron)', 'Klimmzüge'],
  ['ruecken-g80-2', 'ruecken', 'G80', 'Rückenstation', 'Hyperextensions'],
  ['ruecken-15', 'ruecken', '15', 'Rückenmaschine', 'Hyperextensions an der Maschine'],
  ['ruecken-x1', 'ruecken', '', 'Kurzhantel, Flachbank', 'Einarmiges Kurzhantelrudern', true],
  ['ruecken-x2', 'ruecken', '', 'Langhantel', 'Langhantelrudern vorgebeugt', true],
  ['ruecken-x3', 'ruecken', '', 'Langhantel', 'Kreuzheben', true],
  ['ruecken-x4', 'ruecken', '', 'Kabelzugstation, Stange', 'Überzüge am Kabel (Straight-Arm Pulldown)', true],
  ['ruecken-x5', 'ruecken', '', 'Klimmzugstange', 'Klimmzüge, frei', true],

  // Schulter
  ['schulter-g80-1', 'schulter', 'G80', 'Schulterdrückmaschine', 'Nackendrücken an der Maschine'],
  ['schulter-g80-2', 'schulter', 'G80', 'Seithebemaschine', 'Seitheben an der Maschine'],
  ['schulter-4', 'schulter', '4', 'Schultermaschine', 'Liftbacks'],
  ['schulter-g80-3', 'schulter', 'G80', 'Multipresse, Universalflachbank', 'Nackendrücken an der Multipresse'],
  ['schulter-11', 'schulter', '11', 'Kabelzugstation', 'Face Pulls'],
  ['schulter-g80-4', 'schulter', 'G80', 'Schulterdrückstation, Langhantel', 'Nackendrücken'],
  ['schulter-10', 'schulter', '10', 'Unibank, Kurzhanteln', 'Schulterdrücken'],
  ['schulter-kh', 'schulter', '', 'Kurzhanteln', 'Kurzhantel-Frontheben angelehnt'],
  ['schulter-g80-5', 'schulter', 'G80', 'Multipresse, Universalflachbank', 'Frontdrücken an der Multipresse'],
  ['schulter-x1', 'schulter', '', 'Kurzhanteln', 'Seitheben mit Kurzhanteln', true],
  ['schulter-x2', 'schulter', '5', 'Butterfly mit schwenkbaren Armen', 'Reverse Butterfly', true],
  ['schulter-x3', 'schulter', '', 'Kurzhanteln', 'Arnold Press', true],
  ['schulter-x4', 'schulter', '', 'Kurzhanteln', 'Shrugs (Nackenheben)', true],
  ['schulter-x5', 'schulter', '11', 'Kabelzugstation', 'Seitheben am Kabel', true],

  // Trizeps
  ['trizeps-9', 'trizeps', '9', 'Trizepsmaschine', 'Trizepsdrücken'],
  ['trizeps-11-1', 'trizeps', '11', 'Zuggerät, Universalbank, Querstange', 'Trizepsdrücken, liegend'],
  ['trizeps-11-2', 'trizeps', '11', 'Zuggerät, Seil', 'Trizepsdrücken am Kabelzug'],
  ['trizeps-1', 'trizeps', '1', 'Barrenmaschine', 'Dips an der Maschine'],
  ['trizeps-10', 'trizeps', '10', 'Kurzhantel, Flachbank', 'Einarmiges Trizepsdrücken'],
  ['trizeps-bank', 'trizeps', '', 'Flachbank', 'Trizepsdrücken-Bank-Dips'],
  ['trizeps-12', 'trizeps', '12', 'Barren', 'Dips am Barren'],
  ['trizeps-kick', 'trizeps', '', 'Kurzhantel, Flachbank', 'Kurzhantel-Kickbacks'],
  ['trizeps-x1', 'trizeps', '11', 'Zuggerät, Seil', 'Überkopf-Trizepsdrücken am Kabel', true],
  ['trizeps-x2', 'trizeps', '', 'SZ-Langhantel, Flachbank', 'French Press (SZ-Stange)', true],
  ['trizeps-x3', 'trizeps', '', 'Langhantel, Flachbank', 'Enges Bankdrücken', true],

  // Bizeps
  ['bizeps-8', 'bizeps', '8', 'Bizepsmaschine', 'Maschinencurls'],
  ['bizeps-10-1', 'bizeps', '10', 'Kurzhanteln, Flachbank', 'Kurzhantelcurls im Stehen'],
  ['bizeps-11', 'bizeps', '11', 'Zuggerät, Querstange', 'Beidarmige Kabelcurls, sitzend'],
  ['bizeps-sz', 'bizeps', '', 'SZ-Langhantel', 'Langhantelcurls'],
  ['bizeps-10-2', 'bizeps', '10', 'Kurzhantel, Flachbank', 'Konzentrationscurls'],
  ['bizeps-10-3', 'bizeps', '10', 'Kurzhantel, Flachbank', 'Hammercurls'],
  ['bizeps-g80', 'bizeps', 'G80', 'Scottbank, Langhantel', 'Scottcurls stehend'],
  ['bizeps-x1', 'bizeps', '', 'Kurzhanteln, Schrägbank', 'Schrägbank-Curls', true],
  ['bizeps-x2', 'bizeps', '', 'SZ-Langhantel', 'Reverse Curls (Obergriff)', true],
  ['bizeps-x3', 'bizeps', '11', 'Zuggerät, Seil', 'Hammercurls am Kabel', true],

  // Gesäß
  ['gesaess-18', 'gesaess', '18', 'Gesäßmaschine', 'Hüftstrecken'],
  ['gesaess-glute', 'gesaess', 'Nautilus', 'Glute Drive', 'Hip Thrusts'],
  ['gesaess-19', 'gesaess', '19', 'Bodenmatte', 'Donkey Kicks'],
  ['gesaess-x1', 'gesaess', '11', 'Kabelzugstation, Fußschlaufe', 'Kabel-Kickbacks', true],
  ['gesaess-x2', 'gesaess', '', 'Gymnastikmatte', 'Glute Bridge', true],
  ['gesaess-x3', 'gesaess', '', 'Kurzhantel', 'Sumo-Kniebeugen', true],

  // Waden
  ['waden-g80-1', 'waden', 'G80', 'Wadenmaschine', 'Wadenheben, stehend'],
  ['waden-g80-2', 'waden', 'G80', 'Wadenmaschine', 'Wadenheben, sitzend'],
  ['waden-g80-3', 'waden', 'G80', 'Wadenmaschine, vorgebeugt', 'Wadenheben vorgebeugt'],
  ['waden-x1', 'waden', '21', 'Beinpresse sitzend', 'Wadenheben an der Beinpresse', true],
].map(([id, group, nr, geraet, name, extra]) => ({ id, group, nr, geraet, name, extra: !!extra }));

const CARDIO_DEVICES = ['Laufband', 'Cross-Trainer', 'Lateral X Trainer', 'Sitzergometer', 'Liegeergometer'];
const CARDIO_PROGRAMS = ['Fettabbau', 'Cardio', 'Hügel', 'Zufall', 'Manuell'];

// Plan-Einträge: [übungs-id, sätze, wdh, gewicht, einst1, einst2]
// Startwerte (Gewicht/Einstellungen) aus den handschriftlichen Notizen auf dem Blatt.
const DEFAULT_PLANS = [
  {
    id: 'plan-a',
    name: 'Tag A',
    color: 'red',
    items: [
      ['bauch-16', '3', '15', '20', 'Bügel 3', ''],
      ['bauch-12', '3', '15', '', '', ''],
      ['brust-6', '4', '12', '', 'Griffe vertikal', ''],
      ['brust-5', '4', '12', '', '', ''],
      ['schulter-g80-1', '3', '15', '', '', ''],
      ['schulter-11', '3', '15', '', '', ''],
      ['trizeps-11-2', '3', '12', '', '', ''],
      ['trizeps-12', '3', '12', '', '', ''],
    ],
  },
  {
    id: 'plan-b',
    name: 'Tag B',
    color: 'blue',
    items: [
      ['beine-21', '4', '12', '', '', ''],
      ['beine-14', '4', '12', '35', 'Sitz 2', 'Füße 7'],
      ['beine-13', '4', '12', '', 'Sitz 2', 'Füße 2'],
      ['ruecken-2-1', '4', '12', '', '', ''],
      ['ruecken-7', '4', '12', '', 'Sitz 3', ''],
      ['ruecken-15', '3', '10', '', '', ''],
      ['bizeps-8', '3', '12', '', '', ''],
      ['bizeps-sz', '3', '12', '', '', ''],
      ['waden-g80-3', '3', '15', '', '', ''],
    ],
  },
].map(p => ({
  ...p,
  items: p.items.map(([exId, saetze, wdh, kg, e1, e2]) => ({ exId, saetze, wdh, kg, e1, e2 })),
}));
