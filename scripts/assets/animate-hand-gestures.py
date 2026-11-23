"""Author reusable contact-timed gestures without changing the hand mesh master.

Run in background Blender. Mesh/armature data stay linked; local objects own
their animations. Seconds come from the same JSON contract as the app.
"""
from pathlib import Path
from math import radians, pi
import bpy
import json
import hashlib
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/astronaut-hands'
SOURCE = OUT / 'astronaut-hands.blend'
TARGET = OUT / 'hand-gestures.blend'
TIMING = json.loads((ROOT / 'src/game/world/gestureTiming.json').read_text())
TABLET_GRIP = json.loads((OUT / 'tablet-grip.json').read_text())
CONTACT_POSES = json.loads((OUT / 'contact-hand-poses.json').read_text())['poses']
FPS = 100  # Every shared event is represented exactly, never rounded early.
CARD_SIZE = (.086, .0015, .054)
SOURCE_HASH = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.read_factory_settings(use_empty=True)
with bpy.data.libraries.load(str(SOURCE), link=True) as (src, dst):
    dst.collections = ['HAND / Left', 'HAND / Right']
    dst.actions = [mode + '.' + side for mode in ['neutral', 'tablet_hold', 'card_pinch', 'radio_press'] for side in ['L', 'R']]
hand_sources = {c.name: c for c in dst.collections}
with bpy.data.libraries.load(str(ROOT / 'docs/assets/mission-tablet/mission-tablet.blend'), link=True) as (src, dst):
    dst.collections = [n for n in src.collections if n.startswith(('01 Tablet', '02 Protectors', '03 Screen', '04 Static UI'))]
tablet_sources = dst.collections
reports = []
render_views = []

def scene_new(name, duration):
    scene = bpy.data.scenes.new(name)
    bpy.context.window.scene = scene
    scene.render.fps = FPS
    scene.sync_mode = 'FRAME_DROP'
    scene.frame_start = 1
    scene.frame_end = round(duration * FPS) + 1
    scene.unit_settings.system = 'METRIC'
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 12
    scene.cycles.use_denoising = True
    scene.render.threads_mode = 'FIXED'
    scene.render.threads = 2
    scene.render.resolution_x = 900
    scene.render.resolution_y = 650
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene['shared_timing_contract'] = 'src/game/world/gestureTiming.json'
    scene['runtime_integrated'] = False
    world = bpy.data.worlds.new(name + ' studio')
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = (.025, .035, .05, 1)
    bg.inputs['Strength'].default_value = .35
    scene.world = world
    return scene

def add(scene, name, data=None):
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    return obj

def material(name, color, metallic=0, roughness=.6, emission=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Emission Color'].default_value = (*color, 1)
    shader.inputs['Emission Strength'].default_value = emission
    mat.diffuse_color = (*color, 1)
    return mat

dark = material('GESTURE / fixture graphite', (.025,.035,.04), .45, .45)
card_mat = material('GESTURE / credential ivory', (.65,.63,.54), .05, .5)
orange = material('GESTURE / button orange', (.7,.18,.035), .05, .6)
cyan = material('GESTURE / signal cyan', (.03,.6,.8), 0,.5,2)

def box(scene, name, size, mat, location=(0,0,0), parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj=bpy.context.object;obj.name=name;obj.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(mat)
    bevel=obj.modifiers.new('Fixture rounded edge','BEVEL');bevel.width=min(size)*.12;bevel.segments=3
    obj.modifiers.new('Fixture normals','WEIGHTED_NORMAL')
    obj.parent=parent
    return obj

def hand(scene, side, prefix):
    # Object copies own pose animation. Their mesh and armature datablocks remain
    # linked to the single master; geometry changes propagate on reload.
    source=hand_sources['HAND / '+side]
    copies={}
    for original in source.objects:
        obj=original.copy()
        obj.name=prefix+' / '+original.name
        obj.animation_data_clear()
        scene.collection.objects.link(obj)
        copies[original]=obj
    for original,obj in copies.items():
        obj.parent=copies.get(original.parent)
        for modifier in obj.modifiers:
            if modifier.type=='ARMATURE':modifier.object=copies[modifier.object]
    rig=next(o for o in copies.values() if o.type=='ARMATURE')
    skin=next(o for original,o in copies.items() if original.name.startswith('HAND_SURFACE.'))
    assert skin.data.library is not None and rig.data.library is not None
    return rig,skin,copies

def pose(rig, name):
    rig.animation_data_create()
    action=bpy.data.actions[name+'.'+rig.name[-1]]
    rig.animation_data.action=action
    if action.slots:rig.animation_data.action_slot=action.slots[0]
    scene=bpy.context.scene
    scene.frame_set(16);scene.frame_set(15);bpy.context.view_layer.update()
    values={b.name:b.rotation_euler.copy() for b in rig.pose.bones}
    rig.animation_data.action=None
    for name,value in values.items():rig.pose.bones[name].rotation_euler=value
    bpy.context.view_layer.update()
    return values

def action(obj,name):
    obj.animation_data_create()
    clip=bpy.data.actions.new(name);clip.use_fake_user=True
    obj.animation_data.action=clip
    return clip

def frame(seconds):return seconds*FPS+1

def key_transform(obj,t,location,rotation=(0,0,0)):
    obj.location=location;obj.rotation_euler=rotation
    obj.keyframe_insert('location',frame=frame(t))
    obj.keyframe_insert('rotation_euler',frame=frame(t))

def key_pose(rig,t,values):
    for name,value in values.items():
        bone=rig.pose.bones[name];bone.rotation_mode='XYZ';bone.rotation_euler=value
        bone.keyframe_insert('rotation_euler',frame=frame(t),group=name)

def finish_curves(obj):
    clip=obj.animation_data.action
    for layer in clip.layers:
        for strip in layer.strips:
            bag=strip.channelbag(obj.animation_data.action_slot)
            if bag:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:
                        key.interpolation='BEZIER'
                        key.handle_left_type='AUTO_CLAMPED';key.handle_right_type='AUTO_CLAMPED'

def settle_handles(obj,times):
    """Identical eased pressure phase for fingertip root and button travel."""
    clip=obj.animation_data.action
    for layer in clip.layers:
        for strip in layer.strips:
            bag=strip.channelbag(obj.animation_data.action_slot)
            if not bag:continue
            for curve in bag.fcurves:
                if curve.data_path!='location':continue
                keys=curve.keyframe_points
                for i,key in enumerate(keys):
                    if not any(abs(key.co.x-frame(t))<.01 for t in times):continue
                    left=(key.co.x-keys[max(0,i-1)].co.x)/3
                    right=(keys[min(len(keys)-1,i+1)].co.x-key.co.x)/3
                    key.handle_left_type='FREE';key.handle_right_type='FREE'
                    key.handle_left=(key.co.x-left,key.co.y)
                    key.handle_right=(key.co.x+right,key.co.y)

def marker(scene,name,t):scene.timeline_markers.new(name,frame=round(frame(t)))

def studio(scene, camera_position, target, lens=50):
    for name,loc,power,color,size in [
        ('Key',(-.35,-.45,.45),9,(1,.78,.58),.5),
        ('Fill',(.35,-.25,.15),5,(.5,.75,1),.45),
        ('Rim',(0,.35,.3),8,(1,.55,.3),.4),
    ]:
        data=bpy.data.lights.new(scene.name+' '+name,'AREA');data.energy=power;data.color=color;data.shape='DISK';data.size=size
        obj=add(scene,'STUDIO / '+name,data);obj.location=loc
        obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    data=bpy.data.cameras.new(scene.name+' camera');data.lens=lens
    cam=add(scene,'CAM / '+scene.name,data);cam.location=camera_position
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam

def tip_points(rig,skin,name):
    tail=rig.data.bones[name+'.3'].tail_local
    ids=[v.index for v in skin.data.vertices if (v.co-tail).length<.006]
    evaluated=skin.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=evaluated.to_mesh()
    points=[mesh.vertices[i].co.copy() for i in ids]
    evaluated.to_mesh_clear()
    assert points
    return points

def nearest_pair(a,b):return min(((x,y) for x in a for y in b),key=lambda pair:(pair[0]-pair[1]).length)

# Tablet and both hands move as one held assembly, so the raise/lower clips
# never make the device float or drift out of its grips.
for mode in ['raise','lower']:
    duration=TIMING['tablet'][mode]
    scene=scene_new('01 Tablet '+mode,duration)
    root=add(scene,'TABLET_ASSEMBLY / '+mode)
    for collection in tablet_sources:
        obj=add(scene,'TABLET_LINK / '+collection.name)
        obj.instance_type='COLLECTION';obj.instance_collection=collection;obj.parent=root
    for side,sign in [('Left',-1),('Right',1)]:
        rig,skin,_=hand(scene,side,'TABLET_'+mode)
        pose(rig,'tablet_hold');rig.parent=root
        grip=TABLET_GRIP['rigs']['L' if sign<0 else 'R']
        rig.location=grip['location'];rig.rotation_euler=grip['rotationEuler']
        for bone_name,rotation in grip['bones'].items():rig.pose.bones[bone_name].rotation_euler=rotation
        action(rig,'tablet_'+mode+'.grip.'+('L' if sign<0 else 'R'))
        key_pose(rig,0,grip['bones']);key_pose(rig,duration,grip['bones'])
    action(root,'tablet_'+mode+'.assembly')
    resting=((0,0,-.47),(radians(25),0,radians(-3)))
    raised=((0,0,0),(0,0,0))
    if mode=='raise':
        key_transform(root,0,*resting)
        key_transform(root,duration*.75,(0,.012,.006),(radians(-1),0,0))
        key_transform(root,duration,*raised)
    else:
        key_transform(root,0,*raised)
        key_transform(root,duration*.25,(0,.008,-.025),(radians(4),0,radians(-1)))
        key_transform(root,duration,*resting)
    finish_curves(root);marker(scene,'READY' if mode=='raise' else 'LOWERED',duration)
    studio(scene,(.04,-.95,.04),(0,0,-.09),42)
    reports.append({'gesture':'tablet_'+mode,'duration':duration,'clip':root.animation_data.action.name,'deviceAndHandsShareRoot':True,'actionEvent':None})
    render_views.append((scene.name,0 if mode=='lower' else duration,'tablet-'+mode+'-ready'))

# Credential fixture uses plausible physical card dimensions. Runtime still has
# its older oversized prop; geometry conversion is deliberately a later task.
# Calibrate only this gesture rig; the master static pose is untouched.
scene=scene_new('02 Credential present',TIMING['card']['duration'])
rig,skin,_=hand(scene,'Right','CREDENTIAL')
base=pose(rig,'card_pinch')
for name,rotation in CONTACT_POSES['card'].items():
    rig.pose.bones[name].rotation_euler=rotation
    base[name]=rig.pose.bones[name].rotation_euler.copy()
original_index=base['index.2'].x
best=None
for step in range(-30,31):
    rig.pose.bones['index.2'].rotation_euler.x=original_index+radians(step)
    bpy.context.view_layer.update()
    a,b=nearest_pair(tip_points(rig,skin,'index'),tip_points(rig,skin,'thumb'))
    gap=(a-b).length
    score=abs(gap-CARD_SIZE[1])
    if best is None or score<best[0]:best=(score,step,a.copy(),b.copy(),gap)
_,step,a,b,gap=best
rig.pose.bones['index.2'].rotation_euler.x=original_index+radians(step)
variables=[('index.2',0),('thumb.1',2),('thumb.2',0),('thumb.3',0)]
limits={(name,axis):(base[name][axis]-radians(30),base[name][axis]+radians(30)) for name,axis in variables}
score=abs(gap-CARD_SIZE[1])
for increment in [8,4,2,1,.25]:
    for iteration in range(8):
        improved=False
        for name,axis in variables:
            bone=rig.pose.bones[name];current=bone.rotation_euler[axis]
            chosen=(score,current,a,b,gap)
            for direction in [-1,1]:
                candidate=max(limits[(name,axis)][0],min(limits[(name,axis)][1],current+direction*radians(increment)))
                bone.rotation_euler[axis]=candidate;bpy.context.view_layer.update()
                ca,cb=nearest_pair(tip_points(rig,skin,'index'),tip_points(rig,skin,'thumb'))
                cg=(ca-cb).length;cs=abs(cg-CARD_SIZE[1])
                if cs<chosen[0]:chosen=(cs,candidate,ca.copy(),cb.copy(),cg)
            score,value,a,b,gap=chosen;bone.rotation_euler[axis]=value
            improved=improved or abs(value-current)>1e-8
        if not improved or score<.00002:break
    if score<.00002:break
bpy.context.view_layer.update()
assert abs(gap-CARD_SIZE[1])<.0005,('Card pinch needs calibration',gap)
closed={bone.name:bone.rotation_euler.copy() for bone in rig.pose.bones}
bpy.context.view_layer.update()
normal=(a-b).normalized()
xaxis=Vector((1,0,0));xaxis=(xaxis-normal*xaxis.dot(normal)).normalized()
zaxis=xaxis.cross(normal).normalized()
basis=Matrix((xaxis,normal,zaxis)).transposed()
mid=(a+b)*.5
card_center=mid-xaxis*.028+zaxis*.014
card=box(scene,'FIXTURE / Crew credential',CARD_SIZE,card_mat,parent=rig)
card.location=card_center;card.rotation_euler=basis.to_euler()
stripe=box(scene,'FIXTURE / Credential stripe',(.060,.0002,.006),cyan,parent=card)
stripe.location=(0,-CARD_SIZE[1]/2-.0001,.012)
reader=box(scene,'FIXTURE / Reader',(.12,.025,.10),dark)
reader.rotation_euler=basis.to_euler()
reader.location=card_center+normal*(CARD_SIZE[1]/2+.0125)
indicator=box(scene,'FIXTURE / Reader contact LED',(.05,.001,.004),orange,parent=reader)
indicator.location=(0,-.013,-.04)
action(rig,'card_present.rig')
for t in [0,TIMING['card']['holdUntil'],TIMING['card']['duration']]:key_pose(rig,t,closed)
away=-normal*.17+Vector((.04,0,-.12))
for t,pos in [(0,away),(.22,-normal*.10+Vector((.018,0,-.035))),(TIMING['card']['contact'],Vector()),(TIMING['card']['action'],Vector()),(TIMING['card']['holdUntil'],Vector()),(TIMING['card']['duration'],away)]:key_transform(rig,t,pos)
finish_curves(rig)
settle_handles(rig,[0,.22,TIMING['card']['contact'],TIMING['card']['action'],TIMING['card']['holdUntil'],TIMING['card']['duration']])
for name,key in [('CONTACT','contact'),('SCAN_ACTION','action'),('WITHDRAW','holdUntil'),('DONE','duration')]:marker(scene,name,TIMING['card'][key])
studio(scene,(.32,-.65,.25),(0,0,.025),55)
camera_target=card_center+Vector((0,0,-.06))
scene.camera.location=camera_target-normal*.52+Vector((.10,0,.08))
scene.camera.rotation_euler=(camera_target-scene.camera.location).to_track_quat('-Z','Y').to_euler()
scene.camera.data.lens=38
reports.append({'gesture':'card_present','clip':rig.animation_data.action.name,**TIMING['card'],'cardFixtureSize':list(CARD_SIZE),'pinchSurfaceDistance':gap,'pinchThicknessError':abs(gap-CARD_SIZE[1]),'pinchCorrectionRadians':{name+'.'+str(axis):closed[name][axis]-base[name][axis] for name,axis in variables},'readerContactGap':0,'masterPoseChanged':False,'runtimeLegacyPropUnchanged':True})
render_views.extend([(scene.name,.22,'card-approach'),(scene.name,TIMING['card']['contact'],'card-contact')])

# Radio local fixture uses the runtime button size/travel. The index's leading
# skin surface, not its bone tail, is aligned to the button's front plane.
scene=scene_new('03 Radio press',TIMING['radio']['duration'])
rig,skin,_=hand(scene,'Right','RADIO')
pressed=pose(rig,'radio_press')
for name,rotation in CONTACT_POSES['radio'].items():
    rig.pose.bones[name].rotation_euler=rotation
    pressed[name]=rig.pose.bones[name].rotation_euler.copy()
rotation=Matrix.Rotation(-pi/2,3,'X')
points=[rotation@p for p in tip_points(rig,skin,'index')]
leading=max(points,key=lambda p:p.y)
contact=-leading
body=box(scene,'FIXTURE / Radio body',(.8,.25,.4),dark,(0,.1755,.105))
button=box(scene,'FIXTURE / Radio play button',(.075,.045,.058),orange,(0,.0225,0))
screen=box(scene,'FIXTURE / Radio display',(.51,.002,.1275),cyan,(.055,.049,.195))
action(rig,'radio_press.rig')
relaxed={name:value.copy() for name,value in pressed.items()}
relaxed['index.1'].x-=radians(9)
for t,values in [(0,relaxed),(.32,pressed),(TIMING['radio']['release'],pressed),(TIMING['radio']['duration'],relaxed)]:key_pose(rig,t,values)
away=contact+Vector((.12,-.24,-.12))
press=contact+Vector((0,.018,0))
for t,pos in [(0,away),(.23,contact+Vector((.035,-.13,-.025))),(TIMING['radio']['contact'],contact),(TIMING['radio']['action'],press),(TIMING['radio']['release']-.04,press),(TIMING['radio']['release'],contact),(TIMING['radio']['duration'],away)]:key_transform(rig,t,pos,(-pi/2,0,0))
finish_curves(rig)
action(button,'radio_button.fixture')
for t,depth in [(0,0),(TIMING['radio']['contact'],0),(TIMING['radio']['action'],.018),(TIMING['radio']['release']-.04,.018),(TIMING['radio']['release'],0),(TIMING['radio']['duration'],0)]:key_transform(button,t,(0,.0225+depth,0))
finish_curves(button)
pressure_times=[TIMING['radio']['contact'],TIMING['radio']['action'],TIMING['radio']['release']-.04,TIMING['radio']['release']]
settle_handles(rig,pressure_times);settle_handles(button,pressure_times)
for name,key in [('CONTACT','contact'),('PRESS_ACTION','action'),('RELEASE','release'),('DONE','duration')]:marker(scene,name,TIMING['radio'][key])
studio(scene,(.38,-.65,.35),(0,0,0),48)
reports.append({'gesture':'radio_press','clip':rig.animation_data.action.name,**TIMING['radio'],'buttonFixtureSize':[.075,.045,.058],'buttonTravel':.018,'surfaceContactCalibrated':True,'skinContactReference':list(leading)})
render_views.extend([(scene.name,.23,'radio-approach'),(scene.name,TIMING['radio']['contact'],'radio-contact'),(scene.name,TIMING['radio']['action'],'radio-pressed')])

# Derivative authoring scene has no local copies of the hand mesh datablocks.
hand_meshes=[o for o in bpy.data.objects if o.type=='MESH' and ('HAND_SURFACE.' in o.name)]
assert all(o.data.library is not None for o in hand_meshes)
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==SOURCE_HASH
for library in bpy.data.libraries:library.filepath=bpy.path.relpath(library.filepath,start=str(OUT))
bpy.context.window.scene=bpy.data.scenes['01 Tablet raise']
bpy.context.scene.frame_set(round(frame(TIMING['tablet']['raise'])))
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
default=bpy.data.scenes.get('Scene')
if default and not default.objects:bpy.data.scenes.remove(default)
bpy.ops.wm.save_as_mainfile(filepath=str(TARGET))
(OUT/'gesture-contract.json').write_text(json.dumps({'fps':FPS,'timeZeroFrame':1,'timingSource':'../../../src/game/world/gestureTiming.json','timing':TIMING,'sourceMasterSha256':SOURCE_HASH,'handMeshDataLinked':True,'runtimeModelsReplaced':False,'gestures':reports,'renderViews':render_views},indent=2)+'\n')
print('GESTURES_AUTHORED',str(TARGET),flush=True)
