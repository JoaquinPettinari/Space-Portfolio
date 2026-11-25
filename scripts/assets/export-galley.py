"""Read-only interior fixture export using the shared cabin PBR pipeline."""
from pathlib import Path
import bpy,ast,json,hashlib,struct,re
from mathutils import Vector
def preserve_lossless_normals(target,texture_directory):
    """Retain subtle 8-bit tangent data instead of lossy WebP quantization."""
    raw=target.read_bytes();size=struct.unpack_from('<I',raw,12)[0];document=json.loads(raw[20:20+size]);binary=raw[28+size:]
    replacements={};count=0
    normal_textures={m['normalTexture']['index'] for m in document.get('materials',[]) if 'normalTexture' in m}
    for index in normal_textures:
        texture=document['textures'][index];extension=texture.get('extensions',{}).get('EXT_texture_webp')
        if not extension:continue
        image=document['images'][extension['source']];path=texture_directory/(image['name']+'.png');assert path.is_file(),path
        replacements[image['bufferView']]=path.read_bytes();image['mimeType']='image/png';texture['source']=extension['source'];texture['extensions'].pop('EXT_texture_webp')
        if not texture['extensions']:texture.pop('extensions')
        count+=1
    rebuilt=bytearray();shared_payloads={}
    for index,view in enumerate(document['bufferViews']):
        payload=replacements.get(index,binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']])
        key=hashlib.sha256(payload).digest()
        if key in shared_payloads:
            view['byteOffset'],view['byteLength']=shared_payloads[key]
            continue
        while len(rebuilt)%4:rebuilt.append(0)
        view['byteOffset']=len(rebuilt);view['byteLength']=len(payload);rebuilt.extend(payload)
        shared_payloads[key]=(view['byteOffset'],view['byteLength'])
    document['buffers'][0]['byteLength']=len(rebuilt)
    while len(rebuilt)%4:rebuilt.append(0)
    encoded=json.dumps(document,separators=(',',':')).encode()
    while len(encoded)%4:encoded+=b' '
    total=12+8+len(encoded)+8+len(rebuilt)
    target.write_bytes(struct.pack('<4sII',b'glTF',2,total)+struct.pack('<I4s',len(encoded),b'JSON')+encoded+struct.pack('<I4s',len(rebuilt),b'BIN\0')+rebuilt)
    return count
import sys
PORT='--port' in sys.argv
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/assets/bridge-ceiling-study'/('port-runtime' if PORT else 'galley-runtime');OUT.mkdir(parents=True,exist_ok=True)
TEX=OUT/'textures';TEX.mkdir(exist_ok=True)
SOURCE=ROOT/'docs/assets/bridge-ceiling-study'/('bridge-port-display-polished.blend' if PORT else 'bridge-galley-balanced-finish.blend')
source_hash=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE));source=bpy.context.scene
radio_prefixes=('Radio','Speaker grille','Tuner glass','Tuning dial','Antenna')
def is_radio(o):return o.name.startswith('GALLEY / ') and any(o.name[9:].startswith(n) for n in radio_prefixes)
objects=[o for o in source.objects if o.type in {'MESH','CURVE','FONT'} and o.name.startswith('PORT CORNER / ' if PORT else 'GALLEY') and not o.hide_render and not is_radio(o) and not any(c.hide_render for c in o.users_collection)]
def zone(o):
    return 'coffee' if (o.name.startswith('GALLEY / ') and any(k in o.name for k in ('Espresso','Machine display','Coffee display','Power button','Brew group','Spout','Drip tray','Cup','Coffee surface'))) or o.name.startswith('GALLEY POLISH / ') and any(k in o.name for k in ('Machine','Brew handle','Steam wand','Fascia','Coffee service','Brew group','Drip tray','Tray fixing','Head service','Spine ventilation')) else 'static'

materials=sorted({m for o in objects for m in o.data.materials if m},key=lambda m:m.name)
# Extract pure helper definitions, never execute the cabin export entry point.
tree=ast.parse((ROOT/'scripts/assets/export-cabin-master.py').read_text())
for name in ['plain','signature','safe','principled','bake_maps','evaluated_parts']:
    node=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name==name)
    exec(compile(ast.Module(body=[node],type_ignores=[]),'cabin-export-helper','exec'))
def procedural(m):return m.use_nodes and any(n.type in {'TEX_NOISE','TEX_VORONOI','TEX_WAVE','MIX_RGB'} for n in m.node_tree.nodes)
source_photo_uv={o.name:[tuple(p.uv) for p in o.data.uv_layers.active.data] for o in objects if o.name.startswith('PHOTO / Personal image') or o.name=='PORT CORNER / Personal photograph'}
assert objects
bake_scene=bpy.data.scenes.new('TEMP / Transition unlit PBR baking');bpy.context.window.scene=bake_scene
bake_scene.render.engine='CYCLES';bake_scene.cycles.samples=1;bake_scene.render.bake.margin=3;bake_scene.render.threads_mode='FIXED';bake_scene.render.threads=2
bpy.ops.mesh.primitive_plane_add(size=1);plane=bpy.context.object
runtime_materials={};procedural_set=set();dedupe={};bake_reports=[]
def bake_bump_normal(original,key):
    """Bake the shader normal explicitly: Cycles NORMAL omits shader bump here."""
    old=principled(original)
    if not old.inputs['Normal'].is_linked:return None
    path=TEX/(key[:16]+'-shader-normal.png')
    if path.exists():return bpy.data.images.load(str(path),check_existing=True)
    material=original.copy();plane.data.materials.clear();plane.data.materials.append(material)
    nodes=material.node_tree.nodes;links=material.node_tree.links;p=principled(material)
    scale=nodes.new('ShaderNodeVectorMath');scale.operation='SCALE';scale.inputs[3].default_value=.5
    add=nodes.new('ShaderNodeVectorMath');add.operation='ADD';add.inputs[1].default_value=(.5,.5,.5)
    emit=nodes.new('ShaderNodeEmission');emit.inputs['Strength'].default_value=1
    links.new(p.inputs['Normal'].links[0].from_socket,scale.inputs[0]);links.new(scale.outputs[0],add.inputs[0]);links.new(add.outputs[0],emit.inputs[0]);links.new(emit.outputs[0],next(n for n in nodes if n.type=='OUTPUT_MATERIAL').inputs['Surface'])
    image=bpy.data.images.new('Transition shader tangent normal '+key[:12],width=512,height=512,alpha=False);image.colorspace_settings.name='Non-Color'
    target=nodes.new('ShaderNodeTexImage');target.image=image;nodes.active=target
    for n in nodes:n.select=False
    target.select=True;bpy.context.view_layer.objects.active=plane;plane.select_set(True);bpy.ops.object.bake(type='EMIT',margin=3)
    image.filepath_raw=str(path);image.file_format='PNG';image.save();bpy.data.materials.remove(material,do_unlink=True)
    return image
for index,original in enumerate(materials):
    key=signature(original)
    if key in dedupe:
        runtime_materials[original]=dedupe[key]
        if procedural(original):procedural_set.add(original)
        continue
    if procedural(original):
        print('BAKE',index+1,len(materials),original.name,flush=True)
        maps=bake_maps(original,key)
        shader_normal=bake_bump_normal(original,key)
        if shader_normal:maps['normal']=shader_normal
        material=bpy.data.materials.new('TRANSITION_PBR_'+safe(original.name));material.use_nodes=True
        p=principled(material);old=principled(original);nodes=material.node_tree.nodes;links=material.node_tree.links
        for name in ['Base Color','Metallic','Roughness','Coat Weight','Coat Roughness','Emission Color','Emission Strength','Alpha','IOR']:
            if name in old.inputs and name in p.inputs:p.inputs[name].default_value=old.inputs[name].default_value
        for channel,image in maps.items():
            if channel!='base':image.colorspace_settings.name='Non-Color'
            tex=nodes.new('ShaderNodeTexImage');tex.image=image;tex.extension='REPEAT'
            if channel=='base':links.new(tex.outputs['Color'],p.inputs['Base Color'])
            elif channel=='orm':
                separate=nodes.new('ShaderNodeSeparateColor');links.new(tex.outputs['Color'],separate.inputs[0]);links.new(separate.outputs['Green'],p.inputs['Roughness']);links.new(separate.outputs['Blue'],p.inputs['Metallic'])
            else:
                normal=nodes.new('ShaderNodeNormalMap');links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs[0],p.inputs['Normal'])
        procedural_set.add(original);bake_reports.append({'material':original.name,'key':key,'resolution':512,'channels':['base','orm','normal']})
    else:
        material=original.copy();material.name='TRANSITION_PBR_'+safe(original.name)
    material.use_backface_culling=False;runtime_materials[original]=material;dedupe[key]=material
print('MATERIALS_READY',len(dedupe),flush=True)
bpy.context.window.scene=source;dg=bpy.context.evaluated_depsgraph_get()
temp=bpy.data.scenes.new('TEMP / Static transition export');groups={}
for index,o in enumerate(objects):
    evaluated_parts(o,o.matrix_world,temp,dg,groups,zone(o))
    if index%200==0:print('EVALUATED',index,len(objects),flush=True)
bpy.context.window.scene=temp
for (zone,name),parts in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for part in parts:part.select_set(True)
    bpy.context.view_layer.objects.active=parts[0]
    if len(parts)>1:bpy.ops.object.join()
    part=parts[0];part.name=('PORT_' if PORT else 'GALLEY_')+zone+'_'+safe(name);part['runtime_zone']=zone
bpy.ops.object.select_all(action='SELECT')
target=ROOT/'public/models'/('cruz-del-sur-port-display.glb' if PORT else 'cruz-del-sur-galley.glb')
bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_extras=True,export_animations=False,export_cameras=False,export_lights=False,export_image_format='WEBP',export_image_quality=90)
lossless_normals=preserve_lossless_normals(target,TEX)
raw=target.read_bytes();jsonsize=struct.unpack_from('<I',raw,12)[0];gltf=json.loads(raw[20:20+jsonsize])
assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw)
assert not gltf.get('cameras') and not gltf.get('animations') and 'KHR_lights_punctual' not in gltf.get('extensions',{})
meshes=[o for o in temp.objects if o.type=='MESH'];points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
photo_mats=[m for m in gltf.get('materials',[]) if 'Personal_photograph' in m.get('name','')]
for name,uv in source_photo_uv.items():assert [tuple(p.uv) for p in bpy.data.objects[name].data.uv_layers.active.data]==uv
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash
compile(Path(__file__).read_text(),__file__,'exec')
report={'source':str(SOURCE.relative_to(ROOT)),'sourceSHA256':source_hash,'sourceUnchanged':True,'coordinateSpace':'World Y-up; no offset','excludedCollectionPrefixes':['90','98','99'],'lightsExported':False,'sourceObjects':len(objects),'sourceMaterials':len(materials),'bakedMaterials':bake_reports,'file':str(target.relative_to(ROOT)),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'meshBatches':len(meshes),'gltfPrimitives':sum(len(m['primitives']) for m in gltf.get('meshes',[])),'materials':len(gltf.get('materials',[])),'images':len(gltf.get('images',[])),'textures':len(gltf.get('textures',[])),'triangles':sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons),'boundsRuntime':{'min':[min(p.x for p in points),min(p.z for p in points),min(-p.y for p in points)],'max':[max(p.x for p in points),max(p.z for p in points),max(-p.y for p in points)]},'photoMaterials':[m['name'] for m in photo_mats],'photoUvPreserved':True,'proceduralAdaptation':'Reusable 512px unlit color/ORM/tangent-normal tiles with per-object local planar UVs; authored photo UVs unchanged','browserPerformanceMeasured':False}
report['losslessNormalTextures']=lossless_normals
(OUT/'export.json').write_text(json.dumps(report,indent=2)+'\n');print('GALLEY_EXPORT_COMPLETE',json.dumps(report),flush=True)



