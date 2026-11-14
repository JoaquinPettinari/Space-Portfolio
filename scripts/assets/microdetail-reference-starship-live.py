"""Add restrained close-up details to the approved exterior; preserve its silhouette."""
import bpy
import bmesh
import math
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio')
OUT=ROOT/'docs/assets/cruz-del-sur-exterior'
scene=bpy.context.scene
root=bpy.data.collections['CRUZ DEL SUR / REFERENCE EXTERIOR']
if bpy.data.collections.get('CDS 08 / Precision fittings'):
    raise RuntimeError('Precision pass already exists; do not duplicate it.')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'before-precision-pass.blend'),copy=True)
col=bpy.data.collections.new('CDS 08 / Precision fittings')
root.children.link(col)
environment=bpy.data.collections['CDS PREVIEW / Procedural planet and stars - no export']
environment.hide_render=True
environment.hide_viewport=True
environment['status']='Presentation placeholder, hidden. Background design deferred by user.'

steel=bpy.data.materials['CDS / Machined edges']
graphite=bpy.data.materials['CDS / Ceramic graphite']
dark=bpy.data.materials['CDS / Dark armor']
black=bpy.data.materials['CDS / Deep recess']
teal=bpy.data.materials['CDS / Petrol livery']
ivory=bpy.data.materials['CDS / Ivory markings']
warm=bpy.data.materials['CDS / Warm interior light']
white=bpy.data.materials['CDS / Warm white strip']
cyan=bpy.data.materials['CDS / Ion cyan']

def newmat(name,color,metal=.3,rough=.5):
    m=bpy.data.materials.new('CDS / '+name)
    m.use_nodes=True
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal
    p.inputs['Roughness'].default_value=rough
    m.diffuse_color=(*color,1)
    return m
ochre=newmat('Muted safety ochre',(.48,.27,.065))
stencil=newmat('Technical stencil',(.5,.56,.57),.15)
rubber=newmat('Black elastomer seals',(.012,.017,.02),.05,.7)

def mesh(name,verts,faces,mat,bevel=0):
    me=bpy.data.meshes.new(name)
    me.from_pydata(verts,[],faces)
    me.update()
    bm=bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    ob=bpy.data.objects.new('CDS | '+name,me)
    col.objects.link(ob)
    if bevel:
        mod=ob.modifiers.new('Fine edge radius','BEVEL')
        mod.width=bevel
        mod.segments=2
    return ob

def box(name,pos,size,mat,bevel=.008):
    v=[tuple(pos[i]+v[i]*size[i]/2 for i in range(3)) for v in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]]
    return mesh(name,v,[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)],mat,bevel)

def line(name,a,b,r,mat):
    a,b=Vector(a),Vector(b)
    ob=box(name,(0,0,0),(r,r,(b-a).length),mat,r*.18)
    ob.location=(a+b)/2
    ob.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    return ob

# Fasteners and their dark counterbores share two meshes.
class Batch:
    def __init__(self):self.v=[];self.f=[]
    def cylinder(self,center,normal,radius,depth,segments=8):
        center=Vector(center)
        q=Vector((0,0,1)).rotation_difference(Vector(normal).normalized())
        first=len(self.v)
        for z in [0,depth]:
            for i in range(segments):
                a=i*math.tau/segments
                self.v.append(tuple(center+q@Vector((math.cos(a)*radius,math.sin(a)*radius,z))))
        self.f.extend([tuple(first+i for i in reversed(range(segments))),tuple(first+segments+i for i in range(segments))])
        self.f.extend((first+i,first+(i+1)%segments,first+segments+(i+1)%segments,first+segments+i) for i in range(segments))
    def finish(self,name,mat):return mesh(name,self.v,self.f,mat)

sockets=Batch()
bolts=Batch()
panel_count=0
bolt_count=0
for ob in list(root.all_objects):
    if ob.type!='MESH' or ob.hide_render:continue
    top=any(k in ob.name for k in ['Dorsal armor slab','Bridge roof armor cassette','Forward bridge roof segment','Hatch exposed hinge'])
    side=any(k in ob.name for k in ['Lower chamfered armor cassette','Angled shoulder armor','Raised registration surround','Lateral maneuvering pod'])
    if not(top or side):continue
    center=sum((ob.matrix_world@v.co for v in ob.data.vertices),Vector())/len(ob.data.vertices)
    expected=Vector((0,0,1)) if top else Vector((1 if center.x>0 else -1,0,0))
    norm=ob.matrix_world.to_3x3().inverted().transposed()
    candidates=[p for p in ob.data.polygons if (norm@p.normal).normalized().dot(expected)>.5]
    if not candidates:continue
    face=max(candidates,key=lambda p:p.area)
    points=[ob.matrix_world@ob.data.vertices[i].co for i in face.vertices]
    center=sum(points,Vector())/len(points)
    normal=(norm@face.normal).normalized()
    for p in points:
        point=center.lerp(p,.82)+normal*.004
        sockets.cylinder(point,normal,.048,.008,12)
        bolts.cylinder(point+normal*.01,normal,.027,.018,6)
        bolt_count+=1
    panel_count+=1
sockets.finish('Precision pass / panel counterbores',black)
bolts.finish('Precision pass / flush hex fasteners',steel)

# Fine brushed roughness varies the light response without changing the livery.
for mat in [graphite,dark,bpy.data.materials['CDS / Titanium armor']]:
    nodes=mat.node_tree.nodes
    links=mat.node_tree.links
    p=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
    coord=nodes.new('ShaderNodeTexCoord')
    coord.label='Subtle manufactured surface grain'
    mapping=nodes.new('ShaderNodeVectorMath')
    mapping.operation='MULTIPLY'
    mapping.inputs[1].default_value=(20,160,20)
    links.new(coord.outputs['Generated'],mapping.inputs[0])
    noise=nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value=4
    noise.inputs['Detail'].default_value=2
    links.new(mapping.outputs[0],noise.inputs['Vector'])
    ramp=nodes.new('ShaderNodeMapRange')
    ramp.inputs['To Min'].default_value=.34
    ramp.inputs['To Max'].default_value=.49
    links.new(noise.outputs['Fac'],ramp.inputs['Value'])
    links.new(ramp.outputs['Result'],p.inputs['Roughness'])

sections=[(-18.3,5.65),(-16,6.8),(-7,7.2),(1,7.05),(9,6.7),(22,6.15),(27.5,4.9),(30,4.2)]
def hullwidth(y):
    for a,b in zip(sections,sections[1:]):
        if a[0]<=y<=b[0]:return a[1]+(b[1]-a[1])*(y-a[0])/(b[0]-a[0])
    return 5.65

def text(body,pos,size,side=None,mat=stencil):
    cu=bpy.data.curves.new('Technical legend','FONT')
    cu.body=body
    cu.size=size
    cu.align_x='CENTER'
    cu.space_character=1.1
    ob=bpy.data.objects.new('CDS | '+body,cu)
    col.objects.link(ob)
    ob.location=pos
    if side:ob.rotation_euler=Matrix(((0,0,side),(side,0,0),(0,1,0))).to_euler()
    cu.materials.append(mat)
    return ob

for s in [-1,1]:
    # Pull handles, latch covers, and pressure equalization slots.
    for y,z in [(-13.5,-2.9),(-9.7,-3.1),(1.8,-3.1),(12.3,-2.75),(20.7,-2.35)]:
        x=s*(hullwidth(y)+.36)
        box('Recessed access pull pocket',(x,y,z),(.025,.4,.17),rubber,.025)
        for yy in [y-.13,y+.13]:
            box('Handle mounting lug',(x+s*.045,yy,z),(.07,.06,.08),graphite,.012)
        line('Folded access pull',(x+s*.085,y-.13,z),(x+s*.085,y+.13,z),.035,steel)
        box('Latch safety flag',(x+s*.06,y+.27,z),(.02,.06,.13),ochre,.005)
        text('ACCESS', (x+s*.07,y,z+.17),.055,s)
    # Functional legends placed on technical armor, away from the large registry.
    for y,z,body in [(-12,-.95,'THERMAL LOOP B'),(-8.5,-2.87,'SERVICE  /  04'),(2,-3.15,'PRESSURE HULL'),(20.8,-2.48,'AUXILIARY BUS'),(-15.7,-1.73,'RCS  /  KEEP CLEAR')]:
        x=s*(hullwidth(y)+.55)
        text(body,(x,y,z),.075,s)
        box('Legend alignment mark',(x,y+.8,z+.025),(.012,.025,.13),ivory,.002)
    # Safety labels and diagonal warning ticks around the docking collar.
    y=-4.6
    x=s*(hullwidth(y)+.86)
    text('CDS  /  DOCK 02',(x,y,-1.12),.095,s,ivory)
    text('AUTO SEAL',(x,y,-2.86),.065,s)
    for yy in [-5.17,-4.03]:
        for j in range(4):
            zz=-2.4+j*.22
            line('Docking caution tick',(x,yy-.06,zz),(x,yy+.06,zz+.12),.035,ochre)
    # Side service connectors: two concentric metal rims and insulating center.
    for y,z in [(-10.8,-2.3),(-8,-2.3),(13,-2.55),(19.5,-2.1)]:
        x=s*(hullwidth(y)+.58)
        sockets=Batch()
        sockets.cylinder((x,y,z),(s,0,0),.105,.035,16)
        sockets.finish('Umbilical connector bezel',steel)
        sockets=Batch()
        sockets.cylinder((x+s*.038,y,z),(s,0,0),.078,.018,12)
        sockets.finish('Umbilical connector socket',black)
        for dy in [-.035,.035]:
            box('Connector contact pin',(x+s*.065,y+dy,z),(.016,.018,.018),ivory,.003)
    # Non-slip hatch surfaces and hoist points, on top of existing covers.
    for y,z in [(11.5,1.8),(19,1.8),(24,1.47)]:
        x=s*1.45
        for j in range(7):
            box('Hatch anti-slip strip',(x,y-.46+j*.15,z),(.8,.026,.016),rubber,.004)
        text('LIFT HERE',(x,y-.7,z+.012),.075,mat=stencil)
        for yy in [y-.63,y+.63]:
            line('Deck lifting eye leg',(x-.22,yy,z+.01),(x-.22,yy,z+.1),.045,steel)
            line('Deck lifting eye leg',(x+.22,yy,z+.01),(x+.22,yy,z+.1),.045,steel)
            line('Deck lifting eye crossbar',(x-.22,yy,z+.1),(x+.22,yy,z+.1),.045,steel)

# Thermal panel borders and numbered cooling banks, applied where the fins already are.
for s in [-1,1]:
    for y,z,x in [(-11,2.25,3.45),(-6,2.25,3.45),(12,1.52,3.9),(20,1.52,3.9)]:
        text('HEAT EXCHANGER',(s*x,y-1.62,z+.05),.075,mat=stencil)
        for yy in [y-1.3,y+1.3]:
            box('Cooling bank end manifold',(s*x,yy,z+.2),(1.23,.09,.12),dark,.015)
            for xx in [s*x-.42,s*x+.42]:
                box('Manifold brass service cap',(xx,yy,z+.27),(.08,.08,.035),ochre,.012)

# Structured recessed machinery in the narrow rear face below the bridge overhang.
box('Bridge aft technical backwall',(0,-3.66,2.7),(7.75,.09,1.35),dark,.04)
for s in [-1,1]:
    box('Aft avionics bay surround',(s*2.1,-3.73,2.65),(2.25,.07,.76),graphite,.045)
    box('Aft avionics bay recess',(s*2.1,-3.775,2.65),(2.02,.025,.58),black,.025)
    for i in range(12):
        box('Aft avionics louvre',(s*2.1-.89+i*.16,-3.8,2.65),(.035,.07,.43),steel,.005)
    box('Avionics telltale',(s*2.1,-3.84,2.94),(.36,.02,.025),cyan,.004)
box('Bridge aft center service hatch',(0,-3.76,2.65),(1.25,.08,1.08),graphite,.07)
box('Bridge aft hatch gasket',(0,-3.81,2.65),(1.04,.025,.89),rubber,.05)
box('Bridge aft hatch center',(0,-3.83,2.65),(.94,.025,.79),dark,.04)
line('Bridge hatch horizontal pull',(-.2,-3.87,2.65),(.2,-3.87,2.65),.045,steel)

# A modest protective lip and thermal vanes around each existing engine mouth.
engine_sockets=Batch()
engine_bolts=Batch()
for x in [-4.5,0,4.5]:
    for i in range(16):
        a=i*math.tau/16
        p=(x+math.cos(a)*1.15,-19.668,-1.35+math.sin(a)*1.15)
        engine_sockets.cylinder(p,(0,-1,0),.044,.014,12)
        engine_bolts.cylinder((p[0],p[1]-.016,p[2]),(0,-1,0),.024,.018,6)
    # Thermal cassette labels are laid on the horizontal stern deck.
    text('PROPULSION  /  '+('P' if x<0 else 'S' if x>0 else 'C'),(x,-17.8,1.32),.1,mat=stencil)
    for xx in [x-.75,x+.75]:
        for j in range(4):
            box('Propulsion warning stripe',(xx,-18.1+j*.18,1.3),(.16,.06,.014),ochre,.004)
engine_sockets.finish('Precision pass / nozzle rim counterbores',black)
engine_bolts.finish('Precision pass / nozzle rim screws',steel)

# Camera dedicated to evaluating the new details, with no planet or starfield.
stage=bpy.data.collections['CDS PREVIEW / Cameras and lighting - no export']
data=bpy.data.cameras.new('CDS | Precision detail camera')
camera=bpy.data.objects.new(data.name,data)
stage.objects.link(camera)
camera.location=(-23,8,10)
camera.rotation_euler=(Vector((-1,7,0.2))-camera.location).to_track_quat('-Z','Y').to_euler()
data.lens=48
scene.camera=bpy.data.objects['CDS | Reference three quarter']
scene.render.resolution_x=1800
scene.render.resolution_y=1000
scene.render.filepath=str(OUT/'cruz-del-sur-detail-pass.png')
col['scope']='Close-up fittings only; accepted silhouette, bridge interior and gameplay unchanged.'
col['panel_fasteners']=bolt_count
col['panels_fitted']=panel_count
root['background']='Planet and stars hidden at user request; future background work deferred.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'cruz-del-sur-exterior.blend'))
print('PRECISION PASS SAVED',panel_count,'panels',bolt_count,'new fasteners',len(col.objects),'detail objects')
