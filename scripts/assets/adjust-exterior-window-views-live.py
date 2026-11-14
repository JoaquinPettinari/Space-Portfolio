"""Raise exterior service fittings above window sills, source only."""
from pathlib import Path
from math import sin,cos,pi
import bpy,bmesh,json
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];folder=ROOT/'docs/assets/bridge'
scene=bpy.context.scene
assert scene.name=='Bridge - Finished Interior'
assert not bpy.data.collections.get('EXTERIOR / Service fairings')
bpy.data.libraries.write(str(folder/'bridge-interior-backup.blend'),{scene},fake_user=True,compress=True)
moving=[o for o in bpy.data.collections['EXTERIOR / Service fittings'].objects if o.name.startswith('Exterior service ')]
original={o:(o.matrix_world.copy(),dict(o.items())) for o in scene.objects if o not in moving}
for o in moving:o.location.z+=.35
collection=bpy.data.collections.new('EXTERIOR / Service fairings')
bpy.data.collections['EXTERIOR / Upper hull'].children.link(collection)
collection['source_only']=True
materials={m.name.removeprefix('BRIDGE V15 '):m for m in bpy.data.materials if m.name.startswith('BRIDGE V15 ')}
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))
for side in (-1,1):
    yaw=side*3*pi/4
    local=[(-.37,.58,-.07),(.52,.58,-.07),(.52,.58,.13),(-.37,.58,.13),
           (-.35,.946,-.065),(.51,.946,-.065),(.51,.946,.125),(-.35,.946,.125)]
    vertices=[(side*3.22+x*cos(yaw)+z*sin(yaw),y,-7.4-x*sin(yaw)+z*cos(yaw)) for x,y,z in local]
    mesh('Exterior raised service fairing',vertices,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'Graphite',.006)
    pose={'x':side*3.22,'z':-7.4,'yaw':yaw}
    box('Exterior fairing metal face',(.07,.79,-.074),(.70,.23,.012),'Metal',.005,pose)
    for y in (.72,.78,.84):
        box('Exterior fairing vent',(.07,y,-.083),(.50,.018,.009),'Gasket',.002,pose)
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
views=[]
for side in (-1,1):
    target=Vector((side*(3.22+.03*.7071),7.4+.03*.7071,.994))
    for xy in ((3.8,5.8),(3.6,6),(2.4,7.2)):
        eye=Vector((side*xy[0],xy[1],1.7))
        hit=scene.ray_cast(deps,eye,(target-eye).normalized(),distance=5)
        assert hit[0] and hit[4].name.startswith('Exterior service'),(side,xy,hit[4].name if hit[0] else None)
        views.append({'eye':list(eye),'target':list(target),'hit':hit[4].name})
for o,(matrix,metadata) in original.items():
    assert o.matrix_world==matrix and dict(o.items())==metadata
verts=[];polys=[]
for o in bpy.data.collections['EXTERIOR / Upper hull'].all_objects:
    e=o.evaluated_get(deps);data=e.to_mesh();offset=len(verts)
    verts.extend(o.matrix_world@v.co for v in data.vertices)
    polys.extend([offset+i for i in f.vertices] for f in data.polygons);e.to_mesh_clear()
tree=BVHTree.FromPolygons(verts,polys)
for eye in [Vector((0,7.5,1.7)),Vector((-2,6,1.7)),Vector((2,6,1.7))]:
    for d in [Vector((0,1,0)),Vector((-.5,1,0)).normalized(),Vector((.5,1,0)).normalized()]:
        assert tree.ray_cast(eye,d,20)[0] is None
(folder/'exterior-window-validation.json').write_text(json.dumps({'serviceViews':views,'horizonRaysClear':9,'limits':'Geometric ray checks, not rendered visual review or runtime performance.'},indent=2)+'\n')
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        eye=Vector(views[4]['eye']);target=Vector(views[4]['target']);r=area.spaces.active.region_3d
        r.view_rotation=(target-eye).to_track_quat('-Z','Y');r.view_distance=(target-eye).length;r.view_location=target;r.view_perspective='PERSP'
old=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/'bridge-interior-final.blend'),compress=True)
finally:bpy.context.preferences.filepaths.save_version=old
print('Raised',len(moving),'service fittings by 0.35 m; six direct views and nine horizon rays passed. No runtime export.')
