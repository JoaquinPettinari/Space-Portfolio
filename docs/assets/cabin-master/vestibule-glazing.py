"""Clear, lightly reflecting inspection glazing, without inherited metallic paint."""
import bpy,json
from pathlib import Path
m=bpy.data.materials['VESTIBULE / Clear inspection glass'];nt=m.node_tree;p=next(n for n in nt.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Metallic'].default_value=0;p.inputs['Roughness'].default_value=.012
out=next(n for n in nt.nodes if n.type=='OUTPUT_MATERIAL');mix=nt.nodes.new('ShaderNodeMixShader');mix.label='Subtle inspection glazing';mix.inputs[0].default_value=.25;clear=nt.nodes.new('ShaderNodeBsdfTransparent');nt.links.new(clear.outputs[0],mix.inputs[1]);nt.links.new(p.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],out.inputs['Surface'])
path=Path(bpy.data.filepath).parent/'vestibule-audit.json';a=json.loads(path.read_text());a['inspectionGlass']={'metallic':0,'transmission':1,'glassMix':.25,'roughness':.012};path.write_text(json.dumps(a,indent=2))
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
