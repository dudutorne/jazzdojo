// Interface language. The app is written in Catalan; English and Spanish are applied on top by translating the text the page shows
// (static markup and everything the app renders later), so the rest of the code stays in one language.

const KEY = 'jd.lang';
export const LANGS = ['ca', 'es', 'en'];
export const LANG_NAMES = { ca: 'Català', es: 'Castellano', en: 'English' };

export function getLang() {
  try {
    const v = localStorage.getItem(KEY);
    if (LANGS.includes(v)) return v;
  } catch (e) { /* storage unavailable */ }
  return 'ca'; // Catalan unless another language was chosen
}
export function setLang(v) {
  try { localStorage.setItem(KEY, v); } catch (e) { /* storage unavailable */ }
}

const EN = {
  'Com funciona?': 'How it works',
  'JazzDojo et proposa arpegis sobre una progressió d\'acords. Està pensada per a progressions que et sàpigues de memòria, tot i que també hi ha l\'opció de visualitzar els acords.':
    'JazzDojo gives you arpeggios over a chord progression. It is meant for progressions you know by heart, although you can also choose to see the chords.',
  'Tria un exercici a «Exercicis». També en pots importar d\'iReal Pro, escriure els acords o crear-ne per cicles.':
    'Pick an exercise in “Exercises”. You can also import one from iReal Pro, type the chords or build one from cycles.',
  'Prem ▶. Després del compte d\'entrada sona la banda: baix, bateria i harmonia.':
    'Press ▶. After the count-in the band plays: bass, drums and harmony.',
  'Toca els graus que surten a la pantalla, per exemple 5 3 9 7 1, sobre l\'acord que sona. El número vermell és la primera nota.':
    'Play the degrees shown on screen, for example 5 3 9 7 1, over the chord that is sounding. The red number is the first note.',
  'Si et perds, prem «Mostra l\'acord». Amb el Chicken mode també hi veus les notes.':
    'If you get lost, press “Show chord”. With Chicken mode you also see the notes.',
  'A Arpegis tries quins graus surten i quan canvien. A Mix, l\'estil, els instruments, el volum i el compte d\'entrada.':
    'In Arpeggios you choose which degrees appear and when they change. In Mix, the style, instruments, volume and count-in.',
  'A Acords tens la partitura: toca un acord i el botó ▶ que hi apareix per començar des d\'allà, o mantén-lo premut i arrossega per fer un bucle.':
    'Chords shows the chart: tap a chord and the ▶ button that appears to start from there, or press and hold it and drag to make a loop.',
  'Tecles: espai per tocar o fer pausa, A per mostrar l\'acord, Esc per aturar, fletxes amunt i avall per canviar el tempo.':
    'Keys: space to play or pause, A to show the chord, Esc to stop, up and down arrows to change the tempo.',
  'Cicle de quartes · tots els acords de 9 i ♭9': 'Cycle of fourths · all the 9 and ♭9 chords',
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
  'Simple': 'Simple', 'Normal': 'Normal', 'Alta': 'High',
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

const ES = {
  'Com funciona?': '¿Cómo funciona?',
  'JazzDojo et proposa arpegis sobre una progressió d\'acords. Està pensada per a progressions que et sàpigues de memòria, tot i que també hi ha l\'opció de visualitzar els acords.':
    'JazzDojo te propone arpegios sobre una progresión de acordes. Está pensada para progresiones que te sepas de memoria, aunque también tienes la opción de ver los acordes.',
  'Tria un exercici a «Exercicis». També en pots importar d\'iReal Pro, escriure els acords o crear-ne per cicles.':
    'Elige un ejercicio en «Ejercicios». También puedes importarlos de iReal Pro, escribir los acordes o crearlos por ciclos.',
  'Prem ▶. Després del compte d\'entrada sona la banda: baix, bateria i harmonia.':
    'Pulsa ▶. Después de la cuenta de entrada suena la banda: bajo, batería y armonía.',
  'Toca els graus que surten a la pantalla, per exemple 5 3 9 7 1, sobre l\'acord que sona. El número vermell és la primera nota.':
    'Toca los grados que salen en la pantalla, por ejemplo 5 3 9 7 1, sobre el acorde que suena. El número rojo es la primera nota.',
  'Si et perds, prem «Mostra l\'acord». Amb el Chicken mode també hi veus les notes.':
    'Si te pierdes, pulsa «Mostrar el acorde». Con el Chicken mode también ves las notas.',
  'A Arpegis tries quins graus surten i quan canvien. A Mix, l\'estil, els instruments, el volum i el compte d\'entrada.':
    'En Arpegios eliges qué grados salen y cuándo cambian. En Mix, el estilo, los instrumentos, el volumen y la cuenta de entrada.',
  'A Acords tens la partitura: toca un acord i el botó ▶ que hi apareix per començar des d\'allà, o mantén-lo premut i arrossega per fer un bucle.':
    'En Acordes tienes la partitura: toca un acorde y el botón ▶ que aparece para empezar desde ahí, o mantenlo pulsado y arrastra para hacer un bucle.',
  'Tecles: espai per tocar o fer pausa, A per mostrar l\'acord, Esc per aturar, fletxes amunt i avall per canviar el tempo.':
    'Teclas: espacio para tocar o pausar, A para mostrar el acorde, Esc para parar, flechas arriba y abajo para cambiar el tempo.',
  'Cicle de quartes · tots els acords de 9 i ♭9': 'Ciclo de cuartas · todos los acordes de 9 y ♭9',
  'Exercicis': 'Ejercicios', 'Canvia el tema': 'Cambiar el tema', 'Canvia d\'exercici': 'Cambiar de ejercicio',
  'Canvi d\'acord': 'Cambio de acorde', 'Mostra l\'acord': 'Mostrar el acorde', 'Chicken mode': 'Chicken mode',
  'Canvia l\'idioma': 'Cambiar el idioma', 'Idioma': 'Idioma',
  'Arpegis': 'Arpegios', 'Mix': 'Mix', 'Acords': 'Acordes',
  'Aleatoris': 'Aleatorios', 'Els meus patrons': 'Mis patrones', 'Origen dels arpegis': 'Origen de los arpegios',
  'Graus que poden sortir': 'Grados que pueden salir', 'Notes per arpegi': 'Notas por arpegio',
  'Menys notes': 'Menos notas', 'Més notes': 'Más notas',
  'Conjunt de patrons': 'Conjunto de patrones', 'Nom del conjunt': 'Nombre del conjunto', 'Patrons': 'Patrones', 'Nou': 'Nuevo', 'Esborra': 'Borrar',
  'Separa els patrons amb comes: 13579, 53971, 1357. Per a l\'11 i el 13, separa els graus amb guions: 1-3-11-7.':
    'Separa los patrones con comas: 13579, 53971, 1357. Para el 11 y el 13, separa los grados con guiones: 1-3-11-7.',
  'Barrejats': 'Mezclados', 'En ordre': 'En orden',
  'Quan canvia l\'arpegi': 'Cuándo cambia el arpegio', 'Cada acord': 'Cada acorde', 'Compassos': 'Compases', 'Cada': 'Cada',
  'Cada quants compassos': 'Cada cuántos compases', 'Menys': 'Menos', 'Més': 'Más',
  'Arpegi nou també quan canvia l\'acord': 'Arpegio nuevo también cuando cambia el acorde',
  'A cada volta del bucle': 'En cada vuelta del bucle', 'Arpegis nous': 'Arpegios nuevos', 'Els mateixos': 'Los mismos',
  'Antelació de l\'arpegi nou (temps)': 'Antelación del arpegio nuevo (tiempos)',
  'Menys antelació': 'Menos antelación', 'Més antelació': 'Más antelación',
  'Estil': 'Estilo', 'Swing': 'Swing', 'Bossa': 'Bossa', 'Pop': 'Pop', 'Balada': 'Balada',
  'Harmonia': 'Armonía', 'Piano': 'Piano', 'Rhodes': 'Rhodes', 'Guitarra': 'Guitarra', 'Synth': 'Synth',
  'Mesclador': 'Mezclador', 'Baix': 'Bajo', 'Bateria': 'Batería', 'General': 'General',
  'Complexitat de l\'acompanyament': 'Complejidad del acompañamiento',
  'Simple': 'Simple', 'Normal': 'Normal', 'Alta': 'Alta',
  'Compte d\'entrada': 'Cuenta de entrada', 'Sense': 'Sin', '1 compàs': '1 compás', '2 compassos': '2 compases',
  'Sons reals: encara no carregats': 'Sonidos reales: aún no cargados', 'Sons reals carregats': 'Sonidos reales cargados',
  'No s\'han pogut carregar alguns sons: sonen sintetitzats': 'No se han podido cargar algunos sonidos: suenan sintetizados',
  'Carregant els sons reals… mentrestant sonen sintetitzats': 'Cargando los sonidos reales… mientras tanto suenan sintetizados',
  'Els sons reals es carreguen quan prems ▶': 'Los sonidos reales se cargan al pulsar ▶',
  'Amaga els noms dels acords': 'Ocultar los nombres de los acordes', 'Partitura gran': 'Partitura grande', 'Tanca': 'Cerrar',
  'Toca des d\'aquí': 'Tocar desde aquí', 'Repeteix': 'Repetir',
  'Torna a començar': 'Volver al principio', 'Atura': 'Parar', 'Reprodueix': 'Reproducir', 'Pausa': 'Pausa', 'Bucle': 'Bucle',
  'Sense bucle': 'Sin bucle', 'Bucle de tot l\'exercici': 'Bucle de todo el ejercicio', 'Bucle del tram triat': 'Bucle del tramo elegido',
  'Agrupament': 'Agrupación', 'Tempo': 'Tempo', 'Més lent': 'Más lento', 'Més ràpid': 'Más rápido',
  'Arrossega amunt o avall per canviar de 5 en 5': 'Arrastra arriba o abajo para cambiar de 5 en 5',
  'Els meus exercicis': 'Mis ejercicios', '+ Afegeix': '+ Añadir', 'Cerca': 'Buscar', 'Filtres': 'Filtros',
  'Cerca per nom, objectiu o tonalitat': 'Buscar por nombre, objetivo o tonalidad',
  'Cap exercici coincideix amb la cerca.': 'Ningún ejercicio coincide con la búsqueda.',
  'Encara no tens exercicis. Afegeix-ne un a «+ Afegeix».': 'Aún no tienes ejercicios. Añade uno en «+ Añadir».',
  'Ara practiques': 'Ahora practicas', 'Edita': 'Editar',
  'Importa d\'iReal Pro': 'Importar de iReal Pro', 'A iReal Pro, obre la cançó o la llista i toca': 'En iReal Pro, abre la canción o la lista y pulsa',
  'Comparteix → Exporta → HTML': 'Compartir → Exportar → HTML', '(o copia l\'enllaç).': '(o copia el enlace).',
  'Tria aquí el fitxer .html o enganxa l\'enllaç': 'Elige aquí el archivo .html o pega el enlace', 'a la caixa.': 'en la caja.',
  'Fitxer exportat d\'iReal Pro': 'Archivo exportado de iReal Pro', '…o enganxa aquí l\'enllaç irealb://…': '…o pega aquí el enlace irealb://…',
  'Escriu els acords': 'Escribe los acordes',
  'Cada | és un compàs; dos acords dins un compàs es reparteixen el temps; % repeteix l\'acord anterior.':
    'Cada | es un compás; dos acordes en un compás se reparten el tiempo; % repite el acorde anterior.',
  'Crea l\'exercici a partir del text': 'Crear el ejercicio a partir del texto',
  'Crea un exercici per cicles': 'Crear un ejercicio por ciclos',
  'Tipus d\'acord, en l\'ordre que els vols tocar': 'Tipos de acorde, en el orden en que los quieres tocar',
  'Moviment': 'Movimiento', 'Comença a': 'Empieza en', 'Compassos per acord': 'Compases por acorde', 'Compàs': 'Compás',
  'Crea l\'exercici': 'Crear el ejercicio',
  'Edita l\'exercici': 'Editar el ejercicio', 'Cancel·la': 'Cancelar', 'Nom': 'Nombre',
  'Cada | és un compàs. % repeteix l\'acord anterior. Dos acords dins un compàs es reparteixen el temps.':
    'Cada | es un compás. % repite el acorde anterior. Dos acordes en un compás se reparten el tiempo.',
  'Tonalitat': 'Tonalidad', 'Dificultat (cinturó)': 'Dificultad (cinturón)', 'Objectius': 'Objetivos', 'Desa': 'Guardar', 'Desa com a còpia': 'Guardar como copia',
  'p. ex. C, totes': 'p. ej. C, todas', 'totes': 'todas', 'Sense nom': 'Sin nombre',
  'separats per comes: extensions, cicle de quartes, dominants alterats': 'separados por comas: extensiones, ciclo de cuartas, dominantes alterados',
  'Blanc': 'Blanco', 'Groc': 'Amarillo', 'Taronja': 'Naranja', 'Verd': 'Verde', 'Blau': 'Azul', 'Marró': 'Marrón', 'Negre': 'Negro',
  'Bàsics': 'Básicos',
  'Cicle de quartes · Δ9, 9, m9': 'Ciclo de cuartas · Δ9, 9, m9',
  'Cicle de quartes · m7, 7, Δ7 (2 compassos)': 'Ciclo de cuartas · m7, 7, Δ7 (2 compases)',
  'Menor: ø7, 7alt, mΔ7': 'Menor: ø7, 7alt, mΔ7',
  'cicle de quartes': 'ciclo de cuartas', 'dominants alterats': 'dominantes alterados', 'extensions': 'extensiones', 'menor': 'menor',
  'Per quartes': 'Por cuartas', 'Per quintes': 'Por quintas', 'Cromàtic ascendent': 'Cromático ascendente', 'Cromàtic descendent': 'Cromático descendente',
  'Per tons ascendents': 'Por tonos ascendentes', 'Per tons descendents': 'Por tonos descendentes',
  'Per terceres menors ascendents': 'Por terceras menores ascendentes', 'Per terceres menors descendents': 'Por terceras menores descendentes',
  'Per terceres majors ascendents': 'Por terceras mayores ascendentes', 'Per terceres majors descendents': 'Por terceras mayores descendentes',
  'Per trítons': 'Por tritonos', 'Aleatori (les 12, sense repetir)': 'Aleatorio (las 12, sin repetir)',
  'Toca un altre cop per esborrar': 'Pulsa otra vez para borrar',
  'Toca la paperera un altre cop per esborrar l\'exercici.': 'Pulsa la papelera otra vez para borrar el ejercicio.',
  'No pots esborrar l\'únic exercici.': 'No puedes borrar el único ejercicio.',
  'És l\'únic': 'Es el único',
  'No hi trobo cap cançó d\'iReal Pro. Tria el fitxer .html exportat o enganxa l\'enllaç irealb://. Per escriure acords a mà, fes servir «Escriu els acords».':
    'No encuentro ninguna canción de iReal Pro. Elige el archivo .html exportado o pega el enlace irealb://. Para escribir acordes a mano, usa «Escribe los acordes».',
  'He trobat un enllaç d\'iReal Pro però no n\'he pogut llegir els acords.': 'He encontrado un enlace de iReal Pro pero no he podido leer sus acordes.',
  'Això és un enllaç d\'iReal Pro: enganxa\'l a «Importa d\'iReal Pro».': 'Esto es un enlace de iReal Pro: pégalo en «Importar de iReal Pro».',
  'Escriu almenys un acord.': 'Escribe al menos un acorde.',
  'Tria almenys un tipus d\'acord.': 'Elige al menos un tipo de acorde.',
  'JazzDojo · fet per Edu Torné': 'JazzDojo · hecho por Edu Torné',
};

// Messages with variable parts (replaced anywhere in a text, so joined messages work too)
const PATTERNS_EN = [
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
  [/Sons: contrabaix de D\. Smolken \(CC0\); piano Salamander Grand Piano d'Alexander Holm \(CC BY 3\.0\); Rhodes de MusyngKite, guitarres i baix elèctric de FatBoy/g,
    'Sounds: double bass by D. Smolken (CC0); Salamander Grand Piano by Alexander Holm (CC BY 3.0); Rhodes from MusyngKite, guitars and electric bass from FatBoy'],
  [/bateria Virtuosity Drums/g, 'drums Virtuosity Drums'], [/Tipografies Saira i Fira Sans/g, 'Fonts Saira and Fira Sans'],
];

const PATTERNS_ES = [
  [/Importat amb èxit: «(.+?)»\./g, 'Importado: «$1».'],
  [/Importades amb èxit (\d+) cançons; obro «(.+?)»\./g, 'Importadas $1 canciones; abro «$2».'],
  [/Atenció: no reconec (.+?), i sonaran com a silenci\./g, 'Atención: no reconozco $1, y sonarán como silencio.'],
  [/Exercici creat amb èxit \((\d+) acords\)\./g, 'Ejercicio creado ($1 acordes).'],
  [/Exercici creat amb èxit: «(.+?)»\./g, 'Ejercicio creado: «$1».'],
  [/No reconec aquests acords: /g, 'No reconozco estos acordes: '],
  [/^Edita «(.+)»$/g, 'Editar «$1»'], [/^Esborra «(.+)»$/g, 'Borrar «$1»'],
  [/^Cinturó (.+)$/g, (m, b) => `Cinturón ${(ES[b] || b).toLowerCase()}`],
  [/^Compàs (\d+\/\d+)$/g, 'Compás $1'],
  [/\b(\d+) acords\b/g, '$1 acordes'], [/ · en ([A-G][♭♯b#]?m?)$/g, ' · en $1'],
  [/corxeres/g, 'corcheas'], [/ \(còpia\)/g, ' (copia)'],
  [/\b(\d+) compassos\b/g, '$1 compases'],
  [/^Creada per (.+?) · Llicència /g, 'Creada por $1 · Licencia '],
  [/Sons: contrabaix de D\. Smolken \(CC0\); piano Salamander Grand Piano d'Alexander Holm \(CC BY 3\.0\); Rhodes de MusyngKite, guitarres i baix elèctric de FatBoy/g,
    'Sonidos: contrabajo de D. Smolken (CC0); piano Salamander Grand Piano de Alexander Holm (CC BY 3.0); Rhodes de MusyngKite, guitarras y bajo eléctrico de FatBoy'],
  [/bateria Virtuosity Drums/g, 'batería Virtuosity Drums'], [/Tipografies Saira i Fira Sans/g, 'Tipografías Saira y Fira Sans'],
];
let DICT = null, PATTERNS = [];

export function tr(text) {
  const trimmed = text.trim();
  if (!trimmed) return text;
  const hit = DICT[trimmed];
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
  if (lang === 'ca') return;
  DICT = lang === 'es' ? ES : EN; PATTERNS = lang === 'es' ? PATTERNS_ES : PATTERNS_EN;
  translateNode(document.body);
  new MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'characterData') translateNode(m.target);
      else if (m.type === 'attributes') translateNode(m.target);
      else m.addedNodes.forEach(translateNode);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}
