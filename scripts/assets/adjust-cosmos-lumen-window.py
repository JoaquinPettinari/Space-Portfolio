"""Apply the single composition adjustment found in the actual arrival window."""
import bpy
import json
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/cosmos'
scene = bpy.context.scene
lumen = bpy.data.objects['LUMEN / pale distant satellite']
assert abs(lumen.location.x + 90) < .001
assert any(abs(lumen.location.y-value) < .001 for value in (-16,4))
assert all(abs(value - 1.44) < .001 for value in lumen.scale)
lumen.location.z = 3.5
lumen.location.y = 4
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'asterion-expanse-v2.blend'))
path = OUT/'polish-v2-validation.json'
data = json.loads(path.read_text(encoding='utf-8'))
data['lumen_window_adjustment'] = {'position_blender': list(lumen.location), 'scale': list(lumen.scale), 'reason': 'Clear the arrival upper frame and the bridge port rear mullion.'}
data['output_sha256'] = hashlib.sha256((OUT/'asterion-expanse-v2.blend').read_bytes()).hexdigest()
path.write_text(json.dumps(data, indent=2), encoding='utf-8')
print('LUMEN_WINDOW', json.dumps(data['lumen_window_adjustment']), data['output_sha256'])
