"""Compile the authored bilingual source tables; no online generation is involved."""
from pathlib import Path
import copy,csv,hashlib,json,re,shutil

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'content/curriculum-v1'
OUT=ROOT/'dist/data'
EXPORT=ROOT/'language-pack'
VERSION='2026.10.2'
BASE=json.loads((SRC/'baseline-v0.34.0.json').read_text())
MAP=json.loads((SRC/'curriculum-map.json').read_text())
MAPPING={u['id']:u for u in MAP['units']}
REVIEW='authored-and-editorially-checked; independent-teacher-review-pending'

def norm(s):return re.sub(r'[^\w]+',' ',str(s).lower()).strip()
def answer_key(text,kind):
    s=norm(text);s=re.sub(r'^(?:at|in|on|to)\s+','',s);s=re.sub(r'^(?:the|a|an)\s+','',s)
    if kind=='time':return s.replace(' o clock','').replace(' noon','12')
    if kind=='response':
        if 'accept' in s:return 'accept'
        if 'refus' in s:return 'refuse'
    return s
def read_grouped(path,fields):
    out={};unit=None
    for line in path.read_text().splitlines():
        if not line:continue
        if line.startswith('@'):unit=line[1:];out[unit]=[];continue
        row=line.split('|');assert len(row)==fields,(path,line)
        assert unit is not None
        out[unit].append(row)
    return out
def simple_table(path):
    result={}
    for line in path.read_text().splitlines():
        if line:
            k,en,tr=line.split('|');assert k not in result,k;result[k]=(en,tr)
    return result
STEMS=simple_table(SRC/'question-stems.tsv')
OVERRIDES=simple_table(SRC/'question-overrides.tsv')
LEGACY_DEFS={}
for line in (SRC/'legacy-definitions.tsv').read_text().splitlines():
    if line:
        word,definition=line.split('|');LEGACY_DEFS[norm(word)]=definition
VOC={};CONTEXTS={}
for g in [5,6,7,8]:
    VOC.update(read_grouped(SRC/f'grade{g}.tsv',5))
    CONTEXTS.update(read_grouped(SRC/f'contexts{g}.tsv',8))
for uid,rows in read_grouped(SRC/'supplement.tsv',5).items():VOC[uid].extend(rows)

def blocks(text):
    words=text.split();assert len(words)>=3,text
    a=max(1,len(words)//3);b=max(a+1,len(words)*2//3)
    return [' '.join(words[:a]),' '.join(words[a:b]),' '.join(words[b:])]
def suffix_code(meta,suffix):
    matches=[c for c in meta['outcomeCodes'] if c.endswith('.'+suffix)]
    return matches[0] if matches else None
def metadata(unit,family,kind):
    m=MAPPING[unit];outcome=suffix_code(m,('V1' if kind=='vocabulary' else 'G1' if kind=='grammar' else 'R3') if m['grade']<7 else 'R1')
    return {'familyId':family,'curriculumUnitId':unit,'alignment':'original-example-within-mapped-theme; support vocabulary may extend the listed examples',
            'outcomeCodes':[outcome] if outcome else [],'sourceRefs':m['sources'],'source':'Maxima original curriculum expansion '+VERSION,'reviewStatus':REVIEW}
def grammar_target(text,correct):
    if re.search(r",\s*(?:doesn't|don't|didn't|isn't|aren't|won't|do)\b",text):return 'question-tag'
    if 'going to' in text:return 'be-going-to'
    if re.search(r'\b(?:can|cannot|could|must|should|will|may|would rather|have to|has to)\b',text):return 'modal-or-to-infinitive-base'
    if re.search(r'\b(?:am|is|are)\s+\w+ing\b',text):return 'present-progressive'
    if ' than ' in text or ' the most ' in text:return 'comparison'
    if correct in ['was','were'] or re.search(r'\b(?:yesterday|last |ago|in 20\d\d|in 19\d\d)\b',text):return 'past-event'
    if correct in ['myself','herself','yourself']:return 'reflexive-pronoun'
    if correct in ['me','her','us']:return 'object-pronoun'
    if ' got ' in text:return 'have-got'
    if correct in ['is','are','am']:return 'be-or-existence'
    if text.startswith(('First,','Then,','Next,','Finally,','Please ','Use ')):return 'instruction'
    return 'present-simple-or-prerequisite-form'

data=copy.deepcopy(BASE);data['schemaVersion']=2;data['curriculumEdition']=VERSION;data['sources']=MAP['sources']
report={'version':VERSION,'coreUnits':36,'enrichmentUnits':8,'reviewStatus':REVIEW,'units':[],'newAuthoredFamilies':0,'newQuestionRecords':0,'sourceDocuments':MAP['sources']}
flat={k:[] for k in ['vocabulary','descriptions','sentences','questions','gaps','repairs','contexts']}
for unit in data['units']:
    uid=unit['id'];meta=MAPPING[uid];unit['curriculum']=copy.deepcopy(meta)
    before={k:len(unit[k]) for k in ['vocabulary','descriptions','sentences','questions','gaps','repairs','categories']}
    if meta['kind']=='enrichment':report['units'].append({'id':uid,'kind':'enrichment','before':before,'after':before,'newFamilies':0});continue
    unit['cefr']=meta['cefr'];unit['contexts']=[]
    if meta.get('numberProfile'):unit['numberProfile']=meta['numberProfile']
    existing_words={norm(v['en']):v for v in unit['vocabulary']}
    existing_sentences={norm(s['answer']) for s in unit['sentences']}
    def add_sentence(sid,en,tr,family,kind='sentence'):
        assert '{' not in en and '}' not in en
        if norm(en) in existing_sentences:return
        rec={'id':sid,'answer':en,'blocks':blocks(en),'tr':tr,**metadata(uid,family,kind)}
        unit['sentences'].append(rec);existing_sentences.add(norm(en));flat['sentences'].append({'unitId':uid,**rec})
    authored=VOC[uid]
    for i,(word,tr,definition,marked,example_tr) in enumerate(authored,1):
        pos,en=word.split(':',1);family=f'{uid}-mx35-lex-{i:02}';m=re.search(r'\{([^{}]+)\}',marked);assert m,(uid,marked)
        options=m.group(1).split('~');assert len(options)==3 and len(set(options))==3
        correct,broken=options[:2];example=marked[:m.start()]+correct+marked[m.end():]
        vocab={'id':family,'en':en,'tr':tr,'pos':pos,'definition':definition,'example':example,'exampleTr':example_tr,'conceptId':'word:'+norm(en),**metadata(uid,family,'vocabulary')}
        if norm(en) not in existing_words:unit['vocabulary'].append(vocab);existing_words[norm(en)]=vocab
        # Every authored sense remains exportable even if the game already has the word.
        flat['vocabulary'].append({'unitId':uid,'runtimeVocabularyId':existing_words[norm(en)]['id'],**vocab})
        others=[w[0].split(':',1)[1] for w in authored if norm(w[0].split(':',1)[1])!=norm(en)]
        distractors=[w for w in others if norm(w) not in norm(definition)]
        pivot=i%len(distractors);distractors=distractors[pivot:]+distractors[:pivot]
        assert len(distractors)>=2
        d={'id':family+'-def','clue':definition,'answer':en,'options':[en,*distractors[:2]],'tr':tr,**metadata(uid,family,'vocabulary')}
        if not any(norm(x['clue'])==norm(definition) and norm(x['answer'])==norm(en) for x in unit['descriptions']):
            unit['descriptions'].append(d);flat['descriptions'].append({'unitId':uid,**d})
        add_sentence(family+'-s',example,example_tr,family)
        prompt=marked[:m.start()]+'___'+marked[m.end():]
        common={'prompt':prompt,'answer':correct,'options':options,'tr':example_tr,'fullCorrect':example,'grammarTarget':grammar_target(example,correct),'distractorReasons':{v:'The form does not fit this sentence and its stated meaning.' for v in options[1:]},**metadata(uid,family,'grammar')}
        gap={'id':family+'-gap',**common};repair={'id':family+'-repair','broken':broken,**common}
        unit['gaps'].append(gap);unit['repairs'].append(repair);flat['gaps'].append({'unitId':uid,**gap});flat['repairs'].append({'unitId':uid,**repair})
    new_questions=[]
    for i,row in enumerate(CONTEXTS[uid],1):
        context,context_tr=row[:2];family=f'{uid}-mx35-context-{i:02}'
        text={'id':family,'en':context,'tr':context_tr,'genre':'short contextual message','fictionalScenario':True,'questions':[],**metadata(uid,family,'reading')}
        add_sentence(family+'-s',context,context_tr,family)
        for qn,offset in enumerate([2,5],1):
            code,answer,answer_tr=row[offset:offset+3];question,qtr=OVERRIDES.get(f'{uid}.{i}.{code}',STEMS[code]);qid=family+f'-q{qn}'
            rec={'id':qid,'prompt':context+'\n'+question,'question':question,'context':context,'questionTr':qtr,'contextTr':context_tr,'tr':context_tr+'\n'+qtr,'answer':answer,'answerTr':answer_tr,'answerType':code,'acceptedAnswers':[answer],'options':[],**metadata(uid,family,'reading')}
            new_questions.append(rec);text['questions'].append(qid);add_sentence(qid+'-s',question,qtr,family)
        unit['contexts'].append(text);flat['contexts'].append({'unitId':uid,**text})
    for i,q in enumerate(new_questions):
        # Wrong answers are explicitly outside this short message, including its
        # other question's correct answer, rather than being alternative readings.
        candidates=sorted((x for x in new_questions if x['id']!=q['id'] and x['familyId']!=q['familyId']),key=lambda x:(x['answerType']!=q['answerType'],x['id']))
        wrong=[];forbidden={norm(x['answer']) for x in new_questions if x['familyId']==q['familyId']}
        def clean(v):return re.sub(r'^(?:in|at|on|to|the|a|an|her|his|our|their|its)\s+','',norm(v))
        for other in candidates:
            a=other['answer'];k=norm(a);c=clean(a)
            if k in forbidden or answer_key(a,q['answerType'])==answer_key(q['answer'],q['answerType']) or any(k==norm(w) for w in wrong) or c in norm(q['context']):continue
            wrong.append(a)
            if len(wrong)==2:break
        for fallback in ['The message does not give that information.','None of the stated details answer the question.']:
            if len(wrong)<2 and norm(fallback)!=norm(q['answer']):wrong.append(fallback)
        q['options']=[q['answer'],*wrong];q['distractorReasons']={a:'This detail is not the requested information in the given message.' for a in wrong}
        unit['questions'].append(q);flat['questions'].append({'unitId':uid,**q})
    described={norm(x['answer']) for x in unit['descriptions']}
    for v in unit['vocabulary']:
        if norm(v['en']) in described:continue
        definition=v.get('definition') or LEGACY_DEFS.get(norm(v['en']))
        if not definition:continue
        other=[w['en'] for w in unit['vocabulary'] if norm(w['en'])!=norm(v['en'])][:2]
        d={'id':v['id']+'-mx35-gloss','answer':v['en'],'clue':definition,'tr':v['tr'],'options':[v['en'],*other],**metadata(uid,'legacy-word:'+norm(v['en']),'vocabulary')}
        d['alignment']='definition of a preserved legacy word; item-level curriculum-sense audit pending'
        unit['descriptions'].append(d);flat['descriptions'].append({'unitId':uid,**d});described.add(norm(v['en']))
    assert 24<=len(authored)<=32 and len(CONTEXTS[uid])==12,(uid,len(authored),len(CONTEXTS[uid]))
    after={k:len(unit[k]) for k in before};families=len(authored)+len(CONTEXTS[uid]);report['units'].append({'id':uid,'title':unit['title'],'kind':'core','before':before,'after':after,'newFamilies':families,'contexts':len(unit['contexts']),'cefr':unit['cefr']})
    report['newAuthoredFamilies']+=families;report['newQuestionRecords']+=len(new_questions)

# A permanent, sense-specific allowlist; no automatic emoji inference.
PICTURE_REVIEW=json.loads((SRC/'picture-review.json').read_text())
PICTURE_ASSETS=json.loads((SRC/'fluent-assets.json').read_text())
picture_by_id={r['vocabularyId']:r for r in PICTURE_REVIEW['records']}
assert len(picture_by_id)==735
runtime_words={v['id']:v for u in data['units'] for v in u['vocabulary']}
for rid,review in picture_by_id.items():
    v=runtime_words[rid];assert v['en']==review['en'] and v['tr']==review['tr'],rid
    v['picturePolicy']='reviewed' if review['decision']=='picture' else 'text-only'
    v['pictureReview']=review
    if review['decision']=='picture':
        assert (ROOT/'dist'/review['picture']).is_file(),review['picture']
        v['picture']=review['picture'];v['pictureGroup']=review['pictureGroup']
    else:assert not v.get('picture'),rid
for v in flat['vocabulary']:
    target=runtime_words[v['runtimeVocabularyId']]
    for k in ['picture','pictureGroup','picturePolicy','pictureReview']:
        if k in target:v[k]=copy.deepcopy(target[k])
for code,asset in PICTURE_ASSETS['assets'].items():
    assert hashlib.sha256((ROOT/f'dist/assets/emoji/{code}.webp').read_bytes()).hexdigest()==asset['sha256'],code

OUT.mkdir(exist_ok=True);(OUT/'curriculum').mkdir(exist_ok=True);EXPORT.mkdir(exist_ok=True)
# Keep editorial provenance in the full exports/manifest, rather than repeating
# it thousands of times in the phone runtime. Existing source records are intact.
runtime=copy.deepcopy(data)
strip={'alignment','outcomeCodes','sourceRefs','reviewStatus','source','curriculumUnitId','distractorReasons','grammarTarget','questionTr','contextTr','context','question','acceptedAnswers','answerType','pictureReview'}
for u in runtime['units']:
    u['curriculum']={k:v for k,v in u['curriculum'].items() if k in ['kind','programme','cefr','sources']}
    for kind in ['vocabulary','descriptions','sentences','questions','gaps','repairs']:
        for r in u[kind]:
            if 'mx35' in r['id']:
                for k in strip:r.pop(k,None)
(OUT/'expedition-language.json').write_text(json.dumps(runtime,ensure_ascii=False,separators=(',',':'))+'\n')
(OUT/'curriculum-manifest.json').write_text(json.dumps({'version':VERSION,'sources':MAP['sources'],'units':MAP['units'],'reviewStatus':REVIEW},ensure_ascii=False,indent=2)+'\n')
for grade in [5,6,7,8]:
    pack={**{k:v for k,v in data.items() if k!='units'},'units':[u for u in data['units'] if u['grade']==grade]}
    raw=json.dumps(pack,ensure_ascii=False,separators=(',',':'))+'\n';(OUT/f'curriculum/grade-{grade}.json').write_text(raw);(EXPORT/f'grade-{grade}.json').write_text(raw)
master={'schemaVersion':1,'version':VERSION,'sources':MAP['sources'],'curriculum':MAP['units'],'reviewStatus':REVIEW,'pictureReview':PICTURE_REVIEW,'records':flat}
(EXPORT/'authored-expansion.json').write_text(json.dumps(master,ensure_ascii=False,indent=2)+'\n')
for kind,rows in flat.items():
    fields=list(dict.fromkeys(k for row in rows for k in row))
    with (EXPORT/f'{kind}.csv').open('w',newline='',encoding='utf-8-sig') as f:
        writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
        for row in rows:writer.writerow({k:json.dumps(v,ensure_ascii=False) if isinstance(v,(list,dict)) else v for k,v in row.items()})
(OUT/'fluent-assets.json').write_text(json.dumps(PICTURE_ASSETS,ensure_ascii=False,indent=2)+'\n')
(OUT/'picture-review.json').write_text(json.dumps(PICTURE_REVIEW,ensure_ascii=False,indent=2)+'\n')
(EXPORT/'picture-review.json').write_text(json.dumps(PICTURE_REVIEW,ensure_ascii=False,indent=2)+'\n')
(EXPORT/'picture-assets.json').write_text(json.dumps(PICTURE_ASSETS,ensure_ascii=False,indent=2)+'\n')
with (EXPORT/'picture-review.csv').open('w',newline='',encoding='utf-8-sig') as f:
    fields=['unitId','vocabularyId','en','tr','pos','definition','decision','reasonCategory','reason','picture','pictureGroup','source','assetCode','reviewStatus']
    writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(PICTURE_REVIEW['records'])
report['pictureReview']={'reviewedNewVocabulary':len(picture_by_id),'approvedNewVocabulary':sum(r['decision']=='picture' for r in picture_by_id.values()),'textOnlyNewVocabulary':sum(r['decision']=='text-only' for r in picture_by_id.values()),'newAssetFiles':len(PICTURE_ASSETS['assets']),'newAssetBytes':sum(r['bytes'] for r in PICTURE_ASSETS['assets'].values()),'byUnit':{u['id']:{'before':sum(bool(v.get('picture')) for v in old['vocabulary']),'after':sum(bool(v.get('picture')) for v in u['vocabulary'])} for u,old in zip(data['units'],BASE['units'])}}
report['totals']={k:sum(len(u[k]) for u in data['units']) for k in ['vocabulary','descriptions','sentences','questions','gaps','repairs','categories']}
report['newRecords']={k:len(v) for k,v in flat.items()};report['legacyQuestionTranslationsMissing']=sum(not q.get('tr') for u in BASE['units'] for q in u['questions'])
report['runtimeAdditions']={k:report['totals'][k]-sum(len(u[k]) for u in BASE['units']) for k in report['totals']}
report['coreRanges']={k:{'min':min(u['after'][k] for u in report['units'] if u['kind']=='core'),'max':max(u['after'][k] for u in report['units'] if u['kind']=='core')} for k in report['totals']}
voice=json.loads((ROOT/'dist/assets/voice/manifest.json').read_text())['words']
new_vocab=[v for u in runtime['units'] for v in u['vocabulary'] if 'mx35' in v['id']]
report['recordedAudioForNewVocabulary']={'coveredRecords':sum(v['en'].lower() in voice for v in new_vocab),'newRecords':len(new_vocab),'newRecordingsCreated':0}
report['runtimeBytes']=(OUT/'expedition-language.json').stat().st_size
import gzip
report['runtimeGzipBytes']=len(gzip.compress((OUT/'expedition-language.json').read_bytes(),mtime=0))
(ROOT/'docs/curriculum/coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');(EXPORT/'coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
# Keep exported image paths portable and authoring sources in sync.
for rel in {v['picture'] for u in data['units'] for v in u['vocabulary'] if v.get('picture')}:
    dest=EXPORT/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/'dist'/rel,dest)
shutil.copy2(ROOT/'dist/assets/emoji/LICENSE.txt',EXPORT/'assets/emoji/LICENSE.txt')
shutil.copytree(SRC,EXPORT/'source',dirs_exist_ok=True)
shutil.copy2(ROOT/'scripts/expand-curriculum.py',EXPORT/'expand-curriculum.py')
shutil.copy2(ROOT/'scripts/fetch-fluent-assets.py',EXPORT/'fetch-fluent-assets.py')
print(json.dumps({k:report[k] for k in ['version','newAuthoredFamilies','newQuestionRecords','totals','newRecords','legacyQuestionTranslationsMissing']},ensure_ascii=False,indent=2))
