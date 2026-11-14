"""Batch finished Blender meshes by material/interaction; exclude preview lights."""
from pathlib import Path
import bpy,json
ROOT=Path(__file__).resolve().parents[2]
scene=bpy.context.scene
assert scene.name=='Bridge - Finished Interior'
temp=bpy.data.collections.new('Bridge export temporary');scene.collection.children.link(temp)
deps=bpy.context.evaluated_depsgraph_get();groups={};batches=[]
try:
    for obj in list(scene.objects):
        if obj.type!='MESH':continue
        data=bpy.data.meshes.new_from_object(obj.evaluated_get(deps),depsgraph=deps)
        data.transform(obj.matrix_world)
        assert len(data.materials)==1,obj.name
        part=bpy.data.objects.new('Export part',data);temp.objects.link(part)
        interaction=obj.get('interaction','')
        if interaction:part['interaction']=interaction
        groups.setdefault((data.materials[0].name,interaction),[]).append(part)
    for obj in scene.objects:obj.select_set(False)
    for (material,interaction),objects in groups.items():
        for obj in objects:obj.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:bpy.ops.object.join()
        obj=objects[0];obj.name='BRIDGE_RUNTIME_'+material.replace(' ','_')+'_'+interaction
        batches.append(obj);obj.select_set(False)
    for obj in batches:obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/cruz-del-sur-bridge-interior.glb'),
        export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,
        export_extras=True,export_cameras=False,export_lights=False)
    print('Exported batches',len(batches),[(k,len(v)) for k,v in groups.items()])
finally:
    for obj in list(temp.objects):
        data=obj.data;bpy.data.objects.remove(obj,do_unlink=True)
        if data.users==0:bpy.data.meshes.remove(data)
    bpy.data.collections.remove(temp)
