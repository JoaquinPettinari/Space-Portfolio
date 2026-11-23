"""Promote reviewed free-finger poses after checking protected motion."""
from pathlib import Path
import bpy,json,hashlib,shutil
folder=Path(__file__).resolve().parent
source=folder/'hand-gestures.blend'
candidate=folder/'hand-gestures-contact-candidate.blend'
protected=[folder/'astronaut-hands.blend',folder.parent/'mission-tablet/mission-tablet.blend']
hashes={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in protected}
def snapshot(path):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    result={}
    for scene in bpy.data.scenes:
        if not scene.name.startswith(('01 Tablet','02 Credential','03 Radio')):continue
        bpy.context.window.scene=scene
        values=[]
        for frame in sorted({1,31,51,59,73,scene.frame_end}):
            scene.frame_set(frame);bpy.context.view_layer.update()
            for obj in sorted(scene.objects,key=lambda o:o.name):
                # Bone-attached decoration on edited fingers legitimately moves.
                if obj.parent_type!='BONE':values.extend(float(v) for row in obj.matrix_world for v in row)
                if obj.type=='ARMATURE':
                    for bone in obj.pose.bones:
                        keep=scene.name.startswith('01 Tablet') or bone.name.startswith(('forearm','wrist','index')) or (scene.name.startswith('02') and bone.name.startswith('thumb'))
                        if keep:values.extend(float(v) for row in bone.matrix for v in row)
        result[scene.name]=values
    return result
before=snapshot(source);after=snapshot(candidate)
deltas={name:max(abs(a-b) for a,b in zip(before[name],after[name])) for name in before}
assert max(deltas.values())<1e-7,deltas
backup=folder/'hand-gestures-before-contact-polish.blend'
if not backup.exists():shutil.copy2(source,backup)
shutil.copy2(candidate,source)
assert all(hashlib.sha256(Path(p).read_bytes()).hexdigest()==h for p,h in hashes.items())
(folder/'card-radio-review/validation.json').write_text(json.dumps({'protectedMotionMaxDifference':deltas,'protectedHashes':hashes,'mastersUnchanged':True,'sourceBackup':backup.name,'poseSource':'contact-hand-poses.json'},indent=2)+'\n')
print('CONTACT_POSES_PROMOTED',deltas)
