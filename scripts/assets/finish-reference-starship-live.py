"""Final exterior detailing and isolated orbital presentation setup."""
import bpy
import bmesh
import math
import random
from pathlib import Path
from mathutils import Vector, Matrix

source_path=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio\scripts\assets\build-reference-starship-live.py')
src=source_path.read_text(encoding='utf-8')
ns={'bpy':bpy,'bmesh':bmesh,'math':math,'random':random,'Vector':Vector,'Matrix':Matrix}
for key,name in [('hull','CDS 01 / Continuous hull'),('armor','CDS 02 / Armor and structural rails'),('windows','CDS 03 / Windows and running lights'),('bridge','CDS 04 / Exterior bridge shell'),('engineering','CDS 05 / Engines and cooling'),('details','CDS 06 / Service details'),('graphics','CDS 07 / Livery and identification')]:
    ns[key]=bpy.data.collections[name]
for key,name in [('graphite','Ceramic graphite'),('plate','Titanium armor'),('darkplate','Dark armor'),('edge','Machined edges'),('black','Deep recess'),('teal','Petrol livery'),('gold','Ivory markings'),('glass','Smoked sapphire glazing'),('warm','Warm interior light'),('white','Warm white strip'),('cyan','Ion cyan'),('amber','Amber navigation')]:
    ns[key]=bpy.data.materials['CDS / '+name]
exec(src[src.index('def mesh('):src.index('sections=[(-18.3')],ns)
exec(src[src.index('def width('):src.index('for s in [-1,1]:')],ns)
exec(src[src.index('def cylinder('):src.index('# Aft engine cassettes:')],ns)
ns['sections']=[(-18.3,5.65,-3.05,.65),(-16,6.8,-3.75,.9),(-7,7.2,-4.05,.85),(1,7.05,-4,.65),(9,6.7,-3.8,.75),(22,6.15,-3.05,.85),(27.5,4.9,-2.15,.65),(30,4.2,-1.25,.35)]
mesh,box,beam,form,sidepoly,sidebox,cylinder=[ns[k] for k in ['mesh','box','beam','form','sidepoly','sidebox','cylinder']]
armor,windows,bridge,engineering,details,graphics=[ns[k] for k in ['armor','windows','bridge','engineering','details','graphics']]
graphite,plate,darkplate,edge,black,teal,gold,glass,warm,white,cyan,amber=[ns[k] for k in ['graphite','plate','darkplate','edge','black','teal','gold','glass','warm','white','cyan','amber']]

def floor_at(y):
    sections=ns['sections']
    for a,b in zip(sections,sections[1:]):
        if a[0]<=y<=b[0]:return a[2]+(b[2]-a[2])*(y-a[0])/(b[0]-a[0])
    return -3

# Lift lower exterior fittings with the upswept bow instead of leaving free rails.
for o in armor.objects:
    if o.type=='MESH' and any(k in o.name for k in ['Longitudinal armored rail','Rail polished lip','Swept transverse hull rib','Lower chamfered armor cassette']):
        for v in o.data.vertices:
            v.co.z=max(v.co.z,floor_at(v.co.y)+.18)
for o in graphics.objects:
    if 'Southern Cross star' in o.name:
        s=1 if o.data.vertices[0].co.x>0 else -1
        for v in o.data.vertices:v.co.x=s*7.385
    if o.type=='FONT' and 'C R U Z' in o.data.body:
        o.data.size=.6
        o.location.z=-.64

# Warm glazed exterior panes: preserve the user's hidden modeled interior.
pane=bpy.data.materials.new('CDS / Warm smoked observation glass')
pane.use_nodes=True
p=next(n for n in pane.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs['Base Color'].default_value=(.028,.022,.016,1)
p.inputs['Metallic'].default_value=.46
p.inputs['Roughness'].default_value=.21
p.inputs['Emission Color'].default_value=(.4,.16,.045,1)
p.inputs['Emission Strength'].default_value=.22
pane.diffuse_color=(.07,.045,.025,1)
for o in bridge.objects:
    if 'external panoramic reveal' in o.name:
        o.data.materials.clear()
        o.data.materials.append(pane)

for s in [-1,1]:
    # Angled fore-quarter bridge glazing and sturdy visor mullions.
    spans=[((s*5.15,2.85),(s*4.72,6.1),1.92,3.18),((s*4.72,6.1),(s*2.44,8.85),1.8,2.93)]
    for (ax,ay),(bx,by),lo,hi in spans:
        A,B=Vector((ax,ay,lo)),Vector((bx,by,lo-.08))
        for j in range(4):
            u0=j/4+.025
            u1=(j+1)/4-.025
            a=A.lerp(B,u0)
            b=A.lerp(B,u1)
            at=a+Vector((-.15*s,0,hi-lo))
            bt=b+Vector((-.15*s,0,hi-lo-.08))
            mesh('CDS | Faceted forward bridge pane',[tuple(a),tuple(b),tuple(bt),tuple(at)],[(0,1,2,3)],pane,bridge)
            beam('CDS | Visor structural mullion',a,at,.11,graphite,bridge)
            beam('CDS | Warm bridge interior sill',a+Vector((.018*s,0,.12)),b+Vector((.018*s,0,.12)),.04,warm,bridge)
            beam('CDS | Bridge ceiling reflection',at+Vector((.02*s,0,-.13)),bt+Vector((.02*s,0,-.13)),.028,white,bridge)
            # Exterior-visible silhouettes of instrument binnacles.
            mid=a.lerp(b,.5)
            box('CDS | Window interior instrument silhouette',tuple(mid+Vector((.03*s,0,.18))),(.035,.28,.13),black,bridge,.012)
    for y in [-2.15,-.35,1.45]:
        for j in range(5):
            yy=y-.5+j*.25
            box('CDS | Bridge warm interior glimmer',(s*5.143,yy,2.44),(.01,.12,.095),warm,bridge,.005)
            box('CDS | Bridge workstation silhouette',(s*5.16,yy+.04,2.4),(.02,.07,.15),black,bridge,.005)
    # Discrete forward roof panels, matching its faceted contour.
    for yy,w,z in [(4,3.75,4.02),(5.55,3.2,3.91),(7,2.5,3.7)]:
        box('CDS | Forward bridge roof segment',(s*w*.45,yy,z),(w*.72,1.1,.045),graphite,bridge,.1)
        box('CDS | Roof forward seam',(s*w*.45,yy,z+.026),(w*.63,.025,.012),edge,details,.004)

# Emergency docking hatch, circular attachment ring and recessed access ladders.
for s in [-1,1]:
    y=-4.6
    x=s*(ns['width'](y)+.62)
    cylinder('CDS | Lateral docking collar',(x,y,-2),.66,.18,graphite,engineering,(s,0,0),24)
    cylinder('CDS | Docking collar inner rim',(x+s*.11,y,-2),.52,.055,edge,engineering,(s,0,0),24)
    cylinder('CDS | Docking pressure hatch',(x+s*.15,y,-2),.45,.06,darkplate,engineering,(s,0,0),24)
    for i in range(8):
        a=i*math.tau/8
        cylinder('CDS | Docking ring keeper',(x+s*.2,y+math.cos(a)*.56,-2+math.sin(a)*.56),.045,.045,gold,details,(s,0,0),8)
    for j in range(5):
        sidebox('CDS | Recessed maintenance step',-5.65,-2.95+j*.28,.36,.055,s,edge,details,offset=.54,depth=.08)
    # Armor breaks and cooling conduits in the aft quarter.
    for y in [-16.7,-12.2]:
        xx=s*(ns['width'](y)+.43)
        for zz in [-.5,-.72]:
            beam('CDS | Exposed coolant hardline',(xx,y,zz),(xx,y+2.5,zz),.065,edge,engineering)
        for yy in [y+.2,y+1.2,y+2.2]:
            box('CDS | Hardline support clamp',(xx+s*.03,yy,-.61),(.13,.09,.42),darkplate,details,.02)

# A ventral hull has its own armor and service ribs, readable from below.
for y,w,z in [(-14,4.6,-3.65),(-9,4.9,-4.13),(-3.5,4.9,-4.18),(2,4.7,-4.12),(7,4.5,-4),(12,4.1,-3.65),(17,3.8,-3.34),(22,3.4,-3.08)]:
    box('CDS | Ventral armor cassette',(0,y,z),(w*1.7,4.5,.18),darkplate,armor,.12)
    for s in [-1,1]:
        box('CDS | Ventral service rail',(s*w*.72,y,z-.14),(.2,4.3,.13),graphite,armor,.035)
        box('CDS | Ventral service marking',(s*w*.65,y,z-.22),(.04,.65,.015),gold,graphics,.005)

# Orbital preview is optional staging, never part of the ship asset.
stage=bpy.data.collections['CDS PREVIEW / Cameras and lighting - no export']
environment=bpy.data.collections.new('CDS PREVIEW / Procedural planet and stars - no export')
stage.children.link(environment)
def sphere(name,loc,radius,mat):
    bm=bmesh.new()
    bmesh.ops.create_uvsphere(bm,u_segments=96,v_segments=48,radius=radius)
    me=bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob=bpy.data.objects.new(name,me)
    environment.objects.link(ob)
    ob.location=loc
    me.materials.append(mat)
    for f in me.polygons:f.use_smooth=True
    return ob

planet=bpy.data.materials.new('CDS PREVIEW / Procedural ocean and cloud bands')
planet.use_nodes=True
n=planet.node_tree.nodes
l=planet.node_tree.links
n.clear()
out=n.new('ShaderNodeOutputMaterial')
p=n.new('ShaderNodeBsdfPrincipled')
p.inputs['Roughness'].default_value=.85
p.inputs['Emission Strength'].default_value=.28
l.new(p.outputs[0],out.inputs['Surface'])
coord=n.new('ShaderNodeTexCoord')
mapping=n.new('ShaderNodeVectorMath')
mapping.operation='MULTIPLY'
mapping.inputs[1].default_value=(2,2,5)
l.new(coord.outputs['Generated'],mapping.inputs[0])
noise=n.new('ShaderNodeTexNoise')
noise.inputs['Scale'].default_value=7
noise.inputs['Detail'].default_value=5
noise.inputs['Roughness'].default_value=.7
noise.inputs['Distortion'].default_value=1.5
l.new(mapping.outputs[0],noise.inputs['Vector'])
ramp=n.new('ShaderNodeValToRGB')
ramp.color_ramp.elements.remove(ramp.color_ramp.elements[1])
for i,(pos,color) in enumerate([(.25,(.012,.029,.055,1)),(.46,(.035,.09,.15,1)),(.55,(.17,.24,.28,1)),(.62,(.49,.52,.52,1)),(.72,(.85,.81,.71,1))]):
    e=ramp.color_ramp.elements[0] if i==0 else ramp.color_ramp.elements.new(pos)
    e.position=pos
    e.color=color
l.new(noise.outputs['Fac'],ramp.inputs[0])
l.new(ramp.outputs[0],p.inputs['Base Color'])
l.new(ramp.outputs[0],p.inputs['Emission Color'])
bump=n.new('ShaderNodeBump')
bump.inputs['Strength'].default_value=.18
bump.inputs['Distance'].default_value=.12
l.new(noise.outputs['Fac'],bump.inputs['Height'])
l.new(bump.outputs[0],p.inputs['Normal'])
globe=sphere('CDS PREVIEW | Planet',(120,-23,-99),112,planet)

# Thin opaque limb shell via Fresnel mixing, with transparent interior.
atm=bpy.data.materials.new('CDS PREVIEW / Blue atmospheric limb')
atm.use_nodes=True
n=atm.node_tree.nodes
l=atm.node_tree.links
n.clear()
out=n.new('ShaderNodeOutputMaterial')
trans=n.new('ShaderNodeBsdfTransparent')
emit=n.new('ShaderNodeEmission')
emit.inputs[0].default_value=(.12,.42,.8,1)
emit.inputs[1].default_value=.6
fres=n.new('ShaderNodeLayerWeight')
fres.inputs['Blend'].default_value=.3
ramp=n.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].position=.65
ramp.color_ramp.elements[1].position=.98
mix=n.new('ShaderNodeMixShader')
l.new(fres.outputs['Facing'],ramp.inputs[0])
l.new(ramp.outputs[0],mix.inputs[0])
l.new(trans.outputs[0],mix.inputs[1])
l.new(emit.outputs[0],mix.inputs[2])
l.new(mix.outputs[0],out.inputs[0])
sphere('CDS PREVIEW | Atmospheric limb',(120,-23,-99),112.4,atm)

star_mat=bpy.data.materials.new('CDS PREVIEW / Distant starlight')
star_mat.use_nodes=True
n=star_mat.node_tree.nodes
p=next(n for n in n if n.type=='BSDF_PRINCIPLED')
p.inputs['Base Color'].default_value=(.5,.65,1,1)
p.inputs['Emission Color'].default_value=(.52,.68,1,1)
p.inputs['Emission Strength'].default_value=2
random.seed(715)
verts=[]
faces=[]
for i in range(650):
    x=270
    y=random.uniform(-170,170)
    z=random.uniform(-100,170)
    r=random.choice([.025,.035,.045,.075])
    j=len(verts)
    verts.extend([(x,y-r,z-r),(x,y+r,z-r),(x,y+r,z+r),(x,y-r,z+r)])
    faces.append((j,j+1,j+2,j+3))
mesh('CDS PREVIEW | Starfield',verts,faces,star_mat,environment)

scene=bpy.context.scene
scene.camera=bpy.data.objects['CDS | Reference three quarter']
scene.camera.data.lens=59
scene.render.resolution_x=1800
scene.render.resolution_y=1000
scene.render.resolution_percentage=100
scene.render.filepath=str(source_path.parents[2]/'docs/assets/cruz-del-sur-exterior/cruz-del-sur-hero.png')
for a in bpy.context.screen.areas:
    if a.type=='VIEW_3D':
        a.spaces.active.region_3d.view_perspective='CAMERA'
        a.spaces.active.shading.type='MATERIAL'
        a.spaces.active.shading.use_scene_world=True
        a.spaces.active.shading.use_scene_lights=True
# Preview metadata, not an assertion that the web asset has been optimized.
root=bpy.data.collections['CRUZ DEL SUR / REFERENCE EXTERIOR']
root['web_status']='Detailed editable source. GLB conversion and GPU profiling not performed.'
bpy.ops.wm.save_as_mainfile(filepath=str(source_path.parents[2]/'docs/assets/cruz-del-sur-exterior/cruz-del-sur-exterior.blend'))
print('FINAL DETAIL PASS SAVED')
