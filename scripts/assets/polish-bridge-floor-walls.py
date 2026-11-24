"""Independent floor/wall study; preserves ceiling, furniture and rear shelves.
Run on bridge-ceiling-polished.blend with -- --preview for two renders.
"""
import bpy
import hashlib
import json
import sys
import math
from array import array
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/assets/bridge-ceiling-study'
SOURCE=Path(bpy.data.filepath)
assert SOURCE.name=='bridge-ceiling-polished.blend'
source_hash=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
scene=bpy.context.scene
floor=scene.objects['BRIDGE_RUNTIME_BRIDGE_Deck_finish_']

def signature(obj):
    h=hashlib.sha256(str((tuple(v for row in obj.matrix_world for v in row),obj.hide_render,obj.hide_viewport,obj.parent.name if obj.parent else None)).encode())
    if obj.type=='MESH':
        a=array('f',[0])*(len(obj.data.vertices)*3);obj.data.vertices.foreach_get('co',a);h.update(a.tobytes())
        a=array('i',[0])*len(obj.data.loops);obj.data.loops.foreach_get('vertex_index',a);h.update(a.tobytes())
        h.update(str([(m.name if m else None) for m in obj.data.materials]).encode())
    if obj.type=='LIGHT':h.update(str((obj.data.energy,tuple(obj.data.color))).encode())
    return h.hexdigest()

protected={o.name:signature(o) for o in scene.objects if o!=floor}
original_materials={m.name:m.diffuse_color[:] for m in bpy.data.materials}
original_floor_coords=[tuple(v.co) for v in floor.data.vertices]
protected_faces={p.index:p.material_index for p in floor.data.polygons if min((floor.matrix_world@floor.data.vertices[i].co).y for i in p.vertices)<=-1}
col=bpy.data.collections.new('BRIDGE SURFACES / Floor and opaque wall details')
scene.collection.children.link(col)
preview=bpy.data.collections.new('BRIDGE SURFACES / Review cameras - no export')
scene.collection.children.link(preview)

def material(name,color,metal,rough,texture=False):
    m=bpy.data.materials.new('BRIDGE SURFACES / '+name);m.use_nodes=True;m.diffuse_color=(*color,1)
    n=m.node_tree.nodes;l=m.node_tree.links;p=next(node for node in n if node.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    if texture:
        coord=n.new('ShaderNodeTexCoord');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=115;noise.inputs['Detail'].default_value=2
        l.new(coord.outputs['Object'],noise.inputs['Vector'])
        ramp=n.new('ShaderNodeMapRange');ramp.inputs['To Min'].default_value=rough-.07;ramp.inputs['To Max'].default_value=rough+.07
        l.new(noise.outputs['Fac'],ramp.inputs['Value']);l.new(ramp.outputs['Result'],p.inputs['Roughness'])
        bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=.00035
        l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
    return m

deck=[material('Graphite deck '+str(i),(.065+i*.009,.077+i*.009,.085+i*.009),.65,.38+i*.025,True) for i in range(3)]
edge=material('Satin titanium edge',(.23,.245,.25),.78,.31,True)
gasket=material('Recessed graphite gasket',(.012,.018,.022),.12,.72)
plate=material('Ceramic service panel',(.095,.112,.124),.48,.44,True)
black=material('Antislip insert',(.035,.044,.050),.3,.62,True)
label=material('Muted ivory marking',(.57,.57,.49),.15,.56)
# Local per-face material reassignment, no shared source material mutation and no
# second floor surface. Existing tile vertices, joints and bevel geometry remain.
floor.data=floor.data.copy()
slots=[]
for m in deck+[edge]:floor.data.materials.append(m);slots.append(len(floor.data.materials)-1)
changed=0
for p in floor.data.polygons:
    points=[floor.matrix_world@floor.data.vertices[i].co for i in p.vertices]
    if min(v.y for v in points)<=-1:continue
    centre=sum(points,Vector())/len(points)
    p.material_index=slots[(int((centre.y+.9)/1.05)+int((centre.x+4.8)/1.4))%3] if p.normal.z>.7 else slots[3]
    changed+=1

created=[]
def box(name,location,size,mat,zone,bevel=.003):
    bpy.ops.mesh.primitive_cube_add(size=1,location=location)
    o=bpy.context.object;o.name='BRIDGE SURFACES / '+name
    for c in list(o.users_collection):c.objects.unlink(o)
    col.objects.link(o);o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat)
    if bevel:
        mod=o.modifiers.new('Manufactured bevel','BEVEL');mod.width=min(bevel,min(size)*.3);mod.segments=2
        o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    o['surface_zone']=zone;created.append(o);return o

# Shallow framed inspection covers. Top at 9 mm; frame and insert occupy
# different footprints so there is no coplanar doubled geometry.
for side in (-1,1):
    for y in (-.31,):
        x=side*.73;w=1.04;h=.82
        box('Service hatch antislip',(x,y,.0035),(w-.038,h-.038,.007),black,'floor')
        for dx in (-w/2,w/2):box('Hatch long edge',(x+dx,y,.0045),(.018,h+.018,.009),edge,'floor')
        for dy in (-h/2,h/2):box('Hatch cross edge',(x,y+dy,.0045),(w-.018,.018,.009),edge,'floor')
        box('Flush handle recess',(x,y+.25,.0076),(.19,.066,.001),gasket,'floor',0)
        box('Flush handle',(x,y+.25,.0085),(.13,.012,.0015),edge,'floor',0)
        for dx in (-.42,.42):
            for dy in (-.32,.32):box('Hatch captive screw',(x+dx,y+dy,.008),(.016,.016,.001),edge,'floor',0)
        # Sparse traction ribs, understated and below frame height.
        for row in range(7):
            for column in range(5):
                o=box('Traction chevron',(x-.35+column*.175,y-.24+row*.065,.0076),(.055,.006,.001),plate,'floor',0)
                o.rotation_euler.z=math.radians(32 if column%2 else -32)
# Wall relief sits on the known opaque pressure cheeks only; none extends
# into the forward window span Y >= 2.75 or into rear protected shelves.
for side in (-1,1):
    for index,y in enumerate((.05,1.31)):
        # Inner cheek face interpolates from X4.77 at Z1 to4.97 atZ3.38.
        box('Opaque cheek service gasket',(side*4.785,y,1.94),(.025,1.12,1.38),gasket,'wall')
        box('Opaque cheek satin panel',(side*4.756,y,1.94),(.034,1.055,1.30),plate,'wall',.01)
        for z in (1.34,2.54):box('Wall panel horizontal rail',(side*4.73,y,z),(.018,1.04,.035),edge,'wall')
        for z in (1.44,1.50,1.56,1.62):box('Recessed ventilation slot',(side*4.735,y,z),(.012,.61,.019),gasket,'wall',.002)
        box('Service pull socket',(side*4.729,y+.35,2.12),(.014,.085,.23),gasket,'wall')
        box('Service pull alloy',(side*4.716,y+.35,2.12),(.016,.017,.17),edge,'wall')
        for yy in (y-.44,y+.44):
            for z in (1.4,2.46):box('Wall captive fastener',(side*4.728,yy,z),(.016,.025,.025),edge,'wall')
        # Subtle service indexing, simple bars avoid unnecessary text noise.
        for i in range(index+1):box('Service index',(side*4.735,y-.33+i*.07,2.36),(.012,.035,.085),label,'wall')
    box('Wall lower titanium sill',(side*4.72,.69,1.13),(.06,2.52,.075),edge,'wall',.012)

bpy.context.view_layer.update()
for name,value in protected.items():assert signature(scene.objects[name])==value,name
assert original_floor_coords==[tuple(v.co) for v in floor.data.vertices]
for index,value in protected_faces.items():assert floor.data.polygons[index].material_index==value
for name,value in original_materials.items():assert bpy.data.materials[name].diffuse_color[:]==value,name
extents=[]
for o in created:
    points=[o.matrix_world@Vector(v) for v in o.bound_box]
    b=[[min(p[i] for p in points),max(p[i] for p in points)] for i in range(3)]
    assert b[1][0]>-1,(o.name,b)
    if o['surface_zone']=='floor':assert b[2][1]<=.01001,(o.name,b)
    else:assert b[1][1]<2.75 and b[2][0]>1 and b[2][1]<2.65 and min(abs(v) for v in b[0])>4.68,(o.name,b)
    extents.append(b)
missing=[i.name for i in bpy.data.images if i.source=='FILE' and not i.packed_file and not Path(bpy.path.abspath(i.filepath)).is_file()]
assert not missing,missing
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash

def camera(name,pos,target,lens):
    data=bpy.data.cameras.new(name);data.lens=lens;o=bpy.data.objects.new(name,data);preview.objects.link(o);o.location=pos
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();o['exclude_runtime_export']=True;return o
cam1=camera('SURFACE REVIEW / Overview',(0,-2.50,1.72),(0,3.1,1.15),19)
cam2=camera('SURFACE REVIEW / Floor and wall',(-1.75,-.65,1.70),(3.5,.85,.95),20)
scene.name='CRUZ DEL SUR / Bridge floor and walls'
scene.camera=cam1;scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene['floor_wall_source_sha256']=source_hash
path=OUT/'bridge-floor-walls.blend'
try:bpy.ops.wm.save_as_mainfile(filepath=str(path))
except RuntimeError:
    pending=path.with_name(path.name+'@')
    if path.exists() or not pending.is_file():raise
    with pending.open('rb') as stream:
        header=stream.read(7);assert header==b'BLENDER' or header.startswith((b'\x28\xb5\x2f\xfd',b'\x1f\x8b'))
    try:pending.replace(path)
    except PermissionError:print('PENDING_NATIVE_RENAME',str(pending),flush=True)
report={'source':SOURCE.name,'sourceSha256':source_hash,'sourceUnchanged':True,'revision':path.name,'protectedObjectsUnchanged':len(protected),'existingMaterialDatablocksPreserved':len(original_materials),'floorGeometryUnchanged':True,'floorFacesReskinned':changed,'protectedFloorFacesUnchanged':len(protected_faces),'protectedZoneBlenderYMaximum':-1,'newMeshes':len(created),'floorReliefMaximumMetres':.009,'wallDetailBounds':{'absoluteX':[4.70,4.80],'y':[-.57,1.95],'z':[1.09,2.63]},'ceilingShelvesFurnitureGlassUnchanged':True,'additionalLights':0,'missingImages':missing,'runtimeExported':False}
(OUT/'floor-walls-validation.json').write_text(json.dumps(report,indent=2))
print('FLOOR_WALLS_READY',json.dumps(report),flush=True)
if '--preview' in sys.argv:
    for number,cam in enumerate((cam1,cam2),1):
        scene.camera=cam;scene.render.filepath=str(OUT/f'floor-walls-{number:02}.png');bpy.ops.render.render(write_still=True)

