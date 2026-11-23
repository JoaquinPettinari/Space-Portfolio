from pathlib import Path
import bpy,json
out=Path(bpy.data.filepath).parent;s=bpy.context.scene
for mode in ['card_pinch','radio_press']:
 for side in ['Left','Right']:
  col=bpy.data.collections['HAND / '+side];s.collection.children.link(col)
  rig=bpy.data.objects['HAND_RIG.'+side[0]];rig.animation_data.action=bpy.data.actions[mode+'.'+side[0]]
 s.frame_set(16);s.frame_set(15);bpy.context.view_layer.update()
 for side in ['Left','Right']:
  rig=bpy.data.objects['HAND_RIG.'+side[0]];rots={b.name:b.rotation_euler.copy() for b in rig.pose.bones};rig.animation_data.action=None
  for name,r in rots.items():rig.pose.bones[name].rotation_euler=r
  s.collection.children.unlink(bpy.data.collections['HAND / '+side])
 s.render.filepath=str(out/('hands-'+mode.replace('_','-')+'.png'));bpy.ops.render.render(write_still=True)
# Validation intentionally does not save the source master in alternate poses.
print('POSE_RENDERS_COMPLETE')
