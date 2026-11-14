"""Replace flat auxiliary instrumentation; finish practical ceiling housings."""
from pathlib import Path
from math import sin,cos,pi,atan2
import bpy,bmesh,json,hashlib
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2]
folder=ROOT/'docs/assets/bridge'
scene=bpy.context.scene
assert scene.name=='Bridge - Finished Interior'
assert not bpy.data.collections.get('BRIDGE / Sloped instruments')
bpy.data.libraries.write(str(folder/'bridge-interior-backup.blend'),{scene},fake_user=True,compress=True)
collection=bpy.data.collections.new('BRIDGE / Sloped instruments');scene.collection.children.link(collection)
materials={m.name.removeprefix('BRIDGE V15 '):m for m in bpy.data.materials if m.name.startswith('BRIDGE V15 ')}
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))
obsolete=[o for o in scene.objects if o.name.startswith('Perimeter auxiliary')]
assert len(obsolete)==24
preserved={o:(o.matrix_world.copy(),dict(o.items())) for o in scene.objects if o not in obsolete}
for obj in obsolete:bpy.data.objects.remove(obj,do_unlink=True)
layout=json.loads((folder/'layout.json').read_text())
for i,seg in enumerate(layout['consoles']):
    if 'opening' in seg:continue
    pose=dict(seg);pose['z']-=3.15
    for side in (-1,1):
        center=side*seg['length']*.25
        def world(x,y,z):
            a=pose['yaw'];return(pose['x']+x*cos(a)+z*sin(a),y,pose['z']-x*sin(a)+z*cos(a))
        # Wedge footprint stays on the existing desk, between -0.30 and +0.12.
        vertices=[world(center+x,y,z) for x,y,z in [
            (-.25,1.043,-.30),(.25,1.043,-.30),(.25,1.043,.12),(-.25,1.043,.12),
            (-.25,1.23,-.30),(.25,1.23,-.30),(.25,1.085,.12),(-.25,1.085,.12)]]
        mesh('Instrument sloped shell',vertices,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'Metal',.009)
        slope=(1.085-1.23)/.42
        def plane(name,x0,x1,z0,z1,offset,mat):
            return mesh(name,[world(center+x,1.23+slope*(z+.30)+offset,z) for x,z in [(x0,z0),(x1,z0),(x1,z1),(x0,z1)]],[(0,1,2,3)],mat,0)
        plane('Instrument dark inset',-.222,.222,-.276,.092,.003,'Graphite')
        plane('Instrument screen glass',-.202,.202,-.254,-.014,.005,'Gasket')
        # Neutral vector graphics: no fake mission status or duplicated portfolio UI.
        for row in range(3):
            z=-.228+row*.067
            plane('Instrument telemetry trace',-.17,-.035-row*.02,z,z+.008,.007,'Cyan')
        # Thin ring chart lies in the same sloped panel coordinate system.
        verts=[]
        for radius in (.065,.058):
            for j in range(24):
                a=2*pi*j/24;x=.105+cos(a)*radius;z=-.13+sin(a)*radius
                verts.append(world(center+x,1.23+slope*(z+.30)+.007,z))
        mesh('Instrument radial diagram',verts,[(j,(j+1)%24,(j+1)%24+24,j+24) for j in range(24)],'Cyan',0)
        for j in range(4):
            x=-.15+j*.10;z=.047;y=1.23+slope*(z+.30)
            box('Instrument tactile key',(center+x,y+.012,z),(.058,.016,.035),'Metal',.004,pose)
        for x in (-.22,.22):
            z=-.27;y=1.23+slope*(z+.30)
            box('Instrument captive bolt',(center+x,y+.007,z),(.018,.012,.018),'Graphite',.003,pose)

# Ten practical diffusers retain their exact geometry. Housings surround them
# with an open aperture, never covering their underside with a solid slab.
lamps=[o for o in scene.objects if o.name.startswith('Practical diffuser')]
assert len(lamps)==10
for lamp in lamps:
    pts=[lamp.matrix_world@Vector(p) for p in lamp.bound_box]
    low=[min(p[k] for p in pts) for k in range(3)];high=[max(p[k] for p in pts) for k in range(3)]
    x=(low[0]+high[0])/2;z=-(low[1]+high[1])/2;y=low[2]
    w=high[0]-low[0];d=high[1]-low[1]
    for side in (-1,1):
        box('Practical retaining side',(x+side*(w/2+.027),y+.012,z),(.045,.055,d+.10),'Graphite',.006)
        box('Practical retaining end',(x,y+.012,z+side*(d/2+.027)),(w,.055,.045),'Metal',.006)
        for edge in (-1,1):
            box('Practical frame fastener',(x+side*(w/2+.027),y-.019,z+edge*d*.32),(.018,.009,.018),'Metal',.003)

new=list(collection.objects)
for obj in new:
    uv=obj.data.uv_layers.new(name='Surface metres')
    for poly in obj.data.polygons:
        axis=max(range(3),key=lambda k:abs(poly.normal[k]));axes=[k for k in range(3) if k!=axis]
        for li in poly.loop_indices:
            p=obj.data.vertices[obj.data.loops[li].vertex_index].co
            uv.data[li].uv=(p[axes[0]],p[axes[1]])
bpy.context.view_layer.update()
for obj,(transform,metadata) in preserved.items():assert obj.matrix_world==transform and dict(obj.items())==metadata
deps=bpy.context.evaluated_depsgraph_get();verts=[];polys=[]
for obj in new:
    e=obj.evaluated_get(deps);m=e.to_mesh();offset=len(verts)
    verts.extend(obj.matrix_world@v.co for v in m.vertices)
    polys.extend([offset+k for k in p.vertices] for p in m.polygons);e.to_mesh_clear()
tree=BVHTree.FromPolygons(verts,polys)
screens=[(m['position'][0],m['position'][1],m['position'][2]-3.15,m['rotation'],1.6,.9) for m in layout['monitors'].values()]
screens += [(4.205,1.68,-1.05,-pi/2,1.1,.8),(-4.205,1.68,-2.75,pi/2,1.1,.8)]
for x,y,z,a,w,h in screens:
    normal=Vector((sin(a),0,cos(a)))
    for dx in (-w*.48,0,w*.48):
        for dy in (-h*.48,0,h*.48):
            target=Vector((x+dx*cos(a),y+dy,z-dx*sin(a)))
            assert tree.ray_cast(xyz(target+normal),xyz(-normal),.99)[0] is None
for lamp in lamps:
    center=sum((lamp.matrix_world@Vector(v) for v in lamp.bound_box),Vector())/8
    assert tree.ray_cast(center-Vector((0,0,.20)),Vector((0,0,1)),.19)[0] is None
assert sum(o.type=='LIGHT' for o in scene.objects)==4
old=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/'bridge-interior-final.blend'),compress=True)
finally:bpy.context.preferences.filepaths.save_version=old
print('Six sloped auxiliary panels; ten open lamp frames.',len(new),'new meshes replace 24 flat parts. 36 screen rays and ten lamp rays clear. Source only.')
