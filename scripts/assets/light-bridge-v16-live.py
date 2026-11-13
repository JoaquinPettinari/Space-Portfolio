"""Blender-only lighting study. Preview rig is not a runtime light configuration."""
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
NAME = 'Bridge - Lighting Study V16'
assert NAME not in bpy.data.scenes
source = bpy.data.scenes['Bridge - Material Study V15']
scene = bpy.data.scenes.new(NAME)
scene.unit_settings.system = 'METRIC'
scene.world = source.world.copy() if source.world else bpy.data.worlds.new('Bridge V16 World')
scene.world.use_nodes = True
background = next(n for n in scene.world.node_tree.nodes if n.type == 'BACKGROUND')
background.inputs['Color'].default_value = (.12, .17, .24, 1)
background.inputs['Strength'].default_value = .18
bpy.context.window.scene = scene
architecture = bpy.data.collections.new('BRIDGE V16 / Architecture')
scene.collection.children.link(architecture)
pairs = []
for old in source.objects:
    if old.type != 'MESH':
        continue
    obj = old.copy()
    obj.data = old.data.copy()
    architecture.objects.link(obj)
    pairs.append((old, obj))

rig = bpy.data.collections.new('PREVIEW ONLY / V16 lighting - exclude from GLB')
scene.collection.children.link(rig)
def area(name, position, target, power, color, width, length):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = power
    data.color = color
    data.shape = 'RECTANGLE'
    data.size = width
    data.size_y = length
    obj = bpy.data.objects.new(name, data)
    rig.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    obj['preview_only'] = True
    return obj

# Blender coordinates: Z up, Y toward the bow. Broad sources approximate
# grouped ceiling fixtures; they are not individual lights for every diffuser.
for x in (-2.4, 2.4):
    area('Preview warm ceiling', (x, .3, 3.12), (x, .3, 0),
         180, (1, .76, .51), .6, 3.4)
area('Preview entry ceiling', (0, -3.6, 2.98), (0, -3.6, 0),
     100, (1, .79, .57), 2.2, 1.8)
area('Preview bow daylight', (0, 7.2, 2.7), (0, 1, 1),
     220, (.48, .72, 1), 4.2, 1.5)

for old, obj in pairs:
    assert old.matrix_world == obj.matrix_world
    assert len(old.data.vertices) == len(obj.data.vertices)
    assert all(a.co == b.co for a, b in zip(old.data.vertices, obj.data.vertices))
    assert dict(old.items()) == dict(obj.items())
assert len(rig.objects) == 4
assert all(o.get('preview_only') for o in rig.objects)
# Show the light study live without generating captures or changing the view.
for screen in bpy.data.screens:
    for area_ui in screen.areas:
        if area_ui.type == 'VIEW_3D':
            area_ui.spaces.active.shading.type = 'RENDERED'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'docs/assets/bridge/bridge-interior-v16.blend'))
print(f'V16 saved: {len(pairs)} unchanged meshes; four isolated preview area lights; no GLB export.')
