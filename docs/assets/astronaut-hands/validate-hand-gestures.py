"""Validate animated evaluated surfaces and shared event ordering (read only)."""
from pathlib import Path
import bpy,json,hashlib
from mathutils import Vector

out=Path(bpy.data.filepath).parent
contract=json.loads((out/'gesture-contract.json').read_text())
fps=contract['fps'];timing=contract['timing']
reports=[]

def at(scene,t):
    bpy.context.window.scene=scene
    f=t*fps+1
    scene.frame_set(int(f),subframe=f-int(f))
    bpy.context.view_layer.update()

def skin_points(skin,rig,name):
    tail=rig.data.bones[name+'.3'].tail_local
    ids=[v.index for v in skin.data.vertices if (v.co-tail).length<.006]
    evaluated=skin.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=evaluated.to_mesh()
    points=[evaluated.matrix_world@mesh.vertices[i].co for i in ids]
    evaluated.to_mesh_clear()
    return points

scene=bpy.data.scenes['03 Radio press']
rig=next(o for o in scene.objects if o.name.startswith('RADIO / HAND_RIG.'))
skin=next(o for o in scene.objects if o.name.startswith('RADIO / HAND_SURFACE.'))
button=next(o for o in scene.objects if o.name.startswith('FIXTURE / Radio play button'))
samples=[]
for i in range(round(timing['radio']['duration']*fps)+1):
    t=i/fps;at(scene,t)
    tip=max(p.y for p in skin_points(skin,rig,'index'))
    face=button.matrix_world.translation.y-.0225
    gap=face-tip
    travel=button.location.y-.0225
    if t<timing['radio']['contact']:
        assert abs(travel)<1e-6,('button moved early',t,travel)
        assert gap>=-.0001,('tip penetrated before contact',t,gap)
    if timing['radio']['contact']<=t<=timing['radio']['release']:
        assert abs(gap)<.0002,('tip detached during pressure',t,gap)
    samples.append({'seconds':t,'surfaceGap':gap,'buttonTravel':travel})
assert timing['radio']['action']>timing['radio']['contact']
action_sample=samples[round(timing['radio']['action']*fps)]
assert abs(action_sample['buttonTravel']-.018)<1e-5
reports.append({'gesture':'radio_press','samples':samples,'contactBeforeAction':True,'allPressureFramesMaintainContact':True})

scene=bpy.data.scenes['02 Credential present']
rig=next(o for o in scene.objects if o.name.startswith('CREDENTIAL / HAND_RIG.'))
skin=next(o for o in scene.objects if o.name.startswith('CREDENTIAL / HAND_SURFACE.'))
card=next(o for o in scene.objects if o.name=='FIXTURE / Crew credential')
reader=next(o for o in scene.objects if o.name=='FIXTURE / Reader')
samples=[]
at(scene,0)
normal=reader.rotation_euler.to_matrix()@Vector((0,1,0))
reader_face=reader.matrix_world.translation-normal*.0125
for i in range(round(timing['card']['duration']*fps)+1):
    t=i/fps;at(scene,t)
    card_face=card.matrix_world.translation+normal*.00075
    gap=(reader_face-card_face).dot(normal)
    assert gap>=-.0001,('card penetrated reader',t,gap)
    if timing['card']['contact']<=t<=timing['card']['holdUntil']:
        assert abs(gap)<.0001,('card not held against reader',t,gap)
    samples.append({'seconds':t,'readerGap':gap})
at(scene,timing['card']['contact'])
index=skin_points(skin,rig,'index');thumb=skin_points(skin,rig,'thumb')
gap=min((a-b).length for a in index for b in thumb)
assert abs(gap-.0015)<.0005,('pinch not calibrated to card',gap)
assert timing['card']['action']>timing['card']['contact']
reports.append({'gesture':'card_present','samples':samples,'contactBeforeAction':True,'heldDuringScan':True,'pinchSurfaceGap':gap,'fixtureThickness':.0015})

for mode in ['raise','lower']:
    scene=bpy.data.scenes['01 Tablet '+mode]
    root=next(o for o in scene.objects if o.name=='TABLET_ASSEMBLY / '+mode)
    children=list(root.children)
    assert len([o for o in children if o.type=='ARMATURE'])==2
    assert len([o for o in children if o.instance_type=='COLLECTION'])==4
    locals_before={o.name:o.matrix_basis.copy() for o in children}
    for t in [0,timing['tablet'][mode]/2,timing['tablet'][mode]]:
        at(scene,t)
        for obj in children:
            assert max(abs(a-b) for rowa,rowb in zip(obj.matrix_basis,locals_before[obj.name]) for a,b in zip(rowa,rowb))<1e-7
    reports.append({'gesture':'tablet_'+mode,'handsAndTabletKeepRelativeTransforms':True})
assert hashlib.sha256((out/'astronaut-hands.blend').read_bytes()).hexdigest()==contract['sourceMasterSha256']
(out/'gesture-validation.json').write_text(json.dumps({'sourceMasterUnchanged':True,'timing':timing,'reports':reports},indent=2)+'\n')
print('GESTURE_SURFACE_CONTACT_VALIDATED')
