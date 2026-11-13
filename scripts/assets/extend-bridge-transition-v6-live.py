"""Move the whole bridge out of the entry transition; retain native furniture scale."""
from pathlib import Path
from math import sin, cos
import bpy, bmesh
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[2]
NAME='Bridge - Clear Three Metre Entry V6'
assert NAME not in bpy.data.scenes
source=bpy.data.scenes['Bridge - Solid Transition V5']
scene=bpy.data.scenes.new(NAME);scene.world=source.world;bpy.context.window.scene=scene
collection=bpy.data.collections.new('BRIDGE V6 / Architecture');scene.collection.children.link(collection)
materials={}
for old in source.objects:
    if old.type!='MESH':continue
    obj=old.copy();obj.data=old.data.copy();collection.objects.link(obj)
    # Bake world coordinates before either moving the bridge or extending the transition.
    obj.data.transform(old.matrix_world);obj.matrix_world=Matrix.Identity(4)
    for v in obj.data.vertices:
        if old.name.startswith('Transition'):
            v.co.y=2*v.co.y+4.8 # game Z 3.45..4.95 -> 2.10..5.10
        else:v.co.y+=3.15 # game -Z is forward
    for slot in obj.material_slots:materials[slot.material.name.removeprefix('BRIDGE V2 ')]=slot.material
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))
# Dedicated continuous threshold deck; no overlap with the moved bridge floor.
deck=box('Solid transition deck',(0,-.1,3.525),(3,.2,3.15),'Graphite',0)
uv=deck.data.uv_layers.new(name='Surface metres')
for poly in deck.data.polygons:
    for li in poly.loop_indices:
        p=deck.data.vertices[deck.data.loops[li].vertex_index].co
        uv.data[li].uv=(p.x,p.y)
footer=base[base.index('# Editable source'):base.index('bpy.ops.wm.save_as_mainfile')]
exec(compile(footer,__file__,'exec'))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/bridge/bridge-interior-v6.blend'))
print('Bridge shifted -3.15m; solid transition Z2.1..5.1, floor joins bridge at Z1.95.')
