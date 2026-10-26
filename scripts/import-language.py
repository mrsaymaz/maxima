#!/usr/bin/env python3
"""Import frozen language sources supplied for Maxima, preserving original IDs."""
import collections, json, re, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
UPLOAD=Path('/workspace/scratch/665598494201/upload')
source=zipfile.ZipFile(UPLOAD/'Languini-v0.58.2-Ready-to-Play.zip')
wordramp=zipfile.ZipFile(UPLOAD/'Wordramp-v0.27.1-Netlify.zip')
raw=json.loads(source.read('Languini-v0.58.2/data/language.json'))
emoji_raw=wordramp.read('public/emoji-bank.js').decode()
emoji=json.loads(emoji_raw[emoji_raw.index('{'):emoji_raw.rindex('}')+1])
normal=lambda s: re.sub(r'\s+',' ',str(s)).strip().casefold()
out={'schemaVersion':1,'grades':[]}
stats=[]; errors=[]; pictures=set(); duplicate=collections.Counter(); dropped=collections.Counter()
for grade in raw:
 g={'grade':grade['grade'],'cefr':grade['cefr'],'units':[]}
 for unit in grade['units']:
  u={'id':unit['id'],'title':unit['title'],'vocabulary':[],'sentences':[],'questions':[]}
  seen={k:set() for k in ['vocabulary','sentences','questions']}
  for t in unit['tasks']:
   kind=t['kind']
   if kind=='vocabulary':
    en=t.get('answer','').strip(); tr=t.get('translation','').strip()
    if not en or not tr or normal(en)==normal(tr): dropped['vocabulary_missing_translation']+=1;continue
    key=(normal(en),normal(tr)); bucket='vocabulary'
    record={'id':t['id'],'en':en,'tr':tr}
    code=emoji['words'].get(normal(en))
    if code and 'public/emoji/'+code+'.webp' in wordramp.namelist():
     record['picture']='assets/emoji/'+code+'.webp'; pictures.add(code)
     if normal(en) in emoji['groups']:record['pictureGroup']=emoji['groups'][normal(en)]
   elif kind=='sentence':
    blocks=t.get('blocks',[]); answer=t.get('answer','').strip()
    if len(blocks)<2 or any(not b.strip() for b in blocks):dropped['sentence_invalid_blocks']+=1;continue
    if normal(' '.join(blocks))!=normal(answer):
     errors.append({'unit':unit['id'],'id':t['id'],'issue':'blocks do not reconstruct source answer'});continue
    key=normal(answer);bucket='sentences'
    record={'id':t['id'],'blocks':blocks,'tr':t.get('translation','').strip()}
   elif kind=='question':
    prompt=t.get('prompt','').strip();answer=t.get('answer','').strip()
    opts=list(dict.fromkeys([answer]+[o.strip() for o in t.get('options',[]) if o.strip()]))
    if not prompt or not answer or len(opts)<2:dropped['question_invalid']+=1;continue
    key=(normal(prompt),normal(answer));bucket='questions'
    record={'id':t['id'],'prompt':prompt,'answer':answer,'options':opts,'tr':t.get('translation','').strip()}
   else:continue
   if key in seen[bucket]:duplicate[bucket]+=1;continue
   seen[bucket].add(key)
   u[bucket].append(record)
  counts={k:len(u[k]) for k in ['vocabulary','sentences','questions']}
  if min(counts.values())<3:errors.append({'unit':u['id'],'issue':'fewer than 3 records','counts':counts})
  stats.append({'id':u['id'],**counts,'uniqueQuestionAnswers':len(set(normal(q['answer']) for q in u['questions']))})
  g['units'].append(u)
 out['grades'].append(g)
(ROOT/'dist/data/units.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
for code in sorted(pictures):
 (ROOT/'dist/assets/emoji'/f'{code}.webp').write_bytes(wordramp.read(f'public/emoji/{code}.webp'))
(ROOT/'dist/data/emoji-groups.json').write_text(json.dumps(emoji['groups'],ensure_ascii=False,separators=(',',':')))
report={'sourceActivityRecords':sum(len(u['tasks']) for g in raw for u in g['units']),'units':stats,'totals':{k:sum(s[k] for s in stats) for k in ['vocabulary','sentences','questions']},'deduplicated':dict(duplicate),'dropped':dict(dropped),'pictures':len(pictures),'issues':errors}
(ROOT/'dist/data/import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in report.items() if k!='units'},ensure_ascii=False,indent=2))
