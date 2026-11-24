"""Add readable structure and driven actuators to the approved cinematic.

blender --background docs/assets/docking-intro/circular-arrival-polished.blend
  --python scripts/assets/detail-circular-arrival.py [-- --preview]
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
OUT = ROOT/'docs/assets/docking-intro'
SOURCE = Path(bpy.data.filepath)
if SOURCE.name != 'circular-arrival-polished.blend':
    raise RuntimeError('Load circular-arrival-polished.blend before detailing.')
source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
scene = bpy.context.scene
camera = scene.camera
carrier = scene.objects['PAMPA_07_MOTION']
doors = [(sign,scene.objects[f'CIRCULAR_DOOR_{sign}']) for sign in (-1,1)]
reference = {}
tracked = [camera,carrier,*(obj for sign,obj in doors)]
for frame in range(1,241):
    scene.frame_set(frame)
    reference[frame] = [tuple(v for row in obj.matrix_world for v in row) for obj in tracked]
scene.frame_set(240)
scene.name = 'CDS / circular arrival / structural and hydraulic detail'
collection = bpy.data.collections.new('08 / Dock structure and hydraulic actuators')
scene.collection.children.link(collection)
armor = bpy.data.materials['Entrance polish / blue graphite armor']
edge = bpy.data.materials['Entrance polish / brushed machined edges']
dark = bpy.data.materials['Entrance polish / recessed ceramic panels']
ochre = bpy.data.materials['Entrance polish / muted service brass']

def finish(obj,name,material,parent=None,bevel=.008):
    obj.name = 'Dock detail / '+name
    for col in list(obj.users_collection):
        col.objects.unlink(obj)
    collection.objects.link(obj)
    obj.data.materials.append(material)
    if parent:
        obj.parent = parent
    if bevel:
        mod = obj.modifiers.new('Manufactured bevel','BEVEL')
        mod.width,mod.segments = bevel,3
        obj.modifiers.new('Face normals','WEIGHTED_NORMAL')
    return obj

def box(name,position,size,material,parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=position)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(obj,name,material,parent)

def cylinder(name,radius,material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=radius,depth=1)
    return finish(bpy.context.object,name,material,bevel=.005)

def ball(name,position,radius,material,parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=radius,location=position)
    obj = finish(bpy.context.object,name,material,parent,bevel=0)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj

def line_pose(obj,start,end):
    delta = end-start
    obj.location = (start+end)/2
    obj.rotation_euler = delta.to_track_quat('Z','Y').to_euler()
    obj.scale.z = delta.length

def keys(obj,frame):
    for path in ('location','rotation_euler','scale'):
        obj.keyframe_insert(path,frame=frame)

def linear_action(owner):
    if not owner.animation_data or not owner.animation_data.action:
        return
    for layer in owner.animation_data.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:
                        key.interpolation = 'LINEAR'

# Replace only our earlier decorative rods, leaving source mechanisms intact.
for obj in list(scene.objects):
    if obj.name.startswith('Entrance polish / hinge sliding rod'):
        bpy.data.objects.remove(obj,do_unlink=True)

actuators = []
for sign,pivot in doors:
    fixed = Vector((sign*2.05,-24.15,2.4))
    local_tip = Vector((-sign*.60,.10,.45))
    box(f'fixed actuator clevis {sign}',fixed,(.40,.26,.23),armor)
    ball(f'fixed actuator joint {sign}',fixed,.095,edge)
    ball(f'leaf actuator joint {sign}',local_tip,.075,edge,pivot)
    box(f'leaf actuator clevis {sign}',local_tip,(.20,.11,.18),dark,pivot)
    barrel = cylinder(f'hydraulic barrel {sign}',.072,dark)
    rod = cylinder(f'hydraulic chrome rod {sign}',.032,edge)
    collar = cylinder(f'hydraulic barrel collar {sign}',.085,ochre)
    actuators.append((sign,pivot,fixed,local_tip,barrel,rod,collar))

# Grounded side gussets connect the housing to actual nearby hull surfaces.
# Raycasts are authoring aids only; no runtime raycast or geometry is added.
gussets = []
depsgraph = bpy.context.evaluated_depsgraph_get()
for sign in (-1,1):
    for y in (-23.2,-21.9,-20.7):
        hit,point,normal,index,owner,matrix = scene.ray_cast(
            depsgraph,Vector((sign*5,y,1.5)),Vector((-sign,0,0)))
        if not hit:
            raise RuntimeError(f'No housing attachment at {sign}, {y}')
        inner = abs(point.x)-.025
        outer = inner+.34
        hit,ground,normal,index,owner,matrix = scene.ray_cast(
            depsgraph,Vector((sign*(outer+.06),y,1.4)),Vector((0,0,-1)))
        if not hit:
            raise RuntimeError(f'No hull support at {sign}, {y}')
        base = ground.z+.025
        top = max(1.55,base+.65)
        polygon = [(inner,base),(outer,base),(outer,base+.18),(inner+.08,top),(inner,top)]
        vertices = [(sign*x,yy,z) for yy in (y-.10,y+.10) for x,z in polygon]
        n = len(polygon)
        faces = [tuple(reversed(range(n))),tuple(range(n,2*n))]
        faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        mesh = bpy.data.meshes.new('Grounded dock gusset')
        mesh.from_pydata(vertices,[],faces)
        mesh.update()
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
        bm.to_mesh(mesh)
        bm.free()
        obj = bpy.data.objects.new('Dock gusset',mesh)
        collection.objects.link(obj)
        finish(obj,f'grounded gusset {sign} {y}',armor,bevel=.018)
        box(f'gusset foot {sign} {y}',(sign*(inner+.19),y,base+.03),(.45,.38,.08),dark)
        box(f'gusset foot cap {sign} {y}',(sign*(inner+.19),y,base+.075),(.30,.22,.035),edge)
        gussets.append({'side':sign,'y':y,'hullHeight':ground.z,'wallX':sign*inner,'top':top})

# A narrow stepped service plinth follows the sloped support deck rather than
# creating a larger hangar. Its two segments sit between the grounded gussets.
for sign in (-1,1):
    side = sorted([g for g in gussets if g['side']==sign],key=lambda g:g['y'])
    for i,(a,b) in enumerate(zip(side,side[1:])):
        start = Vector((a['wallX']+sign*.19,a['y']+.13,a['hullHeight']+.10))
        end = Vector((b['wallX']+sign*.19,b['y']-.13,b['hullHeight']+.10))
        beam = box(f'lower structural tie {sign} {i}',(0,0,0),(.16,.16,1),armor)
        line_pose(beam,start,end)

label_material = edge.copy()
label_material.name = 'Dock detail / ivory stencil'
shader = next(node for node in label_material.node_tree.nodes if node.type=='BSDF_PRINCIPLED')
shader.inputs['Base Color'].default_value = (.62,.68,.68,1)
shader.inputs['Metallic'].default_value = .1
shader.inputs['Roughness'].default_value = .55
for sign,pivot in doors:
    curve = bpy.data.curves.new('Dock identifier','FONT')
    curve.body = 'DOCK' if sign==-1 else '01'
    curve.size = .30 if sign==-1 else .38
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    curve.extrude = .0005
    obj = bpy.data.objects.new('Dock identifier',curve)
    collection.objects.link(obj)
    obj.parent = pivot
    obj.location = (-sign*1.79+sign*.65,-.115,0)
    obj.rotation_euler = (math.pi/2,0,0)
    obj.name = f'Dock detail / door stencil {sign}'
    curve.materials.append(label_material)

status = bpy.data.materials['Entrance polish / warm entry practical'].copy()
status.name = 'Dock detail / continuous status strip'
status.animation_data_clear()
status.node_tree.animation_data_clear()
status_shader = next(node for node in status.node_tree.nodes if node.type=='BSDF_PRINCIPLED')
status_shader.inputs['Emission Strength'].default_value = 2.2
for obj in scene.objects:
    if obj.name.startswith('Entrance polish / rim warm diffuser') or obj.name.startswith('Circular draft / secured lamp'):
        if obj.data.users>1:
            obj.data = obj.data.copy()
        obj.data.materials.clear()
        obj.data.materials.append(status)

def smoother(value):
    t = max(0,min(1,value))
    return t*t*t*(t*(t*6-15)+10)

green = Vector((.16,.82,.35))
amber = Vector((1,.40,.07))
cyan = Vector((.08,.68,.90))
def status_color(frame):
    if frame<30:
        return green.lerp(amber,smoother((frame-22)/8))
    if frame<66:
        return amber.lerp(cyan,smoother((frame-58)/8))
    if frame<187:
        return cyan.lerp(amber,smoother((frame-179)/8))
    return amber.lerp(green,smoother((frame-230)/10))

moving_meshes = [obj for obj in carrier.children_recursive if obj.type=='MESH']
samples = []
min_clearance = float('inf')
min_hull_clearance = float('inf')
camera_margin = []
extension_lengths = []
for frame in range(1,241):
    scene.frame_set(frame)
    assert [tuple(v for row in obj.matrix_world for v in row) for obj in tracked]==reference[frame], 'Approved animation changed'
    color = (*status_color(frame),1)
    status_shader.inputs['Base Color'].default_value = color
    status_shader.inputs['Emission Color'].default_value = color
    status_shader.inputs['Base Color'].keyframe_insert('default_value',frame=frame)
    status_shader.inputs['Emission Color'].keyframe_insert('default_value',frame=frame)
    bounds = [obj.matrix_world@Vector(v) for obj in moving_meshes for v in obj.bound_box]
    nose,tail = max(v.y for v in bounds),min(v.y for v in bounds)
    craft_x = max(abs(v.x) for v in bounds)
    openness = abs(doors[0][1].rotation_euler.z)/(math.pi/2)
    crossing = nose>=-25.26 and tail<=-24.93
    for sign,pivot,fixed,tip,barrel,rod,collar in actuators:
        moving = pivot.matrix_world@tip
        vector = moving-fixed
        length = vector.length
        direction = vector.normalized()
        assert length>.80, 'Hydraulic barrel is longer than anchor distance'
        barrel_end = fixed+direction*.70
        line_pose(barrel,fixed,barrel_end)
        line_pose(rod,fixed+direction*.62,moving)
        line_pose(collar,fixed+direction*.64,fixed+direction*.72)
        for obj in (barrel,rod,collar):
            keys(obj,frame)
        extension_lengths.append(length-.70)
        # Also check the interval alongside the parked craft during closure.
        # Bounding the entire actuator by its innermost endpoint would falsely
        # count the clevis behind the craft's tail as a collision.
        if abs(vector.y)>.00001:
            t0,t1 = sorted(((tail-.10-fixed.y)/vector.y,(nose+.10-fixed.y)/vector.y))
            t0,t1 = max(0,t0),min(1,t1)
            if t0<=t1:
                hull_clearance = min(sign*(fixed+vector*t).x for t in (t0,t1))-.10-craft_x
                min_hull_clearance = min(min_hull_clearance,hull_clearance)
                assert hull_clearance>.10, 'Actuator approaches the parked craft envelope'
        if crossing:
            # Tube radius + joint radius conservatively bound the swept segment.
            clearance = min(sign*fixed.x,sign*moving.x)-.10-craft_x
            min_clearance = min(min_clearance,clearance)
            assert clearance>.20, 'Actuator enters the craft crossing envelope'
    if crossing:
        assert openness>.999, 'Door is not fully open during crossing'
    samples.append({'frame':frame,'nose':nose,'tail':tail,'openness':openness,'crossing':crossing})
    for x in (-1.85,1.85):
        for z in (.1,3.8):
            point = world_to_camera_view(scene,camera,Vector((x,-25.08,z)))
            camera_margin.append(min(point.x,1-point.x,point.y,1-point.y))

for actuator in actuators:
    for obj in actuator[-3:]:
        linear_action(obj)
linear_action(status.node_tree)
assert min(camera_margin)>.05
assert samples[186]['tail']>-24.93
assert samples[0]['openness']==samples[-1]['openness']==0
assert all(abs(samples[f-1]['openness']-1)<1e-6 for f in range(66,188))
scene.frame_set(240)
scene['detail_revision'] = 'Grounded support ribs; anchor-driven telescopic actuators; continuous status ring and DOCK 01 stencil'
scene.eevee.taa_render_samples = 32
destination = OUT/'circular-arrival-detailed.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(destination))
crossing_frames = [s['frame'] for s in samples if s['crossing']]
result = {'source':SOURCE.name,'revision':destination.name,'sourceSha256':source_hash,
    'sourceUnchanged':hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash,
    'framesChecked':240,'fps':30,'duration':8,'cameraCraftAndDoorMotionUnchanged':True,
    'crossingFrames':[min(crossing_frames),max(crossing_frames)],
    'minimumActuatorClearance':min_clearance,'tailClearanceBeforeClosing':samples[186]['tail']+24.93,
    'minimumActuatorHullClearanceAcrossAllFrames':min_hull_clearance,
    'hydraulicExposedLengthRange':[min(extension_lengths),max(extension_lengths)],
    'groundedGussets':gussets,'minimumCameraMargin':min(camera_margin),
    'status':'green sealed, amber maneuver, cyan open; smooth transitions without flashing',
    'renderSamples':32,'internalParkingIsFictional':True}
(OUT/'circular-arrival-detailed-validation.json').write_text(json.dumps(result,indent=2))
print('VALIDATION',json.dumps(result),flush=True)
if '--preview' in sys.argv:
    scene.render.resolution_percentage = 65
    scene.render.use_compositing = False
    formats = [item.identifier for item in scene.render.image_settings.bl_rna.properties['file_format'].enum_items]
    assert 'PNG' in formats
    scene.render.image_settings.file_format = 'PNG'
    for frame in (1,48,95,187,205,240):
        scene.frame_set(frame)
        scene.render.filepath = str(OUT/f'circular-detailed-review-{frame:03}.png')
        bpy.ops.render.render(write_still=True)
