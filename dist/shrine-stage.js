import * as T from './vendor/three.module.min.js';
import{SpecialFX}from'./special-fx.js';
import{specialsFor}from'./specials.js';
// The Elemental Shrine on the path: at the end of the final chase, three stone pedestals stand across the trail, one
// per special. Above each, a miniature of the special plays on a loop, so the student sees what the coins buy. An
// owned special stands in a gold beam of light; one the student cannot yet afford glows dimmer. The arena portal waits
// behind them. Labels with the Buy buttons are HTML, placed by the app at labelPoint(i).
const TIER=[null,{ring:'#e0a868',crystal:.9},{ring:'#e6eef8',crystal:1.1},{ring:'#ffd65a',crystal:1.35}];
const ELEMENT={gryffindor:'#ff7a2a',ravenclaw:'#4fb8ff',hufflepuff:'#9ff0ff',slytherin:'#6fe04a'};
// Sized to fit inside the trail's canyon walls.
export const SHRINE={spacing:2.45,ahead:6.5,portal:5.2,preview:.19,top:1.05};
const glow=(color,opacity)=>new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});
export class ShrineStage{
 constructor(world,{team='hufflepuff',at,forward,owned=[],balance=0,effects='medium'}){
  this.world=world;this.team=team;this.time=0;this.owned=new Set(owned);this.balance=balance;this.effects=effects;this.owner=[];
  const f=new T.Vector3(forward.x,0,forward.z).normalize(),r=new T.Vector3(-f.z,0,f.x);this.f=f;this.r=r;
  this.center=new T.Vector3(at.x,0,at.z).addScaledVector(f,SHRINE.ahead);
  this.root=new T.Group();this.root.name='elemental-shrine';world.scene.add(this.root);
  const yaw=Math.atan2(-f.x,-f.z),color=ELEMENT[team]||'#9ff0ff';this.color=color;
  const stone=this.own(new T.MeshStandardMaterial({color:'#b9b3a1',roughness:.85})),dark=this.own(new T.MeshStandardMaterial({color:'#6f6a5e',roughness:.9}));
  // The plaza floor with a glowing rune ring in the team's colour.
  const floor=this.mesh(new T.CylinderGeometry(5.6,5.9,.18,48),stone,this.root);floor.position.copy(this.center).setY(.06);floor.receiveShadow=true;
  this.rune=this.mesh(new T.RingGeometry(4.7,5,64),glow(color,.55),this.root);this.rune.rotation.x=-Math.PI/2;this.rune.position.copy(this.center).setY(.17);
  // The arena portal behind the pedestals.
  const portal=new T.Group();portal.position.copy(this.center).addScaledVector(f,SHRINE.portal);portal.rotation.y=yaw;this.root.add(portal);
  for(const x of[-2.5,2.5]){const post=this.mesh(new T.CylinderGeometry(.34,.46,5.2,8),dark,portal);post.position.set(x,2.6,0);post.castShadow=true;}
  const arch=this.mesh(new T.TorusGeometry(2.5,.36,10,40,Math.PI),stone,portal);arch.position.y=5.1;
  this.portalDisc=this.mesh(new T.CircleGeometry(2.25,40),glow(color,.22),portal);this.portalDisc.position.y=3.6;this.portalSwirl=this.mesh(new T.RingGeometry(.8,2.1,40,1,0,Math.PI*1.4),glow(color,.3),portal);this.portalSwirl.position.set(0,3.6,.02);
  // The three pedestals.
  this.pedestals=specialsFor(team).map((spec,i)=>{const g=new T.Group();g.position.copy(this.center).addScaledVector(r,(i-1)*SHRINE.spacing);g.rotation.y=yaw;this.root.add(g);
   const base=this.mesh(new T.CylinderGeometry(.78,.95,SHRINE.top,6),stone,g);base.position.y=SHRINE.top/2;base.castShadow=true;
   const ring=this.mesh(new T.TorusGeometry(.76,.06,8,40),glow(TIER[spec.tier].ring,.9),g);ring.rotation.x=Math.PI/2;ring.position.y=SHRINE.top+.02;
   const crystal=this.mesh(new T.OctahedronGeometry(.32*TIER[spec.tier].crystal,0),this.own(new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.2,roughness:.2,metalness:.1})),g);crystal.position.y=SHRINE.top+.75;
   const beam=this.mesh(new T.CylinderGeometry(.62,.8,9,24,1,true),glow('#ffd65a',0),g);beam.position.y=SHRINE.top+4.5;
   // The looping miniature: the special's own effect at a small scale, centred on the pedestal top and facing the camera.
   const mini=new T.Group();mini.scale.setScalar(SHRINE.preview);mini.position.set(0,SHRINE.top+.05,5*SHRINE.preview);g.add(mini);
   const fx=new SpecialFX(mini,{lights:false});return{spec,g,base,ring,crystal,beam,fx,wait:.2+i*.45,pulse:0};});
  this.setState({owned,balance});
 }
 own(m){this.owner.push(m);return m;}
 mesh(g,m,parent){this.owner.push(g,m);const o=new T.Mesh(g,m);parent.add(o);return o;}
 // Where the creature waits: in front of the plaza, off to the left so the pedestals stay in view.
 get creatureSpot(){return this.center.clone().addScaledVector(this.f,-3.2).addScaledVector(this.r,-SHRINE.spacing*.5);}
 setState({owned=[...this.owned],balance=this.balance}={}){this.owned=new Set(owned);this.balance=balance;for(const p of this.pedestals){p.owned=this.owned.has(p.spec.id);p.affordable=!p.owned&&balance>=p.spec.price;}}
 celebrate(id){const p=this.pedestals.find(p=>p.spec.id===id);if(p){p.pulse=1;p.wait=0;}}
 // Screen point just below a pedestal's base, for its label.
 labelPoint(i){const p=this.pedestals[i];if(!p)return null;const v=p.g.position.clone().addScaledVector(this.f,-1.2).setY(0);return this.world.screenPoint?.(v)||null;}
 update(dt){this.time+=dt;const t=this.time;this.rune.material.opacity=.4+.2*Math.sin(t*2);this.portalSwirl.rotation.z=-t*1.6;this.portalDisc.material.opacity=.18+.08*Math.sin(t*3);
  for(const p of this.pedestals){const lit=p.owned?1.6:p.affordable?1.25+.35*Math.sin(t*4):.45;p.crystal.material.emissiveIntensity=lit+p.pulse*3;p.crystal.rotation.y=t*1.4;p.crystal.position.y=SHRINE.top+.75+Math.sin(t*2+p.spec.tier)*.08;p.crystal.scale.setScalar(1+p.pulse*.8);
   p.ring.material.opacity=p.owned?1:p.affordable?.75+.2*Math.sin(t*4):.35;p.beam.material.opacity+=((p.owned?.32:0)+p.pulse*.5-p.beam.material.opacity)*Math.min(1,dt*4);p.beam.rotation.y=t*.5;p.pulse=Math.max(0,p.pulse-dt*1.2);
   p.fx.update(dt);if(!p.fx.playing){p.wait-=dt;if(p.wait<=0){p.fx.play(p.spec,{x:0,z:5.8},{x:0,z:-5},{effects:'low'});p.wait=.35;}}}
 }
 // Frames the plaza: far enough back that all three pedestals fit the screen width, portrait phones included.
 frameCamera(camera,dt=1){const aspect=camera.aspect||1,half=Math.tan(T.MathUtils.degToRad(camera.fov/2)),need=SHRINE.spacing+1.4,d=Math.max(10,Math.min(24,need/(half*aspect)*1.08)),h=2.1+d*.24;
  const pos=this.center.clone().addScaledVector(this.f,-d).setY(h),look=this.center.clone().addScaledVector(this.f,-1.2).setY(1.1);this.cameraPos??=pos.clone();this.cameraLook??=look.clone();const k=1-Math.exp(-dt*4);this.cameraPos.lerp(pos,k);this.cameraLook.lerp(look,k);
  camera.position.copy(this.cameraPos);camera.lookAt(this.cameraLook);camera.updateMatrixWorld();}
 dispose(){for(const p of this.pedestals)p.fx.dispose();this.root.removeFromParent();for(const o of this.owner)o.dispose?.();this.owner=[];}
}
