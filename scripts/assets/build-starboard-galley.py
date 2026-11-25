"""Compact galley and local warm-light revision, preserving the source blend."""
import bpy
import bmesh
import math
import json
import hashlib
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/assets/bridge-ceiling-study'
source=Path(bpy.data.filepath)
assert source.name=='bridge-port-corner-review.blend'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
scene=bpy.context.scene
originals={o.name:tuple(v for row in o.matrix_world for v in row) for o in scene.objects}
col=bpy.data.collections.new('GALLEY / Starboard kitchenette');scene.collection.children.link(col)
dark=bpy.data.materials['CEILING FINISH / Satin charcoal titanium']
metal=bpy.data.materials['CEILING FINISH / Brushed edge alloy']
gold=bpy.data.materials['SHELVES / Medal satin brass']
black=bpy.data.materials['CEILING POLISH / Matte recessed gasket']
cyan=bpy.data.materials['CEILING POLISH / Small cyan status guide']
warm=bpy.data.materials['CEILING POLISH / Warm encased diffuser'].copy()
warm.name='GALLEY / Honey diffuser'
p=next(n for n in warm.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs['Emission Color'].default_value=(1,.48,.12,1);p.inputs['Emission Strength'].default_value=1.6

def mesh(name,bm,mat,pos):
    d=bpy.data.meshes.new(name);bm.to_mesh(d);bm.free()
    o=bpy.data.objects.new('GALLEY / '+name,d);col.objects.link(o);o.location=pos;d.materials.append(mat)
    return o

def box(name,pos,size,mat,bevel=.008):
    bm=bmesh.new();bmesh.ops.create_cube(bm,size=1)
    for v in bm.verts:
        for i in range(3):v.co[i]*=size[i]
    o=mesh(name,bm,mat,pos)
    if bevel:
        m=o.modifiers.new('Machined radius','BEVEL');m.width=bevel;m.segments=3
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def cylinder(name,pos,radius,depth,mat,front=False):
    bm=bmesh.new();bmesh.ops.create_cone(bm,cap_ends=True,cap_tris=False,segments=32,radius1=radius,radius2=radius,depth=depth)
    o=mesh(name,bm,mat,pos)
    if front:o.rotation_euler.x=math.pi/2
    m=o.modifiers.new('Rounded rim','BEVEL');m.width=.003;m.segments=2
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def tube(name,points,radius,mat):
    d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=radius;d.bevel_resolution=3
    s=d.splines.new('POLY');s.points.add(len(points)-1)
    for p,co in zip(s.points,points):p.co=(*co,1)
    o=bpy.data.objects.new('GALLEY / '+name,d);col.objects.link(o);d.materials.append(mat)

# Rear wall at Y=-1.80; galley stays outside the entrance and personal shelves.
box('Cabinet carcass',(4.12,-1.48,.56),(1.12,.59,.91),dark,.025)
box('Recessed plinth',(4.12,-1.52,.13),(1.03,.47,.13),black)
box('Stone metal countertop',(4.12,-1.45,1.04),(1.18,.66,.065),metal,.018)
for x in (3.84,4.40):
    box('Storage door',(x,-1.169,.59),(.535,.032,.77),dark,.012)
    box('Recessed handle',(x,-1.145,.87),(.24,.015,.043),black)
    box('Handle lip',(x,-1.125,.885),(.22,.025,.014),metal,.004)
    for z in (.24,.27,.30):box('Door ventilation',(x,-1.147,z),(.20,.006,.009),black,.002)
box('Toe light',(4.12,-1.265,.17),(.97,.016,.024),warm,.004)
box('Back splash',(4.12,-1.755,1.60),(1.14,.035,1.08),dark,.012)
box('Upper shelf',(4.12,-1.57,2.12),(1.16,.40,.055),dark,.014)
box('Under shelf diffuser',(4.12,-1.46,2.082),(.94,.07,.014),warm,.004)

# Coffee machine: open cup bay, separate brew head, drip grid, cup and handle.
x=3.85
box('Espresso base',(x,-1.43,1.11),(.32,.34,.065),black)
box('Espresso spine',(x,-1.57,1.32),(.30,.065,.41),dark,.018)
for dx in (-.137,.137):box('Espresso upright',(x+dx,-1.43,1.30),(.028,.25,.36),metal,.006)
box('Espresso head',(x,-1.43,1.52),(.32,.31,.13),dark,.018)
box('Espresso fascia',(x,-1.265,1.52),(.28,.018,.09),metal,.006)
box('Machine display',(x+.045,-1.252,1.53),(.11,.008,.034),black,.003)
for i in range(3):box('Coffee display bar',(x+.07-i*.026,-1.246,1.53),(.016,.004,.004),cyan,.001)
cylinder('Power button',(x-.095,-1.25,1.52),.015,.012,gold,True)
cylinder('Brew group',(x,-1.39,1.43),.037,.055,metal)
cylinder('Spout',(x,-1.38,1.395),.008,.035,metal)
for i in range(9):box('Drip tray slat',(x-.11+i*.027,-1.405,1.148),(.009,.22,.008),metal,.002)
cylinder('Cup',(x,-1.36,1.205),.042,.105,metal)
cylinder('Coffee surface',(x,-1.36,1.259),.035,.002,black)
pts=[(x+.042+.032*math.sin(t),-1.36,1.207+.036*math.cos(t)) for t in [i*math.pi/20 for i in range(21)]]
tube('Cup handle',pts,.007,metal)

# Compact receiver on the other half of the worktop.
x=4.40
box('Radio shell',(x,-1.47,1.23),(.39,.20,.28),dark,.025)
box('Radio face',(x,-1.36,1.23),(.355,.018,.235),black,.009)
for i in range(12):box('Speaker grille',(x+.095,-1.347,1.14+i*.014),(.12,.008,.006),metal,.001)
box('Tuner glass',(x-.07,-1.346,1.285),(.15,.007,.062),cyan,.005)
cylinder('Tuning dial',(x-.09,-1.33,1.19),.035,.026,gold,True)
for dx in (-.025,.025):cylinder('Radio control',(x+dx,-1.335,1.17),.012,.02,metal,True)
tube('Radio carry handle',[(x-.13,-1.46,1.37),(x-.13,-1.46,1.43),(x+.13,-1.46,1.43),(x+.13,-1.46,1.37)],.008,metal)
tube('Antenna',[(x+.14,-1.53,1.37),(x+.22,-1.53,1.67)],.003,metal)
for x in (3.75,3.91,4.07):
    cylinder('Provision tin',(x,-1.56,2.23),.055,.16,dark)
    cylinder('Tin lid',(x,-1.56,2.315),.057,.012,gold)

# Copy emissive materials only onto main-room mesh slots. Screens stay cyan.
warm_names=('Warm white strip','Warm interior light','Soft warm ceiling','Warm encased diffuser','Warm practical cores','Warm diffusers','Recessed warm diffuser')
copies={};changed=[]
for o in list(scene.objects):
    if o.type!='MESH' or o.name.startswith(('PORT CORNER /','GALLEY /')):continue
    pts=[o.matrix_world@Vector(c) for c in o.bound_box]
    if min(p.y for p in pts)<-1.85 or max(p.y for p in pts)>9:continue
    slots=[i for i,m in enumerate(o.data.materials) if m and any(k in m.name for k in warm_names)]
    if not slots:continue
    o.data=o.data.copy()
    for i in slots:
        m=o.data.materials[i]
        if m.name not in copies:
            c=m.copy();c.name='GALLEY WARM / '+m.name
            for n in c.node_tree.nodes:
                if n.type=='BSDF_PRINCIPLED':
                    n.inputs['Emission Color'].default_value=(1,.48,.12,1)
                    n.inputs['Base Color'].default_value=(1,.48,.12,1)
                    n.inputs['Emission Strength'].default_value=min(n.inputs['Emission Strength'].default_value,1.8)
            copies[m.name]=c
        o.data.materials[i]=copies[m.name]
    changed.append(o.name)
for o in scene.objects:
    if o.type=='LIGHT' and (o.name.startswith(('Fixture soft downlight','Warm ceiling grazing','CEILING PREVIEW / Warm','CEILING POLISH / Warm')) or o.name in ('UNIFIED / Warm interior fill -4','UNIFIED / Warm interior fill 0')):
        o.data=o.data.copy();o.data.color=(1,.58,.25)
d=bpy.data.lights.new('GALLEY / Counter practical','AREA');d.energy=12;d.color=(1,.58,.25);d.shape='RECTANGLE';d.size=.85;d.size_y=.16
o=bpy.data.objects.new(d.name,d);col.objects.link(o);o.location=(4.12,-1.43,2.04);o['exclude_runtime_export']=True
bpy.context.view_layer.update()
assert all(tuple(v for row in scene.objects[n].matrix_world for v in row)==v for n,v in originals.items())
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
scene.camera=bpy.data.objects['GALLEY REVIEW']
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bridge-galley-warm.blend'))
(OUT/'galley-validation.json').write_text(json.dumps({'sourceSha256':digest,'sourceUnchanged':True,'originalTransformsPreserved':len(originals),'newObjects':len(col.objects),'warmMeshes':len(changed),'runtimeExported':False},indent=2))
print('GALLEY_READY',len(col.objects),'warm meshes',len(changed))
