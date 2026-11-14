"""Run in Blender. Add a reference-inspired exterior; preserve all previous assets."""
import bpy
import bmesh
import math
import random
from mathutils import Vector, Matrix
from pathlib import Path

ROOT = Path(r'C:\Users\joaqu\Desktop\Space-Portfolio')
OUT = ROOT / 'docs/assets/cruz-del-sur-exterior'
OUT.mkdir(parents=True, exist_ok=True)
random.seed(2401)
scene = bpy.context.scene
if bpy.data.collections.get('CRUZ DEL SUR / REFERENCE EXTERIOR'):
    raise RuntimeError('Exterior already exists; do not duplicate it.')
for name in ['SHIP / Primary forms', 'SHIP / Large armor panels', 'EXTERIOR / Upper hull']:
    c = bpy.data.collections.get(name)
    if c:
        c.hide_viewport = True
        c.hide_render = True

root = bpy.data.collections.new('CRUZ DEL SUR / REFERENCE EXTERIOR')
scene.collection.children.link(root)
def collection(name, parent=root):
    c = bpy.data.collections.new(name)
    parent.children.link(c)
    return c

hull = collection('CDS 01 / Continuous hull')
armor = collection('CDS 02 / Armor and structural rails')
windows = collection('CDS 03 / Windows and running lights')
bridge = collection('CDS 04 / Exterior bridge shell')
engineering = collection('CDS 05 / Engines and cooling')
details = collection('CDS 06 / Service details')
graphics = collection('CDS 07 / Livery and identification')
stage = collection('CDS PREVIEW / Cameras and lighting - no export')

def material(name, color, metal=0.0, rough=.4, glow=0, texture=False):
    m = bpy.data.materials.new('CDS / '+name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    n = m.node_tree.nodes
    p = next(n for n in n if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    if glow:
        p.inputs['Emission Color'].default_value = (*color, 1)
        p.inputs['Emission Strength'].default_value = glow
    if texture:
        noise = n.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 115
        noise.inputs['Detail'].default_value = 2
        bump = n.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = .13
        bump.inputs['Distance'].default_value = .018
        m.node_tree.links.new(noise.outputs['Fac'], bump.inputs['Height'])
        m.node_tree.links.new(bump.outputs['Normal'], p.inputs['Normal'])
        ramp = n.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].color = tuple(v*.72 for v in color)+(1,)
        ramp.color_ramp.elements[1].color = tuple(v*1.2 for v in color)+(1,)
        m.node_tree.links.new(noise.outputs['Fac'], ramp.inputs[0])
        m.node_tree.links.new(ramp.outputs['Color'], p.inputs['Base Color'])
    return m

graphite = material('Ceramic graphite', (.073,.091,.108), .7,.36,texture=True)
plate = material('Titanium armor', (.16,.185,.207), .78,.33,texture=True)
darkplate = material('Dark armor', (.045,.058,.072), .72,.4,texture=True)
edge = material('Machined edges', (.26,.29,.31), .85,.3)
black = material('Deep recess', (.008,.014,.021), .35,.48)
teal = material('Petrol livery', (.018,.25,.29), .65,.33)
gold = material('Ivory markings', (.82,.69,.47), .35,.36)
glass = material('Smoked sapphire glazing', (.018,.06,.085), .8,.17)
warm = material('Warm interior light', (1,.61,.24), .2,.28,3)
white = material('Warm white strip', (1,.87,.64), .1,.28,5)
cyan = material('Ion cyan', (.06,.8,1), .2,.23,6)
amber = material('Amber navigation', (1,.29,.035), .1,.3,5)
red = material('Port navigation', (1,.025,.012), .1,.3,4)

def mesh(name, verts, faces, mat, col, bevel=0):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    col.objects.link(ob)
    me.materials.append(mat)
    if bevel:
        mod = ob.modifiers.new('Manufactured edge radius', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
    return ob

cube_v = [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]
cube_f = [(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)]
def box(name, loc, size, mat, col=details, bevel=.025):
    vs = [tuple(loc[i]+v[i]*size[i]/2 for i in range(3)) for v in cube_v]
    return mesh(name,vs,cube_f,mat,col,bevel)

def beam(name,a,b,width,mat,col=details):
    a,b = Vector(a),Vector(b)
    ob = box(name,(0,0,0),(width,width,(b-a).length),mat,col,min(width*.15,.025))
    ob.location = (a+b)/2
    ob.rotation_euler = (b-a).to_track_quat('Z','Y').to_euler()
    return ob

def form(name, sections, mat, col=hull, bevel=.07):
    # Octagonal cross section: broad horizontal surfaces and chamfered shoulders.
    vs=[]
    for y,w,bot,top in sections:
        cut=min(.56,(top-bot)*.22)
        vs.extend([(-w*.78,y,bot),(w*.78,y,bot),(w,y,bot+cut),
                   (w,y,top-cut),(w*.86,y,top),(-w*.86,y,top),
                   (-w,y,top-cut),(-w,y,bot+cut)])
    fs=[tuple(reversed(range(8)))]
    for i in range(len(sections)-1):
        for j in range(8): fs.append((8*i+j,8*i+(j+1)%8,8*(i+1)+(j+1)%8,8*(i+1)+j))
    fs.append(tuple(range(len(vs)-8,len(vs))))
    return mesh(name,vs,fs,mat,col,bevel)

sections=[(-18.3,5.65,-3.05,.65),(-16,6.8,-3.75,.9),(-7,7.2,-4.05,.85),
          (1,7.05,-4,.65),(9,6.7,-3.8,.75),(22,6.15,-3.05,.85),
          (27.5,4.9,-2.15,.65),(30,4.2,-1.25,.35)]
form('CDS | Sealed continuous pressure hull',sections,graphite)
form('CDS | Long bow deck',[(8,5.95,.3,1.15),(15,6.05,.4,1.45),(22,5.6,.35,1.25),(27.6,4.5,.1,1),(29.3,3.9,-.15,.65)],plate)
form('CDS | Aft engineering deck',[(-18,5.4,.3,1.15),(-15,6.05,.35,1.95),(-7,5.9,.3,2.1),(-2.2,5.25,.25,1.65)],plate)
form('CDS | Lower armored keel',[(-17,4.7,-3.5,-3),(-7,5.25,-4.35,-3.65),(8,4.85,-4.05,-3.4),(22,4.3,-3.3,-2.7),(28,3.4,-2,-1.4)],darkplate)
form('CDS | Bridge shoulder',[(-4,5.5,.4,1.8),(2.7,5.5,.4,1.8),(6.6,4.95,.4,1.65),(9.1,2.55,.4,1.35)],darkplate,bridge)
form('CDS | Exterior bridge glazing',[(-3.2,5.08,1.65,3.7),(2.75,5.08,1.65,3.7),(6.15,4.65,1.55,3.4),(8.8,2.4,1.45,2.95)],glass,bridge,.035)
form('CDS | Overhanging bridge roof',[(-3.6,5.45,3.6,4.15),(2.8,5.45,3.6,4.15),(6.3,5,3.3,3.85),(9.15,2.6,2.9,3.45)],plate,bridge)

def width(y):
    for a,b in zip(sections,sections[1:]):
        if a[0]<=y<=b[0]: return a[1]+(b[1]-a[1])*(y-a[0])/(b[0]-a[0])
    return sections[0][1] if y<sections[0][0] else sections[-1][1]

def sidepoly(name, coords, s, mat, col=armor, offset=.07, thick=.1):
    # coords are (longitudinal position, height), hull-conforming side panels.
    vs=[(s*(width(y)+offset+d),y,z) for d in [0,thick] for y,z in coords]
    n=len(coords)
    fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]
    fs += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh(name,vs,fs,mat,col,.025)

def sidebox(name,y,z,length,height,s,mat,col=details,offset=.2,depth=.09):
    # Use hull surface interpolation rather than floating rectangular components.
    return sidepoly(name,[(y-length/2,z-height/2),(y+length/2,z-height/2),
                          (y+length/2,z+height/2),(y-length/2,z+height/2)],s,mat,col,offset,depth)

for s in [-1,1]:
    # A broad uninterrupted registration band anchors the reference silhouette.
    sidepoly('CDS | Sweeping identification armor', [(-15,-.2),(-8,.5),(5,.45),(8,-.05),(20,-.02),(24,-.6),(22,-1.15),(7,-1.25),(4,-.65),(-10,-.75)],s,plate)
    sidepoly('CDS | Identification inset', [(-1,-.62),(6,-.65),(8,-1.04),(18,-.94),(19.8,-.22),(8.5,-.22),(6.8,.15),(.4,.12)],s,darkplate,offset=.21)
    sidepoly('CDS | Swept petrol accent', [(-10,-.91),(5.6,-1.05),(8,-1.63),(16,-1.45),(16.7,-1.2),(8,-1.38),(5.7,-.8),(-10,-.65)],s,teal,graphics,offset=.23,thick=.016)
    sidepoly('CDS | Bow accent diagonal',[(17.8,-.08),(20.1,.57),(20.65,.57),(18.35,-.08)],s,teal,graphics,offset=.22,thick=.02)
    # Deep glazed galleries, inset into raised bezels.
    for y,z,L,H in [(24,-.73,5.5,.65),(17.5,-1.85,5.4,.48),(2,-2.15,7,.55),(-9.5,-1.6,5,.48),(-14,-.95,2,.43)]:
        shape=[(y-L/2+.3,z-H/2),(y+L/2-.22,z-H/2),(y+L/2,z+H/2-.08),(y+L/2-.25,z+H/2),(y-L/2,z+H/2),(y-L/2,z-H/2+.18)]
        sidepoly('CDS | Gallery machined bezel',shape,s,edge,windows,offset=.22,thick=.09)
        sidebox('CDS | Recessed gallery glazing',y,z,L-.4,H-.13,s,glass,windows,offset=.32,depth=.018)
        sidebox('CDS | Interior ceiling ribbon',y,z+.13,L-.6,.035,s,white,windows,offset=.355,depth=.009)
        count=int(L/.34)
        for j in range(count):
            yy=y-L/2+.3+j*(L-.6)/max(count-1,1)
            sidebox('CDS | Gallery illuminated bay',yy,z-.04,.16 if j%4 else .22,.1 if j%3 else .22,s,warm if j%4 else white,windows,offset=.358,depth=.012)
            if j%3==0: sidebox('CDS | Gallery mullion',yy+.12,z,.045,H-.12,s,darkplate,windows,offset=.38,depth=.04)
    # Bottom cassettes vary in length; no single repetitive row across the livery.
    for i,(a,b) in enumerate([(-17,-13),(-12.85,-8),(-7.85,-3.8),(-3.65,1),(1.15,5.6),(5.75,10),(10.15,14.6),(14.75,19.5),(19.65,23)]):
        low=-3.45 if a<10 else -2.9+(a-10)*.045
        high=-2.55 if -3<a<6 else -1.6
        sidepoly('CDS | Lower chamfered armor cassette',[(a+.18,low),(b-.3,low+.08),(b,low+.4),(b,high),(a,high+.12),(a,low+.3)],s,plate if i%3 else darkplate,offset=.09)
        sidebox('CDS | Cassette engraved seam',(a+b)/2,low+.35,b-a-.65,.035,s,black,offset=.22,depth=.012)
        for yy in [a+.35,b-.35]:
            sidebox('CDS | Recessed latch',yy,low+.57,.12,.18,s,black,offset=.23,depth=.025)
            sidebox('CDS | Latch pin',yy,low+.57,.045,.09,s,edge,offset=.26,depth=.02)
    # Large structural chevrons, thin horizontal rub rails.
    for yy in [-15.6,-5.2,7.4,21.3]:
        sidepoly('CDS | Swept transverse hull rib',[(yy-.4,-3.45),(yy+.05,-3.45),(yy+.75,-1.5),(yy+.9,.7),(yy+.35,.8),(yy+.2,-1.3)],s,graphite,offset=.36,thick=.18)
    for z in [-3.05,-1.35]:
        for a,b in [(-17,-6),(-5,7),(8,22),(23,27.5)]:
            sidebox('CDS | Longitudinal armored rail',(a+b)/2,z,b-a,.12,s,darkplate,armor,offset=.35,depth=.16)
            sidebox('CDS | Rail polished lip',(a+b)/2,z+.06,b-a-.2,.025,s,edge,armor,offset=.52,depth=.02)
    for y,z,L in [(-14,.38,2),(-7,.24,2.5),(7,-1.17,2.7),(18,.48,2.8),(26,-1.35,1.3),(-12,-2.9,1.8)]:
        sidebox('CDS | Running light socket',y,z,L+.22,.17,s,black,windows,offset=.43,depth=.06)
        sidebox('CDS | Cyan running light',y,z,L,.045,s,cyan,windows,offset=.5,depth=.02)
    for y in [-16,-11,-2,11,22,27]:
        sidebox('CDS | Flush docking lamp',y,-2.65,.32,.07,s,white,windows,offset=.4,depth=.035)
    # Technical equipment with recessed louvres toward the stern.
    for y,z,L,H in [(-13,-2.1,2.4,.7),(-6,.05,3,.45),(12,-2.4,2,.4)]:
        sidebox('CDS | Auxiliary radiator frame',y,z,L+.2,H+.15,s,edge,engineering,offset=.3,depth=.09)
        sidebox('CDS | Auxiliary radiator well',y,z,L,H,s,black,engineering,offset=.4,depth=.04)
        for j in range(int(L/.14)):
            sidebox('CDS | Radiator fin',y-L/2+.07+j*.14,z,.035,H-.08,s,graphite,engineering,offset=.46,depth=.055)

# Faceted bow cap and observation slots, including its forward-facing surface.
box('CDS | Bow impact bumper',(0,30.05,-.53),(7.9,.2,.26),darkplate,armor,.06)
for x in [-2.5,-1.25,0,1.25,2.5]:
    box('CDS | Bow forward observation inset',(x,30.115,-.24),(.95,.035,.13),glass,windows,.025)
    box('CDS | Bow forward running light',(x,30.14,-.57),(.52,.03,.035),white,windows,.009)

# Broad top deck plates with intentionally stepped shoulder units.
for a,b,z,w in [(10,14,1.18,4.9),(14.2,18.6,1.46,4.85),(18.8,22,1.4,4.5),(22.2,25.2,1.2,3.9),(25.4,27.3,1.03,3.4),(-16,-12,1.97,4.7),(-11.8,-7.7,2.12,4.8),(-7.5,-4,2.12,4.3)]:
    for s in [-1,1]:
        box('CDS | Dorsal inset gasket',(s*w*.48,(a+b)/2,z), (w*.9,b-a,.055),black,armor,.09)
        box('CDS | Dorsal armor slab',(s*w*.48,(a+b)/2,z+.06),(w*.9-.12,b-a-.13,.1),plate,armor,.1)
        box('CDS | Dorsal panel edge',(s*w*.48,(a+b)/2,z+.12),(.035,b-a-.42,.018),edge,details,.005)
        for yy in [a+.3,b-.3]:
            box('CDS | Dorsal quick release',(s*w*.7,yy,z+.13),(.16,.25,.04),darkplate,details,.025)

# Bridge shell reads as exterior glazing, without touching the existing interior.
for s in [-1,1]:
    for y in [-2.5,-.9,.7,2.3]:
        box('CDS | Bridge side warm ceiling',(s*5.091,y,3.12),(.025,1.24,.055),warm,bridge,.01)
        box('CDS | Bridge side lit instrument',(s*5.105,y,2.04),(.025,.8,.085),warm,bridge,.01)
        beam('CDS | Bridge slanted mullion',(s*5.14,y-.22,1.87),(s*4.84,y+.13,3.62),.095,graphite,bridge)
    for a,b in [((s*5.14,2.8,1.9),(s*4.72,6.15,1.8)),((s*4.72,6.15,1.8),(s*2.44,8.82,1.68))]:
        beam('CDS | Bridge angled lower reveal',a,b,.14,edge,bridge)
        for t in [.22,.55,.83]:
            p=Vector(a).lerp(Vector(b),t)
            q=p+Vector((-.22*s,.04,1.24))
            beam('CDS | Panoramic forward mullion',p,q,.085,graphite,bridge)
            beam('CDS | Panoramic warm light',p+Vector((.025*s,0,.26)),p+Vector((.025*s,.38,.26)),.045,warm,bridge)
    beam('CDS | Bridge roof edge',(s*5.4,-3.3,4.1),(s*5.4,2.8,4.1),.085,edge,bridge)
    box('CDS | Bridge roof livery',(s*4.15,.1,4.19),(.09,4.8,.025),teal,graphics,.01)
    for y in [-1.6,.4,2.1]:
        box('CDS | Bridge upper clerestory',(s*5.43,y,3.91),(.035,.72,.075),glass,bridge,.015)

# The sloping aft buttresses tie the bridge tower into the engineering deck.
for s in [-1,1]:
    v=[(s*4.1,-3.5,4),(s*5.25,-3.5,3.7),(s*6.05,-10,1.9),(s*4.7,-10,1.9),
       (s*4.1,-3.5,3.7),(s*5.25,-3.5,3.4),(s*6.05,-10,1.65),(s*4.7,-10,1.65)]
    mesh('CDS | Swept bridge rear buttress',v,[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],plate,bridge,.065)
    for i in range(8):
        t=(i+.5)/8
        y=-3.7-5.8*t
        z=3.75-1.65*t
        beam('CDS | Buttress recessed tread',(s*(4.9+.7*t),y,z+.04),(s*(4.9+.7*t),y-.3,z-.045),.055,black,bridge)

def cylinder(name,loc,radius,depth,mat,col=details,direction=(0,0,1),segments=16):
    axis=Vector(direction).normalized()
    rot=Vector((0,0,1)).rotation_difference(axis)
    verts=[]
    for z in [-depth/2,depth/2]:
        for i in range(segments):
            p=rot@Vector((radius*math.cos(i*math.tau/segments),radius*math.sin(i*math.tau/segments),z))+Vector(loc)
            verts.append(tuple(p))
    faces=[tuple(reversed(range(segments))),tuple(range(segments,2*segments))]
    faces.extend((i,(i+1)%segments,(i+1)%segments+segments,i+segments) for i in range(segments))
    return mesh(name,verts,faces,mat,col,.015)

# Aft engine cassettes: dark apertures, nested rings and protected cyan cores.
for x in [-4.5,0,4.5]:
    form('CDS | Integrated propulsion housing',[(-19.1,1.65,-2.9,.15),(-17,1.85,-3.2,.65),(-12.7,1.6,-3,.6)],darkplate,engineering).location.x=x
    for radius,y,dep,mat in [(1.22,-19.17,.22,edge),(1.08,-19.31,.14,black),(.84,-19.4,.12,graphite),(.67,-19.48,.035,cyan),(.48,-19.51,.035,black),(.29,-19.54,.045,cyan)]:
        cylinder('CDS | Nested ion nozzle',(x,y,-1.35),radius,dep,mat,engineering,(0,1,0),32)
    for a in range(8):
        ang=a*math.tau/8
        xx=x+math.cos(ang)*.91
        zz=-1.35+math.sin(ang)*.91
        cylinder('CDS | Nozzle retaining stud',(xx,-19.49,zz),.055,.13,edge,engineering,(0,1,0),8)
    for y in [-18,-16.5,-15]:
        box('CDS | Engine transverse armor band',(x,y,.62),(3.05,.22,.16),plate,engineering,.04)
    for xx in [x-1.1,x+1.1]:
        box('CDS | Engine upper coolant trunk',(xx,-15.8,.78),(.16,4.4,.14),graphite,engineering,.04)
        box('CDS | Coolant status slit',(xx,-15.8,.86),(.045,2.8,.015),cyan,windows,.008)

# Large dorsal radiators and service access hatches.
for s in [-1,1]:
    for y in [-11,-6,12,20]:
        z=2.25 if y<0 else 1.52
        x=s*(3.45 if y<0 else 3.9)
        box('CDS | Cooling cassette bed',(x,y,z),(1.32,2.8,.12),black,engineering,.08)
        for j in range(15):
            box('CDS | Cooling cassette blade',(x,y-1.25+j*.175,z+.09),(1.15,.055,.15),graphite,engineering,.015)
        for xx in [-.68,.68]:
            box('CDS | Radiator machined border',(x+xx,y,z+.08),(.07,2.85,.11),edge,engineering,.02)
    for y in [11.5,19,24]:
        z=1.63 if y<22 else 1.3
        box('CDS | Dorsal service hatch',(s*1.45,y,z), (1.55,1.8,.13),darkplate,details,.15)
        for yy in [-.6,.6]:
            box('CDS | Hatch exposed hinge',(s*1.45,y+yy,z+.1),(.55,.1,.09),edge,details,.025)

# Antennas, navigation domes and isolated sensor mast.
for x,y,z,h in [(-1.8,-1,4.18,2.6),(1.7,-2.2,4.18,1.8),(.9,.9,4.18,1.2)]:
    cylinder('CDS | Mast armored foot',(x,y,z+.09),.28,.18,graphite,bridge)
    cylinder('CDS | Mast lower stage',(x,y,z+h*.24),.09,h*.48,edge,bridge)
    cylinder('CDS | Mast upper stage',(x,y,z+h*.68),.035,h*.65,edge,bridge)
    cylinder('CDS | Mast RF collar',(x,y,z+h*.55),.15,.07,black,bridge)
    cylinder('CDS | Mast amber tip',(x,y,z+h),.05,.08,amber,windows)
for x,y in [(-.8,1.9),(1.65,2.1)]:
    cylinder('CDS | Sensor dome plinth',(x,y,4.24),.48,.14,darkplate,bridge)
    # Sphere created by data API, no selection side effects.
    bm=bmesh.new()
    bmesh.ops.create_uvsphere(bm,u_segments=24,v_segments=12,radius=.41)
    me=bpy.data.meshes.new('Sensor radome')
    bm.to_mesh(me)
    bm.free()
    ob=bpy.data.objects.new('CDS | Ceramic navigation radome',me)
    bridge.objects.link(ob)
    ob.location=(x,y,4.52)
    me.materials.append(edge)
    for p in me.polygons:p.use_smooth=True

# Registration text plane: local X points toward stern on starboard, normal outward.
def side_text(body, y,z,size,s,mat=gold):
    cu=bpy.data.curves.new('CDS identification','FONT')
    cu.body=body
    cu.size=size
    cu.space_character=1.18
    cu.extrude=.002
    cu.bevel_depth=.001
    cu.align_x='CENTER'
    ob=bpy.data.objects.new('CDS | '+body,cu)
    graphics.objects.link(ob)
    ob.location=(s*(width(y)+.34),y,z)
    # Right-handed basis for outward normal.
    ob.rotation_euler=Matrix(((0,0,s),(-s,0,0),(0,1,0))).to_euler()
    cu.materials.append(mat)
    return ob

for s in [-1,1]:
    side_text('C R U Z   D E L   S U R',10.3,-.65,.43,s)
    side_text('EXPLORATION VESSEL   /   CDS - 01',10.1,-.91,.105,s,edge)
    for y,num in [(-12,'04'),(-3,'03'),(5,'02'),(22,'01')]:
        side_text(num,y,-2.85,.18,s,edge)
    # Southern Cross emblem, slightly forward of the registration.
    for dy,dz,r in [(0,.46,.24),(0,-.46,.2),(-.55,.05,.14),(.57,.1,.14),(.38,-.15,.095)]:
        yc,zc=17.4+dy,-.45+dz
        pts=[]
        for i in range(8):
            a=i*math.tau/8
            rr=r if i%2==0 else r*.17
            pts.append((yc+math.sin(a)*rr*.7,zc+math.cos(a)*rr))
        sidepoly('CDS | Southern Cross star',pts,s,gold,graphics,offset=.35,thick=.008)

# Bolt heads collected into a single mesh, avoiding hundreds of tiny scene objects.
boltverts=[]
boltfaces=[]
for s in [-1,1]:
    for y in [-16.3+i*1.8 for i in range(25)]:
        if y>27:continue
        for z in [-2.95,-1.16,.42]:
            center=Vector((s*(width(y)+.34),y,z))
            base=len(boltverts)
            for dx in [0,.022]:
                for i in range(6):
                    a=i*math.tau/6
                    boltverts.append(tuple(center+Vector((s*dx,math.cos(a)*.034,math.sin(a)*.034))))
            boltfaces.append(tuple(base+6+i for i in range(6)))
            boltfaces.extend((base+i,base+(i+1)%6,base+(i+1)%6+6,base+i+6) for i in range(6))
mesh('CDS | Captive titanium fasteners',boltverts,boltfaces,edge,details)

# Preview rig. All stage objects are separate from the exportable ship.
world=bpy.data.worlds.new('CDS / Deep orbital studio')
world.use_nodes=True
background=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND')
background.inputs[0].default_value=(.018,.026,.045,1)
background.inputs[1].default_value=.32
scene.world=world
def area(name,loc,power,color,size,target=(0,4,0),shape='DISK',size_y=None):
    data=bpy.data.lights.new(name,'AREA')
    data.energy=power
    data.color=color
    data.shape=shape
    data.size=size
    if size_y is not None:data.size_y=size_y
    ob=bpy.data.objects.new(name,data)
    stage.objects.link(ob)
    ob.location=loc
    ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
    return ob
area('CDS | Large cool key',(20,10,30),42000,(.72,.84,1),24,shape='RECTANGLE',size_y=40)
area('CDS | Warm solar rim',(-12,-16,20),56000,(1,.66,.37),18)
area('CDS | Side softbox',(28,2,5),18000,(.65,.78,1),20,shape='RECTANGLE',size_y=35)
area('CDS | Bow rim',(-10,31,9),20000,(.49,.73,1),14)
def camera(name,loc,target,lens=48,ortho=None):
    data=bpy.data.cameras.new(name)
    ob=bpy.data.objects.new(name,data)
    stage.objects.link(ob)
    ob.location=loc
    ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
    data.lens=lens
    if ortho:
        data.type='ORTHO'
        data.ortho_scale=ortho
    return ob
scene.camera=camera('CDS | Reference three quarter',(76,40,21),(0,5,.5),52)
camera('CDS | Port side elevation',(-75,5,4),(0,5,.4),ortho=57)
camera('CDS | Stern engineering',(38,-50,18),(0,-6,0),52)
scene.render.resolution_x=1600
scene.render.resolution_y=850
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=False
try:scene.render.engine='BLENDER_EEVEE'
except TypeError:pass
scene.render.filepath=str(OUT/'cruz-del-sur-exterior-preview.png')
scene.view_settings.view_transform='AgX'
for a in bpy.context.screen.areas:
    if a.type=='VIEW_3D':
        a.spaces.active.region_3d.view_distance=65
        a.spaces.active.region_3d.view_location=Vector((0,5,0))
        a.spaces.active.region_3d.view_rotation=scene.camera.rotation_euler.to_quaternion()
        a.spaces.active.shading.type='MATERIAL'
        a.spaces.active.overlay.show_overlays=False
root['reference']='User supplied Cruz del Sur orbital cruiser image; unseen views interpreted.'
root['scope']='Exterior only. Original bridge and previous exterior preserved, hidden.'
root['axis']='Blender Z up; bow +Y; stern -Y. Approx. 49.5 m long.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'cruz-del-sur-exterior.blend'))
print('EXTERIOR CREATED',len(root.all_objects),'objects')
print('SAVED',bpy.data.filepath)
