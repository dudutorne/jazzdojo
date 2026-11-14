import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Groove } from '../src/groove.js';
import { Sequencer, layout } from '../src/sequencer.js';
import { parseChord } from '../src/theory.js';
import { generateCycle } from '../src/ireal.js';

function rng(seed = 1) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }

function render(style, harmony, meter = { num: 4, den: 4 }, bars = 1, seed = 11, complexity = 0.5) {
  const g = generateCycle(['^9', '7', '-9', 'h7', 'o7', '7alt'], 5, 0, bars, meter);
  const song = { meter, events: layout(g.events.map(e => ({ ...e, chord: parseChord(e.label) })), meter) };
  const seq = new Sequencer(song, () => ({ loop: 'off', change: 'chord', every: 1, laps: 'new' }));
  const gr = new Groove(rng(seed));
  const notes = []; let t = 0;
  while (!seq.done) { const b = seq.step(t, 0.5); notes.push(...gr.beat(b, { style, meter, harmony, tempo: 120, complexity }).map(n => ({ ...n, b }))); t += 0.5; }
  return notes;
}

for (const style of ['swing', 'bossa', 'even', 'ballad']) {
  for (const harmony of ['piano', 'rhodes', 'guitar', 'synth']) {
    test(`${style}/${harmony}: bass in range, chord notes belong to the chord, nothing rings past its chord`, () => {
      const notes = render(style, harmony);
      const bass = notes.filter(n => n.kind === 'bass');
      assert.ok(bass.length > 0);
      for (const n of bass) assert.ok(n.midi >= 28 && n.midi <= 50, `bass ${n.midi}`);
      for (const n of notes.filter(x => x.kind === 'chord')) {
        const ch = n.ant ? n.b.nextEv.chord : n.b.ev.chord; // anticipations belong to the next chord
        const pcs = Object.values(ch.iv).map(i => (ch.root + i) % 12);
        for (const m of n.midis) assert.ok(pcs.includes(m % 12), `${ch.label}: ${m}`);
        const chordEnd = (n.b.ev.start + n.b.ev.beats) * 0.5;
        if (!n.ant) assert.ok(n.t + n.dur <= chordEnd + 0.12, `${style} ${ch.label} rings past chord`);
      }
    });
  }
}
test('walking bass starts each chord on its root (or slash bass)', () => {
  const notes = render('swing', 'piano');
  for (const n of notes.filter(x => x.kind === 'bass' && x.b.chordStart)) assert.equal(n.midi % 12, n.b.ev.chord.root);
});
test('walking bass approaches the next root by step or fifth', () => {
  const notes = render('swing', 'piano').filter(x => x.kind === 'bass');
  for (let i = 1; i < notes.length; i++) {
    if (!notes[i].b.chordStart) continue;
    const d = Math.abs(notes[i].midi - notes[i - 1].midi);
    assert.ok([0, 1, 2, 3, 4, 5, 7].includes(d), `leap of ${d}`);
  }
});
test('odd and compound meters produce notes', () => {
  for (const m of [{ num: 3, den: 4 }, { num: 5, den: 4 }, { num: 6, den: 8 }, { num: 7, den: 4 }]) {
    const n = render('swing', 'piano', m);
    assert.ok(n.some(x => x.kind === 'drum') && n.some(x => x.kind === 'bass'));
  }
});
test('harmony stays in a middle register over a long progression', () => {
  for (const harmony of ['piano', 'rhodes', 'guitar']) {
    const notes = render('swing', harmony).filter(n => n.kind === 'chord').flatMap(n => n.midis);
    assert.ok(Math.max(...notes) <= 79, `${harmony} top ${Math.max(...notes)}`);
    assert.ok(Math.min(...notes) >= 43, `${harmony} bottom ${Math.min(...notes)}`);
    const mean = notes.reduce((x, y) => x + y, 0) / notes.length;
    assert.ok(mean < (harmony === 'guitar' ? 57 : 61), `${harmony} sits too high on average (${mean.toFixed(1)})`);
  }
});

import { meterGrid } from '../src/meter.js';
const MET = [{ num: 3, den: 4 }, { num: 3, den: 4, groups: [3, 3] }, { num: 5, den: 4, groups: [6, 4] }, { num: 5, den: 4, groups: [3, 3, 2, 2] },
  { num: 5, den: 8, groups: [2, 3] }, { num: 7, den: 8, groups: [2, 2, 3] }, { num: 7, den: 4, groups: [6, 8] }, { num: 4, den: 4, groups: [3, 3, 2] }, { num: 6, den: 8 }];
for (const m of MET) for (const style of ['swing', 'bossa', 'even', 'ballad']) {
  test(`${m.num}/${m.den} ${(m.groups || []).join('+')} ${style}: notes in range, in the chord, inside the bar grid`, () => {
    const notes = render(style, 'piano', m);
    const g = meterGrid(m);
    for (const n of notes.filter(x => x.kind === 'bass')) assert.ok(n.midi >= 28 && n.midi <= 50);
    for (const n of notes.filter(x => x.kind === 'chord')) {
      const ch = n.ant ? n.b.nextEv.chord : n.b.ev.chord;
      const pcs = Object.values(ch.iv).map(i => (ch.root + i) % 12);
      for (const mm of n.midis) assert.ok(pcs.includes(mm % 12));
    }
    // every bar starts with a bass note (unless the chord began in the previous bar)
    const firstBeats = notes.filter(x => x.kind === 'bass' && x.b.chordStart);
    assert.ok(firstBeats.length > 0);
    assert.ok(g.E > 0);
  });
}
test('straight styles put the kick on the group starts of the grouping (7/8 = 2+2+3)', () => {
  const m = { num: 7, den: 8, groups: [2, 2, 3] };
  const kicks = render('even', 'piano', m).filter(n => n.kind === 'drum' && n.name === 'kick').map(n => n.b.bib);
  assert.ok(kicks.length > 0);
  for (const b of kicks) assert.ok([0, 4].includes(b), `kick on eighth ${b}`);
  const snares = render('even', 'piano', m).filter(n => n.kind === 'drum' && n.name === 'snare' && Math.abs(n.t - n.b.t) < 0.02).map(n => n.b.bib);
  for (const b of snares) assert.ok([2, 6].includes(b), `snare on eighth ${b}`);
});
test('5/4 in 3+2 and 2+3 accent different beats', () => {
  const hh = gr => render('swing', 'piano', { num: 5, den: 4, groups: gr }).filter(n => n.kind === 'drum' && n.name === 'hhpedal').map(n => n.b.bib);
  assert.deepEqual([...new Set(hh([6, 4]))], [3]);
  assert.deepEqual([...new Set(hh([4, 6]))], [2]);
});
test('jazz waltz: hi-hat on 2 and 3, sometimes a 6/8 hemiola', () => {
  let hem = 0;
  for (let seed = 1; seed < 6; seed++) {
    const n = render('swing', 'piano', { num: 3, den: 4 }, 1, seed);
    const hh = n.filter(x => x.kind === 'drum' && x.name === 'hhpedal').map(x => x.b.bib);
    for (const b of hh) assert.ok([1, 2].includes(b));
    hem += n.filter(x => x.kind === 'drum' && x.name === 'snare' && x.b.bib === 1 && x.v > 0.3).length;
  }
  assert.ok(hem > 0, 'no hemiola heard');
});
test('harmony sometimes anticipates the next chord by an eighth, and then skips the downbeat', () => {
  for (const style of ['swing', 'bossa']) {
    const n = render(style, 'piano', { num: 4, den: 4 }, 1, 7);
    const ants = n.filter(x => x.kind === 'chord' && x.ant);
    assert.ok(ants.length > 2, `${style}: ${ants.length} anticipations`);
    for (const a of ants) {
      assert.equal(a.b.bi, a.b.ev.beats - 1);                       // on the last beat of the chord
      const nextStart = (a.b.ev.start + a.b.ev.beats) * 0.5;
      assert.ok(a.t < nextStart && a.t > nextStart - 0.5);            // an eighth before the next chord
      const downbeat = n.filter(x => x.kind === 'chord' && !x.ant && Math.abs(x.t - nextStart) < 0.03);
      assert.equal(downbeat.length, 0, 'anticipated chord hit again on the downbeat');
    }
  }
});

const ALLM = [{ num: 4, den: 4 }, ...MET];
test('chromatic bass notes only at the Difícil level, and never longer than an eighth', () => {
  let chromatic = 0;
  for (const m of ALLM) for (const style of ['swing', 'bossa', 'even', 'ballad']) for (const cx of [0, 0.5, 1]) for (const seed of [3, 9]) {
    const notes = render(style, 'piano', m, 1, seed, cx).filter(n => n.kind === 'bass');
    const spb = 0.5, eighth = (m.den === 8 ? spb : spb / 2);
    for (const n of notes) {
      // a chromatic approach: a semitone from the next chord's bass note and not a tone of the current chord
      const pcsOf = c => c ? Object.values(c.iv).map(i => (c.root + i) % 12) : [];
      const nx = n.b.nextEv && n.b.nextEv.chord;
      if (!nx || n.b.nextEv.label === n.b.ev.label) continue;
      const tgt = nx.bass ?? nx.root, d = ((n.midi - tgt) % 12 + 12) % 12;
      const isChrom = (d === 1 || d === 11) && !pcsOf(n.b.ev.chord).includes(n.midi % 12);
      if (isChrom) { if (cx < 1) chromatic++; assert.ok(n.dur <= eighth * 1.02, `${style} ${m.num}/${m.den} cx${cx}: chromatic ${n.midi} lasts ${n.dur.toFixed(3)}s`); }
    }
  }
  assert.equal(chromatic, 0, 'below the Difícil level the bass makes no chromatic approaches');
});
test('at the Difícil level the walking bass plays eighths, some of them chromatic approaches', () => {
  let eighths = 0, chrom = 0;
  for (const seed of [1, 2, 3, 4]) {
    const notes = render('swing', 'piano', { num: 4, den: 4 }, 1, seed, 1).filter(n => n.kind === 'bass');
    for (const n of notes) {
      if (Math.abs(((n.t - n.b.t) / 0.5) - 0.62) < 0.08 && !n.ghost) eighths++;
      const nx = n.b.nextEv && n.b.nextEv.chord;
      if (nx && n.b.nextEv.label !== n.b.ev.label) {
        const d = ((n.midi - (nx.bass ?? nx.root)) % 12 + 12) % 12;
        if ((d === 1 || d === 11) && !Object.values(n.b.ev.chord.iv).map(i => (n.b.ev.chord.root + i) % 12).includes(n.midi % 12)) chrom++;
      }
    }
  }
  assert.ok(eighths >= 6, `only ${eighths} sounding eighths`);
  assert.ok(chrom >= 2, `only ${chrom} chromatic approaches`);
});
test('swing bass sometimes plays a swung pair of eighths', () => {
  const notes = render('swing', 'piano', { num: 4, den: 4 }, 1, 5, 0.8).filter(n => n.kind === 'bass');
  const offbeats = notes.filter(n => Math.abs(((n.t - n.b.t) / 0.5) - 0.62) < 0.08);
  assert.ok(offbeats.length >= 3, `only ${offbeats.length} swung eighths`);
});
test('complexity: busier = more drum and harmony events, simple = two-feel bass', () => {
  for (const m of [{ num: 4, den: 4 }, { num: 7, den: 4, groups: [2, 2, 2, 2, 3, 3] }]) {
    const count = cx => { let d = 0, c = 0; for (const seed of [1, 2, 3, 4]) { const n = render('swing', 'piano', m, 1, seed, cx); d += n.filter(x => x.kind === 'drum').length; c += n.filter(x => x.kind === 'chord').length; } return [d, c]; };
    const [d0, c0] = count(0), [d1, c1] = count(1);
    assert.ok(d1 > d0, `drums ${d0} → ${d1}`);
    assert.ok(c1 > c0, `harmony ${c0} → ${c1}`);
  }
  const simple = render('swing', 'piano', { num: 4, den: 4 }, 1, 1, 0).filter(n => n.kind === 'bass');
  assert.ok(simple.every(n => n.b.bi % 2 === 0), 'two-feel bass plays on beats 1 and 3');
});
test('7/4 as 2+2+2+2+3+3 is felt 4+4+3+3: accents on eighths 0, 4, 8, 11 only; ride keeps a steady pulse', () => {
  const m = { num: 7, den: 4, groups: [2, 2, 2, 2, 3, 3] };
  const e8 = n => n.b.bib * 2 + (n.t - n.b.t > 0.05 ? 1 : 0);
  for (const style of ['swing', 'even']) {
    const n = render(style, 'piano', m, 1, 4);
    const hh = n.filter(x => x.kind === 'drum' && x.name === 'hhpedal').map(e8);
    for (const e of hh) assert.ok([4, 8, 11].includes(e), `${style}: hi-hat on eighth ${e}`);
    const kicks = n.filter(x => x.kind === 'drum' && x.name === 'kick' && x.v > 0.5).map(e8);
    for (const e of kicks) assert.ok([0, 8].includes(e), `${style}: strong kick on eighth ${e}`);
    const snares = n.filter(x => x.kind === 'drum' && x.name === 'snare' && x.v > 0.6).map(e8);
    for (const e of snares) assert.ok([4, 11].includes(e), `${style}: backbeat on eighth ${e}`);
  }
  // the ride flows in eighths: every eighth of the bar gets a ride hit; the loud ones are the group starts
  const rides = render('swing', 'piano', m, 1, 4).filter(x => x.kind === 'drum' && x.name === 'ride');
  const bars = new Map();
  for (const r of rides) { const k = r.b.barNo; if (!bars.has(k)) bars.set(k, new Set()); bars.get(k).add(e8(r)); }
  for (const set of bars.values()) assert.equal(set.size, 14);
  // dynamics: the ride phrases in quarters (2+2+2…) whatever the grouping: on-beats louder than offbeats
  const avg = f => { const v = rides.filter(f).map(x => x.v); return v.reduce((a, c) => a + c, 0) / v.length; };
  assert.ok(avg(r => e8(r) % 2 === 0) > avg(r => e8(r) % 2 === 1) + 0.15);
  assert.ok(Math.abs(avg(r => e8(r) === 9) - avg(r => e8(r) === 13)) < 0.08); // eighth 9 (in a 3-group) isn't singled out
});
test('very fast odd meters: the ride drops to quarter-note pulses', async () => {
  const { Groove } = await import('../src/groove.js');
  const { Sequencer, layout } = await import('../src/sequencer.js');
  const m = { num: 7, den: 8, groups: [2, 2, 3] };
  const g = generateCycle(['7'], 5, 0, 1, m);
  const song = { meter: m, events: layout(g.events.map(e => ({ ...e, chord: parseChord(e.label) })), m) };
  const seq = new Sequencer(song, () => ({ loop: 'off', change: 'chord', every: 1, laps: 'new' }));
  const gr = new Groove(rng(2)); let t = 0; const rides = [];
  while (!seq.done) { const b = seq.step(t, 0.12); rides.push(...gr.beat(b, { style: 'swing', meter: m, harmony: 'piano', tempo: 500 }).filter(n => n.kind === 'drum' && n.name === 'ride').map(() => b.bib)); t += 0.12; }
  for (const e of rides) assert.ok([0, 2, 4].includes(e), `ride on ${e}`);
});

test('bass: simpler settings play fewer and longer notes', () => {
  for (const [style, m] of [['swing', { num: 4, den: 4 }], ['even', { num: 4, den: 4 }], ['bossa', { num: 4, den: 4 }], ['swing', { num: 7, den: 4, groups: [2, 2, 2, 2, 3, 3] }], ['swing', { num: 3, den: 4 }]]) {
    const stats = cx => { let n = 0, d = 0; for (const seed of [1, 2, 3]) for (const x of render(style, 'piano', m, 2, seed, cx).filter(q => q.kind === 'bass')) { n++; d += x.dur; } return [n, d / n]; };
    const [n0, d0] = stats(0), [n5, d5] = stats(0.5), [n1, d1] = stats(1);
    assert.ok(n0 < n5 && n5 <= n1, `${style} ${m.num}/${m.den}: notes ${n0} ${n5} ${n1}`);
    assert.ok(d0 > d5 && d5 >= d1 * 0.95, `${style} ${m.num}/${m.den}: avg length ${d0.toFixed(2)} ${d5.toFixed(2)} ${d1.toFixed(2)}`);
  }
});
test('occasional ghost notes, always short', () => {
  let ghosts = 0;
  for (const seed of [1, 2, 3, 4]) for (const m of [{ num: 4, den: 4 }, { num: 3, den: 4 }]) {
    for (const n of render('swing', 'piano', m, 1, seed, 0.8).filter(q => q.kind === 'bass')) {
      if (n.ghost) { ghosts++; assert.ok(n.dur <= 0.26, 'ghost notes are short'); }
    }
  }
  assert.ok(ghosts > 0, 'no ghost notes');
});

test('pop: plain triads/7ths with the root, at every complexity, for piano, synth and guitar', () => {
  for (const harmony of ['piano', 'synth', 'guitar']) for (const cx of [0, 0.5, 1]) {
    const n = render('even', harmony, { num: 4, den: 4 }, 1, 3, cx).filter(x => x.kind === 'chord' && !x.ant);
    assert.ok(n.length > 0);
    for (const c of n) {
      const ch = c.b.ev.chord;
      assert.ok(c.midis.some(m => m % 12 === ch.root), `${harmony}: ${ch.label} voicing has no root`);
      assert.ok(c.midis.every(m => [0, ch.iv[3], ch.iv[5], ch.iv[7], ch.iv[9]].map(i => (ch.root + i) % 12).includes(m % 12)));
    }
  }
  const busy = cx => render('even', 'guitar', { num: 4, den: 4 }, 1, 3, cx).filter(x => x.kind === 'chord').length;
  assert.ok(busy(0) < busy(1)); // the harmony runs ahead of the fader, so its simplest tier is out of reach
});

test('ending: one hit of the chord, everything at the same moment', () => {
  const ch = parseChord('F^7');
  const n = new Groove(rng(1)).ending(ch, 10, 0.5, { style: 'swing', harmony: 'piano' });
  assert.ok(n.every(x => x.t === 10));
  assert.equal(n.filter(x => x.kind === 'bass')[0].midi % 12, 5);
  assert.ok(n.find(x => x.kind === 'chord').midis.length >= 3);
});

test('chromatic approach notes always resolve a semitone away, never an octave off', () => {
  let n = 0;
  for (const m of [{ num: 4, den: 4 }, { num: 3, den: 4 }, { num: 5, den: 4 }]) for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const notes = render('swing', 'piano', m, 1, seed, 1).filter(x => x.kind === 'bass' && !x.ghost);
    for (let i = 0; i < notes.length - 1; i++) {
      const a = notes[i], b = notes[i + 1];
      if (!b.b.chordStart || b.b === a.b) continue;
      const ch = a.b.ev.chord;
      const pcs = Object.values(ch.iv).map(k => (ch.root + k) % 12);
      if (pcs.includes(a.midi % 12)) continue; // a chord tone, not a chromatic approach
      n++;
      assert.equal(Math.abs(b.midi - a.midi), 1, `approach ${a.midi} → ${b.midi}`);
    }
  }
  assert.ok(n > 0, 'expected some chromatic approaches at the Difícil level');
});
test('the Normal level walks in quarter notes (4/4 swing)', () => {
  let withBass = 0, beats = 0;
  for (const seed of [1, 2, 3, 4]) {
    const all = render('swing', 'piano', { num: 4, den: 4 }, 2, seed, 0.5);
    const beatTimes = new Set(all.map(x => x.b.t));
    const bassOnBeat = new Set(all.filter(x => x.kind === 'bass' && x.t - x.b.t < 0.01).map(x => x.b.t));
    beats += beatTimes.size; withBass += bassOnBeat.size;
  }
  assert.ok(withBass / beats > 0.9, `bass on ${withBass} of ${beats} beats`);
});

// --- the three levels (Simple 0.2, Normal 0.5, Difícil 1) ---
const LEVELS = [0.2, 0.5, 1], M44 = { num: 4, den: 4 };
const frac = n => (n.t - n.b.t) / 0.5;            // where in its beat a note falls (the tests render at 0.5 s per beat)

test('walking bass never plays the same note twice in a row', () => {
  for (const m of [M44, { num: 3, den: 4 }, { num: 5, den: 4 }]) for (const cx of LEVELS) for (const seed of [1, 2, 3, 4, 5, 6]) {
    const notes = render('swing', 'piano', m, 2, seed, cx).filter(n => n.kind === 'bass' && !n.ghost);
    for (let i = 1; i < notes.length; i++) assert.notEqual(notes[i].midi, notes[i - 1].midi, `${m.num}/${m.den} cx${cx} seed${seed}: ${notes[i].midi} repeated`);
  }
});
test('ghost notes fall only on the weak eighth, and Simple has none', () => {
  let ghosts = 0;
  for (const cx of LEVELS) for (const seed of [1, 2, 3, 4, 5, 6]) {
    for (const n of render('swing', 'piano', M44, 2, seed, cx).filter(x => x.kind === 'bass' && x.ghost)) {
      assert.ok(cx > 0.3, 'no ghost notes at the Simple level');
      assert.ok(Math.abs(frac(n) - 0.62) < 0.08, `ghost note at ${frac(n).toFixed(2)} of the beat`);
      ghosts++;
    }
  }
  assert.ok(ghosts >= 4, `only ${ghosts} ghost notes`);
});
test('chromatic passing notes: weak eighths only, between two neighbours a semitone and a step away', () => {
  let n = 0;
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const notes = render('swing', 'piano', M44, 2, seed, 1).filter(x => x.kind === 'bass' && !x.ghost);
    for (let i = 1; i < notes.length - 1; i++) {
      const a = notes[i], ch = a.b.ev.chord;
      if (Object.values(ch.iv).map(k => (ch.root + k) % 12).includes(a.midi % 12)) continue;
      if (!notes[i + 1].b.chordStart) continue;       // (a scale tone inside the chord, not an approach)
      n++;
      assert.ok(Math.abs(frac(a) - 0.62) < 0.08, `chromatic note at ${frac(a).toFixed(2)} of the beat`);
      assert.equal(Math.abs(notes[i + 1].midi - a.midi), 1, `resolves ${a.midi} → ${notes[i + 1].midi}`);
      assert.ok(Math.abs(a.midi - notes[i - 1].midi) <= 7, `reached by a leap: ${notes[i - 1].midi} → ${a.midi}`);
    }
  }
  assert.ok(n >= 4, `only ${n} chromatic passing notes`);
});
test('harmony: some short, dry chords (never in a ballad), most of them long', () => {
  for (const cx of LEVELS) {
    let stabs = 0, all = 0;
    for (const seed of [1, 2, 3, 4]) for (const n of render('swing', 'piano', M44, 2, seed, cx).filter(x => x.kind === 'chord')) {
      all++;
      if (n.stab) { stabs++; assert.ok(n.dur <= 0.12, `a dry chord lasts ${n.dur.toFixed(2)}s`); }
    }
    assert.ok(stabs > 0 && stabs < all * 0.45, `cx${cx}: ${stabs} dry chords of ${all}`);
  }
  for (const seed of [1, 2, 3]) assert.ok(render('ballad', 'piano', M44, 2, seed, 1).every(n => !n.stab), 'no dry chords in a ballad');
});
test('harmony unfolds inside a chord: other inversions nearby, no big jumps, no minor ninths', () => {
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  for (const harmony of ['piano', 'guitar']) {
    let moved = 0, same = 0;
    for (const seed of [1, 2, 3, 4, 5]) {
      const chords = render('swing', harmony, M44, 2, seed, 0.5).filter(x => x.kind === 'chord');
      for (const c of chords) for (let i = 0; i < c.midis.length; i++) for (let j = i + 1; j < c.midis.length; j++) {
        const d = Math.abs(c.midis[j] - c.midis[i]);
        assert.ok(!(d >= 13 && d % 12 === 1), `minor ninth in ${c.midis}`);
      }
      for (let i = 1; i < chords.length; i++) {
        const a = chords[i - 1], b = chords[i];
        assert.ok(Math.abs(avg(b.midis) - avg(a.midis)) <= 7, `${harmony}: jump ${a.midis} → ${b.midis}`);
        if (a.b.ev !== b.b.ev || a.ant || b.ant) continue;
        if (a.midis.join() === b.midis.join()) same++; else moved++;
      }
    }
    assert.ok(moved > 0, `${harmony}: the chord never unfolds`);
    assert.ok(same > 0, `${harmony}: the chord never stays`);
  }
});
test('drums: an occasional soft crash, a few snare hits per bar', () => {
  for (const cx of LEVELS) {
    let crash = 0, snare = 0, bars = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const all = render('swing', 'piano', M44, 2, seed, cx);
      bars += new Set(all.map(x => x.b.t)).size / 4;
      for (const n of all.filter(x => x.kind === 'drum')) {
        if (n.name === 'crash') { crash++; assert.ok(n.v <= 0.6, `crash at ${n.v.toFixed(2)}`); }
        if (n.name === 'snare') snare++;
      }
    }
    assert.ok(crash >= 2 && crash <= bars / 4, `cx${cx}: ${crash} crashes in ${bars} bars`);
    assert.ok(snare / bars >= 1, `cx${cx}: ${(snare / bars).toFixed(1)} snare hits per bar`);
  }
});
