"""Add restrained panoramic-frame fittings to the current standalone source."""
from pathlib import Path
from math import sin, cos, atan2
import bpy, bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
folder = ROOT/'docs/assets/bridge'
scene = bpy.context.scene
assert scene.name == 'Bridge - Finished Interior'
assert not any(o.name.startswith('Panoramic fixture ') for o in scene.objects)
bpy.data.libraries.write(str(folder/'bridge-interior-backup.blend'), {scene}, fake_user=True, compress=True)
collection = bpy.data.collections.new('BRIDGE / Panoramic fittings')
scene.collection.children.link(collection)
materials = {m.name.removeprefix('BRIDGE V15 '):m for m in bpy.data.materials if m.name.startswith('BRIDGE V15 ')}
base = (ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')], __file__, 'exec'))
original = {o:(o.matrix_world.copy(),dict(o.items())) for o in scene.objects}
frames = [o for o in scene.objects if o.name.startswith('Window armor')]
assert len(frames)==6
for index,frame in enumerate(frames):
    bounds = [frame.matrix_world@Vector(v) for v in frame.bound_box]
    center = sum(bounds,Vector())/8
    top = max(p.z for p in bounds)
    # Game-space inward normal, toward the middle of the bridge.
    nx,nz = -center.x, center.y-2.65
    length=(nx*nx+nz*nz)**.5
    nx,nz=nx/length,nz/length
    pose={'x':center.x+nx*.085,'z':-center.y+nz*.085,'yaw':atan2(nx,nz)}
    y=top-.43
    def part(name,at,size,mat,bevel=.004):
        return box('Panoramic fixture '+str(index)+' '+name,at,size,mat,bevel,pose)
    # Lens and retaining rails are separated surfaces, not coplanar overlays.
    part('mount',(0,y,0),(.115,.53,.035),'Graphite',.008)
    part('diffuser',(0,y,.027),(.044,.36,.012),'Amber',.006)
    for side in (-1,1):
        part('retaining rail',(side*.043,y,.025),(.018,.43,.024),'Metal',.004)
        part('end cap',(0,y+side*.229,.022),(.085,.048,.022),'Metal',.006)
        part('fixing',(0,y+side*.229,.037),(.019,.019,.008),'Gasket',.003)
    for height in (1.02,top-.09):
        part('frame collar',(0,height,-.008),(.15,.09,.035),'Graphite',.006)
        part('collar plate',(0,height,.015),(.11,.054,.014),'Metal',.004)

for obj in collection.objects:
    uv=obj.data.uv_layers.new(name='Surface metres')
    for poly in obj.data.polygons:
        axis=max(range(3),key=lambda i:abs(poly.normal[i]));axes=[i for i in range(3) if i!=axis]
        for li in poly.loop_indices:
            p=obj.data.vertices[obj.data.loops[li].vertex_index].co
            uv.data[li].uv=(p[axes[0]],p[axes[1]])
    assert not obj.get('interaction')
bpy.context.view_layer.update()
for obj,(matrix,metadata) in original.items():
    assert obj.matrix_world==matrix and dict(obj.items())==metadata
assert sum(o.type=='LIGHT' for o in scene.objects)==4
assert len(collection.objects)==72
previous=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/'bridge-interior-final.blend'),compress=True)
finally:
    bpy.context.preferences.filepaths.save_version=previous
print('Six framed warm luminaires and twelve collars; 72 fittings, existing materials only. Original transforms/metadata preserved; no runtime export or new lights.')
