"""White racing shoe reference and four supplied photographs, derivative only."""
from pathlib import Path
from math import sin,cos,pi,sqrt,exp
import ast,bpy,json,hashlib,os
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/transition-master'
SOURCE=OUT/'transition-shelves-polished.blend';digest=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE));scene=bpy.context.scene
display=bpy.data.collections['08 Personal sport objects'];details=display;plants=display
def xyz(p):return Vector((p[0],-p[2],p[1]))
for file,names in [('build-transition-master.py',['box']),('detail-transition-shelves.py',['mat','mesh','tube'])]:
    tree=ast.parse((ROOT/'scripts/assets'/file).read_text())
    for name in names:
        node=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name==name);exec(compile(ast.Module(body=[node],type_ignores=[]),'helper','exec'))
shoe=bpy.data.objects['DISPLAY / Anatomical running shoe']
shoe.location.z=1.069  # Lowest rocker contact rests on the 1.073 m plinth top.
for o in list(shoe.children):bpy.data.objects.remove(o,do_unlink=True)
white=mat('Racing white woven upper',(.72,.73,.71),0,.83)
foam=mat('Racing expanded white foam',(.79,.78,.74),0,.88)
black=mat('Racing carbon separator',(.008,.012,.016),.05,.64)
coral=mat('Racing rear coral accent',(.85,.075,.055),0,.68)
lining=mat('Racing soft white collar',(.48,.49,.47),0,.92)
for m,scale,strength in [(white,410,.22),(foam,260,.14)]:
    n=m.node_tree.nodes;p=next(n for n in n if n.type=='BSDF_PRINCIPLED');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=scale;bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=strength;bump.inputs['Distance'].default_value=.00025;m.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
stripe=black.copy();stripe.name='Racing perforated black overlays';nodes=stripe.node_tree.nodes;links=stripe.node_tree.links
tex=nodes.new('ShaderNodeTexVoronoi');tex.inputs['Scale'].default_value=520;tex.inputs['Randomness'].default_value=.12
ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.08;ramp.color_ramp.elements[0].color=(.65,.66,.64,1);ramp.color_ramp.elements[1].position=.18;ramp.color_ramp.elements[1].color=(.008,.012,.016,1);links.new(tex.outputs['Distance'],ramp.inputs[0]);links.new(ramp.outputs['Color'],next(n for n in nodes if n.type=='BSDF_PRINCIPLED').inputs['Base Color'])
def P(x,l,h):return Vector((x,-l,h))
def sm(name,v,f,m):o=mesh('RACE / '+name,v,f,m,display);o.parent=shoe;return o
def st(name,pts,r,m):o=tube('RACE / '+name,pts,r,m,display);o.parent=shoe;return o
def width(l):return .048*max(0,1-((l-.005)/.155)**2)**.40*(1-.19*exp(-((l+.105)/.045)**2))
def solebottom(l):return .004+.024*(max(0,l-.055)/.105)**2+.006*(max(0,-l-.09)/.055)**2
def soletop(l):return .053+.016*(max(0,l-.07)/.09)**2-.005*exp(-((l-.04)/.06)**2)
def top(l):
    knots=[(-.15,.089),(-.125,.120),(-.09,.108),(-.045,.115),(0,.116),(.055,.099),(.115,.083),(.16,.072)]
    for (a,ha),(b,hb) in zip(knots,knots[1:]):
        if a<=l<=b:
            t=(l-a)/(b-a);t=t*t*(3-2*t);return ha+(hb-ha)*t
    return knots[0][1] if l<-.15 else knots[-1][1]
def upper(l,theta):return P(width(l)*cos(theta),l,soletop(l)+(top(l)-soletop(l))*sin(theta)**.72)
L=[-.15+i*.31/80 for i in range(81)]
for side in [1,-1]:
    verts=[]
    for l in L:
        opening=.72*sqrt(max(0,1-((l+.083)/.039)**2)) if -.122<l<-.044 else 0
        edge=pi/2-opening
        for j in range(25):verts.append(upper(l,edge*j/24 if side==1 else pi-edge*j/24))
    faces=[(i*25+j,(i+1)*25+j,(i+1)*25+j+1,i*25+j+1) for i in range(80) for j in range(24)]
    sm('Continuous low upper '+str(side),verts,faces,white)
    rim=[]
    for i in range(41):
        l=-.122+i*.078/40;edge=pi/2-.72*sqrt(max(0,1-((l+.083)/.039)**2));rim.append(upper(l,edge if side==1 else pi-edge))
    st('Integrated collar seam',rim,.0018,white)
    inside=[p+Vector((0,0,-.012)) for p in rim]
    sm('Collar inner lining',rim+inside,[(i,i+1,42+i,41+i) for i in range(40)],lining)
sm('Recessed inner footbed',[P(-.025,-.12,.073),P(.025,-.12,.073),P(.025,-.045,.073),P(-.025,-.045,.073)],[(0,1,2,3)],lining)
# Continuous closed foam rings: thick lower rocker, black separator, upper layer.
N=128
def outline(t):l=.005+.155*cos(t);return width(l)*(1 if sin(t)>=0 else -1),l
for name,levels,m in [('Lower rocker foam',[(0,.003),(.12,.006),(.52,.006)],foam),('Thin black separator',[(.52,.006),(.55,.006)],black),('Upper foam layer',[(.55,.006),(.88,.005),(1,.001)],foam)]:
    v=[]
    for fraction,extra in levels:
        for j in range(N):
            theta=j*2*pi/N;x,l=outline(theta);x+=extra*sin(theta);v.append(P(x,l,solebottom(l)+(soletop(l)-solebottom(l))*fraction))
    f=[(i*N+j,i*N+(j+1)%N,(i+1)*N+(j+1)%N,(i+1)*N+j) for i in range(len(levels)-1) for j in range(N)];f.extend([tuple(reversed(range(N))),tuple((len(levels)-1)*N+j for j in range(N))]);sm(name,v,f,m)
# Three surface-conforming black bands per side, with visible microperforation.
for side in [1,-1]:
    for k in range(3):
        v=[]
        for row in range(17):
            q=row/16;theta=.10+q*1.08
            for u in [0,1]:
                l=-.065+k*.053+q*.038+u*.025;p=upper(l,theta if side==1 else pi-theta);p.x+=side*.00055;p.z+=.0005;v.append(p)
        sm('Slanted perforated band',v,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(16)],stripe)
# White textile tongue and laces, following the actual dorsal surface.
v=[]
for i in range(17):
    l=-.045+i*.11/16
    for x in [-.017,0,.017]:v.append(P(x,l,top(l)+.002-abs(x)*.12))
sm('White stitched tongue',v,[(i*3+j,i*3+j+1,(i+1)*3+j+1,(i+1)*3+j) for i in range(16) for j in range(2)],white)
for i in range(6):
    l=-.031+i*.015
    for side in [-1,1]:
        a=P(side*.019,l,top(l)+.002);b=P(-side*.019,l+.01,top(l+.01)+.002);mid=(a+b)*.5+Vector((0,0,.003));st('Crossed white lace',[a,mid,b],.00125,white)
        st('White eyelet', [a+Vector((.0024*cos(t*2*pi/16),.0024*sin(t*2*pi/16),0)) for t in range(17)],.00055,lining)
for side in [-1,1]:
    v=[]
    for row in range(13):
        fraction=.59+row*.39/12
        extra=.006 if fraction<=.88 else .005-(fraction-.88)/.12*.004
        for column in range(9):
            l=-.143+column*.017/8+(fraction-.59)*.010
            v.append(P(side*(width(l)+extra+.001),l,solebottom(l)+(soletop(l)-solebottom(l))*fraction))
    sm('Coral heel wedge',v,[(i*9+j,i*9+j+1,(i+1)*9+j+1,(i+1)*9+j) for i in range(12) for j in range(8)],coral)

# Replace illustrative placeholders with all four originals, no crop or distortion.
for o in list(scene.objects):
    if o.name.startswith('PHOTO / '):bpy.data.objects.remove(o,do_unlink=True)
bronze=bpy.data.materials['TRANSITION / Anodized warm edge'];graphite=bpy.data.materials['TRANSITION / Graphite painted alloy']
photo_report=[]
for index,y,z in [(1,1.805,4.00),(2,1.805,4.42),(3,1.055,4.00),(4,1.055,4.42)]:
    path=ROOT/'public/photos/personal'/f'{index}.jpg';photo_hash=hashlib.sha256(path.read_bytes()).hexdigest()
    image=bpy.data.images.load(str(path),check_existing=False);original=list(image.size);ratio=original[0]/original[1]
    if max(original)>1600:image.scale(round(original[0]*1600/max(original)),round(original[1]*1600/max(original)))
    image.pack();m=mat('Personal photograph '+str(index),(1,1,1),0,.75);p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
    width_photo=min(.30,.32*ratio);height=width_photo/ratio;x=1.73
    box('PHOTO / Personal backing '+str(index),(x,y+height/2,z),(.028,height+.02,width_photo+.02),graphite,display,.005)
    face=mesh('PHOTO / Personal image '+str(index),[xyz((x-.016,y,z-width_photo/2)),xyz((x-.016,y,z+width_photo/2)),xyz((x-.016,y+height,z+width_photo/2)),xyz((x-.016,y+height,z-width_photo/2))],[(0,1,2,3)],m,display)
    uv=face.data.uv_layers.new(name='Full photo aspect preserved')
    for loop,coord in zip(uv.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=coord
    for zz in [z-width_photo/2-.005,z+width_photo/2+.005]:box('PHOTO / Personal bevel frame',(x-.023,y+height/2,zz),(.019,height+.028,.012),bronze,display,.003)
    for yy in [y-.005,y+height+.005]:box('PHOTO / Personal bevel frame',(x-.023,yy,z),(.019,.012,width_photo+.028),bronze,display,.003)
    box('PHOTO / Personal frame foot',(x,y+.003,z),(.14,.016,width_photo*.68),graphite,display,.003)
    assert hashlib.sha256(path.read_bytes()).hexdigest()==photo_hash
    photo_report.append({'file':str(path.relative_to(ROOT)),'SHA256':photo_hash,'originalPixels':original,'packedPixels':list(image.size),'physicalWidth':width_photo,'physicalHeight':height,'cropped':False})
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();vertices=[];faces=[];triangles=0
for o in scene.objects:
    if o.type not in {'MESH','CURVE','FONT'} or any(c.name.startswith(('90 ','98 ','99 ')) for c in o.users_collection):continue
    ev=o.evaluated_get(deps);data=ev.to_mesh();data.calc_loop_triangles();triangles+=len(data.loop_triangles);start=len(vertices);vertices.extend(o.matrix_world@v.co for v in data.vertices);faces.extend(tuple(start+i for i in p.vertices) for p in data.polygons);ev.to_mesh_clear()
bvh=BVHTree.FromPolygons(vertices,faces)
for x in [-1.33,-.7,0,.7,1.33]:
    for y in [.1,.45,.75,1.25,1.7,2.0]:assert bvh.ray_cast(xyz((x,y,1.8)),Vector((0,-1,0)),3.5)[0] is None,(x,y)
for x in [-.7,0,.7]:assert bvh.ray_cast(xyz((x,2.5,1.8)),Vector((0,-1,0)),3.5)[0] is None
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==digest
compile(Path(__file__).read_text(),__file__,'exec')
report={'source':SOURCE.name,'sourceSHA256':digest,'sourceUnchanged':True,'photos':photo_report,'photosOriginalsUnchanged':True,'clearanceRaysPassed':33,'evaluatedTriangles':triangles,'runtimeChanged':False,'render':{'engine':'BLENDER_EEVEE','resolution':[1280,800],'samples':32,'threads':2},'browserPerformanceMeasured':False}
(OUT/'shelves-personal-photos.json').write_text(json.dumps(report,indent=2)+'\n')
camera=bpy.data.objects['Player toward panorama'];scene.camera=camera;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.threads_mode='FIXED';scene.render.threads=2;scene.eevee.taa_render_samples=32
camera.location=xyz((0,1.7,1.15));camera.rotation_euler=(xyz((0,1.42,4))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=16
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'transition-shelves-personal-photos.blend'))
for name,eye,target,lens in [('overview',(0,1.7,1.15),(0,1.42,4),16),('shoe',(-1.0,1.40,2.57),(-1.72,1.15,2.83),55),('photos',(.05,1.68,4.20),(1.73,1.63,4.21),28)]:
    if os.getenv('REFERENCE_RENDER_VIEWS') and name not in os.environ['REFERENCE_RENDER_VIEWS'].split(','):continue
    camera.location=xyz(eye);camera.rotation_euler=(xyz(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=lens;scene.render.filepath=str(OUT/('shelves-personal-photos-'+name+'.png'));bpy.ops.render.render(write_still=True)
print('REFERENCE_SHOE_PHOTOS_READY',json.dumps(report))



