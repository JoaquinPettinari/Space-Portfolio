"""Create a separate editable art workspace; never overwrite it on reruns."""
from pathlib import Path
import json
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
folder = ROOT / 'docs/assets/service-wall-studio'
target = folder / 'service-wall-design.blend'
if target.exists():
    raise RuntimeError('Design file already exists; edit it directly instead of regenerating it.')
folder.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = 'Service wall / Design studio'
with bpy.data.libraries.load(str(ROOT / 'docs/assets/cabin-reference/cabin-reference-dressing.blend'), link=False) as (source, dest):
    dest.scenes = source.scenes
loaded = dest.scenes[0]
bpy.context.window.scene = loaded
bpy.context.view_layer.update()
wall = bpy.data.collections.new('01 / Editable wall')
scene.collection.children.link(wall)
count = 0
for obj in list(loaded.objects):
    if obj.type != 'MESH':
        continue
    points = [obj.matrix_world @ Vector(v) for v in obj.bound_box]
    if not (min(v.x for v in points) >= 3.565 and max(v.x for v in points) <= 4.415
            and min(-v.y for v in points) >= 12.835 and max(-v.y for v in points) <= 17.735):
        continue
    wall.objects.link(obj)
    loaded.collection.objects.unlink(obj)
    obj.location -= Vector((4, -15.285, 0))
    count += 1
bpy.context.window.scene = scene
bpy.data.scenes.remove(loaded)
assert count >= 212, count
studio = bpy.data.collections.new('02 / Preview lighting - not for export')
scene.collection.children.link(studio)
def aim(obj, at):
    obj.rotation_euler = (Vector(at) - obj.location).to_track_quat('-Z', 'Y').to_euler()
def area(name, at, power, color, size):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = power
    data.color = color
    data.shape = 'DISK'
    data.size = size
    obj = bpy.data.objects.new(name, data)
    studio.objects.link(obj)
    obj.location = at
    aim(obj, (0, 0, 1.3))
area('Warm key', (-2.5, -2, 3.4), 450, (1, .66, .38), 3)
area('Cool fill', (-1.8, 2.8, 2), 180, (.40, .72, 1), 2.5)
camera = bpy.data.objects.new('Review camera', bpy.data.cameras.new('Review camera'))
studio.objects.link(camera)
camera.location = (-7.5, -.3, 2)
aim(camera, (0, 0, 1.35))
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 5.65
scene.camera = camera
scene.world = bpy.data.worlds.new('Studio dark neutral')
scene.world.use_nodes = True
background = next(n for n in scene.world.node_tree.nodes if n.type == 'BACKGROUND')
background.inputs[0].default_value = (.025, .03, .04, 1)
background.inputs[1].default_value = .3
reference = Path('C:/Users/joaqu/AppData/Local/Temp/codex-clipboard-a0485840-a2e9-4695-98ef-014b7bc30f61.png')
image = bpy.data.images.load(str(reference))
image.name = 'REFERENCE / User service wall'
image.pack()
ref_collection = bpy.data.collections.new('03 / Reference - not for export')
scene.collection.children.link(ref_collection)
ref = bpy.data.objects.new('User reference - packed image', None)
ref.empty_display_type = 'IMAGE'
ref.data = image
ref.empty_display_size = 5
ref.location = (0, 6, 1.5)
ref.hide_render = True
ref_collection.objects.link(ref)
scene.unit_settings.system = 'METRIC'
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 1200
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.filepath = str(folder / 'studio-baseline.png')
scene['runtime_blender_offset'] = [4, -15.285, 0]
scene['workflow'] = 'Edit this file directly. Export only 01 / Editable wall. Studio lights are preview only.'
for screen in bpy.data.screens:
    for area_ui in screen.areas:
        if area_ui.type == 'VIEW_3D':
            area_ui.spaces.active.region_3d.view_perspective = 'CAMERA'
bpy.ops.wm.save_as_mainfile(filepath=str(target))
(folder / 'setup.json').write_text(json.dumps({'editableObjects': count, 'sourcePreserved': True,
    'runtimeChanged': False, 'file': target.name}, indent=2), encoding='utf-8')
bpy.ops.render.render(write_still=True)
print('STUDIO_READY', count, target)
