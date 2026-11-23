"""Reference-led portal variant; does not overwrite the original master."""
from pathlib import Path
import bpy,ast,json,hashlib
from math import pi
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/transition-master'
SOURCE=OUT/'transition-master.blend';digest=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE));scene=bpy.context.scene
scene.name='TRANSITION / Layered portal reference study'
shell=bpy.data.collections['01 Pressure walls and portal frames'];details=bpy.data.collections['05 Fasteners seals and labels'];fixtures=bpy.data.collections['06 Practical light housings'];niches=bpy.data.collections['04 Recessed shelves and equipment']
def xyz(p):return Vector((p[0],-p[2],p[1]))
helpers=ast.parse((ROOT/'scripts/assets/build-transition-master.py').read_text())
for name in ['box','beam','arch']:
    node=next(n for n in helpers.body if isinstance(n,ast.FunctionDef) and n.name==name)
    exec(compile(ast.Module(body=[node],type_ignores=[]),'portal-helper','exec'))
def material(name):return bpy.data.materials['TRANSITION / '+name]
steel=material('Brushed titanium');graphite=material('Graphite painted alloy');rubber=material('Recessed pressure seals');bronze=material('Anodized warm edge');amber=material('Warm amber diffuser');blue=material('Technical folio blue');olive=material('Technical folio olive')

# Keep the original deck/ceiling/clear corridor, simplify the shelf content.
for o in list(scene.objects):
    if o.name.startswith(('FORWARD / BRIDGE structural','FORWARD / BRIDGE pressure','FORWARD / BRIDGE guide','FORWARD / BRIDGE overhead','FORWARD / BRIDGE upper','AFT / PANORAMA structural','AFT / PANORAMA pressure','AFT / PANORAMA guide','AFT / PANORAMA overhead','AFT / PANORAMA upper','Forward designation','Aft designation','Archive binder','Binder spine','Binder metallic','Secured equipment case','Case reinforcement','Case latch','Case grip')):
        bpy.data.objects.remove(o,do_unlink=True)

def offset_path(points,distance):
    points=[Vector(p) for p in points];normals=[Vector((-(b-a).y,(b-a).x)).normalized() for a,b in zip(points,points[1:])];result=[]
    for i,p in enumerate(points):
        n=normals[0] if i==0 else normals[-1] if i==len(points)-1 else (normals[i-1]+normals[i]).normalized()
        result.append(tuple(p+n*distance/n.dot(normals[min(i,len(normals)-1)])))
    return result

# Narrow feet, deliberate lower knee, wide vertical body, long upper shoulders.
# Innermost base clear half-width=1.42-.08=1.34m, central headroom>2.5m.
path=[(-1.42,.015),(-1.42,.55),(-1.57,.76),(-1.57,2.10),(-1.13,2.68),(1.13,2.68),(1.57,2.10),(1.57,.76),(1.42,.55),(1.42,.015)]
for z,facing,name in [(2.19,-1,'FORWARD'),(5.05,1,'AFT')]:
    for layer,offset,width,depth,step,mat in [
        ('Inner machined reveal',0,.16,.18,-.09,steel),
        ('Deep pressure channel',.12,.08,.24,0,rubber),
        ('Broad outer armor',.29,.25,.20,.10,graphite),
        ('Outer titanium lip',.435,.035,.14,.16,steel),
    ]:
        arch(name+' / '+layer,offset_path(path,offset),z+facing*step,width,depth,mat,shell)
    for side in [-1,1]:
        for a,b in [((side*1.70,.14),(side*1.70,.48)),((side*1.74,.67),(side*1.86,.84)),((side*1.87,1.32),(side*1.87,1.77)),((side*1.70,2.32),(side*1.43,2.66))]:
            beam(name+' / Amber inset',(a[0],a[1],z+facing*.22),(b[0],b[1],z+facing*.22),.026,.012,amber,fixtures)
        # A few flush fasteners emphasize scale without filling the face.
        for y in [1.05,1.98]:box(name+' / Frame captive screw',(side*1.89,y,z+facing*.208),(.020,.020,.016),steel,details,.004)
    box(name+' / Header diffuser',(0,2.97,z+facing*.22),(1.20,.025,.014),amber,fixtures,.003)

def niche_frame(name,cx,z):
    # Closed chamfered face ring, real opening and dark recessed backing.
    profile=[(cx-.35,.79),(cx-.27,.70),(cx+.27,.70),(cx+.35,.79),(cx+.35,2.22),(cx+.27,2.31),(cx-.27,2.31),(cx-.35,2.22)]
    points=[Vector(p) for p in profile];outer=[];inner=[];count=len(points)
    for i,p in enumerate(points):
        previous=(p-points[i-1]).normalized();following=(points[(i+1)%count]-p).normalized()
        a=Vector((-previous.y,previous.x));b=Vector((-following.y,following.x));n=(a+b).normalized();delta=n*.045/n.dot(a);outer.append(p+delta);inner.append(p-delta)
    verts=[xyz((p.x,p.y,z+dz)) for dz in [-.05,.05] for pair in zip(outer,inner) for p in pair];faces=[];stride=count*2
    for i in range(count):
        a=2*i;b=2*((i+1)%count);faces.extend([(a,b,b+1,a+1),(stride+a+1,stride+b+1,stride+b,stride+a),(a,stride+a,stride+b,b),(a+1,b+1,stride+b+1,stride+a+1)])
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.materials.append(steel);o=bpy.data.objects.new(name,data);shell.objects.link(o)
    mod=o.modifiers.new('Niche edge radius','BEVEL');mod.width=.009;mod.segments=3;o.modifiers.new('Niche weighted normals','WEIGHTED_NORMAL')
    box(name+' backing',(cx,1.51,z+.33),(.72,1.70,.055),rubber,niches,.025)
    for sx in [-1,1]:box(name+' reveal wall',(cx+sx*.34,1.51,z+.16),(.045,1.47,.36),graphite,niches,.012)
    for y in [.73,1.42,2.28]:
        box(name+' shelf',(cx,y,z+.16),(.65,.040,.34),graphite,niches,.007)
        box(name+' light',(cx,y-.025,z+.025),(.51,.012,.018),amber,fixtures,.002)

# Front-facing flank bays outside all existing walking clearances.
for side in [-1,1]:
    x=side*2.36;z=2.10
    niche_frame('FRONT NICHE '+str(side),x,z)
    for sx in [-1,1]:box('Flank structural jamb',(x+sx*.46,1.54,z+.13),(.16,1.95,.39),graphite,shell,.025)
    box('Flank header',(x,2.52,z+.13),(1.05,.29,.39),graphite,shell,.025)
    box('Flank foot',(x,.24,z+.13),(1.05,.48,.39),graphite,shell,.025)
    beam('Flank lower chamfer',(x,.48,z-.02),(x,.70,z+.15),1.02,.12,graphite,shell)
    for y in [.49,.53,.57,.61]:box('Flank ventilation',(x,y,z-.065),(.44,.018,.02),rubber,details,.003)
    for i in range(3):
        o=box('Restrained safety mark',(x-.16+i*.10,.23,z-.078),(.055,.14,.008),bronze,details,.002);o.rotation_euler.y=-.45
    # One equipment case per bay and one restrained upper object.
    box('Niche compact case',(x,1.04,z+.13),(.44,.48,.20),blue,niches,.035)
    for dx in [-.15,.15]:
        box('Case protection band',(x+dx,1.04,z+.13),(.035,.49,.215),rubber,niches,.008)
        box('Case latch detail',(x+dx,1.15,z+.014),(.045,.08,.025),bronze,niches,.005)
    box('Case recessed grip',(x,1.24,z+.014),(.16,.027,.018),steel,niches,.004)
    if side<0:
        box('Upper compact case',(x,1.66,z+.15),(.43,.39,.19),graphite,niches,.025)
        box('Upper case stripe',(x,1.66,z+.043),(.31,.025,.009),bronze,niches,.002)
    else:
        for dx,height in [(-.10,.34),(0,.30)]:box('Two technical field guides',(x+dx,1.45+height/2,z+.14),(.075,height,.17),olive if dx else blue,niches,.008)

# Shelves deeper in the corridor contain one small box each instead of rows.
for side in [-1,1]:box('Sparse rear shelf equipment',(side*1.72,1.23,4.18),(.21,.32,.43),graphite,niches,.02)

camera=bpy.data.objects['Player toward panorama'];camera.location=xyz((0,1.70,-1.65));camera.rotation_euler=(xyz((0,1.52,3.25))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=22
scene.camera=camera;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.render.threads_mode='FIXED';scene.render.threads=2
if hasattr(scene,'eevee') and hasattr(scene.eevee,'taa_render_samples'):scene.eevee.taa_render_samples=16
scene.view_settings.exposure=.1
for name,p,target,energy,size in [('Portal soft key',(-2,2.8,.2),(0,1.4,2.2),170,3),('Portal cool fill',(2,2.4,.3),(0,1.6,2.2),110,2)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size;data.color=(1,.73,.46) if 'key' in name else (.35,.65,1)
    o=bpy.data.objects.new(name,data);bpy.data.collections['90 PREVIEW cameras and lighting'].objects.link(o);o.location=xyz(p);o.rotation_euler=(xyz(target)-o.location).to_track_quat('-Z','Y').to_euler()

# Validate authored geometry only, never the non-export surrounding context.
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();verts=[];faces=[];triangles=0
for o in scene.objects:
    if o.type!='MESH' or any(c.name.startswith(('90 ','98 ','99 ')) for c in o.users_collection):continue
    ev=o.evaluated_get(deps);mesh=ev.to_mesh();mesh.calc_loop_triangles();triangles+=len(mesh.loop_triangles);start=len(verts);verts.extend(o.matrix_world@v.co for v in mesh.vertices);faces.extend(tuple(start+i for i in p.vertices) for p in mesh.polygons);ev.to_mesh_clear()
tree=BVHTree.FromPolygons(verts,faces);checks=[]
for x in [-1.33,-.7,0,.7,1.33]:
    for y in [.1,.45,1.7,2.0]:
        hit=tree.ray_cast(xyz((x,y,1.80)),Vector((0,-1,0)),3.5);assert hit[0] is None,('Blocked portal',x,y,hit);checks.append({'x':x,'height':y,'clear':True})
for x in [-.7,0,.7]:
    hit=tree.ray_cast(xyz((x,2.5,1.8)),Vector((0,-1,0)),3.5);assert hit[0] is None,('Headroom blocked',x,hit)
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==digest
report={'source':SOURCE.name,'sourceSHA256':digest,'sourceUnchanged':True,'runtimeChanged':False,'minimumClearWidthMetres':2.68,'centralHeadroomMetres':2.5,'outerFrontHalfWidthMetres':max(abs(v.x) for v in verts),'kneeHeightMetres':.65,'evaluatedTriangles':triangles,'clearanceRays':checks,'renderEngine':scene.render.engine,'resolution':[1280,800],'threads':2,'samples':getattr(getattr(scene,'eevee',None),'taa_render_samples',None),'gpuTimingMeasured':False}
report['headroomRays']=[{'x':x,'height':2.5,'clear':True} for x in [-.7,0,.7]]
(OUT/'portal-refinement.json').write_text(json.dumps(report,indent=2)+'\n')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'transition-portal-refined.blend'))
scene.render.filepath=str(OUT/'portal-refined-front.png');bpy.ops.render.render(write_still=True)
camera.location=xyz((-.45,1.65,.10));camera.rotation_euler=(xyz((1.4,1.5,2.1))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=26
scene.render.filepath=str(OUT/'portal-refined-niche.png');bpy.ops.render.render(write_still=True)
print('PORTAL_VARIANT_READY',json.dumps(report))
