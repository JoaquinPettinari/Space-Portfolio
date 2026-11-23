"""Render the linked hand grip from front and side without saving the master."""
from pathlib import Path
import bpy
import sys
from mathutils import Vector

scene = bpy.context.scene
folder = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'grip-refinement'
assert Path(folder).name == folder, 'Use a local review folder name'
out = Path(bpy.data.filepath).parent / folder
out.mkdir(exist_ok=True)
bpy.data.collections['05 Linked hands - no export'].hide_render = False
camera = bpy.data.objects['CAM / Tablet assembly']
scene.camera = camera
scene.cycles.samples = 32
scene.render.resolution_x = 1400
scene.render.resolution_y = 1000
for name, position, target, lens in [
    ('front', (0, -.90, .025), (0, 0, -.07), 42),
    ('side', (-.44, -.28, .03), (-.17, .005, -.06), 55),
    ('hand-profile', (-.52, -.42, .08), (-.19, .005, -.08), 50),
]:
    if '--views' in sys.argv and name not in sys.argv[sys.argv.index('--views') + 1:]:
        continue
    camera.location = position
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.lens = lens
    scene.render.filepath = str(out / (name + '.png'))
    bpy.ops.render.render(write_still=True)
print('GRIP_REVIEW_RENDERED', str(out))
