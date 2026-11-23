"""Check vine paths against ceramic pot and shelf/retaining lip surfaces."""
from pathlib import Path
import bpy,json
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[3];OUT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(OUT/'transition-shelves-detailed.blend'))
scene=bpy.context.scene;deps=bpy.context.evaluated_depsgraph_get();vertices=[];faces=[];targets=[]
for o in scene.objects:
    if o.type!='MESH' or not o.name.startswith(('TRAILING ceramic pot','PORT / 2 shelf','PORT / 2 retention lip')):continue
    evaluated=o.evaluated_get(deps);mesh=evaluated.to_mesh();offset=len(vertices);vertices.extend(o.matrix_world@v.co for v in mesh.vertices);faces.extend(tuple(offset+i for i in p.vertices) for p in mesh.polygons);evaluated.to_mesh_clear();targets.append(o.name)
tree=BVHTree.FromPolygons(vertices,faces);segments=0
for o in scene.objects:
    if o.type!='CURVE' or not o.name.startswith('TRAILING connected vine'):continue
    points=[o.matrix_world@p.co.xyz for p in o.data.splines[0].points]
    for a,b in zip(points,points[1:]):
        d=b-a;hit=tree.ray_cast(a,d.normalized(),d.length);assert hit[0] is None,('Vine crosses solid surface',o.name,hit);segments+=1
assert segments==40
report=json.loads((OUT/'shelves-detailed.json').read_text());report['vineSurfaceAudit']={'segments':segments,'targets':targets,'crossings':0}
(OUT/'shelves-detailed.json').write_text(json.dumps(report,indent=2)+'\n')
compile((ROOT/'scripts/assets/detail-transition-shelves.py').read_text(),'detail-transition-shelves.py','exec')
print('VINE_SURFACES_CLEAR_AND_SCRIPT_COMPILED',segments)
