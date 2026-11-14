"""Reference-driven stepped outer hull, Blender source only."""
from pathlib import Path
from math import sin,cos
import bpy,bmesh,json
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];folder=ROOT/'docs/assets/bridge'
scene=bpy.context.scene
assert scene.name=='Bridge - Finished Interior'
assert not bpy.data.collections.get('EXTERIOR / Stepped silhouette')
bpy.data.libraries.write(str(folder/'bridge-interior-backup.blend'),{scene},fake_user=True,compress=True)
original={o:(o.matrix_world.copy(),dict(o.items())) for o in scene.objects}
collection=bpy.data.collections.new('EXTERIOR / Stepped silhouette')
bpy.data.collections['EXTERIOR / Upper hull'].children.link(collection)
collection['source_only']=True
materials={m.name.removeprefix('BRIDGE V15 '):m for m in bpy.data.materials if m.name.startswith('BRIDGE V15 ')}
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))
def hull(name,outline,bottom,top,mat):
    n=len(outline)
    return mesh(name,[(x,y,z) for y in (bottom,top) for x,z in outline],
        [tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],mat,.012)
# Longer low prow connects to the existing short deck, with stepped armored
# belts instead of raising the horizon. Reference proportions guide this study;
# it is not yet a complete exterior spacecraft model.
hull('Outer prow lower belt',[(-.8,-11.35),(.8,-11.35),(1.25,-12.2),(.72,-15.6),(-.72,-15.6),(-1.25,-12.2)],-.22,.25,'Graphite')
hull('Outer prow upper armor',[(-.8,-11.35),(.8,-11.35),(1.16,-12.2),(.66,-15.32),(-.66,-15.32),(-1.16,-12.2)],.26,.47,'Metal')
for row in range(5):
    back=-11.5-row*.70;fore=back-.63
    w=.69 if row==0 else 1.02-(row-1)*.10
    hull('Outer prow inset plate',[(-w,back),(w,back),(w-.07,fore),(-w+.07,fore)],.475,.492,'Graphite')
    for side in (-1,1):
        box('Outer prow edge fitting',(side*(w-.09),.51,(back+fore)/2),(.055,.028,.34),'Metal',.004)
for side in (-1,1):
    # Long side shoulders sit beyond the existing lateral glazing footprint.
    outline=[(side*4.92,1.6),(side*5.95,1.25),(side*6.35,-3.9),(side*5.0,-6.1),(side*4.92,-5.7)]
    hull('Outer lateral lower belt',outline,-.28,.27,'Graphite')
    outline=[(side*4.92,1.45),(side*5.80,1.1),(side*6.17,-3.8),(side*5.02,-5.85),(side*4.92,-5.65)]
    hull('Outer lateral upper belt',outline,.29,.57,'Metal')
    for i in range(5):
        z=.65-i*1.10
        box('Outer lateral dark panel',(side*5.35,.59,z),(.68,.025,.91),'Graphite',.01)
        box('Outer lateral service strip',(side*5.35,.613,z),(.50,.018,.045),'Metal',.003)
        if i%2==0:
            box('Outer lateral lamp housing',(side*5.35,.64,z-.29),(.43,.05,.09),'Gasket',.004)
            box('Outer lateral amber lens',(side*5.35,.671,z-.29),(.31,.012,.045),'Amber',.002)
    # Restrained cyan accents across the forward prow, away from cabin screens.
    box('Outer prow cyan socket',(side*.52,.518,-14.05),(.24,.04,.48),'Gasket',.007)
    box('Outer prow cyan strip',(side*.52,.545,-14.05),(.065,.012,.38),'Cyan',.002)
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
for o,(matrix,meta) in original.items():assert o.matrix_world==matrix and dict(o.items())==meta
verts=[];faces=[];triangles=0
for o in bpy.data.collections['EXTERIOR / Upper hull'].all_objects:
    e=o.evaluated_get(deps);m=e.to_mesh();offset=len(verts)
    verts.extend(o.matrix_world@v.co for v in m.vertices)
    faces.extend([offset+i for i in f.vertices] for f in m.polygons)
    if o in collection.objects.values():m.calc_loop_triangles();triangles+=len(m.loop_triangles)
    e.to_mesh_clear()
tree=BVHTree.FromPolygons(verts,faces)
for eye in [Vector((0,7.5,1.7)),Vector((-2,6,1.7)),Vector((2,6,1.7))]:
    for d in [Vector((0,1,0)),Vector((-.5,1,0)).normalized(),Vector((.5,1,0)).normalized()]:
        assert tree.ray_cast(eye,d,30)[0] is None
# Recheck the previously verified near-window service views.
views=json.loads((folder/'exterior-window-validation.json').read_text())['serviceViews']
for view in views:
    eye=Vector(view['eye']);target=Vector(view['target'])
    hit=scene.ray_cast(deps,eye,(target-eye).normalized(),distance=5)
    assert hit[0] and hit[4].name.startswith('Exterior service')
assert sum(o.type=='LIGHT' for o in scene.objects)==4
assert triangles<10000
old=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/'bridge-interior-final.blend'),compress=True)
finally:bpy.context.preferences.filepaths.save_version=old
print('Stepped hull:',len(collection.objects),'pieces,',triangles,'triangles. Six service views and nine horizon rays clear. No runtime export.')
