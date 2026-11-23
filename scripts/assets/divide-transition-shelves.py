"""Four recessed library modules, split by matching structural columns."""
from pathlib import Path
import bpy,ast,json,hashlib
from math import pi
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/transition-master'
SOURCE=OUT/'transition-portal-refined.blend';digest=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE));scene=bpy.context.scene;scene.name='TRANSITION / Four recessed shelf modules'
shell=bpy.data.collections['01 Pressure walls and portal frames'];details=bpy.data.collections['05 Fasteners seals and labels'];niches=bpy.data.collections['04 Recessed shelves and equipment'];fixtures=bpy.data.collections['06 Practical light housings'];preview=bpy.data.collections['90 PREVIEW cameras and lighting']
def xyz(p):return Vector((p[0],-p[2],p[1]))
helpers=ast.parse((ROOT/'scripts/assets/build-transition-master.py').read_text())
for name in ['box','beam','arch']:
    node=next(n for n in helpers.body if isinstance(n,ast.FunctionDef) and n.name==name);exec(compile(ast.Module(body=[node],type_ignores=[]),'shelf-helper','exec'))
def material(name):return bpy.data.materials['TRANSITION / '+name]
steel=material('Brushed titanium');graphite=material('Graphite painted alloy');rubber=material('Recessed pressure seals');bronze=material('Anodized warm edge');amber=material('Warm amber diffuser');cyan=material('Cyan system status');blue=material('Technical folio blue');olive=material('Technical folio olive');paper=material('Archive page edges')
# Preserve all portal objects and front-facing niches. Remove only the old
# uninterrupted longitudinal shelves, their lights/brackets and sparse props.
prefixes=('Inset shelf','Shelf retention lip','Shelf underlight housing','Shelf warm underlight','Shelf mounting bracket','Niche upper light','Sparse rear shelf equipment')
for o in list(scene.objects):
    if o.name.startswith(prefixes):bpy.data.objects.remove(o,do_unlink=True)
for o in list(scene.objects):
    if o.name.startswith(('Lower removable wall','Upper pressure fascia')) or (o.name.startswith(('Service wall cassette','Lower return vent')) and abs(-o.location.y-3.6)<.01):
        bpy.data.objects.remove(o,do_unlink=True)
for side in [-1,1]:
    for a,b in [(2.4,3.46),(3.74,4.8)]:
        z=(a+b)/2
        box('Split lower wall',(side*1.72,.405,z),(.44,.81,b-a),graphite,shell,.012)
        box('Split upper fascia',(side*1.72,2.80,z),(.44,.48,b-a),graphite,shell,.012)
    for z in [3.32,3.88]:
        box('Central half cassette',(side*1.489,.40,z),(.018,.59,.25),material('Warm ceramic panels'),details,.006)
        for y in [.27,.32,.37]:box('Half cassette return vent',(side*1.476,y,z),(.008,.018,.17),rubber,details,.002)

def column(side):
    # Thick stepped web behind the clearance plane, with a shaped inner edge.
    profile=[(1.55,.015),(1.55,.56),(1.70,.79),(1.70,2.12),(1.82,2.48),(1.82,3.04),(2.01,3.04),(2.01,.015)]
    points=[(side*x,y) for x,y in profile];n=len(points)
    vertices=[xyz((x,y,z)) for z in [3.49,3.71] for x,y in points]
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new('Column stepped web');mesh.from_pydata(vertices,[],faces);mesh.materials.append(graphite)
    o=bpy.data.objects.new('CENTRAL COLUMN / '+str(side),mesh);shell.objects.link(o)
    mod=o.modifiers.new('Web bevel','BEVEL');mod.width=.012;mod.segments=3;o.modifiers.new('Web weighted normals','WEIGHTED_NORMAL')
    path=[(side*1.585,.015),(side*1.585,.56),(side*1.735,.79),(side*1.735,2.12),(side*1.855,2.48),(side*1.855,3.04)]
    for z in [3.477,3.723]:
        arch('Column machined stepped edge',path,z,.050,.024,steel,details)
        arch('Column dark gasket',[(x+side*.045,y) for x,y in path],z,.026,.030,rubber,details)
    for y,x,height in [(.29,1.542,.31),(1.47,1.692,.43)]:
        box('Column recessed status bezel',(side*x,y,3.60),(.018,height+.08,.076),rubber,fixtures,.004)
        box('Column warm status',(side*(x-.012),y,3.60),(.008,height,.026),amber,fixtures,.002)
    for y in [.95,1.99]:
        for z in [3.53,3.67]:box('Column captive bolt',(side*1.692,y,z),(.012,.019,.019),steel,details,.003)

modules=[]
for side in [-1,1]:
    column(side)
    for index,(a,b) in enumerate([(2.48,3.44),(3.76,4.72)]):
        z=(a+b)/2;length=b-a;tag=('PORT' if side<0 else 'STARBOARD')+' / '+str(index+1)
        modules.append({'name':tag,'side':side,'zRange':[a,b],'shelfHeights':[1.03,1.78]})
        for y in [1.03,1.78]:
            box(tag+' shelf',(side*1.73,y,z),(.30,.045,length),steel,niches,.009)
            box(tag+' retention lip',(side*1.57,y+.045,z),(.018,.055,length),bronze,niches,.003)
            box(tag+' light housing',(side*1.70,y-.037,z),(.12,.026,length-.10),rubber,fixtures,.004)
            box(tag+' warm shelf light',(side*1.70,y-.053,z),(.08,.008,length-.16),amber,fixtures,.001)
            for zz in [a+.08,b-.08]:box(tag+' bracket',(side*1.82,y-.10,zz),(.18,.15,.035),graphite,niches,.005)
        for zz in [a,b]:
            box(tag+' reveal end',(side*1.74,1.64,zz),(.34,1.67,.025),rubber,niches,.003)
            box(tag+' reveal edge',(side*1.562,1.64,zz),(.018,1.67,.020),steel,niches,.003)
        box(tag+' upper recess light',(side*1.73,2.44,z),(.07,.012,length-.13),amber,fixtures,.002)

def case(side,z,y,width=.34):
    box('Module compact equipment',(side*1.73,y+.15,z),(.23,.30,width),blue,niches,.023)
    for dz in [-width*.34,width*.34]:
        box('Equipment rubber band',(side*1.73,y+.15,z+dz),(.24,.31,.028),rubber,niches,.005)
        box('Equipment latch',(side*1.596,y+.21,z+dz),(.023,.06,.035),bronze,niches,.004)
    box('Equipment carry grip',(side*1.593,y+.27,z),(.020,.021,width*.4),steel,niches,.003)
def books(side,z,y,count=2):
    for i in range(count):
        zz=z+i*.08;height=.29+(i%2)*.045
        box('Module field manual',(side*1.72,y+height/2,zz),(.21,height,.058),blue if i%2 else olive,niches,.005)
        box('Manual identification',(side*1.607,y+.20,zz),(.008,.055,.037),paper,niches,.001)
def cylinder(name,p,radius,depth,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=radius,depth=depth,location=xyz(p));o=bpy.context.object;o.name=name
    for c in list(o.users_collection):c.objects.unlink(o)
    niches.objects.link(o);o.data.materials.append(mat);mod=o.modifiers.new('Instrument edge','BEVEL');mod.width=.003;mod.segments=2;o.modifiers.new('Instrument normals','WEIGHTED_NORMAL');return o

# Four different restrained groups; leave broad empty areas around each object.
case(-1,2.97,1.055,.40);books(-1,2.81,1.805,2)
books(-1,4.08,1.055,3)
box('Survey instrument foot',(-1.73,1.83,4.23),(.22,.05,.28),graphite,niches,.009)
cylinder('Survey instrument pedestal',(-1.73,1.91,4.23),.035,.15,steel)
bpy.ops.mesh.primitive_torus_add(major_segments=36,minor_segments=8,location=xyz((-1.73,2.10,4.23)),major_radius=.115,minor_radius=.009)
instrument=bpy.context.object;instrument.name='Survey calibration ring';instrument.rotation_euler.y=pi/2
for c in list(instrument.users_collection):c.objects.unlink(instrument)
niches.objects.link(instrument);instrument.data.materials.append(bronze)
cylinder('Survey sensor core',(-1.73,2.10,4.23),.034,.08,cyan)
beam('Survey sensor physical stem',(-1.73,1.985,4.23),(-1.73,2.10,4.23),.013,.013,steel,niches)
books(1,2.84,1.055,2);case(1,3.02,1.805,.34)
case(1,4.19,1.055,.43)
for z in [4.09,4.33]:
    cylinder('Sealed sample vessel',(1.74,1.94,z),.065,.27,steel)
    cylinder('Sample closure',(1.74,2.085,z),.068,.025,rubber)
    box('Sample readout',(1.671,1.96,z),(.008,.055,.052),cyan,niches,.002)

# Readable overview and true lateral view of one complete pair of modules.
camera=bpy.data.objects['Player toward panorama'];camera.location=xyz((0,1.70,1.15));camera.rotation_euler=(xyz((0,1.42,4.0))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=16
scene.camera=camera;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.threads_mode='FIXED';scene.render.threads=2
if hasattr(scene,'eevee') and hasattr(scene.eevee,'taa_render_samples'):scene.eevee.taa_render_samples=16
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();verts=[];faces=[];triangles=0
for o in scene.objects:
    if o.type!='MESH' or any(c.name.startswith(('90 ','98 ','99 ')) for c in o.users_collection):continue
    ev=o.evaluated_get(deps);mesh=ev.to_mesh();mesh.calc_loop_triangles();triangles+=len(mesh.loop_triangles);start=len(verts);verts.extend(o.matrix_world@v.co for v in mesh.vertices);faces.extend(tuple(start+i for i in p.vertices) for p in mesh.polygons);ev.to_mesh_clear()
tree=BVHTree.FromPolygons(verts,faces);checks=[]
for x in [-1.33,-.7,0,.7,1.33]:
    for y in [.1,.45,1.7,2.0]:
        hit=tree.ray_cast(xyz((x,y,1.8)),Vector((0,-1,0)),3.5);assert hit[0] is None,('Passage blocked',x,y,hit);checks.append({'x':x,'height':y,'clear':True})
for x in [-.7,0,.7]:assert tree.ray_cast(xyz((x,2.5,1.8)),Vector((0,-1,0)),3.5)[0] is None
assert len(modules)==4
assert all(b<=3.44 or a>=3.76 for a,b in [m['zRange'] for m in modules])
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==digest
report={'source':SOURCE.name,'sourceSHA256':digest,'sourceUnchanged':True,'runtimeChanged':False,'modules':modules,'centralColumnZ':3.6,'columnSolidZRange':[3.477,3.723],'shelvesLightsAndLipsSplit':True,'clearanceRays':checks,'centralHeadroomClear':True,'evaluatedTriangles':triangles,'renderEngine':scene.render.engine,'samples':getattr(getattr(scene,'eevee',None),'taa_render_samples',None),'resolution':[1280,800],'threads':2,'gpuTimingMeasured':False}
(OUT/'shelves-divided.json').write_text(json.dumps(report,indent=2)+'\n')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'transition-shelves-divided.blend'))
scene.render.filepath=str(OUT/'shelves-divided-overview.png');bpy.ops.render.render(write_still=True)
camera.location=xyz((1.10,1.70,3.18));camera.rotation_euler=(xyz((-1.73,1.49,3.60))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=19
scene.render.filepath=str(OUT/'shelves-divided-port-wall.png');bpy.ops.render.render(write_still=True)
camera.location=xyz((-1.10,1.70,3.18));camera.rotation_euler=(xyz((1.73,1.49,3.60))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=19
scene.render.filepath=str(OUT/'shelves-divided-starboard-wall.png');bpy.ops.render.render(write_still=True)
print('SHELVES_VARIANT_READY',json.dumps(report))
