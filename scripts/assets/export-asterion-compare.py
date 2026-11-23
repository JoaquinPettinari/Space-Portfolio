"""Render source/proxy pairs with identical cameras and transparent backgrounds."""
import bpy
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'docs/assets/cosmos/asterion-expanse-v2.blend'
OUT = ROOT / 'docs/assets/cosmos/runtime-export'
before = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 16
scene.cycles.device = 'GPU'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'OPTIX'; prefs.get_devices()
for device in prefs.devices:
    device.use = device.type != 'CPU'
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
original = [o for o in scene.objects if o.type == 'MESH']
for obj in original:
    if obj.name.endswith('/ atmosphere'):
        obj.hide_render = True
views = [('front', 'VIEW 01 / Bridge / Vesper and Nacre'),
         ('rear', 'VIEW 02 / Aft / Ithaca and Orison'),
         ('rings', 'DETAIL / Nacre ring transmission and shadow')]
if '--runtime-only' not in sys.argv:
    for label, name in views:
        scene.camera = bpy.data.objects[name]
        scene.render.filepath = str(OUT / ('compare-' + label + '-source.png'))
        bpy.ops.render.render(write_still=True)
for obj in original:
    obj.hide_render = True
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/models/asterion-worlds.glb'))
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1
for label, name in views:
    scene.camera = bpy.data.objects[name]
    scene.render.filepath = str(OUT / ('compare-' + label + '-runtime.png'))
    bpy.ops.render.render(write_still=True)
after = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
assert before == after
(OUT / 'compare-audit.json').write_text(json.dumps({'sourceBefore': before, 'sourceAfter': after, 'views': views, 'note': 'Atmosphere omitted in both pairs; runtime uses a separate view-dependent rim. Source AgX .35, baked runtime Standard 0.'}, indent=2))
