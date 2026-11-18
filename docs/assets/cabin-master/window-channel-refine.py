"""Expose only the warm diffuser edge and aim the spill onto the fascia."""
import bpy,ast,json
from pathlib import Path
from mathutils import Vector
from math import pi
s=bpy.context.scene;assert not s.get('window_channel_refined');root=Path(bpy.data.filepath).parent
source=ast.parse((root/'detail-architecture.py').read_text());exec(compile(ast.Module(body=[n for n in source.body if isinstance(n,ast.FunctionDef)],type_ignores=[]),'shared geometry','exec'))
col=bpy.data.collections['20 Observation ledge and keepsakes'];amber=bpy.data.materials['WINDOW / Recessed amber diffuser']
for o in col.objects:
 if 'Ledge glare shielding front lip' in o.name:o.location.z=.699;o.scale.z=.035/.064
 if 'Upper frame recessed construction joint' in o.name and abs(-o.location.y-15.15)<.01:o.location.y-=.75
 if 'Captive hex fastener' in o.name and abs(o.location.z-2.58)<.001 and abs(-o.location.y-15.15)<.1:o.location.y-=.75
for z in [13.15,15.15,17.15]:box('Recessed diffuser visible amber edge',(-3.951,.670,z),(.006,.010,1.35),amber,col)
for o in s.objects:
 if o.type=='LIGHT' and o.name.startswith('Observation ledge warm spill'):
  target=Vector((-4.35,o.location.y,.35));o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();tris=0
for o in s.objects:
 if o.hide_render or o.get('archived') or o.type not in {'MESH','CURVE','FONT'}:continue
 e=o.evaluated_get(dg);m=e.to_mesh();m.calc_loop_triangles();tris+=len(m.loop_triangles);e.to_mesh_clear()
p=root/'window-frame-light-audit.json';a=json.loads(p.read_text());a['trianglesAfter']=tris;a['refinement']='Visible recessed amber diffuser edge; area sources aimed toward fascia; central joint moved clear of lettering.';a['lightsAfter']={o.name:{'energy':o.data.energy,'color':list(o.data.color),'position':list(o.location),'rotation':list(o.rotation_euler),'size':getattr(o.data,'size',None)} for o in s.objects if o.type=='LIGHT'};p.write_text(json.dumps(a,indent=2))
s['window_channel_refined']=1
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
print('CHANNEL_REFINED',tris)
