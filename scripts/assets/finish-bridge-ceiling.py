"""Non-destructive Blender finish pass; procedural shaders require baking for GLB."""
import bpy
import bmesh
import hashlib
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/bridge-ceiling-study'
source = Path(bpy.data.filepath)
assert source.name == 'bridge-ceiling-sculpted.blend', source
digest = hashlib.sha256(source.read_bytes()).hexdigest()
scene = bpy.context.scene
prefixes = ('SCULPTED CEILING /', 'CEILING POLISH /', 'CEILING BOW /')

def fingerprint(o):
    values = [tuple(v for row in o.matrix_world for v in row), o.hide_render]
    if o.type == 'MESH':
        values.extend([tuple(tuple(v.co) for v in o.data.vertices),
                       tuple(m.name if m else None for m in o.data.materials),
                       tuple(tuple(p.vertices) for p in o.data.polygons)])
        values.extend(tuple(tuple(v.uv) for v in layer.data) for layer in o.data.uv_layers)
    return hashlib.sha256(repr(values).encode()).hexdigest()

protected = {o.name: fingerprint(o) for o in scene.objects
             if o.type == 'MESH' and not o.name.startswith(prefixes)}
col = bpy.data.collections.new('CEILING FINISH / Panel retainers and seals')
scene.collection.children.link(col)
materials = {}
for label, low, high, bump in (
    ('Satin charcoal titanium', .34, .47, .00013),
    ('Warm grey recessed alloy', .45, .56, .00008),
    ('Brushed edge alloy', .26, .36, .00006),
):
    original = bpy.data.materials['CEILING POLISH / ' + label]
    m = original.copy(); m.name = 'CEILING FINISH / ' + label
    nodes, links = m.node_tree.nodes, m.node_tree.links
    p = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
    tex = nodes.new('ShaderNodeTexCoord')
    noise = nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 180
    noise.inputs['Detail'].default_value = 2
    links.new(tex.outputs['Object'], noise.inputs['Vector'])
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (low, low, low, 1)
    ramp.color_ramp.elements[1].color = (high, high, high, 1)
    links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], p.inputs['Roughness'])
    micro = nodes.new('ShaderNodeBump'); micro.inputs['Strength'].default_value = .16
    micro.inputs['Distance'].default_value = bump
    links.new(noise.outputs['Fac'], micro.inputs['Height'])
    links.new(micro.outputs['Normal'], p.inputs['Normal'])
    materials[original.name] = m

changed = []
for o in list(scene.objects):
    if o.type != 'MESH' or not o.name.startswith(prefixes):
        continue
    if not any(m and m.name in materials for m in o.data.materials):
        continue
    o.data = o.data.copy()
    for i, m in enumerate(o.data.materials):
        if m and m.name in materials: o.data.materials[i] = materials[m.name]
    changed.append(o.name)

edge = materials['CEILING POLISH / Brushed edge alloy']
seal = bpy.data.materials['CEILING POLISH / Matte recessed gasket']
created = []

def box(name, center, size, material, bevel=.003):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co.x *= size[0]; v.co.y *= size[1]; v.co.z *= size[2]
    data = bpy.data.meshes.new(name); bm.to_mesh(data); bm.free()
    o = bpy.data.objects.new('CEILING FINISH / ' + name, data); col.objects.link(o)
    o.location = center; data.materials.append(material)
    if bevel:
        mod = o.modifiers.new('Machined radius', 'BEVEL'); mod.width = bevel; mod.segments = 2
        o.modifiers.new('Face normals', 'WEIGHTED_NORMAL')
    created.append(o.name)
    return o

# Recessed joint lines follow each trapezoidal bay; small captive retainers
# connect the insert to its tray instead of floating decorative screws.
for o in list(scene.objects):
    if not o.name.startswith('SCULPTED CEILING / Recessed ceramic insert'): continue
    points = [o.matrix_world @ v.co for v in o.data.vertices]
    suffix = o.name.rsplit('insert ', 1)[1]
    for i, (a, b) in enumerate(zip(points, points[1:] + points[:1])):
        midpoint = (a + b) / 2
        joint = box(f'Panel gasket {suffix} {i}', midpoint + Vector((0, 0, -.012)),
                    ((b-a).length, .013, .012), seal, .002)
        joint.rotation_euler = (b-a).to_track_quat('X', 'Z').to_euler()
    for i, p in enumerate(points):
        center = sum(points, Vector()) / len(points)
        pos = p.lerp(center, .055); pos.z -= .018
        box(f'Captive retainer {suffix} {i}', pos, (.065, .038, .022), edge)
        box(f'Retainer slot {suffix} {i}', pos + Vector((0, 0, -.012)),
            (.029, .004, .002), seal, 0)

light_changes = {}
for o in scene.objects:
    if o.type != 'LIGHT': continue
    if o.name.startswith('Warm ceiling grazing'):
        light_changes[o.name] = [o.data.energy, 14]
        o.data = o.data.copy(); o.data.energy = 14
        o.data.size = 1.15; o.data.size_y = .38
    elif o.name.startswith('Fixture soft downlight'):
        light_changes[o.name] = [o.data.energy, 34]
        o.data = o.data.copy(); o.data.energy = 34
        o.data.size = .38; o.data.size_y = .90

# Validate new solid pieces, without rewriting original meshes or shelves.
invalid = []
for name in created:
    bm = bmesh.new(); bm.from_mesh(bpy.data.objects[name].data)
    if any(not e.is_manifold for e in bm.edges): invalid.append(name)
    bm.free()
assert not invalid, invalid
bpy.context.view_layer.update()
assert all(fingerprint(scene.objects[n]) == h for n, h in protected.items())
assert hashlib.sha256(source.read_bytes()).hexdigest() == digest
scene.name = 'CRUZ DEL SUR / Finished bridge ceiling'
scene.camera = bpy.data.objects['CEILING BOW REVIEW / Whole ceiling']
destination = OUT / 'bridge-ceiling-finished.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(destination))
(OUT / 'ceiling-finish-validation.json').write_text(json.dumps({
    'source': source.name, 'sourceSha256': digest, 'sourceUnchanged': True,
    'protectedMeshCount': len(protected), 'protectedMeshesUnchanged': True,
    'refinedCeilingMeshes': len(changed), 'newMeshes': len(created),
    'nonManifoldNewMeshes': invalid, 'rebalancedLights': light_changes,
    'runtimeExported': False, 'proceduralMaterialsNeedBaking': True,
}, indent=2), encoding='utf-8')
print('FINISHED', destination, 'protected', len(protected), 'new', len(created))
