"""Polish only the entrance of the approved timed docking cinematic.

blender --background docs/assets/docking-intro/circular-arrival-timed-doors.blend
  --python scripts/assets/polish-circular-arrival.py [-- --preview]

Creates a derivative .blend, never changes the source or live Blender session.
"""
import bpy
import bmesh
import hashlib
import json
import math
import sys
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/docking-intro'
SOURCE = Path(bpy.data.filepath)
if SOURCE.name != 'circular-arrival-timed-doors.blend':
    raise RuntimeError('Load circular-arrival-timed-doors.blend before polishing.')
source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
scene = bpy.context.scene
motion_reference = {}
for frame in (1,30,66,120,187,230,240):
    scene.frame_set(frame)
    motion_reference[frame] = [tuple(value for row in scene.objects[name].matrix_world for value in row)
                              for name in (scene.camera.name,'PAMPA_07_MOTION')]
scene.frame_set(240)
scene.name = 'CDS / circular arrival / integrated titanium entrance'
collection = bpy.data.collections.new('07 / Entrance materials and practicals')
scene.collection.children.link(collection)

def material(name, color, metallic, roughness, texture=False, emission=0):
    mat = bpy.data.materials.new('Entrance polish / '+name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    shader = next(node for node in nodes if node.type == 'BSDF_PRINCIPLED')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Emission Color'].default_value = (*color, 1)
    shader.inputs['Emission Strength'].default_value = emission
    if texture:
        texcoord = nodes.new('ShaderNodeTexCoord')
        mapping = nodes.new('ShaderNodeVectorMath')
        mapping.operation = 'MULTIPLY'
        mapping.inputs[1].default_value = (1, 1, 12)
        links.new(texcoord.outputs['Object'], mapping.inputs[0])
        noise = nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 48
        noise.inputs['Detail'].default_value = 2
        noise.inputs['Roughness'].default_value = .55
        links.new(mapping.outputs['Vector'], noise.inputs['Vector'])
        remap = nodes.new('ShaderNodeMapRange')
        remap.inputs['From Min'].default_value = 0
        remap.inputs['From Max'].default_value = 1
        remap.inputs['To Min'].default_value = roughness-.045
        remap.inputs['To Max'].default_value = roughness+.045
        links.new(noise.outputs['Fac'], remap.inputs['Value'])
        links.new(remap.outputs['Result'], shader.inputs['Roughness'])
        bump = nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = .12
        bump.inputs['Distance'].default_value = .003
        links.new(noise.outputs['Fac'], bump.inputs['Height'])
        links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    return mat

armor = material('blue graphite armor', (.085, .115, .145), .65, .42, True)
door_metal = material('pressure door titanium', (.105, .135, .16), .74, .36, True)
inset = material('recessed ceramic panels', (.046, .061, .073), .4, .5, True)
edge = material('brushed machined edges', (.23, .29, .32), .82, .29, True)
dark = material('recess gaskets', (.009, .014, .018), .05, .72)
warm = material('warm entry practical', (1, .48, .15), .05, .32, emission=3)
cool = material('docking position marker', (.11, .55, .68), .1, .34, emission=1.2)
ochre = material('muted service brass', (.34, .20, .065), .6, .4)

def assign(obj, mat):
    # Meshes and materials elsewhere in the ship remain untouched.
    if obj.data.users > 1:
        obj.data = obj.data.copy()
    obj.data.materials.clear()
    obj.data.materials.append(mat)

for obj in list(scene.objects):
    if obj.type != 'MESH':
        continue
    name = obj.name
    if name.startswith('Circular draft /') or name.startswith('Circular v2 /'):
        if any(tag in name for tag in ('foundation', 'mouth sleeve', 'lower structural')):
            assign(obj, armor)
        elif any(tag in name for tag in ('structural band', 'machined lip', 'hinge strap')):
            assign(obj, edge)
        elif 'pressure door' in name:
            assign(obj, door_metal)
        elif any(tag in name for tag in ('hinge mount', 'fixed bearing')):
            assign(obj, inset)
        elif 'small approach marker' in name:
            assign(obj, warm)
        elif 'secured lamp' in name:
            assign(obj, cool)
        else:
            assign(obj, dark)

def finish(obj, name, mat, parent=None, bevel=.008):
    obj.name = 'Entrance polish / '+name
    for col in list(obj.users_collection):
        col.objects.unlink(obj)
    collection.objects.link(obj)
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    if bevel:
        mod = obj.modifiers.new('Small manufactured edge', 'BEVEL')
        mod.width, mod.segments = bevel, 3
        obj.modifiers.new('Panel normals', 'WEIGHTED_NORMAL')
    return obj

def box(name, location, size, mat, parent=None, bevel=.008):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, parent, bevel)

def fastener(name, location, radius, mat, parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=radius, depth=.012,
                                      location=location, rotation=(math.pi/2,0,0))
    return finish(bpy.context.object, name, mat, parent, .002)

doors = [(sign, scene.objects[f'CIRCULAR_DOOR_{sign}']) for sign in (-1,1)]
for sign, pivot in doors:
    # Low relief half-disc panels move with each leaf, leaving seal edges clear.
    points = [(sign*1.57*math.cos(a)-sign*1.79, 1.57*math.sin(a))
              for a in [-math.pi/2+.06+i*(math.pi-.12)/36 for i in range(37)]]
    verts = [(x,y,z) for y in (-.094,-.072) for x,z in points]
    n = len(points)
    faces = [tuple(reversed(range(n))),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh = bpy.data.meshes.new('Inset pressure panel')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new('Inset panel',mesh)
    collection.objects.link(obj)
    finish(obj, f'leaf inset {sign}', inset, pivot, .008)
    for z in (-.62,.62):
        box(f'leaf reinforcement {sign}',(-sign*1.79+sign*.63,-.109,z),
            (.65,.025,.045),door_metal,pivot,.01)
    for i in range(9):
        angle = -math.pi/2+.13+i*(math.pi-.26)/8
        fastener(f'leaf captive bolt {sign} {i}',
                 (sign*1.67*math.cos(angle)-sign*1.79,-.086,1.67*math.sin(angle)),
                 .026, edge, pivot)
    # Small markings stay below the visual hierarchy of the door seams.
    for i in range(3):
        marker = box(f'service marking {sign} {i}',
            (-sign*1.79+sign*(.44+i*.09),-.111,-.92),(.045,.008,.14),ochre,pivot,.002)
        marker.rotation_euler.y = -.3*sign

# Practical recesses sit behind the front ring, illuminating the tunnel.
# Their housings and lights remain outside the craft's conservative envelope.
for sign in (-1,1):
    box(f'entry lamp housing {sign}',(sign*1.77,-24.45,2.48),
        (.13,.36,.46),inset)
    box(f'entry lamp lens {sign}',(sign*1.735,-24.64,2.48),
        (.065,.035,.31),warm,bevel=.012)
    for y in (-24.13,-22.49):
        fastener(f'front band bolt {sign} {y}',(sign*1.9,y-.09,3.44),.032,edge)
    # Restraint actuators articulate with the existing hinge pivots; their
    # barrel/rod travel is explicit rather than hiding the leaf at either end.
    pivot = dict(doors)[sign]
    box(f'hinge carriage {sign}',(sign*1.79,-24.98,1.95),(.27,.40,.51),inset)
    box(f'hinge sliding rod {sign}',(0,.13,0),(.115,.42,.14),edge,pivot,.012)

box('upper light housing',(0,-24.63,3.69),(.82,.25,.12),inset)
box('upper warm lens',(0,-24.77,3.64),(.63,.025,.045),warm,bevel=.01)

def rim_segment(name, angle, half_angle, radius, width, depth, mat):
    verts = []
    for i in range(9):
        a = angle-half_angle+2*half_angle*i/8
        for r in (radius-width/2,radius+width/2):
            verts.append((r*math.cos(a),depth,1.95+r*math.sin(a)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts,[],[(2*i,2*i+1,2*i+3,2*i+2) for i in range(8)])
    mesh.update()
    obj = bpy.data.objects.new(name,mesh)
    collection.objects.link(obj)
    return finish(obj,name,mat,bevel=0)

for degrees in (45,135,225,315):
    angle = math.radians(degrees)
    rim_segment(f'rim light recess {degrees}',angle,.145,1.825,.075,-25.108,inset)
    rim_segment(f'rim warm diffuser {degrees}',angle,.11,1.825,.025,-25.113,warm)

def area(name, location, target, energy, color, size):
    data = bpy.data.lights.new('Entrance polish / '+name,'AREA')
    data.energy, data.color, data.shape, data.size = energy, color, 'DISK', size
    obj = bpy.data.objects.new(data.name,data)
    collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    return obj

area('overhead warm spill',(0,-24.55,3.5),(0,-25.8,1.1),95,(1,.58,.3),1.3)
area('tunnel reflected fill',(0,-22.3,3.35),(0,-25,1.1),65,(.38,.63,1),1.6)
# Retune the pre-existing local working light only, not the ship's global rig.
working = scene.objects.get('Dock / working light')
if working:
    working.data = working.data.copy()
    working.data.energy = 300
    working.data.size = 4
    working.data.color = (1,.72,.49)

def smoother(value):
    t = max(0.0,min(1.0,value))
    return t*t*t*(t*(t*6-15)+10)

for sign,pivot in doors:
    pivot.animation_data_clear()
samples = []
camera_margin = []
carrier = scene.objects['PAMPA_07_MOTION']
moving_meshes = [obj for obj in carrier.children_recursive if obj.type == 'MESH']
for frame in range(1,241):
    openness = smoother((frame-36)/30)*(1-smoother((frame-187)/35))
    unseated = smoother((frame-30)/6)*(1-smoother((frame-222)/8))
    for sign,pivot in doors:
        pivot.location.y = -25.005-.18*unseated
        pivot.rotation_euler = (0,0,sign*math.pi/2*openness)
        pivot.keyframe_insert('location',frame=frame)
        pivot.keyframe_insert('rotation_euler',frame=frame)
    scene.frame_set(frame)
    if frame in motion_reference:
        current = [tuple(value for row in scene.objects[name].matrix_world for value in row)
                   for name in (scene.camera.name,'PAMPA_07_MOTION')]
        assert current == motion_reference[frame], 'Approved camera or craft motion changed'
    bounds = [obj.matrix_world@Vector(v) for obj in moving_meshes for v in obj.bound_box]
    samples.append({'frame':frame,'openness':openness,'unseated':unseated,
        'noseY':max(v.y for v in bounds),'tailY':min(v.y for v in bounds)})
    for x in (-1.85,1.85):
        for z in (.1,3.8):
            p = world_to_camera_view(scene,scene.camera,Vector((x,-25.08,z)))
            assert p.z>0
            camera_margin.append(min(p.x,1-p.x,p.y,1-p.y))

for sign,pivot in doors:
    for layer in pivot.animation_data.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:
                        key.interpolation = 'LINEAR'

crossing = [s for s in samples if s['noseY']>=-25.26 and s['tailY']<=-24.93]
assert crossing and all(s['openness']>.999 for s in crossing)
assert all(samples[f-1]['openness']==1 for f in range(66,188))
assert samples[186]['tailY']>-24.93
assert samples[0]['openness']==samples[-1]['openness']==0
assert samples[0]['unseated']==samples[-1]['unseated']==0
assert min(camera_margin)>.05
assert all(0<=s['openness']<=1 for s in samples), 'No overshoot or bounce is allowed'
scene.frame_set(100)
moving_x = max(abs((obj.matrix_world@Vector(v)).x) for obj in moving_meshes for v in obj.bound_box)
open_leaf_inner_edge = min(sign*(obj.matrix_world@Vector(v)).x
    for sign,pivot in doors for obj in pivot.children_recursive if obj.type=='MESH'
    for v in obj.bound_box)
open_lateral_clearance = min(1.65,open_leaf_inner_edge)-moving_x
assert open_lateral_clearance>.2
scene.frame_set(240)
scene.eevee.taa_render_samples = 32
scene['door_mechanism'] = 'Axial unseat, articulated quintic swing, final axial seal; no bounce or visibility animation'
scene['sequence_frames'] = 'unseat30-36; swing36-66; open66-187; close187-222; seat222-230'
scene['delivery_render_samples'] = 32
destination = OUT/'circular-arrival-polished.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(destination))
result = {'source':SOURCE.name,'revision':destination.name,'sourceSha256':source_hash,
    'sourceUnchanged':hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash,
    'framesChecked':240,'fps':30,'duration':8,'cameraAndCraftMotionUnchanged':True,
    'openingUnseat':[30,36],'openingSwing':[36,66],'fullyOpen':[66,187],
    'closingSwing':[187,222],'closingSeat':[222,230],'axialTravel':.18,
    'crossingFrames':[crossing[0]['frame'],crossing[-1]['frame']],
    'tailClearanceBeforeClosing':samples[186]['tailY']+24.93,
    'openLateralClearance':open_lateral_clearance,'minimumCameraMargin':min(camera_margin),
    'swingCurve':'quintic smoothstep, zero endpoint velocity and acceleration',
    'additionalOfflineLights':2,'renderSamples':32,'internalParkingIsFictional':True}
(OUT/'circular-arrival-polished-validation.json').write_text(json.dumps(result,indent=2))
print('VALIDATION',json.dumps(result),flush=True)
if '--preview' in sys.argv:
    scene.render.resolution_percentage = 65
    scene.render.use_compositing = False
    formats = [item.identifier for item in scene.render.image_settings.bl_rna.properties['file_format'].enum_items]
    assert 'PNG' in formats
    scene.render.image_settings.file_format = 'PNG'
    for frame in (1,48,95,187,205,240):
        scene.frame_set(frame)
        scene.render.filepath = str(OUT/f'circular-polished-review-{frame:03}.png')
        bpy.ops.render.render(write_still=True)
