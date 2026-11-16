"""Export evaluated art from the open polished .blend, without saving its source.

World coordinates and interaction names are retained. Live screens, glass,
doors, colliders and review lights stay under the game's existing ownership.
"""
from pathlib import Path
import bpy, bmesh, json, imbuf, blf, numpy as np
from mathutils import Matrix

# Live exec may not define __file__; locate the checkout from the saved source.
if not bpy.data.filepath:
    raise RuntimeError('Save the Blender source inside the intended checkout before exporting')
ROOT = next((parent for parent in Path(bpy.data.filepath).resolve().parents
             if (parent / 'package.json').is_file() and (parent / 'src').is_dir()), None)
if ROOT is None:
    raise RuntimeError('The Blender source must belong to a Space-Portfolio checkout')
OUT = ROOT / 'docs/audits/interior-orbit-polish'
OUT.mkdir(parents=True, exist_ok=True)
source = bpy.context.scene
assert Path(bpy.data.filepath).name == 'cruz-del-sur-interior-panels.blend'
assert source.name == 'CRUZ DEL SUR / Unified compact vessel'
interior = bpy.data.collections['UNIFIED / 02 Interior and equipment - retained anchors']
bridge = [o for o in interior.objects if o.type == 'MESH' and o.get('runtime_reference_file') in {
    'cruz-del-sur-bridge-interior.glb', 'cruz-del-sur-furnishings.glb', 'cruz-del-sur-amber-details.glb'}]
arrival = [o for o in interior.objects if o.type == 'MESH' and o.get('source_scene') == 'Arrival Room - Spacious V10'
           and 'panoramic glass' not in o.get('original_object', '')]
details = []
for collection in source.collection.children:
    if any(collection.name.startswith('UNIFIED / %02d ' % i) for i in range(8, 13)):
        details.extend(o for o in collection.objects if o.type == 'MESH'
                       and 'Static preview display' not in o.name
                       and 'Static tactical surface' not in o.name
                       and 'Static navigation globe' not in o.name
                       and 'Distant orbital vista' not in o.name)
details = [o for o in details if o.name != 'CDS POLISH / Docking pressure hatch labels and seams / Service stencils']

reports = []
def export(filename, objects, arrival_local=False):
    previous_meshes = set(bpy.data.meshes)
    temp = bpy.data.scenes.new('TEMP / Refined runtime export')
    material_copies = {}
    groups = {}
    try:
        bpy.context.window.scene = temp
        # Evaluate originals in their source scene, including parented hatch trim.
        bpy.context.window.scene = source
        dg = bpy.context.evaluated_depsgraph_get()
        for original in objects:
            data = bpy.data.meshes.new_from_object(original.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
            data.transform(original.matrix_world)
            # Runtime-only placement corrections; the editable Blender source stays intact.
            if original.name.startswith('CDS REFINE / Props /'):
                data.transform(Matrix.Translation((0, -2.72, 0)))
            # Existing open grilles retain their topology; deepen bars and dark wells.
            floor_scale = 5 if 'ARR10 grating' in original.name else 2.5 if original in bridge else 1
            if floor_scale != 1:
                for vertex in data.vertices:
                    if -.09 < vertex.co.z < 0:
                        vertex.co.z *= floor_scale
            if arrival_local:
                data.transform(Matrix.Translation((0, 12.07, 0)))
            elif 'Docking pressure hatch labels and seams' in original.name:
                # Preview hatch is behind the live hatch. Fit trim to the live face.
                data.transform(Matrix.Translation((0, .37, 0)))
            materials = list(data.materials)
            for index, material in enumerate(materials):
                if material is None:
                    continue
                part_data = data.copy()
                bm = bmesh.new(); bm.from_mesh(part_data)
                bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index != index], context='FACES')
                if not bm.faces:
                    bm.free(); bpy.data.meshes.remove(part_data); continue
                closed = all(e.is_manifold for e in bm.edges)
                if closed:
                    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
                for f in bm.faces:
                    f.material_index = 0
                bm.to_mesh(part_data); bm.free()
                # Joining meshes with differently named UV layers otherwise fills
                # the first layer with zeroes on later postcard/label inserts.
                if part_data.uv_layers.active:
                    part_data.uv_layers.active.name = 'UVMap'
                key = (material.name, closed)
                if key not in material_copies:
                    local = material.copy()
                    local.name = material.name + ' / runtime'
                    if closed:
                        local.use_backface_culling = True
                    # Noise/bump nodes are a Blender preview effect, not exported
                    # procedural shaders. Reuse simple PBR values and bitmap color.
                    shader = next((n for n in local.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if local.use_nodes else None
                    if shader and material.name.startswith(('CDS ORGANIC /', 'CDS TAILORED /', 'CDS CONSOLE / Brushed')):
                        for link in list(shader.inputs['Normal'].links):
                            local.node_tree.links.remove(link)
                    if shader and material.name.startswith('CDS ORGANIC /'):
                        image = next((n for n in local.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image and 'Botanical leaf' in n.image.name), None)
                        if image:
                            local.node_tree.links.new(image.outputs['Color'], shader.inputs['Base Color'])
                    if shader and material.name.startswith(('CDS DETAIL / Graphite deck', 'CDS DETAIL / Pressure panel')):
                        # The packed Blender wear bitmap is channel data, not an
                        # RGB albedo. Export a neutral PBR finish instead of green.
                        for socket in ['Base Color', 'Roughness']:
                            for link in list(shader.inputs[socket].links): local.node_tree.links.remove(link)
                        shader.inputs['Base Color'].default_value = (.055, .068, .080, 1)
                        shader.inputs['Roughness'].default_value = .58
                    material_copies[key] = local
                part_data.materials.clear(); part_data.materials.append(material_copies[key])
                part = bpy.data.objects.new('Refined evaluated part', part_data)
                temp.collection.objects.link(part)
                interaction = original.get('interaction', '')
                # Split noninteractive detail by room to preserve frustum culling.
                z = sum(-v.co.y for v in part_data.vertices) / len(part_data.vertices)
                zone = 'arrival' if arrival_local or z >= 11.8 else 'bridge'
                groups.setdefault((zone, interaction, key), []).append(part)
            bpy.data.meshes.remove(data)
        bpy.context.window.scene = temp
        for (zone, interaction, key), parts in groups.items():
            bpy.ops.object.select_all(action='DESELECT')
            for part in parts: part.select_set(True)
            bpy.context.view_layer.objects.active = parts[0]
            if len(parts) > 1: bpy.ops.object.join()
            part = parts[0]
            part.name = 'REFINED_' + zone + '_' + (interaction or 'static') + '_' + key[0].replace(' / ', '_')
            if interaction: part['interaction'] = interaction
        bpy.ops.object.select_all(action='SELECT')
        target = ROOT / 'public/models' / filename
        bpy.ops.export_scene.gltf(filepath=str(target), export_format='GLB', use_selection=True,
            use_active_scene=True, export_yup=True, export_extras=True,
            export_animations=False, export_cameras=False, export_lights=False,
            export_image_format='WEBP', export_image_quality=88)
        reports.append({'file': filename, 'sourceObjects': len(objects), 'batches': len(temp.objects),
            'triangles': sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in temp.objects),
            'bytes': target.stat().st_size, 'arrivalLocal': arrival_local})
    finally:
        bpy.context.window.scene = source
        for ob in list(temp.objects):
            data = ob.data; bpy.data.objects.remove(ob, do_unlink=True)
            if data.users == 0: bpy.data.meshes.remove(data)
        bpy.data.scenes.remove(temp)
        for material in material_copies.values():
            if material.users == 0: bpy.data.materials.remove(material)
        for mesh in set(bpy.data.meshes) - previous_meshes:
            if mesh.users == 0: bpy.data.meshes.remove(mesh)

export('cruz-del-sur-refined-bridge.glb', bridge)
export('cruz-del-sur-refined-arrival.glb', arrival, arrival_local=True)
export('cruz-del-sur-refined-details.glb', details)

# Reproduce the shared runtime artwork from the approved source bitmaps.
texture_dir = ROOT / 'public/textures/cruz-del-sur'
texture_dir.mkdir(parents=True, exist_ok=True)
art_dir = ROOT / 'docs/assets/unified-ship/consoles-orbit-refinement'
for source_file, target_file, quality in [
    (art_dir / 'orbital-panorama.png', 'orbital-vista.webp', 88),
    (art_dir / 'deep-space-environment.png', 'deep-space.webp', 88),
    (ROOT / 'docs/assets/unified-ship/blender-tactical-static.png', 'tactical-surface.webp', 90),
]:
    image = imbuf.load(str(source_file))
    try:
        image.file_type = 'WEBP'; image.quality = quality
        imbuf.write(image, filepath=str(texture_dir / target_file))
    finally:
        image.free()
image = imbuf.load(str(art_dir / 'console-display-atlas.png'))
try:
    with image.with_buffer(write=True) as buffer:
        pixels = np.asarray(buffer)
        for index in range(4):
            x = index % 2 * 768; y = index // 2 * 512
            pixels[y+459:y+496, x+24:x+570] = [3, 13, 21, 255]
            pixels[y+14:y+37, x+24:x+744] = [3, 13, 21, 255]
    font = blf.load('C:/Windows/Fonts/consola.ttf')
    with blf.bind_imbuf(font, image):
        for index, title in enumerate(['PERSONAL WORKSTATION', 'RECREATION TERMINAL', 'CENTRAL ARCHIVE', 'EARTH COMMUNICATIONS']):
            blf.size(font, 24); blf.color(font, .35, .86, .9, 1)
            blf.position(font, index % 2 * 768 + 28, index // 2 * 512 + 466, 0)
            blf.draw_buffer(font, title)
            blf.size(font, 10); blf.color(font, 18/255, 66/255, 81/255, 1)
            blf.position(font, index % 2 * 768 + 28, index // 2 * 512 + 22, 0)
            blf.draw_buffer(font, 'MISSION LOG 014 / EXPLORATION LINK / ALL SYSTEMS NOMINAL')
    imbuf.write(image, filepath=str(texture_dir / 'console-display-atlas.png'))
finally:
    image.free()
(OUT / 'export.json').write_text(json.dumps({'source': bpy.data.filepath, 'sourceSaved': False,
    'lightsExported': False, 'collidersChanged': False, 'assets': reports}, indent=2), encoding='utf-8')
print('REFINED EXPORT', json.dumps(reports))
