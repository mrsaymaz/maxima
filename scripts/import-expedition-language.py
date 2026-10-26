#!/usr/bin/env python3
"""Normalize the supplied reviewed game language banks without inventing lessons.

Writes only the expedition JSON and its provenance document. Tower Swarm's
bounded grade literals are parsed as data, never executed as JavaScript.
"""
from __future__ import annotations
import argparse
import collections
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCES = Path('/workspace/scratch/665598494201/task-catalog-sources')
PICTOGRAMS = {
    ('g5u1', 'chessboard'): 'chessboard',
    ('g7u1', 'comb'): 'comb',
    ('g8u12', 'collar'): 'collar',
    ('g8u12', 'pet carrier'): 'pet-carrier',
    ('g8u12', 'fish tank'): 'fish-tank',
    ('g6u7', 'solar panel'): 'solar-panel',
    ('g7u9', 'solar panel'): 'solar-panel',
}

def normal(value):
    return re.sub(r'\s+', ' ', str(value)).strip().casefold()

def distinct(values):
    result, seen = [], set()
    for value in values:
        key = normal(value)
        if key and key not in seen:
            result.append(value)
            seen.add(key)
    return result

def js_assignment(path, variable):
    text = path.read_text()
    marker = re.search(r'\b' + re.escape(variable) + r'\s*=\s*', text)
    if not marker:
        raise ValueError(f'Missing data assignment {variable}: {path}')
    return json.JSONDecoder().raw_decode(text[marker.end():])[0]

def tower_grades(path):
    text = path.read_text()
    result = []
    for marker in re.finditer(r'\{grade:([5-8]),cefr:', text):
        start = marker.start()
        depth, quote, escaped, end = 0, None, False, None
        for i in range(start, len(text)):
            ch = text[i]
            if quote:
                if escaped:
                    escaped = False
                elif ch == '\\':
                    escaped = True
                elif ch == quote:
                    quote = None
            elif ch in ('"', "'"):
                quote = ch
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        if end is None:
            raise ValueError('Unterminated Tower Swarm grade literal')
        literal = text[start:end]
        # Quote identifier keys only outside double-quoted source strings.
        pieces, at, i = [], 0, 0
        while i < len(literal):
            if literal[i] == '"':
                pieces.append(re.sub(r'\b([A-Za-z_$][\w$]*)\s*:', r'"\1":', literal[at:i]))
                j = i + 1
                while j < len(literal):
                    if literal[j] == '\\':
                        j += 2
                        continue
                    if literal[j] == '"':
                        break
                    j += 1
                pieces.append(literal[i:j+1])
                i = j + 1
                at = i
            else:
                i += 1
        pieces.append(re.sub(r'\b([A-Za-z_$][\w$]*)\s*:', r'"\1":', literal[at:]))
        grade = json.loads(''.join(pieces))
        if grade['grade'] not in [g['grade'] for g in result]:
            result.append(grade)
    if len(result) != 4:
        raise ValueError('Expected four literal Tower Swarm grade data objects')
    return result

def flatten(grades):
    return {unit['id']: unit for grade in grades for unit in grade['units']}

def usable_options(answer, options):
    return distinct([answer] + list(options))

def select_records(records, key, bucket, excluded):
    result, seen = [], set()
    for record in records:
        value = key(record)
        if value in seen:
            excluded[bucket + '_duplicate_answer'] += 1
            continue
        seen.add(value)
        result.append(record)
    return result

def build(args):
    source = args.sources.resolve()
    paths = {
        'languini': source/'Languini-v0.58.2-Ready-to-Play/Languini-v0.58.2/data/language.json',
        'wordramp': source/'Wordramp-v0.27.1-Netlify/public/language-bank.js',
        'growbloom': source/'Growbloom-v0.17.1-Netlify-Ready/data.js',
        'tower': source/'Tower-Swarm-v0.14.11-Practice-Only(1)/game.bundle.js',
    }
    base = json.loads(args.base_data.read_text())
    languini = flatten(json.loads(paths['languini'].read_text()))
    wordramp = flatten(js_assignment(paths['wordramp'], 'window.LANGUAGE_BANK'))
    growbloom = flatten(js_assignment(paths['growbloom'], 'window.WG_CURRICULUM'))
    tower = flatten(tower_grades(paths['tower']))
    result, coverage, excluded, concerns = [], [], collections.Counter(), []
    for grade in base['grades']:
        for current in grade['units']:
            uid = current['id']
            if uid not in languini or uid not in wordramp or uid not in growbloom or uid not in tower:
                raise ValueError(f'{uid}: missing source catalog entry')
            tasks = languini[uid]['tasks']
            unit = {'id': uid, 'title': current['title'], 'grade': grade['grade'], 'cefr': grade['cefr']}
            descriptions = []
            for task in tasks:
                if task['kind'] != 'description':
                    continue
                options = usable_options(task['answer'], task.get('options', []))
                if len(options) < 3:
                    excluded['description_too_few_distinct_options'] += 1
                    continue
                descriptions.append({'id': task['id'], 'clue': task['prompt'], 'answer': task['answer'], 'options': options})
            descriptions = select_records(descriptions, lambda r: normal(r['answer']), 'description', excluded)
            definition_lookup = {normal(r['answer']): r['clue'] for r in descriptions}
            vocabulary, seen_en, seen_tr = [], set(), set()
            for original in current['vocabulary']:
                en, tr = original['en'], original['tr']
                if normal(en) in seen_en or normal(tr) in seen_tr:
                    excluded['vocabulary_duplicate_english_or_turkish'] += 1
                    continue
                seen_en.add(normal(en)); seen_tr.add(normal(tr))
                record = {'id': original['id'], 'en': en, 'tr': tr}
                if normal(en) in definition_lookup:
                    record['definition'] = definition_lookup[normal(en)]
                if original.get('picture'):
                    record['picture'] = original['picture']
                    if 'pictureGroup' in original:
                        record['pictureGroup'] = original['pictureGroup']
                pictogram = PICTOGRAMS.get((uid, normal(en)))
                if pictogram:
                    record['picture'] = f'assets/pictograms/{pictogram}.svg'
                    record['pictureGroup'] = pictogram
                vocabulary.append(record)
            halves = []
            source_halves = wordramp[uid]['completions']
            ending_lookup = {h['id']: h['end'] for h in source_halves}
            for half in source_halves:
                wrong = []
                for value in half.get('wrongEndings', []):
                    if value in ending_lookup:
                        wrong.append(ending_lookup[value])
                    elif value in ending_lookup.values():
                        wrong.append(value)
                    else:
                        concerns.append(f'{uid}/{half["id"]}: unresolved wrong-ending reference {value!r}; omitted.')
                wrong = [value for value in distinct(wrong) if normal(value) != normal(half['end'])]
                if len(wrong) < 2:
                    excluded['halves_too_few_resolved_wrong_endings'] += 1
                    continue
                halves.append({'id': half['id'], 'start': half['start'], 'end': half['end'], 'wrongEndings': wrong})
            halves = select_records(halves, lambda r: normal(r['end']), 'halves', excluded)
            sentences = []
            for sentence in current['sentences']:
                sentences.append({'id': sentence['id'], 'answer': ' '.join(sentence['blocks']), 'blocks': sentence['blocks'], 'tr': sentence['tr']})
            sentences = select_records(sentences, lambda r: normal(r['answer']), 'sentence', excluded)
            questions = []
            for question in current['questions']:
                options = usable_options(question['answer'], question['options'])
                if len(options) < 3:
                    excluded['question_too_few_distinct_options'] += 1
                    continue
                questions.append({'id': question['id'], 'prompt': question['prompt'], 'answer': question['answer'], 'options': options})
            questions = select_records(questions, lambda r: normal(r['answer']), 'question', excluded)
            gaps, repairs = [], []
            for task in tasks:
                if task['kind'] not in ['completion', 'repair']:
                    continue
                options = usable_options(task['answer'], task.get('options', []))
                if len(options) < 3 or '___' not in task['prompt']:
                    excluded[task['kind'] + '_invalid_options_or_gap'] += 1
                    continue
                if task['kind'] == 'completion':
                    gaps.append({'id': task['id'], 'prompt': task['prompt'], 'answer': task['answer'], 'options': options})
                else:
                    if normal(task['broken']) == normal(task['answer']):
                        excluded['repair_broken_equals_correct'] += 1
                        continue
                    full = task.get('readback') or task['prompt'].replace('___', task['answer'], 1)
                    repairs.append({'id': task['id'], 'prompt': task['prompt'], 'broken': task['broken'], 'answer': task['answer'], 'options': options, 'fullCorrect': full})
            gaps = select_records(gaps, lambda r: normal(r['answer']), 'gap', excluded)
            repairs = select_records(repairs, lambda r: normal(r['answer']), 'repair', excluded)
            categories = []
            for category in growbloom[uid]['categories']:
                yes, no = distinct(category['yes']), distinct(category['no'])
                intersection = {normal(x) for x in yes} & {normal(x) for x in no}
                if intersection:
                    raise ValueError(f'{uid}/{category["id"]}: yes/no conflict {intersection}')
                if len(yes) >= 3 and len(no) >= 3:
                    categories.append({'id': category['id'], 'title': category['title'], 'yes': yes, 'no': no})
                else:
                    excluded['category_too_few_members'] += 1
            unit.update(vocabulary=vocabulary, descriptions=descriptions, halves=halves, sentences=sentences, questions=questions, gaps=gaps, repairs=repairs, categories=categories)
            for bucket in ['vocabulary','descriptions','halves','sentences','questions','gaps','repairs']:
                if len(unit[bucket]) < 3:
                    raise ValueError(f'{uid}: fewer than three independent {bucket} records')
                ids = [r['id'] for r in unit[bucket]]
                if len(ids) != len(set(ids)):
                    raise ValueError(f'{uid}: duplicate source IDs in {bucket}')
            if not categories:
                raise ValueError(f'{uid}: no usable categories')
            pictures = [v for v in vocabulary if v.get('picture')]
            picture_groups = {str(v.get('pictureGroup', v['picture'])) for v in pictures}
            row = {'id': uid, **{k:len(unit[k]) for k in ['vocabulary','descriptions','halves','sentences','questions','gaps','repairs','categories']}, 'definitions':sum('definition' in v for v in vocabulary), 'pictures':len(pictures), 'pictureGroups':len(picture_groups)}
            coverage.append(row)
            if len(picture_groups) < 3:
                concerns.append(f'{uid}: only {len(picture_groups)} independent picture groups; picture activities need a truthful fallback.')
            if row['definitions'] < 3:
                concerns.append(f'{uid}: only {row["definitions"]} vocabulary records have a direct description-based definition; use descriptions directly for definition tasks.')
            result.append(unit)
    if len(result) != 44:
        raise ValueError(f'Expected44 units, got{len(result)}')
    manifests = [{'key': key, 'file': str(path.relative_to(source)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()} for key,path in paths.items()]
    output = {'schemaVersion':1, 'units':result, 'provenance':{
        'vocabulary':'Existing Maxima units.json imported from Languini; optional definition text from same-unit Languini descriptions; optional custom illustrations by the Maxima project.',
        'descriptions':'Languini data/language.json description activities.',
        'halves':'Wordramp public/language-bank.js completions; wrong-ending IDs resolved to exact source end strings.',
        'sentences':'Existing Maxima units.json, preserving Languini sentence blocks and Turkish values.',
        'questions':'Existing Maxima units.json, preserving Languini reviewed full replies and distractors.',
        'gaps':'Languini completion activities.',
        'repairs':'Languini repair activities; fullCorrect uses source readback when present.',
        'categories':'Growbloom data.js merged reviewed category lists.',
        'towerSwarm':'All44 matching catalog entries were parsed/corroborated from bounded original grade literals. No additional overlapping records were added solely to inflate counts.',
        'sourceFiles':manifests}, 'coverage':coverage}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, separators=(',',':')))
    totals = {k:sum(row[k] for row in coverage) for k in coverage[0] if k != 'id'}
    minima = {k:min(row[k] for row in coverage) for k in coverage[0] if k != 'id'}
    lines = ['# Expedition language sources', '', 'Generated by `scripts/import-expedition-language.py` from the supplied reviewed game banks. No new lesson wording, answer or translation was authored.', '',
        '## Selected authorities', '',
        '- Vocabulary, sentences and Q&A: existing Maxima `units.json`, preserving its original Languini records and IDs.',
        '- Descriptions, grammar gaps and repair tickets: Languini0.58.2 `data/language.json`.',
        '- Sentence halves: Wordramp0.27.1 `public/language-bank.js`. Wrong-ending references are resolved to their exact ending **text**, never left as IDs.',
        '- Categories: Growbloom0.17.1 merged `data.js` yes/no lists. Exact yes/no overlap is rejected.',
        '- Tower Swarm0.14.11: the four original grade literals and all44 catalog entries are parsed as data and corroborate the source lineage. Its overlapping older items are not duplicated.', '',
        '## Activity coverage', '',
        '|Activity types|Data used|',
        '|---|---|',
        '|translation, listen-tr|Vocabulary English/Turkish pairs|',
        '|definition, clue|Descriptions; optional exact vocabulary definitions|',
        '|picture|Same-unit vocabulary with a valid picture and independent picture group|',
        '|qa-pairs, answer|Questions and original full replies/options|',
        '|halves, ending|Sentence starts, ends and resolved wrong-ending text|',
        '|sentence|Complete sentences and original grammatical blocks|',
        '|gap, correct|Grammar gaps and original answer options|',
        '|repair|Broken token, correction options and complete corrected sentence|',
        '|sort, intruder|Category yes/no members|',
        '|spelling, listen-word, listen-multi|Selected-unit vocabulary|',
        '|numbers|Activity-engine number generation|',
        '|instructions|Selected-unit vocabulary, combined with engine instructions|', '',
        '## Illustrations', '',
        'Reviewed existing Microsoft Fluent Emoji WebP paths are reused without changing the assets or their confusable-group metadata. Original Maxima SVG illustrations are separate assets, not Fluent Emoji: chessboard, comb, collar, pet carrier, fish tank and solar panel. They are attached only to those exact existing unit words, with unique basename picture groups. These SVG files are supplied by the main project implementation, not generated by this importer.', '',
        '## Normalization and limits', '',
        '- Source IDs and wording are retained for selected records. Repeated correct answers within a unit/type are filtered; vocabulary also filters duplicate Turkish labels to keep matching unambiguous.',
        '- An optional vocabulary definition is the exact same-unit description clue whose English answer matches that word. Descriptions remain independently available.',
        '- Each options list contains the original correct answer and at least two distinct source distractors. No distractor or replacement translation is invented. Options are stored in a stable source-oriented order; the activity engine must shuffle displayed choices.',
        '- Grammar repair `prompt` contains the source blank; `broken` is the incorrect token/phrase to place there, and `fullCorrect` is the source readback. Do not display a source short glossary value as if it were a full Turkish translation.',
        '- Sentence start/end ellipses and punctuation remain exactly as supplied. Join them only through a display formatter if desired.',
        '- Unique Q&A reply text alone does not guarantee every cross-pair is semantically exclusive. Q&A-pair assembly should avoid cross-valid replies; the original question-specific reviewed options are available for single-question fallback.',
        '- The44-unit catalog includes supplementary units. It is not represented as a newly verified official curriculum list.',
        '- Number tasks are generated by the activity engine. Instruction tasks use the selected unit vocabulary; this importer does not fabricate unrelated lesson words.', '',
        '## Coverage', '',
        '|Unit|Vocab|Definitions|Picture groups|Descriptions|Halves|Sentences|Q&A|Gaps|Repairs|Categories|',
        '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|']
    for row in coverage:
        lines.append('|'+'|'.join(str(row[k]) for k in ['id','vocabulary','definitions','pictureGroups','descriptions','halves','sentences','questions','gaps','repairs','categories'])+'|')
    lines += ['', 'Every unit has at least three independent records in each language record bucket. Category buckets may contain two category records, each with at least three positive and three negative words, supporting multiple sorting/intruder sets.', '', '## Exclusions', '', '```json',json.dumps(dict(excluded),ensure_ascii=False,indent=2),'```', '', '## Editorial concerns', '']
    lines += ['- '+c for c in concerns] if concerns else ['No structural coverage gap remains after the unit-specific original illustration mappings.']
    lines += ['', '## Source fingerprints', '']
    for manifest in manifests:
        lines += [f'- `{manifest["file"]}` — SHA256 `{manifest["sha256"]}`.']
    args.documentation.write_text('\n'.join(lines)+'\n')
    print(json.dumps({'units':len(result),'totals':totals,'minima':minima,'excluded':dict(excluded),'concerns':concerns,'output':str(args.output)},ensure_ascii=False,indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--sources', type=Path, default=DEFAULT_SOURCES)
    parser.add_argument('--base-data', type=Path, default=ROOT/'dist/data/units.json')
    parser.add_argument('--output', type=Path, default=ROOT/'dist/data/expedition-language.json')
    parser.add_argument('--documentation', type=Path, default=ROOT/'dist/data/EXPEDITION-SOURCES.md')
    build(parser.parse_args())
