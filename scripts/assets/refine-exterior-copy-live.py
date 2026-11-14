"""Detail the isolated working copy only, using checked local mesh topology."""
from pathlib import Path
import bpy, bmesh, json, hashlib
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parents[2]
folder=ROOT/'docs/assets/bridge'
output=folder/'crash-investigation/bridge-antennas-validated.blend'
assert Path(bpy.data.filepath).resolve()==output.resolve()
scene=bpy.context.scene
assert not bpy.data.collections.get('EXTERIOR / Roof finish')
protected=folder/'bridge-interior-final.blend'
original_hash=hashlib.sha256(protected.read_bytes()).hexdigest()
original={o:(o.matrix_world.copy(),dict(o.items())) for o in scene.objects}
collection=bpy.data.collections.new('EXTERIOR / Roof finish')
bpy.data.collections['EXTERIOR / Upper hull'].children.link(collection)
collection['source_only']=True
materials={m.name.removeprefix('BRIDGE V15 '):m for m in bpy.data.materials if m.name.startswith('BRIDGE V15 ')}
def box(name,center,size,material):
    # Blender coordinates; immutable topology local to the helper.
    topology=((0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6))
    vertices=[tuple(center[i]+sign[i]*size[i]/2 for i in range(3)) for sign in
              ((-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1))]
    assert all(0<=index<len(vertices) for face in topology for index in face)
    data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],topology)
    assert not data.validate()
    bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
    obj=bpy.data.objects.new(name,data);collection.objects.link(obj);data.materials.append(materials[material])
    bevel=obj.modifiers.new('Manufactured edges','BEVEL');bevel.width=min(.004,min(size)/4);bevel.segments=1
    return obj
# Existing service island ends at X=±1.25. Frame its sides with separated
# layered covers, rather than another large box across panoramic glazing.
for side in (-1,1):
    for i in range(4):
        y=-1.15+i*.53
        box('Roof side service frame',(side*1.258,y,3.535),(.018,.45,.14),'Gasket')
        box('Roof side armor insert',(side*1.274,y,3.535),(.014,.39,.10),'Metal')
        for dy in (-.14,.14):
            box('Roof side captive fastener',(side*1.286,y+dy,3.535),(.008,.018,.018),'Graphite')
    # A warm aft-facing marker, recessed between protective end caps.
    box('Roof aft marker housing',(side*.95,-1.612,3.53),(.29,.025,.075),'Graphite')
    box('Roof aft marker lens',(side*.95,-1.629,3.53),(.20,.008,.027),'Amber')
    # Small antenna equipment cabinet supported by the existing island.
    box('Roof receiver cabinet',(side*.27,-.55,3.76),(.24,.34,.20),'Graphite')
    box('Roof receiver lid',(side*.27,-.55,3.867),(.21,.31,.014),'Metal')
    for i in range(4):
        box('Roof receiver vent',(side*.395,-.65+i*.065,3.76),(.008,.028,.09),'Gasket')
    box('Roof receiver latch',(side*.27,-.72,3.79),(.055,.014,.04),'Metal')
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();tris=0
for obj,(matrix,meta) in original.items():assert obj.matrix_world==matrix and dict(obj.items())==meta
for obj in collection.objects:
    e=obj.evaluated_get(deps);m=e.to_mesh();m.calc_loop_triangles();tris+=len(m.loop_triangles)
    assert all((obj.matrix_world@v.co).z>3.42 for v in m.vertices)
    e.to_mesh_clear()
for v in json.loads((folder/'exterior-window-validation.json').read_text())['serviceViews']:
    eye=Vector(v['eye']);target=Vector(v['target']);hit=scene.ray_cast(deps,eye,(target-eye).normalized(),distance=5)
    assert hit[0] and hit[4].name.startswith('Exterior service')
assert sum(o.type=='LIGHT' for o in scene.objects)==4
assert tris<4000
old=bpy.context.preferences.filepaths.save_version
try:
    # Keep one rolling backup of this COPY, never touch the protected original.
    bpy.context.preferences.filepaths.save_version=1
    bpy.ops.wm.save_as_mainfile(filepath=str(output),compress=True)
finally:bpy.context.preferences.filepaths.save_version=old
assert hashlib.sha256(protected.read_bytes()).hexdigest()==original_hash
print('Copy-only roof finish:',len(collection.objects),'pieces,',tris,'triangles. Six window views pass; original hash unchanged.')
