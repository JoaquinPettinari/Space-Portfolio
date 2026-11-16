# Replace only the old decoration that occupies the two new closed cabinet volumes.
# Preserve original datablocks in an unlinked, fake-user archive; do not touch hull,
# doors, glass, other scenes, or the canonical backup saved before this pass.
import bpy, bmesh
from mathutils import Vector
archive=bpy.data.collections.get('SOURCE / Side cassette prior geometry')
if archive is None:
    archive=bpy.data.collections.new('SOURCE / Side cassette prior geometry')
    archive.use_fake_user=True
new=bpy.data.collections['UNIFIED / 13 Reference side cassettes - Blender only']
removed=0;changed=[]
def inside(p):
    return 1.98 < abs(p.x) < 3.79 and -1.85 < p.y < -.86 and .16 < p.z < 2.83
for obj in list(bpy.context.scene.objects):
    if obj.type!='MESH' or obj.name in new.objects:continue
    if not any(c.name.startswith(('UNIFIED / 02','UNIFIED / 09','UNIFIED / 10','UNIFIED / 11')) for c in obj.users_collection):continue
    corners=[obj.matrix_world@Vector(p) for p in obj.bound_box]
    if max(p.y for p in corners)<-1.85 or min(p.y for p in corners)>-.86:continue
    points=[obj.matrix_world@v.co for v in obj.data.vertices]
    indices={p.index for p in obj.data.polygons if all(inside(points[i]) for i in p.vertices)}
    if not indices:continue
    original=obj.copy();original.name='SOURCE NICHE / '+obj.name;archive.objects.link(original)
    obj.data=obj.data.copy()
    bm=bmesh.new();bm.from_mesh(obj.data);bm.faces.ensure_lookup_table()
    doomed=[f for f in bm.faces if f.index in indices]
    bmesh.ops.delete(bm,geom=doomed,context='FACES')
    bm.to_mesh(obj.data);bm.free();obj.data.update()
    removed+=len(indices);changed.append(obj.name)
print('ARCHIVED AND REPLACED',len(changed),'old decor meshes;',removed,'faces; original geometry retained')
