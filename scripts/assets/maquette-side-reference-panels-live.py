"""Editable Blender-only side cassettes, fitted to the bridge after the glass passage.
No runtime export, physics edit or paid assets. Run in the unified Blender scene.
"""
from pathlib import Path
from math import sin, cos, pi
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
s = bpy.context.scene
assert s.name == 'CRUZ DEL SUR / Unified compact vessel'
NAME = 'UNIFIED / 13 Reference side cassettes - Blender only'
assert bpy.data.collections.get(NAME) is None, 'Pass already exists; edit the existing collection'
collection = bpy.data.collections.new(NAME)
s.collection.children.link(collection)
collection['purpose'] = 'Reference maquette only; not exported to the game'
created = []

def link(obj):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    collection.objects.link(obj)
    created.append(obj)
    return obj

def material(name, color, metal=0, rough=.45, emission=0):
    m = bpy.data.materials.new('CDS NICHE / ' + name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bs = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Metallic'].default_value = metal
    bs.inputs['Roughness'].default_value = rough
    if emission:
        bs.inputs['Emission Color'].default_value = (*color, 1)
        bs.inputs['Emission Strength'].default_value = emission
    return m

body = material('Graphite ceramic armor', (.055,.067,.079), .55,.38)
edge = material('Brushed titanium', (.18,.20,.21), .7,.34)
black = material('Deep rubber and cavities', (.009,.014,.018), .08,.72)
gold = material('Muted safety ochre', (.54,.29,.052), .3,.5)
white = material('Ivory lettering', (.65,.69,.64), .1,.55)
warm = material('Warm protected LED diffuser', (1,.68,.34), 0,.35,3.5)
teal = material('Instrument status cyan', (.025,.52,.59), 0,.35,1.2)
book = material('Field journal cloth', (.035,.095,.105), .05,.75)
paper = material('Journal page edges', (.45,.43,.35), 0,.9)
leaf = material('Specimen jade leaves', (.055,.16,.025),0,.4)
leaflight = material('Specimen young leaves', (.14,.28,.035),0,.45)
soil = material('Soil', (.018,.012,.008),0,1)

# Subtle shared micro-surface, deliberately no displacement/subdivision.
for mat in [body,edge,gold,book]:
    nodes=mat.node_tree.nodes; links=mat.node_tree.links
    bs=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
    noise=nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value=135
    bump=nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.13
    bump.inputs['Distance'].default_value=.009
    links.new(noise.outputs['Fac'],bump.inputs['Height']); links.new(bump.outputs['Normal'],bs.inputs['Normal'])

def bevel(obj, amount=.015):
    mod=obj.modifiers.new('Small manufactured edge radii','BEVEL'); mod.width=amount; mod.segments=2
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    for f in obj.data.polygons: f.use_smooth=False
    return obj

def box(name, at, size, mat=body, radius=.012):
    bpy.ops.mesh.primitive_cube_add(size=1,location=at)
    o=link(bpy.context.object);o.name='CDS NICHE / '+name
    o.dimensions=size; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat)
    if radius: bevel(o,min(radius,min(size)*.3))
    return o

def outline(w,h,c):
    return [(-w/2+c,-h/2),(w/2-c,-h/2),(w/2,-h/2+c),(w/2,h/2-c),(w/2-c,h/2),(-w/2+c,h/2),(-w/2,h/2-c),(-w/2,-h/2+c)]

def ring(name,cx,cz,w,h,border,y=-1.18,depth=.12,mat=body):
    out=outline(w,h,min(.13,h*.15)); inn=outline(w-2*border,h-2*border,.08)
    verts=[(cx+x,yy,cz+z) for yy in [y-depth/2,y+depth/2] for loop in [out,inn] for x,z in loop]
    faces=[]
    for i in range(8):
        j=(i+1)%8
        faces += [(i,j,8+j,8+i),(16+i,24+i,24+j,16+j),(i,16+i,16+j,j),(8+i,8+j,24+j,24+i)]
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    o=link(bpy.data.objects.new('CDS NICHE / '+name,me));o.data.materials.append(mat)
    bevel(o,.008)
    return o

fontpath=Path('C:/Windows/Fonts/bahnschrift.ttf')
font=bpy.data.fonts.load(str(fontpath)) if fontpath.exists() else bpy.data.fonts.get('Bfont')
def text(name,caption,cx,z,size=.038,y=-1.085,mat=white):
    data=bpy.data.curves.new(name,'FONT');data.body=caption;data.size=size;data.space_character=1.12
    data.align_x='CENTER';data.font=font;data.extrude=0
    obj=link(bpy.data.objects.new('CDS NICHE / '+name,data));obj.location=(cx,y,z);obj.rotation_euler=(pi/2,0,pi)
    data.materials.append(mat);return obj

def image_material(name,file,emission=0):
    mat=material(name,(.15,.17,.17),0,.67)
    bs=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    image=bpy.data.images.load(str(file),check_existing=True);image.pack()
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
    mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    if emission:
        mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=emission
    return mat
screen=image_material('Diagnostics screen',ROOT/'docs/assets/unified-ship/blender-monitor-diagnostics.png',.65)
board=bpy.data.materials['CDS POLISH / Recess expedition board']
photo=bpy.data.materials['CDS POLISH / Matte expedition photographs']

def plane(name,cx,z,w,h,y,mat,uv=(0,0,1,1)):
    me=bpy.data.meshes.new(name)
    me.from_pydata([(cx+w/2,y,z-h/2),(cx-w/2,y,z-h/2),(cx-w/2,y,z+h/2),(cx+w/2,y,z+h/2)],[],[(0,1,2,3)])
    layer=me.uv_layers.new();u,v,uw,vh=uv
    for i,co in enumerate([(u,v),(u+uw,v),(u+uw,v+vh),(u,v+vh)]):layer.data[i].uv=co
    o=link(bpy.data.objects.new('CDS NICHE / '+name,me));o.data.materials.append(mat);return o

def curve(name,points,radius,mat):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=2
    data.bevel_depth=radius;data.bevel_resolution=2
    spline=data.splines.new('POLY');spline.points.add(len(points)-1)
    for p,co in zip(spline.points,points):p.co=(*co,1)
    o=link(bpy.data.objects.new('CDS NICHE / '+name,data));data.materials.append(mat);return o

def case(name,cx,z,w=.57,h=.25):
    box(name+' shell',(cx,-1.42,z),(w,.31,h),body,.035)
    box(name+' lid',(cx,-1.42,z+h*.28),(w+.018,.32,.035),black,.01)
    for sign in [-1,1]:
        xx=cx+sign*w*.32
        box(name+' reinforcement',(xx,-1.245,z),(.045,.045,h*.93),edge)
        box(name+' latch',(xx,-1.212,z+.015),(.062,.032,.055),gold)
    box(name+' handle well',(cx,-1.248,z),(.19,.014,.072),black)
    box(name+' folding handle',(cx,-1.223,z),(.14,.035,.025),edge)
    text(name+' serial','EX - 4218',cx,z-h*.28,.019,y=-1.201,mat=gold)

def screws(cx,cz,w,h):
    for x in [-w/2+.055,w/2-.055]:
        for z in [-h/2+.055,h/2-.055]:
            box('Recessed screw socket',(cx+x,-1.099,cz+z),(.028,.01,.028),black,.004)
            box('Steel fastener',(cx+x,-1.091,cz+z),(.014,.009,.014),edge,.003)

for cx,label in [(2.86,'technical'),(-2.86,'specimen')]:
    # Raised cabinet covers the previous small arrangement without deleting it.
    box(label+' pressure back',(cx,-1.70,1.51),(1.78,.10,2.86),body,.035)
    box(label+' shadow well',(cx,-1.615,1.47),(1.52,.025,2.45),black)
    ring(label+' outer pressure frame',cx,1.52,1.82,2.88,.10,depth=.16)
    for sign in [-1,1]:
        box(label+' inner return',(cx+sign*.77,-1.41,1.5),(.055,.40,2.47),edge)
        for zz in [.63,2.16]:
            box(label+' LED gasket',(cx+sign*.84,-1.075,zz),(.055,.04,.81),black)
            box(label+' amber vertical diffuser',(cx+sign*.84,-1.048,zz),(.026,.016,.74),warm)
    box(label+' top designation',(cx,-1.19,2.80),(1.54,.13,.23),body)
    text(label+' designation','CRUZ DEL SUR',cx,2.80,.075)
    text(label+' designation small','EXPLORATION VESSEL  /  CDS-01',cx,2.755,.021,mat=gold)
    for zz in [.15,.69,1.74,2.58]:
        box(label+' shelf structural lip',(cx,-1.30,zz),(1.52,.44,.052),edge)
        box(label+' recessed shelf warm light',(cx,-1.235,zz-.035),(1.31,.025,.018),warm,.006)
    # A few shallow routed seams, vents and caution stencils.
    for j in range(5):
        box(label+' base vent',(cx+.39,-1.103,.31+j*.026),(.32,.012,.013),black,.002)
    for j in range(4):
        stripe=box(label+' warning mark',(cx-.52+j*.075,-1.102,.28),(.035,.009,.11),gold,.002)
        stripe.rotation_euler.y=-.55
    screws(cx,1.52,1.82,2.88)
    # Reuse two pre-existing practical lights; no increase in scene light count.
    old=bpy.data.objects.get('CDS POLISH / Niche warm practical '+ ('3.05' if cx>0 else '-3.05'))
    if old:
        old.location=(cx,-.91,2.66);old.rotation_euler=(Vector((cx,-1.48,1.34))-old.location).to_track_quat('-Z','Y').to_euler()
        old.data.energy=55 if cx>0 else 40;old.data.color=(1,.65,.31);old.data.size=.85

# Technical cabinet: live-looking diagnostics, communications, route board, storage.
cx=2.86
ring('diagnostics heavy bezel',cx+.19,2.15,1.10,.64,.065,y=-1.22,depth=.10,mat=edge)
plane('diagnostics glass',cx+.19,2.15,.94,.48,-1.154,screen)
box('intercom housing',(cx-.59,-1.32,2.15),(.29,.24,.62),body)
for j in range(6):box('intercom speaker slots',(cx-.59,-1.185,2.36+j*.022),(.19,.014,.01),black,.002)
plane('intercom cyan display',cx-.59,2.20,.18,.11,-1.183,screen)
box('intercom handset grip',(cx-.67,-1.15,1.99),(.065,.08,.21),edge)
curve('coiled communication lead',[(cx-.65+.025*cos(i*.8),-1.15+.012*sin(i*.8),1.91-i*.0024) for i in range(68)],.006,black)
text('diagnostics legend','SYSTEMS  /  DIAGNOSTICS',cx+.19,2.50,.025,mat=teal)
ring('expedition board frame',cx,1.23,1.47,.92,.045,y=-1.49,depth=.07,mat=edge)
plane('expedition route and printed notes',cx,1.23,1.35,.80,-1.442,board)
for sign in [-1,1]:
    for zz in [.85,1.60]:box('board mechanical fixing',(cx+sign*.64,-1.425,zz),(.024,.016,.024),gold,.004)
case('Upper survey crate',cx+.36,.515,.64,.25)
case('Lower survey crate',cx+.36,.285,.64,.21)
case('Instrument case',cx-.36,.35,.52,.37)

# Specimen cabinet: supported books, shallow storage, photos, organic vine.
cx=-2.86
box('specimen bottom access door',(cx,-1.23,.40),(1.35,.12,.42),body)
box('access release recess',(cx+.05,-1.153,.53),(.28,.025,.055),black)
box('access release status',(cx+.05,-1.134,.53),(.17,.015,.012),teal)
for j in range(5):
    x=cx+.62-j*.105
    box('Field journal page block',(x,-1.40,.985),(.075,.25,.50),paper)
    for zz in [.727,1.245]:box('Journal cloth cover',(x,-1.40,zz),(.088,.27,.012),book)
    box('Journal binding',(x,-1.25,.985),(.088,.022,.53),book)
    text('Journal spine '+str(j),'FIELD / '+str(j+1),x,1.03,.015,y=-1.233,mat=gold)
case('Specimen sample case',cx-.34,.91,.52,.35)
curve('journal retaining bar',[(cx+.73,-1.12,.73),(cx+.73,-1.12,.85),(cx+.03,-1.12,.85),(cx+.03,-1.12,.73)],.009,gold)
box('specimen upper short shelf',(cx-.42,-1.37,2.00),(.65,.40,.045),edge)
box('specimen shelf underslung LED',(cx-.42,-1.18,1.966),(.52,.024,.015),warm)
ring('framed expedition photograph',cx+.36,2.18,.63,.49,.035,y=-1.53,depth=.04,mat=edge)
plane('Cordillera print',cx+.36,2.18,.54,.40,-1.504,photo,(0,.5,.5,.5))
for x,zz,uv in [(cx+.43,1.56,(.5,.5,.5,.5)),(cx+.04,1.45,(0,0,.5,.5))]:
    box('Postcard border',(x,-1.50,zz),(.29,.014,.25),paper)
    plane('Pinned expedition postcard',x,zz,.25,.20,-1.488,photo,uv)
    box('Postcard clip',(x,-1.47,zz+.13),(.025,.025,.05),gold)
# Turned metal planter: 24-sided pot, not a cube or a faceted paper silhouette.
bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=.135,radius2=.17,depth=.25,location=(cx-.43,-1.40,2.14))
pot=link(bpy.context.object);pot.name='CDS NICHE / Brushed metal planter';pot.data.materials.append(edge);bevel(pot,.012)
bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=.151,depth=.012,location=(cx-.43,-1.40,2.269))
o=link(bpy.context.object);o.name='CDS NICHE / Soil inside planter';o.data.materials.append(soil)
# Several leaf ribbons have cupped surfaces and a central ridge; no subdivision.
for branch in range(4):
    points=[]
    for j in range(10):
        t=j/9;points.append((cx-.43+.095*sin(t*5+branch),-1.35+.15*t,2.30-t*(.35+.65*(branch/3))))
    curve('Hanging living stem',points,.006,leaf)
    for j in range(9):
        p=Vector(points[j]); sign=1 if j%2 else -1
        w=.085+.015*sin(j); length=.16
        verts=[]
        for r in range(5):
            t=r/4;span=w*sin(pi*t)**.75
            for c in [-1,0,1]:
                verts.append((p.x+sign*(length*t)+c*span*.45,p.y-.015*c*c+.045*sin(pi*t),p.z+.065*sin(pi*t)+c*span*.75-.12*t))
        faces=[(r*3+c,r*3+c+1,(r+1)*3+c+1,(r+1)*3+c) for r in range(4) for c in range(2)]
        me=bpy.data.meshes.new('Cupped leaf');me.from_pydata(verts,[],faces);me.update()
        o=link(bpy.data.objects.new('CDS NICHE / Organic specimen leaf',me));me.materials.append(leaf if j%3 else leaflight)
        for f in me.polygons:f.use_smooth=True

# Retain editability at cabinet/material granularity while keeping object count low.
for obj in list(created):
    if obj.type in {'FONT','CURVE'}:
        bpy.context.view_layer.objects.active=obj;obj.select_set(True)
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
        bpy.ops.object.convert(target='MESH')
# Join generated parts by finish only. All originals outside this collection stay intact.
for mat in list(bpy.data.materials):
    objects=[o for o in collection.objects if o.type=='MESH' and len(o.data.materials)==1 and o.data.materials[0]==mat]
    if len(objects)<2:continue
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join();bpy.context.object.name='CDS NICHE / Batch / '+mat.name.removeprefix('CDS NICHE / ')

for name,location,target in [
    ('UNIFIED / Reference technical cassette',(1.15,1.25,1.75),(2.86,-1.3,1.5)),
    ('UNIFIED / Reference specimen cassette',(-1.05,1.15,1.75),(-2.86,-1.3,1.5)),
    ('UNIFIED / Reference paired side cassettes',(0,2.1,1.75),(0,-1.5,1.5)),
]:
    data=bpy.data.cameras.new(name);obj=bpy.data.objects.new(name,data);s.collection.children['UNIFIED / PREVIEW Cameras and lights - no export'].objects.link(obj)
    obj.location=location;obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler();data.lens=36 if 'paired' in name else 43
s.camera=bpy.data.objects['UNIFIED / Reference technical cassette']
collection['reference_bounds']='x=+-2.86, z=.08..2.96, back=-1.75, front=-1.04; clear central doorway'
s['side_cassette_reference_pass']='Blender-only maquette; technical and specimen cabinets'
print('NEW BATCHES',len(collection.objects),'TRIANGLES',sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in collection.objects if o.type=='MESH'))
