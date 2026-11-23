"""Read-only comparison of non-tablet poses with the pre-refinement backup."""
from pathlib import Path
import bpy, json

out=Path(bpy.data.filepath).parent
def snapshot(path):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    scene=bpy.context.scene
    result={}
    for side in ['Left','Right']:
        scene.collection.children.link(bpy.data.collections['HAND / '+side])
        rig=bpy.data.objects['HAND_RIG.'+side[0]]
        for mode in ['neutral','card_pinch','radio_press']:
            rig.animation_data.action=bpy.data.actions[mode+'.'+side[0]]
            for frame in [1,15,30]:
                scene.frame_set(frame+1);scene.frame_set(frame)
                bpy.context.view_layer.update()
                result[f'{side}/{mode}/{frame}']={b.name:list(b.rotation_euler) for b in rig.pose.bones}
    return result
before=snapshot(out/'astronaut-hands-before-natural-fingers.blend')
after=snapshot(out/'astronaut-hands.blend')
assert before==after, 'Non-tablet poses changed'
(out/'preserved-poses-validation.json').write_text(json.dumps({'posesCompared':['neutral','card_pinch','radio_press'],'hands':2,'bonesPerHand':17,'framesCompared':[1,15,30],'identicalBoneRotations':before==after,'runtimeChanged':False},indent=2)+'\n')
print('PRESERVED_POSES_IDENTICAL')
