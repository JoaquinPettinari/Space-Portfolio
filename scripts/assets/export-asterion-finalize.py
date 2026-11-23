"""Normalize Blender's emission export to the explicit prelit glTF contract."""
import gzip
import json
import struct
import itertools
import hashlib
from pathlib import Path

# Absolute authored/runtime centers: reruns cannot accumulate translations.
WINDOW_COMPOSITION = {
    'VESPER': {'sourcePosition': [-38, -29, -82], 'runtimePosition': [-38, -12, -82]},
    'NACRE': {'sourcePosition': [48, -17, -165], 'runtimePosition': [48, 28, -165]},
}


def body_key(name):
    return next((key for key in WINDOW_COMPOSITION if name.upper().removeprefix('ASTERION / ').startswith(key)), None)


def bounds(document):
    points = []
    for node in document['nodes']:
        if 'mesh' not in node:
            continue
        assert not node.get('children') and 'matrix' not in node, 'Exporter requires flat TRS nodes'
        x, y, z, w = node.get('rotation', [0, 0, 0, 1])
        matrix = ((1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)),
                  (2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)),
                  (2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)))
        scale = node.get('scale', [1, 1, 1])
        translation = node.get('translation', [0, 0, 0])
        for primitive in document['meshes'][node['mesh']]['primitives']:
            accessor = document['accessors'][primitive['attributes']['POSITION']]
            for corner in itertools.product(*zip(accessor['min'], accessor['max'])):
                points.append([sum(matrix[i][j] * corner[j] * scale[j] for j in range(3)) + translation[i] for i in range(3)])
    return [min(p[i] for p in points) for i in range(3)], [max(p[i] for p in points) for i in range(3)]

def finalize(path):
    binary = path.read_bytes()
    length = struct.unpack_from('<I', binary, 12)[0]
    document = json.loads(binary[20:20 + length])
    for node in document['nodes']:
        key = body_key(node['name'])
        if key:
            node['translation'] = WINDOW_COMPOSITION[key]['runtimePosition'].copy()
    for material in document['materials']:
        texture = material.pop('emissiveTexture', None)
        if texture is not None:
            material['pbrMetallicRoughness'] = {'baseColorFactor': [1, 1, 1, 1], 'baseColorTexture': texture}
        material.pop('emissiveFactor', None)
        material.setdefault('extensions', {})['KHR_materials_unlit'] = {}
        if material['name'] == 'ASTERION / Nacre prelit rings':
            material['alphaMode'] = 'BLEND'
            material['doubleSided'] = True
    document['extensionsUsed'] = sorted(set(document.get('extensionsUsed', []) + ['KHR_materials_unlit']))
    data = json.dumps(document, separators=(',', ':')).encode()
    data += b' ' * (-len(data) % 4)
    remaining = binary[20 + length:]
    path.write_bytes(struct.pack('<III', 0x46546C67, 2, 20 + len(data) + len(remaining)) + struct.pack('<II', len(data), 0x4E4F534A) + data + remaining)
    path.with_suffix('.glb.gz').write_bytes(gzip.compress(path.read_bytes(), compresslevel=9, mtime=0))
    minimum, maximum = bounds(document)
    manifest_path = path.parents[2] / 'src/game/world/asterionManifest.json'
    manifest = json.loads(manifest_path.read_text())
    for item in manifest['bodies'] + manifest['atmosphere']:
        key = body_key(item['name'])
        if key:
            item['position'] = WINDOW_COMPOSITION[key]['runtimePosition'].copy()
    manifest['boundsMin'], manifest['boundsMax'] = minimum, maximum
    manifest['layoutAdjustments'] = [dict(body=key, **value) for key, value in WINDOW_COMPOSITION.items()]
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
    audit_path = path.parents[2] / 'docs/assets/cosmos/runtime-export/export-audit.json'
    if audit_path.exists():
        audit = json.loads(audit_path.read_text())
        audit.update(manifest)
        audit['bytes']['model'] = path.stat().st_size
        audit['bytes']['gzip'] = path.with_suffix('.glb.gz').stat().st_size
        audit['triangles'] = sum(document['accessors'][p['indices']]['count'] // 3 for mesh in document['meshes'] for p in mesh['primitives'])
        audit['primitives'] = sum(len(mesh['primitives']) for mesh in document['meshes'])
        audit['unlitMaterials'] = len(document['materials'])
        audit['runtimeSha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
        source = path.parents[2] / 'docs/assets/cosmos/asterion-expanse-v2.blend'
        assert hashlib.sha256(source.read_bytes()).hexdigest() == audit['sourceSha256']
        audit_path.write_text(json.dumps(audit, indent=2) + '\n')


if __name__ == '__main__':
    finalize(Path(__file__).resolve().parents[2] / 'public/models/asterion-worlds.glb')
