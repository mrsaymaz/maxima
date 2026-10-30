"""Optional restoration of the 14 pinned Fluent assets; normal builds use bundled WebP files.
Requires Python 3 + Pillow. Existing valid assets are never downloaded again.
"""
from pathlib import Path
import json,hashlib,io,urllib.request
from PIL import Image
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'content/curriculum-v1/fluent-assets.json').read_text())
for code,a in manifest['assets'].items():
    out=root/f'dist/assets/emoji/{code}.webp'
    if out.is_file() and hashlib.sha256(out.read_bytes()).hexdigest()==a['sha256']:continue
    raw=urllib.request.urlopen(a['url'],timeout=45).read()
    assert hashlib.sha256(raw).hexdigest()==a['sourceSha256'],code+' source integrity'
    image=Image.open(io.BytesIO(raw)).convert('RGBA');image.thumbnail((256,256),Image.Resampling.LANCZOS)
    b=io.BytesIO();image.save(b,'WEBP',quality=90,method=6);result=b.getvalue()
    assert hashlib.sha256(result).hexdigest()==a['sha256'],code+' encoding differs; retain supplied WebP'
    out.parent.mkdir(parents=True,exist_ok=True);tmp=out.with_suffix('.webp.building');tmp.write_bytes(result);tmp.replace(out)
print('Pinned Fluent files verified/restored.')
