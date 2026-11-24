"""Refine the approved short circular arrival, preserving its source .blend.

blender --background docs/assets/docking-intro/circular-arrival-draft.blend
  --python scripts/assets/refine-circular-arrival.py [-- --preview]
"""
import bpy
import json
import math
import sys
import hashlib
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/docking-intro'
SOURCE = Path(bpy.data.filepath)
if SOURCE.name != 'circular-arrival-draft.blend':
    raise RuntimeError('Load the approved circular-arrival-draft.blend source.')
source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
scene = bpy.context.scene
scene.frame_set(240)
scene.name = 'CDS / circular arrival / timed sealed doors'
camera = scene.camera
carrier = scene.objects['PAMPA_07_MOTION']
camera.animation_data_clear()
camera.data.animation_data_clear()
carrier.animation_data_clear()

def smooth(t):
    t = max(0.0, min(1.0, t))
    return t*t*(3-2*t)

def linear_keys(obj):
    action = obj.animation_data.action
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:
                        key.interpolation = 'LINEAR'

# A complete seal sits behind the machined rim. The leaves remain real meshes
# throughout: no visibility, scale or material opacity animation.
doors = []
for sign in (-1, 1):
    pivot = scene.objects[f'CIRCULAR_DOOR_{sign}']
    pivot.animation_data_clear()
    pivot.location = (sign*1.79, -25.005, 1.95)
    leaf = next(o for o in pivot.children if o.type == 'MESH')
    # Original leaf mesh is expressed relative to its outboard hinge.
    for vertex in leaf.data.vertices:
        vertex.co.x *= 1.79/1.7
        vertex.co.z *= 1.79/1.7
    for mod in leaf.modifiers:
        if mod.type == 'BEVEL':
            mod.width = min(mod.width, .009)
    doors.append((sign, pivot, leaf))

metal = bpy.data.materials['Circular draft / original titanium']
dark = bpy.data.materials['Circular draft / graphite lining']
collection = doors[0][1].users_collection[0]

def box(name, center, dimensions, material, parent=None, bevel=.01):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for col in list(obj.users_collection):
        col.objects.unlink(obj)
    collection.objects.link(obj)
    obj.data.materials.append(material)
    if parent:
        obj.parent = parent
    if bevel:
        mod = obj.modifiers.new('Machined edge', 'BEVEL')
        mod.width, mod.segments = bevel, 2
        obj.modifiers.new('Face normals', 'WEIGHTED_NORMAL')
    return obj

# Narrow overlap tongue on the rear of the right leaf blocks light through the
# central seam while leaving an intentional hairline on the visible face.
box('Circular v2 / central overlap seal', (-1.79, .075, 0),
    (.075, .045, 3.43), dark, doors[1][1], .005)
for sign, pivot, leaf in doors:
    # Visible moving hinge strap and fixed bearing: helps read the opening arc.
    box(f'Circular v2 / hinge strap {sign}', (-sign*.17, -.085, 0),
        (.38, .055, .20), metal, pivot)
    for height in (1.79, 2.11):
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=.085, depth=.12,
            location=(sign*1.79, -25.005, height))
        bearing = bpy.context.object
        bearing.name = f'Circular v2 / fixed bearing {sign}'
        bearing.data.materials.append(dark)

samples = []
camera_margins = []
moving_meshes = [obj for obj in carrier.children_recursive if obj.type == 'MESH']
assert moving_meshes, 'Missing arrival craft geometry'
for frame in range(1, 241):
    # Gentle dolly, ending with context around the bay instead of a tight zoom.
    dolly = smooth((frame-1)/220)
    camera.location = Vector((34, -61, 19)).lerp(Vector((17, -45, 10.5)), dolly)
    target = Vector((0, -22, 1.0))
    camera.rotation_euler = (target-camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.lens = 36
    camera.keyframe_insert('location', frame=frame)
    camera.keyframe_insert('rotation_euler', frame=frame)
    # Uniform approach blends into braking; door is fully open before crossing.
    progress = (frame-1)/174
    progress = max(0, min(1, progress))
    advance = 1-(1-progress)**1.65
    carrier.location = (0, -43.5 + 21.9*advance, .535)
    carrier.keyframe_insert('location', frame=frame)
    openness = smooth((frame-30)/36) * (1-smooth((frame-187)/38))
    for sign, pivot, leaf in doors:
        pivot.rotation_euler = (0, 0, sign*math.pi/2*openness)
        pivot.keyframe_insert('rotation_euler', frame=frame)
    scene.frame_set(frame)
    bounds = [obj.matrix_world @ Vector(v) for obj in moving_meshes for v in obj.bound_box]
    mouth_corners = [Vector((x, -25.08, z)) for x in (-1.85, 1.85) for z in (.1, 3.8)]
    for corner in mouth_corners:
        projected = world_to_camera_view(scene, camera, corner)
        assert projected.z > 0, 'Dock is behind the camera'
        camera_margins.append(min(projected.x, 1-projected.x, projected.y, 1-projected.y))
    samples.append({'frame':frame, 'openness':openness,
                    'noseY':max(v.y for v in bounds),
                    'tailY':min(v.y for v in bounds)})

for obj in [camera, carrier, *(entry[1] for entry in doors)]:
    linear_keys(obj)
crossing = [s for s in samples if s['noseY'] >= -25.08 and s['tailY'] <= -24.93]
assert crossing and all(s['openness'] > .999 for s in crossing), 'Door closes during crossing'
assert samples[186]['tailY'] > -24.93, 'Tail has not cleared before closing'
assert samples[0]['openness'] == 0 and samples[-1]['openness'] == 0
assert min(camera_margins) > .05, 'Dock is cropped by the camera'
scene.frame_set(100)
moving_x = max(abs((obj.matrix_world @ Vector(v)).x) for obj in moving_meshes for v in obj.bound_box)
# Both open leaves stand along +/-X; their thickness and hinge straps are kept
# outside this conservative passage envelope.
open_door_clearance = 1.79-.10-moving_x
assert open_door_clearance > .2, 'Open leaf or hinge intrudes into craft envelope'
scene.frame_set(240)
scene['door_mechanism'] = 'Two visible hinged semicircular pressure leaves; closed overlap tongue and rim overlap'
scene['sequence_frames'] = 'closed 1-30; opening 30-66; open 66-187; closing 187-225; sealed 225-240'
scene['internalParkingIsFictional'] = True
scene.render.resolution_x, scene.render.resolution_y = 1280, 720
scene.render.resolution_percentage = 100
scene.render.fps = 30
scene.frame_start, scene.frame_end = 1, 240
destination = OUT/'circular-arrival-timed-doors.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(destination))
result = {'source':SOURCE.name, 'revision':destination.name,
          'sourceSha256':source_hash, 'sourceUnchanged':hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash,
          'frames':240, 'fps':30, 'opening':[30,66], 'closing':[187,225],
          'crossingFrames':[crossing[0]['frame'], crossing[-1]['frame']],
          'tailClearanceBeforeClosing':samples[186]['tailY']-(-24.93),
          'movingMeshesChecked':[obj.name for obj in moving_meshes],
          'openDoorLateralClearance':open_door_clearance,
          'minimumMouthCameraMargin':min(camera_margins),
          'leafRadius':1.79,'mouthRadius':1.7,'radialOverlap':.09,
          'centerSealOverlap':.075,'cameraStart':[34,-61,19],'cameraEnd':[17,-45,10.5],
          'mechanism':'hinged leaves, no visibility/scale animation',
          'internalParkingIsFictional':True}
(OUT/'circular-arrival-timed-validation.json').write_text(json.dumps(result,indent=2))
print('VALIDATION',json.dumps(result),flush=True)
if '--preview' in sys.argv:
    scene.render.resolution_percentage = 65
    scene.eevee.taa_render_samples = 8
    scene.render.use_compositing = False
    scene.render.image_settings.file_format = 'PNG'
    for frame in (1,48,95,187,205,240):
        scene.frame_set(frame)
        scene.render.filepath = str(OUT/f'circular-timed-review-{frame:03}.png')
        bpy.ops.render.render(write_still=True)
