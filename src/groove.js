// Accompaniment generator: turns one beat of the sequencer into note events for bass, drums and harmony.
// Pure apart from the injectable RNG; the audio engine plays what it returns.
import { degreeInterval } from './theory.js';
import { meterGrid } from './meter.js';

export const STYLES = ['swing', 'bossa', 'even', 'ballad'];
export const HARMONY = ['piano', 'rhodes', 'guitar', 'synth'];

/** Pop harmony: plain triads and 7ths (root position colours), instead of rootless jazz voicings. */
export function popChord(ch) {
  const t = [0, ch.iv[3], ch.iv[5]];
  if (ch.written.includes(7)) t.push(ch.iv[7]);
  else if (ch.written.includes(9)) t.push(ch.iv[9]);
  return { ...ch, tones: [...new Set(t.map(x => x % 12))] };
}
const BASS_LO = 28, BASS_HI = 50;

export function swingRatio(style, tempo) {
  if (style !== 'swing' && style !== 'ballad') return 0.5;
  return Math.max(0.55, Math.min(0.68, 0.68 - (tempo - 90) * 0.0008));
}

export class Groove {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.reset();
  }
  reset() {
    this.lastBass = 36;
    this.nextTarget = null;
    this.lastVoicing = null;
    this.line = null;
    this.voice = null;
    this.unfoldDir = 0;
    this.chordHits = 0;
    this.fillDone = false;
    this.compPlan = [];
    this.bassPlan = null;
    this.bar = null;
    this.antNext = false;
    this.antSkip = false;
  }
  r(a = 0, b = 1) { return a + (b - a) * this.rng(); }
  pick(arr) { return arr[Math.floor(this.rng() * arr.length)]; }
  hum(ms) { return (this.rng() - 0.5) * 2 * ms / 1000; }

  /** Nearest MIDI note with pitch class `pc` to `near`, inside [lo, hi]. */
  nearest(pc, near, lo = BASS_LO, hi = BASS_HI) {
    let best = null, bd = 1e9;
    for (let m = lo; m <= hi; m++) if (((m % 12) + 12) % 12 === ((pc % 12) + 12) % 12) {
      const d = Math.abs(m - near);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }

  /** The root (or slash bass) a line for `ch` would start on now: where the previous line aimed, else the nearest one. */
  rootFor(ch) {
    const rootPc = ch.bass ?? ch.root, aimed = this.nextTarget;
    return aimed != null && ((aimed % 12) + 12) % 12 === rootPc && Math.abs(aimed - this.lastBass) <= 7 ? aimed
      : this.nearest(rootPc, Math.min(Math.max(this.lastBass, 31), 45), 28, 47);
  }

  /**
   * Bass line for a whole chord, one note per slot (a beat when walking, a half note in a two-feel…): the root first,
   * chord tones in between and an approach into the next chord (a chord tone next to the target, the next chord's
   * 5th…). Rules of the line:
   *  - no repeated notes: a note is never the same as the one before it, and it avoids the one two back;
   *  - with `pairs` a slot may become a swung pair of eighths {a, b} (b on the weak "and"): a ghost note (a muted,
   *    unpitched pluck), a skip to a chord tone, or a chromatic passing note;
   *  - chromatic notes are only ever those passing eighths: they sit a semitone from the note that follows, in the
   *    same register, and the note before them leads into them by step whenever it can.
   * @param o { pairs:boolean, pChrom:number, pSkip:number, pGhost:number, two:boolean (two-feel: favour the 5th) }
   */
  walk(ch, n, nextCh, o = {}) {
    const pairs = !!o.pairs, pChrom = o.pChrom || 0, pSkip = o.pSkip || 0;
    const rootPc = ch.bass ?? ch.root;
    const pc = m => ((m % 12) + 12) % 12;
    // the previous line already aimed at this root (e.g. with a chromatic approach): land exactly there, so the
    // approach is always a semitone and never jumps an octave
    const root = this.rootFor(ch);
    this.nextTarget = null;
    const pcs = [0, ch.iv[3], ch.iv[5], ch.iv[7], ch.iv[9]].map(i => (ch.root + i) % 12);
    const cands = [];
    for (let m = BASS_LO; m <= BASS_HI; m++) if (pcs.includes(m % 12)) cands.push(m);
    const nextPc = nextCh ? (nextCh.bass ?? nextCh.root) : rootPc;
    const before0 = this.lastBass;   // the note played just before this chord
    const out = [root];
    if (n === 1) { this.lastBass = root; this.nextTarget = null; return out; }
    const segs = [];
    for (let s = 0; s < n; s += 4) segs.push([s, Math.min(4, n - s)]);
    const inRange = m => m >= BASS_LO && m <= BASS_HI;
    const fifthPc = (ch.root + ch.iv[5]) % 12;
    let cur = root;      // first note of the segment being written
    segs.forEach(([s, len], si) => {
      if (si > 0) out.push(cur);                        // the note the previous bar approached
      const last = si === segs.length - 1;
      if (len === 1) { if (last) this.nextTarget = null; return; }
      // where this segment is heading: the next chord's root, or (inside a long chord) another chord tone
      let target;
      if (last) target = this.nearest(nextPc, cur + (this.rng() < 0.5 ? 3 : -3), 28, 47);
      else {
        const onlyOneLeft = segs[si + 1][1] === 1 && si + 1 === segs.length - 1;
        const opts = [ch.iv[5], ch.iv[3], 0].map(i => this.nearest((ch.root + i) % 12, cur, 28, 47))
          .filter(m => m !== cur && !(onlyOneLeft && pc(m) === nextPc));
        target = opts.length ? (this.rng() < 0.6 ? opts[0] : this.pick(opts)) : this.nearest(fifthPc, cur + 5, 28, 47);
      }
      const mids = len - 2;
      // the approach: a note that can last a whole slot (never chromatic), different from the target and from its neighbours
      const before = mids === 0 ? cur : null;   // with no notes in between, the approach follows the first note directly
      const ok = m => m !== target && m !== before && inRange(m);
      const notBack = list => { const f = list.filter(m => !(mids === 0 && si === 0 && m === before0)); return f.length ? f : list; };
      const near = notBack(cands.filter(m => ok(m) && Math.abs(m - target) <= 2));
      const fifthOfTarget = notBack([target + 7, target - 5].filter(ok));
      const ownFifth = [this.nearest(fifthPc, cur + 4, BASS_LO, BASS_HI)].filter(ok);
      const r = this.rng();
      let appr;
      if (o.two && ownFifth.length && r < 0.6) appr = ownFifth[0];
      else if (near.length && r < 0.5) appr = this.pick(near);
      else if (fifthOfTarget.length && r < 0.8) appr = fifthOfTarget.sort((x, y) => Math.abs(x - cur) - Math.abs(y - cur))[0];
      else {
        const ct = cands.filter(m => ok(m) && Math.abs(m - target) >= 2).sort((x, y) => Math.abs(x - target) - Math.abs(y - target));
        appr = ct[0] ?? fifthOfTarget[0] ?? near[0] ?? (inRange(target + 7) ? target + 7 : target - 5);
      }
      // notes in between: chord tones moving from the first note towards the approach
      let prev = cur, prev2 = si === 0 ? before0 : null;
      for (let j = 0; j < mids; j++) {
        const want = cur + (appr - cur) * (j + 1) / (mids + 1) + this.r(-2, 2);
        const lastMid = j === mids - 1;
        const allowed = cands.filter(m => m !== prev && Math.abs(m - prev) <= 7 && !(lastMid && m === appr));
        // better not to come back to the note two back (A-B-A), nor to play early the note the line is heading to
        const fresh = allowed.filter(m => m !== prev2 && !(lastMid && m === target) && !(j === mids - 2 && m === appr));
        const c = (fresh.length ? fresh : allowed).sort((x, y) => Math.abs(x - want) - Math.abs(y - want));
        prev2 = prev;
        prev = c[0] ?? prev;
        out.push(prev);
      }
      // a chromatic passing note on the weak eighth, a semitone from the next chord's root on the side the line
      // comes from; the note on the beat leads into it by step (or from a chord tone right next to it), so the three
      // notes always move in one direction within a third
      let pair = null;
      if (last && pairs && this.rng() < pChrom) {
        const first = Math.sign(prev - target) || (this.rng() < 0.5 ? 1 : -1);
        for (const dir of [first, -first]) {
          const lead = target + dir;
          if (!inRange(lead) || prev === lead) continue;                    // (never wobble back onto the note just played)
          const step = [lead + dir, lead + 2 * dir].filter(m => inRange(m) && m !== prev);
          const tone = cands.filter(m => (m - lead) * dir > 0 && (m - lead) * dir <= 4 && m !== prev).sort((x, y) => Math.abs(x - lead) - Math.abs(y - lead));
          const a = (this.rng() < 0.65 ? step[0] : tone[0]) ?? step[0] ?? tone[0];
          if (a !== undefined) { pair = { a, b: lead }; break; }
        }
      }
      out.push(pair || appr);
      cur = target;
      if (last) this.nextTarget = target;
    });
    // occasional swung eighths inside the line: a ghost note (a muted pluck, all noise) or a skip to a chord tone
    if (pairs) {
      // (also after the last note of the chord, where only a ghost note fits: the "and" before the next downbeat)
      const lastI = out.length - 1;
      if (typeof out[lastI] === 'number' && this.rng() < pSkip * 0.8) out[lastI] = { a: out[lastI], b: out[lastI], ghost: true };
      for (let i = 1; i < lastI; i++) {
        if (typeof out[i] !== 'number' || this.rng() >= pSkip) continue;
        const a = out[i], nx = typeof out[i + 1] === 'number' ? out[i + 1] : out[i + 1].a, nx2 = typeof out[i + 1] === 'number' ? null : out[i + 1].b;
        const step = cands.filter(m => m !== a && m !== nx && m !== nx2 && Math.abs(m - a) <= 4).sort((x, y) => Math.abs(x - nx) - Math.abs(y - nx))[0];
        const ghost = this.rng() < (o.pGhost ?? 0.7) || step === undefined;
        out[i] = { a, b: ghost ? a : step, ghost };
      }
    }
    const res = out.slice(0, n);
    const lastNote = res[res.length - 1];
    this.lastBass = typeof lastNote === 'number' ? lastNote : lastNote.b;
    return res;
  }

  /** Voicing register: low-middle (guitar around G2–D4, keys around C3–G4). */
  voiceSpec(ch, inst, style) {
    const c = style === 'even' ? popChord(ch) : ch;
    return inst === 'guitar' ? { c, lo: 43, hi: 62, max: style === 'even' ? 4 : 3, center: 52 } : { c, lo: 48, hi: 67, max: 4, center: 57 };
  }
  /** The voicing for a new chord: the good shape closest to the previous one. */
  voiceFor(ch, inst, style) {
    const { c, lo, hi, max, center } = this.voiceSpec(ch, inst, style);
    return this.voicing(c, lo, hi, max, center);
  }

  /**
   * Candidate voicings: every inversion of the close-position voicing and its drop-2 (the second voice from the top
   * dropped an octave, the classic jazz piano/guitar sound). Rejected: any minor 9th between two voices, and a voice a
   * semitone under the root down in the bass register (it rubs against the bass, e.g. the B of Cmaj9 against the C).
   * Minor 2nds and low seconds are allowed but cost (`pen`).
   */
  voicingCands(ch, lo, hi, maxNotes) {
    const pcs = [...new Set(ch.tones.slice(0, maxNotes).map(i => (ch.root + i) % 12))].sort((x, y) => x - y);
    const rootPc = ch.bass ?? ch.root;
    const cands = [];
    const consider = notes => {
      if (notes[0] < lo || notes[notes.length - 1] > hi) return;
      let m2 = 0;
      for (let i = 0; i < notes.length; i++) for (let j = i + 1; j < notes.length; j++) {
        const d = notes[j] - notes[i];
        if (d >= 13 && d % 12 === 1) return;            // minor 9th (or wider) between two voices: never
        if (d === 1) m2++;
      }
      // seconds down low sound muddy
      let mud = 0;
      for (let i = 0; i + 1 < notes.length; i++) if (notes[i + 1] - notes[i] <= 2 && notes[i] < 55) mud++;
      // a semitone under the root, low down, clashes with the bass (maj7 under the root → minor 9th / minor 2nd)
      if (notes.some(n => n < 55 && ((rootPc - n) % 12 + 12) % 12 === 1)) return;
      const key = notes.join(',');
      if (cands.some(c => c.key === key)) return;
      cands.push({ notes, key, pen: m2 * 5 + mud * 3, avg: notes.reduce((a, b) => a + b, 0) / notes.length, top: notes[notes.length - 1] });
    };
    for (let r = 0; r < pcs.length; r++) {
      const order = pcs.slice(r).concat(pcs.slice(0, r));
      for (let base = lo - 12; base < hi; base++) {
        if (base % 12 !== order[0]) continue;
        const close = [base];
        for (let k = 1; k < order.length; k++) { let m = close[k - 1] + 1; while (m % 12 !== order[k]) m++; close.push(m); }
        consider(close);
        // drop 2: the second voice from the top an octave lower (a triad opens up the same way)
        if (close.length >= 3) { const k = close.length - 2; consider([close[k] - 12, ...close.slice(0, k), ...close.slice(k + 1)]); }
      }
    }
    return cands;
  }
  /** Smooth voice leading: stay close to the previous voicing (its average and its top note), with only a gentle
   *  pull towards the middle so the comping doesn't creep up or down over time; big jumps are penalised hard. */
  voicing(ch, lo, hi, maxNotes = 4, center = (lo + hi) / 2) {
    const last = this.lastVoicing;
    const target = last ? last.reduce((a, b) => a + b, 0) / last.length : center;
    const lastTop = last ? last[last.length - 1] : center + 5;
    // a little headroom above the usual register (with a cost), so a chord that has unfolded upwards is followed smoothly
    const cands = this.voicingCands(ch, lo, hi + 5, maxNotes);
    if (!cands.length) {
      if (hi < lo + 30) return this.voicing(ch, lo, hi + 3, maxNotes, center); // allow a little more room
      this.lastVoicing = last || [lo + 4, lo + 10, lo + 14];
      return this.lastVoicing;
    }
    for (const c of cands) {
      const move = Math.abs(c.avg - target);
      c.score = move + Math.max(0, move - 3) * 2 + Math.abs(c.top - lastTop) * 0.4 + Math.abs(c.avg - center) * 0.3 + Math.max(0, c.top - (hi - 3)) * 0.8 + c.pen;
    }
    cands.sort((x, y) => x.score - y.score);
    let pick = cands[0];
    if (this.rng() < 0.2) { // now and then another good shape close by, so the same changes don't always get the same voicings
      const near = cands.filter(c => c.score < cands[0].score + 4 && (!last || c.key !== last.join(','))).slice(0, 4);
      if (near.length) pick = near[Math.floor(this.rng() * near.length)];
    }
    this.lastVoicing = pick.notes;
    return this.lastVoicing;
  }
  /**
   * Unfolds the chord that is sounding: the same chord in the next shape up or down (another inversion or drop-2),
   * one small step at a time. It keeps going the same way for a while and turns back before it leaves the register.
   */
  unfold(ch, inst, style) {
    const cur = this.lastVoicing;
    if (!cur) return this.voiceFor(ch, inst, style);
    const { c, lo, hi, max, center } = this.voiceSpec(ch, inst, style);
    const cands = this.voicingCands(c, lo, hi + 5, max);
    const avg = cur.reduce((a, b) => a + b, 0) / cur.length, key = cur.join(',');
    let dir = this.unfoldDir || (this.rng() < 0.5 ? 1 : -1);
    if (avg - center > 3.5) dir = -1; else if (avg - center < -3.5) dir = 1; else if (this.rng() < 0.3) dir = -dir;
    const minPen = Math.min(...cands.map(x => x.pen), 99);
    const step = d => cands.filter(x => x.key !== key && x.pen <= minPen + 5 && (x.avg - avg) * d >= 1 && (x.avg - avg) * d <= 5.5)
      .sort((x, y) => (Math.abs(x.avg - avg) + x.pen * 0.5) - (Math.abs(y.avg - avg) + y.pen * 0.5));
    let opts = step(dir);
    if (!opts.length) { dir = -dir; opts = step(dir); }
    if (!opts.length) return cur;
    this.unfoldDir = dir;
    this.lastVoicing = opts[0].notes;
    return this.lastVoicing;
  }

  /**
   * @param info  one beat from Sequencer.step()
   * @param o     { style, meter:{num,den,groups?}, harmony:'piano'|'rhodes'|'guitar', tempo }
   * @returns note events: {kind:'drum', name, t, v} | {kind:'bass', midi, t, dur, v}
   *          | {kind:'chord', inst, midis, t, dur, v, roll, ant?}  (ant: anticipates the next chord)
   */
  beat(info, o) {
    const g = meterGrid(o.meter);
    const out = [];
    const ctx = this.setup(info, o, g, out);
    if (g.standard) this.beat44(info, o, ctx);
    else this.beatGrid(info, o, g, ctx);
    if (info.ev.chord) this.anticipate(info, o, g, ctx);
    return out;
  }

  setup(info, o, g, out) {
    const { t, spb, ev } = info;
    const style = o.style;
    const jazz = style === 'swing' || style === 'ballad';
    // swung eighths only for jazz styles counted in quarters with even groups (jazz waltz included)
    const straight = !jazz || g.perBeat === 1 || g.oddGroups;
    const sw = straight ? 0.5 : swingRatio(style, o.tempo);
    const D = (name, tt, v) => out.push({ kind: 'drum', name, t: tt + this.hum(5), v: Math.max(0.05, Math.min(1, v * this.r(0.88, 1.08))) });
    const B = (midi, tt, dur, v, ghost = false) => out.push({ kind: 'bass', midi, t: tt + this.hum(4), dur, v: v * this.r(0.9, 1.05), ghost });
    const ch = ev.chord;
    const inst = o.harmony || 'piano';
    let antSkip = false;
    // complexity: three levels — simple (≈0.2), normal (0.5, the default groove) and busy (1). Values in between
    // still work; probabilities of extra hits scale ×0.3 … ×1.7
    const cx = o.complexity ?? 0.5;
    const level = cx < 0.35 ? 1 : cx <= 0.7 ? 2 : 3;
    if (ch && info.chordStart) {
      if (this.antNext) { antSkip = true; this.voice = this.antVoice; }
      else this.voice = this.voiceFor(ch, inst, style);
      this.chordHits = this.antNext ? 1 : 0;   // an anticipated chord has already been played once
      this.antNext = false;
      this.compPlan = [];
    }
    this.antSkip = info.chordStart ? antSkip : this.antSkip;
    const chordEnd = t + (ev.beats - info.bi) * spb; // never ring past the chord
    // from its second hit on, a chord may unfold: the same harmony in the next shape up or down
    const pUnfold = (inst === 'synth' ? 0 : style === 'even' ? 0.2 : inst === 'guitar' && style === 'swing' ? 0.3 : [0.25, 0.5, 0.6][level - 1]);
    // a stab ("acord sec"): now and then a hit is cut short instead of ringing
    const pStab = style === 'ballad' || style === 'even' ? 0 : [0.12, 0.25, 0.3][level - 1];
    const C = (tt, durSec, vel, roll = 0, midis = null, canStab = false) => {
      tt += this.hum(6);
      if (!midis) {
        if (this.chordHits > 0 && this.rng() < pUnfold) this.voice = this.unfold(ch, inst, style);
        midis = this.voice;
        this.chordHits++;
      }
      const stab = canStab && this.rng() < pStab;
      const dur = stab ? Math.max(0.07, 0.16 * spb) : durSec;
      out.push({ kind: 'chord', inst, midis, t: tt, dur: Math.max(0.05, Math.min(dur, chordEnd - tt + 0.03)), v: vel * (stab ? 1.1 : 1) * this.r(0.9, 1.08), roll: stab ? 0 : roll, ...(stab ? { stab: true } : {}) });
    };
    // the harmony plays clearly richer than the level says (jazz comping); the bass follows it as it is
    const bcx = cx, hcx = Math.min(1, cx + 0.3);
    // walking bass. Normal: quarter notes, with the odd ghost note on a weak eighth. Busy: more eighths — ghost notes,
    // skips to chord tones and chromatic passing notes into the next chord
    const top = Math.max(0, (cx - 0.7) / 0.3);
    const walkOpts = { pairs: true, pChrom: 0.65 * top, pSkip: 0.12 + 0.22 * top, pGhost: 1 - 0.45 * top };
    // the drums sit one step above the level: Normal plays what used to be the busiest groove, Alta goes further
    // (more snare comping, triplet ghost notes, longer fills, kick/snare conversations)
    const dcx = level === 1 ? cx : 1, dm = [0.3 + 1.4 * cx, 1.7, 2.4][level - 1], dhi = level === 3;
    return { out, t, spb, off: t + sw * spb, sw, style, jazz, straight, D, B, C, ch, inst, chordEnd, cx, level, m: 0.3 + 1.4 * cx, dcx, dm, dhi,
      bcx, bm: 0.3 + 1.4 * bcx, hcx, hm: 0.6 + 2 * hcx, top, walkOpts };
  }

  /* ================= 4/4 in quarters: hand-tuned grooves ================= */
  beat44(info, o, x) {
    const { t, spb, ev, bi } = info;
    const { D, B, C, off, sw, style, ch, inst, cx, bcx, hcx, dm: busy, dcx, dhi } = x;
    const num = 4, b = info.bib;
    const lastBeatOfPhrase = b === num - 1 && info.barNo % 4 === 0;

    if (style === 'swing') {
      const back = b % 2 === 1;
      D('ride', t, (b === 0 ? 0.62 : back ? 0.78 : 0.66));
      if (back) D('ride', off, 0.42);
      if (back) D('hhpedal', t, 0.75);
      if (this.rng() < 0.55) D('kick', t, 0.18);
      // snare comping: ghost notes on the "and" and the odd accent on the beat
      if (this.rng() < Math.min(dhi ? 0.7 : 0.56, 0.44 * busy)) D('snare', off, 0.22 * this.r(0.8, 1.2));
      if (this.rng() < Math.min(dhi ? 0.36 : 0.26, 0.19 * busy)) D('snare', t, 0.42 * this.r(0.8, 1.15));
      if (dcx > 0.7 && !back && this.rng() < 0.15 * busy) D('kick', off, 0.3);          // busier: kick/snare chatter
      if (dhi) {
        // Alta: triplet ghost notes inside the beat, the odd skip on the ride, snare answered by the kick
        if (this.rng() < 0.22) D('snare', t + spb / 3, 0.16 * this.r(0.8, 1.2));
        if (!back && this.rng() < 0.3) D('ride', off, 0.34);
        if (this.rng() < 0.12) { D('snare', t, 0.36); D('kick', off, 0.34); }
      }
      // kick punctuations ("bombs"): the "and" of the last beat before a chord change, and the odd off-beat drop
      if (info.nextEv && ev.beats - bi === 1 && this.rng() < 0.12 + 0.4 * dcx) D('kick', off, 0.32 + 0.16 * dcx);
      else if (this.rng() < 0.07 * busy) D('kick', this.rng() < 0.5 ? off : t, 0.28 + 0.15 * dcx);
      // a soft crash now and then: after a fill, or at the top of an eight-bar phrase
      if (b === 0 && info.barNo > 1 && this.rng() < (this.fillDone ? 0.45 : info.barNo % 8 === 1 ? 0.4 : 0.03)) { D('crash', t, this.r(0.26, 0.4)); if (this.rng() < 0.7) D('kick', t, 0.5); }
      if (b === 0) this.fillDone = false;
      if (lastBeatOfPhrase && this.rng() < Math.min(0.95, 0.7 * busy)) { D('snare', t, 0.5); D('snare', t + spb / 3, 0.3); D('snare', off, 0.6); if (this.rng() < 0.4) D('kick', off, 0.6); this.fillDone = true; }
      // Alta: a longer fill (two beats of triplets) at the end of an eight-bar phrase
      else if (dhi && b === num - 2 && info.barNo % 8 === 0 && this.rng() < 0.8) { for (let k = 0; k < 3; k++) D('snare', t + k * spb / 3, 0.3 + 0.1 * k); D('kick', off, 0.45); }
      if (b === 0 && info.barNo % 8 === 1 && info.barNo > 1 && this.rng() < busy) D('kick', t, 0.55);
    } else if (style === 'ballad') {
      D('ride', t, b === 0 ? 0.42 : 0.34);
      if (b % 2 === 1) { D('hhpedal', t, 0.6); if (this.rng() < 0.5) D('ride', off, 0.25); }
      if (b === 0) D('kick', t, 0.3);
      if (b === 2 && this.rng() < 0.3) D('xstick', t, 0.35);
      if (this.rng() < 0.2 * busy) D('snare', off, 0.14);
      if (dhi && b === 3 && info.barNo % 4 === 0 && this.rng() < 0.6) { D('snare', t, 0.24); D('snare', off, 0.3); }
      if (b === 0 && info.barNo > 1 && info.barNo % 8 === 1 && this.rng() < 0.3) D('crash', t, 0.22);
    } else if (style === 'bossa') {
      D('hhclosed', t, b === 0 ? 0.55 : 0.45); D('hhclosed', off, 0.3);
      if (b % 2 === 0) { D('kick', t, 0.62); D('kick', t + 1.5 * spb, 0.35); }
      const e = (((info.barNo - 1) % 2) * num + b) * 2 % 16;
      const clave = [0, 3, 6, 10, 12];
      if (clave.includes(e)) D('xstick', t, 0.7);
      if (clave.includes(e + 1)) D('xstick', off, 0.7);
      if (!clave.includes(e + 1) && this.rng() < 0.24 * busy) D('snare', off, 0.16);   // soft ghost notes between the clave
      if (dhi && b % 2 === 1 && this.rng() < 0.35) D('kick', off, 0.3);                 // Alta: the kick plays around the surdo pattern
      if (dhi && b === num - 1 && info.barNo % 4 === 0 && this.rng() < 0.7) { D('snare', t, 0.3); D('snare', t + spb / 4, 0.22); D('snare', off, 0.36); D('snare', t + 0.75 * spb, 0.42); this.fillDone = true; }
      if (b === 0 && info.barNo > 1 && info.barNo % 8 === 1 && this.rng() < 0.3) D('crash', t, 0.24);
    } else {
      D('hhclosed', t, 0.6); D('hhclosed', off, 0.38);
      if (b % 2 === 0) D('kick', t, 0.85); else D('snare', t, 0.8);
      if (b === num - 2 && this.rng() < 0.45 * busy) D('kick', off, 0.6);
      if (dhi) {
        // Alta: sixteenth-note kicks, snare ghost notes and open hi-hat on the "and"
        if (b % 2 === 0 && this.rng() < 0.3) D('kick', t + 0.75 * spb, 0.45);
        if (b % 2 === 1 && this.rng() < 0.35) D('snare', t + 0.75 * spb, 0.18);
        if (b === num - 1 && this.rng() < 0.25) D('hhhalf', off, 0.4);
      }
      if (b === 0 && info.barNo > 1 && this.rng() < (this.fillDone ? 0.6 : info.barNo % 8 === 1 ? 0.5 : 0)) D('crash', t, this.r(0.32, 0.45));
      if (b === 0) this.fillDone = false;
      if (lastBeatOfPhrase && this.rng() < Math.min(1, busy)) { D('snare', off, 0.55); D('snare', t + 0.75 * spb, 0.4); if (dhi) { D('snare', t, 0.5); D('snare', t + 0.25 * spb, 0.45); } this.fillDone = true; }
    }
    if (!ch) return;

    // bass
    if (info.chordStart) {
      // how the bass plays this chord depends on the complexity: long notes when simple, walking when busy
      // (from the middle of the fader the bass walks in quarter notes, the most typical jazz bass)
      this.bassMode = bcx < 0.12 ? 'whole'
        : bcx < 0.28 ? (this.rng() < 0.3 ? 'dotted' : 'two')
          : bcx < 0.42 ? (this.rng() < (bcx - 0.28) * 6 ? 'walk' : 'two')
            : 'walk';
      const nextCh = info.nextEv && info.nextEv.chord;
      if (style !== 'swing' || this.bassMode === 'walk') {
        const pairs = style === 'swing' && bcx >= 0.5;
        this.line = this.walk(ch, ev.beats, nextCh, pairs ? x.walkOpts : {});
      } else {
        // long notes: the line is written in bars ('whole') or half notes (two-feel, dotted), so it has no repeats either
        const per = this.bassMode === 'whole' ? 4 : 2;
        this.line = this.walk(ch, Math.ceil(ev.beats / per), nextCh, { two: true });
      }
    }
    const line = this.line || [this.nearest(ch.root, 36)];
    const val = n => (typeof n === 'number' ? n : n.a);
    const root = line[0];
    const fifth = this.nearest((ch.root + ch.iv[5]) % 12, root + 5, 28, 47);
    const at = i => val(line[Math.min(i, line.length - 1)]);
    const left = ev.beats - bi;
    const mode = this.bassMode;
    if (style === 'swing' && mode === 'whole') {
      if (bi % 4 === 0) B(at(bi / 4), t, spb * Math.min(4, left) * 0.95, 1);                  // one long note per bar
    } else if (style === 'swing' && mode === 'dotted') {
      if (bi % 4 === 0) B(at(bi / 2), t, spb * Math.min(3, left) * 0.93, 1);                  // dotted half…
      else if (bi % 4 === 3) B(at((bi - 1) / 2), t, spb * 0.9, 0.85);                          // …and a quarter into the next
    } else if (style === 'swing' && mode === 'two') {
      // two-feel: half notes; the last one of the chord is the approach note into the next chord
      if (bi % 2 === 0) B(at(bi / 2), t, spb * Math.min(2, left) * 0.93, bi === 0 ? 1 : 0.85);
    } else if (style === 'swing') {
      const n = line[Math.min(bi, line.length - 1)];
      if (typeof n === 'number') B(n, t, spb * 0.88, bi === 0 ? 1 : 0.85);
      else { B(n.a, t, sw * spb * 0.92, 0.88); B(n.b, off, (1 - sw) * spb * 0.9, n.ghost ? 0.6 : 0.72, !!n.ghost); } // swung pair of eighths
    } else if (style === 'ballad') {
      if (bcx < 0.3) { if (bi % 4 === 0) B(bi === 0 ? root : at(bi), t, spb * Math.min(4, left) * 0.95, 0.9); }
      else if (bi === 0) B(root, t, spb * Math.min(ev.beats, 2) * 0.95, 0.9);
      else if (bi % 2 === 0) B(at(bi), t, spb * 1.9, 0.75);
    } else if (style === 'bossa') {
      if (bcx < 0.3) { if (b % 2 === 0) B(b % 4 === 0 || bi === 0 ? root : fifth, t, spb * Math.min(2, left) * 0.93, 0.95); }
      else if (b % 2 === 0) B(b % 4 === 0 || bi === 0 ? root : fifth, t, spb * 1.4, 0.95);
      else {
        // the pickup eighth: the classic anticipation of the note that follows, or (so the line doesn't keep repeating
        // notes) a muted ghost note, another chord tone on the way, or nothing
        const pc3 = ch.iv[3] != null ? (ch.root + ch.iv[3]) % 12 : null;
        const prevN = (b - 1) % 4 === 0 || bi === 1 ? root : fifth;
        const nextCh = info.nextEv && info.nextEv.chord;
        const nextN = left > 1 ? ((b + 1) % 4 === 0 ? root : fifth)
          : nextCh ? this.rootFor(nextCh) : root;
        const tones = [pc3 != null ? this.nearest(pc3, (prevN + nextN) / 2, 28, 47) : null, root, fifth].filter(m => m != null && m !== prevN && m !== nextN);
        const r = this.rng(), hard = bcx > 0.7, tt = t + spb * 0.5;
        if (r < 0.12 && nextN !== prevN) B(nextN, tt, spb * 0.45, 0.6);
        else if (r < (hard ? 0.45 : 0.35)) B(nextN, tt, spb * 0.3, 0.55, true);
        else if (r < (hard ? 0.9 : 0.65) && tones.length) B(tones[0], tt, spb * 0.45, 0.6);
      }
    } else {
      const n = b % 4 === 2 ? fifth : root;
      if (bcx < 0.3) { if (b % 2 === 0) B(n, t, spb * Math.min(2, left) * 0.93, 1); }       // half notes
      else if (bcx < 0.6) B(n, t, spb * 0.9, b % 2 === 0 ? 1 : 0.8);                           // quarters
      else { B(n, t, spb * 0.45, b % 2 === 0 ? 1 : 0.75); B(n, t + spb * 0.5, spb * 0.4, 0.6); } // eighths
    }

    // harmony
    const skip0 = bi === 0 && this.antSkip; // the chord was already anticipated: don't hit it again on the downbeat
    const planBar = () => {
      const left = Math.min(num, ev.beats - bi);
      const opts = left >= 4 && hcx < 0.3 ? [[0], [0, 2], [1.5], [0, 2.5]]
        : left >= 4 && hcx > 0.9 ? [[0, 1, 1.5, 3], [0.5, 1.5, 2, 3.5], [0, 1.5, 2.5, 3.5], [0.5, 1, 2.5, 3], [0, 0.5, 2, 3], [0, 1.5, 2, 3.5]]
        : left >= 4 && hcx > 0.7 ? [[0, 1.5, 3], [0.5, 2, 3.5], [0, 1.5, 2.5], [0, 1, 2.5], [0.5, 1.5, 3], [0, 1.5, 2.5, 3.5], [0.5, 2, 3]]
        : left >= 4 ? [[0, 1.5], [1.5], [0, 2.5], [0.5, 2], [1.5, 3], [0], [2.5], [0, 2]]
        : left === 3 ? [[0], [0, 1.5], [1.5], [0.5, 2]]
          : left === 2 ? [[0], [0.5], [0, 1.5]] : [[0]];
      let p = this.pick(opts);
      if (bi === 0 && !p.some(q => q < 1) && this.rng() < 0.6) p = [0, ...p];
      p = p.filter(q => q < left - 0.5 || q === 0 || left < 4);
      if (bi === 0 && this.antSkip) p = p.filter(q => q !== 0);
      this.compPlan = p.map(q => q + bi);
    };
    if (style === 'swing') {
      if (inst === 'guitar') { if (!skip0) C(t, 0.5 * spb, b % 2 === 1 ? 0.6 : 0.5, 0.01); }
      else {
        if (bi === 0 || b === 0) planBar();
        for (const pos of this.compPlan) {
          if (Math.floor(pos) !== bi) continue;
          const tt = pos - bi === 0 ? t : off;
          const nextHit = this.compPlan.find(q => q > pos);
          const dur = nextHit !== undefined && nextHit - pos < 1.2 ? 0.45 : this.pick([0.5, 1, 1.5]);
          const lng = inst === 'rhodes' || inst === 'synth';
          C(tt, (lng ? dur * 1.4 : dur) * spb, (pos === 0 ? 0.8 : 0.68) * (lng ? 0.85 : 1), 0, null, true);
        }
      }
    } else if (style === 'ballad') {
      if (inst === 'guitar') {
        const v = this.voice, notes = v.concat(v.slice(1, -1).reverse());
        for (let h = 0; h < 2; h++) C(h ? off : t, 1.5 * spb, 0.5, 0, [notes[(bi * 2 + h) % notes.length]]);
      } else if (bi === 0 && !skip0) C(t, Math.min(ev.beats, num) * 0.98 * spb, 0.65, 0.03);
      else if (bi === 2 && ev.beats >= 4 && this.rng() < 0.35) C(off, 1.5 * spb, 0.4);
    } else if (style === 'bossa') {
      const e = (((info.barNo - 1) % 2) * num + b) * 2 % 16;
      const pat = [0, 3, 6, 10, 13];
      const roll = inst === 'guitar' ? 0.012 : 0;
      let hit = false;
      if (pat.includes(e) && !skip0) { C(t, 0.9 * spb, 0.62, roll, null, true); hit = true; }
      if (pat.includes(e + 1)) { C(off, 0.9 * spb, 0.58, roll, null, true); hit = true; }
      if (bi === 0 && !hit && !skip0) C(t, 0.9 * spb, 0.6, roll);
    } else {
      // pop: how busy the harmony is follows the level (simple / normal / busy)
      const left = ev.beats - bi;
      if (inst === 'synth') {
        if (bi === 0 && !skip0) C(t, ev.beats * 0.98 * spb, 0.55);                                  // held chord
        if (cx > 0.35 && bi > 0) C(off, 0.3 * spb, 0.35);                                             // light pulse
      } else if (inst === 'guitar') {
        if (cx < 0.35) { if ((bi === 0 && !skip0) || (bi % 4 === 0 && bi > 0)) C(t, Math.min(4, left) * 0.95 * spb, 0.55, 0.015); }
        else if (cx <= 0.7) { if (!(bi === 0 && skip0)) C(t, 0.85 * spb, b % 2 ? 0.45 : 0.55, 0.012); }  // quarter strums
        else { if (!(bi === 0 && skip0)) C(t, 0.45 * spb, 0.5, 0.012); C(off, 0.4 * spb, b % 2 ? 0.58 : 0.42, 0.01); } // eighths, accent on 2& and 4&
      } else {
        if (cx < 0.35) { if ((bi === 0 && !skip0) || b === 2) C(t, Math.min(2, left) * 0.95 * spb, 0.5); }
        else if (cx <= 0.7) {
          if (bi === 0 && !skip0) C(t, Math.min(ev.beats, num) * 0.9 * spb, 0.5);
          if (b % 2 === 1) C(off, 0.3 * spb, 0.55);
        } else { if (!(bi === 0 && skip0)) C(t, 0.4 * spb, b === 0 ? 0.6 : 0.45); C(off, 0.35 * spb, 0.4); } // pumping eighths
      }
    }
  }

  /* ================= any other meter / grouping: groove built from the eighth-note grid ================= */
  beatGrid(info, o, g, x) {
    const { t, spb, ev, bi } = info;
    const { D, B, C, off, sw, style, jazz, straight, ch, inst, dm: busy, dhi } = x;
    const pb = g.perBeat;
    // eighths that fall inside this beat, with their bar position and time
    const es = pb === 2 ? [{ j: 0, e: info.bib * 2, tt: t }, { j: 1, e: info.bib * 2 + 1, tt: off }] : [{ j: 0, e: info.bib, tt: t }];
    const eighth = pb === 2 ? spb / 2 : spb;
    // time from eighth a to eighth b inside a chord (swung offbeats are later than half a beat)
    const span = (a, b) => { const at = k => (pb === 2 ? Math.floor(k / 2) * spb + (k % 2 ? sw * spb : 0) : k * spb); return at(b) - at(a); };
    if (info.bib === 0 || !this.bar || this.bar.no !== info.barNo) {
      // per-bar choices: a 6/8 hemiola over 3/4 (accents on 1 and the "and" of 2), fills
      const waltz = o.meter.num === 3 && o.meter.den === 4 && !g.oddGroups;
      this.bar = { no: info.barNo, hemiola: waltz && this.rng() < 0.35 * x.m, fill: info.barNo % 4 === 0 && this.rng() < 0.6 * busy };
    }
    const hem = this.bar.hemiola;
    const lastBeat = info.bib === (g.E / pb) - 1;

    /* drums */
    for (const { j, e, tt } of es) {
      const start = g.startSet.has(e), major = g.majorSet.has(e), mi = g.majorOf[e];
      if (jazz && !straight) {
        // swung quarters (3/4, 5/4 in 3+2, 7/4 in 4+3…): steady ride, hi-hat on the felt groups
        if (j === 0) D('ride', tt, (e === 0 ? 0.64 : major ? 0.72 : 0.62) * (style === 'ballad' ? 0.6 : 1));
        else if (info.bib % 2 === 1 && !hem) D('ride', tt, 0.4 * (style === 'ballad' ? 0.7 : 1));
        if (major && e !== 0 && !(hem && e === 2)) D('hhpedal', tt, 0.72);
        if (hem && (e === 0 || e === 3)) { D(e === 0 ? 'kick' : 'snare', tt, e === 0 ? 0.4 : 0.42); if (e === 3) D('ride', tt, 0.55); }
        else if (major && this.rng() < 0.5) D('kick', tt, e === 0 ? 0.3 : 0.18);
        if (j === 1 && this.rng() < Math.min(dhi ? 0.72 : 0.6, 0.4 * busy)) D('snare', tt, 0.22);
        else if (j === 0 && this.rng() < Math.min(dhi ? 0.34 : 0.25, 0.14 * busy)) D('snare', tt, 0.4);
        if (dhi && j === 0 && this.rng() < 0.2) D('snare', tt + spb / 3, 0.16);   // Alta: triplet ghost notes
      } else if (jazz) {
        // odd groupings or x/8: the ride keeps flowing in eighths whatever the grouping; the groups only shape its
        // dynamics. Very fast tempos drop to quarter-note pulses (every 2 eighths, or the group starts in x/8).
        const fast = eighth < 0.15;
        const plays = !fast || (pb === 2 ? j === 0 : start);
        if (plays) {
          // x/4: the ride phrases as if the bar were 2+2+2… (quarters with eighths in between) — the 3-groups are
          // left to the other instruments. x/8: the ride follows the groups.
          const base = pb === 2 ? (j === 0 ? (e === 0 ? 0.72 : 0.62) : 0.4)
            : (major ? 0.74 : start ? 0.6 : 0.42);
          D('ride', tt, base * this.r(0.94, 1.06));
        }
        if (major && e !== 0) D('hhpedal', tt, 0.65);
        if (e === 0) D('kick', tt, 0.4);
        else if (major && this.rng() < 0.3) D('kick', tt, 0.22);
        if (major && mi === g.majors.length - 1 && this.rng() < 0.4 * busy) D('xstick', tt, 0.35);
        // kick punctuations: the last eighth before a chord change, and the odd drop elsewhere
        const cxs = x.dcx;
        if (info.nextEv && ev.beats - bi === 1 && j === pb - 1 && this.rng() < 0.12 + 0.4 * cxs) D('kick', tt, 0.3 + 0.12 * cxs);
        else if (!major && this.rng() < 0.05 * busy) D('kick', tt, 0.28 + 0.15 * cxs);
        if (!start && this.rng() < Math.min(dhi ? 0.62 : 0.5, 0.3 * busy)) D('snare', tt, 0.2);
        else if (start && this.rng() < Math.min(dhi ? 0.3 : 0.22, 0.12 * busy)) D('snare', tt, 0.38);
      } else {
        D('hhclosed', tt, start ? 0.55 : 0.32);
        if (major) {
          if (mi % 2 === 0) D('kick', tt, e === 0 ? 0.8 : 0.65);
          else D(style === 'bossa' ? 'xstick' : 'snare', tt, style === 'bossa' ? 0.7 : 0.78);
        } else if (start && this.rng() < 0.25 * busy) D(style === 'bossa' ? 'xstick' : 'kick', tt, 0.4);
      }
      // a soft crash now and then: after a fill, or at the top of an eight-bar phrase
      if (e === 0 && info.barNo > 1 && this.rng() < (this.fillDone ? 0.45 : info.barNo % 8 === 1 ? 0.35 : 0.02)) D('crash', tt, this.r(0.24, 0.4) * (style === 'ballad' ? 0.7 : 1));
      if (e === 0) this.fillDone = false;
      if (this.bar.fill && lastBeat && j === pb - 1) { D('snare', tt, 0.5); if (pb === 2) D('snare', tt - eighth / 2, 0.3); this.fillDone = true; }
    }
    if (!ch) return;

    /* bass and harmony are planned once per chord, eighth by eighth */
    const startE = ev.start * pb, lenE = ev.beats * pb;
    const barE = k => (startE + k) % g.E;
    if (info.chordStart) {
      const nextCh = info.nextEv && info.nextEv.chord;
      // bass hits: the felt groups (plus, the busier the setting, some of the smaller groups)
      let hits = [];
      const waltz = o.meter.num === 3 && o.meter.den === 4 && !g.oddGroups;
      // from the Normal level the swing bass walks (in a jazz waltz it alternates with the "1 . 3" figure)
      const walkAll = jazz && style === 'swing' && !straight && x.bcx >= 0.35 && this.rng() < (waltz ? (x.bcx > 0.7 ? 0.9 : 0.65) : 1);
      for (let k = 0; k < lenE; k++) {
        const be = barE(k);
        if (k === 0) { hits.push(k); continue; }
        if (walkAll) { if (k % 2 === 0) hits.push(k); continue; }
        if (x.bcx < 0.25) { if (be === 0) hits.push(k); continue; }               // simple: one long note per bar
        if (waltz && jazz) { if (be === 4 || be === 0) hits.push(k); continue; } // "1 . 3"
        if (g.majorSet.has(be)) { hits.push(k); continue; }
        if (g.startSet.has(be) && x.bcx >= 0.5 && this.rng() < 0.35 * x.bm) { hits.push(k); continue; }
        if (!jazz && g.majorSet.has((be + 1) % g.E) && this.rng() < 0.3 * x.bm) hits.push(k); // pickup into a group
      }
      const pairs = walkAll && pb === 2;
      const line = jazz ? this.walk(ch, hits.length, nextCh, pairs ? x.walkOpts : {})
        : hits.map((k, i) => {
          const root = this.nearest(ch.bass ?? ch.root, Math.min(Math.max(this.lastBass, 31), 45), 28, 47);
          if (i === 0) return root;
          if (i === hits.length - 1 && nextCh && hits.length > 2) { // the next chord's fifth leads into it (never a long chromatic note)
            const tg = this.nearest(nextCh.bass ?? nextCh.root, root, 28, 47);
            return tg + 7 <= BASS_HI ? tg + 7 : tg - 5;
          }
          return i % 2 ? this.nearest((ch.root + ch.iv[5]) % 12, root + 5, 28, 47) : root;
        });
      const plan = new Map();
      hits.forEach((k, i) => {
        const n = line[i], nextK = hits[i + 1] ?? lenE;
        if (typeof n === 'number') plan.set(k, { midi: n, len: nextK - k });
        else { plan.set(k, { midi: n.a, len: 1 }); plan.set(k + 1, { midi: n.b, len: Math.min(1, nextK - k - 1) || 1, ghost: !!n.ghost }); }
      });
      // now and then a ghost note on the last eighth before the next chord (a muted repeat of the previous note)
      const lastK = lenE - 1;
      if (nextCh && lenE >= 3 && !plan.has(lastK) && x.bcx >= 0.35 && this.rng() < 0.15 * x.bm) {
        const prevK = Math.max(...[...plan.keys()].filter(k => k < lastK));
        plan.get(prevK).len = lastK - prevK;
        plan.set(lastK, { midi: plan.get(prevK).midi, len: 1, ghost: true });
      }
      const lastNote = plan.get(Math.max(...plan.keys())).midi;
      this.lastBass = lastNote;
      this.bassPlan = plan;
      // harmony hits; complexity scales everything except the first hit
      const comp = [];
      for (let k = 0; k < lenE; k++) {
        const be = barE(k), start = g.startSet.has(be), major = g.majorSet.has(be);
        let p;
        if (k === 0) p = this.antSkip ? 0 : (style === 'ballad' ? 1 : 0.62);
        else if (inst === 'guitar' && jazz && !straight) p = k % 2 === 0 ? 1 : 0;  // four (three, five…) to the bar
        else if (inst === 'guitar' && style === 'even') p = (start ? 0.3 : 0.6) * x.hm;
        else if (style === 'ballad') p = major ? 0.2 * x.hm : 0;
        else if (waltz && this.bar.hemiola) p = be === 3 ? 0.7 : 0;
        else if (major) p = 0.4 * x.hm;
        else if (start) p = 0.2 * x.hm;
        else if (g.majorSet.has((be + 1) % g.E)) p = 0.2 * x.hm;            // just before a group: syncopation
        else p = (pb === 2 && k % 2 === 1 ? 0.1 : 0.05) * x.hm;
        if (this.rng() < p) comp.push(k);
      }
      if (!comp.length && !this.antSkip) comp.push(0);
      this.compPlan = comp;
    }
    for (const { j, tt } of es) {
      const k = bi * pb + j;
      const bh = this.bassPlan && this.bassPlan.get(k);
      if (bh) B(bh.midi, tt, span(k, k + bh.len) * 0.92, bh.ghost ? 0.6 : k === 0 ? 1 : 0.85, !!bh.ghost);
      if (this.compPlan.includes(k)) {
        const nxt = this.compPlan.find(q => q > k);
        const lenEighths = nxt !== undefined ? nxt - k : lenE - k;
        const long = style === 'ballad' || inst === 'rhodes' || inst === 'synth';
        const dur = (nxt !== undefined && lenEighths <= 2 && !long) ? lenEighths * eighth * 0.8 : Math.min(lenEighths, long ? 6 : 3) * eighth;
        const roll = style === 'ballad' && k === 0 ? 0.03 : inst === 'guitar' ? 0.01 : 0;
        C(tt, dur, k === 0 ? 0.75 : 0.62, roll, null, !long);
      }
    }
  }

  /** Ending: a single hit of the given chord (bass root, full voicing, kick and cymbal), left to ring. */
  ending(ch, t, spb, o = {}) {
    const style = o.style || 'swing', inst = o.harmony || 'piano';
    const root = this.nearest(ch.bass ?? ch.root, 33, 28, 40);
    const v = this.voiceFor(ch, inst, style);
    const ring = Math.max(1.4, spb * 2.2);
    return [
      { kind: 'bass', midi: root, t, dur: ring, v: 0.95 },
      { kind: 'chord', inst, midis: v, t, dur: ring, v: 0.75, roll: inst === 'guitar' ? 0.02 : 0.012 },
      { kind: 'drum', name: 'kick', t, v: 0.75 },
      { kind: 'drum', name: style === 'even' || style === 'bossa' ? 'hhhalf' : 'ride', t, v: 0.85 },
    ];
  }

  /* An eighth note before the next chord, the harmony sometimes plays it early (very common in jazz and bossa). */
  anticipate(info, o, g, x) {
    const { ev, bi, spb, t } = info;
    const nextCh = info.nextEv && info.nextEv.chord;
    if (bi !== ev.beats - 1 || !nextCh || info.nextEv.label === ev.label) return;
    // only into a chord that lands on a strong point (a beat in 4/4, a group start otherwise)
    const nextBarE = ((ev.start + ev.beats) * g.perBeat) % g.E;
    if (!g.standard && !g.startSet.has(nextBarE)) return;
    const p = { swing: 0.3, bossa: 0.25, even: 0.15, ballad: 0.1 }[x.style] * (x.inst === 'guitar' && x.style === 'swing' ? 0.3 : 1) * x.m;
    if (this.rng() >= p) return;
    const antT = g.perBeat === 2 ? x.off : t;
    // the anticipation replaces any hit of the old chord at that moment
    for (let i = x.out.length - 1; i >= 0; i--) if (x.out[i].kind === 'chord' && x.out[i].t >= antT - 0.03) x.out.splice(i, 1);
    const inst = x.inst;
    const nv = this.voiceFor(nextCh, inst, x.style);
    x.out.push({ kind: 'chord', inst, midis: nv, t: antT + this.hum(5), dur: spb * (x.style === 'ballad' ? 2 : 1.1), v: 0.72 * this.r(0.9, 1.08), roll: x.style === 'ballad' ? 0.03 : 0, ant: true });
    this.antNext = true;
    this.antVoice = nv;
  }
}

/** Arpeggio degrees → note names, for the help view. */
export function arpNoteNames(chord, arp, opts, noteName) {
  if (!chord) return '';
  return arp.map(d => noteName(chord.root + degreeInterval(chord, d, opts), chord.flat)).join(' ');
}
