"""Bake the approved, immutable Asterion scene into a static runtime exterior.

Run with Blender --background --python this-file -- [--samples 16].
Cached display-referred maps live outside public; reruns do not repeat bakes.
"""
import argparse
import hashlib
import json
import math
import sys
import runpy
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'docs/assets/cosmos/asterion-expanse-v2.blend'
CACHE = ROOT / 'docs/assets/cosmos/runtime-export'
PUBLIC = ROOT / 'public/textures/asterion'
MODEL = ROOT / 'public/models/asterion-worlds.glb'
args = argparse.ArgumentParser()
args.add_argument('--samples', type=int, default=16)
options = args.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
for path in (CACHE, PUBLIC, MODEL.parent):
    path.mkdir(parents=True, exist_ok=True)
source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
stamp = CACHE / 'source.sha256'
if stamp.exists() and stamp.read_text().strip() != source_hash:
    raise RuntimeError('Source changed; review and explicitly remove obsolete bake cache.')
stamp.write_text(source_hash)
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = options.samples
scene.cycles.device = 'GPU'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'OPTIX'
prefs.get_devices()
for device in prefs.devices:
    device.use = device.type != 'CPU'
scene.render.bake.margin = 8
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.color_depth = '8'
meshes = [o for o in scene.objects if o.type == 'MESH']
atmospheres = [o for o in meshes if o.name.endswith('/ atmosphere')]
rocks = [o for o in meshes if o.name.startswith('DEBRIS')]
rings = next(o for o in meshes if 'rings with' in o.name)
bodies = [o for o in meshes if o not in atmospheres and o not in rocks and o != rings]


def three(v):
    return [v[0], v[2], -v[1]]


def radius(obj):
    return max(v.co.length for v in obj.data.vertices) * max(obj.scale)


def select(objects):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]


def bake(objects, name, width, height, kind='COMBINED'):
    path = CACHE / (name + '.png')
    print('ASTERION_BAKE', name, 'cached' if path.exists() else 'start', flush=True)
    if path.exists():
        return bpy.data.images.load(str(path), check_existing=True)
    target = bpy.data.images.new(name, width=width, height=height, alpha=True, float_buffer=True)
    for mat in {slot.material for obj in objects for slot in obj.material_slots}:
        node = mat.node_tree.nodes.new('ShaderNodeTexImage')
        node.image = target
        mat.node_tree.nodes.active = node
    select(objects)
    bpy.ops.object.bake(type=kind, use_clear=True)
    target.save_render(str(path), scene=scene)
    return bpy.data.images.load(str(path), check_existing=True)


def unlit(name, image, alpha=False):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    n, l = mat.node_tree.nodes, mat.node_tree.links
    n.clear()
    out = n.new('ShaderNodeOutputMaterial')
    tex = n.new('ShaderNodeTexImage')
    tex.image = image
    emit = n.new('ShaderNodeEmission')
    l.new(tex.outputs['Color'], emit.inputs['Color'])
    if alpha:
        transparent = n.new('ShaderNodeBsdfTransparent')
        mix = n.new('ShaderNodeMixShader')
        l.new(tex.outputs['Alpha'], mix.inputs[0])
        l.new(transparent.outputs[0], mix.inputs[1])
        l.new(emit.outputs[0], mix.inputs[2])
        l.new(mix.outputs[0], out.inputs[0])
        mat.surface_render_method = 'DITHERED'
    else:
        l.new(emit.outputs[0], out.inputs[0])
    mat.use_backface_culling = False
    return mat


def runtime_image(image, width):
    """Keep high-resolution bake cache; ship only the observed angular resolution."""
    if image.size[0] <= width:
        return image
    result = image.copy()
    result.scale(width, round(image.size[1] * width / image.size[0]))
    return result


# A camera-centred sky only. Bodies remain real geometry for window parallax.
sky = PUBLIC / 'sky.webp'
if not sky.exists():
    for obj in meshes:
        obj.hide_render = True
    camera_data = bpy.data.cameras.new('Runtime sky panorama')
    camera_data.type = 'PANO'
    camera_data.panorama_type = 'EQUIRECTANGULAR'
    camera = bpy.data.objects.new('Runtime sky panorama', camera_data)
    scene.collection.objects.link(camera)
    camera.rotation_euler = Vector((0, 1, 0)).to_track_quat('-Z', 'Y').to_euler()
    scene.camera = camera
    scene.render.resolution_x = 4096
    scene.render.resolution_y = 2048
    scene.render.resolution_percentage = 100
    scene.cycles.samples = 8
    scene.render.image_settings.file_format = 'WEBP'
    scene.render.image_settings.quality = 92
    scene.render.filepath = str(sky)
    bpy.ops.render.render(write_still=True)
    for obj in meshes:
        obj.hide_render = False
scene.cycles.samples = options.samples
scene.render.image_settings.file_format = 'PNG'
for obj in atmospheres:
    obj.hide_render = True

export_objects = []
for obj in bodies:
    label = obj.name.split(' / ')[0].lower()
    if label == 'orison' and 'companion' in obj.name:
        label = 'orison-companion'
    size = 2048 if label in ('vesper', 'ithaca', 'nacre', 'orison') else 1024
    image = bake([obj], label, size, size // 2)
    local_radius = max(v.co.length for v in obj.data.vertices)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96 if size == 2048 else 64, ring_count=48 if size == 2048 else 32, radius=local_radius)
    proxy = bpy.context.object
    proxy.name = 'ASTERION / ' + obj.name
    proxy.matrix_world = obj.matrix_world.copy()
    for polygon in proxy.data.polygons:
        polygon.use_smooth = True
    shipped_width = 512 if label in ('halo', 'selene', 'orison-companion') else 1024 if label == 'nacre' else size
    proxy.data.materials.append(unlit('ASTERION / ' + label, runtime_image(image, shipped_width)))
    proxy.hide_render = True
    export_objects.append(proxy)

# Ring color and optical depth are baked separately: never multiply opacity twice.
uv = rings.data.uv_layers.new(name='Runtime planar ring UV')
extent = max(max(abs(v.co.x), abs(v.co.y)) for v in rings.data.vertices)
for loop in rings.data.loops:
    co = rings.data.vertices[loop.vertex_index].co
    uv.data[loop.index].uv = (co.x / (2 * extent) + .5, co.y / (2 * extent) + .5)
mat = rings.data.materials[0]
nodes, links = mat.node_tree.nodes, mat.node_tree.links
output = next(n for n in nodes if n.type == 'OUTPUT_MATERIAL')
optical = output.inputs[0].links[0].from_node
scatter = optical.inputs[2].links[0].from_socket
depth = optical.inputs[0].links[0].from_socket
links.new(scatter, output.inputs[0])
ring_color = bake([rings], 'nacre-ring-color', 2048, 2048)
alpha_path = CACHE / 'nacre-ring-alpha.npy'
if not alpha_path.exists():
    emit = nodes.new('ShaderNodeEmission')
    links.new(depth, emit.inputs['Color'])
    links.new(emit.outputs[0], output.inputs[0])
    target = bpy.data.images.new('Ring linear optical depth', width=2048, height=2048, alpha=True, float_buffer=True)
    node = nodes.new('ShaderNodeTexImage'); node.image = target; nodes.active = node
    select([rings]); bpy.ops.object.bake(type='EMIT', use_clear=True)
    pixels = np.empty(2048 * 2048 * 4, np.float32); target.pixels.foreach_get(pixels)
    np.save(alpha_path, pixels.reshape(-1, 4)[:, 0])
links.new(optical.outputs[0], output.inputs[0])
pixels = np.empty(2048 * 2048 * 4, np.float32); ring_color.pixels.foreach_get(pixels)
pixels.reshape(-1, 4)[:, 3] = np.load(alpha_path)
ring_color.pixels.foreach_set(pixels)
ring_color.filepath_raw = str(CACHE / 'nacre-rings.png'); ring_color.file_format = 'PNG'; ring_color.save()
proxy = rings.copy()
# Preserve every radial slit; 128 angular samples suffice for this distant disk.
vertices, faces = [], []
for band in range(len(rings.data.vertices) // 512):
    base = len(vertices)
    vertices.extend(tuple(rings.data.vertices[band * 512 + row * 256 + i * 2].co) for row in range(2) for i in range(128))
    faces.extend((base + i, base + (i + 1) % 128, base + 128 + (i + 1) % 128, base + 128 + i) for i in range(128))
proxy.data = bpy.data.meshes.new('Nacre runtime separated radial bands')
proxy.data.from_pydata(vertices, [], faces)
uv = proxy.data.uv_layers.new(name='Runtime planar ring UV')
for loop in proxy.data.loops:
    co = proxy.data.vertices[loop.vertex_index].co
    uv.data[loop.index].uv = (co.x / (2 * extent) + .5, co.y / (2 * extent) + .5)
scene.collection.objects.link(proxy)
proxy.name = 'ASTERION / Nacre rings'; proxy.data.materials.clear()
proxy.data.materials.append(unlit('ASTERION / Nacre prelit rings', runtime_image(ring_color, 1024), True))
proxy.hide_render = True; export_objects.append(proxy)

# One atlas and one draw call for the authored debris field.
for index, obj in enumerate(rocks):
    obj.data = obj.data.copy()
    coordinates_attribute = obj.data.attributes.new('source_generated', 'FLOAT_VECTOR', 'POINT')
    minimum = Vector((min(v.co[i] for v in obj.data.vertices) for i in range(3)))
    maximum = Vector((max(v.co[i] for v in obj.data.vertices) for i in range(3)))
    for vertex in obj.data.vertices:
        coordinates_attribute.data[vertex.index].vector = [(vertex.co[i] - minimum[i]) / (maximum[i] - minimum[i]) for i in range(3)]
    uv = obj.data.uv_layers.new(name='Runtime debris atlas')
    for polygon in obj.data.polygons:
        coordinates = []
        for li in polygon.loop_indices:
            p = obj.data.vertices[obj.data.loops[li].vertex_index].co.normalized()
            coordinates.append([math.atan2(p.y, p.x) / math.tau + .5, math.asin(max(-1, min(1, p.z))) / math.pi + .5])
        if max(p[0] for p in coordinates) - min(p[0] for p in coordinates) > .5:
            for p in coordinates:
                if p[0] < .5: p[0] += 1
        for li, p in zip(polygon.loop_indices, coordinates):
            uv.data[li].uv = ((index % 16 + .04 + p[0] * .46) / 16, (index // 16 + .04 + p[1] * .92) / 10)
copies = []
source_rock_material = rocks[0].data.materials[0].copy()
nodes, links = source_rock_material.node_tree.nodes, source_rock_material.node_tree.links
attribute = nodes.new('ShaderNodeAttribute'); attribute.attribute_name = 'source_generated'
for node in list(nodes):
    if node.type == 'TEX_COORD':
        for link in list(node.outputs['Generated'].links):
            links.new(attribute.outputs['Vector'], link.to_socket)
for obj in rocks:
    proxy = obj.copy(); proxy.data = obj.data.copy(); scene.collection.objects.link(proxy)
    proxy.data.materials.clear(); proxy.data.materials.append(source_rock_material)
    copies.append(proxy)
    obj.hide_render = True
select(copies); bpy.ops.object.join()
debris = bpy.context.object; debris.name = 'ASTERION / debris field'
image = bake([debris], 'debris-atlas', 2048, 1024)
debris.data.materials.clear(); debris.data.materials.append(unlit('ASTERION / prelit debris', runtime_image(image, 1024)))
modifier = debris.modifiers.new('Runtime silhouette reduction', 'DECIMATE'); modifier.ratio = .35
bpy.ops.object.modifier_apply(modifier=modifier.name)
export_objects.append(debris)

runtime = bpy.data.scenes.new('Asterion runtime export')
for obj in export_objects:
    runtime.collection.objects.link(obj)
    obj.hide_render = False
bpy.context.window.scene = runtime
bpy.ops.export_scene.gltf(filepath=str(MODEL), export_format='GLB', use_active_scene=True, export_animations=False, export_cameras=False, export_lights=False, export_yup=True, export_extras=False, export_image_format='WEBP', export_image_quality=90)
corners = [Vector(three(obj.matrix_world @ Vector(corner))) for obj in export_objects for corner in obj.bound_box]
sun = Vector((.9, .28, -.35)).normalized()
manifest = {
    'model': '/models/asterion-worlds.glb', 'sky': '/textures/asterion/sky.webp',
    'skyRotationY': math.pi / 2, 'sunDirection': list(sun),
    'ringMaterial': 'ASTERION / Nacre prelit rings',
    'boundsMin': [min(v[i] for v in corners) for i in range(3)],
    'boundsMax': [max(v[i] for v in corners) for i in range(3)],
    'bodies': [{'name':o.name, 'position':three(o.location), 'radius':radius(o)} for o in bodies],
    'atmosphere': [{'name':o.name, 'position':three(o.location), 'radius':radius(o), 'color':list(next(n for n in o.data.materials[0].node_tree.nodes if n.type == 'EMISSION').inputs['Color'].default_value)[:3], 'strength':.28} for o in atmospheres],
}
(ROOT / 'src/game/world/asterionManifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
textures = {n.image for o in export_objects for m in o.data.materials for n in m.node_tree.nodes if n.type == 'TEX_IMAGE'}
pixels = 4096 * 2048 + sum(image.size[0] * image.size[1] for image in textures)
audit = dict(manifest, sourceSha256=source_hash, bytes={'model':MODEL.stat().st_size,'gzip':0,'sky':sky.stat().st_size}, samples=options.samples, texturePixels=pixels, estimatedRgba8MipBytes=round(pixels * 4 * 4 / 3), textures=[{'name':image.name,'size':list(image.size)} for image in textures])
(CACHE / 'export-audit.json').write_text(json.dumps(audit, indent=2) + '\n')
runpy.run_path(str(ROOT / 'scripts/assets/export-asterion-finalize.py'))['finalize'](MODEL)
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == source_hash
print('ASTERION_EXPORT', (CACHE / 'export-audit.json').read_text())
