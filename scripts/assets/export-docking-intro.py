"""Export only cinematic-owned assets from the open docking master.

Run through Blender with __file__ defined. Source frame, scene, selection and
data remain intact; export copies are disposed without saving the master.
"""
from pathlib import Path
import bpy
import gzip
import hashlib
import json
import shutil
import struct
from mathutils import Matrix

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'docs/assets/docking-intro/cruz-del-sur-docking-intro.blend'
OUT = ROOT / 'public/models'
assert Path(bpy.data.filepath).resolve() == SOURCE.resolve()
scene = bpy.context.scene
frame = scene.frame_current
active = bpy.context.view_layer.objects.active
selected = list(bpy.context.selected_objects)
temporary_scenes = []
owned_objects = []
owned_meshes = []


def three(vector):
    return [float(vector.x), float(vector.z), float(-vector.y)]


def copied_scene(name, originals, moving_root=None):
    temp = bpy.data.scenes.new(name)
    temporary_scenes.append(temp)
    lookup = {}
    dg = bpy.context.evaluated_depsgraph_get()
    for original in originals:
        if original.type not in {'MESH', 'EMPTY'}:
            continue
        if original.type == 'MESH':
            mesh = bpy.data.meshes.new_from_object(
                original.evaluated_get(dg), preserve_all_data_layers=True,
                depsgraph=dg)
            owned_meshes.append(mesh)
        else:
            mesh = None
        copy = bpy.data.objects.new(original.name + ' / export', mesh)
        owned_objects.append(copy)
        temp.collection.objects.link(copy)
        lookup[original] = copy
        # Store exact semantic names in extras: Three may sanitize node names.
        copy['sourceName'] = original.name
        if original.name.startswith('CLAMP_'):
            copy['dockingRole'] = 'clamp'
            copy['clampOpen'] = three(original.matrix_world.translation)
            copy['clampClosed'] = closed_positions[original.name]
        elif original.name.startswith('Dock / approach guide'):
            copy['dockingRole'] = 'guide'
        elif original.name.startswith('Dock / secure lamp'):
            copy['dockingRole'] = 'securedLight'
        if original == moving_root:
            copy['dockingRole'] = 'pampaRoot'
            copy.matrix_world = Matrix.Identity(4)
        elif moving_root is None:
            copy.matrix_world = original.matrix_world.copy()
    if moving_root is not None:
        for original, copy in lookup.items():
            if original == moving_root:
                continue
            copy.parent = lookup.get(original.parent)
            copy.matrix_parent_inverse = original.matrix_parent_inverse.copy()
            copy.matrix_basis = original.matrix_basis.copy()
    return temp


def export(temp, filename):
    bpy.context.window.scene = temp
    path = OUT / filename
    # GLB is supported by the installed exporter (dynamic enum metadata can be
    # empty outside its UI); all static enums are resolved from RNA identifiers.
    props = bpy.ops.export_scene.gltf.get_rna_type().properties
    material_mode = next(i.identifier for i in props['export_materials'].enum_items
                         if i.identifier == 'EXPORT')
    image_mode = next(i.identifier for i in props['export_image_format'].enum_items
                      if i.identifier == 'AUTO')
    bpy.ops.export_scene.gltf(
        filepath=str(path), export_format='GLB', use_selection=False,
        use_active_scene=True, export_animations=False, export_cameras=False,
        export_lights=False, export_extras=True, export_yup=True,
        export_apply=False, export_materials=material_mode,
        export_image_format=image_mode)
    raw = path.read_bytes()
    (OUT / (filename + '.gz')).write_bytes(gzip.compress(raw, compresslevel=9, mtime=0))
    size = struct.unpack_from('<I', raw, 12)[0]
    document = json.loads(raw[20:20+size])
    triangles = sum(document['accessors'][p['indices']]['count']//3
                    for m in document.get('meshes', []) for p in m['primitives']
                    if p.get('mode', 4) == 4)
    assert not document.get('animations') and not document.get('cameras')
    assert 'KHR_lights_punctual' not in document.get('extensions', {})
    return {'file':filename,'bytes':len(raw),'gzipBytes':(OUT/(filename+'.gz')).stat().st_size,
            'sha256':hashlib.sha256(raw).hexdigest(),'triangles':triangles,
            'meshes':len(document.get('meshes', [])),
            'materials':len(document.get('materials', [])),
            'images':len(document.get('images', []))}


try:
    dock = [o for c in scene.collection.children
            if c.name.startswith(('03 /', '03B /')) for o in c.objects]
    pampa = list(next(c for c in scene.collection.children
                      if c.name.startswith('02 /')).objects)
    carrier = next(o for o in pampa if o.name == 'PAMPA_07_MOTION')
    scene.frame_set(207)
    bpy.context.view_layer.update()
    closed_positions = {o.name:three(o.matrix_world.translation) for o in dock
                        if o.name.startswith('CLAMP_')}
    scene.frame_set(1)
    bpy.context.view_layer.update()
    pampa_temp = copied_scene('TEMP / Pampa export', pampa, carrier)
    adapter_temp = copied_scene('TEMP / Adapter export', dock)
    report = [export(pampa_temp, 'pampa-07-docking.glb'),
              export(adapter_temp, 'docking-adapter.glb')]
    shutil.copyfile(SOURCE.parent/'docking-motion.json', OUT/'docking-motion.json')
    (SOURCE.parent/'runtime-export.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))
finally:
    bpy.context.window.scene = scene
    scene.frame_set(frame)
    for o in owned_objects:
        bpy.data.objects.remove(o, do_unlink=True)
    for mesh in owned_meshes:
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)
    for temp in temporary_scenes:
        bpy.data.scenes.remove(temp)
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for o in selected:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active
