"""Add a lit port-side display beside the preserved entrance shelves."""
import bpy
import bmesh
import math
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/bridge-ceiling-study'
assert Path(bpy.data.filepath).name == 'bridge-ceiling-finished.blend'
scene = bpy.context.scene
originals = {o.name: tuple(v for row in o.matrix_world for v in row) for o in scene.objects}
col = bpy.data.collections.new('PORT CORNER / Expedition display')
scene.collection.children.link(col)
dark = bpy.data.materials['CEILING FINISH / Satin charcoal titanium']
edge = bpy.data.materials['CEILING FINISH / Brushed edge alloy']
gold = bpy.data.materials['SHELVES / Medal satin brass']
warm = bpy.data.materials['CEILING POLISH / Warm encased diffuser']
cyan = bpy.data.materials['CEILING POLISH / Small cyan status guide']
seal = bpy.data.materials['CEILING POLISH / Matte recessed gasket']

def mesh(name, bm, mat):
    data = bpy.data.meshes.new(name); bm.to_mesh(data); bm.free()
    o = bpy.data.objects.new('PORT CORNER / '+name, data); col.objects.link(o)
    data.materials.append(mat)
    return o

def box(name, pos, size, mat, bevel=.012):
    bm=bmesh.new(); bmesh.ops.create_cube(bm,size=1)
    for v in bm.verts:
        for i in range(3): v.co[i]*=size[i]
    o=mesh(name,bm,mat);o.location=pos
    if bevel:
        m=o.modifiers.new('Soft machined edge','BEVEL');m.width=bevel;m.segments=3
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def text(name, body, pos, size, mat):
    data=bpy.data.curves.new(name,'FONT');data.body=body;data.size=size;data.extrude=.0003
    o=bpy.data.objects.new('PORT CORNER / '+name,data);col.objects.link(o)
    o.location=pos;o.rotation_euler=(math.pi/2,0,0);data.materials.append(mat)
    # Text local +Y points upward; front normal points into the room (+Y).
    o.rotation_euler=(math.pi/2,0,math.pi)
    return o

box('Recessed display back',(-4.12,-1.755,1.94),(1.10,.07,1.50),seal)
for x in (-4.69,-3.55):
    box('Display side cheek',(x,-1.59,1.94),(.055,.38,1.56),dark)
for z in (1.16,1.91,2.72):
    box('Floating shelf',(-4.12,-1.56,z),(1.18,.45,.055),dark)
    box('Shelf metal lip',(-4.12,-1.326,z),(1.13,.018,.022),edge,.005)
    if z>1.2:
        box('Recessed warm diffuser',(-4.12,-1.48,z-.035),(.85,.055,.012),warm,.004)
        d=bpy.data.lights.new('PORT CORNER / Shelf practical','AREA');d.energy=7
        d.color=(1,.72,.45);d.shape='RECTANGLE';d.size=.75;d.size_y=.12
        o=bpy.data.objects.new(d.name,d);col.objects.link(o);o.location=(-4.12,-1.42,z-.06)
        o['exclude_runtime_export']=True
box('Expedition plaque',(-4.36,-1.699,2.31),(.53,.022,.46),edge)
# Font is viewed from +Y: horizontal local X must point left in world X.
text('Vessel inscription','CRUZ DEL SUR',(-4.12,-1.68,2.44),.044,gold)
text('Mission inscription','EXPLORATION VESSEL\n\nFIRST LIGHT EXPEDITION\nSECTOR 7-A',(-4.12,-1.68,2.35),.022,edge)

# Armillary model with slender continuous rings and a solid pedestal.
center=Vector((-3.82,-1.49,2.20))
box('Armillary plinth',(-3.82,-1.49,1.96),(.28,.25,.055),edge)
box('Armillary stem',(-3.82,-1.49,2.05),(.022,.022,.18),gold,.004)
bm=bmesh.new();bmesh.ops.create_uvsphere(bm,u_segments=24,v_segments=12,radius=.082)
o=mesh('Armillary core',bm,gold);o.location=center
for p in o.data.polygons: p.use_smooth=True
for axis in range(3):
    data=bpy.data.curves.new('Orbital ring','CURVE');data.dimensions='3D';data.bevel_depth=.004;data.bevel_resolution=2
    s=data.splines.new('POLY');s.points.add(63)
    for i,p in enumerate(s.points):
        a=2*math.pi*i/64;v=[0.,0.,0.];v[(axis+1)%3]=math.cos(a)*.19;v[(axis+2)%3]=math.sin(a)*.19
        p.co=(*v,1)
    s.use_cyclic_u=True;o=bpy.data.objects.new('PORT CORNER / Orbital ring',data);col.objects.link(o);o.location=center;data.materials.append(gold)

box('Sample base',(-3.83,-1.48,1.22),(.26,.25,.055),edge)
for z in (1.26,1.55): box('Sample cap',(-3.83,-1.48,z),(.19,.19,.04),dark)
box('Sample reactor',(-3.83,-1.48,1.4),(.11,.11,.25),cyan,.025)
for x in (-3.92,-3.74): box('Sample cage',(x,-1.38,1.4),(.018,.018,.27),gold,.004)
box('Logbook cover',(-4.35,-1.48,1.23),(.42,.27,.055),dark)
box('Personal photograph frame',(-4.35,-1.55,1.50),(.43,.035,.37),gold,.008)
data=bpy.data.meshes.new('Corner photograph')
data.from_pydata([(-4.15,-1.525,1.34),(-4.55,-1.525,1.34),(-4.55,-1.525,1.66),(-4.15,-1.525,1.66)],[],[(0,1,2,3)])
uv=data.uv_layers.new(name='UVMap')
for i,v in enumerate(((0,0),(1,0),(1,1),(0,1))):uv.data[i].uv=v
o=bpy.data.objects.new('PORT CORNER / Personal photograph',data);col.objects.link(o)
data.materials.append(bpy.data.materials['SHELVES / Personal photograph 1'])
text('Sample legend','PAMPA / FIELD SAMPLE',(-4.12,-1.325,1.15),.021,gold)

# Tone down the existing service panels without changing their geometry.
for o in scene.objects:
    if o.name.startswith('BRIDGE SURFACES / Opaque cheek satin panel'):
        pts=[o.matrix_world@Vector(c) for c in o.bound_box]
        if sum(p.x for p in pts)/8 < 0:
            o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(dark)
assert all(tuple(v for row in scene.objects[n].matrix_world for v in row)==v for n,v in originals.items())
scene.camera=bpy.data.objects['CORNER REVIEW']
scene.name='CRUZ DEL SUR / Port corner review'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bridge-port-corner.blend'))
(OUT/'port-corner-validation.json').write_text(json.dumps({'originalTransformsPreserved':len(originals),'newObjects':len(col.objects),'runtimeExported':False},indent=2))
print('PORT_CORNER_READY',len(col.objects))
