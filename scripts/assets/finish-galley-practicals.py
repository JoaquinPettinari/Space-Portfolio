"""Satin composite and warm practical-light study, preserving geometry."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/bridge-ceiling-study'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'bridge-galley-appliance-finish.blend'))
m=bpy.data.materials['GALLEY WALL / Pale brushed composite'];p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs['Base Color'].default_value=(.18,.195,.20,1);p.inputs['Metallic'].default_value=.18;p.inputs['Roughness'].default_value=.43
# The tabletop keeps its existing micro-normal, with a cooler neutral composite.
for o in bpy.context.scene.objects:
 if o.type=='LIGHT' and o.name.startswith('GALLEY WIDE / '):
  o.data.color=(1,.68,.40);o.data.energy=8;o.data.size=2.3;o.data.size_y=.18
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bridge-galley-satin-practicals.blend'),compress=True)
