from pathlib import Path
from math import radians
import bpy,json
from mathutils import Vector
out=Path(bpy.data.filepath).parent;s=bpy.context.scene
report=[]
for side in ['Left','Right']:
 col=bpy.data.collections['HAND / '+side];s.collection.children.link(col)
 rig=bpy.data.objects['HAND_RIG.'+side[0]]
 # Soft wrist gasket bridges the sleeve and palm without changing the skeleton.
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(0,0,-.006));o=bpy.context.object;o.name='Wrist flexible liner.'+side[0];o.scale=(.027,.019,.025)
 bpy.ops.object.transform_apply(location=True,rotation=False,scale=True)
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.parent=rig;o.data.materials.append(bpy.data.materials['HAND / Dark cuff rubber'])
 for p in o.data.polygons:p.use_smooth=True
 vg=o.vertex_groups.new(name='wrist');vg.add(list(range(len(o.data.vertices))),1,'REPLACE');md=o.modifiers.new('Wrist skinning','ARMATURE');md.object=rig
 rig.animation_data.action=bpy.data.actions['card_pinch.'+side[0]];s.frame_set(16);s.frame_set(15)
 for i,a in enumerate([-20,85,85]):rig.pose.bones[f'index.{i+1}'].rotation_euler.x=radians(a)
 rig.pose.bones['thumb.2'].rotation_euler.x=0
 for pb in rig.pose.bones:
  for f in [1,15,30]:pb.keyframe_insert(data_path='rotation_euler',frame=f,group=pb.name)
 s.frame_set(16);s.frame_set(15);bpy.context.view_layer.update()
 distance=(rig.pose.bones['index.3'].tail-rig.pose.bones['thumb.3'].tail).length
 assert distance<.015,distance
 report.append({'hand':side,'pinchTipDistanceMetres':distance,'cardPinchContactVerified':True})
 rig.animation_data.action=bpy.data.actions['tablet_hold.'+side[0]];s.frame_set(16);s.frame_set(15);bpy.context.view_layer.update()
 rotations={b.name:b.rotation_euler.copy() for b in rig.pose.bones};rig.animation_data.action=None
 for name,r in rotations.items():rig.pose.bones[name].rotation_euler=r
 s.collection.children.unlink(col)
(out/'contact-validation.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(out/'astronaut-hands.blend'))
s.camera.location=(.40,-.65,.19);s.camera.rotation_euler=(Vector((0,0,-.025))-s.camera.location).to_track_quat('-Z','Y').to_euler()
s.render.filepath=str(out/'hands-tablet-hold-side.png');bpy.ops.render.render(write_still=True)
print('CONTACT_VALIDATED',report)
