#!/usr/bin/env python3
"""Build portable anatomy rigs while referencing the immutable source GLB buffer.
Original POSITION/NORMAL/UV/index/image bytes are never rewritten.
"""
from pathlib import Path
import json,struct,io,math
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/assets/rigs';OUT.mkdir(parents=True,exist_ok=True)
WIDTH={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
DTYPE={5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}
def smooth(a,b,x):
 t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def build(partner,level):
 stem=f'{partner}-{level}';raw=(ROOT/f'dist/assets/creatures/{stem}.glb').read_bytes();n=struct.unpack_from('<I',raw,12)[0];j=json.loads(raw[20:20+n]);offset=28+n;binary=raw[offset:];meta=j['extras']['maximaLocomotion'];H=meta['restDimensions']['height'];yaw=meta['forwardYaw'];f=np.array([math.sin(yaw),0,math.cos(yaw)]);r=np.array([f[2],0,-f[0]])
 def acc(i):
  a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];dt=np.dtype(DTYPE[a['componentType']]);w=WIDTH[a['type']];return np.ndarray((a['count'],w),dt,buffer=binary,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',dt.itemsize*w),dt.itemsize)).copy()
 primitives=j['meshes'][0]['primitives'];points=np.concatenate([acc(p['attributes']['POSITION']) for p in primitives]);ground=float(points[:,1].min());center=(points.min(0)+points.max(0))/2
 def xyz(l,y,z):return (r*l+f*z+np.array([center[0],ground+y,center[2]])).tolist()
 local=points-center;L=local@r;F=local@f;Y=points[:,1]-ground
 colors=[]
 for p in primitives:
  uv=acc(p['attributes']['TEXCOORD_0']);m=j['materials'][p.get('material',0)]['pbrMetallicRoughness'];im=j['images'][j['textures'][m['baseColorTexture']['index']]['source']];v=j['bufferViews'][im['bufferView']];tex=np.asarray(Image.open(io.BytesIO(binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']])).convert('RGB'))/255
  x=np.clip((uv[:,0]*(tex.shape[1]-1)).astype(int),0,tex.shape[1]-1);y=np.clip((uv[:,1]*(tex.shape[0]-1)).astype(int),0,tex.shape[0]-1);colors.append(tex[y,x])
 color=np.concatenate(colors);joints=[];parents=[];positions=[];roles={};limbs={}
 def joint(name,point,parent=None,role=None):
  idx=len(joints);joints.append('Maxima_'+name);parents.append(parent);positions.append(np.array(point));
  if role:roles[role]=idx
  return idx
 root=joint('Root',xyz(0,0,0));body=joint('Body',xyz(0,.32*H,0),root,'body');chest=joint('Chest',xyz(0,.50*H,.02*H),body)
 weights=np.zeros((len(points),80),np.float64)
 if partner=='ravenclaw':
  head=joint('Head',xyz(0,.61*H,.06*H),chest,'head');upper=smooth(.49*H,.64*H,Y);weights[:,body]=1-upper;weights[:,head]=upper
  # Bird face, beak and crown share one rigid head influence.
  face=(Y>.60*H)&(np.abs(L)<.27*H);weights[face]=0;weights[face,head]=1
  for side,label in [(-1,'Left'),(1,'Right')]:
   blue=(color[:,2]>color[:,0]*1.25)&(color[:,2]>color[:,1]*1.08)
   wing=(L*side>.25*H)&(Y>.21*H)&(~face)&blue
   shoulder=joint(label+'Wing',xyz(side*.24*H,.48*H,0),chest);wrist=joint(label+'WingTip',xyz(side*.40*H,.52*H,-.10*H),shoulder)
   strength=smooth(.22*H,.37*H,np.abs(L))*wing;tip=smooth(.38*H,.60*H,np.abs(L));weights*=1-strength[:,None];weights[:,shoulder]+=strength*(1-tip);weights[:,wrist]+=strength*tip
   limbs[label.lower()+'Wing']={'joints':[shoulder,wrist],'role':'wing','side':side}
   feet=(L*side>0)&(Y<.18*H)&(color[:,0]>color[:,2]*1.5)&(color[:,1]>color[:,2]*1.15)
   footL=float(np.median(L[feet])) if feet.any() else side*.14*H;footF=float(np.median(F[feet])) if feet.any() else .08*H
   hip=joint(label+'Hip',xyz(footL,.25*H,footF),body);knee=joint(label+'Knee',xyz(footL,.13*H,footF-.07*H),hip);ankle=joint(label+'Ankle',xyz(footL,.04*H,footF),knee);toe=joint(label+'Toe',xyz(footL,.025*H,footF+.06*H),ankle)
   legMask=(L*side>0)&(Y<.23*H);leg=smooth(.23*H,.15*H,Y)*legMask
   weights*=1-leg[:,None];a=smooth(.10*H,.06*H,Y);b=smooth(.045*H,.02*H,Y);weights[:,hip]+=leg*(1-a);weights[:,ankle]+=leg*a*(1-b);weights[:,toe]+=leg*a*b
   rigidFoot=feet|((L*side>0)&(Y<.14*H)&(~blue));weights[rigidFoot]=0;weights[rigidFoot,ankle]=1
   limbs[label.lower()+'Hind']={'joints':[hip,knee,ankle,toe],'phase':0 if side<0 else .5,'side':side,'footLocal':[footL,footF]}
  heads=[head]
 else:
  # Coils bend through overlapping angular segments; upper necks branch into heads.
  weights[:]=0;angle=np.arctan2(F,L);coils=[]
  for i in range(8):
   a=i*math.tau/8;coils.append(joint('Coil'+str(i),xyz(math.cos(a)*.24*H,.13*H,math.sin(a)*.21*H),body))
  angular=np.stack([np.exp((np.cos(angle-i*math.tau/8)-1)*12) for i in range(8)],axis=1);angular/=angular.sum(1)[:,None];neck=smooth(.23*H,.48*H,Y)
  for i,idx in enumerate(coils):weights[:,idx]=angular[:,i]*(1-neck)
  count=3 if level>=8 else 1;centers=[0.] if count==1 else [-.27*H,0.,.27*H];heads=[];headGroups=[]
  for k,l in enumerate(centers):
   mid=joint('Neck'+str(k),xyz(l*.55,.37*H,.02*H),body);topY=(.66 if k==1 or count==1 else .52)*H
   h=joint('Head'+str(k),xyz(l,topY,.09*H),mid);heads.append(h);limbs['neck'+str(k)]={'joints':[mid,h],'role':'neck','side':np.sign(l).item()}
  # Upper side heads lie lower than the main head; smooth Voronoi at the neck junction.
  headDist=np.stack([((L-l)/(.20*H))**2+((Y-((.79 if k==1 or count==1 else .66)*H))/(.25*H))**2 for k,l in enumerate(centers)],axis=1)
  nearest=headDist.argmin(1)
  for k,h in enumerate(heads):
   take=nearest==k;blend=smooth((.44 if k==1 or count==1 else .36)*H,(.65 if k==1 or count==1 else .54)*H,Y);weights[take,h]=neck[take]*blend[take];mid=limbs['neck'+str(k)]['joints'][0];weights[take,mid]=neck[take]*(1-blend[take]);
   rigid=take&(Y>((.66 if k==1 or count==1 else .56)*H));weights[rigid]=0;weights[rigid,h]=1;headGroups.append(int(rigid.sum()))
  roles['head']=heads[0] if count==1 else heads[1];roles['coils']=coils
  if level<=2:
   tail=joint('Tail',xyz(.20*H,.22*H,-.20*H),body);tip=joint('TailTip',xyz(.30*H,.46*H,-.26*H),tail);tailMask=(F<-.16*H)&(L>.12*H)&(Y>.25*H);mix=smooth(.25*H,.40*H,Y)*tailMask;end=smooth(.36*H,.62*H,Y);weights*=1-mix[:,None];weights[:,tail]+=mix*(1-end);weights[:,tip]+=mix*end;roles['tail']=[tail,tip]
 # Weld coincident UV seam vertices, then soften skin transitions along mesh edges.
 weights=weights[:,:len(joints)];_,weld=np.unique(np.round(points/H,5),axis=0,return_inverse=True);count=int(weld.max())+1
 summed=np.zeros((count,len(joints)));np.add.at(summed,weld,weights);summed/=np.bincount(weld)[:,None];edges=[];base=0
 for p in primitives:
  faces=acc(p['indices']).reshape(-1,3).astype(int)+base;edges.extend([weld[faces[:,[0,1]]],weld[faces[:,[1,2]]],weld[faces[:,[2,0]]]]);base+=j['accessors'][p['attributes']['POSITION']]['count']
 edges=np.concatenate(edges);edges=np.concatenate([edges,edges[:,::-1]]);degree=np.bincount(edges[:,0],minlength=count)
 for _ in range(3):
  adjacent=np.zeros_like(summed);np.add.at(adjacent,edges[:,0],summed[edges[:,1]]);adjacent/=np.maximum(1,degree)[:,None];summed=.65*summed+.35*adjacent
 rigid=np.max(weights[:,heads],axis=1)>.9999;original=weights.copy();weights=summed[weld];weights[rigid]=original[rigid]
 ids=np.argsort(-weights,axis=1)[:,:4];values=np.take_along_axis(weights,ids,axis=1);values/=values.sum(1)[:,None]
 assert np.isfinite(values).all() and np.min(values)>=0
 # All sources are one identity mesh under two cancelling animation wrappers.
 assert all(not any(k in n for k in ['matrix','translation','rotation','scale']) for n in j['nodes'] if 'mesh' in n)
 sourceNodes=len(j['nodes']);j['scenes'][j.get('scene',0)]['nodes']=[0,sourceNodes];j['nodes'][0]['skin']=0
 for i,name in enumerate(joints):
  pos=positions[i]-(positions[parents[i]] if parents[i] is not None else 0);j['nodes'].append({'name':name,'translation':pos.tolist(),'children':[sourceNodes+k for k,p in enumerate(parents) if p==i]})
 chunks=[];length=0
 for v in j['bufferViews']:v['byteOffset']=v.get('byteOffset',0)+offset
 def append(array,typ,component):
  nonlocal length
  a=np.asarray(array,dtype={5123:'<u2',5126:'<f4'}[component]);pad=(-length)%4;chunks.append(bytes(pad));length+=pad;data=a.tobytes();view=len(j['bufferViews']);j['bufferViews'].append({'buffer':1,'byteOffset':length,'byteLength':len(data)});chunks.append(data);length+=len(data);index=len(j['accessors']);j['accessors'].append({'bufferView':view,'componentType':component,'type':typ,'count':len(a)});return index
 start=0
 for p in primitives:
  n=j['accessors'][p['attributes']['POSITION']]['count'];p['attributes']['JOINTS_0']=append(ids[start:start+n],'VEC4',5123);p['attributes']['WEIGHTS_0']=append(values[start:start+n],'VEC4',5126);start+=n
 matrices=[]
 for p in positions:
  m=np.eye(4);m[:3,3]=-p;matrices.append(m.T.reshape(16))
 j['skins']=[{'name':'MaximaAnatomyRig','joints':[sourceNodes+i for i in range(len(joints))],'skeleton':sourceNodes,'inverseBindMatrices':append(matrices,'MAT4',5126)}];j['animations']=[]
 j['buffers']=[{'uri':'../creatures/'+stem+'.glb','byteLength':len(raw)},{'uri':stem+'.bin','byteLength':length}]
 limbsMeta={name:{**data,'nodes':[sourceNodes+i for i in data['joints']]} for name,data in limbs.items()}
 j['extras']['maximaLocomotion']={**meta,'version':3,'profile':partner+'-anatomy-rig-'+str(level),'animationType':'skeletal','rootNode':sourceNodes+root,'bodyNode':sourceNodes+body,'headNode':sourceNodes+roles['head'],'animationNode':None,'limbNodes':limbsMeta,'referenceSpeed':.64 if partner=='ravenclaw' else 1.2,'playbackReferenceSpeed':.64 if partner=='ravenclaw' else 1.2,'referenceSpeedUnit':'modelHeightsPerSecond','rigSource':'Original mesh, UVs and image data; new anatomy joints and geometric/colour-guided four-weight skin.','limitations':'Conservative generated anatomy rig; visual-device acceptance remains required. No eyelid rig or morph targets added.'}
 j['extras']['maximaRig']={'height':H,'ground':ground,'center':center.tolist(),'forward':f.tolist(),'right':r.tolist(),'jointBase':sourceNodes,'positions':[p.tolist() for p in positions],'parents':parents,'roles':roles,'heads':heads,'limbs':limbs,'source':stem+'.glb','vertices':len(points),'headCount':len(heads)}
 (OUT/(stem+'.gltf')).write_text(json.dumps(j,separators=(',',':')));(OUT/(stem+'.bin')).write_bytes(b''.join(chunks));print(stem,len(joints),'joints',len(points),'weighted vertices',flush=True)
if __name__=='__main__':
 for partner,count in [('ravenclaw',9),('slytherin',10)]:
  for level in range(count):build(partner,level)
