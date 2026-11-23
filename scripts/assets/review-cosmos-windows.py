"""Build a separate window-context study from the saved Asterion V2.

blender --background docs/assets/cosmos/asterion-expanse-v2.blend --python
scripts/assets/review-cosmos-windows.py -- --render

Uses authoring window shells, not a reconstruction of the entire runtime.
Eye poses are proposed inspection points, not collision-tested player poses.
Never saves over a source asset or exports into public/.
"""
from pathlib import Path
import argparse
import hashlib
import json
import sys
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/cosmos'
parser = argparse.ArgumentParser()
parser.add_argument('--render', action='store_true')
parser.add_argument('--views', default='1,2,3,4,5,6,7,8,9,10')
args = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
source = Path(bpy.data.filepath)
assert source.name == 'asterion-expanse-v2.blend', 'Open the standalone V2 first'
sources = [source, ROOT/'docs/assets/bow-master/bow-master.blend',
           ROOT/'docs/assets/cabin-master/cabin-master.blend',
           ROOT/'public/models/cruz-del-sur-panoramic-bay.glb']
hashes = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sources}
scene = bpy.context.scene
scene.name = 'ASTERION / Window composition study'
context = bpy.data.collections.new('REVIEW ONLY / Authored ship window context')
scene.collection.children.link(context)


def append_collections(path, names):
    with bpy.data.libraries.load(str(path), link=False) as (available, loaded):
        missing = set(names)-set(available.collections)
        assert not missing, f'Missing collections in {path}: {missing}'
        loaded.collections = names
    for collection in loaded.collections:
        context.children.link(collection)
        # No authoring studio lights/cameras leak into this lighting study.
        for obj in collection.all_objects:
            if obj.type in {'LIGHT', 'CAMERA'}:
                obj.hide_render = True


append_collections(sources[1], ['01 Pressure shell and glazing', '02 Deck and ceiling'])
append_collections(sources[2], ['14 Clear panoramic observation',
                                '20 Observation ledge and keepsakes', '16 Corner floor plant'])
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(sources[3]))
module = set(bpy.data.objects)-before
roots = [obj for obj in module if obj.parent not in module]
for obj in module:
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)
    context.objects.link(obj)
for index, center in enumerate((-6.1166666667, -8.15, -10.1833333333)):
    copies = {obj: obj.copy() for obj in module}
    for original, obj in copies.items():
        context.objects.link(obj)
        obj.name = f'WINDOW STUDY / passage {index+1} / {original.name}'
        if original.parent in copies:
            obj.parent = copies[original.parent]
        if original in roots:
            obj.location.y += center
for obj in module:
    bpy.data.objects.remove(obj, do_unlink=True)

# Neutral optical glass isolates composition from the source studio reflections.
# Only this disposable context copy is adjusted; window geometry is preserved.
clear_glass = bpy.data.materials.new('REVIEW ONLY / neutral transparent glazing')
clear_glass.use_nodes = True
nodes = clear_glass.node_tree.nodes
nodes.clear()
output = nodes.new('ShaderNodeOutputMaterial')
transparent = nodes.new('ShaderNodeBsdfTransparent')
transparent.inputs['Color'].default_value = (.97,.99,1,1)
clear_glass.node_tree.links.new(transparent.outputs[0],output.inputs[0])
neutral_glass_slots = []
for obj in context.all_objects:
    if obj.type != 'MESH':
        continue
    for slot in obj.material_slots:
        if slot.material and any(word in slot.material.name.lower() for word in ('glass','glazing','cristal')):
            neutral_glass_slots.append((obj.name,slot.material.name))
            slot.material = clear_glass

# Small neutral frame fills belong only to the review context, never the cosmos.
for name, location, energy, size in [
    ('Arrival frame fill', (-1.2, -15.15, 2.6), 20, 3),
    ('Bridge frame fill', (0, 4, 2.8), 35, 4),
    ('Passage frame fill', (0, -8.15, 2.7), 12, 2),
]:
    data = bpy.data.lights.new('REVIEW / '+name, 'AREA')
    data.energy = energy
    data.shape = 'DISK'
    data.size = size
    obj = bpy.data.objects.new(data.name, data)
    obj.location = location
    context.objects.link(obj)

poses = [
    ('Arrival port panorama', (0,-15.15,1.7), (-6,-15.15,1.7)),
    ('Passage port', (0,-8.15,1.7), (-4,-8.15,1.8)),
    ('Passage starboard', (0,-8.15,1.7), (4,-8.15,1.8)),
    ('Bow forward', (0,3.4,1.7), (0,10,1.85)),
    ('Bow diagonal port', (-1.5,4,1.7), (-5,8,1.9)),
    ('Bow diagonal starboard', (1.5,4,1.7), (5,8,1.9)),
    ('Bridge port', (-1.4,3.6,1.7), (-5.6,4,1.8)),
    ('Bridge starboard', (1.4,3.6,1.7), (5.6,4,1.8)),
    ('Bow overhead', (.8,4.5,1.7), (.8,4.5,4.5)),
    ('Passage overhead', (.6,-8.15,1.7), (1.3,-8.15,4.5)),
]
cameras = []
for index, (name, eye, target) in enumerate(poses, 1):
    data = bpy.data.cameras.new(f'WINDOW {index:02d} / {name}')
    obj = bpy.data.objects.new(data.name, data)
    context.objects.link(obj)
    obj.location = eye
    obj.rotation_euler = (Vector(target)-Vector(eye)).to_track_quat('-Z','Y').to_euler()
    data.lens = 22
    data.clip_start = .03
    data.clip_end = 1000
    cameras.append(obj)
scene.camera = cameras[3]
scene.render.resolution_x = 960
scene.render.resolution_y = 540
scene.render.resolution_percentage = 100
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene['window_review_limit'] = 'Authoring shells; proposed eye poses, not runtime collision or glass validation'
scene['source_art'] = source.name
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces.active.region_3d.view_perspective = 'CAMERA'
            area.spaces.active.overlay.show_overlays = False
report = {'sources_sha256':hashes, 'scope':scene['window_review_limit'],
          'cameras':[{'name':c.name, 'eye':list(c.location), 'target':list(poses[i][2])}
                     for i,c in enumerate(cameras)],
          'context_objects':len(context.all_objects), 'neutral_glass_slots':neutral_glass_slots,
          'new_runtime_assets':False}
(OUT/'window-composition-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'asterion-window-review.blend'))
if args.render:
    for index in map(int,args.views.split(',')):
        assert 1 <= index <= len(cameras)
        scene.camera = cameras[index-1]
        scene.render.filepath = str(OUT/f'window-{index:02d}.png')
        bpy.ops.render.render(write_still=True)
scene.camera = cameras[3]
assert all(hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==value for p,value in hashes.items())
print('WINDOW_REVIEW_COMPLETE', json.dumps(report))
