// JazzDojo app: state, persistence, scheduling loop and UI wiring.
import { parseChord, pretty, chordParts, spellDegree, family, FLATS, DEGREES } from './theory.js';
import { parseIReal, parseTextChords, eventsToText, generateCycle, cycleRoots, QUALS, CYCLES } from './ireal.js';
import { ArpEngine } from './arps.js';
import { Sequencer, layout } from './sequencer.js';
import { Groove } from './groove.js';
import { METERS, GROUPINGS, groupsOf, meterGrid, groupLabel } from './meter.js';
import { AudioEngine } from './audio.js';
import { getLang, setLang, startI18n, LANGS, LANG_NAMES } from './i18n.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------------- storage ---------------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
};
const BELTS = [['blanc', '#EDEBE4', 'Blanc'], ['groc', '#E9C33B', 'Groc'], ['taronja', '#E8873A', 'Taronja'], ['verd', '#4E9A5A', 'Verd'],
  ['blau', '#3F78C0', 'Blau'], ['marro', '#7A5233', 'Marró'], ['negre', '#0E0D0B', 'Negre']];
const DEF = {
  degrees: [1, 3, 5, 7, 9], len: 5, source: 'random', order: 'shuffle',
  sets: [{ id: 'set1', name: 'Bàsics', text: '13579, 53971, 97531, 35791, 1357, 7531' }], setId: 'set1',
  change: 'chord', every: { beats: 2, bars: 2 }, syncChord: true, laps: 'new',
  leadBeats: 2, harmonyPop: 'piano', countBars: 1, complexity: 0.5, harmony: 'piano', theme: 'dark', vol: { bass: 0.5, drums: 0.7, comp: 0.6, master: 0.85 },
  songId: null, songPrefs: {}, hideNames: false,
};
const S = Object.assign({}, DEF, store.get('jd.settings', {}));
S.vol = Object.assign({}, DEF.vol, S.vol || {});
S.every = Object.assign({}, DEF.every, S.every || {});
if (!S.sets || !S.sets.length) S.sets = DEF.sets;
// settings from older versions: no more "seconds" mode or reveal modes, quieter bass by default
if ((S.v || 0) < 3) {
  if (S.change === 'seconds' || S.change === 'beats') S.change = 'chord';
  if (S.vol.bass === 0.8) S.vol.bass = 0.6;
  S.leadBeats = 1;
  delete S.lead; delete S.sharp11;
  delete S.onlyWritten;
  S.v = 3;
}
// v6: the bass is quieter by default
if ((S.v || 0) >= 3 && S.v < 6 && S.vol.bass === 0.6) S.vol.bass = 0.5;
// v4: new defaults — the next arpeggio shows 2 beats early, a 1-bar count-in
if (S.v < 4) { S.leadBeats = 2; S.countBars = 1; S.v = 4; }
if (S.change !== 'chord' && S.change !== 'bars') S.change = 'chord'; // "every N beats" was removed
if (S.countBars === undefined) { S.countBars = S.countIn === false ? 0 : 1; delete S.countIn; } // count-in: 0, 1 or 2 bars
const saveS = () => store.set('jd.settings', S);

const uid = () => 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
// The exercise that opens by default: Ariel Pierdomenico's chart of all the 9 and ♭9 chords around the cycle of fourths
const DEFAULT_IREAL = 'irealb://Acordes%209%20Y%20b9%201=Pierdomenico%20Ariel==Tango=C==1r34LbKcu7L9%5EBZ4C%5E9LZL9%5EbDZL9%5EbAZL%5E9bEZL9%5EbBZL9%5EFZGb%5E9L5TA%2A%5BL9bDZZA%5E9LL9bEZL9bBZL9FZ9LCB%2A%5B%209%5EGZL9%5EDZZAb9LL9%5EEZbEZL9ZB9LZL9b7FZL9b7CC%2A%5B%20%5D9GZL9DZL9AZL9EZBb7bL9bGZZL9b7Ab7b97AZL9b7EZL9b7BLZ9b7bGZL9b7bDZLb9LZDZL9b7%2DBZL9%5B%2ADC%2D9%2DbDZL9%2DbAZL9%2DEbZL9%2DbBZL9%2DFZL9LZGb%2D%209b7GDZLhb9LZA%2DEZLhbBZLhFZLhC%2AA%7B%5D%209%2DGZL9%2DDZL9bhLZA%2DEZL95%237bBbhLZBFZL5%237CB%2A%7B%7D%20hGLZhDZLhAZLhEZL%2Ch7%235LZGZLhb7DZL5%235LZA5%237EZL5%237BZL5%23b7GZL5%237bDZL5%237bLZA7%237bEZL%5E%2DbDZ7%235%20%7DAZL9%5E%2DbEZL9%5E%2DbZBL9%5E%2DFZL9%5E%2DCC%2A%5Bb%2D%5E9LGZL5%239LZGb%2D%5E9LZB%2D%5E9LZE%2D%5E9LZA%2D%5E9LZD%2D%5E9LZG%2D%5E9%20%5D%20=Latin%2DBrazil%3A%20Bossa%20Electric=60=1';
function defaultExercise() {
  const s = parseIReal(DEFAULT_IREAL)[0];
  return { ...s, id: 'demo0', title: 'Cicle de quartes · tots els acords de 9 i ♭9', style: 'swing', level: 'blanc', goals: ['cicle de quartes', 'extensions'], key: 'totes' };
}
function seedLibrary() {
  const a = generateCycle(['^9', '9', '-9'], 5, 0, 1);
  const b = generateCycle(['-7', '7', '^7'], 5, 0, 2);
  const c = generateCycle(['h7', '7alt', '-^7'], 5, 0, 2);
  return [
    defaultExercise(),
    { ...a, id: 'demo1', title: 'Cicle de quartes · Δ9, 9, m9', level: 'blanc', goals: ['cicle de quartes', 'extensions'], key: 'totes' },
    { ...b, id: 'demo2', title: 'Cicle de quartes · m7, 7, Δ7 (2 compassos)', level: 'groc', goals: ['cicle de quartes'], key: 'totes' },
    { ...c, id: 'demo3', title: 'Menor: ø7, 7alt, mΔ7', level: 'blau', goals: ['dominants alterats', 'menor'], key: 'totes' },
  ];
}
let library = store.get('jd.library', null);
if (!Array.isArray(library) || !library.length) library = seedLibrary();
// v5: the 9 / ♭9 cycle chart becomes the first exercise and opens by default, also for existing libraries
if (S.v < 5) {
  if (!library.some(x => x.id === 'demo0')) library.unshift(defaultExercise());
  S.songId = 'demo0'; S.v = 5;
  store.set('jd.library', library);
}
if (S.v < 6) S.v = 6;
// v7: the default exercise plays swing
if (S.v < 7) {
  const d = library.find(x => x.id === 'demo0');
  if (d && d.style === 'bossa') { d.style = 'swing'; store.set('jd.library', library); }
  S.v = 7;
}
const saveLib = () => store.set('jd.library', library);

/* ---------------- runtime state ---------------- */
let song = null;      // library entry
let seq = null;       // Sequencer for the laid-out song
const UI = { start: 0, range: null, loop: 'off', help: false, sel: null };
const audio = new AudioEngine('samples/');
const groove = new Groove();
const P = { playing: false, paused: false, next: 0, timer: null, vis: [], k: 0, nextK: 1, disp: 0, revealed: true, slotChord: {}, bar: null, endAt: 0 };

const prefs = () => (S.songPrefs[song.id] ||= {});
const tempo = () => prefs().tempo || song.bpm || 120;
const style = () => prefs().style || song.style || 'swing';
const meterStr = m => `${m.num}/${m.den}`;
const meterLabel = m => {
  const opts = GROUPINGS[meterStr(m)], g = groupsOf(m);
  if (!opts || opts.length < 2 || opts[0][1].join() === g.join()) return meterStr(m); // default grouping: just the meter
  return `${meterStr(m)} (${(opts.find(o => o[1].join() === g.join()) || [groupLabel(g)])[0]})`;
};
const keyLabel = k => String(k || '').replace(/^([A-G])b/, '$1♭').replace(/^([A-G])#/, '$1♯').replace(/-$/, 'm');
const parseMeter = s => { const [n, d] = String(s).split('/').map(Number); return { num: n || 4, den: d || 4 }; };
const arpOpts = () => ({});

const arps = new ArpEngine(() => ({
  source: S.source, degrees: S.degrees, len: S.len, onlyWritten: false, order: S.order,
  patterns: (S.sets.find(x => x.id === S.setId) || S.sets[0]).text,
}));
const chordForSlot = k => P.slotChord[k] || null;
const arpAt = k => arps.at(k, chordForSlot);

function seqCfg() {
  return {
    loop: UI.loop, range: UI.range, change: S.change, every: S.every[S.change] || 1,
    seconds: S.every.seconds, syncChord: true, laps: S.laps, // a new chord always brings a new arpeggio
  };
}
function buildSeq() {
  const meter = song.meter || { num: 4, den: 4 };
  const events = layout(song.events.map(e => ({ ...e, chord: parseChord(e.label) })), meter);
  seq = new Sequencer({ meter, events }, seqCfg);
}

function loadSong(id) {
  stop();
  song = library.find(s => s.id === id) || library[0];
  song.meter ||= { num: 4, den: 4 };
  S.songId = song.id; saveS();
  arps.reset();
  buildSeq();
  const p = prefs();
  const N = song.events.length;
  UI.start = Math.min(p.start || 0, N - 1);
  UI.range = p.range && p.range[1] < N ? p.range : null;
  UI.loop = p.loop || 'off';
  if (UI.loop === 'range' && !UI.range) UI.loop = 'off';
  restAll();
  renderAll();
}
function savePrefs() { const p = prefs(); p.start = UI.start; p.range = UI.range; p.loop = UI.loop; saveS(); }

/* ---------------- transport ---------------- */
async function play() {
  await audio.init();
  if (P.playing && P.paused) { await audio.resume(); P.paused = false; setPlayIcon(); wake(true); return; }
  if (P.playing) { await audio.suspend(); P.paused = true; setPlayIcon(); return; }
  await audio.resume();
  ensureSamples();
  audio.newSession();
  groove.reset();
  seq.reset(UI.start);
  P.slotChord = {};
  P.slotChord[0] = seq.E[seq.ev].chord;
  Object.assign(P, { playing: true, paused: false, vis: [], endAt: 0 });
  const m = song.meter, spb = 60 / tempo();
  let t = audio.now + 0.12;
  const bars = S.countBars || 0;
  if (bars > 0) {
    const gr = meterGrid(m);
    for (let i = 0; i < bars * m.num; i++) {
      const bb = i % m.num, e = bb * gr.perBeat;
      audio.click(t + i * spb, bb === 0 ? 2 : gr.startSet.has(e) ? 1 : 0);
      // one empty dot per beat of the bar; they fill up beat by beat (and start again on a second bar)
      P.vis.push({ t: t + i * spb, f: () => { $('progress').innerHTML = Array.from({ length: m.num }, (_, k) => `<i class="ci ${k <= bb ? 'on' : ''}"></i>`).join(''); } });
    }
    t += bars * m.num * spb;
  }
  P.next = t;
  clearInterval(P.timer);
  P.timer = setInterval(tick, 25);
  tick();
  wake(true);
  setPlayIcon();
}
function stop() {
  clearInterval(P.timer); P.timer = null;
  audio.endSession();
  if (audio.ctx && audio.ctx.state === 'suspended') audio.resume();
  const was = P.playing;
  Object.assign(P, { playing: false, paused: false, vis: [], bar: null });
  wake(false);
  if (was) arps.reset();
  if (song) restAll();
  setPlayIcon();
}
async function restart() {
  if (!P.playing) return play();
  if (P.paused) { await audio.resume(); P.paused = false; }
  audio.newSession();
  groove.reset();
  arps.reset();
  seq.reset(UI.start);
  P.slotChord = { 0: seq.E[seq.ev].chord };
  P.vis = [];
  P.next = audio.now + 0.08;
  setPlayIcon();
}
function tick() {
  if (!P.playing || P.paused) return;
  const now = audio.now;
  if (seq.done) { if (now > P.endAt) stop(); return; }
  while (P.next < now + 0.15 && !seq.done) {
    const spb = 60 / tempo();
    const b = seq.step(P.next, spb);
    onBeat(b);
    P.next += spb;
    if (b.done) {
      // the end: one hit of the exercise's first chord on the next downbeat, left to ring
      const endT = b.t + spb;
      const first = seq.E[0];
      if (first && first.chord) for (const n of groove.ending(first.chord, endT, spb, { style: style(), harmony: harmonyFamily() })) {
        const snd = sounds();
        if (n.kind === 'bass') n.inst = snd.bass; else if (n.kind === 'chord') n.inst = snd.harmony;
        audio.play(n);
      }
      P.endAt = endT + Math.max(1.6, spb * 2.5);
    }
  }
}
function onBeat(b) {
  // which chord each arpeggio slot belongs to (for "only written degrees" and note names)
  for (const c of b.changes) {
    P.slotChord[c.k] = b.ev.chord;
    if (S.change === 'chord' && b.nextEv) P.slotChord[c.nextK] = b.nextEv.chord;
    arpAt(c.k); arpAt(c.nextK);
    const k = c.k, nk = c.nextK;
    P.vis.push({ t: c.t, f: () => showArp(k, nk, true) });
  }
  // one line of digits: it switches to the next arpeggio `leadBeats` beats (0, 0.5, 1…) before the change
  const L = S.leadBeats;
  if (L > 0 && b.slotLen) {
    const d = (b.slotLen - b.inSlot) - L;          // beats from this beat to the moment of switching
    if ((d >= 0 && d < 1) || (b.inSlot === 0 && d < 0)) {
      const k = b.k;
      P.vis.push({ t: b.t + Math.max(0, d) * b.spb + 1e-4, f: () => { if (P.k === k) showUpcoming(); } });
    }
  }
  const chordOnly = b.chordStart && !b.changes.some(c => Math.abs(c.t - b.t) < 1e-6);
  const info = { evIdx: b.evIdx, bar: b.barNo, lap: b.lap, inSlot: b.inSlot, slotLen: b.slotLen, up: b.upcoming, chordOnly };
  P.vis.push({ t: b.t, f: () => onBeatVisual(info) });
  const st = style(), snd = sounds();
  for (const n of groove.beat(b, { style: st, meter: song.meter, harmony: harmonyFamily(), tempo: tempo(), complexity: S.complexity })) {
    if (n.kind === 'bass') n.inst = snd.bass;
    else if (n.kind === 'chord') n.inst = snd.harmony;
    audio.play(n);
  }
}

/* ---------------- visuals ---------------- */
function visLoop() {
  if (audio.ctx && P.vis.length) {
    const now = audio.now;
    P.vis.sort((a, b) => a.t - b.t);
    while (P.vis.length && P.vis[0].t <= now) P.vis.shift().f();
  }
  requestAnimationFrame(visLoop);
}
const tilesHTML = arr => arr.map(d => `<span class="t"${d > 9 ? ' style="width:1.08em"' : ''}>${d}</span>`).join('');
/* Width of a line of digits in em (single digits .62, 11/13 1.08, gaps .16). The digits shrink to fit up to 7 notes
   with every extension on one line; the size only grows back when the arpeggio settings change, so it doesn't jump. */
const tilesW = arr => arr.reduce((w, d) => w + (d > 9 ? 1.08 : 0.62), 0) + 0.16 * Math.max(0, arr.length - 1);
function rowsW(list) { UI.tileW = Math.max(UI.tileW || 3.74, ...list.map(tilesW)); return UI.tileW.toFixed(2); }
/** One line of digits. It shows slot k (first digit in red) and switches to the next arpeggio a little before
 *  the change (`leadBeats`). Short ordered lists of own patterns are shown as fixed rows instead. */
function showArp(k, nk) {
  P.k = k; P.nextK = nk; P.upcoming = false;
  renderRows();
  if (UI.help) renderHelp();
}
function showUpcoming() { P.upcoming = true; renderRows(); }
function renderRows() {
  const box = $('rows');
  const fixed = arps.fixedRows();
  if (fixed) {
    const act = Math.max(0, arps.sourceIndex(P.k));
    box.className = 'rows r' + fixed.length;
    const w = rowsW(fixed);
    box.innerHTML = fixed.map((p, i) => `<div class="tiles ${i === act ? 'active' : ''}" style="--w:${w}">${tilesHTML(p)}</div>`).join('');
    P.shownKey = null;
    return;
  }
  box.className = 'rows r1';
  const arp = arpAt(P.upcoming ? P.nextK : P.k);
  const key = arp.join('-') + '/' + (P.upcoming ? P.nextK : P.k);
  if (key === P.shownKey && box.children.length === 1) return; // same arpeggio already on screen (e.g. it switched early)
  P.shownKey = key;
  box.innerHTML = `<div class="tiles active" style="--w:${rowsW([arp])}">${tilesHTML(arp)}</div>`;
}
function renderDots(inSlot, len, bpb) {
  const box = $('progress');
  if (inSlot < 0 || !len) { box.innerHTML = ''; return; }
  if (len > 32) { box.innerHTML = `<span class="hint num">${inSlot + 1} / ${len}</span>`; return; }
  let h = '';
  for (let i = 0; i < len; i++) { if (i && bpb && i % bpb === 0) h += '<i class="sep"></i>'; h += `<i class="${i <= inSlot ? 'on' : ''}"></i>`; }
  box.innerHTML = h;
}
let flashT = 0;
function onBeatVisual(i) {
  $('countLbl').textContent = '';
  renderDots(i.inSlot, i.slotLen, song.meter.num);
  P.pos = i;
  if (i.up) { P.up = i.up; highlightCell(i.evIdx); }
  if (i.chordOnly && S.change !== 'chord') {
    const f = $('chordFlash'); f.classList.add('on'); clearTimeout(flashT); flashT = setTimeout(() => f.classList.remove('on'), 650);
  }
  if (UI.help) renderHelp();
}
function restAll() {
  // resting state: show what the first slot will be
  if (!seq) return;
  const i = seq.startIndex(UI.start);
  P.slotChord = { 0: seq.E[i].chord };
  if (S.change === 'chord') { const n = seq.nextIdx(i); if (n >= 0) P.slotChord[1] = seq.E[n].chord; }
  P.up = seq.upcoming(i); P.pos = null; P.shownKey = null;
  showArp(0, 1);
  $('countLbl').textContent = '';
  $('progress').innerHTML = '';
  highlightCell(-1);
  renderHelp();
}
function renderHelp() {
  if (!UI.help || !seq) return;
  const up = P.up || seq.upcoming(seq.startIndex(UI.start));
  $('chickenChk').checked = !!S.chicken;
  $('chordView').classList.toggle('chick', !!S.chicken);
  $('chordView').innerHTML = up.map((ix, j) => {
    if (ix == null || ix < 0) return `<div class="c"><div class="n">—</div></div>`;
    const ev = seq.E[ix];
    // "chicken mode": also spell out the notes of the current arpeggio
    const notes = S.chicken && j === 0 && ev.chord ? arpAt(P.k).map(d => spellDegree(ev.chord, d, arpOpts())).join(' ') : '';
    return `<div class="c ${j === 0 ? 'cur' : ''}"><div class="n">${esc(pretty(ev.label))}</div>${notes ? `<div class="notes">${notes}</div>` : ''}</div>`;
  }).join('');
}
function setPlayIcon() {
  const on = P.playing && !P.paused;
  $('playIcon').innerHTML = on ? '<rect x="6.5" y="5.5" width="4" height="13" rx="1"/><rect x="13.5" y="5.5" width="4" height="13" rx="1"/>' : '<path d="M8 5.5v13l11-6.5z"/>';
  $('playBtn').setAttribute('aria-label', on ? 'Pausa' : 'Reprodueix');
}
let wakeLock = null;
async function wake(on) {
  try {
    if (on && !wakeLock && navigator.wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { /* not allowed here */ }
}

/* ---------------- samples ---------------- */
const loadState = {};
audio.onStatus = (inst, st) => { loadState[inst] = st; renderSoundStatus(); };
/* Pop uses its own band: electric bass, and piano / synth / clean electric guitar. */
const isPop = () => style() === 'even';
const harmonyFamily = () => (isPop() ? S.harmonyPop : S.harmony);
function sounds() {
  if (!isPop()) return { bass: 'bass', harmony: S.harmony };
  return { bass: 'ebass', harmony: { piano: 'piano', synth: 'synth', guitar: 'eguitar' }[S.harmonyPop] || 'piano' };
}
function ensureSamples() { const s = sounds(); audio.load('drums'); audio.load(s.bass); audio.load(s.harmony); }
function renderSoundStatus() {
  const s = sounds();
  const need = ['drums', s.bass, s.harmony];
  const st = need.map(k => loadState[k]);
  const el = $('soundStatus');
  el.classList.toggle('ready', st.every(x => x === 'ready'));
  el.querySelector('span').textContent = st.every(x => x === 'ready') ? 'Sons reals carregats'
    : st.some(x => x === 'error') ? 'No s\'han pogut carregar alguns sons: sonen sintetitzats'
      : st.some(x => x === 'loading') ? 'Carregant els sons reals… mentrestant sonen sintetitzats'
        : 'Els sons reals es carreguen quan prems ▶';
}

/* ---------------- render ---------------- */
function setSeg(id, val) { $(id).querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === val))); }
function renderLoop() {
  // icon only: grey = off, red outline = whole exercise, filled red = the selected bars
  const label = { off: 'Sense bucle', all: 'Bucle de tot l\'exercici', range: 'Bucle del tram triat' }[UI.loop];
  $('loopBtn').dataset.on = UI.loop === 'off' ? '0' : '1';
  $('loopBtn').dataset.mode = UI.loop;
  $('loopBtn').setAttribute('aria-label', label); $('loopBtn').title = label;
}
function renderHead() {
  $('songTitle').textContent = song.title;
  const STYLE_NAMES = { swing: 'Swing', bossa: 'Bossa', even: 'Pop', ballad: 'Balada' };
  $('songMeta').textContent = [`${song.events.length} acords`, meterLabel(song.meter), STYLE_NAMES[style()], song.key && song.key !== 'totes' ? `en ${keyLabel(song.key)}` : ''].filter(Boolean).join(' · ');
  const belt = BELTS.find(b => b[0] === song.level);
  $('songBelt').style.background = belt ? belt[1] : '';
  $('songBelt').title = belt ? `Cinturó ${belt[2]}` : '';
  $('meterSel').value = meterStr(song.meter);
  const opts = GROUPINGS[meterStr(song.meter)] || [];
  $('groupSel').hidden = opts.length < 2;
  $('groupSel').innerHTML = opts.map(([label, g]) => `<option value="${g.join(',')}">${label}</option>`).join('');
  $('groupSel').value = groupsOf(song.meter).join(',');
}
function renderTempo() { $('tempoOut').textContent = tempo(); $('tempoRange').value = tempo(); }
const PLAY_SVG = '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>';
/* Chord chart as a lead sheet, set like a real-book chart: big root, accidental raised, quality small and low,
   slash bass hanging below; 4 bars per line (8 in the big view on wide screens), boxed section letters. */
const SIMILE_SVG = '<svg viewBox="0 0 40 30" aria-hidden="true"><path d="M8 27 L32 3" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><circle cx="11" cy="9" r="3.6" fill="currentColor"/><circle cx="29" cy="21" r="3.6" fill="currentColor"/></svg>';
function chordHTML(label) {
  const c = chordParts(label);
  if (c.root === 'N.C.') return '<span class="ch"><b class="rt nc">N.C.</b></span>';
  const acc = c.root.slice(1), q = c.q.replace(/^m(?!aj)/, '−');
  return `<span class="ch"><b class="rt">${esc(c.root[0])}</b><span class="st"><span class="ac">${esc(acc)}</span><span class="ql">${esc(q)}</span>${c.bass ? `<span class="bs"><i>/</i>${esc(c.bass)}</span>` : ''}</span></span>`;
}
function scoreHTML(perLine) {
  const bpb = song.meter.num, E = seq.E;
  const total = E[E.length - 1].start + E[E.length - 1].beats;
  const nBars = Math.ceil(total / bpb);
  const bars = Array.from({ length: nBars }, () => []);
  E.forEach((e, i) => {
    const end = e.start + e.beats;
    for (let b = Math.floor(e.start / bpb); b * bpb < end; b++) {
      const s0 = Math.max(e.start, b * bpb), s1 = Math.min(end, (b + 1) * bpb);
      bars[b].push({ i, beats: s1 - s0, cont: s0 > e.start });
    }
  });
  const secAt = new Map((song.sections || []).filter(x => x.bar < nBars).map(x => [x.bar, x.label]));
  const [a, b] = UI.loop === 'range' && UI.range ? UI.range : [-1, -1];
  const cls = i => `${i >= a && i <= b ? 'inrange' : ''} ${i === UI.start ? 'start' : ''} ${E[i].label && !E[i].chord ? 'bad' : ''}`;
  const go = i => (i === UI.sel ? `<button class="go" data-go="${i}" aria-label="Toca des d'aquí">${PLAY_SVG}</button>` : '');
  const ts = `<span class="ts" aria-label="Compàs ${meterStr(song.meter)}"><b>${song.meter.num}</b><b>${song.meter.den}</b></span>`;
  const barHTML = (items, n) => {
    let inner;
    if (items.length === 1 && items[0].cont) inner = `<div class="cell sim ${cls(items[0].i)}" data-i="${items[0].i}" style="--b:1" aria-label="Repeteix">${SIMILE_SVG}</div>`;
    else inner = items.map(it => {
      if (it.cont) return `<div class="cell slash ${cls(it.i)}" data-i="${it.i}" style="--b:${it.beats}">/</div>`;
      return `<div class="cell ${cls(it.i)}" data-i="${it.i}" style="--b:${it.beats}" role="button" tabindex="0" aria-label="${esc(pretty(E[it.i].label))}">${chordHTML(E[it.i].label)}${go(it.i)}</div>`;
    }).join('');
    const sec = secAt.get(n);
    return `<div class="sbar ${n === nBars - 1 ? 'final' : ''} ${items.length > 1 ? 'multi' : ''} ${sec ? 'secL' : ''}">${sec ? `<span class="sec">${esc(sec)}</span>` : ''}${n === 0 ? ts : ''}${inner}</div>`;
  };
  let html = '';
  for (let l = 0; l < nBars; l += perLine) {
    let line = '';
    for (let n = l; n < l + perLine; n++) line += n < nBars ? barHTML(bars[n], n) : '<div class="sbar empty"></div>';
    html += `<div class="sline" style="--per:${perLine}">${line}</div>`;
  }
  return html;
}
/* Shrink crowded bars (several chords, long qualities) until every chord fits its share of the bar. */
function fitScore(el) {
  if (!el || !el.offsetParent) return;
  el.querySelectorAll('.sbar').forEach(bar => {
    bar.style.removeProperty('--k');
    const over = () => [...bar.querySelectorAll('.cell')].some(c => c.scrollWidth > c.clientWidth + 1);
    for (let k = 0.92; k >= 0.5 && over(); k -= 0.07) bar.style.setProperty('--k', k.toFixed(2));
  });
}
function renderGrid() {
  const g = $('grid');
  g.classList.toggle('hidenames', !!S.hideNames);
  g.innerHTML = scoreHTML(4);
  fitScore(g);
  if (!$('bigScore').hidden) {
    $('bigGrid').classList.toggle('hidenames', !!S.hideNames);
    $('bigGrid').innerHTML = scoreHTML(window.innerWidth >= 1000 ? 8 : 4);
    $('bigTitle').textContent = song.title;
    $('bigStyle').textContent = song.styleName || '';
    $('bigComposer').textContent = song.composer || '';
    fitScore($('bigGrid'));
  }
  if (P.playing && P.pos) highlightCell(P.pos.evIdx);
}
function highlightCell(i) {
  document.querySelectorAll('.score .cell.playing').forEach(c => c.classList.remove('playing'));
  if (i >= 0) document.querySelectorAll(`.score .cell[data-i="${i}"]`).forEach(c => c.classList.add('playing'));
}
function renderArpPane() {
  setSeg('srcSeg', S.source); setSeg('orderSeg', S.order); setSeg('changeSeg', S.change); setSeg('lapsSeg', S.laps);
  $('randomOpts').hidden = S.source !== 'random';
  $('listOpts').hidden = S.source !== 'list';
  $('degChips').innerHTML = DEGREES.map(d => `<button class="chip" data-d="${d}" aria-pressed="${S.degrees.includes(d)}">${d}</button>`).join('');
  S.len = Math.max(2, Math.min(S.len, 12));
  $('lenOut').textContent = S.len;
  const set = S.sets.find(x => x.id === S.setId) || S.sets[0];
  $('setSel').innerHTML = S.sets.map(x => `<option value="${x.id}" ${x.id === set.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
  if (document.activeElement !== $('patterns')) $('patterns').value = set.text;
  if (document.activeElement !== $('setName')) $('setName').value = set.name;
  $('everyRow').hidden = S.change === 'chord';
  $('everyLbl').textContent = S.change === 'bars' ? 'Cada quants compassos' : '';
  $('everyOut').textContent = S.every[S.change];
  $('leadOut').textContent = String(S.leadBeats).replace('.', ',');
  $('leadField').hidden = !!arps.fixedRows();
}
function renderSoPane() {
  setSeg('styleSeg', style());
  const opts = isPop() ? [['piano', 'Piano'], ['synth', 'Synth'], ['guitar', 'Guitarra']] : [['piano', 'Piano'], ['rhodes', 'Rhodes'], ['guitar', 'Guitarra']];
  $('harmSeg').innerHTML = opts.map(([v, l]) => `<button data-v="${v}">${l}</button>`).join('');
  setSeg('harmSeg', harmonyFamily());
  setSeg('countSeg', String(S.countBars));
  $('cxRange').value = Math.round(S.complexity * 100);
  $('cxOut').textContent = cxLabel(S.complexity);
  const names = { bass: 'Baix', drums: 'Bateria', comp: 'Harmonia', master: 'General' };
  $('mixer').innerHTML = Object.keys(names).map(k => `<div class="mix"><label for="v-${k}">${names[k]}</label><input type="range" id="v-${k}" data-k="${k}" min="0" max="100" value="${Math.round(S.vol[k] * 100)}"><output id="o-${k}">${Math.round(S.vol[k] * 100)}</output></div>`).join('');
  renderSoundStatus();
}
function applyTheme() {
  document.documentElement.setAttribute('data-jd-theme', S.theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = S.theme === 'light' ? '#EFEAE0' : '#17140F';
}
function renderAll() { renderHead(); renderTempo(); renderLoop(); renderGrid(); renderArpPane(); renderSoPane(); $('hideNames').checked = !!S.hideNames; $('help').hidden = !UI.help; renderHelp(); }

/* ---------------- arpeggio settings changes ---------------- */
function arpsChanged() {
  UI.tileW = 0;
  if (P.playing) { arps.reset(P.k); P.shownKey = null; renderRows(); }
  else { arps.reset(); restAll(); }
}

/* ---------------- events ---------------- */
$('playBtn').onclick = play;
$('stopBtn').onclick = stop;
$('restartBtn').onclick = restart;
$('loopBtn').onclick = () => {
  const order = UI.range ? ['off', 'all', 'range'] : ['off', 'all'];
  UI.loop = order[(order.indexOf(UI.loop) + 1) % order.length];
  renderLoop(); savePrefs(); renderGrid();
  if (!P.playing) restAll(); else renderHelp();
};
const setTempo = v => { prefs().tempo = Math.max(30, Math.min(320, Math.round(v))); saveS(); renderTempo(); };
$('tMinus').onclick = () => setTempo(tempo() - 1);
$('tPlus').onclick = () => setTempo(tempo() + 1);
// press on the bpm number and drag: up = faster, down = slower, in steps of 5
(() => {
  const el = $('tempoOut'); let d = null;
  el.addEventListener('pointerdown', e => { d = { y: e.clientY, v: tempo(), id: e.pointerId }; el.setPointerCapture(e.pointerId); el.classList.add('dragging'); e.preventDefault(); });
  el.addEventListener('pointermove', e => { if (!d || e.pointerId !== d.id) return; const steps = Math.trunc((d.y - e.clientY) / 14); setTempo(d.v + steps * 5); });
  const end = () => { d = null; el.classList.remove('dragging'); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
})();
$('tempoRange').oninput = e => setTempo(+e.target.value);
function toggleHelp() { UI.help = !UI.help; $('helpBtn').setAttribute('aria-pressed', String(UI.help)); $('help').hidden = !UI.help; renderHelp(); }
$('helpBtn').onclick = toggleHelp;
$('chickenChk').onchange = e => { S.chicken = e.target.checked; saveS(); renderHelp(); };
$('themeBtn').onclick = () => { S.theme = S.theme === 'dark' ? 'light' : 'dark'; saveS(); applyTheme(); };
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button').forEach(x => x.setAttribute('aria-selected', String(x === b)));
  document.querySelectorAll('.pane').forEach(p => { p.hidden = p.id !== b.dataset.pane; });
  if (b.dataset.pane === 'pane-str') fitScore($('grid'));
});
const segVal = e => e.target.closest('button')?.dataset.v;
$('srcSeg').onclick = e => { const v = segVal(e); if (!v) return; S.source = v; saveS(); arpsChanged(); renderArpPane(); };
$('orderSeg').onclick = e => { const v = segVal(e); if (!v) return; S.order = v; saveS(); arpsChanged(); renderArpPane(); };
$('changeSeg').onclick = e => { const v = segVal(e); if (!v) return; S.change = v; saveS(); renderArpPane(); if (P.playing) seq.forceSlot = true; else restAll(); };
$('lapsSeg').onclick = e => { const v = segVal(e); if (!v) return; S.laps = v; saveS(); renderArpPane(); };
$('degChips').onclick = e => {
  const d = +e.target.closest('button')?.dataset.d; if (!d) return;
  S.degrees = S.degrees.includes(d) ? S.degrees.filter(x => x !== d) : [...S.degrees, d].sort((a, b) => a - b);
  if (S.degrees.length < 2) S.degrees = [1, 3];
  S.len = S.degrees.length; saveS(); renderArpPane(); arpsChanged();
};
$('lenMinus').onclick = () => { S.len = Math.max(2, S.len - 1); saveS(); renderArpPane(); arpsChanged(); };
$('lenPlus').onclick = () => { S.len = Math.min(12, S.len + 1); saveS(); renderArpPane(); arpsChanged(); };
function stepEvery(dir) {
  S.every[S.change] = Math.max(1, Math.min(S.change === 'beats' ? 32 : 16, S.every[S.change] + dir));
  saveS(); renderArpPane();
}
$('everyMinus').onclick = () => stepEvery(-1);
$('everyPlus').onclick = () => stepEvery(1);
$('leadMinus').onclick = () => { S.leadBeats = Math.max(0, S.leadBeats - 0.5); saveS(); renderArpPane(); };
$('leadPlus').onclick = () => { S.leadBeats = Math.min(8, S.leadBeats + 0.5); saveS(); renderArpPane(); };
// pattern sets
const curSet = () => S.sets.find(x => x.id === S.setId) || S.sets[0];
$('setSel').onchange = e => { S.setId = e.target.value; saveS(); renderArpPane(); arpsChanged(); };
$('setNew').onclick = () => { const s = { id: uid(), name: 'Conjunt ' + (S.sets.length + 1), text: curSet().text }; S.sets.push(s); S.setId = s.id; saveS(); renderArpPane(); $('setName').focus(); $('setName').select(); };
$('setDel').onclick = e => {
  const b = e.currentTarget;
  if (S.sets.length <= 1) { b.textContent = 'És l\'únic'; setTimeout(() => { b.textContent = 'Esborra'; }, 1500); return; }
  if (!b.classList.contains('danger')) { b.classList.add('danger'); b.textContent = 'Segur?'; setTimeout(() => { b.classList.remove('danger'); b.textContent = 'Esborra'; }, 2500); return; }
  S.sets = S.sets.filter(x => x.id !== S.setId); S.setId = S.sets[0].id; saveS(); b.classList.remove('danger'); b.textContent = 'Esborra'; renderArpPane(); arpsChanged();
};
$('setName').oninput = e => { curSet().name = e.target.value || 'Sense nom'; saveS(); const o = $('setSel').selectedOptions[0]; if (o) o.textContent = curSet().name; };
let patT = 0;
$('patterns').oninput = e => { curSet().text = e.target.value; saveS(); clearTimeout(patT); patT = setTimeout(() => { arpsChanged(); renderArpPane(); }, 400); };
// sound
$('styleSeg').onclick = e => { const v = segVal(e); if (!v) return; prefs().style = v; saveS(); renderSoPane(); renderHead(); if (audio.ctx) ensureSamples(); };
$('harmSeg').onclick = e => { const v = segVal(e); if (!v) return; if (isPop()) S.harmonyPop = v; else S.harmony = v; saveS(); setSeg('harmSeg', v); if (audio.ctx) ensureSamples(); renderSoundStatus(); };
$('countSeg').onclick = e => { const v = segVal(e); if (v == null) return; S.countBars = +v; saveS(); setSeg('countSeg', v); };
function cxLabel(c) { return c < 0.2 ? 'Molt simple' : c < 0.4 ? 'Simple' : c <= 0.6 ? 'Normal' : c <= 0.8 ? 'Ric' : 'Molt ric'; }
$('cxRange').oninput = e => { S.complexity = e.target.value / 100; $('cxOut').textContent = cxLabel(S.complexity); saveS(); };
$('mixer').oninput = e => { const k = e.target.dataset.k; if (!k) return; S.vol[k] = e.target.value / 100; $('o-' + k).textContent = e.target.value; audio.setVolumes(S.vol); saveS(); };
audio.setVolumes(S.vol);
// structure
$('meterSel').onchange = e => { stop(); song.meter = parseMeter(e.target.value); saveLib(); buildSeq(); restAll(); renderAll(); };
$('groupSel').onchange = e => { song.meter = { ...song.meter, groups: e.target.value.split(',').map(Number) }; saveLib(); if (seq) seq.song.meter = song.meter; renderHead(); };
$('hideNames').onchange = e => { S.hideNames = e.target.checked; saveS(); renderGrid(); };
$('bigBtn').onclick = () => { $('bigScore').hidden = false; renderGrid(); };
$('bigClose').onclick = () => { $('bigScore').hidden = true; };
window.addEventListener('resize', () => { if (!$('bigScore').hidden) renderGrid(); else fitScore($('grid')); });

/* Chord grid gestures:
   tap → select the chord (shows a ▶ button that plays from there)
   double tap → leave the loop and stop if there is a range loop; otherwise play from that chord
   press-and-hold + drag (or mouse drag) → select a range, which loops straight away */
function playFrom(i) {
  UI.start = i; UI.sel = null; savePrefs();
  if (P.playing) stop();
  renderGrid();
  play();
}
const G = { down: null, timer: 0, dragging: false, a: -1, b: -1, lastTap: { i: -1, t: 0 } };
const cellAt = (x, y) => { const el = document.elementFromPoint(x, y); const c = el && el.closest('.score .cell'); return c ? +c.dataset.i : -1; };
function paintDrag() {
  const [a, b] = [Math.min(G.a, G.b), Math.max(G.a, G.b)];
  document.querySelectorAll('.score .cell').forEach(c => { const i = +c.dataset.i; c.classList.toggle('inrange', i >= a && i <= b); });
}
function startDrag() {
  G.dragging = true; document.querySelectorAll('.score').forEach(x => x.classList.add('dragging'));
  if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) { /* ignore */ }
  paintDrag();
}
document.addEventListener('pointerdown', e => {
  if (!e.target.closest('.score') || e.target.closest('.go')) return;
  const i = cellAt(e.clientX, e.clientY); if (i < 0) return;
  G.down = { x: e.clientX, y: e.clientY, id: e.pointerId, type: e.pointerType };
  G.a = G.b = i; G.dragging = false;
  clearTimeout(G.timer);
  if (e.pointerType === 'mouse') { /* mouse: dragging starts as soon as it moves to another chord */ }
  else G.timer = setTimeout(() => { if (G.down) startDrag(); }, 320);
});
window.addEventListener('pointermove', e => {
  if (!G.down || e.pointerId !== G.down.id) return;
  const moved = Math.hypot(e.clientX - G.down.x, e.clientY - G.down.y);
  if (!G.dragging) {
    if (G.down.type === 'mouse') { const i = cellAt(e.clientX, e.clientY); if (i >= 0 && i !== G.a) startDrag(); else return; }
    else { if (moved > 10) { clearTimeout(G.timer); G.down = null; } return; } // a scroll, not a long press
  }
  const i = cellAt(e.clientX, e.clientY);
  if (i >= 0 && i !== G.b) { G.b = i; paintDrag(); }
});
// while dragging on touch screens, stop the page from scrolling
document.addEventListener('touchmove', e => { if (G.dragging) e.preventDefault(); }, { passive: false });
window.addEventListener('pointerup', e => {
  if (!G.down || e.pointerId !== G.down.id) return;
  clearTimeout(G.timer);
  const wasDrag = G.dragging;
  G.down = null; G.dragging = false; document.querySelectorAll('.score').forEach(x => x.classList.remove('dragging'));
  if (wasDrag) {
    const a = Math.min(G.a, G.b), b = Math.max(G.a, G.b);
    UI.range = [a, b]; UI.loop = 'range'; UI.start = a; UI.sel = null;
    savePrefs(); renderLoop(); renderGrid();
    if (!P.playing) restAll(); else renderHelp();
    return;
  }
  onTap(G.a);
});
window.addEventListener('pointercancel', () => { clearTimeout(G.timer); G.down = null; if (G.dragging) { G.dragging = false; document.querySelectorAll('.score').forEach(x => x.classList.remove('dragging')); renderGrid(); } });
function onTap(i) {
  const now = performance.now();
  const dbl = G.lastTap.i === i && now - G.lastTap.t < 350;
  G.lastTap = { i, t: dbl ? 0 : now };
  if (dbl) {
    if (UI.loop === 'range' && UI.range) {
      UI.range = null; UI.loop = 'off'; UI.sel = null;
      savePrefs(); renderLoop(); stop(); renderGrid();
    } else playFrom(i);
    return;
  }
  UI.sel = i; UI.start = i; savePrefs();
  renderGrid();
  if (!P.playing) restAll();
}
document.addEventListener('click', e => { const g = e.target.closest('.score .go'); if (g) { e.stopPropagation(); playFrom(+g.dataset.go); } });
document.addEventListener('keydown', e => {
  const c = e.target.closest && e.target.closest('.score .cell'); if (!c) return;
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); playFrom(+c.dataset.i); }
});
document.addEventListener('keydown', e => {
  if (e.target.closest('input,textarea,select') || !$('libSheet').hidden || !$('editSheet').hidden) return;
  if (e.code === 'Space') { e.preventDefault(); play(); }
  else if (e.key === 'Escape') stop();
  else if (e.key === 'a' || e.key === 'A') toggleHelp();
  else if (e.key === 'r' || e.key === 'R') restart();
  else if (e.key === 'ArrowUp') { e.preventDefault(); setTempo(tempo() + 1); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); setTempo(tempo() - 1); }
});

/* ---------------- library ---------------- */
const libF = { q: '', fam: null, level: null };
function songFamilies(s) { return [...new Set(s.events.map(e => family(parseChord(e.label))).filter(f => f !== 'altres'))]; }
function renderLib() {
  const fams = ['major', 'dominant', 'menor', 'm7♭5', 'disminuït', 'sus'];
  $('libFilters').innerHTML = fams.map(f => `<button class="chip" data-fam="${f}" aria-pressed="${libF.fam === f}">${f}</button>`).join('')
    + BELTS.map(([id, col, name]) => `<button class="chip" data-level="${id}" aria-pressed="${libF.level === id}" title="Cinturó ${name}"><span class="belt" style="background:${col}"></span></button>`).join('');
  const active = (libF.fam ? 1 : 0) + (libF.level ? 1 : 0);
  $('filterCount').textContent = active ? String(active) : '';
  const q = libF.q.toLowerCase();
  const items = library.filter(s => (!q || [s.title, s.key, ...(s.goals || [])].join(' ').toLowerCase().includes(q))
    && (!libF.fam || songFamilies(s).includes(libF.fam)) && (!libF.level || s.level === libF.level));
  const STYLE_NAMES = { swing: 'Swing', bossa: 'Bossa', even: 'Pop', ballad: 'Balada' };
  const PEN = '<svg class="ico" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>';
  const BIN = '<svg class="ico" viewBox="0 0 24 24"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg>';
  $('libList').innerHTML = items.length ? items.map(s => {
    const belt = BELTS.find(b => b[0] === s.level);
    const meta = [`${s.events.length} acords`, meterStr(s.meter || { num: 4, den: 4 }), STYLE_NAMES[s.style] || '', s.key && s.key !== 'totes' ? `en ${keyLabel(s.key)}` : ''].filter(Boolean).join(' · ');
    const tags = (s.goals || []).filter(Boolean).map(g => `<span class="tag">${esc(g)}</span>`).join('');
    const cur = s.id === song.id;
    return `<div class="excard ${cur ? 'cur' : ''}"><span class="stripe" style="${belt ? `background:${belt[1]}` : ''}" title="${belt ? `Cinturó ${belt[2]}` : ''}"></span>`
      + `<button class="open" data-load="${s.id}">${cur ? '<span class="now">Ara practiques</span>' : ''}<span class="ttl">${esc(s.title)}</span><span class="meta">${esc(meta)}</span>${tags ? `<span class="tags">${tags}</span>` : ''}</button>`
      + `<span class="acts"><button class="iconbtn" data-edit="${s.id}" aria-label="Edita «${esc(s.title)}»" title="Edita">${PEN}</button><button class="iconbtn" data-del="${s.id}" aria-label="Esborra «${esc(s.title)}»" title="Esborra">${BIN}</button></span></div>`;
  }).join('') : `<div class="exempty">${library.length ? 'Cap exercici coincideix amb la cerca.' : 'Encara no tens exercicis. Afegeix-ne un a «+ Afegeix».'}</div>`;
}
function libTab(v) {
  setSeg('libTabs', v);
  $('libListPane').hidden = v !== 'list';
  $('libAddPane').hidden = v !== 'add';
}
const openLib = () => { renderLib(); libTab('list'); $('libSheet').hidden = false; $('importMsg').hidden = true; $('libMsg').hidden = true; };
$('libTabs').onclick = e => { const v = segVal(e); if (v) libTab(v); };
let toastT = 0;
/* The top bar is sticky: other sticky things (the panel tabs) sit just below it. */
{
  const top = document.querySelector('.top');
  const setH = () => document.documentElement.style.setProperty('--toph', (top.offsetParent ? top.offsetHeight : 0) + 'px');
  setH(); window.addEventListener('resize', setH);
  if (window.ResizeObserver) new ResizeObserver(setH).observe(top);
}
/* Side by side (wide screens), the stage card and the Arpegis panel share one height: the shorter one grows
   to match. Mix and Acords are much longer, so they are left alone. */
{
  const stage = document.querySelector('.stage'), panel = document.querySelector('.panel');
  let busy = false;
  const even = () => {
    if (busy) return; busy = true;
    stage.style.minHeight = panel.style.minHeight = '';
    const wide = window.matchMedia('(min-width:920px)').matches;
    if (wide && !$('pane-arp').hidden) {
      const h = Math.max(stage.offsetHeight, panel.offsetHeight);
      stage.style.minHeight = panel.style.minHeight = h + 'px';
    }
    requestAnimationFrame(() => { busy = false; });
  };
  window.addEventListener('resize', even);
  document.querySelectorAll('[data-pane]').forEach(b => b.addEventListener('click', () => requestAnimationFrame(even)));
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => requestAnimationFrame(even)); [...stage.children].forEach(c => ro.observe(c)); ro.observe($('pane-arp')); }
  requestAnimationFrame(even);
}
/* Hidden signature: tap the logo five times in a row. */
{
  let taps = 0, tapT = 0;
  $('brand').addEventListener('click', () => {
    clearTimeout(tapT); tapT = setTimeout(() => { taps = 0; }, 700);
    if (++taps === 5) { taps = 0; toast('JazzDojo · fet per Edu Torné', false, 4000); }
  });
}
function toast(text, warn = false, ms = 3200) {
  const t = $('toast'); t.textContent = text; t.classList.toggle('warn', warn); t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, ms);
}
/** After importing or creating: confirm, close the list and go straight to practising it. */
function openPractice(text, warn = false) {
  $('libMsg').textContent = text + ' Obrint l\'exercici…';
  $('libMsg').classList.toggle('warn', warn); $('libMsg').hidden = false;
  setTimeout(() => {
    $('libSheet').hidden = true;
    document.querySelectorAll('.tabs button').forEach(x => x.setAttribute('aria-selected', String(x.dataset.pane === 'pane-arp')));
    document.querySelectorAll('.pane').forEach(p => { p.hidden = p.id !== 'pane-arp'; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast(text, warn, warn ? 6000 : 3200);
  }, 900);
}
$('libBtn').onclick = openLib;
$('songBtn').onclick = openLib;
$('libClose').onclick = () => { $('libSheet').hidden = true; };
$('libSheet').onclick = e => { if (e.target === $('libSheet')) $('libSheet').hidden = true; };
$('libSearch').oninput = e => { libF.q = e.target.value; renderLib(); };
$('filterBtn').onclick = () => { const f = $('libFilters'); f.hidden = !f.hidden; $('filterBtn').setAttribute('aria-expanded', String(!f.hidden)); };
$('libFilters').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.fam) libF.fam = libF.fam === b.dataset.fam ? null : b.dataset.fam;
  if (b.dataset.level) libF.level = libF.level === b.dataset.level ? null : b.dataset.level;
  renderLib();
};
$('libList').onclick = e => {
  const l = e.target.closest('[data-load]'), d = e.target.closest('[data-del]'), ed = e.target.closest('[data-edit]');
  if (l) { loadSong(l.dataset.load); $('libSheet').hidden = true; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  if (ed) openEditor(ed.dataset.edit);
  if (d) {
    if (!d.classList.contains('danger')) { d.classList.add('danger'); d.title = 'Toca un altre cop per esborrar'; toast('Toca la paperera un altre cop per esborrar l\'exercici.'); return; }
    if (library.length <= 1) { toast('No pots esborrar l\'únic exercici.', true); return; }
    library = library.filter(s => s.id !== d.dataset.del); saveLib();
    if (song.id === d.dataset.del) loadSong(library[0].id);
    renderLib();
  }
};
function addSongs(list) {
  list.forEach(s => { s.id = uid(); s.level ||= 'blanc'; s.goals ||= []; });
  library = list.concat(library);
  saveLib(); loadSong(list[0].id); renderLib();
}
function importText(txt) {
  const msg = $('importMsg'); msg.hidden = false; msg.classList.remove('warn');
  if (!/irealb(ook)?:\/\//.test(txt)) {
    msg.textContent = 'No hi trobo cap cançó d\'iReal Pro. Tria el fitxer .html exportat o enganxa l\'enllaç irealb://. Per escriure acords a mà, fes servir «Escriu els acords».';
    msg.classList.add('warn'); return;
  }
  let songs = [];
  try { songs = parseIReal(txt); } catch (err) { songs = []; }
  if (!songs.length) { msg.textContent = 'He trobat un enllaç d\'iReal Pro però no n\'he pogut llegir els acords.'; msg.classList.add('warn'); return; }
  addSongs(songs);
  const bad = [...new Set(songs.flatMap(s => s.unknown))];
  msg.hidden = true;
  openPractice((songs.length === 1 ? `Importat amb èxit: «${songs[0].title}».` : `Importades amb èxit ${songs.length} cançons; obro «${songs[0].title}».`)
    + (bad.length ? ` Atenció: no reconec ${bad.slice(0, 6).join(', ')}, i sonaran com a silenci.` : ''), bad.length > 0);
}
function createFromText(txt) {
  const msg = $('textMsg'); msg.hidden = false; msg.classList.add('warn');
  if (/irealb(ook)?:\/\//.test(txt)) { msg.textContent = 'Això és un enllaç d\'iReal Pro: enganxa\'l a «Importa d\'iReal Pro».'; return; }
  const r = parseTextChords(txt);
  if (!r) { msg.textContent = 'Escriu almenys un acord.'; return; }
  if (r.unknown.length) { msg.textContent = 'No reconec aquests acords: ' + r.unknown.slice(0, 8).join(', ') + '. Corregeix-los i torna-ho a provar.'; return; }
  addSongs([r]);
  msg.hidden = true;
  $('textIn').value = '';
  openPractice(`Exercici creat amb èxit (${r.events.length} acords).`);
}
$('importBtn').onclick = () => importText($('pasteIn').value);
$('textBtn').onclick = () => createFromText($('textIn').value);
$('fileIn').onchange = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => importText(String(rd.result)); rd.readAsText(f); };
// generator
const gen = { quals: ['^9', '9', '-9'] };
$('genRoot').innerHTML = FLATS.map((n, i) => `<option value="${i}">${n.replace('b', '♭')}</option>`).join('');
$('genCycle').innerHTML = CYCLES.map(([st, name]) => `<option value="${st}">${name}</option>`).join('');
for (const id of ['meterSel', 'genMeter', 'edMeter']) $(id).innerHTML = METERS.map(m => `<option value="${m}">${m}</option>`).join('');
$('genMeter').value = '4/4';
function renderGen() {
  $('genQual').innerHTML = QUALS.map(([q, n]) => { const ix = gen.quals.indexOf(q); return `<button class="chip" data-q="${q}" aria-pressed="${ix >= 0}">${n}${ix >= 0 ? `<span class="o">${ix + 1}</span>` : ''}</button>`; }).join('');
  const step = +$('genCycle').value, r = +$('genRoot').value;
  const g = cycleRoots(step, r).map(x => FLATS[x].replace('b', '♭'));
  $('genPreview').textContent = gen.quals.length ? `${gen.quals.length * 12} acords. Fonamentals: ${g.join(' ')}` : 'Tria almenys un tipus d\'acord.';
}
$('genQual').onclick = e => { const q = e.target.closest('button')?.dataset.q; if (!q) return; gen.quals = gen.quals.includes(q) ? gen.quals.filter(x => x !== q) : [...gen.quals, q]; renderGen(); };
$('genCycle').onchange = renderGen;
$('genRoot').onchange = renderGen;
$('genBtn').onclick = () => {
  if (!gen.quals.length) return;
  const s = generateCycle(gen.quals, +$('genCycle').value, +$('genRoot').value, +$('genBars').value, parseMeter($('genMeter').value));
  s.goals = [+$('genCycle').value === 0 ? 'ordre aleatori' : (CYCLES.find(c => c[0] === +$('genCycle').value) || [0, ''])[1].toLowerCase()];
  s.key = 'totes';
  addSongs([s]);
  openPractice(`Exercici creat amb èxit: «${s.title}».`);
};
renderGen();
// editor
let editing = null;
function openEditor(id) {
  editing = library.find(s => s.id === id); if (!editing) return;
  $('edName').value = editing.title;
  $('edChords').value = eventsToText(editing.events);
  $('edMeter').value = meterStr(editing.meter || { num: 4, den: 4 });
  $('edKey').value = editing.key || '';
  $('edStyle').value = editing.style || 'swing';
  $('edGoals').value = (editing.goals || []).join(', ');
  $('edLevel').dataset.v = editing.level || 'blanc';
  renderLevels();
  $('editMsg').hidden = true;
  $('editSheet').hidden = false;
}
function renderLevels() {
  const v = $('edLevel').dataset.v;
  $('edLevel').innerHTML = BELTS.map(([id, col, name]) => `<button class="chip" data-l="${id}" aria-pressed="${v === id}"><span class="belt" style="background:${col}"></span>${name}</button>`).join('');
}
$('edLevel').onclick = e => { const b = e.target.closest('[data-l]'); if (!b) return; $('edLevel').dataset.v = b.dataset.l; renderLevels(); };
function readEditor() {
  let meter = parseMeter($('edMeter').value);
  if (editing.meter && meterStr(editing.meter) === meterStr(meter) && editing.meter.groups) meter = { ...meter, groups: editing.meter.groups };
  const r = parseTextChords($('edChords').value, meter);
  const m = $('editMsg');
  if (!r) { m.hidden = false; m.textContent = 'Escriu almenys un acord.'; return null; }
  if (r.unknown.length) { m.hidden = false; m.textContent = 'No reconec aquests acords: ' + r.unknown.slice(0, 8).join(', '); return null; }
  return {
    title: $('edName').value.trim() || 'Sense nom', events: r.events, meter, key: $('edKey').value.trim(),
    style: $('edStyle').value, level: $('edLevel').dataset.v, goals: $('edGoals').value.split(',').map(x => x.trim()).filter(Boolean),
  };
}
$('editSave').onclick = () => {
  const d = readEditor(); if (!d) return;
  Object.assign(editing, d); saveLib(); $('editSheet').hidden = true;
  if (editing.id === song.id) loadSong(song.id); else renderHead();
  renderLib();
};
$('editDup').onclick = () => {
  const d = readEditor(); if (!d) return;
  const copy = { ...editing, ...d, id: uid(), title: d.title === editing.title ? d.title + ' (còpia)' : d.title, src: 'text' };
  library.unshift(copy); saveLib(); $('editSheet').hidden = true; renderLib();
};
$('editClose').onclick = () => { $('editSheet').hidden = true; };
$('howBtn').onclick = () => { $('howSheet').hidden = false; };
$('howClose').onclick = () => { $('howSheet').hidden = true; };
$('howSheet').onclick = e => { if (e.target === $('howSheet')) $('howSheet').hidden = true; };
$('editSheet').onclick = e => { if (e.target === $('editSheet')) $('editSheet').hidden = true; };

/* ---------------- boot ---------------- */
applyTheme();
loadSong(S.songId);
requestAnimationFrame(visLoop);
const LANG = getLang();
// language menu (names are written in their own language, so they are never translated)
$('langMenu').innerHTML = LANGS.map(l => `<button role="menuitemradio" data-lang="${l}" lang="${l}" aria-checked="${l === LANG}" translate="no">${LANG_NAMES[l]}</button>`).join('');
const langOpen = open => { $('langMenu').hidden = !open; $('langBtn').setAttribute('aria-expanded', String(open)); };
$('langBtn').onclick = e => { e.stopPropagation(); langOpen($('langMenu').hidden); };
$('langMenu').onclick = e => {
  const b = e.target.closest('[data-lang]'); if (!b) return;
  langOpen(false);
  if (b.dataset.lang !== LANG) { setLang(b.dataset.lang); location.reload(); }
};
document.addEventListener('click', e => { if (!e.target.closest('.langwrap')) langOpen(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') langOpen(false); });
startI18n(LANG);
// offline mode only for the installed site (not when the page is embedded in another page)
if ('serviceWorker' in navigator && location.protocol === 'https:' && window.self === window.top) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline mode unavailable */ });
}
window.__jd = { S, P, get seq() { return seq; }, arps, audio, get song() { return song; } };
