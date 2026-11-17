"""Relax the prepared EMU into an unoccupied garment; preserve its source GLB.

Run with a separate factory-startup Blender, never the user's live scene.
"""
from pathlib import Path
import bpy
import json
import bmesh
from mathutils import Vector

root = Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root / 'public/models/cruz-del-sur-eva-suit.glb'))
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
confirmed = {2176: ('left', 'glove'), 1858: ('right', 'glove'),
             4597: ('left', 'sleeve'), 4397: ('right', 'sleeve'),
             1402: ('left', 'sleeve'), 1462: ('right', 'sleeve'),
             902: ('left', 'sleeve'), 896: ('right', 'sleeve')}
found = set()
# Two anatomical segments, baked once at export. Rotation preserves the sleeve
# cross section; a short blended elbow zone preserves continuity without a rig.
arm_joints = {
    'left': ((-.21, .47, -.25), (-.35, .29, -.27), (-.32, .18, -.075)),
    'right': ((.18, .47, -.15), (.33, .30, -.10), (.22, .21, .085)),
}

def smooth(value):
    value = max(0, min(1, value))
    return value * value * (3 - 2 * value)

def hanging_arm(point, side, kind):
    shoulder, elbow, wrist = [Vector(p) for p in arm_joints[side]]
    upper = elbow - shoulder
    lower = wrist - elbow
    outward = -.055 if side == 'left' else .075
    upper_direction = Vector((outward, -upper.length, 0)).normalized()
    lower_direction = Vector((0, -1, 0))
    upper_rotation = upper.normalized().rotation_difference(upper_direction)
    lower_rotation = lower.normalized().rotation_difference(lower_direction)
    hanging_elbow = shoulder + upper_direction * upper.length
    proximal = shoulder + upper_rotation @ (point - shoulder)
    distal = hanging_elbow + lower_rotation @ (point - elbow)
    tangent = (upper.normalized() + lower.normalized()).normalized()
    elbow_weight = 1 if kind == 'glove' else smooth(((point - elbow).dot(tangent) + .06) / .12)
    deformed = proximal.lerp(distal, elbow_weight)
    shoulder_weight = 1 if kind == 'glove' else smooth((.55 - point.y) / .10)
    return point.lerp(deformed, shoulder_weight)
glove_centers = {}
for obj in meshes:
    inverse = obj.matrix_world.inverted()
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    # Material and normal seams duplicate vertices. Weld exact copies so each
    # known glove is transformed as one garment piece, including inner fingers.
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.000001)
    seen = set()
    for seed in bm.verts:
        if seed in seen:
            continue
        stack = [seed]
        component = []
        faces = set()
        while stack:
            vertex = stack.pop()
            if vertex in seen:
                continue
            seen.add(vertex)
            component.append(vertex)
            faces.update(vertex.link_faces)
            stack.extend(edge.other_vert(vertex) for edge in vertex.link_edges)
        identity = confirmed.get(len(faces))
        if not identity:
            continue
        side, kind = identity
        found.add((side, kind))
        for vertex in component:
            world = obj.matrix_world @ vertex.co
            point = Vector((world.x, world.z, -world.y))
            point = hanging_arm(point, side, kind)
            vertex.co = inverse @ Vector((point.x, -point.z, point.y))
        if kind == 'glove':
            center = sum((obj.matrix_world @ vertex.co for vertex in component), Vector()) / len(component)
            glove_centers[side] = [center.x, center.z, -center.y]
            if center.z > .08:
                raise RuntimeError('Glove must hang below the elbow: ' + side)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
if len(found) != 4:
    raise RuntimeError('Prepared source garment topology changed: ' + str(found))

# Test the garment's baked pose rather than the renderer: cuffs and hands must
# descend under their shoulder, not retain the source's forward-reaching arms.
for side, center in glove_centers.items():
    shoulder = Vector(arm_joints[side][0])
    if center[1] >= -.05 or abs(center[0] - shoulder.x) > .12:
        raise RuntimeError('Glove does not hang vertically under its shoulder: ' + side)

support_material = next(material for material in bpy.data.materials if 'reinforced' in material.name)
for name, at, size in [
    ('Garment support rail', (0, .93, -.25), (.56, .028, .035)),
    ('Left shoulder support', (-.25, .71, -.25), (.025, .44, .035)),
    ('Right shoulder support', (.25, .71, -.25), (.025, .44, .035)),
]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(at[0], -at[2], at[1]))
    obj = bpy.context.object
    obj.name = name
    obj.scale = (size[0], size[2], size[1])
    obj.data.materials.append(support_material)

# Reuse the garment's finishes in one static mesh instead of three extra draws.
bpy.ops.object.select_all(action='DESELECT')
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
for obj in meshes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.join()

# Keep the original back-plane clearance after dropping both full sleeves.
obj = bpy.context.object
points = [obj.matrix_world @ vertex.co for vertex in obj.data.vertices]
forward = max(0, max(point.y for point in points) - .375)
inverse = obj.matrix_world.inverted()
for vertex in obj.data.vertices:
    point = obj.matrix_world @ vertex.co
    point.y -= forward
    vertex.co = inverse @ point
obj.data.update()
for center in glove_centers.values():
    center[2] += forward

target = root / 'public/models/cruz-del-sur-eva-hanging.glb'
bpy.ops.export_scene.gltf(filepath=str(target), export_format='GLB', export_yup=True,
                          export_animations=False, export_lights=False, export_cameras=False)
points = [obj.matrix_world @ vertex.co for obj in bpy.context.scene.objects if obj.type == 'MESH' for vertex in obj.data.vertices]
report = {
    'source': 'cruz-del-sur-eva-suit.glb (preserved)',
    'output': target.name,
    'bytes': target.stat().st_size,
    'triangles': sum(len(face.vertices) - 2 for obj in bpy.context.scene.objects if obj.type == 'MESH' for face in obj.data.polygons),
    'gloveCenters': glove_centers,
    'boundsMin': [min(point.x for point in points), min(point.z for point in points), -max(point.y for point in points)],
    'boundsMax': [max(point.x for point in points), max(point.z for point in points), -min(point.y for point in points)],
}
(root / 'docs/assets/nasa-emu/hanging-audit.json').write_text(json.dumps(report, indent=2) + '\n')
print('HANGING_EMU', json.dumps(report), flush=True)

