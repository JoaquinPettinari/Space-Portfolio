"""Use an Earth cloudscape crop for the darker portrait print, without emission."""
import bpy,json
from pathlib import Path
source=bpy.data.images['CDS ORBIT / Cinematic orbital panorama - packed'];image=source.copy();image.name='WINDOW / Earth cloudscape keepsake';image.scale(512,256);image.pack()
material=bpy.data.materials['WINDOW / Photographic print 2'];tex=next(n for n in material.node_tree.nodes if n.type=='TEX_IMAGE');tex.image=image
photo=next(o for o in bpy.data.collections['20 Observation ledge and keepsakes'].objects if o.type=='MESH' and any(m==material for m in o.data.materials))
for loop,co in zip(photo.data.uv_layers.active.data,[(.38,.02),(.72,.02),(.72,.50),(.38,.50)]):loop.uv=co
p=Path(bpy.data.filepath).parent/'window-dressing-audit.json';audit=json.loads(p.read_text());audit['images']=[source.name,source.name+' / Earth cloudscape crop'];audit['printEmission']=False;p.write_text(json.dumps(audit,indent=2))
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
