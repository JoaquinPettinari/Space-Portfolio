from pathlib import Path
import bpy
OUT=Path(bpy.data.filepath).parent;scene=bpy.context.scene
for side in ['Left','Right']:
 col=bpy.data.collections['HAND / '+side];scene.collection.children.link(col)
 rig=bpy.data.objects['HAND_RIG.'+side[0]];rig.animation_data.action=bpy.data.actions['tablet_hold.'+side[0]]
scene.frame_set(16);scene.frame_set(15);bpy.context.view_layer.update()
for side in ['Left','Right']:
 rig=bpy.data.objects['HAND_RIG.'+side[0]]
 rotations={b.name:b.rotation_euler.copy() for b in rig.pose.bones}
 rig.animation_data.action=None
 for name,rot in rotations.items():rig.pose.bones[name].rotation_euler=rot
 rig['default_pose']='tablet_hold (manual rest display, clip available)'
scene.frame_set(15);bpy.context.view_layer.update()
for side in ['Left','Right']:scene.collection.children.unlink(bpy.data.collections['HAND / '+side])
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'astronaut-hands.blend'))
scene.render.filepath=str(OUT/'hands-tablet-hold.png');bpy.ops.render.render(write_still=True)
