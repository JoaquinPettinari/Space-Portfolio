"""Export evaluated material batches from V4; never join or edit source meshes."""
from pathlib import Path
import bpy
import contextlib
import io

ROOT=Path(__file__).resolve().parents[2]
scene=bpy.context.scene
assert scene.name=='Arrival Room - Materials V4'
temp=bpy.data.collections.new('Arrival runtime export temporary')
scene.collection.children.link(temp)
selected=list(bpy.context.selected_objects)
active=bpy.context.view_layer.objects.active
groups={};created_mesh_names=[]
try:
    deps=bpy.context.evaluated_depsgraph_get()
    for obj in list(scene.objects):
        if obj.type!='MESH' or any(c.name.endswith('/ Access references') for c in obj.users_collection):continue
        mesh=bpy.data.meshes.new_from_object(obj.evaluated_get(deps),preserve_all_data_layers=True,depsgraph=deps)
        created_mesh_names.append(mesh.name)
        mesh.transform(obj.matrix_world)
        copy=bpy.data.objects.new('runtime part',mesh);temp.objects.link(copy)
        key=tuple(m.name for m in mesh.materials)
        groups.setdefault(key,[]).append(copy)
    for obj in scene.objects:obj.select_set(False)
    batches=[]
    for key,objects in groups.items():
        for obj in objects:obj.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.join()
        batch=objects[0];batch.name='ARRIVAL_RUNTIME_'+key[0].replace(' ','_')
        batches.append(batch);batch.select_set(False)
    for obj in batches:obj.select_set(True)
    out=ROOT/'public/models/cruz-del-sur-arrival-room.glb'
    with contextlib.redirect_stdout(io.StringIO()):
        bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,
            use_active_scene=True,export_apply=False,export_yup=True,export_cameras=False,export_lights=False)
    print('Runtime export:',len(batches),'batches;',out.stat().st_size,'bytes; no reference terminal.')
finally:
    # Only temporary export data is removed. Source resources remain editable.
    for obj in list(temp.objects):
        mesh=obj.data;bpy.data.objects.remove(obj,do_unlink=True)
        if mesh.users==0:bpy.data.meshes.remove(mesh)
    bpy.data.collections.remove(temp)
    for name in created_mesh_names:
        mesh=bpy.data.meshes.get(name)
        if mesh is not None and mesh.users==0:bpy.data.meshes.remove(mesh)
    for obj in selected:obj.select_set(True)
    bpy.context.view_layer.objects.active=active
