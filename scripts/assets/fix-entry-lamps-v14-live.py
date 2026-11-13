"""Blender-only fix: separate six coplanar lamp housings from their diffusers."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
v8=(ROOT/'scripts/assets/detail-bridge-furniture-v8-live.py').read_text()
prefix=v8[:v8.index('existing = set(collection.objects)')]
prefix=prefix.replace('Bridge - Furniture Details V8','Bridge - Ceiling Lamp Fix V14').replace('Bridge - Finished Entry V7','Bridge - Matching Entry Niches V13').replace('BRIDGE V8 / Architecture','BRIDGE V14 / Architecture')
exec(compile(prefix,__file__,'exec'))
from mathutils import Vector
housings=[o for o in collection.objects if o.name.startswith('Entry ceiling lamp bezel')]
lenses=[o for o in collection.objects if o.name.startswith('Entry ceiling diffuser')]
assert len(housings)==len(lenses)==6
for o in housings:
    inverse=o.matrix_world.inverted()
    for v in o.data.vertices:
        p=o.matrix_world@v.co
        if p.z<3.05:p.z=3.06
        v.co=inverse@p
    o.data.update()
# Lens undersides remain at 3.04m, preserving the existing walking clearance.
# Housing begins at 3.06m, with an 8mm gap above the lens's 3.052m top.
for o in housings:
    assert min((o.matrix_world@v.co).z for v in o.data.vertices)>3.059
for o in lenses:
    assert abs(min((o.matrix_world@v.co).z for v in o.data.vertices)-3.04)<.0001
    assert max((o.matrix_world@v.co).z for v in o.data.vertices)<3.053
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/bridge/bridge-interior-v14.blend'))
print('Six lamp housings corrected. Source V13 preserved. Blender only: runtime GLB not exported.')
