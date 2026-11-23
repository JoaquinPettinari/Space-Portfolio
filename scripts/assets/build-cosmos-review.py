"""Render saved Asterion art without regenerating geometry or radiance.

blender --background docs/assets/cosmos/asterion-expanse.blend --python
scripts/assets/build-cosmos-review.py -- --panorama
"""
from pathlib import Path
import sys
import bpy

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/cosmos'
scene = bpy.context.scene
front = bpy.data.objects['VIEW 01 / Bridge / Vesper and Nacre']
if '--panorama' in sys.argv:
    scene.camera = bpy.data.objects['VIEW 05 / 360 equirectangular']
    scene.render.resolution_x = 4096
    scene.render.resolution_y = 2048
    scene.render.filepath = str(OUT / 'asterion-panorama-review.png')
    bpy.ops.render.render(write_still=True)
else:
    for index, camera in enumerate(sorted(
        (obj for obj in scene.objects if obj.type == 'CAMERA' and obj.name.startswith('VIEW 0') and '360' not in obj.name),
        key=lambda obj: obj.name,
    )):
        scene.camera = camera
        scene.render.resolution_x = 1280
        scene.render.resolution_y = 720
        scene.render.filepath = str(OUT / ('review-%02d.png' % (index+1)))
        bpy.ops.render.render(write_still=True)
scene.camera = front
print('ASTERION_RENDER_COMPLETE')
