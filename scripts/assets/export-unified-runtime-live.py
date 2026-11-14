"""Export the unified design in spatial/material batches, preserving Blender source.

The live moving doors, existing bridge glass and furniture physics stay in code.
Static collision uses un-bevelled structural meshes, never all visual detail.
"""
from pathlib import Path
import bpy,json,struct
from mathutils import Vector,Matrix
ROOT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio');OUT=ROOT/'docs/assets/unified-ship'
source_scene=bpy.context.scene
assert source_scene.name=='CRUZ DEL SUR / Unified compact vessel'
assert source_scene.get('structural_flow_finish')
cols={key:bpy.data.collections['UNIFIED / '+name] for key,name in [
 ('hull','01 Lower hull - fitted working copy'),('interior','02 Interior and equipment - retained anchors'),
 ('skin','04 Continuous shoulders and pressure shell'),('roof','05 Swept canopy and dorsal carapace'),
 ('details','06 Structural seams vents and markings'),('ribs','07 Interior oblique ribs')]}
old_objects=set(bpy.data.objects);old_meshes=set(bpy.data.meshes)
collision_material=bpy.data.materials.new('UNIFIED RUNTIME / Collision - not rendered')
def skip(ob):
    return any(ob.name.startswith('CDS U / '+prefix) for prefix in [
      'Docking inner pressure hatch','Docking hatch dark viewport','Docking hatch cyan status',
      'Command panoramic facet','Command roof aperture'])
envelope=[ob for key in ['hull','skin','roof','details','ribs'] for ob in cols[key].objects if ob.type=='MESH' and not skip(ob)]
arrival=[ob for ob in cols['interior'].objects if ob.type=='MESH' and ob.get('source_scene')=='Arrival Room - Spacious V10' and 'panoramic glass' not in ob.get('original_object','')]
collision=[ob for key in ['skin','roof','ribs'] for ob in cols[key].objects if ob.type=='MESH' and not skip(ob)]
reports=[]
targets=set(globals().get('UNIFIED_TARGETS',{'envelope','arrival','collision'}))
def export(name,objects,physics=False,local_z=0):
    temp=bpy.data.scenes.new('TEMP / Unified runtime '+name);bpy.context.window.scene=temp
    copies=[];groups={}
    try:
        for original in objects:
            ob=original.copy();temp.collection.objects.link(ob);ob.matrix_world=original.matrix_world.copy()
            if physics:
                for mod in list(ob.modifiers):ob.modifiers.remove(mod)
            copies.append(ob)
        bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get()
        for ob in copies:
            data=bpy.data.meshes.new_from_object(ob.evaluated_get(dg),depsgraph=dg)
            data.transform(ob.matrix_world)
            if local_z:data.transform(Matrix.Translation((0,local_z,0)))
            if not len(data.polygons):bpy.data.meshes.remove(data);continue
            assert len(data.materials)==1,ob.name
            material=data.materials[0]
            if physics:data.materials.clear();data.materials.append(collision_material);material=collision_material
            part=bpy.data.objects.new('Runtime unified part',data);temp.collection.objects.link(part)
            z=sum(-v.co.y for v in data.vertices)/len(data.vertices)
            zone='collision' if physics else 'arrival-content' if local_z else 'lower-hull' if ob.get('runtime_reference_file')=='cruz-del-sur-player-hull.glb' else 'bridge' if z<5.1 else 'connector' if z<11.8 else 'arrival'
            groups.setdefault((zone,material.name),[]).append(part)
        for ob in copies:bpy.data.objects.remove(ob,do_unlink=True)
        # The new pressure pod is wider than the old floor at its outer edges.
        # Fill only the two side strips, below existing plates and away from grilles.
        if not local_z:
            stations=[(12.07,5.128),(12.8,5.35),(15.5,5.35),(17.9,5.10),(18.265,4.90)]
            material=collision_material if physics else bpy.data.materials['UNIFIED / Graphite ceramic']
            for side in [-1,1]:
                vertices=[];faces=[]
                for z,w in stations:
                    vertices.extend([(side*4.10,-z,-.005),(side*w,-z,-.005)])
                for i in range(len(stations)-1):faces.append((2*i,2*i+1,2*i+3,2*i+2) if side<0 else (2*i+2,2*i+3,2*i+1,2*i))
                data=bpy.data.meshes.new('Pod floor side infill');data.from_pydata(vertices,[],faces);data.materials.append(material)
                part=bpy.data.objects.new('Pod floor side infill',data);temp.collection.objects.link(part)
                groups.setdefault(('collision' if physics else 'arrival',material.name),[]).append(part)
        batches=[]
        for (zone,material),parts in groups.items():
            bpy.ops.object.select_all(action='DESELECT')
            for ob in parts:ob.select_set(True)
            bpy.context.view_layer.objects.active=parts[0]
            if len(parts)>1:bpy.ops.object.join()
            ob=parts[0];ob.name='UNIFIED_RUNTIME_'+zone+'_'+material.replace(' / ','_');batches.append(ob)
        bpy.ops.object.select_all(action='DESELECT')
        for ob in batches:ob.select_set(True)
        target=ROOT/'public/models'/name
        bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_extras=False,export_cameras=False,export_lights=False)
        # Match the cheap glass already used by the game: unlit, low-opacity,
        # no transmission/refraction render pass. Only metadata changes here.
        if not physics and not local_z:
            raw=target.read_bytes();length=struct.unpack_from('<I',raw,12)[0]
            gltf=json.loads(raw[20:20+length]);changed=False
            for material in gltf.get('materials',[]):
                if 'Panoramic smoked glass' not in material.get('name',''):continue
                material['extensions']={'KHR_materials_unlit':{}}
                material['pbrMetallicRoughness']={'baseColorFactor':[.23,.42,.50,.045]}
                material['alphaMode']='BLEND';material['doubleSided']=True;changed=True
            if changed:
                gltf['extensionsUsed']=sorted(set(gltf.get('extensionsUsed',[])+['KHR_materials_unlit']))
                data=json.dumps(gltf,separators=(',',':')).encode();data+=b' '*((-len(data))%4)
                tail=raw[20+length:]
                target.write_bytes(struct.pack('<5I',0x46546c67,2,20+len(data)+len(tail),len(data),0x4e4f534a)+data+tail)
        triangles=sum(sum(len(p.vertices)-2 for p in ob.data.polygons) for ob in batches)
        reports.append({'file':name,'sourceObjects':len(objects),'batches':len(batches),'triangles':triangles,'bytes':target.stat().st_size,'collisionOnly':physics,'localOriginZ':local_z})
    finally:
        bpy.context.window.scene=source_scene
        for ob in list(temp.objects):
            data=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
            if data and data.users==0:bpy.data.meshes.remove(data)
        bpy.data.scenes.remove(temp)
try:
    if 'envelope' in targets:export('cruz-del-sur-unified-envelope.glb',envelope)
    if 'arrival' in targets:export('cruz-del-sur-unified-arrival.glb',arrival,local_z=12.07)
    if 'collision' in targets:export('cruz-del-sur-unified-collision.glb',collision,physics=True)
finally:
    bpy.context.window.scene=source_scene
    for ob in set(bpy.data.objects)-old_objects:bpy.data.objects.remove(ob,do_unlink=True)
    for data in set(bpy.data.meshes)-old_meshes:
        if data.users==0:bpy.data.meshes.remove(data)
    if collision_material.users==0:bpy.data.materials.remove(collision_material)
report_path=OUT/'runtime-export.json'
if report_path.exists():
    previous=json.loads(report_path.read_text()).get('assets',[])
    reports.extend(r for r in previous if r['file'] not in {a['file'] for a in reports})
report_path.write_text(json.dumps({'assets':reports,'sourceModified':False,'previewLightsExported':False,'movingDoorPlaceholdersExported':False,'bridgeGlassDuplicated':False},indent=2))
print('UNIFIED RUNTIME EXPORT',json.dumps(reports))
