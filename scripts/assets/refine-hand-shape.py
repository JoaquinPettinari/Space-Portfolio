"""One authoring pass: anatomical glove pads and less uniform tablet grasp.

Run against astronaut-hands.blend. Preserves bones and non-tablet actions.
"""
from pathlib import Path
from math import sin, cos, pi, radians
import shutil, json
import bpy
from mathutils import Vector

out = Path(bpy.data.filepath).parent
assert out.name == 'astronaut-hands'
assert not bpy.context.scene.get('natural_fingers_v2'), 'Pass already applied'
backup = out / 'astronaut-hands-before-natural-fingers.blend'
if not backup.exists():
    shutil.copy2(bpy.data.filepath, backup)
scene = bpy.context.scene

def cushion(obj, center, axis, width, length, thickness, bone):
    """Soft oblong reinforcement with feathered edges, not a beveled box."""
    axis = Vector(axis).normalized()
    normal = Vector((0, -1, 0))
    normal = (normal - axis * normal.dot(axis)).normalized()
    cross = axis.cross(normal).normalized()
    verts, faces = [], []
    # Rounded poles and a gently crowned surface; no flat rectangular end caps.
    for i in range(13):
        theta = pi * (.012 + .976 * i / 12)
        z = cos(theta) * length / 2
        profile = sin(theta) ** .65
        for j in range(20):
            a = 2*pi*j/20
            p = center + axis*z + cross*(cos(a)*width*.5*profile) + normal*(sin(a)*thickness*.5*profile)
            verts.append(p)
    for i in range(12):
        for j in range(20):
            faces.append((i*20+j, i*20+(j+1)%20, (i+1)*20+(j+1)%20, (i+1)*20+j))
    faces.extend([tuple(reversed(range(20))), tuple(range(240,260))])
    mesh = bpy.data.meshes.new(obj.name+' / soft contour')
    mesh.from_pydata(verts, [], faces); mesh.update()
    mesh.materials.append(bpy.data.materials['HAND / Reinforced finger pads'])
    for p in mesh.polygons:p.use_smooth=True
    old = obj.data; obj.data = mesh
    obj.modifiers.clear(); obj.vertex_groups.clear()
    vg=obj.vertex_groups.new(name=bone);vg.add(list(range(len(verts))),1,'REPLACE')
    mod=obj.modifiers.new('Reusable hand skinning','ARMATURE');mod.object=obj.parent
    sub=obj.modifiers.new('Soft padded surface','SUBSURF');sub.levels=1;sub.render_levels=1
    if old.users == 0:bpy.data.meshes.remove(old)

report=[]
for side,sign in [('Left',1),('Right',-1)]:
    suffix=side[0]; col=bpy.data.collections['HAND / '+side]
    scene.collection.children.link(col)
    rig=bpy.data.objects['HAND_RIG.'+suffix]
    surface=bpy.data.objects['HAND_SURFACE.'+suffix]
    assert len(surface.data.vertices)==2242
    # Keep the same indexed skin and groups. Shape cross-sections around each
    # finger centre; avoid altering the rig or the already calibrated pinch.
    start=912
    for f,name in enumerate(['index','middle','ring','pinky','thumb']):
        for ring in range(19):
            indices=list(range(start+f*266+ring*14,start+f*266+(ring+1)*14))
            center=sum((surface.data.vertices[i].co for i in indices),Vector())/14
            t=ring/18
            # Proximal knuckle fuller, distal shaft tapers; rounded fingertip.
            factor=(1.02-.12*t)+.05*sin(pi*t*3)**2
            if ring==17:factor=1.12
            if ring==18:factor=1.5
            for index in indices:
                v=surface.data.vertices[index]
                v.co.x=center.x+(v.co.x-center.x)*factor
                v.co.y=center.y+(v.co.y-center.y)*(factor*.97)
        for segment in range(3):
            bone=rig.data.bones[f'{name}.{segment+1}']
            center=bone.head_local.lerp(bone.tail_local,.52)
            # Embed the reinforcement skirt into the glove instead of placing
            # a separate plate above the surface (especially at distal joints).
            center.y-=.0063
            obj=bpy.data.objects[f'Grip pad {name}{segment}.{suffix}']
            cushion(obj,center,bone.tail_local-bone.head_local,
                    .014 if name!='pinky' else .012,
                    bone.length*.63,.0032,f'{name}.{segment+1}')
    obj=bpy.data.objects['Dorsal metacarpal pad.'+suffix]
    cushion(obj,Vector((0,-.023,.050)),(0,0,1),.053,.048,.0045,'wrist')
    # Existing three block seams become understated seams rather than rails.
    for obj in col.objects:
        if obj.name.startswith('Backhand seam'):
            for v in obj.data.vertices:
                v.co.x*=.72
                v.co.y=-.025+(v.co.y+.029)*.35
        if obj.name.startswith('Dorsal double stitching'):
            for v in obj.data.vertices:
                v.co.x*=.70*cos((v.co.z-.047)/.04*1.2)
                v.co.y=-.0245+(v.co.y+.028)*.4
        if obj.name.startswith('Sleeve stitched seam'):
            for v in obj.data.vertices:
                # Follow the elliptical sleeve section and its existing folds.
                t=max(0.,min(1.,(v.co.z+.225)/.196))
                radius=.048-t*.014+.0025*sin(t*pi*12)**2
                cx=sign*.004*sin(t*pi);cy=.005*sin(t*pi)
                x=(v.co.x-cx)/radius
                v.co.y=cy-radius*.82*max(0.,1-x*x)**.5-.00035
    # Variable curl gives each finger a distinct pressure/length relationship.
    rig.animation_data.action=bpy.data.actions['tablet_hold.'+suffix]
    scene.frame_set(16);scene.frame_set(15)
    for name,angles in {'index':[3,10,25], 'middle':[5,12,25], 'ring':[6,14,30], 'pinky':[8,17,32]}.items():
        # At the assembly wrist Y=.010, a fingertip centre Y=.0155 puts
        # its ~7.5 mm padded front surface on the tablet rear at Y=.018.
        low,high=0.,2.
        for iteration in range(24):
            scale=(low+high)/2
            for i,a in enumerate(angles):rig.pose.bones[f'{name}.{i+1}'].rotation_euler.x=-radians(a)*scale
            bpy.context.view_layer.update()
            if rig.pose.bones[f'{name}.3'].tail.y < .0155:low=scale
            else:high=scale
    for pb in rig.pose.bones:
        for frame in [1,15,30]:pb.keyframe_insert(data_path='rotation_euler',frame=frame,group=pb.name)
    scene.frame_set(16);scene.frame_set(15);bpy.context.view_layer.update()
    default={b.name:b.rotation_euler.copy() for b in rig.pose.bones}
    poses={}
    for mode in ['neutral','tablet_hold','card_pinch','radio_press']:
        rig.animation_data.action=bpy.data.actions[mode+'.'+suffix]
        scene.frame_set(16);scene.frame_set(15);bpy.context.view_layer.update()
        poses[mode]={'indexTip':list(rig.pose.bones['index.3'].tail), 'thumbTip':list(rig.pose.bones['thumb.3'].tail)}
    pinch=(Vector(poses['card_pinch']['indexTip'])-Vector(poses['card_pinch']['thumbTip'])).length
    assert pinch < .015
    for obj in col.objects:
        if obj.type=='MESH':
            assert all(abs(sum(g.weight for g in v.groups)-1)<1e-5 for v in obj.data.vertices),obj.name
    assert len(rig.data.bones)==17
    rig.animation_data.action=None
    for name,rotation in default.items():rig.pose.bones[name].rotation_euler=rotation
    scene.collection.children.unlink(col)
    report.append({'hand':side,'bones':17,'allMeshWeightsNormalized':True,'pinchDistance':pinch,'poses':poses})
scene['natural_fingers_v2']=True
bpy.ops.wm.save_as_mainfile(filepath=str(out/'astronaut-hands.blend'))
(out/'natural-fingers-validation.json').write_text(json.dumps(report,indent=2)+'\n')
scene.render.filepath=str(out/'hands-natural-front.png');bpy.ops.render.render(write_still=True)
scene.camera.location=(.4,-.65,.19)
scene.camera.rotation_euler=(Vector((0,0,-.025))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(out/'hands-natural-side.png');bpy.ops.render.render(write_still=True)
print('NATURAL_FINGERS_READY',report,flush=True)
