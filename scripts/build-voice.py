#!/usr/bin/env python3
"""Build the pre-recorded English voice clips used by listening tasks and the Wordex.

Voice: Kokoro-82M v1.0 (Apache-2.0), speaker "af_heart", rendered offline with
sherpa-onnx. Model download (not stored in this repository):
  https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2

Usage:
  python3 scripts/build-voice.py jobs  OUT.json                 # list every spoken word
  python3 scripts/build-voice.py render MODEL_DIR JOBS.json WAV_DIR
  python3 scripts/build-voice.py encode WAV_DIR dist/assets/voice

"render" adds pronunciations for unit words missing from the lexicon (compounds such as
"headteacher" are composed from their parts). af_heart was chosen over the British voices after an offline
Whisper transcription check: it was recognised correctly far more often on the hardest unit words. "encode" trims silence, normalises loudness and
writes mono 24 kHz MP3 clips plus manifest.json.
"""
import json, os, re, subprocess, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICES = ['af_alloy','af_aoede','af_bella','af_heart','af_jessica','af_kore','af_nicole','af_nova','af_river','af_sarah','af_sky','am_adam','am_echo','am_eric','am_fenrir','am_liam','am_michael','am_onyx','am_puck','am_santa','bf_alice','bf_emma','bf_isabella','bf_lily','bm_daniel','bm_fable','bm_george','bm_lewis']
FRAGMENTS = {'pleaseSelect': ('_please-select', 'Please select'), 'and': ('_and', 'and')}


def slug(text):
    return re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', text.lower()))


def jobs(out):
    data = json.load(open(os.path.join(ROOT, 'dist/data/expedition-language.json'), encoding='utf8'))
    seen, items = {}, []
    for unit in data['units']:
        for v in unit['vocabulary']:
            text = v['en'].strip()
            key = text.lower()
            if key in seen:
                continue
            name = slug(text)
            if name in seen.values():
                raise SystemExit(f'slug clash: {text}')
            seen[key] = name
            items.append([name, text + '.'])
    items += [list(v) for v in FRAGMENTS.values()]
    json.dump(items, open(out, 'w'), ensure_ascii=False)
    print(len(items), 'clips')


def extended_lexicon(model, accent='us'):
    """Copies the lexicon and adds unit words it lacks: compounds, plurals, possessives and letter names."""
    source = os.path.join(model, f'lexicon-{accent}-en.txt')
    path = os.path.join(model, f'lexicon-{accent}-en-maxima.txt')
    lex = {}
    for line in open(source, encoding='utf8'):
        parts = line.rstrip('\n').split(' ')
        if parts and parts[0] and parts[0] not in lex:
            lex[parts[0]] = parts[1:]
    second = lambda ph: ['ˌ' if x == 'ˈ' else x for x in ph]

    def plural(ph):
        last = ph[-1] if ph else ''
        if last in ('s', 'z', 'ʃ', 'ʒ', 'ʧ', 'ʤ'):
            return ph + ['ɪ', 'z']
        return ph + (['s'] if last in ('p', 't', 'k', 'f', 'θ') else ['z'])

    def guess(word):
        if word in lex:
            return lex[word]
        if word.endswith("'s") and word[:-2] in lex:
            return lex[word[:-2]] + ['s']
        for cut in (1, 2):
            base = word[:-cut]
            if word.endswith('s') and base in lex:
                return plural(lex[base])
        for i in range(len(word) - 2, 1, -1):
            a, b = word[:i], word[i:]
            if a in lex and (b in lex or (b.endswith('s') and b[:-1] in lex)):
                return lex[a] + second(lex[b] if b in lex else plural(lex[b[:-1]]))
        if len(word) <= 3 and all(c in lex for c in word):
            return [p for i, c in enumerate(word) for p in (lex[c] if i == len(word) - 1 else second(lex[c]))]
        return None

    data = json.load(open(os.path.join(ROOT, 'dist/data/expedition-language.json'), encoding='utf8'))
    words = {w for u in data['units'] for v in u['vocabulary'] for w in re.split(r"[\s-]+", v['en'].lower()) if w}
    words |= {'please', 'select', 'and'}
    extra = {}
    for w in sorted(words):
        w = re.sub(r"[^a-z']", '', w)
        if w and w not in lex:
            ph = guess(w)
            if not ph:
                raise SystemExit(f'no pronunciation for {w}')
            extra[w] = ph
    with open(path, 'w', encoding='utf8') as f:
        f.write(open(source, encoding='utf8').read())
        for word, ph in extra.items():
            f.write(word + ' ' + ' '.join(ph) + '\n')
    print('added pronunciations:', ', '.join(f'{k} /{"".join(v)}/' for k, v in extra.items()))
    return path


def render(model, jobs_path, out, voice='af_heart', speed=0.9):
    import sherpa_onnx
    cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
        kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
            model=model + '/model.onnx', voices=model + '/voices.bin', tokens=model + '/tokens.txt',
            data_dir=model + '/espeak-ng-data', lexicon=extended_lexicon(model, 'gb' if voice.startswith('b') else 'us'), lang='en-gb' if voice.startswith('b') else 'en-us'),
        num_threads=4), max_num_sentences=1)
    tts = sherpa_onnx.OfflineTts(cfg)
    os.makedirs(out, exist_ok=True)
    for name, text in json.load(open(jobs_path)):
        path = f'{out}/{name}.wav'
        if os.path.exists(path):
            continue
        audio = tts.generate(text, sid=VOICES.index(voice), speed=speed)
        x = np.array(audio.samples, dtype='float32')
        if not len(x):
            print('EMPTY', name, text)
            continue
        with wave.open(path, 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(audio.sample_rate)
            w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


def clean(x, rate):
    """Trim leading/trailing silence, normalise loudness and add short fades."""
    level = np.abs(x)
    frame = int(rate * 0.01)
    env = np.array([level[i:i + frame].max() for i in range(0, len(x), frame)])
    loud = np.where(env > 10 ** (-38 / 20))[0]
    if len(loud):
        start = max(0, loud[0] * frame - int(rate * 0.03))
        end = min(len(x), (loud[-1] + 1) * frame + int(rate * 0.07))
        x = x[start:end]
    rms = np.sqrt(np.mean(x ** 2)) or 1e-6
    x = x * min(10 ** (-17 / 20) / rms, 10 ** (-1 / 20) / (np.abs(x).max() or 1e-6))
    fade = int(rate * 0.008)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    return x


def encode(src, dest):
    os.makedirs(dest, exist_ok=True)
    words, fragments = {}, {}
    names = {name: text for name, text in json.load(open(os.path.join(src, '..', 'jobs.json')))} if os.path.exists(os.path.join(src, '..', 'jobs.json')) else {}
    for file in sorted(os.listdir(src)):
        if not file.endswith('.wav'):
            continue
        name = file[:-4]
        with wave.open(os.path.join(src, file)) as w:
            rate = w.getframerate()
            x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype('float32') / 32768
        y = (np.clip(clean(x, rate), -1, 1) * 32767).astype('<i2')
        out = os.path.join(dest, name + '.mp3')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(rate), '-ac', '1', '-i', '-',
                        '-codec:a', 'libmp3lame', '-b:a', '40k', out], input=y.tobytes(), check=True)
        frag = next((k for k, (n, _) in FRAGMENTS.items() if n == name), None)
        if frag:
            fragments[frag] = name + '.mp3'
        else:
            words[names.get(name, name).rstrip('.').lower()] = name + '.mp3'
    manifest = {'voice': 'Kokoro-82M v1.0 · af_heart', 'license': 'Apache-2.0',
                'fragments': fragments, 'words': dict(sorted(words.items()))}
    json.dump(manifest, open(os.path.join(dest, 'manifest.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(words), 'words', len(fragments), 'fragments')


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'jobs':
        jobs(sys.argv[2])
    elif cmd == 'render':
        render(*sys.argv[2:5])
    elif cmd == 'encode':
        encode(sys.argv[2], sys.argv[3])
