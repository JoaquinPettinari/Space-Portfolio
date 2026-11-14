"""Blender-only upper hull shoulders and service detail. No runtime export."""
from pathlib import Path
from math import sin, cos, hypot
import bpy, bmesh
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
folder=ROOT/'docs/assets/bridge'
scene=bpy.context.scene
assert scene.name=='Bridge - Finished Interior'
assert not bpy.data.collections.get('EXTERIOR / Shoulder plating')
bpy.data.libraries.write(str(folder/'bridge-interior-backup.blend'),{scene},fake_user=True,compress=True)
original={o:(o.matrix_world.copy(),dict(o.items())) for o in scene.objects}
collection=bpy.data.collections.new('EXTERIOR / Shoulder plating')
bpy.data.collections['EXTERIOR / Upper hull'].children.link(collection)
collection['source_only']=True
materials={m.name.removeprefix('BRIDGE V15 '):m for m in bpy.data.materials if m.name.startswith('BRIDGE V15 ')}
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))

def slab(name,points,top,depth,material):
    n=len(points)
    return mesh(name,[(x,y,z) for y in (top-depth,top) for x,z in points],
        [tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],material,.005)

# Outward skirts wrap the two diagonal window walls. Inner edge remains beyond
# the glazing plane, below its sill; clear horizon above 0.8 m is preserved.
for side in (-1,1):
    points=[(side*4.3,-6.15),(side*1.9,-8.55),(side*2.1,-8.68),(side*4.82,-6.45)]
    slab('Exterior shoulder undertray',points,.55,.22,'Graphite')
    a=Vector((side*4.3,-6.15));b=Vector((side*1.9,-8.55))
    outward=Vector((side*.7071,-.7071))
    for i in range(5):
        t0=.015+i*.195;t1=t0+.177
        p=a.lerp(b,t0);q=a.lerp(b,t1)
        width=.42*(1-t0)+.17*t0
        corners=[p+outward*.025,q+outward*.025,q+outward*(width-.02),p+outward*width]
        slab('Exterior shoulder armor',[(v.x,v.y) for v in corners],.586,.025,'Metal')
        mid=(p+q)/2+outward*(width*.55)
        # Short mechanical rib, shallow and readable from above.
        beam('Exterior shoulder rib',(mid.x,.611,mid.y),(mid.x+outward.x*.12,.611,mid.y+outward.y*.12),.035,'Graphite')
    # Cable conduits on the forward deck, with raised clamps and terminated ends.
    x=side*.34
    beam('Exterior conduit',(x,.84,-8.82),(x,.69,-10.5),.025,'Gasket')
    for i in range(5):
        z=-8.92-i*.32;y=.84+(z+8.82)*(.15/1.68)
        box('Exterior conduit clamp',(x,y+.012,z),(.08,.025,.035),'Metal',.003)
    # Flush lifting sockets and inset panels give scale without tall aerials.
    for z in (-9.8,-10.9):
        y=.8+(z+8.55)*(.25/2.8)
        box('Exterior lifting socket',(side*.6,y+.055,z),(.13,.025,.10),'Graphite',.008)
        box('Exterior lifting grip',(side*.6,y+.075,z),(.065,.015,.025),'Metal',.003)
    # Three separated warning bars on each shoulder, real thin geometry.
    for i in range(3):
        z=-8.94-i*.07;y=.8+(z+8.55)*(.25/2.8)
        box('Exterior maintenance marking',(side*1.25,y+.043,z),(.15,.008,.025),'Ivory',.001)

bpy.context.view_layer.update()
for obj,(matrix,metadata) in original.items():
    assert obj.matrix_world==matrix and dict(obj.items())==metadata
deps=bpy.context.evaluated_depsgraph_get();triangles=0
for obj in collection.objects:
    e=obj.evaluated_get(deps);data=e.to_mesh();data.calc_loop_triangles()
    triangles+=len(data.loop_triangles)
    for v in data.vertices:
        p=obj.matrix_world@v.co
        assert p.y>6.1 and p.z<.91,(obj.name,tuple(p))
    e.to_mesh_clear()
assert triangles<7000
assert sum(o.type=='LIGHT' for o in scene.objects)==4
old=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/'bridge-interior-final.blend'),compress=True)
finally:bpy.context.preferences.filepaths.save_version=old
print('Added',len(collection.objects),'pieces;',triangles,'evaluated triangles; original objects unchanged; no runtime export.')
