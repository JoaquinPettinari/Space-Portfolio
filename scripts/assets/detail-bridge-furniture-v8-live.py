"""Add furniture fittings without changing screen anchors or collider footprints."""
from pathlib import Path
from math import sin, cos
import json, bpy, bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
NAME = 'Bridge - Furniture Details V8'
assert NAME not in bpy.data.scenes
source = bpy.data.scenes['Bridge - Finished Entry V7']
scene = bpy.data.scenes.new(NAME)
scene.world = source.world
scene.unit_settings.system = 'METRIC'
bpy.context.window.scene = scene
collection = bpy.data.collections.new('BRIDGE V8 / Architecture')
scene.collection.children.link(collection)
materials = {}
for old in source.objects:
    if old.type != 'MESH':
        continue
    obj = old.copy()
    obj.data = old.data.copy()
    collection.objects.link(obj)
    for slot in old.material_slots:
        materials[slot.material.name.removeprefix('BRIDGE V2 ')] = slot.material
base = (ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')], __file__, 'exec'))
existing = set(collection.objects)
layout = json.loads((ROOT/'docs/assets/bridge/layout.json').read_text())
for original in layout['consoles']:
    pose = dict(original)
    pose['z'] -= 3.15
    # Low-profile fittings below the monitor faces; keep existing instruments clear.
    for side in [-1, 1]:
        x = side * pose['length'] * .32
        box('Control bank recess', (x,1.047,.36), (.42,.012,.19), 'Gasket', .003, pose)
        for row in range(2):
            for col in range(4):
                box('Control bank key', (x-.145+col*.095,1.061,.315+row*.085),
                    (.062,.016,.048), 'Metal' if row else 'Ivory', .004, pose)
        box('Control bank indicator', (x,1.055,.468), (.26,.008,.012), 'Amber', .002, pose)
    for x in [-pose['length']*.43, pose['length']*.43]:
        for z in [-.40,.43]:
            box('Counter captive fixing', (x,1.046,z), (.025,.008,.025), 'Metal', .002, pose)
    # Central service strip stays below existing console instruments.
    for j in range(6):
        box('Console service grille', (-.19+j*.076,1.045,-.40), (.035,.008,.11), 'Gasket', .001, pose)

table_start = set(collection.objects)
table_z = -2.65
# Applied armor on the existing pedestal, beneath its unchanged interactive top.
for side in [-1, 1]:
    for x in [-.34,.34]:
        box('Tactical service panel', (x,.48,table_z+side*.867), (.58,.57,.028), 'Metal', .012)
        box('Tactical panel inset', (x,.48,table_z+side*.885), (.46,.43,.012), 'Graphite', .004)
        for dx in [-.23,.23]:
            for y in [.25,.71]:
                box('Tactical captive fixing', (x+dx,y,table_z+side*.895), (.026,.026,.012), 'Metal', .003)
    box('Tactical amber plinth', (0,.13,table_z+side*.87), (.90,.035,.035), 'Amber', .006)
    box('Tactical armored edge', (side*.665,.48,table_z), (.08,.76,1.78), 'Metal', .018)
    for j in range(6):
        box('Tactical side vent', (side*.709,.40+j*.047,table_z), (.012,.018,1.1), 'Graphite', .002)
    # Rim fittings are outside the 1.8m screen, inside the 2.1m collider footprint.
    for z in [-.9,.9]:
        box('Tactical rim bumper', (side*.98,1.055,table_z+z), (.10,.025,.30), 'Metal', .008)
        box('Tactical rim lamp', (side*.98,1.071,table_z+z), (.055,.007,.16), 'Amber', .002)
for obj in set(collection.objects)-table_start:
    obj['interaction'] = 'tactical'

for obj in set(collection.objects)-existing:
    uv = obj.data.uv_layers.new(name='Surface metres')
    obj.data.update()
    for poly in obj.data.polygons:
        axis = max(range(3), key=lambda i: abs(poly.normal[i]))
        pair = [i for i in range(3) if i != axis]
        for li in poly.loop_indices:
            p = obj.data.vertices[obj.data.loops[li].vertex_index].co
            uv.data[li].uv = (p[pair[0]],p[pair[1]])
# Preserve hit-target metadata through batching, instead of absorbing table details
# into noninteractive room geometry. Three's GLTFLoader reads extras as userData.
footer = base[base.index('# Editable source'):base.index('bpy.ops.wm.save_as_mainfile')]
footer = footer.replace("groups.setdefault(data.materials[0].name,[]).append(copy)",
    "copy['interaction'] = obj.get('interaction', '')\n    groups.setdefault((data.materials[0].name,obj.get('interaction','')),[]).append(copy)")
footer = footer.replace("key.replace(' ','_')", "(key[0]+'_'+key[1]).replace(' ','_')")
footer = footer.replace('export_yup=True', 'export_extras=True,export_yup=True')
exec(compile(footer, __file__, 'exec'))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/bridge/bridge-interior-v8.blend'))
print('V8 saved/exported: console fittings and tactical armor; anchors and colliders preserved.')
