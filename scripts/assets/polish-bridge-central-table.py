"""Central table revision. Run against bridge-consoles-seats.blend, -- --preview."""
import bpy,bmesh,hashlib,json,math,sys
from pathlib import Path
from array import array
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/bridge-ceiling-study'
SOURCE=Path(bpy.data.filepath);assert SOURCE.name=='bridge-consoles-seats.blend'
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

def face_signature(o,allowed):
 h=hashlib.sha256()
 for p in o.data.polygons:
  if all(i in allowed for i in p.vertices):h.update(str(sorted(tuple(round(v,6) for v in o.matrix_world@o.data.vertices[i].co) for i in p.vertices)).encode())
 return h.hexdigest()

col=bpy.data.collections.new('BRIDGE TABLE / Faceted pedestal and hardware');scene.collection.children.link(col)
archive=bpy.data.collections.new('BRIDGE TABLE / Earlier pedestal - hidden');scene.collection.children.link(archive);archive.hide_render=True;archive.hide_viewport=True
review=bpy.data.collections.new('BRIDGE TABLE / Review cameras - no export');scene.collection.children.link(review)
targets=[o for o in scene.objects if o.type=='MESH' and o.name.startswith('BRIDGE_RUNTIME_') and o.name.endswith('_tactical')]
protected={o.name:signature(o) for o in scene.objects if o not in targets}
kept=[];archived={}
for o in targets:
 selected={i for ids,b in components(o) if b[2][1]<.985 for i in ids}
 if not selected:continue
 assert all(-1.05<(o.matrix_world@o.data.vertices[i].co).x<1.05 and 1.29<(o.matrix_world@o.data.vertices[i].co).y<4.01 for i in selected),o.name
 remaining=set(range(len(o.data.vertices)))-selected
 before=face_signature(o,remaining)
 copy=o.copy();copy.data=o.data.copy();copy.name='ARCHIVE / Earlier table / '+o.name;archive.objects.link(copy)
 def erase(mesh,indices):
  bm=bmesh.new();bm.from_mesh(mesh);bm.verts.ensure_lookup_table();bmesh.ops.delete(bm,geom=[bm.verts[i] for i in indices],context='VERTS');bm.to_mesh(mesh);bm.free();mesh.update()
 erase(copy.data,remaining);o.data=o.data.copy();erase(o.data,selected)
 assert face_signature(o,set(range(len(o.data.vertices))))==before,o.name
 kept.append(o.name);archived[o.name]=len(selected)

def material(name,color,metal,rough,emission=0):
 m=bpy.data.materials.new('BRIDGE TABLE / '+name);m.use_nodes=True;m.diffuse_color=(*color,1)
 n=m.node_tree.nodes;l=m.node_tree.links;p=next(node for node in n if node.type=='BSDF_PRINCIPLED')
 p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 if not emission:
  noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=100;noise.inputs['Detail'].default_value=2
  remap=n.new('ShaderNodeMapRange');remap.inputs['To Min'].default_value=rough-.04;remap.inputs['To Max'].default_value=rough+.04
  l.new(noise.outputs['Fac'],remap.inputs['Value']);l.new(remap.outputs['Result'],p.inputs['Roughness'])
 return m
shell=material('Graphite satin ceramic',(.043,.061,.072),.52,.4)
metal=material('Brushed titanium shoulders',(.18,.215,.23),.75,.32)
panel=material('Service cartridge alloy',(.08,.103,.115),.65,.43)
seal=material('Recessed black gasket',(.009,.015,.019),.08,.73)
warm=material('Recessed warm diffuser',(1,.44,.16),.05,.4,2.8)
cyan=material('Small cyan service status',(.04,.54,.68),.05,.4,1.5)
# Original screen rim gets its own material; no shared source material is edited.
rim=scene.objects['BRIDGE_RUNTIME_BRIDGE_V15_Metal_tactical'];rim.data.materials.clear();rim.data.materials.append(metal)
created=[]
def mesh(name,verts,faces,mat,bevel=.008):
 d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new('BRIDGE TABLE / '+name,d);col.objects.link(o);d.materials.append(mat)
 if bevel:
  mod=o.modifiers.new('Machined edge','BEVEL');mod.width=bevel;mod.segments=3;o.modifiers.new('Weighted panel normals','WEIGHTED_NORMAL')
 created.append(o);return o

def octagon(x,y,cut,z):return [(-x+cut,2.65-y,z),(x-cut,2.65-y,z),(x,2.65-y+cut,z),(x,2.65+y-cut,z),(x-cut,2.65+y,z),(-x+cut,2.65+y,z),(-x,2.65+y-cut,z),(-x,2.65-y+cut,z)]
def loft(name,rings,mat):
 verts=[p for x,y,cut,z in rings for p in octagon(x,y,cut,z)];faces=[tuple(reversed(range(8))),tuple(range(len(verts)-8,len(verts)))]
 for level in range(len(rings)-1):
  for i in range(8):faces.append((level*8+i,level*8+(i+1)%8,(level+1)*8+(i+1)%8,(level+1)*8+i))
 return mesh(name,verts,faces,mat)
def box(name,pos,size,mat,bevel=.005):
 x,y,z=pos;a,b,c=[s/2 for s in size]
 verts=[(x+sx*a,y+sy*b,z+sz*c) for sx,sy,sz in ((-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1))]
 return mesh(name,verts,[(3,2,1,0),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)],mat,bevel)

loft('Floating shadow plinth',[(.76,1.02,.11,.028),(.82,1.10,.13,.055),(.82,1.10,.13,.10)],seal)
loft('Splayed titanium foot',[(.82,1.10,.13,.095),(.84,1.12,.15,.13),(.73,1.01,.16,.22)],metal)
loft('Narrow waist chassis',[(.68,.96,.12,.20),(.62,.90,.14,.31),(.62,.90,.14,.70),(.75,1.03,.16,.85)],shell)
loft('Upper floating collar',[(.75,1.03,.16,.83),(.90,1.19,.17,.89),(.90,1.19,.17,.915)],metal)
loft('Layered underside chamfer',[(.90,1.19,.17,.905),(1.035,1.335,.18,.955),(1.035,1.335,.18,.98)],shell)
# Four folded structural supports join the foot to the upper collar.
for sx in (-1,1):
 for sy in (-1,1):
  outline=[(.70,.20),(.57,.39),(.57,.66),(.80,.86),(.90,.89),(.65,.64),(.65,.40),(.80,.22)]
  verts=[(sx*x,2.65+sy*(.74+depth),z) for depth in (0,.08) for x,z in outline]
  n=len(outline);faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
  mesh('Folded structural knee',verts,faces,metal,.01)
# Replace front/rear service panels with a central inset cartridge and side seams.
for side in (-1,1):
 y=2.65+side*.906
 box('Cartridge black recess',(0,y,.50),(.81,.018,.33),seal)
 box('Service cassette',(0,y+side*.012,.50),(.74,.018,.28),panel,.009)
 for x in (-.31,.31):
  box('Cassette captive fastener',(x,y+side*.025,.60),(.022,.008,.022),metal,.002)
 box('Cassette recessed pull',(0,y+side*.025,.57),(.20,.009,.032),seal,.003)
 box('Service status cyan',(-.27,y+side*.027,.41),(.055,.008,.014),cyan,.002)
 for i in range(4):box('Cartridge ventilation',(0,y+side*.024,.405+i*.026),(.31,.009,.009),seal,.002)
 # Warm fixtures are actual housing/recess/diffuser stacks inset into collar.
 for x in (-.51,.51):
  box('Collar light surround',(x,2.65+side*1.194,.898),(.28,.018,.035),seal,.004)
  box('Collar warm lens',(x,2.65+side*1.205,.898),(.22,.008,.016),warm,.002)
 box('Foot light socket',(0,2.65+side*1.107,.13),(.48,.018,.029),seal,.003)
 box('Foot warm lens',(0,2.65+side*1.119,.13),(.40,.008,.014),warm,.002)
for side in (-1,1):
 box('Side ventilation recess',(side*.623,2.65,.51),(.016,1.10,.32),seal)
 for i in range(8):
  box('Angled cooling fin',(side*.637,2.28+i*.105,.51),(.025,.028,.25),panel,.004)
 box('Side top service seam',(side*.631,2.65,.697),(.016,1.10,.018),metal,.003)
# Shallow reinforced corner pads mount on the existing top edge, outside display.
for sx in (-1,1):
 for sy in (-1,1):
  box('Bezel corner reinforcement',(sx*.985,2.65+sy*1.19,1.067),(.075,.11,.014),metal,.005)

bpy.context.view_layer.update()
for name,value in protected.items():assert signature(scene.objects[name])==value,name
max_x=0;minimum_y=10;maximum_y=-10;maximum_z=0
for o in created:
 points=[o.matrix_world@Vector(v) for v in o.bound_box]
 for p in points:
  assert abs(p.x)<=1.041 and 1.30<=p.y<=4.0 and .02<p.z<1.082,(o.name,p)
  max_x=max(max_x,abs(p.x));minimum_y=min(minimum_y,p.y);maximum_y=max(maximum_y,p.y);maximum_z=max(maximum_z,p.z)
missing=[i.name for i in bpy.data.images if i.source=='FILE' and not i.packed_file and not Path(bpy.path.abspath(i.filepath)).is_file()]
assert not missing,missing
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash

def camera(name,pos,target,lens):
 d=bpy.data.cameras.new(name);d.lens=lens;o=bpy.data.objects.new(name,d);review.objects.link(o);o.location=pos;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
cam1=camera('TABLE REVIEW / Overview',(0,-2.5,1.72),(0,3.1,1.15),19)
cam2=camera('TABLE REVIEW / Pedestal detail',(2.25,.08,1.34),(0,2.63,.70),31)
scene.name='CRUZ DEL SUR / Bridge central table';scene.camera=cam1;scene.cycles.samples=32;scene.cycles.use_denoising=True
path=OUT/'bridge-central-table.blend'
try:bpy.ops.wm.save_as_mainfile(filepath=str(path))
except RuntimeError:
 pending=path.with_name(path.name+'@')
 if path.exists() or not pending.is_file():raise
 with pending.open('rb') as stream:
  header=stream.read(7);assert header==b'BLENDER' or header.startswith((b'\x28\xb5\x2f\xfd',b'\x1f\x8b'))
 try:pending.replace(path)
 except PermissionError:print('PENDING_NATIVE_RENAME',str(pending),flush=True)
report={'source':SOURCE.name,'sourceSha256':source_hash,'sourceUnchanged':True,'revision':path.name,'protectedObjectsUnchanged':len(protected),'archivedVerticesByBatch':archived,'retainedUpperFacesIdentical':kept,'newTableMeshes':len(created),'newGeometryBounds':{'absoluteX':max_x,'y':[minimum_y,maximum_y],'maximumZ':maximum_z},'screenHologramAnchorsUnchanged':True,'restOfCabinAndShelvesUnchanged':True,'existingLightsUnchanged':True,'additionalLights':0,'missingImages':missing,'runtimeExported':False}
(OUT/'central-table-validation.json').write_text(json.dumps(report,indent=2));print('TABLE_READY',json.dumps(report),flush=True)
if '--preview' in sys.argv:
 for i,c in enumerate((cam1,cam2),1):scene.camera=c;scene.render.filepath=str(OUT/f'central-table-{i:02}.png');bpy.ops.render.render(write_still=True)
