"""Solid entry transition after glazing; darker deck, unchanged bridge anchors."""
from pathlib import Path
from math import sin, cos
import bpy, bmesh
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
NAME='Bridge - Solid Transition V5'
assert NAME not in bpy.data.scenes
source=bpy.data.scenes['Bridge - Industrial Deck V4']
scene=bpy.data.scenes.new(NAME);scene.world=source.world;bpy.context.window.scene=scene
collection=bpy.data.collections.new('BRIDGE V5 / Architecture');scene.collection.children.link(collection)
materials={}
for old in source.objects:
    if old.type!='MESH':continue
    obj=old.copy();obj.data=old.data.copy();collection.objects.link(obj)
    for slot in obj.material_slots:materials[slot.material.name.removeprefix('BRIDGE V2 ')]=slot.material
for obj in collection.objects:
    if obj.name.startswith(('Removable deck panel','Recessed grille slat','Grille longitudinal rail')):
        obj.data.materials.clear();obj.data.materials.append(materials['Graphite'])
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))
existing=set(collection.objects)
# X 1.50..1.90, Z 3.45..4.95, Y 0..3.30; mirrored side wall.
for side in [-1,1]:
    def wall(name,x,y,z,w,h,d,mat='Metal'):
        return box(name,(side*x,y,z),(w,h,d),mat)
    wall('Transition outer backing',1.87,1.65,4.20,.06,3.3,1.5,'Graphite')
    for z in [3.56,4.84]:wall('Transition end pier',1.7,1.65,z,.4,3.3,.22,'Ivory')
    wall('Transition plinth',1.7,.35,4.2,.4,.7,1.06,'Graphite')
    wall('Transition upper panel',1.7,2.825,4.2,.4,.95,1.06,'Graphite')
    for y in [.74,2.31]:
        wall('Transition niche ledge',1.7,y,4.2,.4,.08,1.06,'Metal')
        wall('Transition niche light',1.515,y,4.2,.018,.025,.88,'Amber')
    for z in [3.69,4.71]:wall('Transition niche lining',1.7,1.525,z,.4,1.49,.04,'Gasket')
    # Shoulder pieces frame the reveal, without entering the walking clearance.
    beam('Transition shoulder',(side*1.56,2.35,3.49),(side*1.98,3.15,3.49),.08,'Ivory')
box('Transition ceiling',(0,3.115,4.2),(3,.15,1.5),'Graphite')
for x in [-1.1,1.1]:box('Transition ceiling light',(x,3.035,4.2),(.22,.012,1.12),'Amber')
for obj in set(collection.objects)-existing:
    uv=obj.data.uv_layers.new(name='Surface metres');obj.data.update()
    for poly in obj.data.polygons:
        n=obj.matrix_world.to_3x3()@poly.normal
        axis=max(range(3),key=lambda i:abs(n[i]));pair=[i for i in range(3) if i!=axis]
        for li in poly.loop_indices:
            p=obj.matrix_world@obj.data.vertices[obj.data.loops[li].vertex_index].co
            uv.data[li].uv=(p[pair[0]],p[pair[1]])
footer=base[base.index('# Editable source'):base.index('bpy.ops.wm.save_as_mainfile')]
exec(compile(footer,__file__,'exec'))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/bridge/bridge-interior-v5.blend'))
print('V5: 1.5m solid transition, 3m clear width, inward-facing empty niches, graphite deck.')
