#!/usr/bin/env python3
"""Build Maxima's recorded sound effects.

Recorded sources: Kenney starter kits (CC0 sound effects) from github.com/KenneyNL:
  starter-kit-3d-platformer, starter-kit-fps, starter-kit-city-builder, starter-kit-racing.
Chimes and stingers are rendered from FluidR3_GM (MIT) instrument samples.

Usage: python3 scripts/build-sfx.py KENNEY_ROOT dist/assets/sfx [SOUNDFONT]
KENNEY_ROOT contains the cloned kits as kenney-platformer/, starter-kit-fps/, starter-kit-city-builder/, starter-kit-racing/.
"""
import json, os, subprocess, sys, tempfile, wave
import mido
import numpy as np

RATE = 44100
SF2 = sys.argv[3] if len(sys.argv) > 3 else '/usr/share/sounds/sf2/FluidR3_GM.sf2'


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(RATE), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, 'float32').copy()


def trim(x, threshold=-45, pad=0.01, tail=0.04):
    env = np.abs(x)
    loud = np.where(env > 10 ** (threshold / 20))[0]
    if not len(loud):
        return x
    a = max(0, loud[0] - int(pad * RATE))
    b = min(len(x), loud[-1] + int(tail * RATE))
    return x[a:b]


def level(x, peak_db=-3, rms_db=None):
    x = x - np.mean(x)
    if rms_db is not None:
        rms = np.sqrt(np.mean(x ** 2)) or 1e-6
        x = x * (10 ** (rms_db / 20) / rms)
    peak = np.abs(x).max() or 1e-6
    if peak > 10 ** (peak_db / 20) or rms_db is None:
        x = x * (10 ** (peak_db / 20) / peak)
    fade = min(len(x) // 4, int(0.006 * RATE))
    x[-fade:] *= np.linspace(1, 0, fade)
    return x


def write(x, out, name):
    path = os.path.join(out, name + '.mp3')
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(RATE), '-ac', '1', '-i', '-',
                    '-codec:a', 'libmp3lame', '-b:a', '96k', path], input=pcm, check=True)
    return name + '.mp3'


def footsteps(x, count=6):
    """Slices single footfalls from a walking loop at energy onsets."""
    hop = int(0.01 * RATE)
    env = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    onsets = [i for i in range(2, len(env)) if env[i] > 0.012 and env[i] > env[i - 2] * 3]
    picked, last = [], -100
    for i in onsets:
        if i - last > 18:
            picked.append(i)
            last = i
    slices = []
    for i in picked:
        s = x[max(0, i * hop - int(0.004 * RATE)): i * hop + int(0.16 * RATE)].copy()
        if len(s) < int(0.08 * RATE):
            continue
        fade = min(len(s) // 3, int(0.05 * RATE))
        s[-fade:] *= np.linspace(1, 0, fade)
        slices.append((np.abs(s).max(), s))
    slices.sort(key=lambda t: -t[0])
    return [s for _, s in slices[:count]]


def render_notes(notes, program, length, gain=0.6, channel=0):
    """notes: [(start_beats, midi, beats, velocity)] at 120 bpm; channel 9 for percussion."""
    mid = mido.MidiFile(ticks_per_beat=480)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage('set_tempo', tempo=500000, time=0))
    if channel != 9:
        tr.append(mido.Message('program_change', channel=channel, program=program, time=0))
    tr.append(mido.Message('control_change', channel=channel, control=91, value=70, time=0))
    events = []
    for start, note, beats, vel in notes:
        events.append((int(start * 480), 'note_on', note, vel))
        events.append((int((start + beats) * 480), 'note_off', note, 0))
    last = 0
    for t, kind, note, vel in sorted(events, key=lambda e: (e[0], e[1] == 'note_on')):
        tr.append(mido.Message(kind, channel=channel, note=note, velocity=vel, time=t - last))
        last = t
    with tempfile.TemporaryDirectory() as tmp:
        m, w = os.path.join(tmp, 'a.mid'), os.path.join(tmp, 'a.wav')
        mid.save(m)
        subprocess.run(['fluidsynth', '-ni', '-q', '-g', str(gain), '-r', str(RATE), '-F', w, SF2, m],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        with wave.open(w) as f:
            y = np.frombuffer(f.readframes(f.getnframes()), '<i2').astype('float32') / 32768
            y = y.reshape(-1, f.getnchannels()).mean(axis=1)
    y = y[:int(length * RATE)]
    fade = int(min(0.3, length / 3) * RATE)
    y[-fade:] *= np.linspace(1, 0, fade)
    return y


def main(root, out):
    os.makedirs(out, exist_ok=True)
    k = lambda p: os.path.join(root, p)
    manifest = {'license': 'Kenney starter-kit sound effects (CC0); chimes rendered from FluidR3_GM (MIT)', 'cues': {}}
    cue = lambda name, files: manifest['cues'].setdefault(name, []).extend(files if isinstance(files, list) else [files])

    steps = footsteps(decode(k('starter-kit-fps/sounds/walking.ogg')))
    cue('step', [write(level(s, -8, -24), out, f'step-{i}') for i, s in enumerate(steps)])
    cue('jump', write(level(trim(decode(k('kenney-platformer/sounds/jump.ogg'))), -6), out, 'jump'))
    cue('land', write(level(trim(decode(k('kenney-platformer/sounds/land.ogg'))), -7), out, 'land'))
    cue('coin', write(level(trim(decode(k('kenney-platformer/sounds/coin.ogg'))), -6), out, 'coin'))
    cue('break', write(level(trim(decode(k('kenney-platformer/sounds/break.ogg'))), -4), out, 'break'))
    cue('hurt', write(level(trim(decode(k('kenney-platformer/sounds/fall.ogg'))), -5), out, 'hurt'))
    cue('impact', write(level(trim(decode(k('starter-kit-fps/sounds/enemy_hurt.ogg'))), -4), out, 'impact'))
    cue('defeat', write(level(trim(decode(k('starter-kit-fps/sounds/enemy_destroy.ogg'))), -5), out, 'defeat'))
    cue('place', [write(level(trim(decode(k(f'starter-kit-city-builder/sounds/placement-{v}.ogg'))), -6), out, f'place-{v}') for v in 'abcd'])
    cue('repair', [write(level(trim(decode(k(f'starter-kit-city-builder/sounds/removal-{v}.ogg'))), -7), out, f'repair-{v}') for v in 'ab'])
    cue('select', write(level(trim(decode(k('starter-kit-city-builder/sounds/rotate.ogg'))), -10), out, 'select'))

    # Rendered chimes: celesta (8), glockenspiel (9), music box (10), harp (46), strings (48), woodblock (115).
    cue('correct', write(level(render_notes([(0, 84, .25, 96), (.18, 91, .5, 100)], 9, .9)), out, 'correct'))
    cue('pair', write(level(render_notes([(0, 79, .25, 90), (.14, 86, .4, 96)], 8, .8), -5), out, 'pair'))
    cue('wrong', write(level(render_notes([(0, 52, .2, 80), (.22, 48, .3, 70)], 115, .6), -9), out, 'wrong'))
    cue('reward', write(level(render_notes([(i * .12, n, .6, 92) for i, n in enumerate([72, 76, 79, 84, 88])] +
                                           [(.6, n, 1.4, 70) for n in [72, 76, 79]], 46, 2.2), -4), out, 'reward'))
    cue('chest', write(level(render_notes([(i * .1, n, .5, 100) for i, n in enumerate([79, 83, 86, 91, 95, 98])] +
                                          [(.55, n, 1.6, 84) for n in [67, 71, 74, 79]], 9, 2.6), -3), out, 'chest'))
    cue('quest', write(level(render_notes([(0, 84, .3, 90), (.2, 88, .3, 90), (.4, 91, .8, 96)], 10, 1.5), -5), out, 'quest'))
    cue('coinTick', write(level(render_notes([(0, 100, .15, 70)], 9, .35), -14), out, 'coin-tick'))
    cue('deliver', write(level(render_notes([(0, 67, .3, 80), (.16, 74, .5, 86)], 46, .9), -6), out, 'deliver'))
    json.dump(manifest, open(os.path.join(out, 'manifest.json'), 'w'), indent=1)
    print(json.dumps({k: len(v) for k, v in manifest['cues'].items()}))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
