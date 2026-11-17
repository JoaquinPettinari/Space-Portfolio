"""Final warm bounce balance and measured geometry audit."""
import bpy,json
from pathlib import Path
s=bpy.context.scene
for o in s.objects:
 if o.type=='LIGHT' and o.name.startswith('Warm ceiling indirect bounce'):o.data.energy=14;o.data.color=(1,.51,.23)
dg=bpy.context.evaluated_depsgraph_get();tris=0
for o in s.objects:
 if o.hide_render or o.get('archived') or o.type not in {'MESH','CURVE','FONT'}:continue
 e=o.evaluated_get(dg);m=e.to_mesh();m.calc_loop_triangles();tris+=len(m.loop_triangles);e.to_mesh_clear()
assert tris==320534
p=Path(bpy.data.filepath).parent/'light-material-audit.json';a=json.loads(p.read_text());a['evaluatedTriangles']=tris
a['after']['lights']={o.name:{'energy':o.data.energy,'color':list(o.data.color),'size':getattr(o.data,'size',None),'position':list(o.location)} for o in s.objects if o.type=='LIGHT'}
a['ceilingBounceCorrection']='Six broad indirect emitters outside the central housing; final warm balance 14 W each.'
p.write_text(json.dumps(a,indent=2))
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
print('FINAL_LIGHT_BALANCE_SAVED',tris)
