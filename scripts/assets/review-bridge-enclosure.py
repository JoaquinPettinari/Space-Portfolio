"""Add the shared runtime closure to a preserved Blender assembly copy.

Run in bridge-complete-review.blend. Reads the runtime's shared JSON profile.
Original objects, photographs, materials and source file remain unchanged.
"""
import bpy
import bmesh
import hashlib
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/bridge-ceiling-study'
source = Path(bpy.data.filepath)
assert source.name == 'bridge-complete-review.blend'
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
scene = bpy.context.scene
originals = {o.name: tuple(v for row in o.matrix_world for v in row) for o in scene.objects}
collection = bpy.data.collections.new('STRUCTURE / Continuous bridge enclosure')
scene.collection.children.link(collection)
data = json.loads((ROOT / 'src/game/world/bridgeEnclosure.json').read_text())
profile = data['bulkhead']['profile']
count = len(profile)
z = data['bulkhead']['frontZ']
depth = data['bulkhead']['depth']
entries = [{
    'name': 'Chamfered pressure header',
    'vertices': [(x, y, layer) for layer in (z, z + depth) for x, y in profile],
    'faces': [tuple(reversed(range(count))), tuple(range(count, count * 2))]
        + [(i, (i+1)%count, (i+1)%count+count, i+count) for i in range(count)],
}]
for panel in data['panels']:
    x,y,z = panel['at']
    a,b,c = [s/2 for s in panel['size']]
    entries.append({'name': panel['name'],
        'vertices': [(x+dx*a,y+dy*b,z+dz*c) for dx,dy,dz in
            [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]],
        'faces': [(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]})
created = []
for entry in entries:
    vertices = [(x,-z,y) for x,y,z in entry['vertices']]
    faces = entry['faces']
    mesh = bpy.data.meshes.new(entry['name'])
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new('STRUCTURE / ' + entry['name'], mesh)
    collection.objects.link(obj)
    mat = bpy.data.materials.new(obj.name)
    mat.use_nodes = True
    shader = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    def linear(v):
        return v / 12.92 if v <= .04045 else ((v+.055)/1.055)**2.4
    color = [linear(int(data['color'][i:i+2],16)/255) for i in (1,3,5)]
    shader.inputs['Base Color'].default_value = (*color, 1)
    mat.diffuse_color = (*color, 1)
    shader.inputs['Metallic'].default_value = data['metalness']
    shader.inputs['Roughness'].default_value = data['roughness']
    mesh.materials.append(mat)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=0.00001)
    boundary = sum(1 for e in bm.edges if not e.is_manifold)
    bm.free()
    assert boundary == 0, (obj.name, boundary)
    created.append(obj.name)

name = 'STRUCTURE REVIEW / Rear wall and ceiling'
camera = bpy.data.objects.get(name)
if camera is None:
    camera = bpy.data.objects.new(name, bpy.data.cameras.new(name))
    scene.collection.objects.link(camera)
camera.location = (0, -.2, 1.65)
camera.rotation_euler = (Vector((1.1, -2.2, 2.65)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.lens = 18
scene.camera = camera
scene.name = 'CRUZ DEL SUR / Continuous bridge structure'
for name, matrix in originals.items():
    assert tuple(v for row in scene.objects[name].matrix_world for v in row) == matrix, name
assert hashlib.sha256(source.read_bytes()).hexdigest() == source_hash
destination = OUT / 'bridge-structure-review.blend'
try:
    bpy.ops.wm.save_as_mainfile(filepath=str(destination))
except RuntimeError:
    pending = Path(str(destination) + '@')
    if not pending.is_file():
        raise
    print('PENDING_NATIVE_RENAME', pending)
(OUT / 'enclosure-validation.json').write_text(json.dumps({
    'source': source.name, 'sourceSha256': source_hash,
    'originalObjectTransformsPreserved': len(originals),
    'addedClosedMeshes': created, 'coordinateTransform': '(x,y,z) -> (x,-z,y)',
    'sourceUnchanged': True, 'runtimeGeometryShared': True,
}, indent=2))
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        area.spaces.active.region_3d.view_perspective = 'CAMERA'
print('STRUCTURE_READY', destination)
