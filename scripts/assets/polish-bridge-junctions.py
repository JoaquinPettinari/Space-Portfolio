"""Finish the assembled bridge's architectural joints; preserve every source object."""
import bpy
import hashlib
import json
from array import array
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/bridge-ceiling-study'
source = Path(bpy.data.filepath)
assert source.name == 'bridge-structure-review.blend'
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
scene = bpy.context.scene

def signature(obj):
    h = hashlib.sha256(str((tuple(v for row in obj.matrix_world for v in row), obj.hide_render, obj.hide_viewport)).encode())
    if obj.type == 'MESH':
        a = array('f', [0]) * (len(obj.data.vertices)*3)
        obj.data.vertices.foreach_get('co', a)
        h.update(a.tobytes())
        h.update(str([m.name if m else None for m in obj.data.materials]).encode())
        if obj.data.uv_layers.active:
            a = array('f', [0]) * (len(obj.data.loops)*2)
            obj.data.uv_layers.active.data.foreach_get('uv', a)
            h.update(a.tobytes())
    return h.hexdigest()

protected = {o.name: signature(o) for o in scene.objects}
col = bpy.data.collections.new('BRIDGE FINISH / Architectural joints')
scene.collection.children.link(col)
materials = {key:bpy.data.materials[name] for key,name in {
    'shell':'CEILING POLISH / Satin charcoal titanium',
    'panel':'CEILING POLISH / Warm grey recessed alloy',
    'edge':'CEILING POLISH / Brushed edge alloy',
    'seal':'CEILING POLISH / Matte recessed gasket',
    'warm':'CEILING POLISH / Warm encased diffuser',
}.items()}
created = []

def box(name, position, size, material, bevel=.004):
    bpy.ops.mesh.primitive_cube_add(size=1, location=position)
    obj = bpy.context.object
    obj.name = 'BRIDGE FINISH / ' + name
    for c in list(obj.users_collection): c.objects.unlink(obj)
    col.objects.link(obj)
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(materials[material])
    if bevel:
        mod = obj.modifiers.new('Manufactured edges', 'BEVEL')
        mod.width = min(bevel, min(size)*.3)
        mod.segments = 2
        obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    created.append(obj)
    return obj

# Rear pressure header: separate fitted cartridges, seams and small captive bolts.
# Kept above the original niches; the shelf contents are never touched.
for side in (-1,1):
    for index,x in enumerate((1.96,2.77,3.58,4.39)):
        x *= side
        box('Header gasket', (x,-2.232,2.97), (.76,.025,.57), 'seal')
        box('Header service cartridge', (x,-2.212,2.97), (.72,.025,.53), 'panel', .01)
        box('Cartridge folded lip', (x,-2.193,2.735), (.62,.018,.025), 'edge')
        for dx in (-.30,.30):
            box('Captive header fastener', (x+dx,-2.193,3.17), (.022,.013,.022), 'edge', .003)
    # Continuous cornice terminates at the opaque wall, ahead of panoramic glazing.
    box('Wall ceiling shadow channel', (side*4.70,.61,2.90), (.15,3.74,.16), 'seal', .012)
    box('Wall ceiling folded fascia', (side*4.65,.61,2.90), (.10,3.74,.10), 'shell', .012)
    for y in (-.90,.25,1.40):
        box('Cornice recessed lens', (side*4.591,y,2.90), (.014,.68,.018), 'warm', .003)
    # Recessed toe rail follows the opaque console section, outside the walking aisle.
    box('Console lower service rail', (side*4.30,.69,.15), (.055,2.5,.12), 'shell', .01)
    for y in (-.36,.69,1.74):
        box('Console rail joint', (side*4.269,y,.15), (.016,.026,.09), 'edge', .003)

# Roof cassette seams between the existing transverse structural ribs.
for side in (-1,1):
    for a,b in ((-.12,1.04),(1.35,2.46)):
        box('Longitudinal cassette joint', (side*1.86,(a+b)/2,3.207), (.028,b-a,.018), 'edge', .003)

# Threshold fastenings stay flush with the existing floor, outside personal shelves.
for x in (-1.1,-.55,.55,1.1):
    box('Flush threshold attachment', (x,-.86,.008), (.026,.026,.003), 'edge', .001)

bpy.context.view_layer.update()
for name,value in protected.items(): assert signature(scene.objects[name]) == value, name
assert hashlib.sha256(source.read_bytes()).hexdigest() == source_hash
photos = [o.name for o in scene.objects if o.name.startswith('PHOTO / Personal image')]
assert len(photos) == 4
camera = bpy.data.objects.new('FINISH REVIEW / Complete bridge', bpy.data.cameras.new('FINISH REVIEW'))
scene.collection.objects.link(camera)
camera.location = (.55,-4.65,1.66)
camera.rotation_euler = (Vector((0,.8,1.8))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.lens = 17
scene.camera = camera
scene.name = 'CRUZ DEL SUR / Finished bridge joints'
destination = OUT / 'bridge-junctions-polished.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(destination))
(OUT / 'junctions-validation.json').write_text(json.dumps({
    'source':source.name,'sourceSha256':source_hash,'sourceUnchanged':True,
    'protectedObjectsUnchanged':len(protected),'photographsPreserved':photos,
    'addedMeshes':len(created),'newLights':0,'newMaterials':0,
    'runtimeExported':False,'revision':destination.name,
}, indent=2))
print('JUNCTIONS_READY', len(created), destination)
