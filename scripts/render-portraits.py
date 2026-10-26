#!/usr/bin/env python3
"""CPU-only textured GLB portrait rasterizer; no browser, GPU, or generated artwork.
Supports ordinary glTF triangle mesh accessors, interleaved views, node TRS/matrices,
baseColorTexture and smooth normals. Renders the supplied bind/rest pose.
"""
from pathlib import Path
import argparse, io, json, math, struct, time
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
UPLOAD=Path('/workspace/scratch/665598494201/upload')
DTYPE={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}
WIDTH={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def unit(v):
 v=np.asarray(v,dtype=float);return v/np.maximum(np.linalg.norm(v,axis=-1,keepdims=True),1e-12)
def node_matrix(n):
 if 'matrix' in n:return np.array(n['matrix'],float).reshape(4,4).T
 x,y,z,w=n.get('rotation',[0,0,0,1]);r=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
 m=np.eye(4);m[:3,:3]=r@np.diag(n.get('scale',[1,1,1]));m[:3,3]=n.get('translation',[0,0,0]);return m
def load_glb(path):
 raw=path.read_bytes();offset=12;binary=None;doc=None
 while offset<len(raw):
  n,kind=struct.unpack_from('<II',raw,offset);chunk=raw[offset+8:offset+8+n];offset+=8+n
  if kind==0x4e4f534a:doc=json.loads(chunk)
  if kind==0x004e4942:binary=chunk
 def accessor(i):
  a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];dtype=np.dtype(DTYPE[a['componentType']]);cols=WIDTH[a['type']];start=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',cols*dtype.itemsize)
  ar=np.ndarray((a['count'],cols),dtype=dtype,buffer=binary,offset=start,strides=(stride,dtype.itemsize)).copy()
  if a.get('normalized') and a['componentType']!=5126:
   inf=np.iinfo(dtype);ar=ar.astype(float)/inf.max
   if inf.min<0:ar=np.maximum(ar,-1)
  return ar
 nodes=doc.get('nodes',[]);world={}
 def walk(i,parent):
  world[i]=parent@node_matrix(nodes[i])
  for child in nodes[i].get('children',[]):walk(child,world[i])
 for i in doc['scenes'][doc.get('scene',0)]['nodes']:walk(i,np.eye(4))
 primitives=[]
 for i,n in enumerate(nodes):
  if 'mesh' not in n:continue
  m=world.get(i,node_matrix(n))
  for prim in doc['meshes'][n['mesh']]['primitives']:
   if prim.get('mode',4)!=4:continue
   attrs=prim['attributes'];p=accessor(attrs['POSITION']);p=(np.c_[p,np.ones(len(p))]@m.T)[:,:3]
   normal=accessor(attrs['NORMAL']) if 'NORMAL' in attrs else np.zeros_like(p);normal=unit(normal@np.linalg.inv(m[:3,:3]))
   uv=accessor(attrs['TEXCOORD_0']) if 'TEXCOORD_0' in attrs else np.zeros((len(p),2))
   faces=accessor(prim['indices']).reshape(-1,3) if 'indices' in prim else np.arange(len(p)).reshape(-1,3)
   mat=doc.get('materials',[{}])[prim.get('material',0)].get('pbrMetallicRoughness',{});factor=np.array(mat.get('baseColorFactor',[1,1,1,1]));texture=np.ones((1,1,3),dtype=np.uint8)*255
   if 'baseColorTexture' in mat:
    tex=doc['textures'][mat['baseColorTexture']['index']];image=doc['images'][tex['source']];v=doc['bufferViews'][image['bufferView']];start=v.get('byteOffset',0);texture=np.array(Image.open(io.BytesIO(binary[start:start+v['byteLength']])).convert('RGB'))
   primitives.append((p,normal,uv,faces,texture,factor))
 return primitives

def render(path,out,width=600,height=650,yaw=24,pitch=12,ss=2):
 ps=load_glb(path);allp=np.concatenate([p[0] for p in ps]);center=(allp.min(0)+allp.max(0))/2
 yaw,pitch=np.radians([yaw,pitch]);front=unit([math.sin(yaw)*math.cos(pitch),math.sin(pitch),math.cos(yaw)*math.cos(pitch)]);right=unit(np.cross([0,1,0],front));up=unit(np.cross(front,right));basis=np.stack([right,up,front],axis=1)
 projected=(allp-center)@basis;lo=projected.min(0);hi=projected.max(0);W,H=width*ss,height*ss;scale=min(W*.87/(hi[0]-lo[0]),H*.89/(hi[1]-lo[1]));mid=(lo+hi)/2
 rgba=np.zeros((H,W,4),dtype=np.uint8);depth=np.full((H,W),-np.inf);light=unit([-0.55,0.9,1.1])
 for pos,norm,uv,faces,tex,factor in ps:
  pr=(pos-center)@basis;screen=np.c_[(pr[:,0]-mid[0])*scale+W/2,-(pr[:,1]-mid[1])*scale+H/2,pr[:,2]]
  ndotl=np.maximum(norm@light,0);shade=.68+.31*ndotl
  for face in faces:
   verts=screen[face];x0=max(0,int(np.floor(verts[:,0].min())));x1=min(W-1,int(np.ceil(verts[:,0].max())));y0=max(0,int(np.floor(verts[:,1].min())));y1=min(H-1,int(np.ceil(verts[:,1].max())))
   if x0>x1 or y0>y1:continue
   a,b,c=verts;den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
   if abs(den)<1e-9:continue
   yy,xx=np.mgrid[y0:y1+1,x0:x1+1];xx=xx+.5;yy=yy+.5
   wa=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den;wb=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den;wc=1-wa-wb
   z=wa*a[2]+wb*b[2]+wc*c[2];old=depth[y0:y1+1,x0:x1+1];mask=(wa>=-1e-6)&(wb>=-1e-6)&(wc>=-1e-6)&(z>old)
   if not mask.any():continue
   weights=np.stack([wa[mask],wb[mask],wc[mask]],axis=1);tuv=weights@uv[face];tx=np.clip(tuv[:,0]*(tex.shape[1]-1),0,tex.shape[1]-1).astype(int);ty=np.clip(tuv[:,1]*(tex.shape[0]-1),0,tex.shape[0]-1).astype(int)
   lit=weights@shade[face];rgb=np.clip(tex[ty,tx].astype(float)*lit[:,None]*factor[:3],0,255).astype(np.uint8);patch=rgba[y0:y1+1,x0:x1+1];patch[mask,:3]=rgb;patch[mask,3]=int(255*factor[3]);old[mask]=z[mask]
 image=Image.fromarray(rgba,'RGBA').resize((width,height),Image.Resampling.LANCZOS);out.parent.mkdir(parents=True,exist_ok=True);image.save(out,optimize=True)
 return image
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--level',type=int);p.add_argument('--yaw',type=float,default=24);p.add_argument('--pitch',type=float,default=12);a=p.parse_args()
 for level in ([a.level] if a.level is not None else range(11)):
  f=UPLOAD/(f'hufflepuff-{level}(1).glb' if level<10 else 'hufflepuff-10.glb');out=ROOT/f'dist/assets/portraits/hufflepuff-{level}.png';start=time.time();render(f,out,yaw=a.yaw,pitch=a.pitch);print(f'{out.name} {out.stat().st_size} bytes in {time.time()-start:.2f}s',flush=True)
