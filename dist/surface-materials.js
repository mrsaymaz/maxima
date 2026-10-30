import * as T from './vendor/three.module.min.js';
// World-unit texture scales and surface response are semantic, never inferred from colour.
export const SURFACES=Object.freeze({
 stone:{roughness:.92,metalness:0,detail:'stone',scale:.75},wood:{roughness:.80,metalness:0,detail:'wood',scale:1.15},
 foliage:{roughness:.94,metalness:0,detail:'leaf',scale:.95},metal:{roughness:.38,metalness:.45},
 paper:{roughness:.96,metalness:0},fabric:{roughness:1,metalness:0},organic:{roughness:.76,metalness:0},
 glass:{roughness:.24,metalness:.08},water:{roughness:.18,metalness:0},soil:{roughness:1,metalness:0},
 effect:{roughness:.6,metalness:0},cue:{roughness:1,metalness:0}
});
export function assignSurface(material,kind){
 if(!Object.hasOwn(SURFACES,kind))throw Error('Unknown surface: '+kind);const p=SURFACES[kind];
 material.userData.surface=kind;material.userData.detailScale=p.scale;
 if(p.detail)material.userData.detail=p.detail;else delete material.userData.detail;
 if(material.isMeshStandardMaterial){material.roughness=p.roughness;material.metalness=p.metalness;}
 return material;
}
export function surfaceMaterial(kind,color,options={}){const m=assignSurface(new T.MeshStandardMaterial({color}),kind);m.setValues(options);return m;}
export function assignSurfaceRoles(materials,roles){for(const[kind,names]of Object.entries(roles))for(const name of names){if(!materials[name])throw Error('Missing material role: '+name);assignSurface(materials[name],kind);}return materials;}
// Warning inks are unaffected by sun/rim lighting. Geometry and opacity remain owned by hazard state.
export function cueMaterial(color,options={}){const{emissive,emissiveIntensity,roughness,metalness,...rest}=options;return assignSurface(new T.MeshBasicMaterial({color,toneMapped:false,...rest}),'cue');}
export function replaceCueMaterials(materials,names){for(const name of names){const old=materials[name];const cue=cueMaterial(old.color,{transparent:old.transparent,opacity:old.opacity,depthWrite:old.depthWrite,side:old.side});old.dispose();materials[name]=cue;}return materials;}
