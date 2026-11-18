"""Export the approved master without saving it: static world mesh + local sliding leaves.

Procedural finishes are baked to reusable 512px PBR tiles (no scene illumination).
Photographs and authored image textures retain their source UVs. Run in background Blender.
"""
from pathlib import Path
import bpy,json,hashlib,struct,re,sys
from mathutils import Matrix,Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/assets/cabin-master/runtime-export';OUT.mkdir(parents=True,exist_ok=True)
TEX=OUT/'textures';TEX.mkdir(exist_ok=True)
SOURCE=Path(bpy.data.filepath);assert SOURCE.name=='cabin-master.blend'
source_hash=hashlib.sha256(SOURCE.read_bytes()).hexdigest();source=bpy.context.scene
excluded={'09 Credential terminal','10 Lighting and cameras','11 Packed references','12 Space backdrop','13 Preview displays - not for export','90 Archive / Superseded layout - excluded'}
leaf_root=bpy.data.objects['SLOT / Sliding leaves'];leaf_sources=[bpy.data.objects['LEAF_LEFT_SLIDE'],bpy.data.objects['LEAF_RIGHT_SLIDE']]
leaf_objects={o for leaf in leaf_sources for o in leaf.children_recursive}
objects=[o for o in source.objects if o.type in {'MESH','CURVE','FONT'} and not o.hide_render and not o.get('archived') and not o.get('exclude_runtime_export') and not any(c.name in excluded for c in o.users_collection)]
static=[o for o in objects if o not in leaf_objects];dynamic=[o for o in objects if o in leaf_objects]
materials=sorted({m for o in objects for m in o.data.materials if m},key=lambda m:m.name)
print('SOURCE',len(static),'static',len(dynamic),'dynamic',len(materials),'materials',flush=True)

def plain(v):
 if isinstance(v,(str,int,float,bool)):return v
 try:return list(v)
 except TypeError:return None
def signature(m):
 if not m.use_nodes:return hashlib.sha256(str(list(m.diffuse_color)).encode()).hexdigest()
 ns=list(m.node_tree.nodes);data=[]
 for n in ns:
  item={'type':n.bl_idname,'inputs':[(i.name,plain(i.default_value)) for i in n.inputs if hasattr(i,'default_value')]}
  if n.type=='TEX_IMAGE' and n.image:item['image']=(n.image.name,list(n.image.size))
  if n.type=='VALTORGB':item['ramp']=[(e.position,list(e.color)) for e in n.color_ramp.elements]
  if n.type=='MAPPING':item['mapping']=n.vector_type
  if n.type=='TEX_NOISE':item['noise']=n.noise_dimensions
  data.append(item)
 links=[(ns.index(l.from_node),l.from_socket.name,ns.index(l.to_node),l.to_socket.name) for l in m.node_tree.links]
 return hashlib.sha256(json.dumps([data,links],sort_keys=True).encode()).hexdigest()
def safe(n):return re.sub(r'[^A-Za-z0-9_]+','_',n).strip('_')
def principled(m):return next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) if m.use_nodes else None
def procedural(m):
 return m.use_nodes and (any(n.type in {'TEX_NOISE','TEX_VORONOI','MIX_RGB'} for n in m.node_tree.nodes))
glass_names={'MASTER / Clear pressure glazing','REV / EVA display clear glass','WINDOW / Keepsake protective glass','VESTIBULE / Clear inspection glass'}

# Isolated bake scene: no master lights/world participate in EMIT or tangent NORMAL baking.
bake_scene=bpy.data.scenes.new('TEMP / Cabin material tiles');bpy.context.window.scene=bake_scene
bake_scene.render.engine='CYCLES';bake_scene.cycles.samples=1;bake_scene.render.bake.margin=3
bpy.ops.mesh.primitive_plane_add(size=1);plane=bpy.context.object;plane.name='Tile bake plane'
bake_reports=[];runtime_materials={};procedural_set=set();dedupe={}
def bake_maps(original,key):
 paths={ch:TEX/(key[:16]+'-'+ch+'.png') for ch in ['base','orm','normal']}
 if all(p.is_file() for p in paths.values()):
  return {ch:bpy.data.images.load(str(p),check_existing=True) for ch,p in paths.items()}
 material=original.copy();plane.data.materials.clear();plane.data.materials.append(material);nodes=material.node_tree.nodes;links=material.node_tree.links;p=principled(material)
 if not p:raise RuntimeError('Cannot bake non-principled '+original.name)
 output=next(n for n in nodes if n.type=='OUTPUT_MATERIAL');emit=nodes.new('ShaderNodeEmission');emit.inputs['Strength'].default_value=1
 target=nodes.new('ShaderNodeTexImage');images={}
 for channel in ['base','orm','normal']:
  image=bpy.data.images.new('CABIN BAKE '+key[:12]+' '+channel,width=512,height=512,alpha=False)
  if channel!='base':image.colorspace_settings.name='Non-Color'
  target.image=image;nodes.active=target
  for n in nodes:n.select=False
  target.select=True
  if channel=='normal':links.new(p.outputs['BSDF'],output.inputs['Surface']);kind='NORMAL'
  else:
   for l in list(emit.inputs['Color'].links):links.remove(l)
   if channel=='base':
    socket=p.inputs['Base Color']
    if socket.is_linked:links.new(socket.links[0].from_socket,emit.inputs['Color'])
    else:emit.inputs['Color'].default_value=socket.default_value
   else:
    combine=nodes.new('ShaderNodeCombineColor');combine.inputs['Red'].default_value=1
    for src,dst in [('Roughness','Green'),('Metallic','Blue')]:
     socket=p.inputs[src]
     if socket.is_linked:links.new(socket.links[0].from_socket,combine.inputs[dst])
     else:combine.inputs[dst].default_value=socket.default_value
    links.new(combine.outputs[0],emit.inputs['Color'])
   links.new(emit.outputs[0],output.inputs['Surface']);kind='EMIT'
  bpy.context.view_layer.objects.active=plane;plane.select_set(True)
  bpy.ops.object.bake(type=kind,margin=3)
  image.filepath_raw=str(paths[channel]);image.file_format='PNG';image.save();images[channel]=image
 bpy.data.materials.remove(material,do_unlink=True)
 return images

for index,original in enumerate(materials):
 key=signature(original)
 if key in dedupe:runtime_materials[original]=dedupe[key];continue
 if original.name in glass_names:
  mat=bpy.data.materials.new('CABIN_GLASS_'+safe(original.name));mat.use_nodes=True;p=principled(mat)
  p.inputs['Base Color'].default_value=(.58,.69,.72,1);p.inputs['Metallic'].default_value=0;p.inputs['Roughness'].default_value=.12
  p.inputs['Alpha'].default_value=.035 if 'inspection' in original.name.lower() else .055
  mat.surface_render_method='DITHERED';mat.use_backface_culling=False
 elif procedural(original):
  print('BAKE',index+1,'/',len(materials),original.name,flush=True)
  maps=bake_maps(original,key);mat=bpy.data.materials.new('CABIN_PBR_'+safe(original.name));mat.use_nodes=True;p=principled(mat);old=principled(original);nodes=mat.node_tree.nodes;links=mat.node_tree.links
  for name in ['Base Color','Metallic','Roughness','Coat Weight','Coat Roughness','Emission Color','Emission Strength','Alpha','IOR']:
   if name in old.inputs and name in p.inputs:p.inputs[name].default_value=old.inputs[name].default_value
  for ch,image in maps.items():
   if ch!='base':image.colorspace_settings.name='Non-Color'
   tex=nodes.new('ShaderNodeTexImage');tex.image=image;tex.extension='REPEAT'
   if ch=='base':links.new(tex.outputs['Color'],p.inputs['Base Color'])
   elif ch=='orm':
    sep=nodes.new('ShaderNodeSeparateColor');links.new(tex.outputs['Color'],sep.inputs[0]);links.new(sep.outputs['Green'],p.inputs['Roughness']);links.new(sep.outputs['Blue'],p.inputs['Metallic'])
   else:
    normal=nodes.new('ShaderNodeNormalMap');links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs[0],p.inputs['Normal'])
  procedural_set.add(original);bake_reports.append({'material':original.name,'maps':{ch:str(p.relative_to(ROOT)) for ch,p in {ch:TEX/(key[:16]+'-'+ch+'.png') for ch in maps}.items()},'resolution':512})
 else:
  mat=original.copy();mat.name='CABIN_PBR_'+safe(original.name)
 # Image texture caps are applied to export-scene copies only; originals on disk are untouched.
 if mat.use_nodes:
  for n in mat.node_tree.nodes:
   if n.type=='TEX_IMAGE' and n.image and max(n.image.size)>1024:
    image=n.image.copy();ratio=1024/max(image.size);image.scale(round(image.size[0]*ratio),round(image.size[1]*ratio));image.pack();n.image=image
 mat.use_backface_culling=False;runtime_materials[original]=mat;dedupe[key]=mat
# Duplicated material graphs must use the same projected UV convention.
for m in materials:
 if procedural(m):procedural_set.add(m)
print('MATERIALS_READY',len(dedupe),'unique',len(bake_reports),'baked',flush=True)

def evaluated_parts(original,transform,scene,dg,groups,zone):
 data=bpy.data.meshes.new_from_object(original.evaluated_get(dg),preserve_all_data_layers=True,depsgraph=dg)
 if not data.polygons:bpy.data.meshes.remove(data);return
 lo=[min(v.co[i] for v in data.vertices) for i in range(3)];span=[max(v.co[i] for v in data.vertices)-lo[i] for i in range(3)]
 normals=list(data.corner_normals);normalmat=transform.to_3x3().inverted().transposed();uv=data.uv_layers.active
 bymat={}
 for polygon in data.polygons:bymat.setdefault(polygon.material_index,[]).append(polygon)
 for material_index,polygons in bymat.items():
  if material_index>=len(data.materials) or not data.materials[material_index]:continue
  material=data.materials[material_index];runtime=runtime_materials[material];vertices=[];faces=[];corner_uv=[];corner_normals=[];vertex_map={};smooth=[]
  for polygon in polygons:
   face=[];axis=max(range(3),key=lambda a:abs(polygon.normal[a]));axes=[a for a in range(3) if a!=axis]
   for loop_index in polygon.loop_indices:
    vi=data.loops[loop_index].vertex_index;co=data.vertices[vi].co
    if vi not in vertex_map:vertex_map[vi]=len(vertices);vertices.append(tuple(transform@co))
    face.append(vertex_map[vi]);corner_normals.append(tuple((normalmat@normals[loop_index].vector).normalized()))
    if material in procedural_set:corner_uv.append(tuple((co[a]-lo[a])/span[a] if span[a]>1e-8 else .5 for a in axes))
    else:corner_uv.append(tuple(uv.data[loop_index].uv) if uv else (0,0))
   faces.append(face);smooth.append(polygon.use_smooth)
  mesh=bpy.data.meshes.new('Export evaluated material part');mesh.from_pydata(vertices,[],faces);mesh.update();mesh.materials.append(runtime)
  layer=mesh.uv_layers.new(name='UVMap')
  for loop,coords in zip(layer.data,corner_uv):loop.uv=coords
  for polygon,flag in zip(mesh.polygons,smooth):polygon.use_smooth=flag
  mesh.normals_split_custom_set(corner_normals)
  part=bpy.data.objects.new('Evaluated export part',mesh);scene.collection.objects.link(part);groups.setdefault((zone,runtime.name),[]).append(part)
 bpy.data.meshes.remove(data)

reports=[]
def export_asset(filename,source_objects,sliding=False):
 bpy.context.window.scene=source;dg=bpy.context.evaluated_depsgraph_get();temp=bpy.data.scenes.new('TEMP / '+filename);groups={};leaf_nodes={}
 if sliding:
  for leaf in leaf_sources:
   name=leaf.name;leaf.name='SOURCE / '+name
   dest=bpy.data.objects.new(name,None);temp.collection.objects.link(dest);dest.matrix_world=leaf_root.matrix_world.inverted()@leaf.matrix_world;leaf_nodes[leaf]=dest
 for i,o in enumerate(source_objects):
  if sliding:
   leaf=next(l for l in leaf_sources if o in l.children_recursive);transform=leaf.matrix_world.inverted()@o.matrix_world;zone=leaf_nodes[leaf].name
  else:
   transform=o.matrix_world
   # Keep access-state lamps addressable without splitting every static object.
   zone=('access_status' if o.name.startswith(('STATUS_LIGHT','HEADER_INDICATOR')) else
         'vestibule' if any(c.name.startswith('21 ') for c in o.users_collection) else 'cabin')
  evaluated_parts(o,transform,temp,dg,groups,zone)
  if i%200==0:print('EVALUATED',filename,i,'/',len(source_objects),flush=True)
 bpy.context.window.scene=temp
 for (zone,material),parts in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for part in parts:part.select_set(True)
  bpy.context.view_layer.objects.active=parts[0]
  if len(parts)>1:bpy.ops.object.join()
  part=parts[0];part.name='CABIN_MASTER_'+zone+'_'+safe(material);part['runtime_zone']=zone
  if sliding:part.parent=bpy.data.objects[zone];part.matrix_parent_inverse=Matrix.Identity(4);part.matrix_basis=Matrix.Identity(4)
 bpy.ops.object.select_all(action='SELECT');target=ROOT/'public/models'/filename
 bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_extras=True,export_animations=False,export_cameras=False,export_lights=False,export_image_format='WEBP',export_image_quality=88)
 raw=target.read_bytes();jsonsize=struct.unpack_from('<I',raw,12)[0];gltf=json.loads(raw[20:20+jsonsize]);meshes=[o for o in temp.objects if o.type=='MESH'];points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
 report={'file':filename,'sourceObjects':len(source_objects),'meshBatches':len(meshes),'materials':len(gltf.get('materials',[])),'nodes':len(gltf.get('nodes',[])),'images':len(gltf.get('images',[])),'triangles':sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons),'bytes':len(raw),'boundsRuntime':{'min':[min(p.x for p in points),min(p.z for p in points),min(-p.y for p in points)],'max':[max(p.x for p in points),max(p.z for p in points),max(-p.y for p in points)]},'glassMaterials':[{'name':m.get('name'),'alphaMode':m.get('alphaMode'),'alpha':m.get('pbrMetallicRoughness',{}).get('baseColorFactor',[1,1,1,1])[3]} for m in gltf.get('materials',[]) if 'CABIN_GLASS' in m.get('name','')]}
 if sliding:report['pivots']=[{'name':n.get('name'),'translation':n.get('translation',[0,0,0]),'rotation':n.get('rotation',[0,0,0,1])} for n in gltf['nodes'] if n.get('name') in {'LEAF_LEFT_SLIDE','LEAF_RIGHT_SLIDE'}]
 reports.append(report);print('EXPORTED',json.dumps(report),flush=True);bpy.context.window.scene=source

export_asset('cabin-master-static.glb',static)
export_asset('cabin-master-sliding-leaves.glb',dynamic,sliding=True)
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash
assert len(reports[1]['pivots'])==2
for p in reports[1]['pivots']:
 assert abs(p['translation'][0]-(-.685 if p['name']=='LEAF_LEFT_SLIDE' else .685))<1e-5
 assert abs(p['translation'][1])+abs(p['translation'][2])<1e-5
audit={'source':str(SOURCE.relative_to(ROOT)),'sourceSha256':source_hash,'sourceSaved':False,'staticCoordinateSpace':'World Y-up, no placement offset','slidingPlacementRuntime':[0,-.18,11.65],'slidingTravel':{'LEAF_LEFT_SLIDE':-1.37,'LEAF_RIGHT_SLIDE':1.37},'excludedCollections':sorted(excluded),'studioLightsExported':False,'collidersExported':False,'proceduralAdaptation':'Reusable 512px color/ORM/tangent-normal tiles baked without lighting; local planar UV projection. Source image UVs retained.','bakedMaterials':bake_reports,'assets':reports}
(OUT/'export.json').write_text(json.dumps(audit,indent=2),encoding='utf-8');print('MASTER_EXPORT_COMPLETE',flush=True)

