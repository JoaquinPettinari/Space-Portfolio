"""Source-only service bays; existing interior and runtime are untouched."""
from pathlib import Path
from math import sin, cos, pi
import bpy, bmesh
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
folder=ROOT/'docs/assets/bridge';scene=bpy.context.scene
assert scene.name=='Bridge - Finished Interior'
assert not bpy.data.collections.get('EXTERIOR / Service fittings')
bpy.data.libraries.write(str(folder/'bridge-interior-backup.blend'),{scene},fake_user=True,compress=True)
original={o:(o.matrix_world.copy(),dict(o.items())) for o in scene.objects}
collection=bpy.data.collections.new('EXTERIOR / Service fittings')
bpy.data.collections['EXTERIOR / Upper hull'].children.link(collection)
collection['source_only']=True
materials={m.name.removeprefix('BRIDGE V15 '):m for m in bpy.data.materials if m.name.startswith('BRIDGE V15 ')}
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))

# Follow diagonal window walls with a thin, framed service bay. Local positive Z
# is outward, away from the cabin. These fittings sit on the shoulder undertray.
for side in (-1,1):
    pose={'x':side*3.22,'z':-7.4,'yaw':side*3*pi/4}
    def part(name,at,size,material,bevel=.003):
        return box('Exterior service '+name,at,size,material,bevel,pose)
    part('gasket',(0,.605,.03),(.67,.018,.18),'Gasket')
    part('backing',(0,.622,.03),(.61,.014,.14),'Graphite')
    for x in (-.32,.32):
        part('end bracket',(x,.637,.03),(.025,.045,.19),'Metal')
        part('bracket fastener',(x,.664,.03),(.014,.008,.018),'Gasket',.001)
    for z in (-.056,.116):
        part('frame rail',(0,.644,z),(.62,.04,.018),'Metal')
    for i in range(9):
        part('cooling blade',(-.25+i*.0625,.644,.03),(.02,.03,.105),'Metal',.002)
    # Amber marker is a material lens, not an additional real-time light.
    part('marker socket',(.44,.621,.03),(.12,.06,.15),'Graphite')
    part('marker lens',(.44,.656,.03),(.075,.012,.085),'Amber',.002)

# A shallow circular inspection cover at the bow tip adds a distinct silhouette.
def ring(name,x,z,radius,inner,y,depth,material):
    count=16;vertices=[]
    for h in (y-depth,y):
        for r in (radius,inner):
            vertices.extend((x+r*cos(2*pi*k/count),h,z+r*sin(2*pi*k/count)) for k in range(count))
    faces=[]
    for k in range(count):
        j=(k+1)%count
        faces.extend([(k,j,j+32,k+32),(k+16,k+48,j+48,j+16),
                      (k+32,j+32,j+48,k+48),(k,k+16,j+16,j)])
    return mesh(name,vertices,faces,material,.002)
z=-11.02;y=.8+(z+8.55)*(.25/2.8)
ring('Exterior inspection collar',0,z,.145,.104,y+.061,.025,'Metal')
box('Exterior inspection dark center',(0,y+.037,z),(.20,.018,.20),'Gasket',.015)
box('Exterior inspection latch',(0,y+.066,z),(.11,.018,.026),'Metal',.003)
for side in (-1,1):
    # Raised hinge barrels on existing hatch lids, parallel to their rear edge.
    z=-10.5;y=.8+(z+8.55)*(.25/2.8)
    for dx in (-.075,.075):
        box('Exterior hatch hinge',(side*.52+dx,y+.133,z+.115),(.065,.025,.03),'Graphite',.006)
    for dx in (-.09,.09):
        box('Exterior hatch captive screw',(side*.52+dx,y+.127,z-.09),(.018,.009,.018),'Gasket',.002)

bpy.context.view_layer.update()
for obj,(matrix,metadata) in original.items():
    assert obj.matrix_world==matrix and dict(obj.items())==metadata
deps=bpy.context.evaluated_depsgraph_get();triangles=0
for obj in collection.objects:
    evaluated=obj.evaluated_get(deps);data=evaluated.to_mesh();data.calc_loop_triangles()
    triangles+=len(data.loop_triangles)
    assert all((obj.matrix_world@v.co).z<.8 for v in data.vertices)
    evaluated.to_mesh_clear()
assert triangles<6000
old=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/'bridge-interior-final.blend'),compress=True)
finally:bpy.context.preferences.filepaths.save_version=old
print('Service pass:',len(collection.objects),'objects,',triangles,'triangles; existing geometry unchanged.')
