from pathlib import Path
import bpy,json,hashlib,shutil
root=Path(__file__).resolve().parents[3]
folder=Path(__file__).resolve().parent
source=folder/'hand-gestures.blend'
candidate=folder/'hand-gestures-grip-candidate.blend'
protected=[folder/'astronaut-hands.blend',root/'docs/assets/mission-tablet/mission-tablet.blend']
hashes={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
def snapshot(path):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    result={}
    for scene_name in ['02 Credential present','03 Radio press']:
        scene=bpy.data.scenes[scene_name];bpy.context.window.scene=scene
        values=[]
        for frame in [1,51,59,73,scene.frame_end]:
            scene.frame_set(frame);bpy.context.view_layer.update()
            for obj in sorted(scene.objects,key=lambda o:o.name):
                if obj.type=='ARMATURE':
                    values.extend(float(v) for row in obj.matrix_world for v in row)
                    for bone in obj.pose.bones:values.extend(float(v) for row in bone.matrix for v in row)
        result[scene_name]=values
    return result
before=snapshot(source);after=snapshot(candidate)
delta=max(abs(a-b) for name in before for a,b in zip(before[name],after[name]))
assert delta<1e-7,delta
scene=bpy.data.scenes['01 Tablet raise'];bpy.context.window.scene=scene;scene.frame_set(81);bpy.context.view_layer.update()
grip={'version':1,'coordinateSystem':'Blender XYZ metres/radians','description':'Thumb over front bezel; four fingers on rear; forearm roll35deg and wrist compensation30deg','rigs':{}}
for rig in [o for o in scene.objects if o.type=='ARMATURE']:
    side='L' if 'HAND_RIG.L' in rig.name else 'R'
    grip['rigs'][side]={'location':list(rig.location),'rotationEuler':list(rig.rotation_euler),'bones':{b.name:list(b.rotation_euler) for b in rig.pose.bones}}
(folder/'tablet-grip.json').write_text(json.dumps(grip,indent=2)+'\n')
backup=folder/'hand-gestures-before-tablet-grip.blend'
if not backup.exists():shutil.copy2(source,backup)
shutil.copy2(candidate,source)
assert all(hashlib.sha256(Path(p).read_bytes()).hexdigest()==h for p,h in hashes.items())
(folder/'grip-integration/validation.json').write_text(json.dumps({'cardRadioPoseMaxDifference':delta,'protectedHashes':hashes,'mastersUnchanged':True,'sourceBackup':backup.name,'gripSource':'tablet-grip.json'},indent=2)+'\n')
print('GRIP_PROMOTED',delta)
