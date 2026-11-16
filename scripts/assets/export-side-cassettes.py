"""Export the approved Blender-only niches without changing the saved source.

Run Blender --background docs/assets/unified-ship/cruz-del-sur-interior-panels.blend
--python scripts/assets/export-side-cassettes.py. Leaf colour is baked into small
images; procedural micro-bump stays a Blender preview feature.
"""
from pathlib import Path
import bpy, json

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/audits/arrival-layout'
OUT.mkdir(parents=True, exist_ok=True)
source = bpy.context.scene
collection = bpy.data.collections['UNIFIED / 13 Reference side cassettes - Blender only']
temp = bpy.data.scenes.new('TEMP / Side cassette export')
bpy.context.window.scene = source
dg = bpy.context.evaluated_depsgraph_get()
copies = []
for original in collection.objects:
    if original.type != 'MESH':
        continue
    data = bpy.data.meshes.new_from_object(original.evaluated_get(dg), depsgraph=dg)
    data.transform(original.matrix_world)
    materials = [m.copy() if m else None for m in data.materials]
    data.materials.clear()
    for material in materials:
        data.materials.append(material)
    obj = bpy.data.objects.new(original.name, data)
    temp.collection.objects.link(obj)
    copies.append(obj)

bpy.context.window.scene = temp
temp.render.engine = 'CYCLES'
temp.cycles.samples = 1
for obj in copies:
    material = obj.data.materials[0]
    if not material or not material.use_nodes:
        continue
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    shader = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
    if 'Specimen' in material.name and 'leaves' in material.name:
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(island_margin=.02)
        bpy.ops.object.mode_set(mode='OBJECT')
        image = bpy.data.images.new(material.name + ' / runtime colour', width=256, height=256)
        target = nodes.new('ShaderNodeTexImage')
        target.image = image
        nodes.active = target
        emission = nodes.new('ShaderNodeEmission')
        base = shader.inputs['Base Color']
        if base.links:
            links.new(base.links[0].from_socket, emission.inputs['Color'])
        else:
            emission.inputs['Color'].default_value = base.default_value
        output = next(n for n in nodes if n.type == 'OUTPUT_MATERIAL')
        links.new(emission.outputs[0], output.inputs['Surface'])
        bpy.ops.object.bake(type='EMIT', margin=3)
        links.new(shader.outputs['BSDF'], output.inputs['Surface'])
        for link in list(base.links):
            links.remove(link)
        links.new(target.outputs['Color'], base)
        image.pack()
        nodes.remove(emission)
    for link in list(shader.inputs['Normal'].links):
        links.remove(link)

bpy.ops.object.select_all(action='DESELECT')
for obj in copies:
    obj.select_set(True)
target = ROOT / 'public/models/cruz-del-sur-reference-cassettes.glb'
bpy.ops.export_scene.gltf(filepath=str(target), export_format='GLB', use_selection=True,
    use_active_scene=True, export_yup=True, export_animations=False, export_cameras=False,
    export_lights=False, export_image_format='WEBP', export_image_quality=88)
report = {'source': bpy.data.filepath, 'sourceSaved': False, 'meshes': len(copies),
    'triangles': sum(sum(len(p.vertices)-2 for p in obj.data.polygons) for obj in copies),
    'bytes': target.stat().st_size, 'leafColourBake': [256,256],
    'collidersExported': False, 'lightsExported': False}
(OUT / 'side-cassette-export.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('SIDE_CASSETTE_EXPORT', json.dumps(report))
