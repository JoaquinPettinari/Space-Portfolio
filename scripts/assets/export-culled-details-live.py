"""Re-export closed static bay/alcove solids with backface culling.

Source geometry, glass, lamps, UVs and gameplay colliders are preserved. Only
evaluated temporary meshes are repaired; no source .blend is saved.
"""
from pathlib import Path
import bpy, bmesh, json

# Live exec may not define __file__; locate the checkout from the saved source.
if not bpy.data.filepath:
    raise RuntimeError('Save the Blender source inside the intended checkout before exporting')
ROOT = next((parent for parent in Path(bpy.data.filepath).resolve().parents
             if (parent / 'package.json').is_file() and (parent / 'src').is_dir()), None)
if ROOT is None:
    raise RuntimeError('The Blender source must belong to a Space-Portfolio checkout')
source_scene=bpy.context.scene
reports=[]
for collection,filename,prefix in [
    ('Panoramic Bay V2','cruz-del-sur-panoramic-bay.glb','V2_'),
    ('STATION / 07 Amber lighting details','cruz-del-sur-amber-details.glb','BRIDGE_AMBER_DETAIL_')]:
    temp=bpy.data.scenes.new('TEMP / Culled static details')
    materials={};copies=[];groups={};closed_count=0
    try:
        bpy.context.window.scene=temp
        for original in bpy.data.collections[collection].objects:
            if original.type!='MESH':continue
            assert original.parent is None, original.name
            ob=original.copy();temp.collection.objects.link(ob)
            # These source collections may be outside the active scene, where
            # matrix_world is stale. Retain local location/rotation/scale from
            # copy(), then let the temporary dependency graph evaluate them.
            copies.append(ob)
        bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get()
        for ob in copies:
            data=bpy.data.meshes.new_from_object(ob.evaluated_get(dg),preserve_all_data_layers=True,depsgraph=dg)
            data.transform(ob.matrix_world)
            assert len(data.materials)==1
            original=data.materials[0]
            glass=any(k in original.name.lower() for k in ['glazing','glass'])
            bm=bmesh.new();bm.from_mesh(data)
            closed=bool(bm.faces) and all(e.is_manifold for e in bm.edges) and not glass
            if closed:
                bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
                bm.to_mesh(data);data.update();closed_count+=1
            bm.free()
            key=(original.name,closed)
            if key not in materials:
                mat=original.copy();mat.name=original.name+(' / closed solids' if closed else ' / retained surfaces')
                if closed:mat.use_backface_culling=True
                materials[key]=mat
            data.materials[0]=materials[key]
            part=bpy.data.objects.new('Culled evaluated part',data);temp.collection.objects.link(part)
            assembly=ob.get('assembly','STRUCTURE') if prefix=='V2_' else ''
            groups.setdefault((assembly,key),[]).append(part)
        for ob in copies:bpy.data.objects.remove(ob,do_unlink=True)
        batches=[]
        for (assembly,(material,closed)),parts in groups.items():
            bpy.ops.object.select_all(action='DESELECT')
            for ob in parts:ob.select_set(True)
            bpy.context.view_layer.objects.active=parts[0]
            if len(parts)>1:bpy.ops.object.join()
            ob=parts[0];ob.name=prefix+assembly+'__'+material.replace(' ','_');batches.append(ob)
        bpy.ops.object.select_all(action='DESELECT')
        for ob in batches:ob.select_set(True)
        path=ROOT/'public/models'/filename
        bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_extras=False,export_cameras=False,export_lights=False)
        reports.append({'file':filename,'sourceObjects':len(copies),'closedSolids':closed_count,'batches':len(batches),'bytes':path.stat().st_size,'triangles':sum(sum(len(p.vertices)-2 for p in ob.data.polygons) for ob in batches)})
    finally:
        bpy.context.window.scene=source_scene
        for ob in list(temp.objects):
            data=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
            if data.users==0:bpy.data.meshes.remove(data)
        bpy.data.scenes.remove(temp)
        for mat in materials.values():
            if mat.users==0:bpy.data.materials.remove(mat)
(ROOT/'docs/audits/fps-unified/culled-details.json').write_text(json.dumps(reports,indent=2))
print('CULLED DETAILS',json.dumps(reports))
