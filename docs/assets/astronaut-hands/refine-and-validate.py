from pathlib import Path
import bpy,json
from mathutils import Vector
OUT=Path(bpy.data.filepath).parent
assert OUT.name=='astronaut-hands'
scene=bpy.context.scene
# Evaluate both rigs as direct scene objects before creating library instances.
for side in ['Left','Right']:
 col=bpy.data.collections['HAND / '+side]
 if col.name not in scene.collection.children:scene.collection.children.link(col)
for o in scene.objects:
 if o.type=='LIGHT':o.data.energy*=.12
for m in bpy.data.materials:
 if m.name=='HAND / Graphite woven glove':
  p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(.012,.018,.022,1)
for side in ['Left','Right']:
 rig=bpy.data.objects['HAND_RIG.'+side[0]]
 rig.animation_data.action=bpy.data.actions['tablet_hold.'+side[0]]
scene.frame_set(16);scene.frame_set(15);bpy.context.view_layer.update()
report=[]
for side in ['Left','Right']:
 rig=bpy.data.objects['HAND_RIG.'+side[0]];mesh=bpy.data.objects['HAND_SURFACE.'+side[0]]
 poses={}
 for mode in ['neutral','tablet_hold','card_pinch','radio_press']:
  rig.animation_data.action=bpy.data.actions[mode+'.'+side[0]];scene.frame_set(16);scene.frame_set(15);bpy.context.view_layer.update()
  poses[mode]={'indexTip':list(rig.pose.bones['index.3'].tail),'thumbTip':list(rig.pose.bones['thumb.3'].tail),'indexRotation':list(rig.pose.bones['index.1'].rotation_euler)}
 assert (Vector(poses['neutral']['indexTip'])-Vector(poses['tablet_hold']['indexTip'])).length>.02,poses
 assert (Vector(poses['radio_press']['indexTip'])-Vector(poses['tablet_hold']['indexTip'])).length>.02
 rig.animation_data.action=bpy.data.actions['tablet_hold.'+side[0]];scene.frame_set(16);scene.frame_set(15);bpy.context.view_layer.update()
 weights=[sum(g.weight for g in v.groups) for v in mesh.data.vertices]
 assert all(abs(w-1)<1e-5 for w in weights)
 report.append({'side':side,'poses':poses,'allSurfaceWeightsNormalized':True})
# Source rigs hidden by unlinking their collections; references retain their evaluated poses.
for side in ['Left','Right']:scene.collection.children.unlink(bpy.data.collections['HAND / '+side])
(OUT/'pose-validation.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'astronaut-hands.blend'))
scene.render.filepath=str(OUT/'hands-tablet-hold.png');bpy.ops.render.render(write_still=True)
print('POSES_VALIDATED',report)
