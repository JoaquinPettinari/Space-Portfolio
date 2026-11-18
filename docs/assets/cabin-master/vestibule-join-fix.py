"""Seat the room behind the pressure collar and remove lens-like smooth pane normals."""
import bpy,json
from pathlib import Path
s=bpy.context.scene;assert not s.get('vestibule_join_fixed');col=bpy.data.collections['21 Docking vestibule - studio only']
for o in col.objects:
 if any(k in o.name for k in ['Vestibule continuous deck','Vestibule continuous roof','Vestibule pressure side wall']):o.location.y=-19.8475;o.scale.y=2.555/2.85
 elif 'Vestibule near jamb closure' in o.name or 'Vestibule near overhead closure' in o.name:o.location.y=-18.64
o=bpy.data.objects['DOCK_CDS_hardware_Inspection_glass.001'];o.data=o.data.copy();o.data.name='VESTIBULE / Flat inspection pane normals'
for p in o.data.polygons:p.use_smooth=False
if o.data.has_custom_normals:o.data.normals_split_custom_set([(0,0,0)]*len(o.data.loops))
o.data.update();s['vestibule_join_fixed']=1
p=Path(bpy.data.filepath).parent/'vestibule-audit.json';a=json.loads(p.read_text());a['vestibuleBoundsRuntime']['z']=[18.57,21.135];a['glassPaneNormals']='Local mesh copy with flat faces and cleared inherited smooth custom normals';a['pressureCollarJoin']='Room front moved behind existing collar back at runtime Z18.56';p.write_text(json.dumps(a,indent=2))
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
