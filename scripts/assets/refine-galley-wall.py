"""Reproportion only the galley and integrate its wall, shelves and lighting."""
import bpy
import bmesh
import math
import json
import hashlib
from pathlib import Path
from mathutils import Vector, Matrix

OUT=Path(__file__).resolve().parents[2]/'docs/assets/bridge-ceiling-study'
source=Path(bpy.data.filepath)
assert source.name=='bridge-galley-l-review.blend'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
scene=bpy.context.scene
protected={o.name:tuple(v for row in o.matrix_world for v in row) for o in scene.objects if not o.name.startswith(('GALLEY','PORT CORNER'))}
col=bpy.data.collections.new('GALLEY WALL / Integrated support station');scene.collection.children.link(col)
dark=bpy.data.materials['CEILING FINISH / Satin charcoal titanium']
metal=bpy.data.materials['CEILING FINISH / Brushed edge alloy']
black=bpy.data.materials['CEILING POLISH / Matte recessed gasket']
gold=bpy.data.materials['SHELVES / Medal satin brass']
warm=bpy.data.materials['GALLEY / Honey diffuser']
cyan=bpy.data.materials['CEILING POLISH / Small cyan status guide']
counter=metal.copy();counter.name='GALLEY WALL / Pale brushed composite'
p=next(n for n in counter.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs['Base Color'].default_value=(.29,.29,.265,1);p.inputs['Metallic'].default_value=.3

def box(name,pos,size,mat,bevel=.008):
    bm=bmesh.new();bmesh.ops.create_cube(bm,size=1)
    for v in bm.verts:
        for i in range(3):v.co[i]*=size[i]
    d=bpy.data.meshes.new(name);bm.to_mesh(d);bm.free()
    o=bpy.data.objects.new('GALLEY WALL / '+name,d);col.objects.link(o);o.location=pos;d.materials.append(mat)
    if bevel:
        mod=o.modifiers.new('Machined edge','BEVEL');mod.width=bevel;mod.segments=3
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def rail(name,a,b,width,depth,mat):
    a,b=Vector(a),Vector(b);o=box(name,(a+b)/2,(width,depth,(b-a).length),mat,.004)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o

# Lengths: 1.36m along the rear wall, 0.70m exposed side return.
for name in ('Cabinet carcass','Stone metal countertop','Recessed plinth','Back splash','Toe light'):
    o=bpy.data.objects['GALLEY / '+name];o.location.x=4.10;o.scale.x*=1.36/1.18
o=bpy.data.objects['GALLEY / Stone metal countertop'];o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(counter)
for o in list(scene.objects):
    if o.name.startswith('GALLEY L / ') and any(k in o.name for k in ('Side return','Side worktop','Return plinth','Return door','Return handle','Return warm','Return under','Side backsplash','Side countertop')):
        o.location.y=-1.15+(o.location.y+1.15)*.58;o.scale.y*=.58
        if 'worktop' in o.name:o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(counter)
# Remove old upper furniture from rendering, retaining it as archived objects.
archive=bpy.data.collections.new('GALLEY WALL / Previous shelves - hidden');scene.collection.children.link(archive);archive.hide_render=True;archive.hide_viewport=True
for o in list(scene.objects):
    if o.name.startswith('GALLEY / ') and any(k in o.name for k in ('Upper shelf','Under shelf diffuser','Provision tin','Tin lid')) or o.name.startswith('GALLEY L / Upper wall cassette'):
        for c in list(o.users_collection):c.objects.unlink(o)
        archive.objects.link(o)
for o in list(scene.objects):
    if o.name.startswith('GALLEY L / ') and any(k in o.name for k in ('Serving tray','Tray raised','Tea canister','Canister lid','Canister label')):
        for c in list(o.users_collection):c.objects.unlink(o)
        archive.objects.link(o)
# Receiver back on the rear counter, facing into the room, away from the plant.
names=('Radio','Speaker grille','Tuner glass','Tuning dial','Antenna')
t=Matrix.Translation(Vector((4.30,-1.43,1.23)))@Matrix.Rotation(-math.pi/2,4,'Z')@Matrix.Translation(Vector((-4.39,.37,-1.23)))
for o in scene.objects:
    if o.name.startswith('GALLEY / ') and any(o.name[9:].startswith(n) for n in names):o.matrix_world=t@o.matrix_world

# Layered architectural face, bridging the counter and the ceiling.
box('Continuous rear gasket',(4.10,-1.70,2.00),(1.38,.035,1.88),black)
for x,w in ((3.72,.55),(4.39,.73)):
    box('Graphite wall panel',(x,-1.675,2.00),(w,.028,1.82),dark,.013)
for x in (3.40,4.80):
    box('Vertical wall frame',(x,-1.61,1.99),(.055,.14,1.94),dark,.012)
    box('Inset warm vertical lens',(x,-1.532,2.15),(.012,.012,.62),warm,.003)
rail('Angled upper profile',(3.42,-1.59,2.76),(3.66,-1.59,2.96),.055,.07,metal)
rail('Header profile',(3.66,-1.59,2.96),(4.78,-1.59,2.96),.055,.07,metal)
rail('Diagonal technical rib',(4.00,-1.59,1.80),(4.40,-1.59,2.55),.07,.07,dark)
rail('Thin cyan seam',(4.03,-1.545,1.84),(4.18,-1.545,2.12),.008,.008,cyan)
for name,x,z,w in [('Upper',4.12,2.58,1.27),('Lower',4.40,2.02,.65)]:
    box(name+' integrated shelf',(x,-1.51,z),(w,.34,.045),dark,.012)
    box(name+' metallic shelf lip',(x,-1.335,z),(w-.025,.015,.015),metal,.004)
    box(name+' warm underside',(x,-1.47,z-.028),(w-.12,.06,.012),warm,.003)
    for dx in (-w*.35,w*.35):box(name+' shelf bracket',(x+dx,-1.64,z-.055),(.025,.11,.10),dark)
box('Closed utility case',(3.80,-1.51,2.68),(.28,.22,.15),dark,.018)
for x in (3.71,3.89):box('Case latch',(x,-1.39,2.68),(.018,.018,.045),gold,.003)
box('Small sample pedestal',(4.42,-1.50,2.63),(.20,.18,.045),metal)
bm=bmesh.new();bmesh.ops.create_icosphere(bm,subdivisions=2,radius=.075)
for v in bm.verts:v.co.z*=1.4
d=bpy.data.meshes.new('Mineral');bm.to_mesh(d);bm.free();o=bpy.data.objects.new('GALLEY WALL / Mineral specimen',d);col.objects.link(o);o.location=(4.42,-1.5,2.72);d.materials.append(gold)

# One medium plant on the short return, kept separate from the console plant.
leaf=bpy.data.materials.new('GALLEY WALL / Botanical satin');leaf.use_nodes=True
p=next(n for n in leaf.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(.055,.12,.018,1);p.inputs['Roughness'].default_value=.58
bm=bmesh.new();bmesh.ops.create_cone(bm,cap_ends=True,cap_tris=False,segments=40,radius1=.10,radius2=.13,depth=.19)
d=bpy.data.meshes.new('Pot');bm.to_mesh(d);bm.free();o=bpy.data.objects.new('GALLEY WALL / Neutral plant pot',d);col.objects.link(o);o.location=(4.43,-.70,1.165);d.materials.append(dark)
for i in range(11):
    a=i*2.4;z=1.36+(i%4)*.08;end=Vector((4.43+math.cos(a)*.20,-.70+math.sin(a)*.17,z+.13))
    rail('Plant stem',(4.43,-.70,1.24),end,.008,.008,leaf)
    axis=Vector((math.cos(a)*.18,math.sin(a)*.18,.07));side=Vector((-math.sin(a),math.cos(a),0))*.055
    verts=[end-axis*.35,end+side,end+axis,end-side,end+Vector((0,0,.022))]
    d=bpy.data.meshes.new('Leaf');d.from_pydata(verts,[],[(0,1,4),(1,2,4),(2,3,4),(3,0,4)]);d.update()
    o=bpy.data.objects.new('GALLEY WALL / Sculpted leaf',d);col.objects.link(o);d.materials.append(leaf)
    center=sum((v.co for v in d.vertices),Vector())/len(d.vertices)
    for v in d.vertices:v.co=center+(v.co-center)*1.8
    mod=o.modifiers.new('Leaf thickness','SOLIDIFY');mod.thickness=.001
    mod=o.modifiers.new('Leaf softness','SUBSURF');mod.levels=2

# Move existing practical up to the new upper shelf; lower shelf gets a small wash.
o=bpy.data.objects['GALLEY / Counter practical'];o.location=(4.12,-1.45,2.53);o.data=o.data.copy();o.data.energy=22;o.data.size=1.0;o.data.size_y=.18
d=bpy.data.lights.new('GALLEY WALL / Lower shelf practical','AREA');d.energy=6;d.color=(1,.62,.30);d.shape='RECTANGLE';d.size=.5;d.size_y=.12
o=bpy.data.objects.new(d.name,d);col.objects.link(o);o.location=(4.4,-1.45,1.97);o['exclude_runtime_export']=True
box('Arch junction closure',(3.36,-1.66,1.70),(.16,.40,3.22),dark,.008)
bpy.context.view_layer.update()
assert all(tuple(v for row in scene.objects[n].matrix_world for v in row)==v for n,v in protected.items())
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
camera=bpy.data.objects['GALLEY REVIEW'];camera.location=(2.0,1.2,1.85);camera.rotation_euler=(Vector((4.12,-1.3,1.85))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=25;scene.camera=camera
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bridge-galley-wall-complete.blend'),compress=True)
(OUT/'galley-wall-validation.json').write_text(json.dumps({'sourceUnchanged':True,'sourceSha256':digest,'protectedTransforms':len(protected),'newObjects':len(col.objects),'rearCounterWidth':1.36,'sideReturnLength':.696,'runtimeExported':False},indent=2))
print('INTEGRATED_WALL_READY')
