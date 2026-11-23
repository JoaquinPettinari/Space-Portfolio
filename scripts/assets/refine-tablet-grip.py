"""Pose-only tablet grip derivative. Keeps card/radio and mesh masters intact."""
from pathlib import Path
from math import radians
import bpy,json,shutil
from mathutils import Matrix,Vector,Euler

ROOT=Path(__file__).resolve().parents[2]
DOC=ROOT/'docs/assets/astronaut-hands'
bpy.ops.wm.open_mainfile(filepath=str(DOC/'hand-gestures.blend'))
report={}

def evaluate_chain(rig,names,rotations):
    matrices={}
    for name in names:
        rest=rig.data.bones[name]
        parent=rest.parent
        parent_pose=matrices.get(parent.name,rig.pose.bones[parent.name].matrix) if parent else Matrix.Identity(4)
        matrix=parent_pose @ (parent.matrix_local.inverted() if parent else Matrix.Identity(4)) @ rest.matrix_local @ Euler(rotations[name],'XYZ').to_matrix().to_4x4()
        matrices[name]=matrix
    final=rig.data.bones[names[-1]]
    return rig.matrix_world @ matrices[names[-1]] @ Vector((0,final.length,0))

def chain_head(rig,names,rotations):
    # Head of distal phalanx for a visible thumb pad along the bezel.
    if len(names)==1:return rig.matrix_world @ rig.pose.bones[names[0]].head
    return evaluate_chain(rig,names[:-1],rotations)

for scene_name in ['01 Tablet raise','01 Tablet lower']:
    scene=bpy.data.scenes[scene_name];bpy.context.window.scene=scene
    scene.frame_set(81 if scene_name.endswith('raise') else 1)
    for rig in [o for o in scene.objects if o.type=='ARMATURE']:
        rig.animation_data_clear()
        sign=-1 if 'HAND_RIG.L' in rig.name else 1
        rig.location=(sign*.235,.032,-.075)
        rig.rotation_euler=(0,sign*radians(35),radians(180))
        wrist=rig.pose.bones['wrist']
        rest=rig.data.bones['wrist'].matrix_local
        wrist.matrix_basis=rest.inverted() @ Matrix.Rotation(sign*radians(30),4,'Y') @ rest
        bpy.context.view_layer.update()
        chosen={}
        for finger in ['index','middle','ring','pinky']:
            names=[finger+'.'+str(i) for i in range(1,4)]
            best=None
            for mcp in range(0,31,3):
                for pip in range(0,46,3):
                    for dip in range(0,31,3):
                        rotations={n:(-radians(a),0,0) for n,a in zip(names,[mcp,pip,dip])}
                        point=evaluate_chain(rig,names,rotations)
                        score=((point.y-.023)/.002)**2+max(0,.095-abs(point.x))**2/.002**2+.015*((mcp-6)/15)**2+.015*((pip-12)/20)**2+.015*((dip-12)/20)**2
                        if best is None or score<best[0]:best=(score,rotations,point)
            _,rotations,point=best
            for name,value in rotations.items():rig.pose.bones[name].rotation_euler=value
            chosen[finger]={'tail':list(point),'angles':{n:list(v) for n,v in rotations.items()}}
        names=['thumb.1','thumb.2','thumb.3']
        rotations={n:[0,0,0] for n in names}
        target=Vector((sign*.184,-.024,0))
        head_target=Vector((sign*.198,-.016,-.016))
        def cost(values):
            point=evaluate_chain(rig,names,values)
            head=chain_head(rig,names,values)
            return ((point-target)/.004).length_squared+((head-head_target)/.005).length_squared+.01*sum(a*a for v in values.values() for a in v)
        current=cost(rotations)
        for step in [15,7,3,1,.3]:
            for iteration in range(8):
                changed=False
                for name in names:
                    for axis in [0,1,2]:
                        original=rotations[name][axis];best=(current,original)
                        for direction in [-1,1]:
                            candidate=max(-radians(60),min(radians(60),original+direction*radians(step)))
                            rotations[name][axis]=candidate;score=cost(rotations)
                            if score<best[0]:best=(score,candidate)
                        current,value=best;rotations[name][axis]=value;changed|=value!=original
                if not changed:break
        for name,value in rotations.items():rig.pose.bones[name].rotation_euler=value
        chosen['thumb']={'tail':list(evaluate_chain(rig,names,rotations)),'angles':rotations}
        report[rig.name]=chosen
        bpy.context.view_layer.update()
    # Explicit pose actions preserve the grip across saves and export sampling.
    for rig in [o for o in scene.objects if o.type=='ARMATURE']:
        rig.animation_data_create();rig.animation_data.action=bpy.data.actions.new(scene_name+'.GRIP.'+rig.name)
        for bone in rig.pose.bones:
            bone.keyframe_insert('rotation_euler',frame=1)
            bone.keyframe_insert('rotation_euler',frame=scene.frame_end)

scene=bpy.data.scenes['01 Tablet raise'];bpy.context.window.scene=scene;scene.frame_set(81)
scene.render.engine='BLENDER_WORKBENCH';scene.display.shading.light='STUDIO';scene.display.shading.color_type='MATERIAL';scene.display.shading.show_shadows=True;scene.display.shading.show_cavity=True
scene.render.resolution_x=1000;scene.render.resolution_y=700;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
out=DOC/'grip-integration';out.mkdir(exist_ok=True)
for label,position,target in [('front',(0,-.85,-.02),(0,0,-.08)),('side',(.58,-.45,.12),(0,0,-.045)),('rear',(.3,.65,.05),(0,0,-.04))]:
    scene.camera.location=position;scene.camera.data.lens=48
    scene.camera.rotation_euler=(Vector(target)-scene.camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(out/(label+'.png'));bpy.ops.render.render(write_still=True)
scene.camera.location=(0,-.85,-.02);scene.camera.rotation_euler=(Vector((0,0,-.08))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(DOC/'hand-gestures-grip-candidate.blend'))
(out/'pose.json').write_text(json.dumps(report,indent=2)+'\n')
print('GRIP_CANDIDATE_READY')


