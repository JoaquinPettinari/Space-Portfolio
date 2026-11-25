"""Sculpt recessed ceiling bays and rebalance preview lighting, preserving source."""
import bpy
import hashlib
import json
from array import array
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/assets/bridge-ceiling-study'
source=Path(bpy.data.filepath)
assert source.name=='bridge-ceiling-complete.blend'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
scene=bpy.context.scene

def signature(o):
 h=hashlib.sha256(str((tuple(v for row in o.matrix_world for v in row),o.hide_render)).encode())
 if o.type=='MESH':
  a=array('f',[0])*(len(o.data.vertices)*3);o.data.vertices.foreach_get('co',a);h.update(a.tobytes())
  h.update(str([m.name if m else None for m in o.data.materials]).encode())
  if o.data.uv_layers.active:
   a=array('f',[0])*(len(o.data.loops)*2);o.data.uv_layers.active.data.foreach_get('uv',a);h.update(a.tobytes())
 return h.hexdigest()

originals={o.name:signature(o) for o in scene.objects}
col=bpy.data.collections.new('SCULPTED CEILING / Folded structure and trays');scene.collection.children.link(col)
archive=bpy.data.collections.new('SCULPTED CEILING / Earlier flat panels - hidden');scene.collection.children.link(archive)
archive.hide_render=True;archive.hide_viewport=True
archived=[]
for o in list(scene.objects):
 if o.name.startswith(('CEILING BOW / Recessed ceiling cartridge','CEILING BOW / Transverse rib','CEILING BOW / Rib machined flange','CEILING BOW / Recessed cyan socket','CEILING BOW / Cyan rib marker')):
  for c in list(o.users_collection):c.objects.unlink(o)
  archive.objects.link(o);archived.append(o.name)
mat={key:bpy.data.materials['CEILING POLISH / '+name] for key,name in {
 'shell':'Satin charcoal titanium','panel':'Warm grey recessed alloy','edge':'Brushed edge alloy',
 'seal':'Matte recessed gasket','warm':'Warm encased diffuser','cyan':'Small cyan status guide',
}.items()}
created=[]
def mesh(name,vertices,faces,material,bevel=.006):
 d=bpy.data.meshes.new(name);d.from_pydata(vertices,[],faces);d.update()
 o=bpy.data.objects.new('SCULPTED CEILING / '+name,d);col.objects.link(o);d.materials.append(mat[material])
 if bevel:
  m=o.modifiers.new('Rolled alloy corners','BEVEL');m.width=bevel;m.segments=3
  o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 created.append(o);return o
def beam(name,a,b,width,height,material):
 a,b=Vector(a),Vector(b);direction=(b-a).normalized()
 side=direction.cross(Vector((0,0,1))).normalized();up=side.cross(direction).normalized()
 vertices=[tuple(p+side*s*width/2+up*t*height/2) for p in (a,b) for s,t in ((-1,-1),(1,-1),(1,1),(-1,1))]
 return mesh(name,vertices,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],material,.004)
def roof(y):return 3.30-(y-2.75)*.25/3.4 if y<=6.15 else 3.05-(y-6.15)*.30/2.4
def width(y):return 4.8-(y-2.75)*.5/3.4 if y<=6.15 else 4.3-(y-6.15)

# Three offset rings create an actual 13 cm recessed tray, not a flat dark decal.
for row,(a,b) in enumerate(((2.85,4.33),(4.57,6.03),(6.27,7.23),(7.47,8.43))):
 for side in (-1,1):
  for index,(lo,hi) in enumerate(((.075,.47),(.54,.93))):
   lo,hi=sorted((side*lo,side*hi))
   rings=[]
   for inset,depth in ((0,-.20),(.045,-.20),(.095,-.075)):
    rings.append([(lo*width(a)+inset,a+inset,roof(a+inset)+depth),
                  (hi*width(a)-inset,a+inset,roof(a+inset)+depth),
                  (hi*width(b)-inset,b-inset,roof(b-inset)+depth),
                  (lo*width(b)+inset,b-inset,roof(b-inset)+depth)])
   vertices=[p for ring in rings for p in ring]
   faces=[(level*4+i,level*4+(i+1)%4,(level+1)*4+(i+1)%4,(level+1)*4+i) for level in (0,1) for i in range(4)]
   tray=mesh(f'Folded recessed tray {row} {side} {index}',vertices,faces,'shell')
   solid=tray.modifiers.new('Tray sheet thickness','SOLIDIFY');solid.thickness=.018
   inner=rings[-1]
   mesh(f'Recessed ceramic insert {row} {side} {index}',inner,[(3,2,1,0)],'panel',0).modifiers.new('Insert thickness','SOLIDIFY').thickness=.025
   if index==1:
    # Louvered service cartridge, oriented along the local roof slope.
    for i in range(6):
     y=a+.25+i*(b-a-.5)/5
     x=(lo+hi)*width(y)/2
     beam(f'Vent louver {row} {side} {i}',(x-.22,y,roof(y)-.10),(x+.22,y,roof(y)-.10),.025,.025,'seal')

for row,y in enumerate((4.45,6.15,7.35)):
 w=width(y)*.97;z=roof(y)
 lower=[(-w,z-.40),(-w*.80,z-.32),(-w*.66,z-.19),(-.46,z-.19),(-.30,z-.28),(.30,z-.28),(.46,z-.19),(w*.66,z-.19),(w*.80,z-.32),(w,z-.40)]
 profile=lower+[(w,z-.055),(-w,z-.055)]
 count=len(profile)
 verts=[(x,y+offset,h) for offset in (-.10,.10) for x,h in profile]
 faces=[tuple(reversed(range(count))),tuple(range(count,count*2))]+[(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)]
 mesh(f'Angular structural web {row}',verts,faces,'shell',.012)
 for index,(a,b) in enumerate(zip(lower,lower[1:])):
  beam(f'Folded lower flange {row} {index}',(a[0],y-.115,a[1]),(b[0],y-.115,b[1]),.035,.035,'edge')
 for side in (-1,1):
  x=side*w*.78
  beam(f'Cyan joint housing {row} {side}',(x-.18,y-.115,z-.245),(x+.18,y-.115,z-.245),.06,.035,'seal')
  beam(f'Cyan joint lens {row} {side}',(x-.14,y-.145,z-.245),(x+.14,y-.145,z-.245),.018,.018,'cyan')

# Review lighting: smaller sources close to visible fittings reveal relief.
lighting=bpy.data.collections.new('SCULPTED CEILING / Preview lighting - no export');scene.collection.children.link(lighting)
changed_lights={}
for name,power in [('UNIFIED / Warm interior fill -4',85),('UNIFIED / Warm interior fill 0',80)]:
 o=bpy.data.objects[name];changed_lights[name]={'before':o.data.energy,'after':power}
 o.data=o.data.copy();o.data.energy=power
def area(name,pos,target,power,color,size,length):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='RECTANGLE';d.size=size;d.size_y=length
 o=bpy.data.objects.new(name,d);lighting.objects.link(o);o.location=pos
 o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();o['exclude_runtime_export']=True
for row,y in enumerate((3.5,5.25,6.72)):
 for side in (-1,1):
  x=side*width(y)*.78
  area(f'Warm ceiling grazing {row} {side}',(x,y,roof(y)-.32),(side*.8,y,roof(y)-.07),24,(1,.64,.36),.65,.16)
  area(f'Fixture soft downlight {row} {side}',(side*width(y)*.5,y,roof(y)-.16),(side*1.4,y,.2),28,(1,.78,.57),.20,.72)
area('Cool window reflected fill',(0,7.7,2.20),(0,2.8,1.3),45,(.30,.42,1),3.0,1.2)
bpy.context.view_layer.update()
for name,value in originals.items():assert signature(scene.objects[name])==value,name
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
scene.camera=bpy.data.objects['CEILING BOW REVIEW / Whole ceiling']
scene.name='CRUZ DEL SUR / Sculpted ceiling and practical lighting'
destination=OUT/'bridge-ceiling-sculpted.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(destination))
(OUT/'ceiling-sculpted-validation.json').write_text(json.dumps({
 'source':source.name,'sourceSha256':digest,'sourceUnchanged':True,
 'originalObjectSignaturesPreserved':len(originals),'archivedMeshes':archived,
 'newMeshes':len(created),'previewLights':len(lighting.objects),'rebalancedLights':changed_lights,
 'runtimeExported':False,'minimumWebUnderside':min(roof(y)-.40 for y in (4.45,6.15,7.35)),
},indent=2))
print('SCULPTED_CEILING_READY',destination)
