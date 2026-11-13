// Interface language. The app is written in Catalan; English is applied on top by translating the text the page shows
// (static markup and everything the app renders later), so the rest of the code stays in one language.

const KEY = 'jd.lang';
export const LANGS = ['ca', 'en'];

export function getLang() {
  try {
    const v = localStorage.getItem(KEY);
    if (LANGS.includes(v)) return v;
  } catch (e) { /* storage unavailable */ }
  return 'ca'; // Catalan unless English was chosen
}
export function setLang(v) {
  try { localStorage.setItem(KEY, v); } catch (e) { /* storage unavailable */ }
}

const EN = {
  // top bar, stage
  'Exercicis': 'Exercises', 'Canvia el tema': 'Change theme', 'Canvia d\'exercici': 'Change exercise',
  'Canvi d\'acord': 'Chord change', 'Mostra l\'acord': 'Show chord', 'Chicken mode': 'Chicken mode',
  'Canvia l\'idioma': 'Change language', 'Idioma': 'Language',
  // tabs and arpeggio pane
  'Arpegis': 'Arpeggios', 'Mix': 'Mix', 'Acords': 'Chords',
  'Aleatoris': 'Random', 'Els meus patrons': 'My patterns', 'Origen dels arpegis': 'Arpeggio source',
  'Graus que poden sortir': 'Degrees that can appear', 'Notes per arpegi': 'Notes per arpeggio',
  'Menys notes': 'Fewer notes', 'Més notes': 'More notes',
  'Conjunt de patrons': 'Pattern set', 'Nom del conjunt': 'Set name', 'Patrons': 'Patterns', 'Nou': 'New', 'Esborra': 'Delete',
  'Separa els patrons amb comes: 13579, 53971, 1357. Per a l\'11 i el 13, separa els graus amb guions: 1-3-11-7.':
    'Separate patterns with commas: 13579, 53971, 1357. For 11 and 13, separate the degrees with hyphens: 1-3-11-7.',
  'Barrejats': 'Shuffled', 'En ordre': 'In order',
  'Quan canvia l\'arpegi': 'When the arpeggio changes', 'Cada acord': 'Every chord', 'Compassos': 'Bars', 'Cada': 'Every',
  'Cada quants compassos': 'Every how many bars', 'Menys': 'Less', 'Més': 'More',
  'Arpegi nou també quan canvia l\'acord': 'New arpeggio also when the chord changes',
  'A cada volta del bucle': 'On every pass of the loop', 'Arpegis nous': 'New arpeggios', 'Els mateixos': 'The same ones',
  'Antelació de l\'arpegi nou (temps)': 'Show the next arpeggio early (beats)',
  'Menys antelació': 'Less lead time', 'Més antelació': 'More lead time',
  // mix pane
  'Estil': 'Style', 'Swing': 'Swing', 'Bossa': 'Bossa', 'Pop': 'Pop', 'Balada': 'Ballad',
  'Harmonia': 'Harmony', 'Piano': 'Piano', 'Rhodes': 'Rhodes', 'Guitarra': 'Guitar', 'Synth': 'Synth',
  'Mesclador': 'Mixer', 'Baix': 'Bass', 'Bateria': 'Drums', 'General': 'Master',
  'Complexitat de l\'acompanyament': 'Accompaniment complexity',
  'Molt simple': 'Very simple', 'Simple': 'Simple', 'Normal': 'Normal', 'Ric': 'Rich', 'Molt ric': 'Very rich',
  'Compte d\'entrada': 'Count-in', 'Sense': 'None', '1 compàs': '1 bar', '2 compassos': '2 bars',
  'Sons reals: encara no carregats': 'Real sounds: not loaded yet', 'Sons reals carregats': 'Real sounds loaded',
  'No s\'han pogut carregar alguns sons: sonen sintetitzats': 'Some sounds could not be loaded: using synthesized sounds',
  'Carregant els sons reals… mentrestant sonen sintetitzats': 'Loading the real sounds… synthesized sounds meanwhile',
  'Els sons reals es carreguen quan prems ▶': 'The real sounds load when you press ▶',
  // chords pane
  'Amaga els noms dels acords': 'Hide chord names', 'Partitura gran': 'Large chart', 'Tanca': 'Close',
  'Toca des d\'aquí': 'Play from here', 'Repeteix': 'Repeat',
  // transport
  'Torna a començar': 'Back to start', 'Atura': 'Stop', 'Reprodueix': 'Play', 'Pausa': 'Pause', 'Bucle': 'Loop',
  'Sense bucle': 'No loop', 'Bucle de tot l\'exercici': 'Loop the whole exercise', 'Bucle del tram triat': 'Loop the selected section',
  'Agrupament': 'Grouping', 'Tempo': 'Tempo', 'Més lent': 'Slower', 'Més ràpid': 'Faster',
  'Arrossega amunt o avall per canviar de 5 en 5': 'Drag up or down to change in steps of 5',
  // library
  'Els meus exercicis': 'My exercises', '+ Afegeix': '+ Add', 'Cerca': 'Search', 'Filtres': 'Filters',
  'Cerca per nom, objectiu o tonalitat': 'Search by name, goal or key',
  'Cap exercici coincideix amb la cerca.': 'No exercise matches the search.',
  'Encara no tens exercicis. Afegeix-ne un a «+ Afegeix».': 'You have no exercises yet. Add one with “+ Add”.',
  'Ara practiques': 'Now practising', 'Edita': 'Edit',
  'Importa d\'iReal Pro': 'Import from iReal Pro', 'A iReal Pro, obre la cançó o la llista i toca': 'In iReal Pro, open the song or playlist and tap',
  'Comparteix → Exporta → HTML': 'Share → Export → HTML', '(o copia l\'enllaç).': '(or copy the link).',
  'Tria aquí el fitxer .html o enganxa l\'enllaç': 'Pick the .html file here or paste the link', 'a la caixa.': 'into the box.',
  'Fitxer exportat d\'iReal Pro': 'File exported from iReal Pro', '…o enganxa aquí l\'enllaç irealb://…': '…or paste the irealb://… link here',
  'Escriu els acords': 'Write the chords',
  'Cada | és un compàs; dos acords dins un compàs es reparteixen el temps; % repeteix l\'acord anterior.':
    'Each | is a bar; two chords in one bar share it; % repeats the previous chord.',
  'Crea l\'exercici a partir del text': 'Create the exercise from the text',
  'Crea un exercici per cicles': 'Create an exercise from cycles',
  'Tipus d\'acord, en l\'ordre que els vols tocar': 'Chord types, in the order you want to play them',
  'Moviment': 'Movement', 'Comença a': 'Start on', 'Compassos per acord': 'Bars per chord', 'Compàs': 'Time signature',
  'Crea l\'exercici': 'Create the exercise',
  'Edita l\'exercici': 'Edit the exercise', 'Cancel·la': 'Cancel', 'Nom': 'Name',
  'Cada | és un compàs. % repeteix l\'acord anterior. Dos acords dins un compàs es reparteixen el temps.':
    'Each | is a bar. % repeats the previous chord. Two chords in one bar share it.',
  'Tonalitat': 'Key', 'Dificultat (cinturó)': 'Difficulty (belt)', 'Objectius': 'Goals', 'Desa': 'Save', 'Desa com a còpia': 'Save as a copy',
  'p. ex. C, totes': 'e.g. C, all', 'totes': 'all', 'Sense nom': 'Untitled',
  'separats per comes: extensions, cicle de quartes, dominants alterats': 'comma-separated: extensions, cycle of fourths, altered dominants',
  'Blanc': 'White', 'Groc': 'Yellow', 'Taronja': 'Orange', 'Verd': 'Green', 'Blau': 'Blue', 'Marró': 'Brown', 'Negre': 'Black',
  'Bàsics': 'Basics',
  // built-in exercises and goals
  'Cicle de quartes · Δ9, 9, m9': 'Cycle of fourths · Δ9, 9, m9',
  'Cicle de quartes · m7, 7, Δ7 (2 compassos)': 'Cycle of fourths · m7, 7, Δ7 (2 bars)',
  'Menor: ø7, 7alt, mΔ7': 'Minor: ø7, 7alt, mΔ7',
  'cicle de quartes': 'cycle of fourths', 'dominants alterats': 'altered dominants', 'extensions': 'extensions', 'menor': 'minor',
  // cycle generator
  'Per quartes': 'By fourths', 'Per quintes': 'By fifths', 'Cromàtic ascendent': 'Chromatic up', 'Cromàtic descendent': 'Chromatic down',
  'Per tons ascendents': 'By whole steps up', 'Per tons descendents': 'By whole steps down',
  'Per terceres menors ascendents': 'By minor thirds up', 'Per terceres menors descendents': 'By minor thirds down',
  'Per terceres majors ascendents': 'By major thirds up', 'Per terceres majors descendents': 'By major thirds down',
  'Per trítons': 'By tritones', 'Aleatori (les 12, sense repetir)': 'Random (all 12, no repeats)',
  // messages
  'Toca un altre cop per esborrar': 'Tap again to delete',
  'Toca la paperera un altre cop per esborrar l\'exercici.': 'Tap the bin again to delete the exercise.',
  'No pots esborrar l\'únic exercici.': 'You can\'t delete the only exercise.',
  'És l\'únic': 'It\'s the only one',
  'No hi trobo cap cançó d\'iReal Pro. Tria el fitxer .html exportat o enganxa l\'enllaç irealb://. Per escriure acords a mà, fes servir «Escriu els acords».':
    'I can\'t find an iReal Pro song. Pick the exported .html file or paste the irealb:// link. To type chords by hand, use “Write the chords”.',
  'He trobat un enllaç d\'iReal Pro però no n\'he pogut llegir els acords.': 'I found an iReal Pro link but couldn\'t read its chords.',
  'Això és un enllaç d\'iReal Pro: enganxa\'l a «Importa d\'iReal Pro».': 'That\'s an iReal Pro link: paste it into “Import from iReal Pro”.',
  'Escriu almenys un acord.': 'Write at least one chord.',
  'Tria almenys un tipus d\'acord.': 'Pick at least one chord type.',
  'JazzDojo · fet per Edu Torné': 'JazzDojo · made by Edu Torné',
};

// Messages with variable parts (replaced anywhere in a text, so joined messages work too)
const PATTERNS = [
  [/Importat amb èxit: «(.+?)»\./g, 'Imported: “$1”.'],
  [/Importades amb èxit (\d+) cançons; obro «(.+?)»\./g, 'Imported $1 songs; opening “$2”.'],
  [/Atenció: no reconec (.+?), i sonaran com a silenci\./g, 'Note: I don\'t recognise $1; they will be silent.'],
  [/Exercici creat amb èxit \((\d+) acords\)\./g, 'Exercise created ($1 chords).'],
  [/Exercici creat amb èxit: «(.+?)»\./g, 'Exercise created: “$1”.'],
  [/No reconec aquests acords: /g, 'I don\'t recognise these chords: '],
  [/^Edita «(.+)»$/g, 'Edit “$1”'], [/^Esborra «(.+)»$/g, 'Delete “$1”'],
  [/^Cinturó (.+)$/g, (m, b) => `${EN[b] || b} belt`],
  [/^Compàs (\d+\/\d+)$/g, 'Time $1'],
  [/\b(\d+) acords\b/g, '$1 chords'], [/ · en ([A-G][♭♯b#]?m?)$/g, ' · in $1'],
  [/corxeres/g, 'eighths'], [/ \(còpia\)/g, ' (copy)'],
  [/\b(\d+) compassos\b/g, '$1 bars'],
  [/^Creada per (.+?) · Llicència /g, 'Created by $1 · Licence '],
  [/Sons: contrabaix, piano i Rhodes de MusyngKite; guitarres i baix elèctric de FatBoy/g,
    'Sounds: double bass, piano and Rhodes from MusyngKite; guitars and electric bass from FatBoy'],
  [/bateria Virtuosity Drums/g, 'drums Virtuosity Drums'], [/Tipografies Saira i Fira Sans/g, 'Fonts Saira and Fira Sans'],
];

export function tr(text) {
  const trimmed = text.trim();
  if (!trimmed) return text;
  const hit = EN[trimmed];
  if (hit !== undefined) return text.replace(trimmed, hit);
  let out = text;
  for (const [re, rep] of PATTERNS) { re.lastIndex = 0; out = out.replace(re, rep); }
  return out;
}

const ATTRS = ['aria-label', 'title', 'placeholder'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA']);
function translateNode(node) {
  if (node.nodeType === 3) {
    const p = node.parentNode;
    if (p && SKIP.has(p.nodeName)) return;
    const v = node.nodeValue, t = tr(v);
    if (t !== v) node.nodeValue = t;
    return;
  }
  if (node.nodeType !== 1 || node.id === 'rows' || node.id === 'progress') return;
  for (const a of ATTRS) {
    const v = node.getAttribute(a);
    if (v) { const t = tr(v); if (t !== v) node.setAttribute(a, t); }
  }
  if (SKIP.has(node.nodeName)) return;
  for (const c of node.childNodes) translateNode(c);
}

/** Translate the page now and keep translating whatever the app renders later. */
export function startI18n(lang) {
  document.documentElement.lang = lang;
  if (lang !== 'en') return;
  translateNode(document.body);
  new MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'characterData') translateNode(m.target);
      else if (m.type === 'attributes') translateNode(m.target);
      else m.addedNodes.forEach(translateNode);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}
