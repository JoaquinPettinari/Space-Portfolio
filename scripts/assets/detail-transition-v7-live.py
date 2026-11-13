"""Industrial finishes for the clear entry only; preserve V6 and all anchors."""
from pathlib import Path
from math import sin, cos
import bpy, bmesh
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
NAME='Bridge - Finished Entry V7'
assert NAME not in bpy.data.scenes
source=bpy.data.scenes['Bridge - Clear Three Metre Entry V6']
scene=bpy.data.scenes.new(NAME);scene.world=source.world;bpy.context.window.scene=scene
collection=bpy.data.collections.new('BRIDGE V7 / Architecture');scene.collection.children.link(collection)
materials={}
for old in source.objects:
    if old.type!='MESH':continue
    for slot in old.material_slots:materials[slot.material.name.removeprefix('BRIDGE V2 ')]=slot.material
    if old.name.startswith(('Solid transition deck','Transition ceiling')):continue
    obj=old.copy();obj.data=old.data.copy();collection.objects.link(obj)
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))
existing=set(collection.objects)
# Recessed backing, flush panels and dedicated guide channels prevent coplanar overlays.
box('Entry deck backing',(0,-.13,3.525),(3,.14,3.15),'Graphite',0)
bands=[(-1.5,-1.28),(-1.16,0),(0,1.16),(1.28,1.5)]
for i in range(5):
    z=1.95+i*.63
    for a,b in bands:
        obj=box('Entry removable deck plate',((a+b)/2,-.02,z+.315),(b-a-.014,.04,.614),'Graphite',.003)
    for side in [-1,1]:
        box('Entry guide housing',(side*1.22,-.025,z+.315),(.10,.04,.614),'Gasket',.002)
        # Light sits above its housing, still below Y=0; no duplicate top face.
        box('Entry amber floor guide',(side*1.22,-.006,z+.315),(.035,.008,.43),'Amber',.002)
# Ceiling backing and beams stay within the existing 3.04m collider underside.
box('Entry roof backing',(0,3.18,3.6),(3,.02,3),'Graphite',0)
for z in [2.16,3.12,4.08,5.04]:
    box('Entry transverse beam',(0,3.09,z),(3,.10,.12),'Metal',.012)
for z in [2.64,3.60,4.56]:
    box('Entry ceiling cassette',(0,3.145,z),(1.64,.05,.76),'Graphite',.008)
    for side in [-1,1]:
        box('Entry ceiling lamp bezel',(side*1.10,3.085,z),(.42,.09,.68),'Gasket',.008)
        box('Entry ceiling diffuser',(side*1.10,3.046,z),(.30,.012,.53),'Amber',.003)
        for j in range(5):
            box('Entry roof ventilation',(side*.68,3.115,z-.24+j*.12),(.16,.012,.035),'Metal',.002)
# Inward-facing trim and inset fasteners. Nothing enters the clear X ±1.5 route.
for side in [-1,1]:
    for z in [2.60,4.60]:
        box('Entry niche vertical trim',(side*1.53,1.525,z),(.05,1.49,.055),'Metal',.004)
        for y in [.87,2.18]:
            box('Entry niche fixing',(side*1.502,y,z),(.004,.026,.026),'Gasket',.001)
    for y in [.80,2.25]:
        box('Entry niche horizontal trim',(side*1.53,y,3.6),(.05,.045,1.94),'Metal',.003)
    for z in [2.8,3.6,4.4]:
        for y in [.20,.27,.34]:
            box('Entry plinth ventilation',(side*1.503,y,z),(.004,.024,.40),'Gasket',.001)
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
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/bridge/bridge-interior-v7.blend'))
print('V7 exported: dark segmented entry floor, amber guides, layered roof and empty framed niches.')
