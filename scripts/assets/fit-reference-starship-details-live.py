"""Correct surface fits exposed by close-up review, without changing the approved profile."""
import bpy
import math
from mathutils import Vector

root=bpy.data.collections['CRUZ DEL SUR / REFERENCE EXTERIOR']
if root.get('precision_surface_fit'):
    raise RuntimeError('Surface fitting already applied')

# The opaque glazing backing was poking through the angled exterior panes.
core=bpy.data.objects['CDS | Exterior bridge glazing']
for v in core.data.vertices:v.co.x*=.94

def roof(y):
    if y<=2.8:return 4.15
    if y<=6.3:return 4.15+(y-2.8)*(-.3/3.5)
    return 3.85+(y-6.3)*(-.4/2.85)

for o in bpy.data.collections['CDS 04 / Exterior bridge shell'].objects:
    if 'Forward bridge roof segment' in o.name:
        for i,v in enumerate(o.data.vertices):v.co.z=roof(v.co.y)+(.08 if i%2 else .035)
for o in bpy.data.collections['CDS 06 / Service details'].objects:
    if 'Roof forward seam' in o.name:
        for i,v in enumerate(o.data.vertices):v.co.z=roof(v.co.y)+(.095 if i%2 else .083)

# Follow the same roof pitch with the newly batched fasteners.
col=bpy.data.collections['CDS 08 / Precision fittings']
for name in ['CDS | Precision pass / panel counterbores','CDS | Precision pass / flush hex fasteners']:
    ob=bpy.data.objects[name]
    for v in ob.data.vertices:
        if 3<v.co.y<8 and 3.3<v.co.z<4.2:
            yc,oldtop=min([(4,4.0425),(5.55,3.9325),(7,3.7225)],key=lambda p:abs(p[0]-v.co.y))
            v.co.z+=roof(v.co.y)+.08-oldtop

# Keep the original tiny fasteners attached to the bow's upswept lower skin.
ob=bpy.data.objects['CDS | Captive titanium fasteners']
for start in range(0,len(ob.data.vertices),12):
    group=list(ob.data.vertices)[start:start+12]
    y=sum(v.co.y for v in group)/len(group)
    if y<=23:continue
    low=-3.05+(y-22)*(.9/5.5) if y<27.5 else -2.15+(y-27.5)*(.9/2.5)
    dz=max(0,low+.26-min(v.co.z for v in group))
    for v in group:v.co.z+=dz

for ob in col.objects:
    if ob.type=='FONT' and ob.data.body.startswith('PROPULSION'):
        ob.location.z=1.15+(ob.location.y+18)*(.8/3)+.012
        ob.rotation_euler.x=math.atan(.8/3)
    if ob.type=='MESH' and 'Propulsion warning stripe' in ob.name:
        for i,v in enumerate(ob.data.vertices):
            v.co.z=1.15+(v.co.y+18)*(.8/3)+(.022 if i%2 else .008)

# Slightly deeper smoked glass keeps the bright fixtures from reading as solid brown panels.
mat=bpy.data.materials['CDS / Warm smoked observation glass']
p=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs['Emission Strength'].default_value=.09
p.inputs['Roughness'].default_value=.18

# Recalculate normals after fitting the sloped roof pieces.
import bmesh
for c in [bpy.data.collections['CDS 04 / Exterior bridge shell'],bpy.data.collections['CDS 06 / Service details'],col]:
    for o in c.objects:
        if o.type!='MESH':continue
        bm=bmesh.new()
        bm.from_mesh(o.data)
        bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
        bm.to_mesh(o.data)
        bm.free()
root['precision_surface_fit']=True
bpy.ops.wm.save_as_mainfile(filepath=r'C:\Users\joaqu\Desktop\Space-Portfolio\docs\assets\cruz-del-sur-exterior\cruz-del-sur-exterior.blend')
print('SURFACE FIT CORRECTIONS SAVED')
