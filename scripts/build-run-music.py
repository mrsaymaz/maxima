#!/usr/bin/env python3
"""Original Maxima running loops (runner mode), one per arena. Offline numpy synthesis; no external samples.
Run: python3 scripts/build-run-music.py. Requires numpy and ffmpeg. Other music is left as it is.
"""
import json, subprocess, tempfile
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'dist/assets/music';RATE=24000
rng=np.random.default_rng(1404)
def hz(n):return 440*2**((n-69)/12)
def add(song,at,signal,pan=0):
 start=int(at*RATE);end=min(len(song),start+len(signal))
 if end>start:song[start:end,0]+=signal[:end-start]*(.8-pan*.25);song[start:end,1]+=signal[:end-start]*(.8+pan*.25)
def tone(length,midi,kind,amp):
 n=int(length*RATE);t=np.arange(n)/RATE;f=hz(midi)
 if kind=='bass':wave=np.tanh(2.2*(np.sin(2*np.pi*f*t)+.5*np.sin(4*np.pi*f*t)));env=np.exp(-t*5)*.7+.3
 elif kind=='pluck':wave=sum(np.sin(2*np.pi*f*k*t)/k for k in range(1,6));env=np.exp(-t*14)
 elif kind=='lead':wave=sum(np.sin(2*np.pi*f*k*t+.3*np.sin(2*np.pi*5.5*t))/k**1.2 for k in range(1,8));env=np.ones(n)
 else:wave=sum(np.sin(2*np.pi*f*d*t) for d in(1,1.004,.996))/3;env=np.ones(n)
 env=env*np.minimum(1,t/.008)*np.minimum(1,(length-t)/min(.06,length*.3));return wave*np.maximum(0,env)*amp
def drum(kind,amp):
 if kind=='kick':n=int(.28*RATE);t=np.arange(n)/RATE;return np.sin(2*np.pi*(48*t+90*(1-np.exp(-t*30))/30))*np.exp(-t*11)*amp
 if kind=='snare':n=int(.2*RATE);t=np.arange(n)/RATE;return (rng.normal(0,1,n)*.6+np.sin(2*np.pi*190*t)*.35)*np.exp(-t*24)*amp
 n=int(.05*RATE);t=np.arange(n)/RATE;return np.diff(rng.normal(0,1,n),prepend=0)*np.exp(-t*80)*.4*amp
def encode(name,song):
 for delay,gain in[(.107,.10),(.214,.05)]:song+=np.roll(song,int(delay*RATE),axis=0)[:,::-1]*gain
 song=np.tanh(song*1.25);song*=.8/max(.001,abs(song).max())
 with tempfile.TemporaryDirectory() as tmp:
  raw=Path(tmp)/'audio.raw';raw.write_bytes((song*32767).astype('<i2').tobytes())
  subprocess.run(['ffmpeg','-v','error','-y','-f','s16le','-ar',str(RATE),'-ac','2','-i',str(raw),'-codec:a','libmp3lame','-b:a','96k',str(DEST/(name+'.mp3'))],check=True)

# Each arena: tempo, root progression (MIDI), scale steps for the arpeggio and a hook for the lead.
ARENAS={
 'whisperwood':(140,[57,53,48,55],[0,3,7,10,12,10,7,3],[0,3,5,7,5,3,0,-2]),
 'skyreach':(146,[50,55,57,52],[0,4,7,11,12,11,7,4],[0,2,4,7,9,7,4,2]),
 'stormglass':(136,[52,48,55,50],[0,3,7,12,15,12,7,3],[0,3,7,10,12,10,7,5]),
}
manifest_path=DEST/'manifest.json';manifest=json.loads(manifest_path.read_text())
for arena,(bpm,roots,arp,hook) in ARENAS.items():
 beat=60/bpm;bars=32;song=np.zeros((round(bars*4*beat*RATE),2))
 for bar in range(bars):
  root=roots[bar%4];start=bar*4*beat;section=bar//8  # 0 intro, 1 drive, 2 lift, 3 drive
  for i in range(4):add(song,start+i*beat,drum('kick',.5))
  for i in range(4):
   if i%2:add(song,start+i*beat,drum('snare',.22 if section else .12))
  for i in range(8):add(song,start+(i+.5)*.5*beat,drum('hat',.16),(-1)**i*.4)
  for i in range(8):add(song,start+i*.5*beat,tone(.45*beat,root-12+(12 if i%2 else 0),'bass',.2))
  if section>0:
   for i in range(16):add(song,start+i*.25*beat,tone(.23*beat,root+12+arp[i%8],'pluck',.06),(-1)**i*.5)
  if section in(2,3):
   phrase=hook if bar%2==0 else hook[::-1]
   for i,step in enumerate(phrase):add(song,start+i*.5*beat,tone(.46*beat,root+24+step,'lead',.045),.15)
  for k,step in enumerate([0,3 if arp[1]==3 else 4,7]):add(song,start,tone(4*beat,root+12+step,'pad',.035),k-1)
 encode('run-'+arena,song)
 manifest['tracks']['run-'+arena]={'loop':round(bars*4*beat,6),'bpm':bpm,'base':'run-'+arena+'.mp3'}
manifest['runnerMusic']='Runner loops are original offline synthesized compositions by Maxima.'
manifest_path.write_text(json.dumps(manifest,indent=1)+'\n')
print('Runner music written:',', '.join('run-'+a for a in ARENAS))
