"""Replace the flat rear facade within its existing collision envelope."""
from pathlib import Path
from math import sin, cos
import bpy, bmesh
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[2]
NAME = 'Bridge - Recessed Entry V3'
assert NAME not in bpy.data.scenes
source = bpy.data.scenes['Bridge - Surface Finishes V2']
scene = bpy.data.scenes.new(NAME)
scene.world = source.world
bpy.context.window.scene = scene
collection = bpy.data.collections.new('BRIDGE V3 / Architecture')
scene.collection.children.link(collection)
materials = {}
for old in source.objects:
    if old.type != 'MESH': continue
    obj = old.copy(); obj.data = old.data.copy(); collection.objects.link(obj)
    for slot in obj.material_slots:
        materials[slot.material.name.removeprefix('BRIDGE V2 ')] = slot.material
base = (ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')], __file__, 'exec'))
existing = set(collection.objects)
# Recesses face the arriving visitor (+Z). All geometry stays in the old wall
# volume: X 1.34..4.8, Y 0..3.3, Z 4.95..5.25. No narrowing of the doorway.
for side in [-1, 1]:
    def panel(name, x, y, z, w, h, d, mat='Metal'):
        return box(name, (side*x,y,z), (w,h,d), mat)
    panel('Entry inner pier',1.66,1.65,5.1,.64,3.3,.3,'Graphite')
    panel('Entry outer panel',3.97,1.65,5.1,1.66,3.3,.3,'Ivory')
    panel('Niche lower plinth',2.56,.36,5.1,1.16,.72,.3,'Metal')
    panel('Niche upper panel',2.56,2.86,5.1,1.16,.88,.3,'Metal')
    panel('Niche recessed back',2.56,1.57,4.98,1.16,1.7,.06,'Graphite')
    for x in [2.02,3.10]:
        panel('Niche side lining',x,1.57,5.10,.08,1.7,.24,'Gasket')
    for y in [.76,2.38]:
        panel('Niche lining ledge',2.56,y,5.10,1.08,.08,.24,'Graphite')
        panel('Niche warm strip',2.56,y,5.225,.90,.018,.018,'Amber')
    # Layered angular framing, outside the retained rectangular clearance.
    pts=[(1.39,.08),(1.69,.40),(1.69,2.26),(2.12,2.72),(2.12,3.22)]
    for (x,y),(u,v) in zip(pts,pts[1:]):
        beam('Entry faceted armor',(side*x,y,5.21),(side*u,v,5.21),.085,'Ivory')
    for y in [.80,1.95]:
        panel('Entry vertical practical',1.52,y,5.24,.035,.43,.015,'Amber')
    for y in [.16,.24,.32]:
        panel('Entry plinth vent',2.56,y,5.245,.68,.025,.008,'Gasket')
box('Entry overhead fascia',(0,2.91,5.1),(2.68,.78,.3),'Graphite')
box('Entry header inset',(0,2.91,5.238),(2.3,.42,.018),'Metal')
box('Entry header practical',(0,2.56,5.24),(1.8,.035,.018),'Amber')
for obj in set(collection.objects)-existing:
    uv=obj.data.uv_layers.new(name='Surface metres')
    obj.data.update()
    for poly in obj.data.polygons:
        normal=obj.matrix_world.to_3x3()@poly.normal
        axis=max(range(3),key=lambda i:abs(normal[i]))
        pair=[i for i in range(3) if i!=axis]
        for li in poly.loop_indices:
            p=obj.matrix_world@obj.data.vertices[obj.data.loops[li].vertex_index].co
            uv.data[li].uv=(p[pair[0]],p[pair[1]])
footer=base[base.index('# Editable source'):base.index('bpy.ops.wm.save_as_mainfile')]
exec(compile(footer,__file__,'exec'))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/bridge/bridge-interior-v3.blend'))
print('V3 exported: two empty recessed niches, existing 2.68m doorway clearance preserved.')
