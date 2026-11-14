"""Second modeling pass, following visual review of the new exterior."""
import bpy
import math
import random
from mathutils import Vector, Matrix
from pathlib import Path

source_path=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio\scripts\assets\build-reference-starship-live.py')
src=source_path.read_text(encoding='utf-8')
# Reuse geometry definitions without executing the scene-building section.
ns={'bpy':bpy,'math':math,'random':random,'Vector':Vector,'Matrix':Matrix}
import bmesh
ns['bmesh']=bmesh
for key,name in [('hull','CDS 01 / Continuous hull'),('armor','CDS 02 / Armor and structural rails'),('windows','CDS 03 / Windows and running lights'),('bridge','CDS 04 / Exterior bridge shell'),('engineering','CDS 05 / Engines and cooling'),('details','CDS 06 / Service details'),('graphics','CDS 07 / Livery and identification')]:
    ns[key]=bpy.data.collections[name]
for key,name in [('graphite','Ceramic graphite'),('plate','Titanium armor'),('darkplate','Dark armor'),('edge','Machined edges'),('black','Deep recess'),('teal','Petrol livery'),('gold','Ivory markings'),('glass','Smoked sapphire glazing'),('warm','Warm interior light'),('white','Warm white strip'),('cyan','Ion cyan'),('amber','Amber navigation')]:
    ns[key]=bpy.data.materials['CDS / '+name]
exec(src[src.index('def mesh('):src.index('sections=[(-18.3')],ns)
exec(src[src.index('def width('):src.index('for s in [-1,1]:')],ns)
sections=[(-18.3,5.65,-3.05,.65),(-16,6.8,-3.75,.9),(-7,7.2,-4.05,.85),(1,7.05,-4,.65),(9,6.7,-3.8,.75),(22,6.15,-3.05,.85),(27.5,4.9,-2.15,.65),(30,4.2,-1.25,.35)]
ns['sections']=sections
mesh,box,beam,form,sidepoly,sidebox=[ns[k] for k in ['mesh','box','beam','form','sidepoly','sidebox']]
armor,windows,bridge,engineering,details,graphics=[ns[k] for k in ['armor','windows','bridge','engineering','details','graphics']]
graphite,plate,darkplate,edge,black,teal,gold,glass,warm,white,cyan,amber=[ns[k] for k in ['graphite','plate','darkplate','edge','black','teal','gold','glass','warm','white','cyan','amber']]

# Correct the exterior lettering basis (proper rotation, outward normal).
for o in graphics.objects:
    if o.type=='FONT':
        s=1 if o.location.x>0 else -1
        o.rotation_euler=Matrix(((0,0,s),(s,0,0),(0,1,0))).to_euler()
        if 'C R U Z' in o.data.body or 'EXPLORATION VESSEL' in o.data.body:
            o.location.x=s*7.37
        else:o.location.x+=s*.17

# Toning and better-separated alloy finishes.
for mat,factor in [(plate,.48),(graphite,.55),(darkplate,.65)]:
    p=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Roughness'].default_value=.4
    for n in mat.node_tree.nodes:
        if n.type=='VALTORGB':
            for el in n.color_ramp.elements:
                c=el.color[:]
                el.color=(c[0]*factor,c[1]*factor,c[2]*factor,1)
    mat.diffuse_color=tuple(v*factor for v in mat.diffuse_color[:3])+(1,)

def flatpanel(name,s,coords,x,mat,col=armor,depth=.1):
    verts=[(s*(x+d),y,z) for d in [0,depth] for y,z in coords]
    n=len(coords)
    return mesh(name,verts,[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],mat,col,.035)

for s in [-1,1]:
    # Registration on a purpose-built faceted slab, uninterrupted by ribs.
    flatpanel('CDS | Raised registration surround',s,[(2.7,-.94),(6,-1.24),(16.6,-1.05),(19.1,.1),(7.3,.25),(5.3,.55),(3.4,.48)],7.15,plate,depth=.12)
    flatpanel('CDS | Registration dark field',s,[(5.5,-.85),(7,-1.03),(16.45,-.85),(18.15,-.12),(7.3,-.04),(5.5,.25),(4.5,.22)],7.29,darkplate,depth=.025)
    flatpanel('CDS | Registry border petrol',s,[(5.3,-.9),(6.8,-1.16),(16.7,-.98),(18.5,-.17),(18.2,-.17),(16.5,-.88),(7,-1.02),(5.5,-.77)],7.33,teal,graphics,.015)
    # A stepped upper shoulder provides the layered silhouette of the reference.
    for a,b,z in [(-16,-11,1.35),(-10.7,-5.7,1.65),(10,15,1),(15.3,20.4,1.1),(20.7,25,1.05)]:
        w=ns['width']((a+b)/2)
        v=[(s*(w-.7),a,z),(s*(w-.7),b,z),(s*(w+.08),b,z-.65),(s*(w+.08),a,z-.65),
           (s*(w-.7),a,z-.18),(s*(w-.7),b,z-.18),(s*(w+.08),b,z-.83),(s*(w+.08),a,z-.83)]
        mesh('CDS | Angled shoulder armor',v,[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],graphite,armor,.045)
        sidebox('CDS | Upper shoulder dark reveal',(a+b)/2,z-.65,b-a-.7,.15,s,black,windows,offset=.14,depth=.06)
        sidebox('CDS | Upper shoulder light',(a+b)/2,z-.65,b-a-1.4,.035,s,cyan if a in [-16,15.3] else warm,windows,offset=.21,depth=.01)
        for yy in [a+.3,b-.3]:
            sidebox('CDS | Shoulder reinforcement cleat',yy,z-.55,.24,.4,s,plate,armor,offset=.23,depth=.12)
    # Recessed lower belt with sparse amber markers, inset technical blocks.
    for a,b in [(-16,-12),(-11.5,-6),(8,13),(19,23.5)]:
        sidebox('CDS | Hull service trench',(a+b)/2,-2.42,b-a,.34,s,black,engineering,offset=.34,depth=.05)
        for j in range(int((b-a)/.5)):
            y=a+.25+j*.5
            sidebox('CDS | Service trench connector',y,-2.43,.19,.15,s,edge if j%3 else graphite,engineering,offset=.41,depth=.06)
        sidebox('CDS | Trench amber telltale',(a+b)/2,-2.25,.58,.025,s,amber,windows,offset=.44,depth=.012)
    # Forebody observation visor: raised top/bottom brows and angled side braces.
    for z in [-.32,-1.17]:
        sidepoly('CDS | Bow observation armored brow',[(21.2,z),(27.2,z+.06),(27.65,z+.21),(21.5,z+.19)],s,darkplate,armor,offset=.52,thick=.14)
    sidepoly('CDS | Bow swept visor jamb',[(26.6,-1.24),(27,-1.24),(28,-.08),(27.5,-.04)],s,plate,armor,offset=.49,thick=.12)
    # Fine diagonal panel cuts break up the big empty faces.
    for y in [-13.3,-8.2,1.1,11.5,20.8]:
        sidepoly('CDS | Angled armor engraved joint',[(y,-3.15),(y+.06,-3.15),(y+.65,-2.65),(y+.59,-2.65)],s,black,details,offset=.28,thick=.012)
    # Small thruster service pods near the stern flank.
    sidepoly('CDS | Lateral maneuvering pod', [(-17.9,-2.7),(-15.2,-2.7),(-14.9,-2.35),(-15.2,-1.95),(-17.9,-1.95),(-18.1,-2.2)],s,graphite,engineering,offset=.6,thick=.25)
    for y in [-17.35,-16.6,-15.85]:
        sidebox('CDS | RCS recessed port',y,-2.32,.3,.22,s,black,engineering,offset=.88,depth=.025)
        sidebox('CDS | RCS throat glint',y,-2.32,.12,.08,s,cyan,windows,offset=.91,depth=.01)

# New upper window frames with larger dark panes and less uniform lighting.
for s in [-1,1]:
    for y in [-2.1,-.3,1.5]:
        box('CDS | Bridge external panoramic reveal',(s*5.1,y,2.65),(.06,1.48,.72),glass,bridge,.045)
        box('CDS | Bridge low warm reflection',(s*5.137,y,2.33),(.012,1.1,.035),warm,bridge,.006)
        box('CDS | Bridge upper light reflector',(s*5.137,y,2.97),(.012,.85,.035),white,bridge,.006)
    # Optical windows on the overhanging roof facia.
    for y in [-1.8,-.1,1.6,3.1]:
        box('CDS | Upper flight deck dark aperture',(s*5.42,y,3.78),(.04,1.18,.16),black,bridge,.025)
        box('CDS | Upper flight deck warm aperture',(s*5.446,y,3.78),(.01,.45,.035),warm,bridge,.004)

# Roof plating and longitudinal sensor rails.
for s in [-1,1]:
    box('CDS | Bridge roof perimeter rail',(s*4.4,.1,4.22),(.11,5.5,.12),graphite,bridge,.03)
    for y in [-2.2,-.3,1.6,3.4]:
        box('CDS | Bridge roof armor cassette',(s*2.8,y,4.2),(1.7,1.55,.065),graphite,bridge,.11)
        box('CDS | Roof cassette inner seam',(s*2.8,y,4.24),(1.43,1.3,.012),darkplate,details,.08)
    for y in [-12,-8,15,22]:
        z=2.25 if y<0 else 1.6
        box('CDS | Deck equipment plinth',(s*5,y,z),(.62,1.65,.28),graphite,details,.09)
        box('CDS | Deck equipment optical face',(s*5,y+.8,z+.04),(.4,.03,.1),glass,details,.015)

# Camera closer to the reference's long, low port-side view.
cam=bpy.data.objects['CDS | Reference three quarter']
cam.location=(-80,29,16)
cam.rotation_euler=(Vector((0,5,.2))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.lens=54
for name,factor in [('CDS | Large cool key',.62),('CDS | Side softbox',.7),('CDS | Warm solar rim',.72)]:
    bpy.data.objects[name].data.energy*=factor
# Add port-facing soft fill for this presentation angle.
data=bpy.data.lights.new('CDS | Port-side long softbox','AREA')
data.energy=18000
data.color=(.73,.83,1)
data.shape='RECTANGLE'
data.size=14
data.size_y=38
o=bpy.data.objects.new(data.name,data)
bpy.data.collections['CDS PREVIEW / Cameras and lighting - no export'].objects.link(o)
o.location=(-25,8,14)
o.rotation_euler=(Vector((0,5,0))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.context.scene.camera=cam
bpy.ops.wm.save_as_mainfile(filepath=str(source_path.parents[2]/'docs/assets/cruz-del-sur-exterior/cruz-del-sur-exterior.blend'))
print('REFINEMENT SAVED')
