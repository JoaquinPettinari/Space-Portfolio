"""Export both decorative amber alcoves and a surface manifest.

Existing runtime architecture remains untouched here. A separate GLB metadata
patch applies the approved surface factors without changing its binary geometry.
"""
import bpy
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio')
OUT=ROOT/'docs/assets/station-reference-interior'
source_scene=bpy.context.scene
source=bpy.data.collections['STATION / 07 Amber lighting details']

def color_factor(socket):
    if not socket.is_linked:return None,list(socket.default_value)[:3]
    node=socket.links[0].from_node
    if node.type=='TEX_IMAGE':return node.image.name,[1,1,1]
    if node.type=='MIX_RGB' and node.blend_type=='MULTIPLY' and node.inputs[0].default_value==1:
        image_a,a=color_factor(node.inputs[1])
        image_b,b=color_factor(node.inputs[2])
        assert not (image_a and image_b), 'Two image multiplication needs baking'
        return image_a or image_b,[a[i]*b[i] for i in range(3)]
    raise RuntimeError('Unsupported base color graph: '+node.type)

manifest={}
for cname in ['STATION / 01 Observation room - working copy','STATION / 02 Arrival lounge - working copy']:
    for ob in bpy.data.collections[cname].objects:
        if ob.type!='MESH':continue
        for i,slot in enumerate(ob.material_slots):
            old=ob.data.materials[i]
            new=slot.material
            if not old or not new or old==new:continue
            # One existing amber batch includes both ceiling and strips. Keep it
            # unified for render cost; the extra detail asset has its own strips.
            if old.name in {'BRIDGE V15 Amber','ARRIVAL V4 Amber lamps'}:
                manifest[old.name]={'baseColorFactor':[1,.45,.11,1],'emissiveFactor':[1,.36,.065],'emissiveStrength':2.5}
                continue
            if old.name in manifest:continue
            p=next((n for n in new.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) if new.use_nodes else None
            if not p:continue
            image,factor=color_factor(p.inputs['Base Color'])
            entry={'baseColorFactor':factor+[1],'sourceImage':image}
            if not p.inputs['Roughness'].is_linked:
                entry['roughnessFactor']=p.inputs['Roughness'].default_value
                entry['metallicFactor']=p.inputs['Metallic'].default_value
                entry['constantMetalRoughness']=True
            manifest[old.name]=entry
(OUT/'runtime-amber-materials.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')

temp_scene=bpy.data.scenes.new('TEMP / Amber game detail export')
bpy.context.window.scene=temp_scene
copies=[]
included=[]
excluded=[]
try:
    for original in list(source.objects):
        assert original.type=='MESH'
        # Both alcoves are decorative after removal of the physical wall CV.
        included.append(original.name)
        ob=original.copy()
        temp_scene.collection.objects.link(ob)
        ob.matrix_world=original.matrix_world.copy()
        copies.append(ob)
    bpy.context.view_layer.update()
    dg=bpy.context.evaluated_depsgraph_get()
    groups={}
    for ob in copies:
        data=bpy.data.meshes.new_from_object(ob.evaluated_get(dg),preserve_all_data_layers=True,depsgraph=dg)
        data.transform(ob.matrix_world)
        assert len(data.materials)==1
        part=bpy.data.objects.new('Amber runtime part',data)
        temp_scene.collection.objects.link(part)
        groups.setdefault(data.materials[0].name,[]).append(part)
    for ob in copies:bpy.data.objects.remove(ob,do_unlink=True)
    batches=[]
    for material,objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for ob in objects:ob.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:bpy.ops.object.join()
        batch=objects[0]
        batch.name='BRIDGE_AMBER_DETAIL_'+material.replace(' ','_')
        batches.append(batch)
    bpy.ops.object.select_all(action='DESELECT')
    for ob in batches:ob.select_set(True)
    target=ROOT/'public/models/cruz-del-sur-amber-details.glb'
    bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',use_selection=True,use_active_scene=True,
        export_yup=True,export_extras=False,export_cameras=False,export_lights=False)
    report={'source_objects':len(source.objects),'exported_source_objects':len(included),'exported_mesh_batches':len(batches),'bytes':target.stat().st_size,
            'excluded_to_keep_cv_clear':excluded,
            'includes_cameras_or_lights':False,'includes_edit_proxy':False,'includes_station_screens':False,
            'source_scene_modified':False,'file':str(target)}
    (OUT/'runtime-amber-export.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('AMBER GAME EXPORT',json.dumps(report))
    print('MATERIAL MANIFEST',json.dumps(manifest))
finally:
    bpy.context.window.scene=source_scene
    for ob in list(temp_scene.objects):
        data=ob.data
        bpy.data.objects.remove(ob,do_unlink=True)
        if data and data.users==0:bpy.data.meshes.remove(data)
    bpy.data.scenes.remove(temp_scene)
