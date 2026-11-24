"""Polish the ceiling study only, preserving shelves, glazing and source.

blender --background docs/assets/bridge-ceiling-study/bridge-ceiling-study.blend
  --python scripts/assets/polish-bridge-ceiling.py [-- --preview]
"""
import bpy
import bmesh
import hashlib
import json
import math
import sys
from array import array
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/assets/bridge-ceiling-study'
SOURCE=Path(bpy.data.filepath)
assert SOURCE.name=='bridge-ceiling-study.blend'
source_hash=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
scene=bpy.data.scenes['CRUZ DEL SUR / Bridge ceiling study']
bpy.context.window.scene=scene
bpy.context.view_layer.update()

def signature(obj):
    digest=hashlib.sha256()
    digest.update(str((tuple(v for row in obj.matrix_world for v in row),obj.hide_render,
                       obj.hide_viewport,obj.parent.name if obj.parent else None)).encode())
    if obj.type=='MESH':
        coords=array('f',[0])*(len(obj.data.vertices)*3)
        obj.data.vertices.foreach_get('co',coords)
        digest.update(coords.tobytes())
        loops=array('i',[0])*len(obj.data.loops)
        obj.data.loops.foreach_get('vertex_index',loops)
        digest.update(loops.tobytes())
        digest.update(str([m.name if m else None for m in obj.data.materials]).encode())
    if obj.type=='LIGHT':
        digest.update(str((obj.data.energy,tuple(obj.data.color))).encode())
    return digest.hexdigest()

protected={obj.name:signature(obj) for obj in scene.objects if not obj.name.startswith('CEILING / ')}
cols={}
for name in ('01 Stepped structural ribs','02 Fixture trim','03 Preview grazing lights - no export',
             '00 Earlier simple ribs - hidden'):
    col=bpy.data.collections.new('CEILING POLISH / '+name)
    scene.collection.children.link(col)
    cols[name]=col
archive=cols['00 Earlier simple ribs - hidden']
archive.hide_render=True
archive.hide_viewport=True
archived=[]
for obj in list(scene.objects):
    if obj.name.startswith(('CEILING / Angular rib','CEILING / Rib machined edge',
                            'CEILING / Wall termination','CEILING / Rib end captive plate')):
        for col in list(obj.users_collection):col.objects.unlink(obj)
        archive.objects.link(obj)
        archived.append(obj.name)

def material(name,color,metal,rough,grain=0,emission=0):
    mat=bpy.data.materials.new('CEILING POLISH / '+name)
    mat.use_nodes=True
    mat.diffuse_color=(*color,1)
    shader=next(node for node in mat.node_tree.nodes if node.type=='BSDF_PRINCIPLED')
    shader.inputs['Base Color'].default_value=(*color,1)
    shader.inputs['Metallic'].default_value=metal
    shader.inputs['Roughness'].default_value=rough
    shader.inputs['Emission Color'].default_value=(*color,1)
    shader.inputs['Emission Strength'].default_value=emission
    if grain:
        noise=mat.node_tree.nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value=85
        noise.inputs['Detail'].default_value=2
        remap=mat.node_tree.nodes.new('ShaderNodeMapRange')
        remap.inputs['To Min'].default_value=rough-grain
        remap.inputs['To Max'].default_value=rough+grain
        mat.node_tree.links.new(noise.outputs['Fac'],remap.inputs['Value'])
        mat.node_tree.links.new(remap.outputs['Result'],shader.inputs['Roughness'])
    return mat

structure=material('Satin charcoal titanium',(.048,.060,.072),.68,.37,.035)
panel=material('Warm grey recessed alloy',(.115,.122,.13),.45,.51,.055)
metal=material('Brushed edge alloy',(.19,.19,.175),.80,.30,.025)
seal=material('Matte recessed gasket',(.008,.012,.016),.05,.78)
vent=material('Ventilation graphite',(.030,.042,.050),.35,.54,.025)
warm=material('Warm encased diffuser',(1,.48,.18),.02,.45,emission=2.4)
cyan=material('Small cyan status guide',(.035,.60,.76),.02,.42,emission=1.9)

def assign(obj,mat):
    if obj.data.users>1:obj.data=obj.data.copy()
    obj.data.materials.clear()
    obj.data.materials.append(mat)

for obj in list(scene.objects):
    if obj.type!='MESH' or not obj.name.startswith('CEILING / ') or obj.name in archived:
        continue
    name=obj.name
    if any(part in name for part in ('Recessed cassette face',)):
        assign(obj,panel)
    elif 'Ventilation fin' in name:
        assign(obj,vent)
    elif any(part in name for part in ('frame','luminaire')) and 'cyan guide' not in name:
        assign(obj,structure)
    elif any(part in name for part in ('clamp','screw')):
        assign(obj,metal)
    elif 'warm diffuser' in name:
        assign(obj,warm)
    if 'Cyan service diffuser' in name:
        assign(obj,cyan)
        obj.scale.y*=.68
    elif 'Skylight frame cyan guide' in name:
        assign(obj,cyan)
        obj.data=obj.data.copy()
        mid=(min(v.co.x for v in obj.data.vertices)+max(v.co.x for v in obj.data.vertices))/2
        for vertex in obj.data.vertices:
            vertex.co.x=mid+(vertex.co.x-mid)*.70

new=[]
def finish(obj,name,mat,col,zone='opaque',bevel=.008):
    obj.name='CEILING POLISH / '+name
    for old in list(obj.users_collection):old.objects.unlink(obj)
    cols[col].objects.link(obj)
    obj.data.materials.append(mat)
    obj['ceiling_study_zone']=zone
    obj['exclude_runtime_export']=True
    if bevel:
        mod=obj.modifiers.new('Satin edge radius','BEVEL')
        mod.width,mod.segments=bevel,3
        obj.modifiers.new('Planar face normals','WEIGHTED_NORMAL')
    new.append(obj)
    return obj

def profile(name,polygon,y,depth,mat,col='01 Stepped structural ribs',bevel=.008):
    vertices=[(x,yy,z) for yy in (y-depth/2,y+depth/2) for x,z in polygon]
    n=len(polygon)
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(vertices,[],faces)
    mesh.update()
    bm=bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    obj=bpy.data.objects.new(name,mesh)
    cols[col].objects.link(obj)
    return finish(obj,name,mat,col,bevel=bevel)

def box(name,position,size,mat,zone='opaque',bevel=.004):
    bpy.ops.mesh.primitive_cube_add(size=1,location=position)
    obj=bpy.context.object
    obj.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(obj,name,mat,'02 Fixture trim',zone,bevel)

upper=[(-4.70,2.91),(-3.85,3.20),(-.72,3.20),(-.44,3.135),
       (.44,3.135),(.72,3.20),(3.85,3.20),(4.70,2.91)]
lower=[(x,z-.15) for x,z in upper]
for index,y in enumerate((-.26,1.20,2.60)):
    profile(f'Stepped transverse web {index}',upper+list(reversed(lower)),y,.18,structure,bevel=.012)
    for face in (-1,1):
        for edge_name,path in (('upper',upper),('lower',lower)):
            shape=[(x,z+.012) for x,z in path]+[(x,z-.012) for x,z in reversed(path)]
            profile(f'{edge_name} flange {index} {face}',shape,y+face*.105,.042,metal,bevel=.004)
    collar=[(-.42,3.01),(-.36,2.985),(.36,2.985),(.42,3.01),
            (.42,3.115),(.36,3.14),(-.36,3.14),(-.42,3.115)]
    profile(f'Central structural collar {index}',collar,y-.108,.026,metal,bevel=.006)
    inset=[(x*.86,3.0625+(z-3.0625)*.70) for x,z in collar]
    profile(f'Central collar recess {index}',inset,y-.125,.008,seal,bevel=.003)
    box(f'Collar warm position marker {index}',(0,y-.135,3.055),(.18,.004,.017),warm,bevel=.002)
    for side in (-1,1):
        joint=[(side*3.66,3.09),(side*3.73,3.04),(side*4.04,2.96),
               (side*4.06,3.08),(side*3.85,3.17),(side*3.70,3.17)]
        profile(f'Oblique shoulder joint {index} {side}',joint,y-.103,.026,structure,bevel=.009)
        end=[(side*4.62,2.74),(side*4.77,2.74),(side*4.78,2.94),
             (side*4.70,3.00),(side*4.62,2.96)]
        profile(f'Faceted wall saddle {index} {side}',end,y,.25,structure,bevel=.009)

def spine_floor(y):
    if y<=2.75:return 3.275
    if y<=6.15:return 3.275-(y-2.75)*.125/1.7
    return 3.025-(y-6.15)*.15/1.2

# Recessed black lips make the existing diffusers read as mounted fixtures.
# Their width stays inside the existing opaque 32 cm spine.
for index,(a,b) in enumerate(((-.14,1.06),(1.34,2.51),(2.85,4.34),
                             (4.56,6.04),(6.26,7.24),(7.46,8.40))):
    zone='opaque' if b<2.75 else 'spine'
    for side in (-1,1):
        start=Vector((side*.093,a+.08,spine_floor(a+.08)-.080))
        end=Vector((side*.093,b-.08,spine_floor(b-.08)-.080))
        obj=box(f'Diffuser recessed lip {index} {side}',(start+end)/2,
                (.028,(end-start).length,.021),seal,zone,bevel=.003)
        obj.rotation_euler.x=math.atan2(end.z-start.z,end.y-start.y)
    for y in (a+.065,b-.065):
        box(f'Luminaire bevelled end stop {index}',(0,y,spine_floor(y)-.079),
            (.27,.035,.025),metal,zone,bevel=.006)

for side in (-1,1):
    data=bpy.data.lights.new('CEILING POLISH / Warm grazing reflection','AREA')
    data.energy=18
    data.color=(1,.63,.34)
    data.shape='RECTANGLE'
    data.size=1.4
    data.size_y=.35
    obj=bpy.data.objects.new(data.name,data)
    cols['03 Preview grazing lights - no export'].objects.link(obj)
    obj.location=(side*3.25,.50,2.96)
    obj.rotation_euler=(Vector((side*1.50,.50,3.19))-obj.location).to_track_quat('-Z','Y').to_euler()
    obj['exclude_runtime_export']=True

bpy.context.view_layer.update()
for name,expected in protected.items():
    assert signature(scene.objects[name])==expected,f'Protected object changed: {name}'
geometry=[obj for obj in scene.objects if obj.type=='MESH' and obj.get('ceiling_study_zone')
          and obj.name not in archived]
headroom=float('inf')
rear=float('inf')
triangles=0
depsgraph=bpy.context.evaluated_depsgraph_get()
for obj in geometry:
    points=[obj.matrix_world@Vector(v) for v in obj.bound_box]
    extent=[[min(v[i] for v in points),max(v[i] for v in points)] for i in range(3)]
    assert extent[1][0]>-.40 and extent[2][0]>2.64,(obj.name,extent)
    zone=obj['ceiling_study_zone']
    if zone=='opaque':assert extent[1][1]<2.74 and max(abs(v) for v in extent[0])<4.81,(obj.name,extent)
    elif zone=='spine':assert max(abs(v) for v in extent[0])<=.151,(obj.name,extent)
    else:assert any(extent[1][0]>=y-.061 and extent[1][1]<=y+.061 for y in (4.45,6.15,7.35))
    headroom=min(headroom,extent[2][0])
    rear=min(rear,extent[1][0])
    evaluated=obj.evaluated_get(depsgraph)
    mesh=evaluated.to_mesh()
    mesh.calc_loop_triangles()
    triangles+=len(mesh.loop_triangles)
    evaluated.to_mesh_clear()
missing=[image.name for image in bpy.data.images if image.source=='FILE' and not image.packed_file
         and not Path(bpy.path.abspath(image.filepath)).is_file()]
assert not missing,missing
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash
scene.name='CRUZ DEL SUR / Bridge ceiling polished'
scene.camera=scene.objects['CEILING REVIEW / Forward overview']
scene.render.engine='CYCLES'
scene.cycles.samples=32
scene.cycles.use_denoising=True
scene.render.resolution_x=1280
scene.render.resolution_y=800
scene.render.resolution_percentage=100
scene['polished_ceiling_source_sha256']=source_hash
scene['ceiling_polish_scope']='Ceiling only; shelves, post-connector zone, windows and skylights unchanged'
destination=OUT/'bridge-ceiling-polished.blend'
pending_rename=False
try:
    bpy.ops.wm.save_as_mainfile(filepath=str(destination))
except RuntimeError:
    pending=destination.with_name(destination.name+'@')
    if destination.exists() or not pending.is_file():raise
    with pending.open('rb') as saved:
        header=saved.read(7)
        assert header==b'BLENDER' or header.startswith((b'\x28\xb5\x2f\xfd',b'\x1f\x8b'))
    try:
        pending.replace(destination)
    except PermissionError:
        # Some Windows builds keep the compression stream locked until Blender
        # exits. The caller must rename this complete file and verify reopening.
        pending_rename=True
        print('PENDING_NATIVE_RENAME',str(pending),flush=True)
report={'source':SOURCE.name,'sourceSha256':source_hash,'sourceUnchanged':True,
        'revision':destination.name,'protectedObjectsUnchanged':len(protected),
        'protectedZoneBlenderYMaximum':-1.0,'newGeometryMinimumY':rear,'minimumHeadroom':headroom,
        'earlierRibObjectsArchived':len(archived),'activeCeilingMeshes':len(geometry),
        'evaluatedCeilingTriangles':triangles,'allGlassAndSkylightsUnchanged':True,
        'frontDetailsWithinExistingOpaqueFrameFootprints':True,'missingImages':missing,
        'additionalPreviewLights':2,'runtimeExported':False,
        'pendingFinalRename':pending_rename,
        'cameras':['CEILING REVIEW / Forward overview','CEILING REVIEW / Ceiling detail']}
(OUT/'polished-validation.json').write_text(json.dumps(report,indent=2))
print('CEILING_POLISHED',json.dumps(report),flush=True)
if '--preview' in sys.argv:
    for number,name in ((1,'CEILING REVIEW / Forward overview'),(3,'CEILING REVIEW / Ceiling detail')):
        scene.camera=scene.objects[name]
        scene.render.filepath=str(OUT/f'ceiling-polished-{number:02}.png')
        bpy.ops.render.render(write_still=True)
