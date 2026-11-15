<p align="center"><img src="public/icons/logo.svg" alt="JazzDojo" width="460"></p>

JazzDojo és una web app per entrenar arpegis de jazz sobre progressions d'acords. Substitueix la pràctica habitual
amb iReal Pro: la secció rítmica sona, però a la pantalla no surten els acords. Només hi surten **xifres de graus**
(per exemple `5 3 9 7 1`) que has de tocar sobre l'acord que sona.

Funciona a l'iPhone, a l'iPad i al Mac des del navegador, i es pot instal·lar com una app que funciona sense connexió.
La interfície està en català, castellà i anglès (botó d'idioma a dalt a la dreta). La primera vegada s'obre en
català des de l'Estat espanyol i Andorra; des d'altres llocs, en l'idioma del navegador (català, castellà o, si no,
anglès).

Creada per **Edu Torné**. Llicència [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

## Com s'utilitza

- **Mòbil en horitzontal:** només es veuen les dues files d'arpegis, el botó «Mostra l'acord» (l'ajuda surt al
  costat) i els controls de reproducció, amb els números tan grans com hi caben.
- **Pantalla de pràctica:**
  - Una sola línia de xifres, gran, amb el primer número en vermell.
  - L'arpegi nou apareix una mica abans del canvi: tu tries quants temps d'antelació (0; 0,5; 1; 1,5…). Amb 0 canvia
    just al temps del canvi.
  - Els punts marquen els temps que queden fins al canvi.
  - Si fas servir els teus patrons en ordre i en tens 4 o menys, es veuen tots alhora com a files fixes, i el vermell
    va passant d'una fila a l'altra.
- **Arpegis:**
  - Pots fer-los aleatoris, triant quins graus surten (1–13) i quantes notes té cada arpegi, o fer servir els teus
    propis conjunts de patrons, amb nom, en ordre o barrejats.
  - Les notes per arpegi són, per defecte, tantes com graus triats. Se'n poden posar més (fins a 12) i llavors algun
    grau es repeteix, mai dos cops seguits. Si canvies els graus, torna al valor per defecte. L'11 dels acords majors
    i dominants és ♯11.
- **Quan canvia l'arpegi:**
  - Pot canviar a cada acord o cada N compassos.
  - Opcionalment, també quan canvia l'acord. Quan l'acord canvia però l'arpegi no, surt l'avís «Canvi d'acord».
- **Bucle:**
  - Pots no fer bucle, repetir-ho tot o repetir un tram.
  - A cada volta, tries si surten arpegis nous o els mateixos.
- **Acords (partitura):**
  - Els acords es mostren com en una partitura de jazz: arrel gran, alteració a dalt i qualitat petita a baix (Δ7, −7, ø7), baix invertit a sota, 4 compassos per línia, lletres de secció (A, B…) de l'iReal, compàs al principi, "%" per repetir el compàs anterior i doble barra final.
  - **Partitura gran** obre la partitura a pantalla completa: 4 compassos per línia, o 8 en pantalles amples.
- **Final i compte d'entrada:**
  - Quan s'acaba l'exercici (sense bucle), sona una sola vegada el primer acord, perquè se senti que s'ha acabat.
  - Compte d'entrada a la pestanya Mix: sense, 1 compàs o 2 compassos (per defecte, 1). Es veu com una rodoneta buida per temps del compàs que s'omple a cada pulsació.
- **Graella d'acords:**
  - Toca un acord per triar-lo i prem el ▶ que hi apareix, o fes-hi doble toc: sona des d'allà, amb compte d'entrada.
  - Mantén premut i arrossega sobre uns quants acords: aquell tram queda en bucle. Amb el ratolí, n'hi ha prou
    d'arrossegar.
  - Doble toc a qualsevol acord per sortir del bucle (també s'atura la música).
- **Altres controls:**
  - Restart (`R`), play/pausa (espai), stop (`Esc`) i tempo (fletxes).
- **So:**
  - Estil: swing, bossa, pop o balada.
  - Harmonia: piano, Rhodes o guitarra jazz. En pop la banda canvia: baix elèctric en lloc de contrabaix, i harmonia
    de piano, synth o guitarra elèctrica neta, amb acords de pop (tríades i cuatriades amb la fonamental).
  - Mesclador de baix, bateria, harmonia i volum general.
- **Tempo:** + i − van d'1 en 1. Mantén premut el número dels bpm i arrossega amunt o avall per canviar-lo de 5 en 5.
- **Compàs:** es tria a la barra inferior, al costat del tempo (2/4 … 7/4, 5/8, 6/8, 7/8, 9/8, 12/8). Cada acord manté
  els compassos que durava.
  - Els compassos d'amalgama tenen agrupaments: 5/4 en 3+2, 2+3 o en corxeres (3+3+2+2, 2+2+3+3…), 7/4 en 4+3, 3+4,
    2+2+3…, 5/8 en 3+2 o 2+3, 7/8 en 2+2+3, 3+2+2 o 2+3+2, etc.
  - La bateria, el baix i l'harmonia accentuen els inicis de grup. El compte d'entrada també els marca amb un clic
    diferent.
  - En 3/4 l'acompanyament fa vals de jazz: charles al 2 i al 3, baix «1 · 3» o walking, i de vegades una hemiòlia de
    6/8 (accents a l'1 i a la segona corxera del 2).
- **Complexitat de l'acompanyament** (pestanya Mix): tres nivells. **Simple:** el baix fa notes llargues, poc comping i
  poca bateria. **Normal** (per defecte): el baix camina a negres (o fa el patró de bossa, etc.) amb alguna nota
  fantasma. **Alta:** més corxeres al baix, més cops de l'harmonia, més caixa i més anticipacions. El ride sempre
  manté un pols estable.
- **Baix:** evita repetir la mateixa nota dues vegades seguides. Les notes fantasma són soroll de corda apagada, sense
  to definit, i només cauen a la corxera del temps feble. Els cromatismes només surten al nivell Alta, sempre en
  corxeres i de pas: la nota cromàtica queda a un semitò real de la nota on resol, mai amb un salt d'octava pel mig.
- **Harmonia:** els voicings són inversions tancades i drop 2, sense novenes menors entre veus. Quan un acord dura, es
  desplega cap amunt o cap avall amb passos petits en lloc de repetir la mateixa posició, i de tant en tant fa un
  acord sec (curt).
- **Bateria:** va un pas per sobre del nivell: a Normal toca el groove més ric, i a Alta afegeix notes fantasma en
  tresets, redobles més llargs i diàlegs entre caixa i bombo.
- **Harmonia per estil:** en canviar d'estil, la bossa passa a guitarra i el pop, el swing i la balada a piano.
- **Bateria i sala:** caixa ocasional amb dotze mostres de dinàmiques diferents, algun crash suau a l'inici de frase o
  després d'un redoble, i un 5% de reverberació a l'harmonia i la bateria.
- **Agrupaments i accents:** en els compassos de x/4 escrits en corxeres, els grups de 2 consecutius es noten com a
  grups de 4. Un 7/4 en 2+2+2+2+3+3 sona com 4+4+3+3.
- **Ride:** en els compassos d'amalgama el ride sempre va a corxeres. En els de x/4 (5/4, 7/4…) frasseja com si
  el compàs fos 2+2+2…: els grups de 3 ja els marquen els altres instruments. En els de x/8 segueix els grups. A
  tempos molt ràpids passa a negres.
- **Anticipacions:** de tant en tant, l'harmonia toca l'acord següent una corxera abans del temps fort, com és habitual
  en jazz i bossa.
- **Exercicis:**
  - Pots importar d'iReal Pro, escriure acords a mà o generar cicles amb els tipus d'acord en l'ordre que vulguis.
  - Els cicles poden anar per qualsevol interval: quartes, quintes, cromàtic, tons, terceres menors o majors (pujant
    o baixant) i trítons. Si un interval no passa per les dotze notes, el cicle continua des d'un semitò més enllà.
  - També hi ha l'opció «Aleatori»: les dotze fonamentals en un ordre a l'atzar, sense repetir-ne cap, i un ordre
    diferent per a cada tipus d'acord.
  - Els filtres de la llista d'exercicis estan plegats sota la icona de l'embut.
  - Cada exercici té nom, tonalitat, objectius i una dificultat per colors de cinturó. Es poden editar, duplicar,
    esborrar, cercar i filtrar.

### Importar d'iReal Pro

1. A iReal Pro: Comparteix → Exporta → **HTML** (o copia l'enllaç `irealb://`).
2. A JazzDojo: Exercicis → tria el fitxer o enganxa l'enllaç.

S'interpreten els acords, el compàs, les repeticions, les caselles de 1a i 2a, la repetició de compàs (`x`, `r`)
i l'estil. Els acords que no s'entenen es llisten i sonen com a silenci. L'àudio d'iReal Pro no es pot fer servir:
l'acompanyament el genera JazzDojo.

### Instal·lar-la

- **iPhone o iPad:** obre l'adreça de GitHub Pages amb Safari i fes Comparteix → «Afegeix a la pantalla d'inici».
- **Mac:** a Safari, fes Fitxer → «Afegeix al Dock».

Després de la primera visita funciona sense connexió.

## Arquitectura

| Mòdul | Què fa |
|---|---|
| `src/theory.js` | Llegeix els símbols d'acord (text i notació iReal), calcula els intervals de cada grau, els graus escrits a l'acord i la família de l'acord. |
| `src/ireal.js` | Importa d'iReal Pro (desofuscació, repeticions, caselles i compàs) i d'acords escrits a mà. També genera cicles. Format intermedi propi: `{label, bars}`. |
| `src/arps.js` | Motor de patrons: aleatoris sense repeticions seguides, llistes pròpies, filtre de graus escrits. Desa els arpegis per posició (*slot*). |
| `src/sequencer.js` | Rellotge musical: decideix l'acord, el temps i el compàs de cada moment, quan comença un arpegi nou (per acord, temps, compassos o segons), els bucles i els salts. |
| `src/groove.js` | Acompanyament: baix walking amb notes d'aproximació, voicings sense fonamental enllaçats, patrons de comping i bateria humanitzada, per a cada estil i compàs. |
| `src/audio.js` | Web Audio: mostres d'àudio (amb so sintetitzat de reserva mentre carreguen), busos, mesclador i reverberació. |
| `src/app.js` | Estat, desament local, planificador i interfície. |

El planificador avança temps a temps uns 150 ms per davant del rellotge d'àudio. La interfície només aplica
canvis quan aquell rellotge arriba al moment programat, i per això la pantalla no es desfasa de la música.

## Desenvolupament

```bash
npm install        # esbuild
npm test           # proves (node:test): acords, iReal, arpegis, seqüenciador, acompanyament
npm run build      # genera docs/ (GitHub Pages) i embed/ (versió per incrustar en una altra pàgina)
```

En cada canvi a `main`, GitHub Actions (`.github/workflows/pages.yml`) passa els tests, genera `docs/` i publica l'app a GitHub Pages.

```
npm run dev        # build + servidor local a http://localhost:8080
```

Els sons millors (contrabaix i piano reals amb capes de dinàmica, sorolls de corda apagada, més caixes i el crash) no
són al repositori: els baixa i els prepara `tools/sounds.py` (cal `git` i `ffmpeg`) a la carpeta `sounds/`, i
`npm run build` els posa per sobre de les mostres de `public/samples`. GitHub Actions ho fa a cada publicació. Si
`sounds/` no hi és, l'app sona amb les mostres del repositori.

```bash
python3 tools/sounds.py && npm run build
```

Per regenerar les mostres de `public/samples` cal fer clons parcials dels repositoris originals, i després:

```bash
python3 tools/samples.py   # variables SF i VD: on són les fonts
python3 tools/logo.py <Saira-Black.ttf> <Saira-SemiBold.ttf> public/icons
```

## Limitacions conegudes

- **Durada dels acords d'iReal:** quan en un compàs hi ha diversos acords, la durada es reparteix pel nombre
  d'acords (2+2, 2+1+1), no per la posició exacta de cada cel·la d'iReal.
- **Signes ignorats:** el segno, la coda i els finals alternatius més enllà de 1a/2a casella no s'interpreten.
- **iPhone:** el so s'atura si es bloqueja la pantalla, i per això l'app manté la pantalla encesa mentre sona. Si no
  se sent res, comprova l'interruptor de silenci.
- **Dades locals:** els exercicis i els ajustos es guarden al navegador de cada dispositiu i no se sincronitzen.
- **Ajuda:** les notes de l'arpegi s'escriuen amb la lletra que toca (el 7 de C7 és B♭, no A♯). Els dobles sostinguts i
  bemolls se simplifiquen.
- **Mostres:** el Rhodes, les guitarres i el baix elèctric són d'una sola capa de dinàmica per nota (bancs de so
  General MIDI), així que el seu so és més senzill que el del piano i el contrabaix.

## Crèdits i llicències

- **App i codi:** © 2026 Edu Torné, llicència [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/): es pot compartir i adaptar citant l'autor, sense ús comercial i amb la mateixa llicència.
- **Contrabaix:** [D. Smolken Double Bass](https://github.com/sfzinstruments/dsmolken.double-bass), llicència CC0.
- **Piano:** [Salamander Grand Piano](https://github.com/sfzinstruments/SalamanderGrandPiano), d'Alexander Holm,
  llicència [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Les mostres s'han convertit a mono, s'han retallat
  i s'han igualat de volum.
- **Rhodes:** MusyngKite; **guitarra jazz, baix elèctric i guitarra elèctrica:** FatBoy (i el contrabaix i el piano de
  reserva, MusyngKite). Tots de [gleitz/midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts), llicència
  CC BY-SA 3.0. Les mostres s'han convertit a mono i s'han retallat.
- **Bateria:** [Virtuosity Drums](https://github.com/sfzinstruments/virtuosity_drums), de Versilian Studios / Virtuosity
  Musical Instruments, llicència CC0.
- **Tipografia:** [Saira](https://github.com/google/fonts/tree/main/ofl/sairasemicondensed), llicència SIL OFL 1.1.
- **Tipografia de la partitura:** [Fira Sans Extra Condensed](https://github.com/google/fonts/tree/main/ofl/firasansextracondensed) (subconjunt), llicència SIL OFL 1.1.
- **Desofuscació del format d'iReal Pro:** basada en el treball de la comunitat (pianosnake/ireal-reader).
