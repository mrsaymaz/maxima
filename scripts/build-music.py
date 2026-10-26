#!/usr/bin/env python3
"""Compose and render Maxima's music: one loop per arena plus camp.

Melodies and chord progressions are written below as scale degrees. Each arena has two stems with the
same length: "base" (always playing) and "action" (percussion and ostinato strings that fade in during
rivals and trials). Rendered with FluidSynth and the FluidR3 GM soundfont (MIT licence).

Requirements: fluidsynth, FluidR3_GM.sf2 (Debian/Ubuntu package fluid-soundfont-gm), ffmpeg, mido, numpy.
Usage: python3 scripts/build-music.py OUT_DIR [SOUNDFONT]
"""
import json, os, subprocess, sys, tempfile, wave
import mido
import numpy as np

SF2 = sys.argv[2] if len(sys.argv) > 2 else '/usr/share/sounds/sf2/FluidR3_GM.sf2'
TPB = 480
MAJOR = [0, 2, 4, 5, 7, 9, 11]
MINOR = [0, 2, 3, 5, 7, 8, 10]

# Melody templates: "degree[+|-]:beats", degree 1-7 in the melody octave, r = rest. One string per bar.
TEMPLATES = {
    'trail': ['5-:1 1:1 3:1.5 2:.5', '2:1 7-:1 5-:2', '6-:1 1:1 3:1 2:1', '1:1.5 6-:.5 4-:2',
              '5-:1 1:1 3:1 5:1', '4:1 3:.5 2:.5 7-:2', '6-:1 1:1 4:1 3:1', '2:3 r:1',
              '1:.5 2:.5 4:1 6:2', '5:1 3:1 1:2', '2:1 4:1 6:1 5:1', '5:1.5 4:.5 2:2',
              '3:1 1:1 6-:1 1:1', '4:1 3:1 2:1 1:1', '7-:1 2:1 5:1 4:1', '3:2 1:2'],
    'sky': ['3:2 2:1 1:1', '2:3 5-:1', '6-:1.5 1:.5 3:2', '4:3 r:1',
            '3:1 5:1 6:1 5:1', '5:2 3:2', '4:1 3:1 2:1 1:1', '2:4',
            '6:2 5:1 4:1', '3:2 1:2', '2:1 3:1 4:1 6:1', '5:4',
            '6:1 5:1 3:1 1:1', '4:2 6:2', '5:1 4:1 2:1 7-:1', '1:4'],
    'glass': ['1:2 5-:1 1:1', '3:2 2:1 1:1', '7-:2 5-:2', '1:4',
              '3:1 4:1 5:2', '6:1 5:1 4:1 3:1', '2:2 7-:1 2:1', '5:4',
              '6:2 5:1 3:1', '4:2 3:2', '2:1 3:1 4:1 2:1', '7-:4',
              '1:1 3:1 5:1 1+:1', '7:2 6:1 5:1', '4:1 3:1 2:1 7-:1', '1:4'],
    'camp': ['1:1 3:1 5:2', '4:1 3:1 2:2', '3:1 5:1 1+:2', '7:1 6:1 5:2',
             '6:1 5:1 4:1 3:1', '2:2 5-:2', '1:1 2:1 3:1 4:1', '3:2 1:2'],
}
# Chord roots as scale degrees, one per bar.
PROGRESSIONS = {
    'trail': [1, 5, 6, 4, 1, 5, 4, 5, 4, 1, 2, 5, 6, 4, 5, 1],
    'sky': [1, 5, 6, 4, 1, 3, 4, 5, 6, 4, 1, 5, 6, 4, 5, 1],
    'glass': [1, 4, 5, 1, 3, 4, 5, 5, 6, 4, 4, 5, 1, 6, 5, 1],
    'camp': [1, 4, 1, 5, 4, 5, 1, 1],
}
TRACKS = {
    'whisperwood': dict(template='trail', key=62, scale=MAJOR, bpm=92, passes=2,
                        melody=[73, 71], arp=24, pad=48, bass=32, sparkle=None, perc='shaker'),
    'skyreach': dict(template='sky', key=65, scale=MAJOR, bpm=84, passes=2,
                     melody=[75, 73], arp=46, pad=52, bass=35, sparkle=8, perc='triangle'),
    'stormglass': dict(template='glass', key=57, scale=MINOR, bpm=76, passes=2, harmonic=True,
                       melody=[8, 11], arp=46, pad=89, bass=42, sparkle=None, perc=None),
    'camp': dict(template='camp', key=67, scale=MAJOR, bpm=80, passes=2,
                 melody=[10, 8], arp=25, pad=48, bass=None, sparkle=None, perc=None, action=False),
}


def pitch(cfg, degree, octave=0, base=0):
    scale = cfg['scale']
    d = degree - 1
    o = d // 7
    step = scale[d % 7]
    if cfg.get('harmonic') and d % 7 == 6:
        step = 11  # raised leading tone
    return cfg['key'] + base + 12 * (o + octave) + step


def parse(bar):
    out = []
    for tok in bar.split():
        deg, beats = tok.split(':')
        if deg == 'r':
            out.append((None, float(beats)))
            continue
        octave = deg.count('+') - deg.count('-')
        out.append((int(deg.strip('+-')), octave, float(beats)))
    return out


def chord(cfg, root, base=-12):
    tones = [pitch(cfg, root, 0, base), pitch(cfg, root + 2, 0, base), pitch(cfg, root + 4, 0, base)]
    return sorted(tones)


class Song:
    def __init__(self, bpm):
        self.events = []  # (tick, type, channel, a, b)
        self.bpm = bpm

    def program(self, ch, prog):
        self.events.append((0, 'program_change', ch, prog, 0))

    def cc(self, ch, ctl, val):
        self.events.append((0, 'control_change', ch, ctl, val))

    def note(self, ch, note, start, beats, vel):
        t0 = int(start * TPB)
        t1 = int((start + beats) * TPB) - 8
        self.events.append((t0, 'note_on', ch, note, vel))
        self.events.append((max(t0 + 1, t1), 'note_off', ch, note, 0))

    def save(self, path, total_beats):
        mid = mido.MidiFile(ticks_per_beat=TPB)
        tr = mido.MidiTrack()
        mid.tracks.append(tr)
        tr.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(self.bpm), time=0))
        last = 0
        order = {'program_change': 0, 'control_change': 1, 'note_off': 2, 'note_on': 3}
        for tick, kind, ch, a, b in sorted(self.events, key=lambda e: (e[0], order[e[1]])):
            dt = tick - last
            last = tick
            if kind == 'program_change':
                tr.append(mido.Message(kind, channel=ch, program=a, time=dt))
            elif kind == 'control_change':
                tr.append(mido.Message(kind, channel=ch, control=a, value=b, time=dt))
            else:
                tr.append(mido.Message(kind, channel=ch, note=a, velocity=b, time=dt))
        tr.append(mido.MetaMessage('end_of_track', time=max(0, int(total_beats * TPB) - last)))
        mid.save(path)


def compose(name, cfg):
    bars = [parse(b) for b in TEMPLATES[cfg['template']]]
    prog = PROGRESSIONS[cfg['template']]
    passes = cfg['passes']
    total = len(bars) * 4 * passes
    base, action = Song(cfg['bpm']), Song(cfg['bpm'])
    base.program(0, cfg['melody'][0]); base.program(1, cfg['melody'][1]); base.program(2, cfg['arp']); base.program(3, cfg['pad'])
    for ch, vol, rev in [(0, 96, 60), (1, 92, 60), (2, 84, 50), (3, 58, 80), (4, 88, 30), (5, 64, 90)]:
        base.cc(ch, 7, vol); base.cc(ch, 91, rev)
    if cfg['bass'] is not None:
        base.program(4, cfg['bass'])
    if cfg['sparkle'] is not None:
        base.program(5, cfg['sparkle'])
    for p in range(passes):
        for i, bar in enumerate(bars):
            start = (p * len(bars) + i) * 4
            root = prog[i]
            ch = 0 if p == 0 else 1
            t = start
            for item in bar:
                if item[0] is None:
                    t += item[1]
                    continue
                deg, octv, beats = item
                vel = 82 if (t - start) % 2 == 0 else 72
                base.note(ch, pitch(cfg, deg, octv), t, beats, vel - (6 if p == 0 else 0))
                t += beats
            tones = chord(cfg, root)
            # Pad: whole-bar chord.
            for n in tones:
                base.note(3, n, start, 4, 46)
            # Arpeggio in eighths; camp strums quarter-note chords instead.
            if name == 'camp':
                for b in range(4):
                    for k, n in enumerate(tones + [tones[0] + 12]):
                        base.note(2, n, start + b + k * .03, .9, 50 if b % 2 else 60)
            else:
                pattern = [tones[0] - 12, tones[2] - 12, tones[0], tones[1], tones[2], tones[0], tones[1], tones[2]]
                for k, n in enumerate(pattern):
                    base.note(2, n, start + k * .5, .5, 64 if k % 4 == 0 else 50)
            if cfg['bass'] is not None:
                low = pitch(cfg, root, -2) if pitch(cfg, root, -2) >= 28 else pitch(cfg, root, -1)
                base.note(4, low, start, 2, 74)
                base.note(4, low if i % 2 else low + 7, start + 2, 2, 66)
            if cfg['sparkle'] is not None and p == 1 and i % 2 == 0:
                for k, n in enumerate(tones):
                    base.note(5, n + 24, start + 3 + k * .25, .25, 40)
            if cfg['perc'] == 'shaker':
                for k in range(8):
                    base.note(9, 82, start + k * .5, .25, (44 if k % 2 == 0 else 28) - (10 if p == 0 else 0))
            if cfg['perc'] == 'triangle' and i % 2 == 0:
                base.note(9, 81, start, 1, 34)
    if cfg.get('action', True):
        action.program(6, 48); action.program(7, 47); action.program(8, 116)
        for ch, vol, rev in [(6, 92, 40), (7, 90, 40), (8, 96, 40), (9, 100, 20)]:
            action.cc(ch, 7, vol); action.cc(ch, 91, rev)
        for p in range(passes):
            for i in range(len(bars)):
                start = (p * len(bars) + i) * 4
                low = pitch(cfg, prog[i], -2)
                for k in range(8):
                    action.note(6, low, start + k * .5, .4, 76 if k % 2 == 0 else 58)
                    if k % 4 == 0:
                        action.note(6, low + 12, start + k * .5, .4, 62)
                action.note(8, 50, start, 1, 92)
                action.note(8, 50, start + 2.5, .5, 70)
                action.note(8, 47, start + 3, 1, 84)
                if i % 4 == 3:
                    for k in range(4):
                        action.note(7, pitch(cfg, 5, -2), start + 3 + k * .25, .25, 60 + k * 8)
                action.note(9, 36, start, .5, 70)
                action.note(9, 36, start + 2, .5, 64)
                action.note(9, 45 if i % 2 else 41, start + 3.5, .5, 52)
    return base, action, total


def render(mid_path, wav_path):
    subprocess.run(['fluidsynth', '-ni', '-q', '-g', '0.55', '-r', '44100', '-F', wav_path, SF2, mid_path],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def read(path):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype('float32') / 32768
        return x.reshape(-1, w.getnchannels()), w.getframerate()


def main(out):
    os.makedirs(out, exist_ok=True)
    manifest = {'license': 'Original compositions; rendered with FluidR3_GM (MIT)', 'tracks': {}}
    with tempfile.TemporaryDirectory() as tmp:
        for name, cfg in TRACKS.items():
            base, action, beats = compose(name, cfg)
            loop = beats * 60 / cfg['bpm']
            stems = {'base': base}
            if cfg.get('action', True):
                stems['action'] = action
            files = {}
            for stem, song in stems.items():
                mid = os.path.join(tmp, f'{name}-{stem}.mid')
                wav = os.path.join(tmp, f'{name}-{stem}.wav')
                song.save(mid, beats)
                render(mid, wav)
                x, rate = read(wav)
                length = int((loop + 2.5) * rate)
                x = np.pad(x, ((0, max(0, length - len(x))), (0, 0)))[:length]
                fade = int(2.0 * rate)
                x[-fade:] *= np.linspace(1, 0, fade)[:, None]
                peak = np.abs(x).max() or 1
                x *= (0.75 if stem == 'base' else 0.6) / peak
                tmpwav = os.path.join(tmp, f'{name}-{stem}-n.wav')
                with wave.open(tmpwav, 'wb') as w:
                    w.setnchannels(2); w.setsampwidth(2); w.setframerate(rate)
                    w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())
                dest = f'{name}-{stem}.mp3'
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmpwav, '-codec:a', 'libmp3lame', '-b:a', '96k',
                                os.path.join(out, dest)], check=True)
                files[stem] = dest
            manifest['tracks'][name] = {'loop': round(loop, 4), 'bpm': cfg['bpm'], **files}
            print(name, round(loop, 1), 's', files)
    json.dump(manifest, open(os.path.join(out, 'manifest.json'), 'w'), indent=1)


if __name__ == '__main__':
    main(sys.argv[1])
