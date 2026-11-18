"""Thin glazing preview avoids refractive double images through the small visor."""
import bpy,json
from pathlib import Path
m=bpy.data.materials['VESTIBULE / Clear inspection glass'];p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(.005,.008,.008,1);p.inputs['Transmission Weight'].default_value=0;p.inputs['Roughness'].default_value=.08;p.inputs['IOR'].default_value=1.35
mix=next(n for n in m.node_tree.nodes if n.type=='MIX_SHADER');mix.inputs[0].default_value=.035
path=Path(bpy.data.filepath).parent/'vestibule-audit.json';a=json.loads(path.read_text());a['inspectionGlass']={'shader':'96.5% transparent transmission plus 3.5% dielectric surface','metallic':0,'refractiveTransmission':0,'roughness':.08,'ior':1.35};path.write_text(json.dumps(a,indent=2))
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
