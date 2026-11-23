"""Create an independent bow art master. Never overwrite an existing master."""
from pathlib import Path
import bpy, json, hashlib
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/bow-master'
OUT.mkdir(parents=True, exist_ok=True)
TARGET = OUT / 'bow-master.blend'
assert not TARGET.exists(), 'Master already exists: edit it instead of rebuilding'
SOURCE = ROOT / 'docs/assets/unified-ship/cruz-del-sur-interior-panels.blend'
source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
source = bpy.data.scenes['CRUZ DEL SUR / Unified compact vessel']
bpy.context.window.scene = source
bpy.context.view_layer.update()
scene = bpy.data.scenes.new('CRUZ DEL SUR / Bow master')
names = ['01 Pressure shell and glazing', '02 Deck and ceiling',
         '03 Console hardware', '04 Seats and equipment', '05 Interior details',
         '06 Glass connector reference - no export', '07 First detail pass',
         '08 Interaction anchors - no export', '09 Studio lights and cameras - no export',
         '10 Preview displays - no export']
cols = {name:bpy.data.collections.new(name) for name in names}
for col in cols.values(): scene.collection.children.link(col)
copies = {}; materials = {}; inventory = []
def xyz(p): return Vector((p[0], -p[2], p[1]))
def bounds(obj):
    ps = [obj.matrix_world @ Vector(v) for v in obj.bound_box]
    return [min(p.x for p in ps), min(p.z for p in ps), min(-p.y for p in ps)], [max(p.x for p in ps), max(p.z for p in ps), max(-p.y for p in ps)]
for col in source.collection.children:
    if 'PREVIEW' in col.name or '/ 01 Lower' in col.name: continue
    for obj in col.objects:
        if obj.type not in {'MESH', 'CURVE', 'FONT'} or obj.hide_render: continue
        if obj.type == 'MESH' and not obj.data.polygons: continue
        lo, hi = bounds(obj)
        connector = '/ 03 Panoramic' in col.name
        if not connector and (hi[2] > 5.11 or lo[2] > 2.11 or lo[1] > 4.5 or hi[1] < -.4): continue
        if 'Distant orbital' in obj.name: continue
        n = obj.name.lower()
        dest = names[5] if connector else names[0]
        if not connector:
            if '/ 02 Interior' in col.name:
                dest = names[2] if any(s in n for s in ['computer','personal','communications','navigation','arcade','tactical','console']) else names[3]
            elif any(s in col.name for s in ['/ 08 ', '/ 09 ', '/ 10 ', '/ 11 ', '/ 12 ', '/ 13 ']): dest = names[4]
            if any(s in n for s in ['deck', 'floor', 'ceiling']): dest = names[1]
            if any(s in n for s in ['static preview display', 'static tactical surface', 'static navigation globe']): dest = names[9]
        copy = obj.copy(); copy.data = obj.data.copy(); copy.parent = None; copy.matrix_world = obj.matrix_world.copy()
        if obj.name.startswith('CDS REFINE / Props /'): copy.location.y -= 2.72
        copy['source_object'] = obj.name; copy['source_collection'] = col.name
        copy['exclude_runtime_export'] = connector or dest == names[9]
        cols[dest].objects.link(copy); copies[obj] = copy
        for slot in copy.material_slots:
            if slot.material:
                old = slot.material
                if old not in materials: materials[old] = old.copy()
                slot.material = materials[old]
        inventory.append({'name':copy.name, 'source':obj.name, 'collection':dest})
bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'
scene.world = source.world.copy() if source.world else bpy.data.worlds.new('Bow world')
scene.world.use_nodes = True
background = next((n for n in scene.world.node_tree.nodes if n.type == 'BACKGROUND'), None)
if background: background.inputs['Strength'].default_value = .16
# Keep only the new scene in this independently saved document.
for old in list(bpy.data.scenes):
    if old != scene: bpy.data.scenes.remove(old)

def mat(name, color, metal, rough, emission=0, texture=False):
    m = bpy.data.materials.new('BOW / '+name); m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal; p.inputs['Roughness'].default_value = rough
    p.inputs['Emission Color'].default_value = (*color, 1); p.inputs['Emission Strength'].default_value = emission
    m.diffuse_color = (*color, 1)
    if texture:
        noise = m.node_tree.nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 125
        bump = m.node_tree.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = .18; bump.inputs['Distance'].default_value = .009
        m.node_tree.links.new(noise.outputs['Fac'], bump.inputs['Height']); m.node_tree.links.new(bump.outputs['Normal'], p.inputs['Normal'])
    return m
paint = mat('Graphite satin alloy', (.085,.096,.105), .65,.38, texture=True)
edge = mat('Brushed champagne steel', (.3,.235,.15), .78,.32, texture=True)
rubber = mat('Recess seals', (.012,.018,.021), .1,.76)
warm = mat('Warm recessed diffuser', (1,.58,.23), .05,.35, 4)
cyan = mat('Navigation status', (.08,.7,.83), .05,.35, 2.5)
def box(name, pos, size, material, bevel=.009):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(pos)); obj=bpy.context.object; obj.name='BOW / '+name
    for col in list(obj.users_collection): col.objects.unlink(obj)
    cols[names[6]].objects.link(obj)
    obj.scale=(size[0],size[2],size[1]); bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    if bevel:
        mod=obj.modifiers.new('Machined edge','BEVEL'); mod.width=min(bevel,min(size)*.3); mod.segments=3
        obj.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL')
    return obj
# Flush perimeter hardware; no replacement floor stacked over the original deck.
for side in [-1,1]:
    for z in [-2.7,-1.2,.3]:
        x=side*2.55
        box('Flush inspection handle well',(x,.011,z),(.28,.012,.10),rubber)
        box('Captive handle',(x,.018,z),(.20,.008,.026),edge)
        for dx in [-.17,.17]: box('Deck captive fastener',(x+dx,.014,z),(.025,.008,.025),edge,.003)
    for z in [-2.8,-1.1,.6]:
        box('Ceiling luminaire cassette',(side*2.5,3.17,z),(.26,.085,1.25),paint)
        box('Ceiling diffuser',(side*2.5,3.123,z),(.095,.012,1.10),warm)
        for dz in [-.56,.56]: box('Luminaire end clamp',(side*2.5,3.115,z+dz),(.2,.025,.045),edge)
    for z in [-2.6,-1,.6]:
        box('Rear side maintenance fascia',(side*4.69,1.15,z),(.045,.52,1.12),paint)
        for dz in [-.43,.43]:
            for y in [.97,1.33]: box('Panel captive fixing',(side*4.66,y,z+dz),(.018,.028,.028),edge,.003)
        for i in range(5): box('Vent louvre',(side*4.66,1.05+i*.045,z),(.025,.012,.42),rubber,.002)
# Studio-only practical lights have no implied runtime cost.
def aim(obj, target): obj.rotation_euler=(xyz(target)-obj.location).to_track_quat('-Z','Y').to_euler()
for i,(pos,target,power,color,size) in enumerate([
    ((-2.5,3,-2),(0,.5,-2),320,(1,.65,.36),3),
    ((2.5,3,-2),(0,.5,-2),320,(1,.65,.36),3),
    ((0,2.8,.8),(0,.4,-2),240,(1,.8,.57),3),
    ((0,2.4,-7),(0,1,-3),180,(.27,.62,1),4)]):
    data=bpy.data.lights.new('Bow studio practical','AREA');data.energy=power;data.color=color;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new('LIGHT / Bow %02d'%i,data);cols[names[8]].objects.link(obj);obj.location=xyz(pos);aim(obj,target)
for name,pos,target in [('Forward overview',(0,1.85,1.65),(0,1.25,-5.8)),('Aft connection',(0,1.9,-4.9),(0,1.5,6.2))]:
    data=bpy.data.cameras.new(name);data.lens=22
    obj=bpy.data.objects.new('CAM / '+name,data);cols[names[8]].objects.link(obj);obj.location=xyz(pos);aim(obj,target)
scene.camera=bpy.data.objects['CAM / Forward overview']
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        area.spaces.active.region_3d.view_perspective='CAMERA'
        area.spaces.active.shading.type='MATERIAL'
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.outliner.orphans_purge(do_local_ids=True,do_linked_ids=True,do_recursive=True)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(TARGET))
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash
(OUT/'assembly.json').write_text(json.dumps({'source':str(SOURCE.relative_to(ROOT)), 'sourceSha256':source_hash, 'runtimeChanged':False, 'coordinateMapping':'runtime(x,y,z) -> Blender(x,-z,y)', 'objects':inventory, 'collections':{n:len(c.objects) for n,c in cols.items()}},indent=2))
scene.render.filepath=str(OUT/'bow-forward.png');bpy.ops.render.render(write_still=True)
print('BOW_MASTER_COMPLETE',str(TARGET),flush=True)
