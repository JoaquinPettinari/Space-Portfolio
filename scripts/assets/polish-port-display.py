"""Refine only the expedition recess; retain the photo, stations and clear aisle."""
import ast
import math
from pathlib import Path
import bpy
import bmesh

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/bridge-ceiling-study'
bpy.ops.wm.open_mainfile(filepath=str(OUT / 'bridge-port-display-finish.blend'))
scene = bpy.context.scene
col = bpy.data.collections.new('PORT CORNER / Surface detailing')
scene.collection.children.link(col)
tree = ast.parse((ROOT / 'scripts/assets/polish-port-corner.py').read_text())
exec(compile(ast.Module(body=[n for n in tree.body if isinstance(n, ast.FunctionDef)
    and n.name in {'mesh', 'box'}], type_ignores=[]), '<port-builders>', 'exec'))

# Local material copies keep the kitchen and the rest of the bridge unchanged.
wall = bpy.data.materials['GALLEY POLISH / Graphite ceramic coated wall'].copy()
wall.name = 'PORT FINISH / Satin graphite panels'
p = next(n for n in wall.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
p.inputs['Base Color'].default_value = (.048, .058, .064, 1)
p.inputs['Metallic'].default_value = .32
for n in wall.node_tree.nodes:
    if n.type == 'VALTORGB' and any(l.to_socket == p.inputs['Roughness'] for l in n.outputs[0].links):
        n.color_ramp.elements[0].color = (.39, .39, .39, 1)
        n.color_ramp.elements[1].color = (.52, .52, .52, 1)
edge = bpy.data.materials['CEILING FINISH / Brushed edge alloy']
gold = bpy.data.materials['SHELVES / Medal satin brass']
seal = bpy.data.materials['CEILING POLISH / Matte recessed gasket']
for z, height in ((1.53, .68), (2.30, .71)):
    box('Inset satin wall panel', (-3.98, -1.704, z), (1.04, .022, height), wall, .014)
    for x in (-4.465, -3.495):
        box('Panel edge inlay', (x, -1.688, z), (.008, .008, height-.07), edge, .002)
        for dz in (-height/2+.04, height/2-.04):
            box('Flush panel fastener', (x+.018, -1.683, z+dz), (.012, .008, .012), edge, .002)

# Recessed metal insert, instead of a uniformly dark slab under the shelves.
for o in list(scene.objects):
    if o.name.startswith('PORT CORNER / Cabinet door'):
        o.data = o.data.copy()
        o.data.materials.clear()
        o.data.materials.append(wall)
    if o.name.startswith('PORT CORNER / Shelf practical') and o.type == 'LIGHT':
        o.data.energy = 10
        o.data.color = (1, .76, .49)
        o.rotation_euler.x = -.25

# Detail existing props without occupying more shelf area.
for i in range(24):
    angle = i * math.tau / 24
    o = box('Armillary graduation', (-3.68 + math.cos(angle)*.19, -1.49, 2.20 + math.sin(angle)*.19),
            (.015 if i % 3 == 0 else .008, .009, .003), edge, .001)
    o.rotation_euler.y = -angle
for z in (1.275, 1.535):
    box('Sample collar seam', (-3.69, -1.377, z), (.15, .009, .009), edge, .002)
for x in (-3.745, -3.71, -3.675, -3.64):
    box('Sample cap cooling slot', (x, -1.378, 1.557), (.018, .008, .006), seal, .001)
box('Logbook page block', (-4.21, -1.339, 1.232), (.37, .008, .025), edge, .002)
box('Logbook retaining strap', (-4.10, -1.477, 1.263), (.025, .24, .004), gold, .001)
for x in (-4.40, -4.02):
    for z in (1.335, 1.665):
        box('Photograph frame pin', (x, -1.528, z), (.008, .007, .008), edge, .001)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'bridge-port-display-polished.blend'), compress=True)
print('PORT_POLISH_READY', len(col.objects))
