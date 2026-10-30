#!/usr/bin/env python3
"""Runner move sounds (lane swish, slide whoosh, stumble thud). Original offline numpy synthesis; no samples.
Run: python3 scripts/build-runner-sfx.py. Requires numpy and ffmpeg. Adds the cues to dist/assets/sfx/manifest.json.
"""
import json, subprocess, tempfile
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'dist/assets/sfx';RATE=44100
rng=np.random.default_rng(2047)
def t(seconds):return np.arange(int(seconds*RATE))/RATE
def band_noise(n,low,high):
 spectrum=np.fft.rfft(rng.normal(0,1,n));freqs=np.fft.rfftfreq(n,1/RATE);spectrum[(freqs<low)|(freqs>high)]=0;x=np.fft.irfft(spectrum,n);return x/max(1e-6,abs(x).max())
def write(x,name):
 x=x/max(1e-6,abs(x).max())*10**(-4/20);x[-int(.01*RATE):]*=np.linspace(1,0,int(.01*RATE))
 with tempfile.TemporaryDirectory() as tmp:
  raw=Path(tmp)/'a.raw';raw.write_bytes((x*32767).astype('<i2').tobytes())
  subprocess.run(['ffmpeg','-v','error','-y','-f','s16le','-ar',str(RATE),'-ac','1','-i',str(raw),'-codec:a','libmp3lame','-b:a','96k',str(DEST/(name+'.mp3'))],check=True)
# Lane change: a quick airy swish, rising filtered noise with a soft envelope.
s=t(.16);env=np.sin(np.pi*s/.16)**2;sweep=band_noise(len(s),1800,7000)*env;write(sweep*.8+np.sin(2*np.pi*(700+2600*s/.16)*s)*env*.12,'runner-lane')
# Slide: a longer falling whoosh with a scrape.
s=t(.42);env=np.minimum(1,s/.04)*np.exp(-s*4.5);write(band_noise(len(s),400,3200)*env+band_noise(len(s),3000,9000)*env*np.exp(-s*9)*.4,'runner-slide')
# Stumble: a low thump with a wooden knock and a short tumble rattle.
s=t(.38);thump=np.sin(2*np.pi*(95*s+40*(1-np.exp(-s*25))/25))*np.exp(-s*14);knock=np.sin(2*np.pi*420*s)*np.exp(-s*40)*.5
rattle=band_noise(len(s),800,2500)*np.exp(-((s-.12)/.05)**2)*.35;write(thump+knock+rattle,'runner-stumble')
p=DEST/'manifest.json';m=json.loads(p.read_text())
m['cues'].update({'lane':['runner-lane.mp3'],'slide':['runner-slide.mp3'],'stumble':['runner-stumble.mp3']})
m['runnerSfx']='Runner move sounds are original offline syntheses by Maxima.';p.write_text(json.dumps(m,indent=1)+'\n')
print('Runner move sounds written')
