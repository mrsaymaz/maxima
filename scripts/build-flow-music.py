#!/usr/bin/env python3
"""Original Maxima guardian loop + transformation fanfare. Offline numpy synthesis; no external samples.
Run: python3 scripts/build-flow-music.py. Requires numpy and ffmpeg. Existing arena music is retained.
"""
import json, math, subprocess, tempfile
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'dist/assets/music';RATE=24000
rng=np.random.default_rng(380)
def hz(n):return 440*2**((n-69)/12)
def note(song,at,length,midi,amp=.08,kind='strings',pan=0):
 n=int(length*RATE);t=np.arange(n)/RATE;f=hz(midi);attack=.018 if kind!='bell' else .003
 if kind=='bass':wave=np.sin(2*np.pi*f*t)+.24*np.sin(4*np.pi*f*t)
 elif kind=='bell':wave=np.sin(2*np.pi*f*t)*np.exp(-t*3)+.23*np.sin(2*np.pi*f*2.01*t)*np.exp(-t*7)
 elif kind=='brass':wave=sum(np.sin(2*np.pi*f*k*t)/k**1.6 for k in range(1,7))
 else:wave=sum(np.sin(2*np.pi*f*k*t+np.sin(t*4)*.012)/k**2 for k in [1,2,3,4,6])
 env=np.minimum(1,t/attack)*np.minimum(1,(length-t)/min(.18,length*.35));env=np.maximum(0,env);signal=wave*env*amp
 start=int(at*RATE);end=min(len(song),start+n)
 if end<=start:return
 song[start:end,0]+=signal[:end-start]*(.8-pan*.2);song[start:end,1]+=signal[:end-start]*(.8+pan*.2)
def drum(song,at,kind,amp=.13):
 length=.40 if kind=='tom' else .18 if kind=='snare' else .07;n=int(length*RATE);t=np.arange(n)/RATE
 if kind=='tom':signal=np.sin(2*np.pi*(58*t+15*(1-np.exp(-t*20))/20))*np.exp(-t*12)
 elif kind=='snare':signal=(rng.normal(0,1,n)*.55+np.sin(2*np.pi*180*t)*.3)*np.exp(-t*28)
 else:
  noise=rng.normal(0,1,n);signal=np.diff(noise,prepend=0)*np.exp(-t*65)*.35
 start=int(at*RATE);end=min(len(song),start+n);song[start:end]+=signal[:end-start,None]*amp

def encode(name,song):
 # Small stereo room with restrained feedback. Apply the same cyclic tail for a seamless loop.
 for delay,gain in[(.079,.12),(.143,.07)]:song+=np.roll(song,int(delay*RATE),axis=0)[:,::-1]*gain
 song=np.tanh(song*1.2);peak=max(.001,abs(song).max());song*=.75/peak
 with tempfile.TemporaryDirectory() as tmp:
  raw=Path(tmp)/'audio.raw';raw.write_bytes((song*32767).astype('<i2').tobytes())
  subprocess.run(['ffmpeg','-v','error','-y','-f','s16le','-ar',str(RATE),'-ac','2','-i',str(raw),'-codec:a','libmp3lame','-b:a','96k',str(DEST/(name+'.mp3'))],check=True)

bpm=132;beat=60/bpm;beats=64;guardian=np.zeros((round(beats*beat*RATE),2));roots=[45,41,48,43]*4
for bar,root in enumerate(roots):
 start=bar*4*beat;tones=[root+12,root+15,root+19]
 for i in range(8):
  note(guardian,start+i*.5*beat,.36*beat,root if i%4 else root-12,.075,'bass')
  note(guardian,start+i*.5*beat,.34*beat,tones[[0,2,1,2,0,2,1,2][i]]+12,.035,'strings',(-1 if i%2 else 1)*.5)
 for i in range(4):drum(guardian,start+i*beat,'tom' if i%2==0 else 'snare',.18 if i%2==0 else .085)
 for i in range(8):drum(guardian,start+i*.5*beat,'hat',.038)
 if bar%2==0:
  for i,n in enumerate(tones):note(guardian,start+i*.04,1.45*beat,n+12,.045,'brass',i-1)
 for i,n in enumerate([12,15,19,22] if bar%4==3 else [12,19]):note(guardian,start+(2+i*.5)*beat,.45*beat,root+n+12,.035,'bell',i%2)
encode('guardian-battle',guardian)
fanfare=np.zeros((round(14.4*RATE),2))
for start,chord in[(0,[48,55,60]),(2.8,[53,60,65]),(5.5,[55,62,67]),(8.8,[60,64,67,72])]:
 for i,n in enumerate(chord):note(fanfare,start+i*.045,3.5,n,.052,'strings',(i%3-1)*.6)
for i,n in enumerate([60,64,67,72,67,72,76,79,72,76,79,84]):note(fanfare,1.5+i*.55,.85,n,.055,'bell',math.sin(i)*.7)
for i,n in enumerate([60,64,67,72,76]):note(fanfare,9.25+i*.16,3.2,n,.064,'brass',(i%3-1)*.4)
for t in[.2,4.2,8.9]:drum(fanfare,t,'tom',.11)
fanfare[-int(.7*RATE):]*=np.linspace(1,0,int(.7*RATE))[:,None];encode('evolution-fanfare',fanfare)
p=DEST/'manifest.json';manifest=json.loads(p.read_text());manifest['tracks']['guardian']={'loop':round(beats*beat,6),'bpm':bpm,'base':'guardian-battle.mp3'};manifest['tracks']['evolution']={'loop':20,'bpm':100,'base':'evolution-fanfare.mp3'};manifest['originalFlowMusic']='Guardian and transformation tracks are original offline synthesized compositions by Maxima.';p.write_text(json.dumps(manifest,indent=1)+'\n');print('Composed guardian loop and evolution fanfare.')
