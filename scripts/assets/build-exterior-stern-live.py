"""Blender-only stern shoulders and recessed engine assemblies."""
from pathlib import Path
from math import sin,cos
import bpy,bmesh,json
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];folder=ROOT/'docs/assets/bridge';scene=bpy.context.scene
assert scene.name=='Bridge - Finished Interior'
assert not bpy.data.collections.get('EXTERIOR / Stern and engines')
bpy.data.libraries.write(str(folder/'bridge-interior-backup.blend'),{scene},fake_user=True,compress=True)
original={o:(o.matrix_world.copy(),dict(o.items())) for o in scene.objects}
collection=bpy.data.collections.new('EXTERIOR / Stern and engines')
bpy.data.collections['EXTERIOR / Upper hull'].children.link(collection);collection['source_only']=True
materials={m.name.removeprefix('BRIDGE V15 '):m for m in bpy.data.materials if m.name.startswith('BRIDGE V15 ')}
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))
def hull(name,outline,bottom,top,material):
    n=len(outline)
    return mesh(name,[(x,y,z) for y in (bottom,top) for x,z in outline],[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],material,.012)
def nozzle(cx):
    # Eight-sided open annulus, with inner throat and recessed luminous core.
    outline=[(-.62,-.25),(-.49,-.39),(.49,-.39),(.62,-.25),(.62,.25),(.49,.39),(-.49,.39),(-.62,.25)]
    verts=[]
    for z,scale in ((6.72,.92),(7.28,1),(7.28,.76),(6.72,.68)):
        verts.extend((cx+x*scale,.37+y*scale,z) for x,y in outline)
    faces=[]
    for band in range(4):
        for i in range(8):
            j=(i+1)%8;nxt=(band+1)%4
            faces.append((band*8+i,band*8+j,nxt*8+j,nxt*8+i))
    mesh('Stern octagonal nozzle shroud',verts,faces,'Metal',.006)
    box('Stern recessed engine core',(cx,.37,6.76),(.78,.48,.035),'Gasket',.01)
    for x in (-.26,0,.26):
        box('Stern cyan core segment',(cx+x,.37,6.79),(.13,.32,.012),'Cyan',.006)
    for y in (.13,.61):
        box('Stern nozzle retaining rail',(cx,y,7.17),(.76,.035,.13),'Graphite',.005)
for side in (-1,1):
    # Leave the central passage and arrival module open; stern pods are lateral.
    outline=[(side*4.92,1.38),(side*5.93,1.38),(side*6.12,2.1),(side*6.12,6.45),(side*5.8,6.73),(side*4.63,6.73),(side*4.55,2.0)]
    hull('Stern lower armored shoulder',outline,-.28,.32,'Graphite')
    outline=[(side*4.94,1.45),(side*5.8,1.45),(side*5.99,2.15),(side*5.99,6.38),(side*5.78,6.60),(side*4.75,6.60),(side*4.69,2.05)]
    hull('Stern stepped upper shell',outline,.34,.88,'Metal')
    for i in range(4):
        z=2.25+i*1.03
        box('Stern armor cassette',(side*5.35,.906,z),(.98,.035,.88),'Graphite',.012)
        box('Stern cassette inset',(side*5.35,.931,z),(.79,.014,.60),'Metal',.006)
        for dx in (-.40,.40):
            box('Stern service latch',(side*5.35+dx,.95,z),(.045,.028,.14),'Gasket',.004)
    for i in range(7):
        box('Stern heat exchanger fin',(side*5.35,.973,5.70+i*.095),(.73,.06,.035),'Graphite',.003)
    box('Stern amber lens housing',(side*5.35,.97,2.05),(.62,.05,.12),'Gasket',.005)
    box('Stern amber lens',(side*5.35,1.002,2.05),(.48,.012,.065),'Amber',.003)
    nozzle(side*5.32)
# Structural underbody tie sits below the playable floor, not across the entry.
box('Stern underbody cross member',(0,-.46,6.0),(9.3,.24,.60),'Graphite',.015)
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
for obj,(matrix,meta) in original.items():assert obj.matrix_world==matrix and dict(obj.items())==meta
triangles=0
for o in collection.objects:
    e=o.evaluated_get(deps);data=e.to_mesh();data.calc_loop_triangles();triangles+=len(data.loop_triangles)
    for v in data.vertices:
        p=o.matrix_world@v.co
        assert abs(p.x)>4.4 or p.z<-.30,(o.name,tuple(p))
    e.to_mesh_clear()
assert triangles<12000
views=json.loads((folder/'exterior-window-validation.json').read_text())['serviceViews']
for v in views:
    eye=Vector(v['eye']);target=Vector(v['target']);hit=scene.ray_cast(deps,eye,(target-eye).normalized(),distance=5)
    assert hit[0] and hit[4].name.startswith('Exterior service')
assert sum(o.type=='LIGHT' for o in scene.objects)==4
old=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/'bridge-interior-final.blend'),compress=True)
finally:bpy.context.preferences.filepaths.save_version=old
print('Stern:',len(collection.objects),'pieces,',triangles,'triangles; passage clearance and six window views passed; no runtime export.')
