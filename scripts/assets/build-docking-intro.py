"""Run in Blender. Creates an isolated scene; never edits existing ship sources."""
import bpy
import json
import math
import random
import runpy
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/docking-intro'
OUT.mkdir(parents=True, exist_ok=True)
scene = bpy.data.scenes.new('CDS / PAMPA-07 docking master')
bpy.context.window.scene = scene
scene.render.fps = 30
scene.frame_start, scene.frame_end = 1, 241
scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
scene.render.resolution_percentage = 100
scene.unit_settings.system = 'METRIC'
scene.world = bpy.data.worlds.new('Docking / deep space')
scene.world.use_nodes = True
background = next(n for n in scene.world.node_tree.nodes if n.type == 'BACKGROUND')
background.inputs['Color'].default_value = (.009, .015, .028, 1)
background.inputs['Strength'].default_value = .3

def collection(name):
    c = bpy.data.collections.new(name)
    scene.collection.children.link(c)
    return c

ship_col = collection('01 / CRUZ DEL SUR / unchanged source')
pampa_col = collection('02 / PAMPA-07 / animated carrier')
dock_col = collection('03 / Docking adapter and clamps')
stage_col = collection('04 / Camera and preview lighting')

def move_to(o, col):
    for c in list(o.users_collection):
        c.objects.unlink(o)
    col.objects.link(o)

def empty(name, col):
    o = bpy.data.objects.new(name, None)
    col.objects.link(o)
    return o

def material(name, color, metallic=0, rough=.4, emission=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = rough
    p.inputs['Emission Color'].default_value = (*color, 1)
    p.inputs['Emission Strength'].default_value = emission
    return m

steel = material('Dock / titanium', (.18, .23, .28), .8, .3)
dark = material('Dock / graphite seals', (.018, .025, .032), .15, .7)
amber = material('Dock / amber guides', (1, .28, .045), .2, .3, 3)
cyan = material('Dock / connection confirmed', (.04, .85, .55), .1, .25, 0)

def box(name, center, size, mat, col=dock_col, parent=None, bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    o = bpy.context.object
    o.name = name
    o.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    move_to(o, col)
    if parent:
        o.parent = parent
    if bevel:
        mod = o.modifiers.new('Machined edges', 'BEVEL')
        mod.width, mod.segments = bevel, 3
        o.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
    return o

def ring(name, y, z, radius, thickness, mat, parent=None, col=dock_col):
    bpy.ops.mesh.primitive_torus_add(major_segments=64, minor_segments=12,
        location=(0, y, z), rotation=(math.pi/2, 0, 0),
        major_radius=radius, minor_radius=thickness)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    move_to(o, col)
    o.parent = parent
    return o

before = set(scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/models/cruz-del-sur-vestibule-envelope.glb'))
for o in set(scene.objects) - before:
    move_to(o, ship_col)
before = set(scene.objects)
bpy.ops.import_scene.gltf(filepath=str(OUT / 'pampa-07-source.glb'))
carrier = empty('PAMPA_07_MOTION', pampa_col)
for o in set(scene.objects) - before - {carrier}:
    move_to(o, pampa_col)
    if o.parent is None:
        o.parent = carrier
        o.scale *= 6
        o.rotation_euler.z += math.pi
        o.location.z += .35
    o.name = 'PAMPA_07 / source hull'

# Blender Y=-Three Z. The adapter continues the actual aft vestibule, not a
# decorative position on the hull. Its mouth clears the aft hull silhouette.
anchor = empty('DOCK_CDS_CONTACT', dock_col)
anchor.location = (0, -27.5, 1.45)
anchor['vestibule_outer_hatch_three'] = [0, 1.45, 21.125]
anchor['contact_three'] = [0, 1.45, 27.5]
for x in [-1.12, 1.12]:
    box('Pressure tunnel / side', (x, -24.35, 1.45), (.16, 6.3, 2.4), steel)
for z in [.25, 2.65]:
    box('Pressure tunnel / deck', (0, -24.35, z), (2.4, 6.3, .16), steel)
for y in [-21.2, -23.25, -25.4, -27.35]:
    ring('Pressure collar', y, 1.45, 1.19, .13, steel)
ring('Contact gasket', -27.5, 1.45, 1.02, .09, dark)
ring('PAMPA / mating flange', 3.6, 1.45, 1.02, .075, steel, carrier, pampa_col)
ring('PAMPA / pressure seal', 3.51, 1.45, .96, .08, dark, carrier, pampa_col)
for x in [-.9, .9]:
    box('PAMPA / collar support', (x, 3.1, 1.45), (.12, 1, .18), steel,
        pampa_col, carrier)

clamps = []
for i in range(4):
    angle = math.pi/4 + i*math.pi/2
    radial = Vector((math.cos(angle), 0, math.sin(angle)))
    c = box('CLAMP_%02d' % i, (0, -27.58, 1.45), (.32, .42, .3), steel)
    c.rotation_euler.y = -angle
    clamps.append((c, radial))
for x in [-1.5, 1.5]:
    box('Guidance rail', (x, -26.6, 1.45), (.12, 2.1, .12), dark)
    for y in [-25.8, -26.4, -27]:
        box('Dock / approach guide', (x, y, 1.45), (.17, .26, .08), amber, bevel=.02)
    box('Dock / secure lamp', (x, -27.55, 1.45), (.15, .14, .22), cyan, bevel=.02)

runpy.run_path(str(ROOT / 'scripts/assets/refine-docking-mount.py'))[
    'integrate_docking_mount'
](scene)

data = bpy.data.cameras.new('Docking cinematic / 36 mm')
camera = bpy.data.objects.new('CAM_DOCKING', data)
stage_col.objects.link(camera)
scene.camera = camera
data.lens, data.clip_start, data.clip_end = 36, .1, 1500
target = empty('CAM_DOCKING_TARGET', stage_col)

def smooth(t):
    t = max(0, min(1, t))
    return t*t*(3-2*t)

def mix(a, b, t):
    return Vector(a).lerp(Vector(b), t)

def three(v):
    return [round(v[0], 7), round(v[2], 7), round(-v[1], 7)]

samples = []
for frame in range(1, 242):
    t = (frame-1)/30
    # Monotonic axial approach: starts at 4 m/s and settles with zero velocity.
    u = min(t/6, 1)
    y = -43.1 + 12*(2*u-u*u)
    align = smooth(t/3)
    carrier.location = (1.8*(1-align), y, .35*(1-align))
    carrier.rotation_euler = (0, 0, math.radians(-5)*(1-align))
    carrier.keyframe_insert(data_path='location', frame=frame)
    carrier.keyframe_insert(data_path='rotation_euler', frame=frame)
    cam_u = smooth(t/6)
    camera.location = mix((42,-65,24), (12,-38,7.4), cam_u)
    target.location = mix((0,-12,-1.5), (0,-29.3,1.45), cam_u)
    # Single mild contact response; reduced-motion runtime may omit it.
    if 6 <= t <= 6.35:
        camera.location.z += .025*math.sin((t-6)*math.pi*12)*(1-(t-6)/.35)
    camera.rotation_euler = (target.location-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.keyframe_insert(data_path='location', frame=frame)
    camera.keyframe_insert(data_path='rotation_euler', frame=frame)
    target.keyframe_insert(data_path='location', frame=frame)
    closure = smooth((t-6.15)/.7)
    for c, radial in clamps:
        c.location = Vector((0,-27.58,1.45))+radial*(1.4-.32*closure)
        c.keyframe_insert(data_path='location', frame=frame)
    samples.append({'time':t,'pampaPosition':three(carrier.location),
        'pampaYaw':carrier.rotation_euler.z,'cameraPosition':three(camera.location),
        'cameraTarget':three(target.location),'clampClosure':closure})

for mat, values in [(amber, [(1,.3),(91,3),(180,3),(205,.5)]),
                    (cyan, [(1,0),(181,0),(207,3),(241,3)])]:
    p = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    for frame, value in values:
        p.inputs['Emission Strength'].default_value = value
        p.inputs['Emission Strength'].keyframe_insert('default_value', frame=frame)

for name, loc, energy, color, size in [
    ('Key / distant warm sun', (12,-12,28), 18000, (1,.82,.66), 18),
    ('Fill / planet bounce', (-16,-31,10), 12000, (.32,.61,1), 16),
    ('Rim / cold silhouette', (0,18,15), 22000, (.6,.8,1), 12),
    ('Dock / working light', (0,-29,5), 450, (1,.65,.35), 4),
]:
    d = bpy.data.lights.new(name, 'AREA')
    d.energy, d.color, d.shape, d.size = energy, color, 'DISK', size
    o = bpy.data.objects.new(name, d)
    stage_col.objects.link(o)
    o.location = loc
    aim = Vector((0,-20,1))
    o.rotation_euler = (aim-o.location).to_track_quat('-Z','Y').to_euler()
for name, frame in [('01 APPROACH',1),('02 ALIGN',91),('03 CONTACT',181),
                    ('04 CLAMPS LOCKED',207),('05 BLACK / RUNTIME HANDOFF',241)]:
    scene.timeline_markers.new(name, frame=frame)
# Cheap preview-only star shell; runtime should reuse the existing space scene.
rng = random.Random(7)
verts, faces = [], []
for i in range(450):
    axis = Vector((rng.uniform(-1,1),rng.uniform(-1,1),rng.uniform(-1,1))).normalized()
    center = axis*400
    tangent = axis.cross(Vector((0,0,1))).normalized()
    bitangent = axis.cross(tangent).normalized()
    radius = rng.uniform(.055,.18)
    start = len(verts)
    verts.extend([center+tangent*radius, center-tangent*radius+bitangent*radius,
                  center-tangent*radius-bitangent*radius])
    faces.append((start,start+1,start+2))
mesh = bpy.data.meshes.new('Preview star triangles')
mesh.from_pydata(verts, [], faces)
stars = bpy.data.objects.new('PREVIEW ONLY / star field', mesh)
stage_col.objects.link(stars)
mesh.materials.append(material('Preview / starlight', (.65,.8,1), emission=4))
scene['runtime_note'] = 'Blender stage only. Fade, loading gate, reveal, sound and welcome remain runtime responsibilities.'
scene['dock_contact_time'] = 6.0
scene.frame_set(1)
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces.active.region_3d.view_perspective = 'CAMERA'
            area.spaces.active.overlay.show_overlays = False
            area.spaces.active.shading.type = 'MATERIAL'
            area.spaces.active.shading.use_scene_world = True
            area.spaces.active.shading.use_scene_lights = True
bpy.ops.file.pack_all()
bpy.data.libraries.write(str(OUT / 'cruz-del-sur-docking-intro.blend'), {scene}, fake_user=True)
(OUT / 'docking-motion.json').write_text(json.dumps({
    'fps':30,'duration':8,'space':'Three.js Y-up, metres',
    'dockContact':[0,1.45,27.5],'pampaLength':6,
    'events':{'alignment':3,'contact':6,'secured':6.8666667,'black':8},
    'samples':samples}, separators=(',',':')), encoding='utf8')
print(json.dumps({'file':str(OUT / 'cruz-del-sur-docking-intro.blend'),
    'objects':len(scene.objects),'frames':241,'contact_gap':abs((-31.1+3.6)-(-27.5))}))
