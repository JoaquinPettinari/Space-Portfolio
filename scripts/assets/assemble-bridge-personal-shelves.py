"""Assemble authored shelves into the latest preserved live cabin, without export.
The runtime replacement volumes are read directly from transitionLayout.ts.
"""
import bpy,bmesh,hashlib,json,re,sys
from pathlib import Path
from array import array
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/bridge-ceiling-study'
SOURCE=Path(bpy.data.filepath);assert SOURCE.name=='bridge-before-shelf-assembly-live.blend'
SHELVES=ROOT/'docs/assets/transition-master/transition-shelves-finished.blend'
hashes={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (SOURCE,SHELVES)}
scene=bpy.context.scene

def signature(o):
 h=hashlib.sha256(str((tuple(v for row in o.matrix_world for v in row),o.hide_render,o.hide_viewport,o.parent.name if o.parent else None)).encode())
 if o.type=='MESH':
  a=array('f',[0])*(len(o.data.vertices)*3);o.data.vertices.foreach_get('co',a);h.update(a.tobytes());a=array('i',[0])*len(o.data.loops);o.data.loops.foreach_get('vertex_index',a);h.update(a.tobytes())
  h.update(str([m.name if m else None for m in o.data.materials]).encode())
 if o.type=='LIGHT':h.update(str((o.data.energy,tuple(o.data.color))).encode())
 return h.hexdigest()
originals={o.name:signature(o) for o in scene.objects}
archive=bpy.data.collections.new('BRIDGE ASSEMBLY / Superseded transition - hidden');scene.collection.children.link(archive);archive.hide_render=True;archive.hide_viewport=True
root=bpy.data.collections.new('BRIDGE ASSEMBLY / Current personal shelves');scene.collection.children.link(root)
review=bpy.data.collections.new('BRIDGE ASSEMBLY / Review cameras - no export');scene.collection.children.link(review)
# Official runtime boxes (x, height, depth) converted to Blender (x,-depth,height).
text=(ROOT/'src/game/world/transitionLayout.ts').read_text()
entries=re.findall(r'\{ min: \[([^\]]+)\], max: \[([^\]]+)\] \}',text)
assert len(entries)==3
boxes=[]
for lo,hi in entries:
 a=[float(v) for v in lo.split(',')];b=[float(v) for v in hi.split(',')]
 boxes.append(([a[0],-b[2],a[1]],[b[0],-a[2],b[1]]))

def bounds(o):
 p=[o.matrix_world@Vector(v) for v in o.bound_box]
 return ([min(v[i] for v in p) for i in range(3)],[max(v[i] for v in p) for i in range(3)])
def intersect(a,b):return all(a[0][i]<b[1][i] and a[1][i]>b[0][i] for i in range(3))
def half(poly,axis,bound,positive):
 out=[]
 for i,a in enumerate(poly):
  b=poly[(i+1)%len(poly)];da=(a[axis]-bound)*(1 if positive else -1);db=(b[axis]-bound)*(1 if positive else -1)
  if da>=0:out.append(a)
  if (da>=0)!=(db>=0):
   t=da/(da-db);out.append([v+(b[j]-v)*t for j,v in enumerate(a)])
 return out
def subtract(poly,box):
 inside=poly;outside=[]
 for axis in range(3):
  if not inside:break
  lo=half(inside,axis,box[0][axis],False)
  if len(lo)>=3:outside.append(lo)
  inside=half(inside,axis,box[0][axis],True)
  hi=half(inside,axis,box[1][axis],True)
  if len(hi)>=3:outside.append(hi)
  inside=half(inside,axis,box[1][axis],False)
 return outside

archived_whole=[];clipped={}
for o in list(scene.objects):
 if o.name.startswith(('CDS NICHE /','CDS POLISH / Bridge pressure-spine designation')):
  # Runtime removes the previous procedural niches as a whole, separately
  # from the architectural clipping. Their replacement is now the authored set.
  for c in list(o.users_collection):c.objects.unlink(o)
  archive.objects.link(o);archived_whole.append(o.name)

candidates=[o for o in scene.objects if o.type=='MESH' and o.name not in archived_whole and not any(c.hide_render for c in o.users_collection) and o.name.startswith(('BRIDGE_RUNTIME_','V2_','CDS U /')) and any(intersect(bounds(o),b) for b in boxes)]
for o in candidates:
 source=o.data;source.calc_loop_triangles();uvs=list(source.uv_layers);positions=[o.matrix_world@v.co for v in source.vertices]
 verts=[];faces=[];normals=[];uv_output=[[] for u in uvs];mats=[];smooth=[];changed=False
 relevant=[b for b in boxes if intersect(bounds(o),b)]
 for tri in source.loop_triangles:
  polygon=[]
  for loop_index in tri.loops:
   vertex=source.vertices[source.loops[loop_index].vertex_index]
   normal=source.corner_normals[loop_index].vector
   polygon.append([*positions[vertex.index],*vertex.co,*normal,*[v for uv in uvs for v in uv.data[loop_index].uv]])
  polys=[polygon]
  for b in relevant:
   next_polys=[]
   for poly in polys:
    if any(all(v[a]<=b[0][a] for v in poly) or all(v[a]>=b[1][a] for v in poly) for a in range(3)):next_polys.append(poly)
    else:changed=True;next_polys.extend(subtract(poly,b))
   polys=next_polys
  for poly in polys:
   for j in range(1,len(poly)-1):
    triangle=[poly[0],poly[j],poly[j+1]]
    if (Vector(triangle[1][:3])-Vector(triangle[0][:3])).cross(Vector(triangle[2][:3])-Vector(triangle[0][:3])).length_squared<1e-16:continue
    start=len(verts)
    for v in triangle:
     verts.append(v[3:6]);normals.append(Vector(v[6:9]).normalized())
     for k in range(len(uvs)):uv_output[k].append(v[9+2*k:11+2*k])
    faces.append((start,start+1,start+2));mats.append(source.polygons[tri.polygon_index].material_index);smooth.append(source.polygons[tri.polygon_index].use_smooth)
 if not changed:continue
 copy=o.copy();copy.data=source.copy();copy.name='ARCHIVE / Before transition trim / '+o.name;archive.objects.link(copy)
 mesh=bpy.data.meshes.new(o.name+' / Transition clearance');mesh.from_pydata(verts,[],faces);mesh.update()
 for m in source.materials:mesh.materials.append(m)
 for p,mat,sm in zip(mesh.polygons,mats,smooth):p.material_index=mat;p.use_smooth=sm
 for old,values in zip(uvs,uv_output):
  layer=mesh.uv_layers.new(name=old.name)
  for data,uv in zip(layer.data,values):data.uv=uv
 if normals:mesh.normals_split_custom_set(normals)
 o.data=mesh;clipped[o.name]={'originalTriangles':len(source.loop_triangles),'retainedTriangles':len(faces)}

# Append source scene temporarily; import precisely the exportable editable objects.
with bpy.data.libraries.load(str(SHELVES),link=False) as (src,dst):
 names=[n for n in src.scenes if n.startswith('TRANSITION /')];assert len(names)==1,names;dst.scenes=names
source_scene=dst.scenes[0]
bpy.context.window.scene=source_scene;bpy.context.view_layer.update()
objects=[o for o in source_scene.objects if o.type in {'MESH','CURVE','FONT'} and not o.hide_render and not any(c.name.startswith(('90 ','98 ','99 ')) or c.get('runtime_export') is False for c in o.users_collection)]
assert len(objects)==1213,len(objects)
renderable_count=len(objects)
parents=set()
for child in objects:
 parent=child.parent
 while parent:
  parents.add(parent);parent=parent.parent
objects+=sorted(parents-set(objects),key=lambda o:o.name)
source_signatures={o.name:signature(o) for o in objects}
photo_uv={o.name:[tuple(v.uv) for v in o.data.uv_layers.active.data] for o in objects if o.name.startswith('PHOTO / Personal image')};assert len(photo_uv)==4,photo_uv.keys()
collections={};import_names=[]
for o in objects:
 groups=[c for c in o.users_collection if c.get('runtime_export') is True]
 assert groups,o.name
 name=groups[0].name
 if name not in collections:
  c=bpy.data.collections.new('CURRENT SHELVES / '+name);root.children.link(c);collections[name]=c
 collections[name].objects.link(o);import_names.append(o.name)
# Remove source scene context from the destination file, retaining only imported
# editable objects. Images/materials used by them remain intact and are packed.
excluded=[o for o in source_scene.objects if o not in objects]
bpy.context.window.scene=scene
bpy.data.scenes.remove(source_scene)
for o in excluded:
 if o.name not in originals:bpy.data.objects.remove(o,do_unlink=True)
bpy.context.window.scene=scene;bpy.context.view_layer.update()
for name,value in source_signatures.items():assert signature(scene.objects[name])==value,name
for name,uv in photo_uv.items():assert [tuple(v.uv) for v in scene.objects[name].data.uv_layers.active.data]==uv,name
for name,value in originals.items():
 if name not in clipped and name not in archived_whole:assert signature(scene.objects[name])==value,name
missing=[]
for i in bpy.data.images:
 if i.source=='FILE' and not i.packed_file:
  if not Path(bpy.path.abspath(i.filepath)).is_file():missing.append((i.name,i.filepath))
  else:i.pack()
assert not missing,missing
for p in (SOURCE,SHELVES):assert hashlib.sha256(p.read_bytes()).hexdigest()==hashes[str(p.relative_to(ROOT))]

# Two opposed review angles show both personal bays and their connection to the
# newly finished cabin. No source cameras/lights/context were imported.
def camera(name,pos,target,lens):
 d=bpy.data.cameras.new(name);d.lens=lens;o=bpy.data.objects.new(name,d);review.objects.link(o);o.location=pos;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
cam1=camera('ASSEMBLY REVIEW / Port shelves and cabin',(.85,-4.78,1.65),(-.35,.5,1.5),16)
cam2=camera('ASSEMBLY REVIEW / Photographs and plants',(-.30,-2.24,1.65),(.20,-4.90,1.52),16)
scene.name='CRUZ DEL SUR / Complete bridge review';scene.camera=cam1;scene.cycles.samples=32;scene.cycles.use_denoising=True
path=OUT/'bridge-complete-review.blend'
try:bpy.ops.wm.save_as_mainfile(filepath=str(path))
except RuntimeError:
 pending=path.with_name(path.name+'@')
 if path.exists() or not pending.is_file():raise
 with pending.open('rb') as stream:
  header=stream.read(7);assert header==b'BLENDER' or header.startswith((b'\x28\xb5\x2f\xfd',b'\x1f\x8b'))
 try:pending.replace(path)
 except PermissionError:print('PENDING_NATIVE_RENAME',str(pending),flush=True)
report={'sourcesSha256':hashes,'sourcesUnchanged':True,'revision':path.name,'coordinateTransform':'Identity; Blender Z-up world coordinates','importedEditableObjects':renderable_count,'retainedHierarchyObjects':len(objects)-renderable_count,'importedCollections':{name:len(c.objects) for name,c in collections.items()},'importedObjectsSignaturesUnchanged':True,'fourPhotographsUvUnchanged':list(photo_uv),'archivedOldNicheObjects':archived_whole,'clippedArchitecturalObjects':clipped,'clearancesBlender':boxes,'otherOriginalObjectsUnchanged':len(originals)-len(clipped)-len(archived_whole),'sourceLightsCamerasContextImported':False,'missingImages':missing,'runtimeExported':False}
(OUT/'complete-review-validation.json').write_text(json.dumps(report,indent=2));(OUT/'complete-review-imported-objects.json').write_text(json.dumps(import_names,indent=2))
print('ASSEMBLY_READY',json.dumps({k:v for k,v in report.items() if k not in ('archivedOldNicheObjects','clippedArchitecturalObjects')}),flush=True)
if '--preview' in sys.argv:
 for i,c in enumerate((cam1,cam2),1):scene.camera=c;scene.render.filepath=str(OUT/f'complete-review-{i:02}.png');bpy.ops.render.render(write_still=True)



