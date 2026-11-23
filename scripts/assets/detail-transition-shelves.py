"""Detailed restrained shelf objects and botanical meshes; separate variant."""
from pathlib import Path
from math import sin,cos,pi
import bpy,ast,json,hashlib,random
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/transition-master'
SOURCE=OUT/'transition-shelves-divided.blend';digest=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE));scene=bpy.context.scene;scene.name='TRANSITION / Detailed botanical and technical shelves'
details=bpy.data.collections['05 Fasteners seals and labels'];niches=bpy.data.collections['04 Recessed shelves and equipment'];preview=bpy.data.collections['90 PREVIEW cameras and lighting'];fixtures=bpy.data.collections['06 Practical light housings']
plants=bpy.data.collections.new('07 Botanical specimens');scene.collection.children.link(plants);plants['runtime_export']=True
def xyz(p):return Vector((p[0],-p[2],p[1]))
helpers=ast.parse((ROOT/'scripts/assets/build-transition-master.py').read_text())
for name in ['box','beam']:
    node=next(n for n in helpers.body if isinstance(n,ast.FunctionDef) and n.name==name);exec(compile(ast.Module(body=[node],type_ignores=[]),'shelf-detail-helper','exec'))
def oldmat(name):return bpy.data.materials['TRANSITION / '+name]
steel=oldmat('Brushed titanium');graphite=oldmat('Graphite painted alloy');rubber=oldmat('Recessed pressure seals');bronze=oldmat('Anodized warm edge');blue=oldmat('Technical folio blue');cyan=oldmat('Cyan system status')
def mat(name,color,metal=0,rough=.55):
    m=bpy.data.materials.new('SHELVES / '+name);m.use_nodes=True;m.diffuse_color=(*color,1);p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
ceramic=mat('Satin ceramic stoneware',(.30,.24,.16),.05,.44)
soil=mat('Potting substrate',(.035,.020,.009),0,.96)
stemmat=mat('Living stems',(.08,.16,.025),0,.64)
veinmat=mat('Leaf midrib',(.095,.17,.045),0,.72)
leaves=[mat('Botanical leaf '+str(i),c,0,.62+i*.025) for i,c in enumerate([(.025,.085,.018),(.045,.125,.030),(.065,.16,.043),(.020,.065,.018)])]
for m in leaves:
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Subsurface Weight'].default_value=.06;p.inputs['Subsurface Radius'].default_value=(.25,.6,.15)
    noise=m.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=160
    bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.00015;m.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
amberglass=mat('Amber instrument lens',(.32,.12,.025),.25,.22)
ivory=mat('Instrument ceramic',(.48,.46,.37),.12,.48)

# Remove every simple book, including the portal niche guides, and the replaced
# ring/samples; leave the already authored case groups and portal unchanged.
for o in list(scene.objects):
    if o.name.startswith(('Module field manual','Manual identification','Two technical field guides','Survey ','Sealed sample vessel','Sample closure','Sample readout')):bpy.data.objects.remove(o,do_unlink=True)

# Push only the central columns forward, retaining their rear attachment plane.
def push_at(y):
    if y<=.56:return .09
    if y<.79:return .09+(.20-.09)*(y-.56)/.23
    if y<=2.12:return .20
    if y<2.48:return .20-(.20-.10)*(y-2.12)/.36
    return .10
for o in list(scene.objects):
    if o.type!='MESH' or not o.name.startswith(('CENTRAL COLUMN','Column ')):continue
    o.data=o.data.copy();inverse=o.matrix_world.inverted()
    for v in o.data.vertices:
        p=o.matrix_world@v.co;x=abs(p.x);factor=max(0,min(1,(2.01-x)/.15));p.x=(1 if p.x>0 else -1)*(x-push_at(p.z)*factor);v.co=inverse@p

def mesh(name,vertices,faces,material,col=plants):
    data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.materials.append(material);o=bpy.data.objects.new(name,data);col.objects.link(o)
    for polygon in data.polygons:polygon.use_smooth=True
    return o
def tube(name,points,radius,material,col=plants):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=2;curve.bevel_depth=radius;curve.bevel_resolution=2
    spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
    for p,v in zip(spline.points,points):p.co=(*v,1)
    o=bpy.data.objects.new(name,curve);col.objects.link(o);curve.materials.append(material);return o
def lathe(name,p,profile,material,col=plants):
    center=xyz(p);vertices=[];segments=40
    for radius,height in profile:
        for i in range(segments):vertices.append(center+Vector((radius*cos(i*2*pi/segments),radius*sin(i*2*pi/segments),height)))
    faces=[]
    for j in range(len(profile)-1):
        for i in range(segments):a=j*segments+i;b=j*segments+(i+1)%segments;faces.append((a,b,b+segments,a+segments))
    return mesh(name,vertices,faces,material,col)
def pot(name,p,r=.095,height=.17):
    lathe(name+' ceramic pot',p,[(0,0),(r*.72,0),(r*.84,.018),(r,height-.018),(r*1.04,height-.008),(r*1.04,height+.004),(r*.91,height+.008),(r*.87,height-.016),(r*.74,.025),(0,.025)],ceramic)
    lathe(name+' saucer',(p[0],p[1]-.009,p[2]),[(0,0),(r*.96,0),(r*1.02,.015),(r*.85,.021),(0,.014)],graphite)
    lathe(name+' substrate',(p[0],p[1]+height-.022,p[2]),[(0,0),(r*.87,0)],soil)
    rng=random.Random(name)
    for i in range(16):
        angle=rng.random()*2*pi;distance=rng.random()*r*.78
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.004+rng.random()*.003,location=xyz((p[0]+cos(angle)*distance,p[1]+height-.018,p[2]+sin(angle)*distance)))
        o=bpy.context.object;o.name=name+' substrate grit'
        for c in list(o.users_collection):c.objects.unlink(o)
        plants.objects.link(o);o.data.materials.append(soil)
    return xyz((p[0],p[1]+height-.02,p[2]))

leaf_count=0
def leaf(name,base,direction,length,width,normal,index):
    global leaf_count
    direction=Vector(direction).normalized();normal=Vector(normal).normalized();across=direction.cross(normal).normalized();normal=across.cross(direction).normalized()
    vertices=[];centers=[];rows=13;columns=7
    for i in range(rows):
        t=i/(rows-1);center=base+direction*(length*t)+normal*(length*.17*sin(pi*t))+across*(length*.055*sin(pi*t)*sin(index+1));centers.append(center)
        half=width*.5*(sin(pi*t)**.72)*(.80+.20*t)
        for j in range(columns):
            u=2*j/(columns-1)-1;asym=1+.11*sin(index*1.7+t*4)*u
            v=center+across*(u*half*asym)+normal*(-abs(u)*half*.20+sin(t*pi*3+index)*abs(u)*.002)
            vertices.append(v)
    faces=[]
    for i in range(rows-1):
        for j in range(columns-1):a=i*columns+j;faces.append((a,a+1,a+1+columns,a+columns))
    o=mesh(name,vertices,faces,leaves[index%len(leaves)]);mod=o.modifiers.new('Thin botanical lamina','SOLIDIFY');mod.thickness=.0005
    tube(name+' central vein',[p+normal*.00065 for p in centers[1:-1]],.00040,veinmat)
    # Sparse secondary veins follow the curved blade, rather than a flat decal.
    for i in [3,5,7,9]:
        for sign in [-1,1]:
            t=i/(rows-1);half=width*.5*(sin(pi*t)**.72)*(.80+.20*t)
            tube(name+' lateral vein',[centers[i]+normal*.0005,centers[min(i+1,rows-1)]+across*(sign*half*.72)-normal*half*.10],.00014,veinmat)
    leaf_count+=1

# Compact upright lance-leaf specimen on the starboard forward upper shelf.
root=pot('COMPACT',(1.74,1.805,2.99),.094,.16)
for i in range(11):
    angle=i*2.399;branch=Vector((cos(angle)*.06,sin(angle)*.06,.09+(i%3)*.025));base=root+branch
    tube('COMPACT connected petiole',[root,root+branch*.55,base],.0022,stemmat)
    direction=Vector((cos(angle)*.47,sin(angle)*.47,.72-(i%3)*.1))
    leaf('COMPACT blade',base,direction,.19+(i%3)*.025,.064,Vector((cos(angle)*.25,sin(angle)*.25,1)),i)

# A restrained trailing plant: pot and crown connected to two curved vines.
root=pot('TRAILING',(-1.73,1.805,4.24),.105,.18)
for branch_index in range(2):
    points=[]
    for i in range(21):
        t=i/20
        # Grow above the soil/rim first, then arc outward past the shelf lip.
        outward=.19*sin(min(1,t/.30)*pi/2)
        rise=.08*sin(min(1,t/.25)*pi/2)-.72*max(0,(t-.25)/.75)
        points.append(root+Vector((outward,(-.11 if branch_index else .11)*sin(t*pi*.85),rise)))
    tube('TRAILING connected vine',points,.0024,stemmat)
    for j,i in enumerate([6,8,11,14,17,20]):
        base=points[i];sign=1 if j%2 else -1;d=Vector((.20,sign*.85,-.25));petiole=base+d.normalized()*.025
        tube('TRAILING leaf petiole',[base,petiole],.0014,stemmat)
        leaf('TRAILING blade',petiole,d,.115+(j%2)*.02,.075,Vector((1,.2,.35)),j+branch_index*6)
for i in range(4):
    direction=Vector((cos(i*pi/2)*.65,sin(i*pi/2)*.65,.7));base=root+direction*.025
    tube('TRAILING crown stem',[root,base],.0018,stemmat);leaf('TRAILING crown',base,direction,.13,.08,Vector((0,0,1)),i+13)

# Remove the former upper case where the compact plant now sits, including its
# hardware only in that module. Other boxes remain and receive finer face work.
for o in list(scene.objects):
    if o.name.startswith(('Module compact equipment','Equipment rubber band','Equipment latch','Equipment carry grip')):
        p=o.matrix_world.translation
        if p.x>0 and 2.6<-p.y<3.35 and p.z>1.78:bpy.data.objects.remove(o,do_unlink=True)
for side,z,y in [(-1,2.97,1.055),(1,4.19,1.055)]:
    box('Case inset face',(side*1.602,y+.145,z),(.012,.21,.24),graphite,niches,.012)
    for dz in [-.10,.10]:
        for yy in [y+.07,y+.22]:box('Case face fixing',(side*1.592,yy,z+dz),(.009,.012,.012),steel,niches,.002)
    box('Case small identity plaque',(side*1.589,y+.16,z),(.008,.035,.11),ivory,niches,.002)
    for dz in [-.06,-.03,0,.03,.06]:box('Case inset ventilation',(side*1.591,y+.09,z+dz),(.009,.012,.014),rubber,niches,.001)

def instrument(side,z,y,name):
    # A supported survey analyzer, with ceramic body, dark lens and restrained
    # mechanical markings instead of another glowing screen.
    box(name+' anchored foot',(side*1.72,y+.024,z),(.22,.048,.30),rubber,niches,.008)
    box(name+' body',(side*1.73,y+.16,z),(.18,.23,.22),ivory,niches,.018)
    box(name+' face bezel',(side*1.624,y+.17,z),(.025,.16,.17),graphite,niches,.012)
    box(name+' amber lens',(side*1.608,y+.19,z),(.009,.075,.12),amberglass,niches,.009)
    for dz in [-.05,.05]:box(name+' control',(side*1.604,y+.11,z+dz),(.014,.022,.025),steel,niches,.004)
    tube(name+' secured cable',[xyz((side*1.78,y+.12,z+.10)),xyz((side*1.81,y+.08,z+.15)),xyz((side*1.79,y+.06,z+.20))],.004,rubber,niches)
instrument(-1,2.99,1.805,'Field spectrometer')
instrument(1,2.97,1.055,'Portable survey analyzer')
# Lower aft port shelf: one tray with two physically seated sample capsules.
box('Sample tray',(-1.73,1.08,4.24),(.25,.05,.42),graphite,niches,.010)
for z in [4.13,4.35]:
    lathe('Sample capsule',(-1.73,1.105,z),[(0,0),(.045,0),(.055,.025),(.055,.15),(.045,.17),(0,.17)],steel,niches)
    lathe('Sample capsule seal',(-1.73,1.105,z),[(.056,.125),(.056,.145)],rubber,niches)
# Upper aft starboard: a single articulated optical unit, no clutter.
box('Optical mount base',(1.73,1.83,4.23),(.23,.05,.32),graphite,niches,.012)
beam('Optical support',(1.73,1.85,4.23),(1.73,2.04,4.23),.035,.035,steel,niches)
box('Optical head',(1.73,2.09,4.23),(.20,.12,.22),graphite,niches,.025)
box('Optical objective',(1.614,2.09,4.23),(.035,.08,.12),amberglass,niches,.015)
# Replacement for the simple guides in the front niche: a connected instrument.
box('Front niche charger foot',(2.36,1.45,2.24),(.29,.04,.20),rubber,niches,.008)
box('Front niche survey recorder',(2.36,1.59,2.24),(.23,.26,.15),ivory,niches,.020)
box('Recorder interface',(2.36,1.62,2.155),(.15,.075,.012),amberglass,niches,.006)
for x in [2.30,2.36,2.42]:box('Recorder tactile key',(x,1.54,2.153),(.027,.018,.014),graphite,niches,.003)

# Small warm local lights keep the leaves legible without neon foliage.
for name,p,target in [('Compact foliage wash',(1.55,2.39,3.02),(1.73,2.10,2.99)),('Trailing foliage wash',(-1.55,2.37,4.24),(-1.65,1.75,4.24))]:
    data=bpy.data.lights.new(name,'AREA');data.energy=7;data.color=(1,.80,.55);data.shape='DISK';data.size=.36
    o=bpy.data.objects.new(name,data);preview.objects.link(o);o.location=xyz(p);o.rotation_euler=(xyz(target)-o.location).to_track_quat('-Z','Y').to_euler()

camera=bpy.data.objects['Player toward panorama'];camera.location=xyz((0,1.70,1.15));camera.rotation_euler=(xyz((0,1.42,4.0))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=16
scene.camera=camera;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.threads_mode='FIXED';scene.render.threads=2
if hasattr(scene,'eevee') and hasattr(scene.eevee,'taa_render_samples'):scene.eevee.taa_render_samples=32
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();verts=[];faces=[];triangles=0
for o in scene.objects:
    if o.type not in {'MESH','CURVE'} or any(c.name.startswith(('90 ','98 ','99 ')) for c in o.users_collection):continue
    ev=o.evaluated_get(deps);data=ev.to_mesh();data.calc_loop_triangles();triangles+=len(data.loop_triangles);start=len(verts);verts.extend(o.matrix_world@v.co for v in data.vertices);faces.extend(tuple(start+i for i in p.vertices) for p in data.polygons);ev.to_mesh_clear()
tree=BVHTree.FromPolygons(verts,faces);checks=[]
for x in [-1.33,-.7,0,.7,1.33]:
    for y in [.1,.45,1.25,1.7,2.0]:
        hit=tree.ray_cast(xyz((x,y,1.8)),Vector((0,-1,0)),3.5);assert hit[0] is None,('Passage blocked',x,y,hit);checks.append({'x':x,'height':y,'clear':True})
for x in [-.7,0,.7]:assert tree.ray_cast(xyz((x,2.5,1.8)),Vector((0,-1,0)),3.5)[0] is None
assert not any(o.name.startswith(('Module field manual','Manual identification','Two technical field guides')) for o in scene.objects)
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==digest
report={'source':SOURCE.name,'sourceSHA256':digest,'sourceUnchanged':True,'runtimeChanged':False,'manualsRemaining':0,'plantTypes':['compact lance leaf','trailing vine'],'individualLeafMeshes':leaf_count,'columnsFrontMetres':{'foot':1.46,'middle':1.50,'upper':1.72},'clearanceRays':checks,'headroomClear':True,'evaluatedTriangles':triangles,'renderEngine':scene.render.engine,'samples':32,'resolution':[1280,800],'threads':2,'gpuTimingMeasured':False}
(OUT/'shelves-detailed.json').write_text(json.dumps(report,indent=2)+'\n')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'transition-shelves-detailed.blend'))
views=[('shelves-detailed-overview',(0,1.70,1.15),(0,1.42,4),16),('shelves-detailed-port-wall',(1.10,1.70,3.18),(-1.73,1.49,3.60),19),('shelves-detailed-starboard-wall',(-1.10,1.70,3.18),(1.73,1.49,3.60),19),('shelves-detailed-plant',(-.60,2.12,3.70),(-1.68,1.90,4.24),42)]
for name,eye,target,lens in views:
    camera.location=xyz(eye);camera.rotation_euler=(xyz(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=lens;scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
print('DETAILED_SHELVES_READY',json.dumps(report))

