"""Separate station interior study with the approved ship visible outside. Source only."""
import bpy
import bmesh
import json
import math
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio')
OUT=ROOT/'docs/assets/station-reference-interior'
OUT.mkdir(parents=True,exist_ok=True)
NAME='Station / Reference interior and Cruz del Sur'
if NAME in bpy.data.scenes:raise RuntimeError('Station study already exists')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'before-station-study.blend'),copy=True)
scene=bpy.data.scenes.new(NAME)
bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'
root=bpy.data.collections.new('STATION / Reference interior')
scene.collection.children.link(root)
def group(name):
    c=bpy.data.collections.new('STATION / '+name)
    root.children.link(c)
    return c
room=group('01 Observation room - working copy')
arrival=group('02 Arrival lounge - working copy')
passage=group('03 Connecting passage')
finish=group('04 Reference ceiling and fixtures')
displays=group('05 Display surfaces - static preview')
props=group('06 Interior dressing')
rig=group('PREVIEW / Cameras and lighting')
exterior=group('PREVIEW / Exterior ship instance')

def duplicate_objects(objects,target,offset=(0,0,0)):
    mapping={}
    for old in objects:
        ob=old.copy()
        # Light data is independent; mesh data stays shared until edited explicitly.
        if old.type=='LIGHT':ob.data=old.data.copy()
        ob.name='STN / '+old.name
        target.objects.link(ob)
        ob.hide_render=False
        ob.hide_viewport=False
        mapping[old]=ob
    for old,ob in mapping.items():
        world=old.matrix_world.copy()
        ob.parent=mapping.get(old.parent)
        ob.matrix_world=Matrix.Translation(Vector(offset))@world
    return mapping

bridge_source=bpy.data.collections['BRIDGE / EDITABLE']
copies=duplicate_objects(list(bridge_source.all_objects),room)
arrival_source=next((s for s in bpy.data.scenes if 'Arrival Room - Spacious V10' in s.name),None)
if arrival_source is None:
    with bpy.data.libraries.load(str(ROOT/'docs/assets/arrival-room/arrival-room-v10.blend'),link=False) as (a,b):
        b.scenes=[n for n in a.scenes if 'Spacious V10' in n]
    arrival_source=b.scenes[0]
duplicate_objects(list(arrival_source.objects),arrival,(0,-10.3,0))

# A collection instance uses the actual exterior mesh without moving the source ship.
ship_asset=bpy.data.collections.new('STATION SOURCE / Approved ship geometry')
source_ship=bpy.data.collections['CRUZ DEL SUR / REFERENCE EXTERIOR']
for c in source_ship.children:
    if c.name.startswith('CDS ') and 'PREVIEW' not in c.name:ship_asset.children.link(c)
ship=bpy.data.objects.new('STATION / Cruz del Sur outside observation windows',None)
exterior.objects.link(ship)
ship.instance_type='COLLECTION'
ship.instance_collection=ship_asset
ship.location=(0,70,1.5)
ship.rotation_euler.z=math.radians(72)
ship['role']='Actual 3D ship; separate from station. No traversable docking connection built.'

def material(name,color,metal=.3,rough=.4,emission=0):
    m=bpy.data.materials.new('STATION / '+name)
    m.use_nodes=True
    m.diffuse_color=(*color,1)
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal
    p.inputs['Roughness'].default_value=rough
    p.inputs['Emission Color'].default_value=(*color,1)
    p.inputs['Emission Strength'].default_value=emission
    return m
graphite=material('Ceiling graphite',(.052,.064,.073),.6,.43)
metal=material('Grey titanium',(.18,.21,.23),.65,.38)
black=material('Deep gasket',(.009,.015,.019),.1,.7)
warm=material('Warm diffusers',(1,.67,.32),0,.4,3)
cyan=material('Cyan display lines',(.015,.6,.8),0,.3,2)
ivory=material('Ivory stencil',(.64,.65,.59),.15,.5)
screenblack=material('Dark display substrate',(.003,.016,.022),.05,.32,.1)

def mesh(name,verts,faces,mat,col=finish,bevel=0):
    me=bpy.data.meshes.new('STN / '+name)
    me.from_pydata(verts,[],faces)
    me.update()
    bm=bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    ob=bpy.data.objects.new('STN / '+name,me)
    col.objects.link(ob)
    if bevel:
        mod=ob.modifiers.new('Manufactured edges','BEVEL')
        mod.width=bevel
        mod.segments=2
    return ob

def box(name,pos,size,mat,col=finish,bevel=.012):
    v=[tuple(pos[i]+v[i]*size[i]/2 for i in range(3)) for v in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]]
    return mesh(name,v,[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)],mat,col,bevel)

def beam(name,a,b,r,mat,col=finish):
    a,b=Vector(a),Vector(b)
    ob=box(name,(0,0,0),(r,r,(b-a).length),mat,col,min(.01,r*.12))
    ob.location=(a+b)/2
    ob.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    return ob

def curve(name,points,r,mat,col=displays,closed=False):
    cu=bpy.data.curves.new('STN / '+name,'CURVE')
    cu.dimensions='3D'
    cu.bevel_depth=r
    cu.bevel_resolution=2
    sp=cu.splines.new('POLY')
    sp.points.add(len(points)-1)
    for p,co in zip(sp.points,points):p.co=(*co,1)
    sp.use_cyclic_u=closed
    ob=bpy.data.objects.new('STN / '+name,cu)
    col.objects.link(ob)
    cu.materials.append(mat)
    return ob

def text(body,pos,size,rotation=(math.pi/2,0,0),mat=ivory,col=props):
    cu=bpy.data.curves.new('Station legend','FONT')
    cu.body=body
    cu.size=size
    cu.align_x='CENTER'
    cu.extrude=.001
    ob=bpy.data.objects.new('STN / '+body,cu)
    col.objects.link(ob)
    ob.location=pos
    ob.rotation_euler=rotation
    cu.materials.append(mat)
    return ob

layout=json.loads((ROOT/'docs/assets/bridge/layout.json').read_text())
def xyz(p):return Vector((p[0],3.15-p[2],p[1]))
def roof(y):
    z=3.15-y
    return 3.3 if z>=.4 else 3.05+(z+3)/3.4*.25 if z>=-3 else 2.75+(max(-5.4,z)+5.4)/2.4*.3

# Opaque panelled front roof replaces the old open skylight presentation in this copy.
for i,panel in enumerate(layout['roof']):
    if not panel['glass']:continue
    pts=[xyz(p) for p in panel['points']]
    mesh('Reference closed canopy roof '+str(i),[tuple(p) for p in pts],[(0,1,2,3)],graphite)
    cen=sum(pts,Vector())/len(pts)
    inset=[cen.lerp(p,.9)-Vector((0,0,.045)) for p in pts]
    mesh('Inset ceiling service tile '+str(i),[tuple(p) for p in inset],[(0,1,2,3)],metal)
for y in [3.55,5.15,6.75,7.9]:
    w=3.9 if y<6 else 2.65 if y<7.5 else 1.5
    beam('Warm ceiling cross rib',(-w,y,roof(y)-.09),(w,y,roof(y)-.09),.12,graphite)
    for s in [-1,1]:
        x=s*(2.4 if y<6 else 1.7 if y<7.5 else .9)
        box('Ceiling luminaire inset',(x,y,roof(y)-.105),(.95,.45,.055),black)
        box('Ceiling warm rectangular diffuser',(x,y,roof(y)-.139),(.8,.31,.02),warm)

# Clear, restrained glazing. The exterior remains readable through the windows.
glazing=bpy.data.materials.new('STATION / Observation glass - clear preview')
glazing.use_nodes=True
n=glazing.node_tree.nodes
l=glazing.node_tree.links
n.clear()
out=n.new('ShaderNodeOutputMaterial')
transparent=n.new('ShaderNodeBsdfTransparent')
reflection=n.new('ShaderNodeBsdfPrincipled')
reflection.inputs['Base Color'].default_value=(.045,.14,.19,1)
reflection.inputs['Metallic'].default_value=.8
reflection.inputs['Roughness'].default_value=.17
mix=n.new('ShaderNodeMixShader')
mix.inputs[0].default_value=.025
l.new(transparent.outputs[0],mix.inputs[1])
l.new(reflection.outputs[0],mix.inputs[2])
l.new(mix.outputs[0],out.inputs[0])
for i,(a,b) in enumerate(zip(layout['outline'],layout['outline'][1:])):
    A,B=xyz((a[0],.86,a[1])),xyz((b[0],.86,b[1]))
    At,Bt=Vector((A.x,A.y,roof(A.y)-.1)),Vector((B.x,B.y,roof(B.y)-.1))
    mesh('Observation glazing '+str(i),[tuple(p) for p in [A,B,Bt,At]],[(0,1,2,3)],glazing)

# Authored bitmap diagrams, not interactive terminal UI or invented professional content.
def screen_texture(kind):
    W,H=640,400
    pixels=[.003,.014,.019,1]*(W*H)
    def dot(x,y,c):
        x,y=int(x),int(y)
        if 0<=x<W and 0<=y<H:
            j=4*(y*W+x)
            pixels[j:j+4]=[*c,1]
    def line(a,b,c=(.02,.6,.72),thick=1):
        dx,dy=b[0]-a[0],b[1]-a[1]
        steps=max(1,int(max(abs(dx),abs(dy))))
        for i in range(steps+1):
            x,y=a[0]+dx*i/steps,a[1]+dy*i/steps
            for xx in range(-thick+1,thick):
                for yy in range(-thick+1,thick):dot(x+xx,y+yy,c)
    def circle(cx,cy,r,c=(.02,.45,.55)):
        for i in range(240):
            a=i*math.tau/240
            dot(cx+math.cos(a)*r,cy+math.sin(a)*r,c)
    for x in range(90,620,35):line((x,35),(x,350),(.009,.045,.052))
    for y in range(35,360,35):line((90,y),(620,y),(.009,.045,.052))
    for y in [20,365,382]:line((15,y),(625,y),(.02,.35,.4))
    for y in range(50,350,22):
        line((15,y),(65,y),(.02,.2,.24))
        line((15,y+5),(35+(y%35),y+5),(.02,.6,.7))
    if kind in [0,2]:
        for r in [30,60,90,120,145]:circle(354,198,r)
        for a in range(12):
            angle=a*math.tau/12
            line((354,198),(354+math.cos(angle)*150,198+math.sin(angle)*150),(.02,.18,.23))
        line((354,198),(435,295),(.05,.9,1),2)
        for x,y in [(285,246),(423,180),(360,90),(454,268)]:circle(x,y,4,(.08,.8,1))
    elif kind==1:
        pts=[(170,180),(190,210),(270,220),(300,248),(360,252),(390,230),(510,218),(550,190),(530,164),(415,154),(355,140),(290,148),(260,160),(190,162),(170,180)]
        for a,b in zip(pts,pts[1:]):line(a,b,(.03,.8,.9),2)
        for y in [173,190,208]:line((220,y),(490,y),(.02,.3,.4))
        line((316,150),(316,242),(.02,.3,.4))
        for x in range(230,490,32):line((x,170),(x,210),(.015,.2,.25))
    else:
        for k in range(5):
            pts=[(100+i*7,105+k*27+math.sin(i*.2+k*.6)*22+math.sin(i*.49)*13) for i in range(72)]
            for a,b in zip(pts,pts[1:]):line(a,b,(.02,.35+k*.1,.5+k*.08))
    image=bpy.data.images.new('STATION / Static technical diagram '+str(kind),width=W,height=H)
    image.pixels.foreach_set(pixels)
    image.pack()
    mat=material('Technical display '+str(kind),(.01,.04,.05),.05,.65,.8)
    p=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    t=mat.node_tree.nodes.new('ShaderNodeTexImage')
    t.image=image
    mat.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
    mat.node_tree.links.new(t.outputs['Color'],p.inputs['Emission Color'])
    return mat
screenmats=[screen_texture(i) for i in range(4)]

def uv_quad(name,points,mat):
    ob=mesh(name,[tuple(p) for p in points],[(0,1,2,3)],mat,displays)
    uv=ob.data.uv_layers.new(name='Display UV')
    for p in ob.data.polygons:
        for li in p.loop_indices:uv.data[li].uv=[(0,0),(1,0),(1,1),(0,1)][ob.data.loops[li].vertex_index]
    return ob

for i,(old,ob) in enumerate([(a,b) for a,b in copies.items() if 'screen seal' in a.name and a.type=='MESH']):
    center=sum((old.matrix_world@v.co for v in old.data.vertices),Vector())/len(old.data.vertices)
    toward=Vector((0,3,1.65))-center
    N=old.matrix_world.to_3x3().inverted().transposed()
    candidates=[p for p in old.data.polygons if (N@p.normal).normalized().dot(toward.normalized())>.2]
    face=max(candidates,key=lambda p:p.area)
    n=(N@face.normal).normalized()
    pts=[old.matrix_world@old.data.vertices[j].co for j in face.vertices]
    center=sum(pts,Vector())/len(pts)+n*.008
    right=Vector((0,0,1)).cross(n).normalized()
    up=n.cross(right).normalized()
    w=(max(p.dot(right) for p in pts)-min(p.dot(right) for p in pts))*.96
    h=(max(p.dot(up) for p in pts)-min(p.dot(up) for p in pts))*.96
    uv_quad('Static fitted console display '+str(i),[center-right*w/2-up*h/2,center+right*w/2-up*h/2,center+right*w/2+up*h/2,center-right*w/2+up*h/2],screenmats[i%4])

uv_quad('Tactical table orbital chart',[(-.85,1.48,1.077),(.85,1.48,1.077),(.85,3.82,1.077),(-.85,3.82,1.077)],screenmats[0])
# Static holographic globe made from fine emissive lines, detached from gameplay.
for lat in [-60,-40,-20,0,20,40,60]:
    a=math.radians(lat)
    r=.3*math.cos(a)
    z=1.46+.3*math.sin(a)
    curve('Tactical globe latitude',[(r*math.cos(i*math.tau/96),2.65+r*math.sin(i*math.tau/96),z) for i in range(96)],.0018,cyan,closed=True)
for lng in range(0,180,20):
    a=math.radians(lng)
    curve('Tactical globe meridian',[(.3*math.cos(i*math.tau/96)*math.cos(a),2.65+.3*math.cos(i*math.tau/96)*math.sin(a),1.46+.3*math.sin(i*math.tau/96)) for i in range(96)],.0018,cyan,closed=True)
for r in [.42,.65]:
    curve('Tactical projected orbit',[(r*math.cos(i*math.tau/96),2.65+r*.68*math.sin(i*math.tau/96),1.095) for i in range(96)],.002,cyan,closed=True)

# Human-scale connector to the preserved arrival room, all a visual source study.
profile=[(-1.34,.05),(-1.64,.45),(-1.64,2.35),(-1.25,2.95),(1.25,2.95),(1.64,2.35),(1.64,.45),(1.34,.05)]
for k in range(6):
    y=-5.1-k*1.04
    for a,b in zip(profile,profile[1:]+profile[:1]):
        beam('Passage faceted arch',(a[0],y,a[1]),(b[0],y,b[1]),.14,metal,passage)
    for s in [-1,1]:
        box('Passage amber jamb',(s*1.56,y-.085,1.65),(.045,.025,.55),warm,passage)
for i,(a,b) in enumerate(zip(profile,profile[1:]+profile[:1])):
    mesh('Passage continuous liner '+str(i),[(a[0],-5.1,a[1]),(a[0],-10.3,a[1]),(b[0],-10.3,b[1]),(b[0],-5.1,b[1])],[(0,1,2,3)],graphite,passage)
for y in [-5.55-i*.8 for i in range(6)]:
    box('Passage deck panel',(0,y,.015),(2.55,.74,.05),metal,passage)
for s in [-1,1]:
    box('Passage low cyan guide',(s*1.2,-7.7,.06),(.035,5.05,.02),cyan,passage)

# The rear docking hatch is a separate architectural prop, not a functioning airlock.
box('Arrival closed docking hatch',(0,-16.54,1.29),(2.36,.12,2.48),graphite,props,.1)
box('Docking hatch inset',(0,-16.46,1.32),(2.02,.04,2.05),metal,props,.1)
box('Docking hatch viewport bezel',(0,-16.42,1.73),(1.22,.04,.5),black,props,.06)
box('Docking hatch viewport',(0,-16.39,1.73),(1.05,.02,.34),screenblack,props,.04)
text('DOCKING ACCESS',(0,-16.38,2.27),.14,rotation=(math.pi/2,0,0))
text('ARRIVAL / DEPARTURE',(0,-16.38,2.08),.065,rotation=(math.pi/2,0,0))
for s in [-1,1]:
    box('Docking hatch warm jamb',(s*1.05,-16.38,1.18),(.035,.02,.75),warm,props,.008)
text('OBSERVATION / CRUZ DEL SUR',(0,-2.095,2.82),.14)
text('ARRIVAL LOUNGE',(0,-10.2,2.72),.12,rotation=(math.pi/2,0,math.pi))

world=bpy.data.worlds.new('STATION / Neutral space - background deferred')
world.use_nodes=True
bg=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND')
bg.inputs[0].default_value=(.008,.017,.029,1)
bg.inputs[1].default_value=.18
scene.world=world
def area(name,loc,target,power,color,size,size_y=None):
    data=bpy.data.lights.new('STN / '+name,'AREA')
    data.energy=power
    data.color=color
    data.shape='RECTANGLE'
    data.size=size
    data.size_y=size_y or size
    ob=bpy.data.objects.new(data.name,data)
    rig.objects.link(ob)
    ob.location=loc
    ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
    return ob
area('Forward warm ceiling',(0,5.7,2.9),(0,4,0),150,(1,.72,.43),4,3)
area('Observation left softbox',(-3,1.5,3.05),(-2,3,0),90,(1,.75,.48),2,3)
area('Observation right softbox',(3,1.5,3.05),(2,3,0),90,(1,.75,.48),2,3)
area('Cool window bounce',(0,9,3),(0,3,1),280,(.22,.55,1),6,2)
area('Arrival ceiling',(0,-13,2.9),(0,-13,0),240,(1,.77,.5),4,3)
for y in [-6.5,-9]:area('Passage ceiling',(0,y,2.85),(0,y,0),65,(1,.75,.45),1.5)
area('Exterior ship key',(-18,51,29),(0,70,1),33000,(.75,.85,1),22,36)
area('Exterior ship warm rim',(12,82,17),(0,70,1),38000,(1,.7,.4),18,30)

def camera(name,loc,target,lens):
    data=bpy.data.cameras.new('STN / '+name)
    ob=bpy.data.objects.new(data.name,data)
    rig.objects.link(ob)
    ob.location=loc
    ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
    data.lens=lens
    data.clip_end=500
    return ob
scene.camera=camera('Observation entry view',(0,-3.35,1.7),(0,6.5,1.55),19)
camera('Forward console view',(0,3.6,1.72),(0,8,1.65),18)
camera('Observation rear view',(0,6.5,1.7),(0,-6,1.65),19)
camera('Arrival lounge view',(2.75,-14.6,1.65),(-1.5,-11.8,1.45),20)
camera('Docking access view',(0,-12,1.65),(0,-16.55,1.48),22)
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=1600
scene.render.resolution_y=1000
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(OUT/'station-observation.png')
scene.view_settings.view_transform='AgX'
root['scope']='Separate station interpretation of supplied refs; legacy assets preserved. No gameplay changes.'
root['coupling']='Ship exterior instanced outside station. Ship cabin still separate, not fitted or traversable.'
root['background']='Neutral space only. Planet and starfield deferred.'
root['references']='Five user images: observation/control room, rear portal, arrival bay and docking access.'
for a in bpy.context.screen.areas:
    if a.type=='VIEW_3D':
        a.spaces.active.region_3d.view_perspective='CAMERA'
        a.spaces.active.shading.type='MATERIAL'
        a.spaces.active.shading.use_scene_world=True
        a.spaces.active.shading.use_scene_lights=True
        a.spaces.active.overlay.show_overlays=False
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'station-reference-interior.blend'))
print('STATION STUDY SAVED',len(scene.objects),'scene objects; source cabin copied',len(copies))
