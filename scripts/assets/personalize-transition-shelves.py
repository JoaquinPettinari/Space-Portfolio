"""Personal running/mountain/tennis display from the preserved live snapshot."""
from pathlib import Path
from math import sin,cos,pi,sqrt
import bpy,ast,json,hashlib,sys
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/transition-master'
SOURCE=OUT/'transition-shelves-personal-input.blend';digest=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE));scene=bpy.context.scene;scene.name='TRANSITION / Personal outdoor and running display'
details=bpy.data.collections['05 Fasteners seals and labels'];niches=bpy.data.collections['04 Recessed shelves and equipment'];preview=bpy.data.collections['90 PREVIEW cameras and lighting']
display=bpy.data.collections.new('08 Personal sport objects');scene.collection.children.link(display);display['runtime_export']=True
def xyz(p):return Vector((p[0],-p[2],p[1]))
helpers=ast.parse((ROOT/'scripts/assets/build-transition-master.py').read_text())
for name in ['box','beam']:
    node=next(n for n in helpers.body if isinstance(n,ast.FunctionDef) and n.name==name);exec(compile(ast.Module(body=[node],type_ignores=[]),'personal-helper','exec'))
botanical=ast.parse((ROOT/'scripts/assets/detail-transition-shelves.py').read_text())
plants=display
for name in ['mat','mesh','tube','lathe']:
    node=next(n for n in botanical.body if isinstance(n,ast.FunctionDef) and n.name==name);exec(compile(ast.Module(body=[node],type_ignores=[]),'personal-helper','exec'))
steel=bpy.data.materials['TRANSITION / Brushed titanium'];rubber=bpy.data.materials['TRANSITION / Recessed pressure seals'];graphite=bpy.data.materials['TRANSITION / Graphite painted alloy'];bronze=bpy.data.materials['TRANSITION / Anodized warm edge']
ivory=mat('Sport textile ivory',(.54,.54,.48),0,.86);orange=mat('Running safety coral',(.65,.13,.035),0,.62);navy=mat('Technical navy fabric',(.025,.055,.08),0,.88);red=mat('Triathlon enamel red',(.57,.025,.025),.28,.32);gold=mat('Medal satin brass',(.46,.29,.075),.82,.30);slate=mat('Mountain dark slate',(.075,.11,.13),.12,.85);rock=mat('Mountain grey stone',(.20,.26,.27),.12,.79);snow=mat('Mountain pale ridge',(.49,.52,.48),0,.84)
# Fine textile structure, without making cloth behave like coated plastic.
for m in [ivory,navy,orange]:
    nodes=m.node_tree.nodes;links=m.node_tree.links;p=next(n for n in nodes if n.type=='BSDF_PRINCIPLED');noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=300;bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.16;bump.inputs['Distance'].default_value=.00025;links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],p.inputs['Normal'])

remove=('Module compact equipment','Equipment rubber band','Equipment latch','Equipment carry grip','Case inset face','Case face fixing','Case small identity plaque','Case inset ventilation','Field spectrometer','Portable survey analyzer','Sample tray','Sample capsule','Optical mount','Optical support','Optical head','Optical objective')
for o in list(scene.objects):
    if o.name.startswith(remove):bpy.data.objects.remove(o,do_unlink=True)

# More aggressive lower knee: raise the diagonal and push its foot forward,
# keeping thin light inserts behind X=1.34 and preserving rear attachment.
for o in scene.objects:
    if o.type!='MESH' or not o.name.startswith(('CENTRAL COLUMN','Column ')):continue
    o.data=o.data.copy();inverse=o.matrix_world.inverted()
    for v in o.data.vertices:
        p=o.matrix_world@v.co;y=p.z
        blend=1 if y<=.56 else max(0,1-(y-.56)/.23)
        push=.09 if o.name.startswith(('Column recessed status','Column warm status')) else .105
        factor=max(0,min(1,(2.01-abs(p.x))/.15));p.x=(1 if p.x>0 else -1)*(abs(p.x)-push*blend*factor)
        if y<=.56:p.z=y*.70/.56
        elif y<=.79:p.z=.70+(y-.56)*.24/.23
        elif y<1.1:p.z=.94+(y-.79)*.16/.31
        v.co=inverse@p

# Running shoe: side-on within the shallow shelf, toe along longitudinal Z.
shoe_center=xyz((-1.72,1.075,2.97))
def shoe_point(x,length,height):return shoe_center+Vector((x,-length,height))
sections=[(-.145,.029,.075),(-.115,.045,.110),(-.06,.044,.080),(0,.049,.064),(.065,.056,.047),(.12,.047,.037),(.155,.018,.024)]
verts=[];rings=20
for length,width,height in sections:
    for j in range(rings):
        angle=2*pi*j/rings;verts.append(shoe_point(width*cos(angle),length,.025+max(-.010,height*sin(angle))))
faces=[]
for i in range(len(sections)-1):
    for j in range(rings):
        a=i*rings+j;b=i*rings+(j+1)%rings;faces.append((a,b,b+rings,a+rings))
faces.extend([tuple(reversed(range(rings))),tuple((len(sections)-1)*rings+j for j in range(rings))])
shoe=mesh('Running shoe breathable upper',verts,faces,navy,display);sub=shoe.modifiers.new('Upper smooth textile shape','SUBSURF');sub.levels=2;sub.render_levels=2
for side in [-1,1]:
    points=[shoe_point(side*w,l,.023) for l,w,h in sections]
    tube('Shoe midsole sculpted edge',points,.014,ivory,display)
    tube('Shoe outsole rubber edge',[p-Vector((0,0,.012)) for p in points],.005,rubber,display)
    for i in range(1,6):
        l,w,h=sections[i];tube('Shoe side reinforcement',[shoe_point(side*w,l-.018,.035),shoe_point(side*(w-.012),l+.01,.025+h*.68)],.003,orange,display)
for i in range(12):
    l=-.13+i*.024;w=.036 if l<-.06 else .047
    o=box('Segmented running sole',(-1.72,1.079,2.97+l),(w*2,.010,.017),rubber,display,.003)
# Visible heel counter/collar, tongue and six crossed laces.
collar=[shoe_point(.027*cos(a),-.095+.025*sin(a),.128+.004*cos(a)) for a in [j*2*pi/32 for j in range(33)]]
tube('Padded shoe collar',collar,.007,ivory,display)
mesh('Shoe collar dark interior',[shoe_point(0,-.095,.126)]+[shoe_point(.024*cos(j*2*pi/32),-.095+.022*sin(j*2*pi/32),.126) for j in range(32)],[(0,i+1,(i+1)%32+1) for i in range(32)],rubber,display)
def upper_height(x,length):
    for (a,wa,ha),(b,wb,hb) in zip(sections,sections[1:]):
        if a<=length<=b:
            t=(length-a)/(b-a);w=wa+(wb-wa)*t;h=ha+(hb-ha)*t
            return .025+h*sqrt(max(0,1-(x/w)**2))
    return .09
tongue=[]
for i in range(5):
    l=-.065+i*.0275
    for x in [-.024,0,.024]:tongue.append(shoe_point(x,l,upper_height(x,l)+.001))
mesh('Running shoe raised tongue',tongue,[(i*3+j,i*3+j+1,(i+1)*3+j+1,(i+1)*3+j) for i in range(4) for j in range(2)],orange,display)
for i in range(6):
    l=-.055+i*.017
    for sign in [-1,1]:tube('Running shoe crossed lace',[shoe_point(sign*.020,l,upper_height(.020,l)+.003),shoe_point(0,l+.008,upper_height(0,l+.008)+.005),shoe_point(-sign*.020,l+.014,upper_height(.020,l+.014)+.003)],.0016,ivory,display)
tube('Heel fabric pull loop',[shoe_point(-.009,-.140,.108),shoe_point(-.009,-.147,.134),shoe_point(.009,-.147,.134),shoe_point(.009,-.140,.108)],.0025,orange,display)
for length,width,direction in [(-.145,.029,-1),(.155,.018,1)]:
    tube('Continuous midsole end',[shoe_point(-width,length,.023),shoe_point(0,length+direction*.008,.023),shoe_point(width,length,.023)],.014,ivory,display)
box('Shoe display plinth',(-1.72,1.064,2.97),(.16,.018,.37),graphite,display,.008)

# Small framed mountain relief: actual layered silhouettes, not an invented race.
def mountain_frame(side,z,y):
    x=side*1.73
    box('Mountain frame backing',(x,y+.16,z),(.045,.32,.47),rubber,display,.008)
    for zz in [z-.245,z+.245]:box('Mountain frame side',(x-side*.028,y+.16,zz),(.025,.35,.018),bronze,display,.004)
    for yy in [y-.005,y+.325]:box('Mountain frame edge',(x-side*.028,yy,z),(.025,.018,.50),bronze,display,.004)
    profiles=[([(-.23,.02),(-.23,.10),(-.15,.20),(-.09,.14),(0,.29),(.08,.19),(.15,.25),(.23,.12),(.23,.02)],slate),([(-.23,.02),(-.23,.07),(-.11,.18),(-.03,.10),(.07,.23),(.16,.14),(.23,.17),(.23,.02)],rock)]
    for i,(profile,m) in enumerate(profiles):mesh('Layered mountain silhouette',[xyz((x-side*(.026+i*.012),y+h,z+zz)) for zz,h in profile],[tuple(range(len(profile)))],m,display)
    mesh('Mountain pale summit',[xyz((x-side*.040,y+h,z+zz)) for zz,h in [(-.04,.233),(0,.29),(.035,.246),(.010,.257),(-.013,.246)]],[(0,1,2,3,4)],snow,display)
    box('Mountain frame resting foot',(x,y-.004,z),(.13,.018,.27),graphite,display,.004)
mountain_frame(-1,2.97,1.812)

# Medal and folded ribbon on a physical display stand. No event, result or date.
medal_center=xyz((-1.67,1.235,4.24));normal=Vector((1,0,0));radius=.065
bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=radius,depth=.009,location=medal_center);medal=bpy.context.object;medal.name='Running medal blank brass';medal.rotation_euler.y=pi/2
for c in list(medal.users_collection):c.objects.unlink(medal)
display.objects.link(medal);medal.data.materials.append(gold)
bevel=medal.modifiers.new('Medal minted rim','BEVEL');bevel.width=.002;bevel.segments=3
tube('Medal raised rim',[medal_center+Vector((.006,radius*.87*cos(j*2*pi/64),radius*.87*sin(j*2*pi/64))) for j in range(65)],.0013,bronze,display)
tube('Medal ribbon eyelet',[xyz((-1.675,1.302+.007*sin(j*2*pi/24),4.24+.007*cos(j*2*pi/24))) for j in range(25)],.0015,gold,display)
box('Medal stand foot',(-1.73,1.078,4.24),(.20,.045,.24),graphite,display,.008)
beam('Medal stand rear',(-1.77,1.10,4.24),(-1.77,1.48,4.24),.018,.018,steel,display)
beam('Medal ribbon upper support',(-1.77,1.48,4.19),(-1.77,1.48,4.29),.012,.012,steel,display)
for sign in [-1,1]:
    points=[xyz((-1.68,1.30,4.24+sign*.012)),xyz((-1.73,1.38,4.24+sign*.034)),xyz((-1.77,1.48,4.24+sign*.044)),xyz((-1.80,1.46,4.24+sign*.044)),xyz((-1.80,1.36,4.24+sign*.025))]
    vertices=[]
    for p in points:vertices.extend([p+Vector((0,-.009,0)),p+Vector((0,.009,0))])
    mesh('Folded medal fabric ribbon',vertices,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(points)-1)],orange,display)
# Simple raised running figure, no text or achievement claim.
for line in [[(-.009,.013),(.005,-.004)],[(-.009,.013),(-.024,.006),(-.031,.016)],[(-.009,.013),(.007,.019),(.019,.012)],[(.005,-.004),(-.013,-.018),(-.027,-.017)],[(.005,-.004),(.021,-.014),(.014,-.032)]]:tube('Medal runner pictogram',[medal_center+Vector((.007,*p)) for p in line],.0023,ivory,display)
bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=.006,depth=.002,location=medal_center+Vector((.008,-.012,.028)));head=bpy.context.object;head.name='Medal runner head';head.rotation_euler.y=pi/2
for c in list(head.users_collection):c.objects.unlink(head)
display.objects.link(head);head.data.materials.append(ivory)
for o in display.objects:
    if o.name.startswith(('Running medal','Medal ','Folded medal')):o.location.y-=.32

# Tennis racket, oval frame with clipped string grid, throat and wrapped handle.
rcenter=xyz((1.69,1.48,2.97));rx=.095;rz=.135
ring=[rcenter+Vector((0,rx*cos(j*2*pi/64),rz*sin(j*2*pi/64))) for j in range(65)]
tube('Tennis racket oval frame',ring,.007,orange,display)
tube('Tennis inner graphite rim',[rcenter+Vector((-.001,rx*.91*cos(j*2*pi/64),rz*.94*sin(j*2*pi/64))) for j in range(65)],.0025,graphite,display)
for i in range(-6,7):
    a=i/7;u=rx*.88*a;half=rz*.91*sqrt(1-a*a);tube('Racket longitudinal string',[rcenter+Vector((-.001,u,-half)),rcenter+Vector((-.001,u,half))],.00055,ivory,display)
for i in range(-8,9):
    a=i/9;v=rz*.91*a;half=rx*.88*sqrt(1-a*a);tube('Racket transverse string',[rcenter+Vector((.001,-half,v)),rcenter+Vector((.001,half,v))],.00055,ivory,display)
throat=xyz((1.69,1.285,2.97))
for sign in [-1,1]:tube('Racket supported throat',[rcenter+Vector((0,sign*.047,-.115)),throat],.006,graphite,display)
tube('Racket wrapped grip',[throat,xyz((1.69,1.10,2.97))],.013,navy,display)
for i in range(10):tube('Racket grip wrap',[xyz((1.69+.013*cos(j*2*pi/20),1.11+i*.015,2.97+.013*sin(j*2*pi/20))) for j in range(21)],.001,ivory,display)
box('Racket display cradle',(1.72,1.078,2.97),(.18,.045,.22),graphite,display,.010)

# Requested M-dot-style triathlon emblem as decoration, with no finisher claim.
base_y=1.805;cx=1.72;cz=4.23
outline=[(-.11,0),(-.11,.18),(-.055,.18),(0,.09),(.055,.18),(.11,.18),(.11,0),(.055,0),(.055,.09),(0,.025),(-.055,.09),(-.055,0)]
vertices=[xyz((cx+dx,base_y+.025+h,cz+zz)) for dx in [-.018,.018] for zz,h in outline];n=len(outline)
faces=[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
emblem=mesh('Decorative triathlon M emblem',vertices,faces,red,display);mod=emblem.modifiers.new('Enamel rounded edge','BEVEL');mod.width=.004;mod.segments=3
bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=.028,location=xyz((cx,base_y+.247,cz)));dot=bpy.context.object;dot.name='Decorative triathlon dot';dot.scale.x=.5
for c in list(dot.users_collection):c.objects.unlink(dot)
display.objects.link(dot);dot.data.materials.append(red)
box('Triathlon emblem plinth',(cx,base_y+.011,cz),(.15,.022,.29),graphite,display,.006)
box('Triathlon emblem backing',(cx+.028,base_y+.155,cz),(.016,.30,.27),graphite,display,.012)
beam('Triathlon dot mounting pin',(cx,base_y+.247,cz),(cx+.029,base_y+.247,cz),.014,.014,red,display)
# Empty lower bay deliberately remains a quiet area below the emblem.

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
report={'sourceSnapshot':SOURCE.name,'sourceSHA256':digest,'sourceUnchanged':True,'runtimeChanged':False,'personalObjects':['running shoe','unlabelled medal','mountain relief','strung tennis racket','decorative triathlon emblem'],'noClaimedResultsOrEvents':True,'plantsPreserved':True,'clearanceRays':checks,'headroomClear':True,'columnFootNominalHalfWidth':1.355,'kneeDiagonalHeight':[.70,.94],'evaluatedTriangles':triangles,'renderEngine':'BLENDER_EEVEE','samples':32,'resolution':[1280,800],'threads':2,'gpuTimingMeasured':False}
(OUT/'shelves-personal.json').write_text(json.dumps(report,indent=2)+'\n')
camera=bpy.data.objects['Player toward panorama'];camera.location=xyz((0,1.70,1.15));camera.rotation_euler=(xyz((0,1.42,4))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=16;scene.camera=camera;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.threads_mode='FIXED';scene.render.threads=2
if hasattr(scene,'eevee') and hasattr(scene.eevee,'taa_render_samples'):scene.eevee.taa_render_samples=32
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'transition-shelves-personal.blend'))
for name,eye,target,lens in [('shelves-personal-overview',(0,1.7,1.15),(0,1.42,4),16),('shelves-personal-running',(.30,1.55,2.67),(-1.72,1.50,2.97),37),('shelves-personal-column',(.65,1.02,3.0),(-1.47,.61,3.6),35),('shelves-personal-tennis',(-.6,1.60,3.3),(1.70,1.46,3.3),28),('shelves-personal-shoe-detail',(-.95,1.48,2.72),(-1.72,1.15,2.97),50),('shelves-personal-medal-detail',(-.85,1.47,4.40),(-1.67,1.25,4.56),60)]:
    if '--all-views' not in sys.argv and name not in {'shelves-personal-overview','shelves-personal-shoe-detail','shelves-personal-medal-detail'}:continue
    camera.location=xyz(eye);camera.rotation_euler=(xyz(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=lens;scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
print('PERSONAL_SHELVES_READY',json.dumps(report))
