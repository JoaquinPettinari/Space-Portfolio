"""Export only the approved nose, in world metres; never save over the master."""
from pathlib import Path
import bpy
import hashlib
import json
import struct

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'docs/assets/docking-intro/pampa-interior-review.blend'
OUT = ROOT / 'public/models/pampa-interior-nose.glb'
source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
scene = bpy.context.scene
collection = bpy.data.collections['REVIEW / Cropped PAMPA nose only']
objects = list(collection.objects)
assert objects and all(o.type == 'MESH' for o in objects)
temp = bpy.data.scenes.new('TEMP / Nose export')
for obj in objects:
    temp.collection.objects.link(obj)
bpy.context.window.scene = temp
bpy.ops.export_scene.gltf(
    filepath=str(OUT), export_format='GLB', use_selection=False, use_active_scene=True,
    export_animations=False, export_cameras=False, export_lights=False,
    export_yup=True, export_extras=False, export_image_format='AUTO')
raw = OUT.read_bytes()
document = json.loads(raw[20:20 + struct.unpack_from('<I', raw, 12)[0]])
assert not document.get('animations') and not document.get('cameras')
assert 'KHR_lights_punctual' not in document.get('extensions', {})
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == source_hash
report = {
    'sourceSha256': source_hash,
    'bytes': len(raw),
    'triangles': sum(document['accessors'][p['indices']]['count'] // 3
                     for m in document['meshes'] for p in m['primitives']),
    'meshes': len(document['meshes']),
    'materials': len(document.get('materials', [])),
    'images': len(document.get('images', [])),
    'sha256': hashlib.sha256(raw).hexdigest(),
}
(SOURCE.parent / 'pampa-interior-export.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
