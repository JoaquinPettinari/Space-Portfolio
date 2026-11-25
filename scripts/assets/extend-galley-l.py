"""L-shaped galley, sealed wall junction and accessible receiver review."""
import bpy
import bmesh
import math
import json
import hashlib
from pathlib import Path
from mathutils import Matrix, Vector

OUT=Path(__file__).resolve().parents[2]/'docs/assets/bridge-ceiling-study'
source=Path(bpy.data.filepath)
assert source.name=='bridge-galley-warm-final.blend'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
scene=bpy.context.scene
col=bpy.data.collections.new('GALLEY L / Cabinet and sealed junction');scene.collection.children.link(col)
dark=bpy.data.materials['CEILING FINISH / Satin charcoal titanium']
metal=bpy.data.materials['CEILING FINISH / Brushed edge alloy']
black=bpy.data.materials['CEILING POLISH / Matte recessed gasket']
gold=bpy.data.materials['SHELVES / Medal satin brass']
warm=bpy.data.materials['GALLEY / Honey diffuser']

def box(name,pos,size,mat,bevel=.008):
    bm=bmesh.new();bmesh.ops.create_cube(bm,size=1)
    for v in bm.verts:
        for i in range(3):v.co[i]*=size[i]
    d=bpy.data.meshes.new(name);bm.to_mesh(d);bm.free()
    o=bpy.data.objects.new('GALLEY L / '+name,d);col.objects.link(o);o.location=pos;d.materials.append(mat)
    if bevel:
        m=o.modifiers.new('Machined edge','BEVEL');m.width=bevel;m.segments=3
        o.modifiers.new('Weighted face normals','WEIGHTED_NORMAL')
    return o

# Side return ends before the existing plant at Y=.4 and chair at Y=.7.
box('Side return carcass',(4.40,-.58,.56),(.56,1.18,.91),dark,.022)
box('Side worktop',(4.40,-.55,1.04),(.62,1.20,.065),metal,.018)
box('Return plinth',(4.45,-.58,.13),(.43,1.12,.13),black)
for y in (-.88,-.30):
    box('Return door',(4.105,y,.59),(.032,.55,.77),dark,.012)
    box('Return handle socket',(4.083,y,.87),(.014,.26,.044),black)
    box('Return handle lip',(4.064,y,.886),(.024,.24,.013),metal,.004)
box('Return warm plinth',(4.22,-.57,.17),(.018,1.06,.024),warm,.004)

# Opaque backing overlaps the existing structural wall; surface panels stay
# forward of it. The main corridor and approved shelf geometry are untouched.
box('Rear opaque closure',(3.89,-1.82,1.70),(1.82,.12,3.26),dark,0)
box('Side opaque closure',(4.83,-.84,1.70),(.12,2.05,3.26),dark,0)
box('Corner vertical flashing',(4.73,-1.73,1.72),(.07,.09,3.14),metal,.006)
box('Rear ceiling cornice',(4.12,-1.69,3.10),(1.27,.16,.18),dark,.012)
box('Side ceiling cornice',(4.71,-.82,3.10),(.16,1.91,.18),dark,.012)
for x in (3.79,4.43):
    box('Upper wall cassette',(x,-1.74,2.62),(.60,.035,.73),dark,.012)
    box('Wall brass reveal',(x,-1.717,2.30),(.55,.008,.009),gold,.002)
box('Side backsplash',(4.735,-.55,1.47),(.035,1.20,.74),dark,.01)
box('Side countertop seal',(4.71,-.55,1.09),(.025,1.19,.025),black,.004)

# Move all receiver parts as one rigid assembly, including world-space curves.
radio_prefixes=('Radio','Speaker grille','Tuner glass','Tuning dial','Antenna')
radio=[o for o in scene.objects if o.name.startswith('GALLEY / ') and any(o.name[len('GALLEY / '):].startswith(k) for k in radio_prefixes)]
transform=Matrix.Translation(Vector((4.39,-.37,1.23))) @ Matrix.Rotation(math.pi/2,4,'Z') @ Matrix.Translation(Vector((-4.40,1.47,-1.23)))
for o in radio:o.matrix_world=transform@o.matrix_world

# Small tray and provision rack keep the remaining countertop usable.
box('Serving tray',(4.40,-1.43,1.087),(.39,.31,.018),black,.009)
for x in (4.23,4.57):box('Tray raised edge',(x,-1.43,1.103),(.015,.29,.025),metal,.004)
for y in (-1.57,-1.29):box('Tray raised edge',(4.40,y,1.103),(.35,.015,.025),metal,.004)
for i in range(2):
    x=4.31+i*.17
    box('Tea canister',(x,-1.44,1.19),(.12,.12,.17),dark,.02)
    box('Canister lid',(x,-1.44,1.28),(.125,.125,.018),gold,.006)
    box('Canister label',(x,-1.374,1.19),(.07,.004,.035),metal,.003)

def area(name,pos,target,power,size,length):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=(1,.60,.28);d.shape='RECTANGLE';d.size=size;d.size_y=length
    o=bpy.data.objects.new('GALLEY L / '+name,d);col.objects.link(o);o.location=pos
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();o['exclude_runtime_export']=True
box('Return under counter lens',(4.10,-.55,1.00),(.018,1.05,.014),warm,.003)
area('Under counter bounce',(4.08,-.55,.98),(3.8,-.55,.30),3,.9,.08)
area('Ceiling soft practical',(4.1,-1.45,2.94),(4.12,-.9,1.0),18,.8,.3)
light=bpy.data.objects.get('GALLEY / Counter practical')
if light:
    light.data=light.data.copy();light.data.energy=18;light.data.size_y=.26
cool=bpy.data.objects.get('Cool window reflected fill')
if cool:
    cool.data=cool.data.copy();cool.data.energy=22

bpy.context.view_layer.update()
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
camera=bpy.data.objects['GALLEY REVIEW'];camera.location=(1.9,1.4,1.8)
camera.rotation_euler=(Vector((4.15,-1.1,1.4))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=27
scene.camera=camera
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bridge-galley-l.blend'))
(OUT/'galley-l-validation.json').write_text(json.dumps({'sourceUnchanged':True,'sourceSha256':digest,'radioPartsMoved':len(radio),'newObjects':len(col.objects),'counterEndY':.05,'runtimeExported':False},indent=2))
print('GALLEY_L_READY',len(col.objects),'radio parts',len(radio))
