"""Flush deck panels and recessed grilles, preserving the continuous collider."""
from pathlib import Path
from math import sin, cos
import json, bpy, bmesh
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
NAME='Bridge - Industrial Deck V4'
assert NAME not in bpy.data.scenes
source=bpy.data.scenes['Bridge - Recessed Entry V3']
scene=bpy.data.scenes.new(NAME);scene.world=source.world;bpy.context.window.scene=scene
collection=bpy.data.collections.new('BRIDGE V4 / Architecture');scene.collection.children.link(collection)
materials={}
for old in source.objects:
    if old.type!='MESH':continue
    obj=old.copy();obj.data=old.data.copy();collection.objects.link(obj)
    for slot in obj.material_slots:materials[slot.material.name.removeprefix('BRIDGE V2 ')]=slot.material
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))
existing=set(collection.objects)
outline=json.loads((ROOT/'docs/assets/bridge/layout.json').read_text())['outline']
area=sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(outline,outline[1:]+outline[:1]))
sign=1 if area>0 else -1
def clipped(poly):
    for a,b in zip(outline,outline[1:]+outline[:1]):
        def distance(p):return sign*((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))
        result=[]
        for p,q in zip(poly,poly[1:]+poly[:1]):
            dp,dq=distance(p),distance(q)
            if dp>=0:result.append(p)
            if (dp>=0)!=(dq>=0):
                t=dp/(dp-dq);result.append([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])])
        poly=result
        if not poly:break
    return poly
def tile(name,x0,x1,z0,z1,mat,top=0):
    poly=clipped([[x0,z0],[x1,z0],[x1,z1],[x0,z1]])
    if len(poly)>=3:
        obj=prism(name,poly,-.045,top,mat)
        for mod in obj.modifiers:mod.width=.003;mod.segments=1
prism('Deck recessed backing',outline,-.2,-.065,'Graphite')
bands=[-4.8,-3.4,-2.08,-2.02,-1.96,-1.56,0,1.56,1.96,2.02,2.08,3.4,4.8]
for x0,x1 in zip(bands,bands[1:]):
    middle=abs((x0+x1)/2)
    if 1.56<middle<1.96:
        for edge in [x0+.014,x1-.014]:tile('Grille longitudinal rail',edge-.012,edge+.012,-5.4,5.1,'Metal')
        for i in range(105):
            z=-5.38+i*.1
            tile('Recessed grille slat',x0+.03,x1-.03,z,z+.035,'Metal',-.006)
    elif 2.02<middle<2.08:
        for i in range(10):
            z=-5.38+i*1.05
            tile('Inset amber deck guide',x0+.012,x1-.012,z+.10,z+.80,'Amber',-.008)
    else:
        for i in range(10):
            z=-5.4+i*1.05
            tile('Removable deck panel',x0+.008,x1-.008,z+.008,z+1.042,'Metal')
for obj in set(collection.objects)-existing:
    uv=obj.data.uv_layers.new(name='Surface metres');obj.data.update()
    for poly in obj.data.polygons:
        normal=obj.matrix_world.to_3x3()@poly.normal
        axis=max(range(3),key=lambda i:abs(normal[i]));pair=[i for i in range(3) if i!=axis]
        for li in poly.loop_indices:
            p=obj.matrix_world@obj.data.vertices[obj.data.loops[li].vertex_index].co
            uv.data[li].uv=(p[pair[0]],p[pair[1]])
footer=base[base.index('# Editable source'):base.index('bpy.ops.wm.save_as_mainfile')]
exec(compile(footer,__file__,'exec'))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/bridge/bridge-interior-v4.blend'))
print('V4 exported: panels at Y=0, recessed grilles and guides, backing at -0.065m.')
