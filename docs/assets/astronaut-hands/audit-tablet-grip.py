from pathlib import Path
import bpy,json
root=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio')
bpy.ops.wm.open_mainfile(filepath=str(root/'docs/assets/astronaut-hands/hand-gestures.blend'))
scene=bpy.data.scenes['01 Tablet raise'];bpy.context.window.scene=scene;scene.frame_set(81);bpy.context.view_layer.update()
rig=next(o for o in scene.objects if o.type=='ARMATURE' and 'HAND_RIG.R' in o.name)
def data(r):return {b.name:{'rotation':list(b.rotation_euler),'head':list(b.head),'tail':list(b.tail)} for b in r.pose.bones}
report={'original':data(rig)}
copy=rig.copy();report['copyBeforeData']=data(copy)
copy.data=rig.data.copy();scene.collection.objects.link(copy);bpy.context.view_layer.update();report['copyAfterData']=data(copy)
(root/'docs/assets/astronaut-hands/tablet-grip-audit.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
