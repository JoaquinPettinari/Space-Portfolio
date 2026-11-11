"""Original reference-inspired passage bay. Run with Blender --background --python.

Dimensions are metres in application coordinates (X right, Y up, -Z forward).
Blender stores (X, -Z, Y); glTF exporter restores the application axes.
No external models, textures, lights or add-ons are required.
"""
from pathlib import Path
import json
import math
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/panoramic-bay'
GLB = ROOT / 'src/dev/assets/04-panoramic-bay.glb'
OUT.mkdir(parents=True, exist_ok=True)
LENGTH = 6.1 / 3
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1
bpy.context.preferences.filepaths.save_version = 0
bpy.context.preferences.filepaths.file_preview_type = 'NONE'
parts = []


def material(name, rgb, metallic=0, roughness=.5, emission=0, alpha=1):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = (*rgb, alpha)
    node.inputs['Metallic'].default_value = metallic
    node.inputs['Roughness'].default_value = roughness
    node.inputs['Alpha'].default_value = alpha
    node.inputs['Emission Color'].default_value = (*rgb, 1)
    node.inputs['Emission Strength'].default_value = emission
    mat.diffuse_color = (*rgb, alpha)
    if alpha < 1:
        mat.surface_render_method = 'DITHERED'
        mat.use_backface_culling = False
    return mat


graphite = material('Graphite structural alloy', (.065, .083, .095), .65, .42)
panels = material('Warm grey removable panels', (.28, .29, .27), .5, .5)
ivory = material('Off-white ceramic housings', (.61, .60, .53), .25, .5)
rubber = material('Black glazing gaskets', (.012, .021, .025), .05, .85)
steel = material('Machined edge steel', (.22, .28, .30), .8, .32)
amber = material('Amber diffuser', (1, .49, .16), .1, .35, 2)
cyan = material('Cyan floor guidance', (.10, .73, .85), .1, .35, 1.6)
glass = material('Blue-grey glazing', (.28, .51, .61), .05, .16, alpha=.12)
mark = material('Safety ochre', (.69, .39, .11), .25, .6)


def app(v):
    return Vector((v[0], -v[2], v[1]))


def box(name, at, size, mat, group, bevel=.012):
    bpy.ops.mesh.primitive_cube_add(size=1, location=app(at))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    obj['assembly'] = group
    if bevel:
        mod = obj.modifiers.new('Machined edge bevel', 'BEVEL')
        mod.width = min(bevel, min(size) / 4)
        mod.segments = 2
    parts.append(obj)
    return obj


def beam(name, a, b, width, depth, mat, group):
    delta = app(b) - app(a)
    obj = box(name, tuple((a[i] + b[i]) / 2 for i in range(3)),
              (width, delta.length, depth), mat, group)
    obj.rotation_mode = 'QUATERNION'
    # All ribs lie in the cross-section; keep their depth along Blender Y.
    z_axis = delta.normalized()
    y_axis = Vector((0, 1, 0))
    x_axis = y_axis.cross(z_axis)
    obj.rotation_quaternion = Matrix((x_axis, y_axis, z_axis)).transposed().to_quaternion()
    return obj


# Floor datum Y=0. No raised thresholds across the walking path.
box('DECK structural tray', (0, -.115, 0), (3.14, .23, LENGTH), graphite, 'FLOOR')
for z in [-LENGTH / 4, LENGTH / 4]:
    box('DECK removable center plate', (0, -.018, z),
        (1.12, .036, LENGTH / 2 - .045), panels, 'FLOOR')
    for side in [-1, 1]:
        box('DECK grating recess', (side * .99, -.012, z),
            (.72, .024, LENGTH / 2 - .045), rubber, 'FLOOR')
        for j in range(15):
            box('DECK grating slat', (side * .99, -.004, z - .44 + j * .062),
                (.67, .008, .022), steel, 'FLOOR', 0)
        for dx in [-.44, .44]:
            box('DECK captive fastener', (dx, .001, z + side * .39),
                (.028, .002, .028), steel, 'FLOOR', 0)
        box('DECK safety edge', (side * .58, -.001, z),
            (.025, .002, .72), mark, 'FLOOR', 0)

# End portals lie inside bay bounds, so copies tile without intersecting.
for z in [-LENGTH / 2 + .07, LENGTH / 2 - .07]:
    for side in [-1, 1]:
        beam('RIB vertical jamb', (side * 1.50, .05, z),
             (side * 1.50, 2.47, z), .16, .14, graphite, 'STRUCTURE')
        beam('RIB chamfer', (side * 1.50, 2.47, z),
             (side * 1.09, 3.09, z), .16, .14, graphite, 'ROOF')
        box('RIB inner liner', (side * 1.407, 1.48, z),
            (.022, 1.85, .10), steel, 'STRUCTURE', .004)
        for y in [.3, 1.0, 2.3]:
            box('RIB service fastener', (side * 1.395, y, z),
                (.012, .032, .032), steel, 'STRUCTURE', .003)
    beam('ROOF cross member', (-1.09, 3.09, z), (1.09, 3.09, z),
         .16, .14, graphite, 'ROOF')

for side in [-1, 1]:
    # Layered lower service sill, with ventilation and inset amber status marker.
    box('SILL base', (side * 1.52, .25, 0), (.24, .5, LENGTH), graphite, 'STRUCTURE')
    box('SILL removable panel', (side * 1.387, .27, 0),
        (.025, .31, LENGTH - .24), panels, 'STRUCTURE')
    box('SILL cyan channel', (side * 1.367, .10, 0),
        (.018, .025, LENGTH - .34), cyan, 'STRUCTURE', .003)
    for z in [-.58, .58]:
        for i in range(5):
            box('SILL recessed vent', (side * 1.371, .21 + i * .022, z),
                (.008, .009, .28), rubber, 'STRUCTURE', 0)
    # Flat side glass surrounded by independently named dark seals.
    box('GLASS side panel', (side * 1.50, 1.49, 0),
        (.012, 1.84, LENGTH - .20), glass, 'GLASS', 0)
    for y in [.54, 2.44]:
        box('WINDOW horizontal frame', (side * 1.50, y, 0),
            (.15, .10, LENGTH), graphite, 'STRUCTURE')
        box('WINDOW rubber gasket', (side * 1.412, y, 0),
            (.025, .045, LENGTH - .15), rubber, 'STRUCTURE', .003)
    for z in [-LENGTH / 2 + .15, LENGTH / 2 - .15]:
        box('WINDOW end seal', (side * 1.472, 1.49, z),
            (.04, 1.85, .035), rubber, 'STRUCTURE', .003)
    # Sloped roof shoulders carry layered off-white lamp housings.
    a, b = (side * 1.50, 2.47, 0), (side * 1.09, 3.09, 0)
    beam('ROOF sloping shoulder', a, b, .075, LENGTH - .18, panels, 'ROOF')
    beam('ROOF lamp housing', (side * 1.43, 2.53, 0),
         (side * 1.18, 2.91, 0), .09, 1.42, ivory, 'ROOF')
    beam('ROOF lamp black inset', (side * 1.38, 2.55, 0),
         (side * 1.16, 2.88, 0), .055, 1.25, rubber, 'ROOF')
    beam('ROOF amber diffuser', (side * 1.345, 2.60, 0),
         (side * 1.195, 2.83, 0), .035, 1.12, amber, 'ROOF')
    # Structure behind side glazing gives the ship a visible exterior thickness.
    box('HULL outer shoulder', (side * 1.82, .16, 0),
        (.42, .16, LENGTH), panels, 'OUTER_HULL')
    box('HULL outer stringer', (side * 2.03, .33, 0),
        (.09, .16, LENGTH), steel, 'OUTER_HULL')
    for z in [-.72, 0, .72]:
        beam('HULL lateral bracket', (side * 1.57, .25, z),
             (side * 2.03, .33, z), .10, .09, graphite, 'OUTER_HULL')
    box('ROOF longitudinal rail', (side * 1.09, 3.09, 0),
        (.16, .16, LENGTH), graphite, 'ROOF')
    box('ROOF glazing seal', (side * 1.0, 3.045, 0),
        (.035, .025, LENGTH - .16), rubber, 'ROOF')
    box('GLASS skylight', (side * .54, 3.08, 0),
        (.90, .012, LENGTH - .20), glass, 'ROOF_GLASS', 0)
box('ROOF spine', (0, 3.09, 0), (.14, .16, LENGTH), graphite, 'ROOF')

# Preserve editable primitives/modifiers in the source blend.
scene = bpy.context.scene
scene['module_length_m'] = LENGTH
scene['floor_datum'] = 'Y=0 in glTF; Z=0 in Blender'
scene['integration'] = 'Visual asset only; retain gameplay colliders. Not integrated yet.'
# Useful initial solid/material preview, no automatic screenshots or rendering.
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces.active.clip_end = 150
            area.spaces.active.shading.color_type = 'MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'panoramic-bay.blend'))

# Export evaluated geometry, batched by assembly/material, keeping glass separable.
groups = {}
for obj in parts:
    groups.setdefault((obj['assembly'], obj.data.materials[0].name), []).append(obj)
for (assembly, mat), objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.convert(target='MESH')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if len(objects) > 1:
        bpy.ops.object.join()
    bpy.context.object.name = assembly + '__' + mat.replace(' ', '_')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(GLB), export_format='GLB',
                          use_selection=True, export_yup=True,
                          export_cameras=False, export_lights=False)
stats = {'source': 'Original script-built geometry inspired by user reference',
         'length_m': LENGTH, 'walkway_width_m': 2.8, 'central_height_m': 3,
         'materials': len({o.data.materials[0].name for o in bpy.context.scene.objects if o.type == 'MESH'}), 'export_bytes': GLB.stat().st_size}
meshes = [o for o in scene.objects if o.type == 'MESH']
stats['meshes'] = len(meshes)
stats['triangles'] = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes)
points = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
stats['gltf_bounds_m'] = [[min(v[i] for v in points), max(v[i] for v in points)] for i in [0, 2]] + [[-max(v.y for v in points), -min(v.y for v in points)]]
stats['textures'] = 0
(OUT / 'inspection.json').write_text(json.dumps(stats, indent=2) + '\n', encoding='utf8')
print('BAY_EXPORT', json.dumps(stats))
