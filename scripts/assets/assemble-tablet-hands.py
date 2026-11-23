"""Link both reusable hand collections into the tablet; never copy their meshes."""
from pathlib import Path
import bpy,json,hashlib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/mission-tablet'
assert Path(bpy.data.filepath)==OUT/'mission-tablet.blend'
source=ROOT/'docs/assets/astronaut-hands/astronaut-hands.blend'
assert source.exists()
collection=bpy.data.collections['05 Linked hands - no export']
assert len(collection.objects)==0,'Assembly exists: edit its anchors instead of adding duplicates'
with bpy.data.libraries.load(str(source),link=True) as (src,dst):dst.collections=['HAND / Left','HAND / Right']
for side,asset,anchor in zip(['Left','Right'],dst.collections,['GRIP_LEFT','GRIP_RIGHT']):
    assert asset is not None
    obj=bpy.data.objects.new('HAND_INSTANCE_'+side,None)
    obj.instance_type='COLLECTION';obj.instance_collection=asset
    collection.objects.link(obj);obj.matrix_world=bpy.data.objects[anchor].matrix_world.copy()
    obj['exclude_runtime_export']=True
    obj['runtime_role']='Assembly reference; reusable rig exported from astronaut-hands master'
for lib in bpy.data.libraries:
    if Path(bpy.path.abspath(lib.filepath)).resolve()==source.resolve():lib.filepath='//../astronaut-hands/astronaut-hands.blend'
scene=bpy.context.scene;scene.camera=bpy.data.objects['CAM / Tablet assembly']
scene.frame_set(1);bpy.context.view_layer.update()
assert len(collection.objects)==2
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'mission-tablet.blend'))
(OUT/'assembly.json').write_text(json.dumps({'handsSource':'../astronaut-hands/astronaut-hands.blend','handsSha256AtAssembly':hashlib.sha256(source.read_bytes()).hexdigest(),'linkedCollections':[c.name for c in dst.collections],'localMeshCopies':0,'screenAnchor':'SCREEN_UI','gripAnchors':['GRIP_LEFT','GRIP_RIGHT'],'runtimeChanged':False},indent=2))
print('LINKED_HANDS_ASSEMBLED')
