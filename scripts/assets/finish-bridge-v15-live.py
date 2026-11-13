"""Source-only finish study. Preserve V14 geometry and its independent materials."""
from pathlib import Path
import bpy
ROOT = Path(__file__).resolve().parents[2]
NAME = 'Bridge - Material Study V15'
assert NAME not in bpy.data.scenes
source = bpy.data.scenes['Bridge - Ceiling Lamp Fix V14']
scene = bpy.data.scenes.new(NAME)
scene.world = source.world.copy() if source.world else None
scene.unit_settings.system = 'METRIC'
bpy.context.window.scene = scene
collection = bpy.data.collections.new('BRIDGE V15 / Architecture')
scene.collection.children.link(collection)
materials = {}
pairs = []
for old in source.objects:
    if old.type != 'MESH':
        continue
    obj = old.copy()
    obj.data = old.data.copy()
    collection.objects.link(obj)
    pairs.append((old, obj))
    for slot in obj.material_slots:
        key = slot.material.name.removeprefix('BRIDGE V2 ')
        if key not in materials:
            mat = slot.material.copy()
            mat.name = 'BRIDGE V15 ' + key
            materials[key] = mat
        slot.material = materials[key]

settings = {
    'Graphite': ((.028, .036, .044), .56, .42),
    'Ivory': ((.36, .365, .33), .57, .22),
    'Metal': ((.15, .175, .195), .39, .7),
}
for key, (color, roughness, metallic) in settings.items():
    mat = materials[key]
    # Rebuild image connections, retaining only the output and Principled shader.
    for node in list(mat.node_tree.nodes):
        if node.type not in {'BSDF_PRINCIPLED', 'OUTPUT_MATERIAL'}:
            mat.node_tree.nodes.remove(node)
    p = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Metallic'].default_value = metallic
    mat.diffuse_color = (*color, 1)

# Reuse the portable image-map pipeline without exporting or adding geometry.
import numpy as np
v2 = (ROOT / 'scripts/assets/texture-bridge-v2-live.py').read_text()
maps = v2[v2.index('N=512;'):v2.index('# Same non-destructive')]
maps = maps.replace('textures-v2', 'textures-v15').replace('BRIDGE V2 ', 'BRIDGE V15 ')
maps = maps.replace('default_rng(83)', 'default_rng(115)')
maps = maps.replace('2*np.pi*128', '2*np.pi*48').replace('2*np.pi*64', '2*np.pi*24')
maps = maps.replace("default_value=.25", "default_value=.18")
exec(compile(maps, __file__, 'exec'))
for key, color, strength in [
    ('Amber', (1.0, .68, .34), 1.5),
    ('Cyan', (.02, .32, .40), .55),
]:
    mat = materials[key]
    p = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Emission Color'].default_value = (*color, 1)
    p.inputs['Emission Strength'].default_value = strength
    mat.diffuse_color = (*color, 1)

# Confirm this iteration changes materials only, including interaction metadata.
for old, obj in pairs:
    assert old.matrix_world == obj.matrix_world
    assert len(old.data.vertices) == len(obj.data.vertices)
    assert all(a.co == b.co for a, b in zip(old.data.vertices, obj.data.vertices))
    assert dict(old.items()) == dict(obj.items())
images = {n.image for m in materials.values() for n in m.node_tree.nodes if n.type == 'TEX_IMAGE'}
assert len(images) == 7
assert all(tuple(i.size) == (512, 512) and i.packed_file for i in images)
assert all(m not in {s.material for o in source.objects if o.type == 'MESH' for s in o.material_slots} for m in materials.values())
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'docs/assets/bridge/bridge-interior-v15.blend'))
print(f'V15 saved: {len(pairs)} unchanged meshes, {len(materials)} independent materials, seven packed 512px maps. No runtime export.')
