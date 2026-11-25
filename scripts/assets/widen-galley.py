"""Replace the cramped galley enclosure with an open 2.7m rear counter."""
import bpy,bmesh,math,json,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
OUT=Path(__file__).resolve().parents[2]/'docs/assets/bridge-ceiling-study'
assert Path(bpy.data.filepath).name=='bridge-galley-botanical-final.blend'
scene=bpy.context.scene
archive=bpy.data.collections.new('GALLEY WIDE / Superseded narrow fitout - hidden');scene.collection.children.link(archive);archive.hide_render=True;archive.hide_viewport=True
col=bpy.data.collections.new('GALLEY WIDE / Open crew counter');scene.collection.children.link(col)
coffee_names=('Espresso','Machine display','Coffee display','Power button','Brew group','Spout','Drip tray','Cup','Coffee surface')
coffee_polish=('Machine','Brew handle','Steam wand','Fascia','Coffee service')
radio_names=('Radio','Speaker grille','Tuner glass','Tuning dial','Antenna')
plant_names=('Curved petiole','Curved lanceolate leaf','Central leaf vein','Fine lateral vein','Pot rolled rim','Recessed soil')
coffee=[];radio=[];plant=[]
for o in list(scene.objects):
    if not o.name.startswith('GALLEY') or any(c.hide_render for c in o.users_collection):continue
    if o.name.startswith('GALLEY / ') and any(o.name[9:].startswith(n) for n in coffee_names) or o.name.startswith('GALLEY POLISH / ') and any(o.name[16:].startswith(n) for n in coffee_polish):coffee.append(o)
    elif o.name.startswith('GALLEY / ') and any(o.name[9:].startswith(n) for n in radio_names):radio.append(o)
    elif o.name=='GALLEY WALL / Neutral plant pot' or o.name.startswith('GALLEY POLISH / ') and any(o.name[16:].startswith(n) for n in plant_names):plant.append(o)
    else:
        for c in list(o.users_collection):c.objects.unlink(o)
        archive.objects.link(o)
assert len(coffee)>15 and len(plant)>50 and len(radio)>10,(len(coffee),len(plant),len(radio))
transform=Matrix.Translation((2.75,-1.28,1.075))@Matrix.Scale(1.2,4)@Matrix.Translation((-3.85,1.43,-1.075))
for o in coffee:o.matrix_world=transform@o.matrix_world
for o in radio:o.matrix_world=Matrix.Translation((-.85,.15,.04))@o.matrix_world
for o in plant:o.matrix_world=Matrix.Translation((0,.02,0))@o.matrix_world

dark=bpy.data.materials['GALLEY POLISH / Graphite ceramic coated wall']
metal=bpy.data.materials['CEILING FINISH / Brushed edge alloy']
black=bpy.data.materials['CEILING POLISH / Matte recessed gasket']
counter=bpy.data.materials['GALLEY WALL / Pale brushed composite']
warm=bpy.data.materials['GALLEY / Honey diffuser']
def box(name,p,size,m,bevel=.008):
    bm=bmesh.new();bmesh.ops.create_cube(bm,size=1)
    for v in bm.verts:
        for i in range(3):v.co[i]*=size[i]
    d=bpy.data.meshes.new(name);bm.to_mesh(d);bm.free();o=bpy.data.objects.new('GALLEY WIDE / '+name,d);col.objects.link(o);o.location=p;d.materials.append(m)
    if bevel:
        mod=o.modifiers.new('Rolled edge','BEVEL');mod.width=bevel;mod.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o
box('Rear pressure closure',(3.40,-1.90,1.67),(2.80,.12,3.34),dark,0)
box('Rear cabinet',(3.40,-1.49,.56),(2.70,.63,.91),dark,.02)
box('Long rear counter',(3.40,-1.46,1.04),(2.76,.70,.065),counter,.018)
box('Cabinet recessed plinth',(3.4,-1.52,.13),(2.60,.49,.13),black)
for x in (2.39,3.06,3.73,4.40):
    box('Cabinet door',(x,-1.16,.57),(.64,.035,.78),dark,.01)
    box('Pull recess',(x,-1.137,.89),(.26,.012,.04),black,.003)
    box('Pull lip',(x,-1.12,.90),(.24,.022,.014),metal,.003)
box('Rear toe light',(3.4,-1.27,.17),(2.48,.018,.020),warm,.003)
box('Short return cabinet',(4.43,-.81,.56),(.56,.70,.91),dark,.018)
box('Short return counter',(4.43,-.78,1.04),(.62,.70,.065),counter,.018)
box('Return door',(4.135,-.81,.57),(.025,.62,.78),dark)
box('Return pull',(4.11,-.81,.90),(.025,.25,.018),metal,.003)
# Flat wall modules replace the tall projecting separator entirely.
for x in (2.45,3.35,4.25):box('Wall face',(x,-1.815,2.10),(.87,.035,2.16),dark,.012)
for x in (2.0,4.8):box('Thin edge trim',(x,-1.79,2.10),(.035,.04,2.2),metal,.004)
box('Side closure',(4.83,-1.14,1.67),(.12,1.42,3.34),dark,0)
for name,z,width in [('Lower',2.02,2.48),('Upper',2.66,2.48)]:
    box(name+' open shelf',(3.40,-1.61,z),(width,.39,.045),dark,.01)
    box(name+' shelf edge',(3.40,-1.408,z),(width,.015,.018),metal,.004)
    box(name+' warm diffuser',(3.40,-1.54,z-.03),(width-.12,.065,.012),warm,.003)
    for x in (2.35,4.45):box(name+' concealed bracket',(x,-1.75,z-.07),(.03,.13,.10),dark,.004)
    d=bpy.data.lights.new(name+' galley practical','AREA');d.energy=12;d.color=(1,.6,.28);d.shape='RECTANGLE';d.size=2.1;d.size_y=.16
    o=bpy.data.objects.new('GALLEY WIDE / '+d.name,d);col.objects.link(o);o.location=(3.4,-1.52,z-.07);o['exclude_runtime_export']=True
# A few slim provisioning containers leave most of both shelves open.
for i,x in enumerate((3.94,4.13,4.32)):
    box('Provision container',(x,-1.62,2.76),(.13,.16,.15+i*.025),dark,.018)
    box('Container lid',(x,-1.62,2.84+i*.0125),(.135,.165,.016),metal,.004)
for x in (2.35,2.56):
    box('Cup rack',(x,-1.62,2.08),(.12,.15,.07),metal,.015)
# Archive the old front display without touching the adjacent portal solid.
for o in list(bpy.data.objects):
    if o.type not in {'MESH','CURVE','FONT'} or o.hide_render: continue
    pts=[o.matrix_world@Vector(v) for v in o.bound_box]
    lo=[min(p[i] for p in pts) for i in range(3)]; hi=[max(p[i] for p in pts) for i in range(3)]
    named=o.name.startswith(('FRONT NICHE 1','Flank ','Niche compact','Case protection','Case latch','Case recessed','Front niche','Recorder','Restrained safety'))
    if named and lo[0]>1.75 and hi[0]<3.0 and lo[1]>-2.49 and hi[1]<-1.97:
        for old in list(o.users_collection): old.objects.unlink(o)
        bpy.data.collections['GALLEY WIDE / Superseded narrow fitout - hidden'].objects.link(o)
bpy.context.view_layer.update()
scene.camera=bpy.data.objects['GALLEY REVIEW'];scene.camera.location=(1.15,.45,1.70);scene.camera.rotation_euler=(Vector((3.4,-1.5,1.75))-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.camera.data.lens=23
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bridge-galley-open-wide.blend'),compress=True)
print('WIDE_GALLEY',len(coffee),len(plant),len(radio))
