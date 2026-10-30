// Curriculum-specific ranges apply only to newly generated tasks.
export function ordinalWords(n,cardinal){
 const special={1:'first',2:'second',3:'third',5:'fifth',8:'eighth',9:'ninth',12:'twelfth',20:'twentieth',30:'thirtieth',40:'fortieth',50:'fiftieth'};
 if(special[n])return special[n];
 if(n>20&&n%10)return cardinal(n-n%10)+'-'+ordinalWords(n%10,cardinal);
 return cardinal(n)+'th';
}
export function ordinalLabel(n){const last=n%10,teen=n%100;return n+(teen>=11&&teen<=13?'th':{1:'st',2:'nd',3:'rd'}[last]||'th');}
export function curriculumNumberPool(unit,depth,r,cardinal){
 const p=unit.numberProfile;
 if(!p)return null;
 if(p.ordinalMax&&r()<.5)return Array.from({length:p.ordinalMax},(_,i)=>{const n=i+1;return{id:'ordinal-'+n,left:ordinalLabel(n),right:ordinalWords(n,cardinal)};});
 return Array.from({length:p.cardinalMax-p.cardinalMin+1},(_,i)=>{const n=i+p.cardinalMin;return{id:'number-'+n,left:String(n),right:cardinal(n)};});
}
