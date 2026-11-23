"""Derive polished personal shelf props without modifying the curated master."""
from pathlib import Path
from math import sin, cos, pi, exp, sqrt
import ast, bpy, hashlib, json, os
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/assets/transition-master'
SOURCE=OUT/'transition-shelves-curated.blend'
digest=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
scene=bpy.context.scene
display=bpy.data.collections['08 Personal sport objects']; plants=display
def xyz(p): return Vector((p[0],-p[2],p[1]))
tree=ast.parse((ROOT/'scripts/assets/detail-transition-shelves.py').read_text())
for name in ['mat','mesh','tube']:
    node=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name==name)
    exec(compile(ast.Module(body=[node],type_ignores=[]),'prop-helper','exec'))
def line(root,name,points,radius,material):
    o=tube(name,points,radius,material,display);o.parent=root;return o

# Keep the knit topology and real opening, but lower the ankle and sculpt a rocker.
shoe=bpy.data.objects['DISPLAY / Anatomical running shoe']
def running_profile(p):
    x,y,z=p;length=-y
    if z>.036:z=.036+(z-.036)*(.68-.18*exp(-((length-.025)/.075)**2))
    z+=.010*(max(0,length-.075)/.09)**2
    if z<.022:z+=.008*exp(-((length+.018)/.038)**2)*(1-z/.03)
    if z<.037:x*=1-.10*exp(-((length+.015)/.04)**2)
    return Vector((x,y,z))
bpy.context.view_layer.update()
for o in shoe.children:
    if o.type not in {'MESH','CURVE'}:continue
    transform=shoe.matrix_world.inverted()@o.matrix_world;inverse=transform.inverted()
    if o.type=='MESH':
        for v in o.data.vertices:v.co=inverse@running_profile(transform@v.co)
    else:
        for spline in o.data.splines:
            for p in spline.points:p.co=(*(inverse@running_profile(transform@Vector(p.co[:3]))),1)

# Rebuild only racket children in its existing diagonal root coordinate system.
racket=bpy.data.objects['DISPLAY / Diagonal tennis racket']
for o in list(racket.children):bpy.data.objects.remove(o,do_unlink=True)
carbon=mat('Racket satin graphite',(.022,.028,.034),.25,.43)
paint=mat('Racket vermilion paint',(.40,.065,.024),.15,.42)
string=mat('Racket woven string',(.43,.46,.40),0,.72)
grip=mat('Racket elastomer grip',(.022,.026,.025),0,.9)
for depth in [-.0025,.0025]:
    line(racket,'RACKET / Thin structural hoop',[Vector((depth,.091*sin(t*2*pi/96),.38+.128*cos(t*2*pi/96))) for t in range(97)],.0032,carbon)
line(racket,'RACKET / Painted hoop accent',[Vector((-.005,.091*sin(t*2*pi/96),.38+.128*cos(t*2*pi/96))) for t in range(97)],.00085,paint)
for sign in [-1,1]:
    line(racket,'RACKET / Open Y throat',[Vector((0,sign*.050,.274)),Vector((0,sign*.032,.228)),Vector((0,sign*.013,.178)),Vector((0,sign*.008,.151))],.0035,carbon)
line(racket,'RACKET / Throat bridge',[Vector((0,-.049,.275)),Vector((0,0,.269)),Vector((0,.049,.275))],.0028,paint)
line(racket,'RACKET / Grip core',[Vector((0,0,0)),Vector((0,0,.171))],.009,grip)
line(racket,'RACKET / Spiral grip wrap',[Vector((.0092*cos(i*2*pi/16),.0092*sin(i*2*pi/16),.004+i*.163/192)) for i in range(193)],.0011,grip)
for axis,count in [('y',13),('z',17)]:
    for i in range(1,count):
        f=-1+2*i/count
        if axis=='y':a=Vector((0,.087*f,.38-.123*sqrt(1-f*f)));b=Vector((0,.087*f,.38+.123*sqrt(1-f*f)))
        else:a=Vector((.0005,-.087*sqrt(1-f*f),.38+.123*f));b=Vector((.0005,.087*sqrt(1-f*f),.38+.123*f))
        line(racket,'RACKET / Tensioned string',[a,b],.00043,string)
        for p in [a,b]:
            line(racket,'RACKET / String grommet',[p+Vector((-.002,0,0)),p+Vector((.002,0,0))],.0012,grip)

# Preserve pots and soil. Replace straight chains with connected organic foliage.
greens=[bpy.data.materials['SHELVES / Botanical leaf '+str(i)] for i in range(4)]
stemmat=bpy.data.materials['SHELVES / Living stems'];veinmat=bpy.data.materials['SHELVES / Leaf midrib']
def leaf(root,name,base,direction,length,width,index):
    forward=Vector(direction).normalized();side=forward.cross(Vector((0,0,1))).normalized()
    if side.length<.1:side=Vector((0,1,0))
    normal=side.cross(forward).normalized();base=Vector(base)
    def point(t,u):
        w=width*.5*sin(pi*t)**.63*(1.25-.45*t)*(1+.10*u)
        heart=-.014*abs(u)**1.4*exp(-((t-.18)/.18)**2)
        return base+forward*(length*t+heart)+side*(w*u)+normal*(.014*sin(pi*t)-.008*u*u*sin(pi*t))+Vector((0,0,-.025*t*t))
    verts=[point(j/16,-1+2*k/8) for j in range(17) for k in range(9)]
    faces=[(j*9+k,j*9+k+1,(j+1)*9+k+1,(j+1)*9+k) for j in range(16) for k in range(8)]
    o=mesh(name,verts,faces,greens[index%4],display);o.parent=root
    solid=o.modifiers.new('Fine leaf lamina','SOLIDIFY');solid.thickness=.00035
    line(root,name+' midrib',[point(i/20,0)+normal*.0006 for i in range(21)],.00043,veinmat)
    for t in [.25,.42,.59,.74]:
        for sign in [-1,1]:line(root,name+' secondary vein',[point(t,0)+normal*.0005,point(t+.08,sign*.75)+normal*.0005],.00018,veinmat)
for name in ['DISPLAY / Compact plant','DISPLAY / Trailing plant']:
    root=bpy.data.objects[name]
    for o in list(root.children):
        if not any(word in o.name.lower() for word in ['ceramic pot','saucer','substrate']):bpy.data.objects.remove(o,do_unlink=True)
compact=bpy.data.objects['DISPLAY / Compact plant'];compact.location=xyz((-1.70,1.055,3.98))
for i in range(13):
    a=i*2.399;radius=.035+.045*(i%3)/2
    base=Vector((radius*cos(a),radius*sin(a),.24+.07*(i%4)/3))
    start=Vector((.01*cos(a),.01*sin(a),.14));control=Vector((base.x*.5,base.y*.5,base.z+.015))
    line(compact,'COMPACT / Arched petiole',[(1-t)**2*start+2*(1-t)*t*control+t*t*base for t in [j/16 for j in range(17)]],.0015,stemmat)
    leaf(compact,'COMPACT / Heart leaf '+str(i),base,(.35*cos(a),sin(a),-.3+.4*(i%3)),.12+.025*(i%3),.075+.008*(i%3),i)
trailing=bpy.data.objects['DISPLAY / Trailing plant']
for branch in range(3):
    sign=(-1 if branch==0 else 1);spread=[-.075,.07,.015][branch];depth=[.48,.37,.22][branch]
    pts=[]
    for j in range(41):
        t=j/40
        if t<.3:
            q=t/.3;p=Vector((.20*q,spread*q,.16+.12*sin(q*pi/2)))
        else:
            q=(t-.3)/.7;p=Vector((.20+.025*sin(q*5+branch),spread+.045*sin(q*5)*sign,.28-(.28+depth)*q))
        pts.append(p)
    line(trailing,'TRAILING / Curved living vine '+str(branch),pts,.0018,stemmat)
    for k,j in enumerate([13,18,24,30,37]):
        p=pts[j];end=p+Vector((.015,(-1)**k*.016,.007))
        line(trailing,'TRAILING / Joined petiole',[p,end],.0011,stemmat)
        leaf(trailing,'TRAILING / Heart leaf '+str(branch)+' '+str(k),end,(.3,(-1)**k*.65,-.65),.105+.012*((k+branch)%3),.068+.006*(k%2),k+branch)
for i in range(4):
    a=i*1.8;base=Vector((.035*cos(a),.045*sin(a),.23))
    line(trailing,'TRAILING / Crown petiole',[Vector((0,0,.16)),base],.0015,stemmat)
    leaf(trailing,'TRAILING / Crown leaf '+str(i),base,(.3*cos(a),sin(a),.2),.12,.075,i)

# Group the books against the beginning of their bay, with original typography.
for o in list(scene.objects):
    if o.name.startswith('BOOK / Spine label'):bpy.data.objects.remove(o,do_unlink=True)
    elif o.name.startswith('BOOK / '):o.location.y+=.31 if 'Horizontal' in o.name else .25
ink=mat('Book warm typography',(.65,.61,.48),.05,.67)
for title,z,h,size in [('Clean Code',2.56,.34,.021),('The Pragmatic Programmer',2.65,.39,.017),('Design Patterns',2.74,.31,.018)]:
    data=bpy.data.curves.new(title,'FONT');data.body=title;data.size=size;data.align_x='CENTER';data.align_y='CENTER';data.extrude=.00008;data.materials.append(ink)
    o=bpy.data.objects.new('BOOK / Title '+title,data);display.objects.link(o);o.location=xyz((1.606,1.055+h*.5,z));o.rotation_euler=(0,-pi/2,0)
data=bpy.data.curves.new('Refactoring','FONT');data.body='Refactoring';data.size=.023;data.align_x='CENTER';data.align_y='CENTER';data.materials.append(ink)
o=bpy.data.objects.new('BOOK / Title Refactoring',data);display.objects.link(o);o.location=xyz((1.611,1.857,2.68));o.rotation_euler=Matrix(((0,-1,0),(0,0,1),(-1,0,0))).transposed().to_euler()

# Reproducible authoring audit; this is not a browser performance measurement.
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();verts=[];faces=[];triangles=0
for o in scene.objects:
    if o.type not in {'MESH','CURVE','FONT'} or any(c.name.startswith(('90 ','98 ','99 ')) for c in o.users_collection):continue
    ev=o.evaluated_get(deps);data=ev.to_mesh();data.calc_loop_triangles();triangles+=len(data.loop_triangles);offset=len(verts)
    verts.extend(o.matrix_world@v.co for v in data.vertices);faces.extend(tuple(offset+i for i in p.vertices) for p in data.polygons);ev.to_mesh_clear()
bvh=BVHTree.FromPolygons(verts,faces)
for x in [-1.33,-.7,0,.7,1.33]:
    for y in [.1,.45,.75,1.25,1.7,2.0]:assert bvh.ray_cast(xyz((x,y,1.8)),Vector((0,-1,0)),3.5)[0] is None,(x,y)
for x in [-.7,0,.7]:assert bvh.ray_cast(xyz((x,2.5,1.8)),Vector((0,-1,0)),3.5)[0] is None
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==digest
report={'source':SOURCE.name,'sourceSHA256':digest,'sourceUnchanged':True,'runtimeChanged':False,'passageRaysClear':33,'evaluatedTriangles':triangles,'foliageLeaves':32,'bookTitles':['Clean Code','The Pragmatic Programmer','Design Patterns','Refactoring'],'illustrationsAreNotPersonalPhotos':True,'render':{'engine':'BLENDER_EEVEE','resolution':[1280,800],'samples':32,'threads':2},'browserPerformanceMeasured':False}
(OUT/'shelves-polished.json').write_text(json.dumps(report,indent=2)+'\n')
camera=bpy.data.objects['Player toward panorama'];scene.camera=camera;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.threads_mode='FIXED';scene.render.threads=2
scene.eevee.taa_render_samples=32
camera.location=xyz((0,1.7,1.15));camera.rotation_euler=(xyz((0,1.42,4))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=16
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'transition-shelves-polished.blend'))
for name,eye,target,lens in [('overview',(0,1.7,1.15),(0,1.42,4),16),('shoe',(-1.0,1.42,2.57),(-1.72,1.14,2.83),55),('sports',(.75,1.70,2.95),(-1.72,1.57,2.97),30),('plants',(-.20,1.68,4.18),(-1.70,1.58,4.21),32),('books',(.1,1.57,3.12),(1.73,1.52,2.68),34)]:
    if os.getenv('PROP_RENDER_VIEWS') and name not in os.environ['PROP_RENDER_VIEWS'].split(','):continue
    camera.location=xyz(eye);camera.rotation_euler=(xyz(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=lens;scene.render.filepath=str(OUT/('shelves-polished-'+name+'.png'));bpy.ops.render.render(write_still=True)
print('POLISHED_READY',json.dumps(report))

