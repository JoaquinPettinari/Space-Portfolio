"""Position indirect emitters outside the central luminaire housing."""
import bpy,json
from pathlib import Path
s=bpy.context.scene
assert not s.get('ceiling_bounce_corrected')
col=bpy.data.collections['10 Lighting and cameras']
for o in list(s.objects):
 if o.type!='LIGHT' or not o.name.startswith('Warm ceiling indirect bounce'):continue
 o.location.x=-1.4;o.location.z=2.99;o.data.energy=20;o.data.size=2.1;o.data.size_y=.75
 other=o.copy();other.data=o.data.copy();col.objects.link(other);other.location.x=1.4
s['ceiling_bounce_corrected']=1
root=Path(bpy.data.filepath).parent;p=root/'light-material-audit.json';audit=json.loads(p.read_text())
audit['after']['lights']={o.name:{'energy':o.data.energy,'color':list(o.data.color),'size':getattr(o.data,'size',None),'position':list(o.location)} for o in s.objects if o.type=='LIGHT'}
audit['ceilingBounceCorrection']='Six broad indirect emitters outside the central housing; 20 W each.'
p.write_text(json.dumps(audit,indent=2))
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
