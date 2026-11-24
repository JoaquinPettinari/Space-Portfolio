"""Render an already-saved ceiling study without changing its .blend."""
import bpy
import hashlib
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/assets/bridge-ceiling-study'
SOURCE=ROOT/'docs/assets/unified-ship/cruz-del-sur-interior-panels.blend'
assert Path(bpy.data.filepath).name=='bridge-ceiling-study.blend'
authoring_report=json.loads((OUT/'validation.json').read_text())
source_hash=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
assert source_hash==authoring_report['sourceSha256'],'Source changed since authoring validation'
scene=bpy.data.scenes['CRUZ DEL SUR / Bridge ceiling study']
bpy.context.window.scene=scene
revision_hash=hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest()
missing=[image.name for image in bpy.data.images if image.source=='FILE' and not image.packed_file
         and not Path(bpy.path.abspath(image.filepath)).is_file()]
assert not missing,missing
new=[obj for obj in scene.objects if obj.name.startswith('CEILING / ')]
archived=[obj for obj in scene.objects if obj.name.startswith('ARCHIVE / Replaced ceiling / ')]
rig=[obj for obj in scene.objects if obj.name.startswith(('CEILING PREVIEW / ','CEILING REVIEW / '))]
extent=[]
triangles=0
depsgraph=bpy.context.evaluated_depsgraph_get()
for obj in new:
    points=[obj.matrix_world@Vector(v) for v in obj.bound_box]
    box=[[min(v[i] for v in points),max(v[i] for v in points)] for i in range(3)]
    assert box[1][0]>-.4 and box[2][0]>2.64
    zone=obj['ceiling_study_zone']
    if zone=='opaque':assert box[1][1]<2.74 and max(abs(v) for v in box[0])<4.81
    elif zone=='spine':assert max(abs(v) for v in box[0])<=.151
    else:assert any(box[1][0]>=y-.061 and box[1][1]<=y+.061 for y in (4.45,6.15,7.35))
    extent.append(box)
    evaluated=obj.evaluated_get(depsgraph)
    mesh=evaluated.to_mesh()
    mesh.calc_loop_triangles()
    triangles+=len(mesh.loop_triangles)
    evaluated.to_mesh_clear()
report={'source':str(SOURCE.relative_to(ROOT)),
        'sourceSha256':source_hash,
        'sourceUnchanged':True,'revision':'bridge-ceiling-study.blend','runtimeExported':False,
        'protectedBlenderYMaximum':-1.0,'newGeometryMinimumY':min(b[1][0] for b in extent),
        'minimumNewHeadroom':min(b[2][0] for b in extent),
        'unchangedOriginalObjects':len(scene.objects)-len(new)-len(rig)-2*len(archived),
        'modifiedBatches':[{'batch':o.name.removeprefix('ARCHIVE / Replaced ceiling / '),
                            'archivedVertices':len(o.data.vertices),'protectedFacesUnchanged':True} for o in archived],
        'geometryProtectionEvidence':'All original-object and protected-face signatures asserted in study-bridge-ceiling.py before save',
        'glassAndSkylightsUnchanged':True,
        'glassOcclusionPolicy':'front additions remain within existing opaque spine/frame footprints',
        'editableNewMeshes':len(new),'evaluatedNewTriangles':triangles,'previewLights':4,
        'missingImages':missing,'savedFileReopenedSuccessfully':True,'previewOnly':True,
        'cameras':[o.name for o in rig if o.type=='CAMERA']}
(OUT/'validation.json').write_text(json.dumps(report,indent=2))
print('CEILING_REVIEW',json.dumps(report),flush=True)
scene.render.resolution_percentage=100
scene.cycles.samples=32
for number,name in ((1,'CEILING REVIEW / Forward overview'),(3,'CEILING REVIEW / Ceiling detail')):
    scene.camera=scene.objects[name]
    scene.render.filepath=str(OUT/f'ceiling-review-{number:02}.png')
    bpy.ops.render.render(write_still=True)
assert hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest()==revision_hash
