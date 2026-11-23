"""Derive the web interaction asset. Never writes the Blender authoring files.

Blender 5.3; run with --background --python this_file. Textiles are baked from
the authored shaders. NLA track names become the four shared glTF clips.
"""
from pathlib import Path
import bpy
import json
import hashlib
import struct
import sys
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / 'docs/assets/astronaut-hands'
SOURCE = DOC / 'hand-gestures.blend'
TARGET = ROOT / 'public/models/cruz-del-sur-hand-interactions.glb'
if '--output' in sys.argv:
    TARGET=ROOT/sys.argv[sys.argv.index('--output')+1]
TIMING = json.loads((ROOT / 'src/game/world/gestureTiming.json').read_text())
HASHES = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in [SOURCE, DOC/'astronaut-hands.blend', ROOT/'docs/assets/mission-tablet/mission-tablet.blend']}
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
report = {'sourceHashes': HASHES, 'timing': TIMING, 'atlasResolution': 1024, 'skinMethod': 'LINEAR', 'sourcesUnchanged': False}
export_scene = bpy.data.scenes.new('Runtime interactions')
export_scene.render.fps = 100
export_scene.frame_start = 1
export_scene.frame_end = 126
export_scene.render.engine = 'CYCLES'
export_scene.cycles.samples = 1
export_scene.render.threads_mode = 'FIXED'
export_scene.render.threads = 2

def empty(name, parent=None):
    obj = bpy.data.objects.new(name, None)
    export_scene.collection.objects.link(obj)
    obj.parent = parent
    return obj

def copy_objects(objects):
    mapping = {}
    for original in objects:
        obj = original.copy()
        if obj.type in {'MESH', 'ARMATURE', 'CURVE', 'FONT'}:
            obj.data = original.data.copy()
        export_scene.collection.objects.link(obj)
        mapping[original] = obj
    for original, obj in mapping.items():
        obj.parent = mapping.get(original.parent)
        for modifier in obj.modifiers:
            if modifier.type == 'ARMATURE':
                modifier.object = mapping[modifier.object]
                modifier.use_deform_preserve_volume = False
    return mapping

def nla(obj, animation, name, duration):
    obj.animation_data_create()
    obj.animation_data.action = None
    track = obj.animation_data.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, 1, animation)
    strip.action_frame_start = 1
    strip.action_frame_end = round(duration*100)+1
    strip.frame_start = 1
    strip.frame_end = round(duration*100)+1
    strip.blend_type = 'REPLACE'
    strip.extrapolation = 'HOLD'
    return track

def static_pose_action(rig, name, duration):
    rig.animation_data_create()
    rig.animation_data.action = bpy.data.actions.new(name)
    for bone in rig.pose.bones:
        bone.keyframe_insert('rotation_euler', frame=1)
        bone.keyframe_insert('rotation_euler', frame=round(duration*100)+1)
    action = rig.animation_data.action
    rig.animation_data.action = None
    return action

# One tablet assembly, two animation tracks; no duplicated lower-gesture mesh.
source_scene = bpy.data.scenes['01 Tablet raise']
bpy.context.window.scene = source_scene
source_scene.frame_set(81)
mapping = copy_objects([o for o in source_scene.objects if o.type not in {'LIGHT','CAMERA'} and not o.name.startswith('TABLET_LINK')])
motion = next(o for o in mapping.values() if o.name.startswith('TABLET_ASSEMBLY'))
motion.name = 'TABLET_MOTION'
tablet_root = empty('TABLET_ASSEMBLY')
motion.parent = tablet_root
tablet_rigs = [o for o in mapping.values() if o.type == 'ARMATURE']
for rig in tablet_rigs:
    rig.animation_data_clear()
    for mode in ['raise','lower']:
        duration = TIMING['tablet'][mode]
        nla(rig, static_pose_action(rig, 'tablet_'+mode+'.'+rig.name, duration), 'tablet_'+mode, duration)
for instance in source_scene.objects:
    if instance.instance_type != 'COLLECTION' or not instance.instance_collection: continue
    if instance.instance_collection.name.startswith('04 '): continue
    props = copy_objects(list(instance.instance_collection.all_objects))
    for original, obj in props.items():
        if original.parent not in props:
            obj.parent = motion
            obj.matrix_parent_inverse = Matrix.Identity(4)
            obj.matrix_basis = instance.matrix_local @ original.matrix_world
        if original.name == 'SCREEN_UI':
            obj.name = 'SCREEN_UI'
            obj.rotation_euler = (0,0,0)
            obj.scale = (1,1,1)
raise_action = motion.animation_data.action
lower_scene = bpy.data.scenes['01 Tablet lower']
lower_action = next(o for o in lower_scene.objects if o.name.startswith('TABLET_ASSEMBLY')).animation_data.action
nla(motion, raise_action, 'tablet_raise', TIMING['tablet']['raise'])
nla(motion, lower_action, 'tablet_lower', TIMING['tablet']['lower'])

# Card contact frame becomes the coordinate system of this independent gesture.
source_scene = bpy.data.scenes['02 Credential present']
bpy.context.window.scene = source_scene
source_scene.frame_set(59)
bpy.context.view_layer.update()
card_source = source_scene.objects['FIXTURE / Crew credential']
contact_matrix = card_source.matrix_world.copy()
contact_matrix.translation = card_source.matrix_world @ Vector((0,.00075,0))
card_objects = [o for o in source_scene.objects if o.name.startswith('CREDENTIAL') or o.name in {'FIXTURE / Crew credential','FIXTURE / Credential stripe'}]
mapping = copy_objects(card_objects)
card_root = empty('CARD_GESTURE')
card_basis = empty('CARD_BASIS', card_root)
card_basis.matrix_basis = contact_matrix.inverted()
card_rig = next(o for o in mapping.values() if o.type == 'ARMATURE')
card_rig.parent = card_basis
card = mapping[card_source]
card.name = 'CREW_CARD'
card_marker = empty('CARD_CONTACT',card)
card_marker.location = (0,.00075,0)
nla(card_rig, card_rig.animation_data.action, 'card_present', TIMING['card']['duration'])

# Radio front plane origin; authored button track supplies the runtime key travel.
source_scene = bpy.data.scenes['03 Radio press']
bpy.context.window.scene = source_scene
source_scene.frame_set(59)
bpy.context.view_layer.update()
mapping = copy_objects([o for o in source_scene.objects if o.name.startswith('RADIO /')])
radio_root = empty('RADIO_GESTURE')
radio_rig = next(o for o in mapping.values() if o.type == 'ARMATURE')
radio_rig.parent = radio_root
button_source = source_scene.objects['FIXTURE / Radio play button']
button_motion = empty('RADIO_BUTTON_MOTION',radio_root)
button_motion.location = button_source.location
nla(button_motion,button_source.animation_data.action,'radio_press',TIMING['radio']['duration'])
button_marker = empty('RADIO_BUTTON_CONTACT',button_motion)
button_marker.location = (0,-.0225,0)
nla(radio_rig,radio_rig.animation_data.action,'radio_press',TIMING['radio']['duration'])

bpy.context.window.scene = export_scene
export_scene.frame_set(59)
bpy.context.view_layer.update()
rigs = tablet_rigs + [card_rig,radio_rig]
report['before'] = {'meshObjects':sum(o.type=='MESH' for o in export_scene.objects), 'vertices':sum(len(o.data.vertices) for o in export_scene.objects if o.type=='MESH')}

# Bake two reusable rest-space atlases, preserving each material's metallic and
# emissive constants. Three right-hand instances share the resulting geometry.
atlas_dir = DOC/'runtime-textures'
atlas_dir.mkdir(exist_ok=True)
cached = {}
for rig in rigs:
    side = 'L' if 'HAND_RIG.L' in rig.name else 'R'
    parts = [o for o in export_scene.objects if o.type=='MESH' and any(m.type=='ARMATURE' and m.object==rig for m in o.modifiers)]
    parts.sort(key=lambda obj: (not ('HAND_SURFACE' in obj.name),obj.name))
    if not parts: raise RuntimeError('Missing hand meshes '+rig.name)
    if side in cached:
        template,groups = cached[side]
        for obj in parts: bpy.data.objects.remove(obj,do_unlink=True)
        mesh = bpy.data.objects.new(rig.name+'_MESH',template)
        export_scene.collection.objects.link(mesh)
        mesh.parent=rig
        for group in groups: mesh.vertex_groups.new(name=group)
        modifier=mesh.modifiers.new('Skin','ARMATURE');modifier.object=rig
        continue
    for obj in parts:
        obj.data=obj.data.copy()
        for modifier in list(obj.modifiers):
            if modifier.type=='ARMATURE':obj.modifiers.remove(modifier)
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
        # Remaining bevels/normals are evaluated in rest space, not posed skin.
        if obj.modifiers: bpy.ops.object.convert(target='MESH')
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:obj.select_set(True)
    bpy.context.view_layer.objects.active=parts[0]
    bpy.ops.object.join()
    mesh=bpy.context.object
    mesh.name='HAND_RUNTIME_'+side
    mesh.data.validate(clean_customdata=False)
    for layer in list(mesh.data.uv_layers):mesh.data.uv_layers.remove(layer)
    mesh.data.uv_layers.new(name='RuntimeAtlas')
    mesh.data.uv_layers.active_index=0
    mesh.data.uv_layers[0].active_render=True
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.1519,island_margin=.012)
    bpy.ops.object.mode_set(mode='OBJECT')
    # Independent local material copies: neither master nor other scenes change.
    for slot in mesh.material_slots:slot.material=slot.material.copy()
    images={}
    for kind in ['color','roughness','normal']:
        image=bpy.data.images.new('HAND_'+side+'_'+kind,1024,1024,alpha=False)
        if kind!='color':image.colorspace_settings.name='Non-Color'
        image.generated_color=(.5,.5,1,1) if kind=='normal' else (.3,.3,.3,1)
        images[kind]=image
        for mat in mesh.data.materials:
            node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=image
            mat.node_tree.nodes.active=node
        export_scene.render.bake.margin=8
        export_scene.render.bake.use_clear=True
        if kind=='color':
            export_scene.render.bake.use_pass_direct=False
            export_scene.render.bake.use_pass_indirect=False
            export_scene.render.bake.use_pass_color=True
            bpy.ops.object.bake(type='DIFFUSE')
        elif kind=='roughness':bpy.ops.object.bake(type='ROUGHNESS')
        else:bpy.ops.object.bake(type='NORMAL',normal_space='TANGENT')
        image.filepath_raw=str(atlas_dir/(image.name+'.png'));image.file_format='PNG';image.save();image.pack()
    for mat in mesh.data.materials:
        nodes=mat.node_tree.nodes;links=mat.node_tree.links
        shader=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
        for socket in ['Base Color','Roughness','Normal']:
            for link in list(shader.inputs[socket].links):links.remove(link)
        for kind,socket in [('color','Base Color'),('roughness','Roughness')]:
            node=nodes.new('ShaderNodeTexImage');node.image=images[kind]
            links.new(node.outputs['Color'],shader.inputs[socket])
        tex=nodes.new('ShaderNodeTexImage');tex.image=images['normal']
        normal=nodes.new('ShaderNodeNormalMap');links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],shader.inputs['Normal'])
    modifier=mesh.modifiers.new('Skin','ARMATURE');modifier.object=rig;modifier.use_deform_preserve_volume=False
    cached[side]=(mesh.data,[g.name for g in mesh.vertex_groups])
    print('ATLAS_READY',side,flush=True)

# Calibrate the skinned radio leading surface using glTF's linear skinning.
export_scene.frame_set(59);bpy.context.view_layer.update()
radio_mesh=next(o for o in export_scene.objects if o.type=='MESH' and any(m.type=='ARMATURE' and m.object==radio_rig for m in o.modifiers))
# Radio-only continuity control: localize skin weights before adding a bone.
# The authored rig and shared tablet/card data remain unchanged.
radio_mesh.data=radio_mesh.data.copy()
bpy.ops.object.select_all(action='DESELECT')
radio_rig.select_set(True);bpy.context.view_layer.objects.active=radio_rig
bpy.ops.object.mode_set(mode='EDIT')
end=radio_rig.data.edit_bones.new('RADIO_SLEEVE_END')
end.head=(0,0,-.225);end.tail=(0,0,-.255)
end.parent=radio_rig.data.edit_bones['forearm'];end.use_connect=False
bpy.ops.object.mode_set(mode='OBJECT')
end_group=radio_mesh.vertex_groups.new(name='RADIO_SLEEVE_END')
forearm_group=radio_mesh.vertex_groups['forearm']
allowed_materials={i for i,m in enumerate(radio_mesh.data.materials) if any(label in m.name for label in ['Ivory pressure fabric','Seam thread','Safety orange'])}
allowed_vertices={i for polygon in radio_mesh.data.polygons if polygon.material_index in allowed_materials for i in polygon.vertices}
weighted=0
for vertex in radio_mesh.data.vertices:
    weight=next((g.weight for g in vertex.groups if g.group==forearm_group.index),0)
    if vertex.index not in allowed_vertices or weight<.999 or vertex.co.z>=-.045:continue
    t=max(0,min(1,(-vertex.co.z-.045)/.180))
    amount=t*t*(3-2*t)
    forearm_group.add([vertex.index],1-amount,'REPLACE')
    end_group.add([vertex.index],amount,'REPLACE');weighted+=1
assert weighted>0,'No radio sleeve vertices weighted'
report['radioSleeve']={'bone':'RADIO_SLEEVE_END','parent':'forearm','restHeadBlender':[0,0,-.225],'restTailBlender':[0,0,-.255],'blendStartBlenderZ':-.045,'blendEndBlenderZ':-.225,'weightedVertices':weighted,'sourceRigUnchanged':True}
bpy.context.view_layer.update()
evaluated=radio_mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());evaluated_mesh=evaluated.to_mesh()
leading=max((radio_mesh.matrix_world@v.co for v in evaluated_mesh.vertices),key=lambda p:p.y)
evaluated.to_mesh_clear()
# Marker remains attached to the articulated distal index bone, not a static root.
marker=empty('RADIO_FINGERTIP')
marker.parent=radio_rig;marker.parent_type='BONE';marker.parent_bone='index.3'
bpy.context.view_layer.update()
marker.matrix_world=Matrix.Translation(leading)
report['radioLinearContactErrorBeforeCorrection']=list(leading-Vector((0,.018,0)))
# A constant wrapper correction preserves the authored trajectories and pressure.
radio_correction=empty('RADIO_SKIN_CORRECTION',radio_root)
radio_correction.location=Vector((0,.018,0))-leading
radio_rig.parent=radio_correction

# Source names for helpers are stable despite linked-library auto suffixes.
for obj in export_scene.objects:
    if obj.name.startswith('SCREEN_UI'):obj.name='SCREEN_UI'
    if obj.type in {'FONT','CURVE'} or (obj.type=='MESH' and obj.modifiers and not any(m.type=='ARMATURE' for m in obj.modifiers)):
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
        bpy.ops.object.convert(target='MESH')
export_scene.frame_set(1)
for scene in list(bpy.data.scenes):
    if scene != export_scene: bpy.data.scenes.remove(scene)
bpy.ops.object.select_all(action='SELECT')
TARGET.parent.mkdir(exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(TARGET),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_frame_range=False,export_anim_slide_to_zero=True,export_apply=False,export_cameras=False,export_lights=False,export_extras=True)
report['beforeBufferDeduplicationBytes']=TARGET.stat().st_size
# Blender exports a mesh variant per skin. Identical payloads can share glTF
# buffer views/accessors without changing geometry, UVs, weights or animations.
data=TARGET.read_bytes();json_length=struct.unpack_from('<I',data,12)[0]
gltf=json.loads(data[20:20+json_length]);binary=data[28+json_length:]
# Blender 5.3's exporter currently writes the sheen tint but omits the authored
# weight. glTF represents that intensity in sheenColorFactor itself.
report['sheenWeights']={}
for material in gltf.get('materials',[]):
    sheen=material.get('extensions',{}).get('KHR_materials_sheen')
    source=bpy.data.materials.get(material.get('name',''))
    if not sheen or not source or not source.use_nodes:continue
    shader=next((n for n in source.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
    if shader is None:continue
    weight=shader.inputs['Sheen Weight'].default_value
    sheen['sheenColorFactor']=[component*weight for component in shader.inputs['Sheen Tint'].default_value[:3]]
    report['sheenWeights'][material['name']]=weight
packed=bytearray();views=[];view_map={};seen={}
for index,view in enumerate(gltf['bufferViews']):
    chunk=binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]
    descriptor={k:v for k,v in view.items() if k not in {'byteOffset','buffer'}}
    key=(hashlib.sha256(chunk).digest(),json.dumps(descriptor,sort_keys=True))
    if key not in seen:
        while len(packed)%4:packed.append(0)
        seen[key]=len(views);views.append({**view,'byteOffset':len(packed),'buffer':0});packed.extend(chunk)
    view_map[index]=seen[key]
gltf['bufferViews']=views
for accessor in gltf['accessors']:
    if 'bufferView' in accessor:accessor['bufferView']=view_map[accessor['bufferView']]
for image in gltf.get('images',[]):
    if 'bufferView' in image:image['bufferView']=view_map[image['bufferView']]
accessors=[];accessor_map={};seen={}
for index,accessor in enumerate(gltf['accessors']):
    key=json.dumps(accessor,sort_keys=True)
    if key not in seen:seen[key]=len(accessors);accessors.append(accessor)
    accessor_map[index]=seen[key]
gltf['accessors']=accessors
for mesh in gltf['meshes']:
    for primitive in mesh['primitives']:
        primitive['attributes']={key:accessor_map[value] for key,value in primitive['attributes'].items()}
        if 'indices' in primitive:primitive['indices']=accessor_map[primitive['indices']]
for skin in gltf.get('skins',[]):skin['inverseBindMatrices']=accessor_map[skin['inverseBindMatrices']]
for animation in gltf['animations']:
    for sampler in animation['samplers']:
        for key in ['input','output']:sampler[key]=accessor_map[sampler[key]]
meshes=[];mesh_map={};seen={}
for index,mesh in enumerate(gltf['meshes']):
    key=json.dumps({k:v for k,v in mesh.items() if k!='name'},sort_keys=True)
    if key not in seen:seen[key]=len(meshes);meshes.append(mesh)
    mesh_map[index]=seen[key]
gltf['meshes']=meshes
for node in gltf['nodes']:
    if 'mesh' in node:node['mesh']=mesh_map[node['mesh']]
gltf['buffers']=[{'byteLength':len(packed)}]
encoded=json.dumps(gltf,separators=(',',':')).encode()
while len(encoded)%4:encoded+=b' '
while len(packed)%4:packed.append(0)
TARGET.write_bytes(struct.pack('<III',0x46546C67,2,28+len(encoded)+len(packed))+struct.pack('<II',len(encoded),0x4E4F534A)+encoded+struct.pack('<II',len(packed),0x004E4942)+packed)
report['meshPrimitives']=sum(len(m['primitives']) for m in meshes)
report['exportedMeshTriangles']=sum(gltf['accessors'][p['indices']]['count']//3 for m in meshes for p in m['primitives'])
report['instancedTriangles']=sum(sum(gltf['accessors'][p['indices']]['count']//3 for p in meshes[n['mesh']]['primitives']) for n in gltf['nodes'] if 'mesh' in n)
report['bytes']=TARGET.stat().st_size
report['roots']=['TABLET_ASSEMBLY','CARD_GESTURE','RADIO_GESTURE']
report['clips']=['tablet_raise','tablet_lower','card_present','radio_press']
report['coordinateSystem']='glTF Y up, +Z toward user; card/radio contact origin [0,0,0]'
report['sourcesUnchanged']=all(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==value for name,value in HASHES.items())
assert report['sourcesUnchanged']
(DOC/'runtime-export.json').write_text(json.dumps(report,indent=2)+'\n')
print('EXPORTED',str(TARGET),report['bytes'],flush=True)
