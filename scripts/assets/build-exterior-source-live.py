"""Source-only bridge/exterior assembly. Never exports to the application."""
from pathlib import Path
import bpy, bmesh, math
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
folder = ROOT / 'docs/assets/bridge'
scene = bpy.context.scene
assert scene.name == 'Bridge - Finished Interior'
assert not bpy.data.collections.get('EXTERIOR / Upper hull')
bpy.data.libraries.write(str(folder/'bridge-interior-backup.blend'), {scene}, fake_user=True, compress=True)
anchors = {o.name:(o.matrix_world.copy(),dict(o.items())) for o in scene.objects if o.get('interaction')}
# The rear recess fronts pointed aft, away from the bridge. Reflect complete
# assemblies about the wall center, including liners, shelves and decorations.
dressing = set(bpy.data.collections['08 Niche dressing'].objects)
changed=[]
for obj in list(scene.objects):
    architectural = obj.name.startswith(('Niche ', 'Outer Niche '))
    if obj.type != 'MESH' or not (architectural or obj in dressing): continue
    assert not obj.get('interaction')
    obj.data = obj.data.copy()
    inv = obj.matrix_world.inverted()
    for v in obj.data.vertices:
        p=obj.matrix_world@v.co
        p.y=-3.9-p.y
        v.co=inv@p
    bm=bmesh.new();bm.from_mesh(obj.data)
    bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
    bm.to_mesh(obj.data);bm.free();obj.data.update()
    changed.append(obj.name)

interior=bpy.data.collections['BRIDGE / EDITABLE']
for name in ('BRIDGE / Central command','BRIDGE / Desk and seating finish'):
    c=bpy.data.collections[name]
    interior.children.link(c);scene.collection.children.unlink(c)
collection=bpy.data.collections.new('EXTERIOR / Upper hull')
scene.collection.children.link(collection)
collection['source_only']=True
materials={m.name.removeprefix('BRIDGE V15 '):m for m in bpy.data.materials if m.name.startswith('BRIDGE V15 ')}
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
from math import sin,cos
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))
# Coordinates match the already shifted bridge: bow glazing at game Z=-8.55.
def height(z): return .8+(z+8.55)*(.25/2.8)
def width(z): return 2.1+(z+8.55)*(1.3/2.8)
def panel(name,outline,offset,thickness,material):
    n=len(outline)
    vertices=[(x,height(z)+offset-depth,z) for depth in (thickness,0) for x,z in outline]
    return mesh(name,vertices,[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],material,.004)
panel('Exterior continuous bow skin',[(-2.1,-8.55),(2.1,-8.55),(.8,-11.35),(-.8,-11.35)],0,.22,'Graphite')
for row in range(5):
    back=-8.61-row*.53;fore=back-.48
    for side in (-1,1):
        points=[(.12,back),(width(back)-.06,back),(width(fore)-.06,fore),(.12,fore)]
        if side<0: points=[(-x,z) for x,z in reversed(points)]
        panel('Exterior armor tile',points,.035,.025,'Metal')
        for z in (back-.06,fore+.06):
            box('Exterior panel fastener',(side*(width(z)-.14),height(z)+.045,z),(.035,.012,.04),'Gasket',.002)
for side in (-1,1):
    for row in range(4):
        back=-8.65-row*.64;fore=back-.58
        points=[(width(back)-.23,back),(width(back)-.035,back),(width(fore)-.035,fore),(width(fore)-.23,fore)]
        if side<0:points=[(-x,z) for x,z in reversed(points)]
        panel('Exterior edge armor',points,.10,.055,'Graphite')
    z=-9.3
    box('Exterior radiator housing',(side*.83,height(z)+.073,z),(.46,.055,.64),'Graphite')
    for i in range(8):
        zz=z+.25-i*.07
        box('Exterior radiator fin',(side*.83,height(zz)+.11,zz),(.36,.035,.023),'Metal',.003)
    z=-10.5
    box('Exterior service hatch',(side*.52,height(z)+.075,z),(.3,.06,.31),'Graphite')
    box('Exterior hatch lid',(side*.52,height(z)+.114,z),(.25,.015,.26),'Metal')
    box('Exterior hatch handle',(side*.52,height(z)+.135,z),(.12,.02,.03),'Gasket')
    z=-8.88
    box('Exterior marker housing',(side*1.62,height(z)+.07,z),(.15,.08,.23),'Graphite')
    box('Exterior amber marker',(side*1.62,height(z)+.116,z),(.075,.012,.13),'Amber',.003)
for i in range(6):
    z=-8.85-i*.38
    box('Exterior segmented spine',(0,height(z)+.08,z),(.19,.08,.3),'Graphite')
panel('Exterior low sensor pod',[(-.19,-10.32),(.19,-10.32),(.24,-10.43),(.15,-10.85),(-.15,-10.85),(-.24,-10.43)],.17,.12,'Metal')
# Original windows, monitors and their interaction metadata remain anchored.
bpy.context.view_layer.update()
for name,(matrix,meta) in anchors.items():
    assert bpy.data.objects[name].matrix_world==matrix and dict(bpy.data.objects[name].items())==meta
for obj in dressing:
    assert all(-2.04 < (obj.matrix_world@v.co).y < -1.81 for v in obj.data.vertices),obj.name
assert sum(o.type=='LIGHT' for o in scene.objects)==4
old=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/'bridge-interior-final.blend'),compress=True)
finally:bpy.context.preferences.filepaths.save_version=old
print('Reoriented recess pieces:',len(changed),'Exterior pieces:',len(collection.objects),'Protected interaction parts:',len(anchors))
