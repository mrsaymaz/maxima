// Equal damage/range preserve partner fairness; timing, silhouette and motion convey the element.
export const ELEMENTAL_ATTACKS={
 hufflepuff:{element:'air',name:'Gale Spiral',label:'GALE',color:'#b8f5e9',accent:'#f5fff2',speed:9,range:7.5,radius:.16,windup:.20,recovery:.42},
 gryffindor:{element:'fire',name:'Ember Comet',label:'EMBER',color:'#ff903e',accent:'#ffe5a0',speed:8.6,range:7.5,radius:.16,windup:.24,recovery:.38},
 slytherin:{element:'nature',name:'Verdant Shard',label:'SHARD',color:'#80be68',accent:'#dfbd7f',speed:8.2,range:7.5,radius:.16,windup:.28,recovery:.34},
 ravenclaw:{element:'water',name:'Tidal Pearl',label:'TIDE',color:'#71d6ed',accent:'#e4fbff',speed:8.8,range:7.5,radius:.16,windup:.22,recovery:.40}
};
export const elementalAttack=partner=>ELEMENTAL_ATTACKS[partner]||ELEMENTAL_ATTACKS.hufflepuff;
export function segmentHit(a,b,c,r){const dx=b.x-a.x,dz=b.z-a.z,ox=a.x-c.x,oz=a.z-c.z,A=dx*dx+dz*dz,C=ox*ox+oz*oz-r*r;if(C<=0)return 0;if(A<1e-12)return null;const B=2*(ox*dx+oz*dz),D=B*B-4*A*C;if(D<0)return null;const t=(-B-Math.sqrt(D))/(2*A);return t>=0&&t<=1?t:null;}
