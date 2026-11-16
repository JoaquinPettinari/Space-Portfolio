import bpy, json
from pathlib import Path
from mathutils import Vector
scene=bpy.data.scenes['CRUZ DEL SUR / Unified compact vessel']
bpy.context.window.scene=scene
report=[]
for o in scene.objects:
    if o.type!='MESH':continue
    original=o.get('original_object','')
    if o.get('source_scene')=='Arrival Room - Spacious V10' or any(c.name.startswith('UNIFIED / %02d'%i) for c in o.users_collection for i in range(8,13)):
        vs=[o.matrix_world @ Vector(v) for v in o.bound_box]
        lo=[round(min(v[i] for v in vs),4) for i in range(3)]
        hi=[round(max(v[i] for v in vs),4) for i in range(3)]
        report.append({'name':o.name,'original':original,'min':lo,'max':hi,'collections':[c.name for c in o.users_collection]})
out=Path(bpy.data.filepath).resolve().parents[2]/'audits/arrival-cleanup'
out.mkdir(parents=True,exist_ok=True)
(out/'source-inventory.json').write_text(json.dumps(report,indent=2))
for row in report:
    if any(t in row['name'].lower() for t in ['case','service','environment','drap','filter','storage']):print('ARRIVAL_OBJ',json.dumps(row))
