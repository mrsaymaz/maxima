"""Source startup budget, not a browser/network benchmark. Also inspect texture candidates."""
from pathlib import Path
import argparse,json,re,gzip,struct,io
from PIL import Image
parser=argparse.ArgumentParser();parser.add_argument('--baseline',type=Path);args=parser.parse_args()
root=Path(__file__).resolve().parents[1];out=root/'docs';out.mkdir(exist_ok=True)

def budget(project,split=False,partner='hufflepuff',level=0,unit='g5u1'):
 dist=project/'dist';files=set();pending=['corridor-app.js']
 def add(path):
  path=path.split('?')[0]
  if (dist/path).is_file():files.add(path)
 def resolve(path,parent):
  if path=='three':return 'vendor/three.module.min.js'
  if path.startswith('three/addons/'):return 'vendor/'+path[len('three/addons/'):]
  if path.startswith('.'):
   import os
   return os.path.normpath(str(Path(parent).parent/path))
  return None
 while pending:
  name=pending.pop()
  if name in files:continue
  add(name);text=(dist/name).read_text()
  refs=re.findall(r'(?:import|export)\s*(?:\{[^}]*\}|\*[^;]*?|[\w]+)?\s*from\s*[\'\"]([^\'\"]+)',text)+re.findall(r'import\s*[\'\"]([^\'\"]+)',text)
  for ref in refs:
   target=resolve(ref,name)
   if target and target not in files:pending.append(target)
 add('index.html');add('icon.svg')
 html=(dist/'index.html').read_text()
 for name in re.findall(r'<link[^>]*href="([^"]+)"',html):
  add(name)
  if name.endswith('.css'):
   for ref in re.findall(r'url\([\'\"]?([^\)\'\"]+)',(dist/name).read_text()):add(ref)
 for id in ['hufflepuff','gryffindor','slytherin','ravenclaw']:add(f'assets/portraits/{id}-{level if id==partner else 0}.png')
 for area in range(3):add(f'assets/menu/arena-{area}.svg')
 if split:add('data/lesson-catalog.json');add(f'data/lessons/{unit}.json')
 else:add('data/expedition-language.json')
 # Current runtime mappings use derived rigs for these forms.
 if partner=='ravenclaw' and level<9 or partner=='slytherin' and level<10:
  path=f'assets/rigs/{partner}-{level}.gltf';add(path);g=json.loads((dist/path).read_text())
  import os
  for buffer in g['buffers']:add(os.path.normpath(str(Path(path).parent/buffer['uri'])))
 else:add(f'assets/creatures/{partner}-{level}.glb')
 size=sum((dist/f).stat().st_size for f in files)
 return {'sourceBytes':size,'requestCandidates':len(files),'lessonSourceBytes':sum((dist/f).stat().st_size for f in files if f.startswith('data/')),'files':sorted(files),'limits':'Static dependency and opening-menu source budget. Not a captured request trace; HTTP compression/cache, browser scheduling and progress-dependent UI images affect real transfers.'}
report={'release':'0.46.0','newFreshStart':budget(root,True)}
if args.baseline:report['baselineFreshStart']=budget(args.baseline,False)
report['formAssetCases']=[dict(partner=p,level=l,sourceBytes=budget(root,True,p,l)['sourceBytes']) for p in ['hufflepuff','gryffindor','slytherin','ravenclaw'] for l in [0,10]]
(out/'LOADING-BUDGET-v0.46.0.json').write_text(json.dumps(report,indent=2))
textures=[]
for path in sorted((root/'dist/assets/creatures').glob('*.glb')):
 raw=path.read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);binary=20+n+8
 for image in g.get('images',[]):
  view=g['bufferViews'][image['bufferView']];data=raw[binary+view.get('byteOffset',0):binary+view.get('byteOffset',0)+view['byteLength']]
  with Image.open(io.BytesIO(data)) as im:
   textures.append({'asset':path.name,'width':im.width,'height':im.height,'encodedBytes':len(data),'estimatedRGBAWithMipBytes':round(im.width*im.height*4*4/3),'compressionCandidate':max(im.width,im.height)>=1024})
(out/'TEXTURE-AUDIT-v0.46.0.json').write_text(json.dumps({'textures':textures,'limits':'Source image dimensions and RGBA+mip estimate, not measured GPU memory. Original textures are preserved. KTX2/Basis conversion needs an offline encoder, a compatible bundled transcoder and rendered device validation; none is assumed available.'},indent=2))
print(json.dumps({k:{n:v for n,v in x.items() if n!='files'} for k,x in report.items() if isinstance(x,dict)},indent=2))
print('Textures:',len(textures),'KTX2 candidates:',sum(t['compressionCandidate'] for t in textures))
