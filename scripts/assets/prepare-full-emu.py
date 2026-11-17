"""Restore the original NASA lower garment below the prepared hanging jacket.

Run in a separate factory-startup Blender. All input GLBs are preserved.
"""
from pathlib import Path
import bpy, bmesh, json, math
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / 'docs/assets/nasa-emu'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(EVIDENCE / 'original.glb'))
lower = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
bpy.context.view_layer.objects.active = lower
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bm = bmesh.new(); bm.from_mesh(lower.data)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index not in {0, 1, 2, 7, 9, 10}], context='FACES')
cut = bmesh.ops.bisect_plane(bm, geom=list(bm.verts)+list(bm.edges)+list(bm.faces),
    dist=.00001, plane_co=(0,0,1.10), plane_no=(0,0,1), clear_outer=True)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.0002)
seen = set()
remove = []
retained = []
for seed in bm.verts:
    if seed in seen: continue
    stack = [seed]; vertices = []; faces = set()
    while stack:
        v = stack.pop()
        if v in seen: continue
        seen.add(v); vertices.append(v); faces.update(v.link_faces)
        stack.extend(edge.other_vert(v) for edge in v.link_edges)
    # Confirmed connected pants/boots and two leg pockets. All other islands
    # below this waist cut belong to the original exhibition stand/arm rests.
    if len(faces) in {22067, 2176}:
        retained.append(len(faces))
    else:
        remove.extend(vertices)
if sorted(retained) != [2176, 2176, 22067]:
    raise RuntimeError('Original lower garment topology changed: ' + str(retained))
bmesh.ops.delete(bm, geom=remove, context='VERTS')
bm.to_mesh(lower.data); bm.free()
print('LOWER',len(lower.data.polygons), flush=True)
# Match the prepared fabric, seams and visor; no external image decoding at runtime.
slots = [p.material_index for p in lower.data.polygons]
lower.data.materials.clear()
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/models/cruz-del-sur-eva-hanging.glb'))
upper = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o != lower]
for o in upper:
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.000001)
    seen = set()
    remove = []
    for seed in bm.verts:
        if seed in seen: continue
        stack=[seed]; vertices=[]; faces=set()
        while stack:
            v=stack.pop()
            if v in seen: continue
            seen.add(v); vertices.append(v); faces.update(v.link_faces)
            stack.extend(e.other_vert(v) for e in v.link_edges)
        points = [o.matrix_world @ v.co for v in vertices]
        # Confirmed disconnected planar rack remnant and the previous hanger.
        # The standing niche provides its own support, so neither is needed.
        if (len(faces) == 436 and min(p.y for p in points) > .24) or (
            len(faces) == 12 and min(p.y for p in points) > .22
            and max(p.z for p in points) > .9
        ):
            remove.extend(vertices)
    bmesh.ops.delete(bm, geom=remove, context='VERTS')
    bm.to_mesh(o.data); bm.free()
fabric = next(m for m in bpy.data.materials if m.name.startswith('EVA woven pressure fabric'))
reinforced = next(m for m in bpy.data.materials if m.name.startswith('EVA reinforced gray seams'))
band = next(m for m in bpy.data.materials if m.name.startswith('EVA ochre safety bands'))
for mat in [fabric, reinforced, band]: lower.data.materials.append(mat)
for polygon, old in zip(lower.data.polygons, slots):
    polygon.material_index = 1 if old in {1,7} else 2 if old == 9 else 0
    polygon.use_smooth = True
bpy.context.view_layer.objects.active = lower
before = sum(len(p.vertices)-2 for p in lower.data.polygons)
modifier = lower.modifiers.new('Lower garment simplification','DECIMATE')
modifier.ratio = min(1,15000/max(1,before))
bpy.ops.object.modifier_apply(modifier=modifier.name)
lower.data.transform(Matrix.Rotation(math.pi,4,'Z'))
# Initial source-aligned fitting; upper garment remains the approved baked pose.
scale = .8477713859289447
for v in lower.data.vertices:
    v.co *= scale
lower.name = 'Full EMU lower garment'
for o in upper:
    o.location.z += 1.04 * scale
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# A single uniform scale preserves human proportions. Canonical GLB origin is
# the soles, with a centred depth range so the runtime collider stays explicit.
meshes = [lower] + upper
points = [o.matrix_world @ v.co for o in meshes for v in o.data.vertices]
lo = Vector(tuple(min(v[i] for v in points) for i in range(3)))
hi = Vector(tuple(max(v[i] for v in points) for i in range(3)))
size = hi - lo
factor = min(2.12 / size.z, .88 / size.x, .86 / size.y)
center = (lo + hi) / 2
for o in meshes:
    inverse = o.matrix_world.inverted()
    for v in o.data.vertices:
        world = o.matrix_world @ v.co
        world = Vector(((world.x-center.x)*factor, (world.y-center.y)*factor, (world.z-lo.z)*factor))
        v.co = inverse @ world
    o.data.update()
# One material batch per existing finish. No rig, texture, light or animation.
bpy.ops.object.select_all(action='DESELECT')
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active = lower
bpy.ops.object.join()
lower.name = 'Full EMU with relaxed arms and original leg garment'

if '--inspect' in __import__('sys').argv:
    target = ROOT / 'artifacts/full-emu-inspection.glb'
else:
    target = ROOT / 'public/models/cruz-del-sur-eva-full.glb'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(target), export_format='GLB', export_yup=True,
    export_animations=False, export_lights=False, export_cameras=False)
print('FULL_EMU_EXPORT',str(target),flush=True)
points = [lower.matrix_world @ v.co for v in lower.data.vertices]
report = {
    'sourcesPreserved': ['original.glb', 'cruz-del-sur-eva-hanging.glb'],
    'lowerGarmentComponents': retained,
    'output': target.name,
    'triangles': sum(len(p.vertices)-2 for p in lower.data.polygons),
    'materials': len({p.material_index for p in lower.data.polygons}),
    'bytes': target.stat().st_size,
    'boundsMin': [min(v.x for v in points), min(v.z for v in points), -max(v.y for v in points)],
    'boundsMax': [max(v.x for v in points), max(v.z for v in points), -min(v.y for v in points)],
}
(EVIDENCE / 'full-audit.json').write_text(json.dumps(report, indent=2) + '\n')
print('FULL_EMU',json.dumps(report),flush=True)
