#!/usr/bin/env python3
"""Fetches and prepares the better sounds JazzDojo plays when they are available.

  double bass   D. Smolken's 1958 Otto Rubner bass, pizzicato, plus muted-string noises for ghost notes (CC0)
                https://github.com/sfzinstruments/dsmolken.double-bass
  piano         Salamander Grand Piano by Alexander Holm, Yamaha C5 (CC BY 3.0)
                https://github.com/sfzinstruments/SalamanderGrandPiano
  drums         Virtuosity Drums: a soft crash and twelve snare layers (CC0)
                https://github.com/sfzinstruments/virtuosity_drums

Output: sounds/ (ignored by git) with its own manifest.json. `npm run build` lays it over the samples in public/samples;
without it the app plays the sounds committed there. Needs git and ffmpeg. Safe to run again: finished work is kept.
"""
import json, os, re, shutil, subprocess, sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SRC = os.environ.get('SOUNDS_SRC', os.path.join(ROOT, '.cache', 'sounds-src'))
OUT = os.path.join(ROOT, 'sounds')
VERSION = 5  # bump to rebuild everything
# loudness of the sounds in public/samples (mean level of the first moments of each note, see level()):
# the new ones are matched to them so the mixer keeps meaning the same
OLD_BASS, OLD_PIANO = -7.5, -10.8

NOTE = {'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11}

# --- double bass: note name in the library, MIDI note, tuning correction in cents per take (measured) ---
BASS = [('eb1', 27, {'ma': 28, 'mb': 29, 'fa': 27}), ('g1', 31, {}), ('bb1', 34, {'ma': 16, 'mb': 18, 'fa': 8}),
        ('d2', 38, {'ma': -6, 'mb': -9, 'fa': -12}), ('f2', 41, {}), ('a2', 45, {}), ('c3', 48, {'ma': -5, 'mb': -6, 'fa': -6}),
        ('e3', 52, {})]
BASS_TAKES = [('ma', 'm1'), ('mb', 'm2'), ('fa', 'f1')]
GHOSTS = ['mute_a', 'mute_a2', 'mute_c', 'mute_c_2', 'mute_d', 'mute_d2', 'mute_g', 'mute_g3']
# --- piano: every minor third from A2 to F#5, a soft and a firm layer ---
PIANO = [('A2', 45), ('C3', 48), ('D#3', 51), ('F#3', 54), ('A3', 57), ('C4', 60), ('D#4', 63), ('F#4', 66), ('A4', 69),
         ('C5', 72), ('D#5', 75), ('F#5', 78)]
PIANO_LAYERS = [('p', 5), ('f', 10)]
SNARE = [6, 8, 10, 14, 16, 18, 22, 24, 26, 30, 32, 34]  # three neighbours for each of four loudness steps
CRASH = ['oh_crash_crash_vl1_rr1', 'oh_crash_crash_vl1_rr2']

REPOS = {
    'bass': ('https://github.com/sfzinstruments/dsmolken.double-bass',
             [f'/pizz/pizz_{n}_{t}.wav' for n, _, _ in BASS for t, _ in BASS_TAKES] + [f'/pizz/noises/pizz_noise_{g}.wav' for g in GHOSTS]),
    'piano': ('https://github.com/sfzinstruments/SalamanderGrandPiano',
              [f'/Samples/{n}v{v}.flac' for n, _ in PIANO for _, v in PIANO_LAYERS]),
    'drums': ('https://github.com/sfzinstruments/virtuosity_drums',
              [f'/Samples/oh/snare/oh_snare_center_vl{v}.flac' for v in SNARE] + [f'/Samples/oh/crash/{c}.flac' for c in CRASH]),
}


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kw)


def fetch(name):
    """A partial, sparse clone: only the listed files are downloaded."""
    url, files = REPOS[name]
    d = os.path.join(SRC, name)
    if not os.path.isdir(os.path.join(d, '.git')):
        os.makedirs(SRC, exist_ok=True)
        run(['git', 'clone', '-q', '--filter=blob:none', '--no-checkout', '--depth', '1', url, d])
    run(['git', '-C', d, 'sparse-checkout', 'init', '--no-cone'])
    with open(os.path.join(d, '.git', 'info', 'sparse-checkout'), 'w') as f:
        f.write('\n'.join(p.replace('#', '\\#') for p in files) + '\n')
    run(['git', '-C', d, 'checkout', '-q', 'HEAD'])
    missing = [p for p in files if not os.path.isfile(d + p)]
    if missing:
        raise RuntimeError(f'{name}: missing {missing[:3]}')
    return d


def maxvol(src):
    o = subprocess.run(['ffmpeg', '-v', 'info', '-i', src, '-af', 'aformat=channel_layouts=mono,volumedetect', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    return float(re.search(r'max_volume: (-?[\d.]+)', o).group(1))


def chain(dur, th, cents):
    tune = f'asetrate=44100*{2 ** (cents / 1200):.6f},aresample=44100,' if cents else ''
    return f'aformat=channel_layouts=mono,aresample=44100,{tune}silenceremove=start_periods=1:start_threshold={th}dB,atrim=0:{dur}'


def level(src, window, lowpass, dur, th=-50, cents=0):
    """(mean level of the first `window` seconds below `lowpass` Hz, peak of the whole note), in dB."""
    def vd(af, key):
        o = subprocess.run(['ffmpeg', '-v', 'info', '-i', src, '-af', af + ',volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
        return float(re.search(key + r': (-?[\d.]+)', o).group(1))
    return (vd(chain(window, th, cents) + f',lowpass=f={lowpass}', 'mean_volume'), vd(chain(dur, th, cents), 'max_volume'))


def enc(src, dst, dur, gain, fade=0.35, th=-50, cents=0, rate='112k', limit=False):
    """Mono mp3: leading silence removed, tuned by `cents`, cut to `dur` seconds with a fade-out.
    `limit` tames the attack click of a plucked string, the way a bass is always compressed in a mix."""
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    lim = ',alimiter=level_in=1:level_out=1:limit=0.84:attack=2:release=60:level=disabled' if limit else ''
    af = f'{chain(dur, th, cents)},afade=t=out:st={dur - fade}:d={fade},volume={gain:.2f}dB{lim}'
    run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-af', af, '-b:a', rate, dst])


def main():
    stamp = os.path.join(OUT, '.version')
    if os.path.isfile(stamp) and open(stamp).read().strip() == str(VERSION) and os.path.isfile(os.path.join(OUT, 'manifest.json')):
        print('sounds/ is up to date')
        return
    shutil.rmtree(OUT, ignore_errors=True)
    manifest = json.load(open(os.path.join(ROOT, 'public', 'samples', 'manifest.json')))

    d = fetch('bass')
    target = -12.0  # every note at the same loudness (a real bass is uneven: open strings ring, stopped notes don't)
    for name, midi, tune in BASS:
        for take, out in BASS_TAKES:
            src = f'{d}/pizz/pizz_{name}_{take}.wav'
            c = tune.get(take, 0)
            mean, _ = level(src, 0.2, 1500, 2.8, cents=c)
            enc(src, f'{OUT}/bass2/{midi}{out}.mp3', 2.8, target - mean, cents=c, limit=True)
    for i, g in enumerate(GHOSTS):
        src = f'{d}/pizz/noises/pizz_noise_{g}.wav'
        enc(src, f'{OUT}/bass2/ghost{i}.mp3', 0.3, -4 - maxvol(src), fade=0.08, th=-60)
    manifest['bass'] = {'dir': 'bass2', 'notes': [m for _, m, _ in BASS], 'layers': [{'id': 'm', 'rr': 2, 'below': 0.9}, {'id': 'f', 'rr': 1}],
                        'gain': round(0.9 * 10 ** ((OLD_BASS - target) / 20), 2)}
    manifest['bassghost'] = {'dir': 'bass2', 'files': [f'ghost{i}' for i in range(len(GHOSTS))]}

    d = fetch('piano')
    jobs = [(f'{d}/Samples/{name}v{v}.flac', f'{OUT}/piano2/{midi}{lid}1.mp3') for name, midi in PIANO for lid, v in PIANO_LAYERS]
    levels = [level(src, 0.35, 6000, 4.2, th=-55) for src, _ in jobs]
    target = min(mean - peak for mean, peak in levels) - 1   # as loud as possible with every note equally loud
    for (src, dst), (mean, _) in zip(jobs, levels):
        enc(src, dst, 4.2, target - mean, fade=0.6, th=-55, rate='96k')
    manifest['piano'] = {'dir': 'piano2', 'notes': [m for _, m in PIANO], 'layers': [{'id': 'p', 'rr': 1, 'below': 0.5}, {'id': 'f', 'rr': 1}],
                         'gain': round(10 ** ((OLD_PIANO - target) / 20), 2)}

    d = fetch('drums')
    files = [f'{d}/Samples/oh/snare/oh_snare_center_vl{v}.flac' for v in SNARE]
    g = -3 - max(maxvol(f) for f in files)   # one gain for the whole set keeps the dynamics between layers
    for i, f in enumerate(files):
        enc(f, f'{OUT}/drums/sn{i}.mp3', 1.0, g, fade=0.2, th=-75)
    manifest['drums']['snare'] = [f'sn{i}' for i in range(len(SNARE))]
    files = [f'{d}/Samples/oh/crash/{c}.flac' for c in CRASH]
    g = -6 - max(maxvol(f) for f in files)
    for i, f in enumerate(files):
        enc(f, f'{OUT}/drums/crash{i}.mp3', 3.6, g, fade=1.2, th=-70, rate='96k')
    manifest['drums']['crash'] = [f'crash{i}' for i in range(len(CRASH))]

    json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'))
    open(stamp, 'w').write(str(VERSION))
    n = sum(len(fs) for _, _, fs in os.walk(OUT))
    print(f'sounds/ ready: {n} files')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:  # never break the build: the app falls back to the sounds in public/samples
        shutil.rmtree(OUT, ignore_errors=True)
        print(f'sounds.py: could not prepare the extra sounds ({e}); the app will use the built-in ones', file=sys.stderr)
        if isinstance(e, subprocess.CalledProcessError):
            print((e.stderr or '')[-600:], file=sys.stderr)
