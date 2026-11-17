"""Local warm spill from the existing vertical access luminaires."""
import bpy,json
from pathlib import Path
from mathutils import Vector
s=bpy.context.scene;assert not s.get('threshold_light_spill')
col=bpy.data.collections['10 Lighting and cameras']
for z,target_z,width in [(18.04,17.0,1.23),(12.12,13.16,1.49)]:
 for side in [-1,1]:
  d=bpy.data.lights.new('Access amber threshold spill','AREA');d.energy=22;d.color=(1,.48,.18);d.shape='RECTANGLE';d.size=.085;d.size_y=1.20
  o=bpy.data.objects.new('Access amber threshold spill',d);col.objects.link(o);o.location=(width*side,-z,1.30)
  target=Vector((width*side*.70,-target_z,.02));o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler();o['preview_light']=True
s['threshold_light_spill']=1
p=Path(bpy.data.filepath).parent/'light-material-audit.json';a=json.loads(p.read_text());a['after']['lights']={o.name:{'energy':o.data.energy,'color':list(o.data.color),'size':getattr(o.data,'size',None),'position':list(o.location)} for o in s.objects if o.type=='LIGHT'};a['thresholdSpill']='Four rectangular practical supports aligned with existing vertical door lights.';p.write_text(json.dumps(a,indent=2))
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
