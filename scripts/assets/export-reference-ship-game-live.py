"""Export only the approved reference spacecraft, grouped by material.

Evaluated copy, no source edits, no preview planet/camera/light export.
"""
from pathlib import Path
import bpy, json
ROOT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio')
previous=bpy.context.scene
source=[o for c in bpy.data.collections if c.name.startswith('CDS 0') for o in c.objects if o.type in {'MESH','FONT','CURVE'} and not o.hide_render]
scene=bpy.data.scenes.new('TEMP / Game reference spacecraft')
bpy.context.window.scene=scene
materials={};copies=[]
try:
    for original in source:
        ob=original.copy();scene.collection.objects.link(ob)
        ob.matrix_world=original.matrix_world.copy();copies.append(ob)
    bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get()
    groups={};before=0
    for ob in copies:
        data=bpy.data.meshes.new_from_object(ob.evaluated_get(dg),depsgraph=dg)
        data.transform(ob.matrix_world)
        if not len(data.polygons):bpy.data.meshes.remove(data);continue
        assert len(data.materials)==1,ob.name
        old=data.materials[0]
        if old.name not in materials:
            mat=bpy.data.materials.new('SHIP_GAME / '+old.name);mat.use_nodes=True
            p=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
            original_shader=next((n for n in old.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) if old.use_nodes else None
            for key in ['Base Color','Metallic','Roughness','Emission Color','Emission Strength']:
                if original_shader:p.inputs[key].default_value=original_shader.inputs[key].default_value
            # Opaque tinted glazing at this viewing distance avoids glass sorting.
            p.inputs['Alpha'].default_value=1
            # Runtime has no studio reflection rig: retain readable diffuse hull.
            p.inputs['Metallic'].default_value=min(p.inputs['Metallic'].default_value,.45)
            mat.use_backface_culling=True
            materials[old.name]=mat
        data.materials.clear();data.materials.append(materials[old.name])
        part=bpy.data.objects.new('Ship export part',data);scene.collection.objects.link(part)
        groups.setdefault(old.name,[]).append(part)
    for ob in copies:bpy.data.objects.remove(ob,do_unlink=True)
    batches=[]
    for key,parts in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for ob in parts:ob.select_set(True)
        bpy.context.view_layer.objects.active=parts[0]
        if len(parts)>1:bpy.ops.object.join()
        ob=parts[0];ob.name='CRUZ_DEL_SUR_'+key.replace(' / ','_')
        before+=sum(len(p.vertices)-2 for p in ob.data.polygons)
        # One simplification per material batch, on the temporary geometry only.
        if len(ob.data.polygons)>200:
            mod=ob.modifiers.new('Game distant-view simplification','DECIMATE');mod.ratio=.25
            bpy.ops.object.modifier_apply(modifier=mod.name)
        batches.append(ob)
    bpy.ops.object.select_all(action='DESELECT')
    for ob in batches:ob.select_set(True)
    target=ROOT/'public/models/cruz-del-sur-exterior.glb'
    bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_cameras=False,export_lights=False)
    report={'sourceObjects':len(source),'batches':len(batches),'sourceTriangles':before,'exportTriangles':sum(sum(len(p.vertices)-2 for p in ob.data.polygons) for ob in batches),'bytes':target.stat().st_size,'newLights':0,'newTextures':0,'sourceModified':False}
    (ROOT/'docs/assets/cruz-del-sur-exterior/game-export.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report))
finally:
    bpy.context.window.scene=previous
    for ob in list(scene.objects):
        data=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
        if data and data.users==0:bpy.data.meshes.remove(data)
    bpy.data.scenes.remove(scene)
    for mat in materials.values():
        if mat.users==0:bpy.data.materials.remove(mat)
