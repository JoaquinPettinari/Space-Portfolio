"""Close the lower perimeter behind the consoles; source-only Blender revision."""
from pathlib import Path
from math import sin, cos
import json, bpy, bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT = Path(__file__).resolve().parents[2]
NAME = 'Bridge - Closed Console Walls V17'
assert NAME not in bpy.data.scenes
source = bpy.data.scenes['Bridge - Lighting Study V16']
scene = bpy.data.scenes.new(NAME)
scene.world = source.world
scene.unit_settings.system = 'METRIC'
bpy.context.window.scene = scene
collection = bpy.data.collections.new('BRIDGE V17 / Architecture')
scene.collection.children.link(collection)
rig = bpy.data.collections.new('PREVIEW ONLY / V17 lighting - exclude from GLB')
scene.collection.children.link(rig)
materials = {}
pairs = []
for old in source.objects:
    obj = old.copy()
    obj.data = old.data.copy()
    (rig if old.type == 'LIGHT' else collection).objects.link(obj)
    pairs.append((old, obj))
    if old.type == 'MESH':
        for slot in old.material_slots:
            materials[slot.material.name.removeprefix('BRIDGE V15 ')] = slot.material
base = (ROOT / 'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')], __file__, 'exec'))
outline = json.loads((ROOT / 'docs/assets/bridge/layout.json').read_text())['outline']
points = [Vector((x, z - 3.15)) for x, z in outline]
# Offset outward, keeping the existing inner boundary and furniture clear.
normals = []
for a, b in zip(points, points[1:]):
    d = (b-a).normalized()
    normals.append(Vector((d.y, -d.x)))
outer = []
for i, p in enumerate(points):
    if i == 0:
        delta = normals[0] * .16
    elif i == len(points)-1:
        delta = normals[-1] * .16
    else:
        bisector = (normals[i-1] + normals[i]).normalized()
        delta = bisector * (.16 / bisector.dot(normals[i]))
    outer.append(p + delta)
walls = []
for i, (a, b) in enumerate(zip(points, points[1:])):
    footprint = [a, b, outer[i+1], outer[i]]
    obj = prism('Lower hull closure %02d' % i, footprint, -.06, .80, 'Graphite')
    # Flush miter joints: beveling separate wall blocks would reopen their seams.
    obj.modifiers.clear()
    walls.append(obj)
    uv = obj.data.uv_layers.new(name='Surface metres')
    for poly in obj.data.polygons:
        axis = max(range(3), key=lambda j:abs(poly.normal[j]))
        axes = [j for j in range(3) if j != axis]
        for li in poly.loop_indices:
            p = obj.data.vertices[obj.data.loops[li].vertex_index].co
            uv.data[li].uv = (p[axes[0]], p[axes[1]])
# Add the two missing side sill sections, joining the existing five bow sills.
for i in (0, 6):
    a, b = points[i], points[i+1]
    beam('Lateral window sill', (a.x,.80,a.y), (b.x,.80,b.y), .24, 'Graphite')

# Check actual new mesh coverage from room side at multiple heights per segment.
hits = 0
for i, wall in enumerate(walls):
    tree = BVHTree.FromPolygons([v.co for v in wall.data.vertices],
                               [list(p.vertices) for p in wall.data.polygons])
    for t in (.02, .5, .98):
        p = points[i].lerp(points[i+1], t)
        n = normals[i]
        for height in (.05, .4, .75):
            origin = xyz((p.x-n.x*.1, height, p.y-n.y*.1))
            direction = xyz((n.x, 0, n.y))
            assert tree.ray_cast(origin, direction, .4)[0] is not None
            hits += 1
for old, obj in pairs:
    assert old.matrix_world == obj.matrix_world
    assert dict(old.items()) == dict(obj.items())
    if old.type == 'MESH':
        assert len(old.data.vertices) == len(obj.data.vertices)
        assert all(a.co == b.co for a,b in zip(old.data.vertices,obj.data.vertices))
assert len(walls) == 7
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'docs/assets/bridge/bridge-interior-v17.blend'))
print(f'V17 saved: seven 16cm lower hull segments, two lateral sills; {hits} coverage rays passed. Existing geometry unchanged; no runtime export.')
