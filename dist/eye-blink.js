// Only independent eye shapes are animated; no guessed deformation of a painted GLB face.
export function blinkAmount(time,seed=0){const period=4.4+(seed%7)*.31,phase=((time+seed*.37)%period+period)%period;if(phase<period-.16)return 0;const t=(phase-(period-.16))/.16;return Math.sin(Math.PI*t)**2;}
export function eyeBlink(eyes,seed=0){const base=eyes.map(e=>e.scale.y);return time=>{const amount=blinkAmount(time,seed);eyes.forEach((e,i)=>{e.scale.y=base[i]*(1-amount*.93);});};}
export function blinkFigures(root){const figures=[];root.traverse(o=>{if(typeof o.userData.blink==='function')figures.push(o.userData.blink);});return time=>figures.forEach(blink=>blink(time));}
