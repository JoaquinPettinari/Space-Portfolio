"""Refine free fingers without changing tablet, card pinch or radio index."""
from pathlib import Path
import bpy,json

ROOT=Path(__file__).resolve().parents[2]
DOC=ROOT/'docs/assets/astronaut-hands'
bpy.ops.wm.open_mainfile(filepath=str(DOC/'hand-gestures.blend'))
poses={}
config=json.loads((DOC/'contact-hand-poses.json').read_text())
for kind,scene_name in [
    ('card','02 Credential present'),
    ('radio','03 Radio press'),
]:
    scene=bpy.data.scenes[scene_name];bpy.context.window.scene=scene
    rig=next(o for o in scene.objects if o.type=='ARMATURE')
    action=rig.animation_data.action.copy();action.name=kind+'.relaxed-free-fingers'
    rig.animation_data.action=action
    if action.slots:rig.animation_data.action_slot=action.slots[0]
    frames={1,scene.frame_end}
    for layer in action.layers:
        for strip in layer.strips:
            bag=strip.channelbag(rig.animation_data.action_slot)
            if bag:
                for curve in bag.fcurves:
                    frames.update(round(k.co.x) for k in curve.keyframe_points)
    values=config['poses'][kind]
    for frame in sorted(frames):
        scene.frame_set(frame)
        for name,rotation in values.items():
            bone=rig.pose.bones[name];bone.rotation_euler=rotation
            bone.keyframe_insert('rotation_euler',frame=frame,group=name)
    poses[kind]=values
bpy.context.window.scene=bpy.data.scenes['03 Radio press'];bpy.context.scene.frame_set(59)
bpy.ops.wm.save_as_mainfile(filepath=str(DOC/'hand-gestures-contact-candidate.blend'))
(DOC/'contact-hand-poses-candidate.json').write_text(json.dumps({'version':1,'description':'Relax free fingers; preserve card pinch and radio index','poses':poses},indent=2)+'\n')
print('CONTACT_POSE_CANDIDATE_READY')
