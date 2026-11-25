"""Independent violet art direction; preserve runtime and previous cosmos source."""
import bpy
import hashlib
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/assets/cosmos'
source=Path(bpy.data.filepath)
assert source.name=='asterion-expanse-v3-traffic.blend'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
scene=bpy.context.scene
world=scene.world.copy()
world.name='ASTERION / Violet nebula review'
scene.world=world
n,l=world.node_tree.nodes,world.node_tree.links
backgrounds=[node for node in n if node.type=='BACKGROUND']
source_color=backgrounds[0].inputs['Color'].links[0].from_socket
gray=n.new('ShaderNodeRGBToBW');l.new(source_color,gray.inputs[0])
palette=n.new('ShaderNodeValToRGB');palette.label='Violet nebula / deep indigo to pearl'
colors=[(0,(.001,.002,.009)),(.025,(.008,.012,.045)),(.075,(.035,.025,.14)),
        (.17,(.17,.045,.35)),(.32,(.36,.12,.60)),(.52,(.56,.28,.77)),
        (.76,(.79,.55,.91)),(1,(1,.91,1))]
for i,(position,color) in enumerate(colors):
 e=palette.color_ramp.elements[i] if i<2 else palette.color_ramp.elements.new(position)
 e.position=position;e.color=(*color,1)
l.new(gray.outputs[0],palette.inputs[0])
# Retain original star and blue-cloud chromatic variation beneath the art direction.
blend=n.new('ShaderNodeMixRGB');blend.blend_type='MIX';blend.inputs[0].default_value=.78
l.new(source_color,blend.inputs[1]);l.new(palette.outputs[0],blend.inputs[2])
for background in backgrounds:l.new(blend.outputs[0],background.inputs['Color'])

planet=bpy.data.objects['NACRE / copper and pearl gas giant']
rings=bpy.data.objects['NACRE / rings with Cassini and outer gaps']
atmosphere=bpy.data.objects['NACRE / copper and pearl gas giant / atmosphere']
for o in (planet,rings,atmosphere):
 o.location=(20,140,-6)
 o.scale*=2.65
 o.rotation_euler=(.10,-.35,.10)

def copy_material(o):
 # Do not mutate shared mesh slots when a source uses linked mesh data.
 o.data=o.data.copy()
 m=o.data.materials[0].copy();m.name='VIOLET / '+m.name
 o.data.materials[0]=m
 return m

m=copy_material(planet)
ramps=[node for node in m.node_tree.nodes if node.type=='VALTORGB']
belts=max(ramps,key=lambda node:len(node.color_ramp.elements))
colors=[(.06,.05,.14),(.12,.095,.24),(.22,.15,.34),(.32,.235,.43),(.13,.16,.30),(.40,.31,.49)]
for e,color in zip(belts.color_ramp.elements,colors):e.color=(*color,1)
for node in m.node_tree.nodes:
 if node.type=='MIX_RGB' and not node.inputs[2].is_linked:
  for link in list(node.inputs[0].links):m.node_tree.links.remove(link)
  node.inputs[0].default_value=0
 if node.type=='MATH' and node.operation=='MULTIPLY':
  value=node.inputs[1].default_value
  if abs(value-39)<.01:node.inputs[1].default_value=72
  if abs(value-7)<.01:node.inputs[1].default_value=20
  if abs(value-2.8)<.01:node.inputs[1].default_value=8
m=copy_material(rings)
for node in m.node_tree.nodes:
 if node.type=='VALTORGB':
  for e in node.color_ramp.elements:
   r,g,b,a=e.color
   intensity=max(r,g,b)
   e.color=(intensity*.85,intensity*.63,intensity,a)
copy_material(atmosphere)
for node in atmosphere.data.materials[0].node_tree.nodes:
 if node.type=='EMISSION':node.inputs['Color'].default_value=(.30,.28,.85,1)
sun=next(o for o in scene.objects if o.type=='LIGHT' and o.data.type=='SUN')
sun.data=sun.data.copy();sun.data.color=(.83,.77,1)
sun.rotation_euler=Vector((.9,.12,-.3)).to_track_quat('-Z','Y').to_euler()
sun.data.angle=.025
# Removed in the approved traffic composition; do not bring the oversized world back.
for o in scene.objects:
 if o.name.startswith('VESPER /'):
  o.hide_render=True;o.hide_set(True)
scene.camera=bpy.data.objects['VIEW 01 / Bridge / Vesper and Nacre']
scene.camera.data=scene.camera.data.copy();scene.camera.data.lens=27
scene.camera.rotation_euler=Vector((0,1,-.035)).to_track_quat('-Z','Y').to_euler()
scene.name='CRUZ DEL SUR / Violet expanse review'
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
destination=OUT/'asterion-violet-review.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(destination))
(OUT/'violet-review-validation.json').write_text(json.dumps({
 'source':source.name,'sourceSha256':digest,'sourceUnchanged':True,
 'revision':destination.name,'palette':'indigo, violet, lavender, pearl',
 'ringedPlanetLocation':list(planet.location),'ringedPlanetScale':list(planet.scale),
 'runtimeExported':False,'originalSkyTexturesPreserved':True,
},indent=2))
print('VIOLET_REVIEW_READY',destination)
