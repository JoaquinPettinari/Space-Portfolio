"""Repair window bench occlusion and front portal closure; preserve V6."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
base = (ROOT/'scripts/assets/detail-arrival-v6-live.py').read_text()
setup = base[:base.index('# Equipment case')]
setup = setup.replace('Equipment Details V6', 'Bench and Portal V7').replace("['Arrival Room - Rear Closure V5']", "['Arrival Room - Equipment Details V6']")
setup = setup.replace("replace('V5','V6')", "replace('V6','V7')").replace("replace('ARR5','ARR6')", "replace('ARR6','ARR7')")
setup = setup.replace('ARRIVAL V6 / Equipment details', 'ARRIVAL V7 / Closure details').replace("'ARR6 '+name", "'ARR7 '+name")
setup = setup[:setup.index('for key,color')] + setup[setup.index('def xyz'):]
exec(compile(setup, __file__, 'exec'))

old = next(o for o in scene.objects if o.name.startswith('ARR7 window plinth'))
bpy.data.objects.remove(old, do_unlink=True)
wall = box('curved window plinth',(-2.76,.40,2.065),(.16,.8,4.13),'Warm grey panels',0)
bm=bmesh.new();bm.from_mesh(wall.data)
edges=[e for e in bm.edges if abs(e.verts[0].co.y-e.verts[1].co.y)>4]
bmesh.ops.subdivide_edges(bm,edges=edges,cuts=11,use_grid_fill=True)
for v in bm.verts:
    z=-v.co.y
    v.co.x-=.65*sin(pi*max(0,min(4.13,z))/4.13)**2*max(0,min(1,(-v.co.x-.5)/2.26))
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(wall.data);bm.free()
for layer in list(wall.data.uv_layers):wall.data.uv_layers.remove(layer)
uv(wall.data)
header=next(o for o in scene.objects if o.name.startswith('ARR7 access header'))
for v in header.data.vertices:
    if v.co.z>3.0:v.co.z=3.5
# Underside 2.53m clears the 2.50m moving leaves and their side pockets.
box('bulkhead overhead reveal',(0,2.72,-.43),(2.72,.38,1.02),'Graphite frame',.005)
exporter=ROOT/'scripts/assets/export-arrival-runtime-live.py'
exec(compile(exporter.read_text(),str(exporter),'exec'),{'__file__':str(exporter)})
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/arrival-room/arrival-room-v7.blend'))
print('V7 saved: curved bench wall, front roof closure and overhead reveal.')
