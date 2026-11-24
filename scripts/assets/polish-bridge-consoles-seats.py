"""Editable console/seat finish from the approved floor/wall study; no app export."""
import bpy,bmesh,hashlib,json,math,sys
from pathlib import Path
from array import array
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/bridge-ceiling-study'
SOURCE=Path(bpy.data.filepath);assert SOURCE.name=='bridge-floor-walls.blend'
source_hash=hashlib.sha256(SOURCE.read_bytes()).hexdigest();scene=bpy.context.scene

def signature(o):
 h=hashlib.sha256(str((tuple(v for row in o.matrix_world for v in row),o.hide_render,o.hide_viewport,o.parent.name if o.parent else None)).encode())
 if o.type=='MESH':
  a=array('f',[0])*(len(o.data.vertices)*3);o.data.vertices.foreach_get('co',a);h.update(a.tobytes())
  a=array('i',[0])*len(o.data.loops);o.data.loops.foreach_get('vertex_index',a);h.update(a.tobytes())
  h.update(str([m.name if m else None for m in o.data.materials]).encode())
 if o.type=='LIGHT':h.update(str((o.data.energy,tuple(o.data.color))).encode())
 return h.hexdigest()

def components(o):
 n=len(o.data.vertices);parents=list(range(n))
 def find(i):
  while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
  return i
 def union(a,b):parents[find(a)]=find(b)
 seen={};positions=[o.matrix_world@v.co for v in o.data.vertices]
 for i,p in enumerate(positions):
  key=tuple(round(v,5) for v in p)
  if key in seen:union(i,seen[key])
  else:seen[key]=i
 for e in o.data.edges:union(*e.vertices)
 groups={}
 for i in range(n):groups.setdefault(find(i),[]).append(i)
 return [(ids,[[min(positions[j][a] for j in ids),max(positions[j][a] for j in ids)] for a in range(3)]) for ids in groups.values()]

col=bpy.data.collections.new('BRIDGE EQUIPMENT / Contoured seats and console finish');scene.collection.children.link(col)
archive=bpy.data.collections.new('BRIDGE EQUIPMENT / Earlier cushions - hidden');scene.collection.children.link(archive);archive.hide_render=True;archive.hide_viewport=True
preview=bpy.data.collections.new('BRIDGE EQUIPMENT / Review cameras - no export');scene.collection.children.link(preview)
upholstery=scene.objects['BRIDGE_RUNTIME_BRIDGE_Upholstery_'];piping=scene.objects['CDS TAILORED / Batched seat piping']
counter=scene.objects['BRIDGE_RUNTIME_BRIDGE_Counter_finish_']
# Only isolated console equipment batches, never architectural shared batches.
console_objects=[o for o in scene.objects if o.type=='MESH' and o.name.startswith('BRIDGE_RUNTIME_BRIDGE_V15_Metal_') and any(o.name.endswith('_'+s) for s in ('personal','arcade','computer','communications','tactical'))]
modified={o.name for o in [upholstery,piping,counter]+console_objects}
protected={o.name:signature(o) for o in scene.objects if o.name not in modified}
original_console_geometry={o.name:([tuple(v.co) for v in o.data.vertices],o.matrix_world.copy()) for o in [counter]+console_objects}

def material(name,color,metal,rough,textile=False):
 m=bpy.data.materials.new('BRIDGE EQUIPMENT / '+name);m.use_nodes=True;m.diffuse_color=(*color,1)
 n=m.node_tree.nodes;l=m.node_tree.links;p=next(n for n in n if n.type=='BSDF_PRINCIPLED')
 p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=170 if textile else 90;noise.inputs['Detail'].default_value=2
 remap=n.new('ShaderNodeMapRange');remap.inputs['To Min'].default_value=rough-.045;remap.inputs['To Max'].default_value=rough+.045
 l.new(noise.outputs['Fac'],remap.inputs['Value']);l.new(remap.outputs['Result'],p.inputs['Roughness'])
 if textile:
  coord=n.new('ShaderNodeTexCoord');l.new(coord.outputs['Object'],noise.inputs['Vector'])
  wave=n.new('ShaderNodeTexWave');wave.bands_direction='X';wave.inputs['Scale'].default_value=230
  l.new(coord.outputs['Object'],wave.inputs['Vector'])
  mix=n.new('ShaderNodeMath');mix.operation='MULTIPLY';l.new(noise.outputs['Fac'],mix.inputs[0]);l.new(wave.outputs['Color'],mix.inputs[1])
  bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.24;bump.inputs['Distance'].default_value=.0006
  l.new(mix.outputs[0],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal']);p.inputs['Sheen Weight'].default_value=.22
 return m
fabric=material('Woven charcoal upholstery',(.026,.040,.048),0,.83,True)
reinforced=material('Dense textile side reinforcement',(.047,.061,.067),0,.72,True)
thread=material('Muted grey woven seam',(.16,.18,.18),0,.85,True)
alloy=material('Satin dark titanium console',(.105,.128,.145),.67,.36)
desktop=material('Brushed charcoal worktop',(.045,.060,.070),.48,.45)

# Archive only the twenty seat cushions; four desk wrist pads stay where they are.
selected={i for ids,b in components(upholstery) if len(ids)>80 and b[1][0]>-1 and b[2][1]<1.31 for i in ids}
assert len(selected)==2632,len(selected)
old=upholstery.copy();old.data=upholstery.data.copy();old.name='ARCHIVE / Earlier seat cushion inserts';archive.objects.link(old)
def delete_indices(mesh,indices):
 bm=bmesh.new();bm.from_mesh(mesh);bm.verts.ensure_lookup_table();bmesh.ops.delete(bm,geom=[bm.verts[i] for i in indices],context='VERTS');bm.to_mesh(mesh);bm.free();mesh.update()
delete_indices(old.data,set(range(len(old.data.vertices)))-selected)
upholstery.data=upholstery.data.copy();delete_indices(upholstery.data,selected)
for c in list(piping.users_collection):c.objects.unlink(piping)
archive.objects.link(piping)
for o,m in [(counter,desktop)]+[(o,alloy) for o in console_objects]:
 assert min((o.matrix_world@Vector(v)).y for v in o.bound_box)>-1,o.name
 o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(m)

created=[]
# Local convention: width X, back-positive depth D, height H. Root transforms
# match the original four chair placements; bases and hard shells stay intact.
chairs=[('Personal',3.2,1.05,-math.pi/2),('Arcade',-3.2,2.75,math.pi/2),('Computer',-1.6721825407,6.1721825407,math.pi/4),('Communications',1.6721825407,6.1721825407,-math.pi/4)]
def point(chair,p):
 _,x,y,a=chair;w,d,h=p;return Vector((x+w*math.cos(a)+d*math.sin(a),y+w*math.sin(a)-d*math.cos(a),h))
def box(chair,name,p,size,mat,bevel):
 w,d,h=size;verts=[point(chair,(p[0]+sx*w/2,p[1]+sy*d/2,p[2]+sz*h/2)) for sx,sy,sz in ((-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1))]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[(3,2,1,0),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)]);mesh.update()
 o=bpy.data.objects.new('BRIDGE EQUIPMENT / '+chair[0]+' '+name,mesh);col.objects.link(o);mesh.materials.append(mat)
 mod=o.modifiers.new('Soft stitched edge','BEVEL');mod.width=min(bevel,min(size)*.46);mod.segments=5
 o.modifiers.new('Soft surface normals','WEIGHTED_NORMAL')
 for poly in mesh.polygons:poly.use_smooth=True
 o['chair']=chair[0];created.append(o);return o

def seam(chair,name,points,radius=.0013):
 data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.bevel_depth=radius;data.bevel_resolution=2
 s=data.splines.new('POLY');s.points.add(len(points)-1)
 for v,p in zip(s.points,points):v.co=(*point(chair,p),1)
 o=bpy.data.objects.new('BRIDGE EQUIPMENT / '+chair[0]+' '+name,data);col.objects.link(o);data.materials.append(thread);o['chair']=chair[0];created.append(o)

for chair in chairs:
 # Rounded pan and split bolsters replace previous cushions, not overlay them.
 box(chair,'Seat pan',(0,-.035,.652),(.59,.57,.108),fabric,.042)
 for side in (-1,1):
  box(chair,'Contoured thigh bolster',(side*.245,-.027,.691),(.095,.48,.056),reinforced,.025)
  box(chair,'Back side bolster',(side*.222,.239,.967),(.095,.094,.354),reinforced,.038)
 box(chair,'Back central insert',(0,.245,.984),(.38,.086,.344),fabric,.035)
 box(chair,'Lumbar support',(0,.205,.842),(.40,.068,.132),fabric,.027)
 box(chair,'Soft headrest',(0,.255,1.225),(.40,.105,.122),fabric,.045)
 for side in (-1,1):
  box(chair,'Soft armrest',(side*.35,-.045,.916),(.108,.414,.037),reinforced,.016)
  seam(chair,'Bolster seam',[(side*.198,-.235,.719),(side*.198,-.08,.723),(side*.198,.16,.719)])
  seam(chair,'Back tailored seam',[(side*.177,.197,.81),(side*.177,.197,.97),(side*.177,.197,1.12)])
 seam(chair,'Headrest seam',[(-.16,.201,1.205),(-.16,.201,1.247),(.16,.201,1.247),(.16,.201,1.205)])
 for x in (-.11,0,.11):seam(chair,'Lumbar sewn channel',[(x,.169,.805),(x,.169,.876)],.0009)

# Faceted protective cheeks mount outside each unchanged active display.
console_details=[]
for display in [o for o in scene.objects if o.name.startswith('CDS REFINE / Static preview display')]:
 corners=[display.matrix_world@v.co for v in display.data.vertices]
 right=(corners[1]-corners[0]).normalized();up=(corners[3]-corners[0]).normalized()
 normal=right.cross(up).normalized();centre=sum(corners,Vector())/4
 width=(corners[1]-corners[0]).length;height=(corners[3]-corners[0]).length
 def casing(name,outline,front=.042,back=.009,mat=alloy):
  count=len(outline);verts=[centre+right*x+up*y+normal*z for z in (back,front) for x,y in outline]
  faces=[tuple(reversed(range(count))),tuple(range(count,2*count))]+[(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)]
  mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
  o=bpy.data.objects.new('BRIDGE EQUIPMENT / '+display.name.rsplit(' ',1)[-1]+' '+name,mesh);col.objects.link(o);mesh.materials.append(mat)
  mod=o.modifiers.new('Machined perimeter bevel','BEVEL');mod.width=.006;mod.segments=3;o.modifiers.new('Weighted casing normals','WEIGHTED_NORMAL');console_details.append(o)
  assert all(abs(x)>width/2+.016 or abs(y)>height/2+.016 for x,y in outline)
  return o
 for side in (-1,1):
  inner=width/2+.028;outer=width/2+.103
  outline=[(side*inner,-height/2-.04),(side*outer,-height/2+.035),(side*outer,height/2-.015),(side*(inner+.03),height/2+.065),(side*inner,height/2+.065)]
  if side<0:outline.reverse()
  casing('Faceted side bumper',outline)
 # A separate top hood provides readable depth without hiding the display.
 y=height/2+.035
 casing('Tapered cooling brow',[(-width/2-.015,y),(width/2+.015,y),(width/2+.075,y+.04),(width/2+.045,y+.09),(-width/2-.045,y+.09),(-width/2-.075,y+.04)],.057,.009)
 for i in range(5):
  x=(i-2)*.052
  casing('Brow cooling recess',[(x-.014,y+.028),(x+.014,y+.028),(x+.014,y+.058),(x-.014,y+.058)],.058,.057,desktop)

bpy.context.view_layer.update()
for name,value in protected.items():assert signature(scene.objects[name])==value,name
for name,(coords,matrix) in original_console_geometry.items():
 o=scene.objects[name];assert coords==[tuple(v.co) for v in o.data.vertices] and o.matrix_world==matrix,name
minimum_y=100;max_height=0
for o in created:
 chair=next(c for c in chairs if c[0]==o['chair'])
 points=[o.matrix_world@Vector(v) for v in o.bound_box]
 for p in points:
  # World axis aligned curve bounds overestimate rotated chairs slightly.
  assert p.y>-1 and .59<p.z<1.301,(o.name,p)
  minimum_y=min(minimum_y,p.y);max_height=max(max_height,p.z)
missing=[i.name for i in bpy.data.images if i.source=='FILE' and not i.packed_file and not Path(bpy.path.abspath(i.filepath)).is_file()]
assert not missing,missing
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash

def camera(name,pos,target,lens):
 d=bpy.data.cameras.new(name);d.lens=lens;o=bpy.data.objects.new(name,d);preview.objects.link(o);o.location=pos;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
cam1=camera('EQUIPMENT REVIEW / Overview',(0,-2.5,1.72),(0,3.1,1.15),19)
cam2=camera('EQUIPMENT REVIEW / Seat and console',(3.92,2.38,1.68),(3.38,1.10,1.23),24)
scene.name='CRUZ DEL SUR / Bridge consoles and seats';scene.camera=cam1;scene.cycles.samples=32;scene.cycles.use_denoising=True
path=OUT/'bridge-consoles-seats.blend'
try:bpy.ops.wm.save_as_mainfile(filepath=str(path))
except RuntimeError:
 pending=path.with_name(path.name+'@')
 if path.exists() or not pending.is_file():raise
 with pending.open('rb') as stream:
  header=stream.read(7);assert header==b'BLENDER' or header.startswith((b'\x28\xb5\x2f\xfd',b'\x1f\x8b'))
 try:pending.replace(path)
 except PermissionError:print('PENDING_NATIVE_RENAME',str(pending),flush=True)
report={'source':SOURCE.name,'sourceSha256':source_hash,'sourceUnchanged':True,'revision':path.name,'protectedObjectsUnchanged':len(protected),'replacedSeatCushionVertices':len(selected),'originalCushionsArchived':True,'newSeatObjects':len(created),'modifiedConsoleMaterialBatches':len(console_objects)+1,'newFittedConsoleCasings':len(console_details),'consoleGeometryAndTransformsPreserved':True,'newGeometryMinimumY':minimum_y,'maximumSeatHeight':max_height,'roofFloorWallsGlassShelvesPreserved':True,'originalLightingPreserved':True,'missingImages':missing,'runtimeExported':False}
(OUT/'consoles-seats-validation.json').write_text(json.dumps(report,indent=2));print('EQUIPMENT_READY',json.dumps(report),flush=True)
if '--preview' in sys.argv:
 for i,c in enumerate((cam1,cam2),1):scene.camera=c;scene.render.filepath=str(OUT/f'consoles-seats-{i:02}.png');bpy.ops.render.render(write_still=True)

