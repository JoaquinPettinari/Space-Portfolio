"""Read-only geometry/source checks for the personal shelf variant."""
from pathlib import Path
import bpy,json,hashlib
ROOT=Path(__file__).resolve().parents[3];OUT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(OUT/'transition-shelves-personal.blend'))
deps=bpy.context.evaluated_depsgraph_get();body=[];all_points=[]
for o in bpy.context.scene.objects:
    if o.type!='MESH' or not o.name.startswith(('CENTRAL COLUMN','Column ')):continue
    ev=o.evaluated_get(deps);mesh=ev.to_mesh();points=[o.matrix_world@v.co for v in mesh.vertices]
    all_points.extend(points)
    if o.name.startswith('CENTRAL COLUMN'):body.extend(points)
    ev.to_mesh_clear()
clearance=min(abs(p.x) for p in all_points);body_clearance=min(abs(p.x) for p in body)
assert clearance>=1.34,clearance
report=json.loads((OUT/'shelves-personal.json').read_text())
assert hashlib.sha256((OUT/report['sourceSnapshot']).read_bytes()).hexdigest()==report['sourceSHA256']
report['measuredColumnMinimumHalfWidth']=clearance;report['measuredColumnBodyHalfWidth']=body_clearance
(OUT/'shelves-personal.json').write_text(json.dumps(report,indent=2)+'\n')
compile((ROOT/'scripts/assets/personalize-transition-shelves.py').read_text(),'personalize-transition-shelves.py','exec')
print('PERSONAL_AUDIT_PASSED',clearance,body_clearance)
