"""Bring pressure-frame layers in front of the existing hull lining."""
import bpy,json
from pathlib import Path
s=bpy.context.scene
assert s.get('detail_deck') and not s.get('detail_window_visible')
col=bpy.data.collections['14 Clear panoramic observation']
for o in col.objects:
 if o.name.startswith('DETAIL / Observation outer pressure frame'):o.location.x+=.32
 elif o.name.startswith('DETAIL / Observation black cavity'):o.location.x+=.29
 elif o.name.startswith('DETAIL / Observation inner machined rim'):o.location.x+=.30
 elif o.name.startswith('DETAIL / Observation corner gusset'):
  o.location.x+=.30
  o.location.z+=-.035 if o.location.z>1.52 else .035
 elif o.name.startswith('DETAIL / Captive hex fastener'):o.location.x+=.30
 elif o.name.startswith('DETAIL / Perimeter expansion joint'):o.location.x+=.30
 elif o.name.startswith('DETAIL / OBSERVATION /'):o.location.x+=.30
s['detail_window_visible']=1
bpy.context.view_layer.update()
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0
 bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
print('WINDOW_LAYERS_VISIBLE_SAVED')
