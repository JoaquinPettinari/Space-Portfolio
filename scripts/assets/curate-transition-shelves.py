"""Four themed modules and a rebuilt continuous running shoe."""
from pathlib import Path
from math import sin,cos,pi,sqrt,radians,exp
import bpy,ast,json,hashlib
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/transition-master';SOURCE=OUT/'transition-shelves-personal.blend';digest=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE));scene=bpy.context.scene;scene.name='TRANSITION / Curated personal modules'
details=bpy.data.collections['05 Fasteners seals and labels'];display=bpy.data.collections['08 Personal sport objects'];plants=display
def xyz(p):return Vector((p[0],-p[2],p[1]))
for file,names in [('build-transition-master.py',['box','beam']),('detail-transition-shelves.py',['mat','mesh','tube'])]:
    tree=ast.parse((ROOT/'scripts/assets'/file).read_text())
    for name in names:
        node=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name==name);exec(compile(ast.Module(body=[node],type_ignores=[]),'curation-helper','exec'))
steel=bpy.data.materials['TRANSITION / Brushed titanium'];rubber=bpy.data.materials['TRANSITION / Recessed pressure seals'];graphite=bpy.data.materials['TRANSITION / Graphite painted alloy'];bronze=bpy.data.materials['TRANSITION / Anodized warm edge']
navy=mat('Curated woven midnight',(.028,.055,.068),0,.88);coral=mat('Curated textile coral',(.43,.075,.030),0,.76);foam=mat('Curated running foam',(.53,.52,.46),0,.78);lining=mat('Curated dark lining',(.012,.017,.019),0,.94);thread=mat('Curated warm thread',(.39,.40,.35),0,.9);paper=mat('Curated book paper',(.61,.57,.46),0,.92);olive=mat('Curated cloth binding',(.12,.16,.09),0,.86)
for m in [navy,coral,lining,foam,olive]:
    nodes=m.node_tree.nodes;p=next(n for n in nodes if n.type=='BSDF_PRINCIPLED');noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=430 if m==navy else 190
    bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.23 if m==navy else .12;bump.inputs['Distance'].default_value=.00022;m.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])

def make_shoe_knit(base):
    m=base.copy();m.name='SHELVES / Curated shoe local knit';nodes=m.node_tree.nodes;links=m.node_tree.links
    for node in list(nodes):
        if node.type not in {'BSDF_PRINCIPLED','OUTPUT_MATERIAL'}:nodes.remove(node)
    p=next(n for n in nodes if n.type=='BSDF_PRINCIPLED');coord=nodes.new('ShaderNodeTexCoord');waves=[]
    for direction in ['X','Y']:
        wave=nodes.new('ShaderNodeTexWave');wave.wave_type='BANDS';wave.bands_direction=direction;wave.inputs['Scale'].default_value=220;wave.inputs['Distortion'].default_value=.18;links.new(coord.outputs['Object'],wave.inputs['Vector']);waves.append(wave)
    weave=nodes.new('ShaderNodeMath');weave.operation='MULTIPLY';links.new(waves[0].outputs['Fac'],weave.inputs[0]);links.new(waves[1].outputs['Fac'],weave.inputs[1])
    ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.018,.030,.039,1);ramp.color_ramp.elements[1].color=(.058,.080,.093,1);links.new(weave.outputs[0],ramp.inputs[0]);links.new(ramp.outputs['Color'],p.inputs['Base Color'])
    bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.40;bump.inputs['Distance'].default_value=.00065;links.new(weave.outputs[0],bump.inputs['Height']);links.new(bump.outputs['Normal'],p.inputs['Normal'])
    rough=nodes.new('ShaderNodeMapRange');rough.inputs['To Min'].default_value=.78;rough.inputs['To Max'].default_value=.95;links.new(weave.outputs[0],rough.inputs['Value']);links.new(rough.outputs['Result'],p.inputs['Roughness'])
    return m

def group(name,prefixes,pivot):
    root=bpy.data.objects.new(name,None);display.objects.link(root);root.location=xyz(pivot)
    bpy.context.view_layer.update()
    for o in list(scene.objects):
        if o is root or not o.name.startswith(prefixes):continue
        world=o.matrix_world.copy();o.parent=root;o.matrix_world=world
    return root
for o in list(scene.objects):
    if o.name.startswith(('Running shoe','Shoe ','Padded shoe collar','Segmented running sole','Heel fabric','Continuous midsole','Mountain frame','Layered mountain','Mountain pale','Racket display cradle')):bpy.data.objects.remove(o,do_unlink=True)
medal=group('DISPLAY / Running medal',('Running medal','Medal ','Folded medal'),(-1.73,1.055,4.56));medal.location=xyz((-1.73,1.055,3.25))
emblem=group('DISPLAY / Triathlon emblem',('Decorative triathlon','Triathlon '),(1.72,1.805,4.23));emblem.location=xyz((-1.72,1.805,2.68));emblem.rotation_euler.z=pi
racket=group('DISPLAY / Diagonal tennis racket',('Tennis ','Racket '),(1.69,1.10,2.97));racket.location=xyz((-1.69,1.85,3.11));racket.rotation_euler=(radians(-20),0,pi)
box('Diagonal racket grounded cradle',(-1.72,1.828,3.11),(.17,.045,.17),graphite,display,.008)
compact=group('DISPLAY / Compact plant',('COMPACT',),(1.74,1.805,2.99));compact.location=xyz((-1.74,1.055,3.98))
trailing=group('DISPLAY / Trailing plant',('TRAILING',),(-1.73,1.805,4.24));trailing.location=xyz((-1.73,1.805,4.42))
# Move foliage-only preview lights with their specimens.
for name,p,target in [('Compact foliage wash',(-1.55,1.65,3.98),(-1.74,1.34,3.98)),('Trailing foliage wash',(-1.55,2.37,4.42),(-1.65,1.75,4.42))]:
    o=bpy.data.objects.get(name)
    if o:o.location=xyz(p);o.rotation_euler=(xyz(target)-o.location).to_track_quat('-Z','Y').to_euler()

# New shoe topology: a continuous annulus from sole outline to ankle opening.
shoe=bpy.data.objects.new('DISPLAY / Anatomical running shoe',None);display.objects.link(shoe);shoe.location=xyz((-1.72,1.083,2.83))
def P(x,l,h):return Vector((x,-l,h))
def shoe_mesh(name,vertices,faces,material):
    o=mesh(name,vertices,faces,material,display);o.parent=shoe;return o
def shoe_tube(name,points,radius,material):
    o=tube(name,points,radius,material,display);o.parent=shoe;return o
N=64
def foot(theta,expand=0):
    length=.010+.155*cos(theta);width=.046+.007*exp(-((length-.055)/.07)**2)-.007*exp(-((length+.12)/.05)**2)
    return (width+expand)*sin(theta),length
def surface(t,theta):
    x,l=foot(theta);cx=.033*sin(theta);cl=-.091+.038*cos(theta)
    return P(x*(1-t)+cx*t,l*(1-t)+cl*t,.036*(1-t)+.116*t+.006*sin(pi*t))
vertices=[surface(i/12,j*2*pi/N) for i in range(13) for j in range(N)]
faces=[(i*N+j,i*N+(j+1)%N,(i+1)*N+(j+1)%N,(i+1)*N+j) for i in range(12) for j in range(N)]
shoe_mesh('RUNNING / Continuous mesh upper',vertices,faces,make_shoe_knit(navy))
# Collar padding shares the upper edge and rolls inward into a genuine cavity.
profiles=[(.033,.038,.116),(.034,.039,.120),(.031,.036,.125),(.027,.032,.123),(.025,.030,.116),(.024,.029,.077)]
vertices=[P(rx*sin(j*2*pi/N),-.091+rl*cos(j*2*pi/N),h) for rx,rl,h in profiles for j in range(N)]
faces=[(i*N+j,i*N+(j+1)%N,(i+1)*N+(j+1)%N,(i+1)*N+j) for i in range(len(profiles)-1) for j in range(N)]
shoe_mesh('RUNNING / Integrated padded collar',vertices,faces,lining)
shoe_mesh('RUNNING / Interior footbed',[P(0,-.091,.076)]+[P(.024*sin(j*2*pi/N),-.091+.029*cos(j*2*pi/N),.076) for j in range(N)],[(0,j+1,(j+1)%N+1) for j in range(N)],lining)
# Rockered continuous foam sole, with a separate thin outsole and tread blocks.
sole_foam=foam.copy();sole_foam.name='SHELVES / Curated matte running foam';next(n for n in sole_foam.node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Roughness'].default_value=.92
for name,levels,material in [('Foam midsole',[(.005,.010),(.008,.014),(.007,.030),(.003,.037)],sole_foam),('Rubber outsole',[(.004,.005),(.008,.009),(.005,.012)],rubber)]:
    vertices=[]
    for expansion,h in levels:
        for j in range(N):
            theta=j*2*pi/N;x,l=foot(theta,expansion);rocker=.007*max(0,cos(theta))**3+.003*max(0,-cos(theta))**3;vertices.append(P(x,l,h+rocker))
    faces=[(i*N+j,i*N+(j+1)%N,(i+1)*N+(j+1)%N,(i+1)*N+j) for i in range(len(levels)-1) for j in range(N)]
    faces.extend([tuple(reversed(range(N))),tuple((len(levels)-1)*N+j for j in range(N))]);shoe_mesh('RUNNING / '+name,vertices,faces,material)
for i in range(10):
    for side in [-1,1]:
        o=box('RUNNING / Segmented rubber lug',(0,0,0),(.035,.007,.017),rubber,display,.002);o.parent=shoe;o.location=P(side*.025,-.115+i*.025,.005)
# Tongue follows the actual top of the surface, terminating at the collar.
def top_at(length,x=0):
    t=max(0,min(1,(.165-length)/.218));p=surface(t,0);p.x=x;p.z-=abs(x)*.12;return p
tongue=[]
for i in range(9):
    length=-.052+i*.014
    for x in [-.019,0,.019]:p=top_at(length,x);p.z+=.0015;tongue.append(p)
shoe_mesh('RUNNING / Sewn tongue',tongue,[(i*3+j,i*3+j+1,(i+1)*3+j+1,(i+1)*3+j) for i in range(8) for j in range(2)],coral)
for side in [-1,1]:
    seam=[top_at(-.052+i*.014,side*.020)+Vector((0,0,.002)) for i in range(9)];shoe_tube('RUNNING / Tongue stitched seam',seam,.0006,thread)
    # Thin bonded side panel and perimeter stitch, replacing thick rods.
    panel=[surface(t,theta)+Vector((side*.0007,0,0)) for t,theta in [(.16,side*pi/2),(.60,side*pi/2),(.73,side*.72),(.31,side*.72)]]
    shoe_mesh('RUNNING / Bonded quarter panel',panel,[(0,1,2,3)],coral)
    shoe_tube('RUNNING / Quarter perimeter seam',panel+[panel[0]],.0005,thread)
for i in range(6):
    length=-.035+i*.016
    for side in [-1,1]:
        center=top_at(length,side*.020)+Vector((0,0,.0025));circle=[center+Vector((.0028*cos(j*2*pi/16),.0028*sin(j*2*pi/16),0)) for j in range(17)];shoe_tube('RUNNING / Eyelet rim',circle,.00065,lining)
        end=top_at(length+.012,-side*.020)+Vector((0,0,.003));mid=top_at(length+.006,0)+Vector((0,0,.005));shoe_tube('RUNNING / Crossed woven lace',[center,mid,end],.0011,foam)
# Small connected textile pull tab, not a floating collar or separate hoop.
shoe_tube('RUNNING / Heel pull loop',[P(-.007,-.129,.109),P(-.007,-.139,.128),P(.007,-.139,.128),P(.007,-.129,.109)],.0018,coral)
box('Running shoe quiet plinth',(-1.72,1.064,2.83),(.15,.018,.36),graphite,display,.006)

# Medal finish: satin brass microstructure, fine recessed-looking mint line,
# fabric ribbon with thin edge stitching. No invented race/result/date.
for o in medal.children:
    if o.type=='MESH' and o.name.startswith('Running medal'):
        for slot in o.material_slots:
            m=slot.material.copy();slot.material=m;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Roughness'].default_value=.46
            noise=m.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=650;bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.10;bump.inputs['Distance'].default_value=.00006;m.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
    if o.type=='MESH' and o.name.startswith('Folded medal'):
        material=coral;o.data.materials.clear();o.data.materials.append(material)
        for offset in [0,1]:
            points=[o.matrix_world@o.data.vertices[i].co for i in range(offset,len(o.data.vertices),2)];stitched=tube('Medal ribbon selvedge',points,.00045,thread,display)
            world=stitched.matrix_world.copy();stitched.parent=medal;stitched.matrix_world=world

# Book module: cloth covers, inset paper blocks, visible page edges and spines.
def book(z,height,width,material):
    x=1.73;y=1.055
    box('BOOK / Paper block',(x,y+height/2,z),(.18,height-.018,width-.010),paper,display,.003)
    for zz in [z-width/2,z+width/2]:box('BOOK / Cloth cover',(x,y+height/2,zz),(.205,height,.005),material,display,.003)
    box('BOOK / Rounded bound spine',(1.625,y+height/2,z),(.014,height,width+.003),material,display,.006)
    for yy in [y+.035,y+height-.035]:box('BOOK / Spine tooling',(1.615,yy,z),(.004,.005,width*.72),bronze,display,.001)
    for i in range(12):box('BOOK / Page edge',(1.825,y+.02+i*(height-.04)/11,z),(.002,.001,width-.014),thread,display,.0001)
    # Embedded vertical label, not an invented personal title or author.
    box('BOOK / Spine label',(1.613,y+height*.60,z),(.004,.045,width*.62),paper,display,.001)
for args in [(2.81,.34,.070,navy),(2.90,.39,.065,olive),(2.99,.31,.080,coral)]:book(*args)
box('BOOK / Horizontal pages',(1.73,1.857,2.99),(.19,.095,.30),paper,display,.003)
for y in [1.808,1.907]:box('BOOK / Horizontal cover',(1.73,y,2.99),(.21,.005,.32),navy,display,.004)
box('BOOK / Horizontal spine',(1.622,1.857,2.99),(.012,.105,.32),navy,display,.004)
for i in range(10):box('BOOK / Horizontal page line',(1.83,1.815+i*.008,2.99),(.002,.0008,.29),thread,display,.0001)

# Original, intentionally illustrative placeholders. No people or attribution
# to the user's actual photographs; generated locally and packed in the blend.
def landscape(name,trail=False):
    W,H=512,384;pixels=[]
    for j in range(H):
        v=j/(H-1)
        for i in range(W):
            u=i/(W-1);grain=.012*sin(i*1.77+j*2.47)
            color=(.33+.35*v,.40+.22*v,.44+.09*v)
            sun=((u-.78)**2+(v-.78)**2)<.055**2
            if sun:color=(.91,.76,.45)
            ridge=.43+.16*sin(u*8)**2+.12*sin(u*15+.8)**2
            if v<ridge:color=(.16+u*.06,.24+u*.04,.29+u*.03)
            if ridge-.045<v<ridge and ridge>.63:color=(.60,.65,.63)
            near=.23+.12*sin(u*9+1)**2+.10*sin(u*17)**2
            if v<near:color=(.11,.18,.15) if trail else (.12,.17,.20)
            if trail:
                path=.51+.15*sin(v*11);width=.13*(1-v)**2
                if v<.36 and abs(u-path)<width:color=(.47,.36,.22)
                for tx,ty in [(.12,.25),(.20,.31),(.83,.24),(.92,.30)]:
                    if ty-.18<v<ty and abs(u-tx)<(ty-v)*.24:color=(.055,.105,.070)
            pixels.extend([max(0,min(1,c+grain)) for c in color]+[1])
    image=bpy.data.images.new(name,width=W,height=H);image.pixels.foreach_set(pixels);image.filepath_raw=str(OUT/(name+'.png'));image.file_format='PNG';image.save();image.pack()
    m=mat(name+' print',(1,1,1),0,.72);nodes=m.node_tree.nodes;p=next(n for n in nodes if n.type=='BSDF_PRINCIPLED');tex=nodes.new('ShaderNodeTexImage');tex.image=image;m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);return m
for name,y,width,height,trail in [('placeholder-mountain-landscape',1.055,.46,.32,False),('placeholder-trekking-landscape',1.805,.40,.29,True)]:
    z=4.24;x=1.73;image_material=landscape(name,trail)
    box('PHOTO / Backing '+name,(x,y+height/2,z),(.032,height,width),graphite,display,.006)
    face=mesh('PHOTO / Original illustrative print '+name,[xyz((x-.018,y+.012,z-width/2+.012)),xyz((x-.018,y+.012,z+width/2-.012)),xyz((x-.018,y+height-.012,z+width/2-.012)),xyz((x-.018,y+height-.012,z-width/2+.012))],[(0,1,2,3)],image_material,display)
    uv=face.data.uv_layers.new(name='Print UV')
    for loop,coord in zip(uv.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=coord
    for zz in [z-width/2,z+width/2]:box('PHOTO / Beveled frame rail',(x-.026,y+height/2,zz),(.025,height+.025,.016),bronze,display,.004)
    for yy in [y,y+height]:box('PHOTO / Beveled frame rail',(x-.026,yy,z),(.025,.016,width+.025),bronze,display,.004)
    box('PHOTO / Grounded frame foot',(x,y+.004,z),(.15,.018,width*.65),graphite,display,.004)

# Validate clear corridor and source preservation after arranging the modules.
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();vertices=[];faces=[];triangles=0
for o in scene.objects:
    if o.type not in {'MESH','CURVE'} or any(c.name.startswith(('90 ','98 ','99 ')) for c in o.users_collection):continue
    ev=o.evaluated_get(deps);data=ev.to_mesh();data.calc_loop_triangles();triangles+=len(data.loop_triangles);start=len(vertices);vertices.extend(o.matrix_world@v.co for v in data.vertices);faces.extend(tuple(start+i for i in p.vertices) for p in data.polygons);ev.to_mesh_clear()
tree=BVHTree.FromPolygons(vertices,faces);checks=[]
for x in [-1.33,-.7,0,.7,1.33]:
    for y in [.1,.45,.75,1.25,1.7,2.0]:
        hit=tree.ray_cast(xyz((x,y,1.8)),Vector((0,-1,0)),3.5);assert hit[0] is None,('Passage blocked',x,y,hit);checks.append({'x':x,'height':y,'clear':True})
for x in [-.7,0,.7]:assert tree.ray_cast(xyz((x,2.5,1.8)),Vector((0,-1,0)),3.5)[0] is None
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==digest
report={'source':SOURCE.name,'sourceSHA256':digest,'sourceUnchanged':True,'runtimeChanged':False,'themes':{'portForward':'sports','portAft':'plants','starboardForward':'books','starboardAft':'illustrative landscape placeholders'},'imagesAreNotUserPhotos':True,'racketAngleDegrees':20,'clearanceRays':checks,'headroomClear':True,'evaluatedTriangles':triangles,'renderEngine':'BLENDER_EEVEE','samples':32,'resolution':[1280,800],'threads':2,'gpuTimingMeasured':False}
(OUT/'shelves-curated.json').write_text(json.dumps(report,indent=2)+'\n')
camera=bpy.data.objects['Player toward panorama'];camera.location=xyz((0,1.7,1.15));camera.rotation_euler=(xyz((0,1.42,4))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=16;scene.camera=camera;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.threads_mode='FIXED';scene.render.threads=2
if hasattr(scene,'eevee') and hasattr(scene.eevee,'taa_render_samples'):scene.eevee.taa_render_samples=32
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'transition-shelves-curated.blend'))
for name,eye,target,lens in [('shelves-curated-overview',(0,1.7,1.15),(0,1.42,4),16),('shelves-curated-sports',(.75,1.70,2.95),(-1.72,1.57,2.97),30),('shelves-curated-shoe',(-1.0,1.42,2.57),(-1.72,1.15,2.83),55),('shelves-curated-books-photos',(-1.1,1.7,3.3),(1.73,1.5,3.6),20)]:
    camera.location=xyz(eye);camera.rotation_euler=(xyz(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=lens;scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
print('CURATED_VARIANT_READY',json.dumps(report))
