"""Refine galley-only cabinet response without adding objects."""
import bpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/bridge-ceiling-study'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'bridge-galley-satin-practicals.blend'))
m=bpy.data.materials['GALLEY POLISH / Graphite ceramic coated wall']
p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs['Base Color'].default_value=(.022,.029,.035,1)
p.inputs['Metallic'].default_value=.24
for n in m.node_tree.nodes:
 if n.type=='VALTORGB' and any(l.to_socket==p.inputs['Roughness'] for l in m.node_tree.links if l.from_node==n):
  n.color_ramp.elements[0].color=(.48,.48,.48,1);n.color_ramp.elements[1].color=(.62,.62,.62,1)
# Small stainless details retain glints; the large cabinet faces stay restrained.
m=bpy.data.materials.get('GALLEY DETAIL / Satin stainless steel')
if m:
 p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Roughness'].default_value=.27
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bridge-galley-balanced-finish.blend'),compress=True)
