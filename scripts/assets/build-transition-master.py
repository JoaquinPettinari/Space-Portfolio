"""Standalone transition authoring file; runtime/source assets stay untouched."""
from pathlib import Path
from math import pi
import bpy, json, hashlib
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/assets/transition-master';OUT.mkdir(parents=True,exist_ok=True)
SOURCE=ROOT/'docs/assets/unified-ship/cruz-del-sur-interior-panels.blend'
source_hash=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.name='TRANSITION / Technical vestibule'
scene.unit_settings.system='METRIC'
def col(name,export=True):
    c=bpy.data.collections.new(name);scene.collection.children.link(c);c['runtime_export']=export;return c
shell=col('01 Pressure walls and portal frames')
floor=col('02 Removable non-slip deck')
roof=col('03 Ceiling cassettes and ventilation')
niches=col('04 Recessed shelves and equipment')
details=col('05 Fasteners seals and labels')
fixtures=col('06 Practical light housings')
preview=col('90 PREVIEW cameras and lighting',False)
refs=col('99 SOURCE references - NO EXPORT',False)
context=col('98 Surrounding bridge and passage - NO EXPORT',False)
def xyz(p):return Vector((p[0],-p[2],p[1]))
def mat(name,color,metal=.0,rough=.5,emission=0,textile=False):
    m=bpy.data.materials.new('TRANSITION / '+name);m.use_nodes=True;m.diffuse_color=(*color,1)
    nodes=m.node_tree.nodes;links=m.node_tree.links;p=nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
    if not emission:
        tex=nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=145 if textile else 95;tex.inputs['Detail'].default_value=2
        bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.00035
        links.new(tex.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],p.inputs['Normal'])
        ramp=nodes.new('ShaderNodeMapRange');ramp.inputs['To Min'].default_value=max(.05,rough-.09);ramp.inputs['To Max'].default_value=min(1,rough+.08)
        links.new(tex.outputs['Fac'],ramp.inputs['Value']);links.new(ramp.outputs['Result'],p.inputs['Roughness'])
    return m
steel=mat('Brushed titanium',(.24,.27,.28),.78,.34)
graphite=mat('Graphite painted alloy',(.055,.068,.075),.55,.43)
ivory=mat('Warm ceramic panels',(.40,.36,.29),.32,.45)
rubber=mat('Recessed pressure seals',(.009,.014,.018),.05,.8)
deck=mat('Dark manganese tread',(.07,.085,.091),.62,.47)
bronze=mat('Anodized warm edge',(.38,.24,.105),.72,.35)
amber=mat('Warm amber diffuser',(1,.55,.20),.0,.35,3.5)
cyan=mat('Cyan system status',(.06,.6,.7),.0,.35,2)
paper=mat('Archive page edges',(.48,.43,.33),.0,.86)
blue=mat('Technical folio blue',(.06,.12,.16),.1,.7, textile=True)
olive=mat('Technical folio olive',(.15,.17,.10),.1,.7,textile=True)
def box(name,p,size,material,c=details,bevel=.006):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.name=name
    for old in list(o.users_collection):old.objects.unlink(o)
    c.objects.link(o);o.dimensions=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material)
    if bevel:
        m=o.modifiers.new('Manufactured edge radius','BEVEL');m.width=min(bevel,min(size)*.25);m.segments=3
        m=o.modifiers.new('Weighted panel normals','WEIGHTED_NORMAL')
    return o
def beam(name,a,b,width,depth,material,c=details):
    a,b=xyz(a),xyz(b);d=b-a;o=box(name,(0,0,0),(width,d.length,depth),material,c)
    o.location=(a+b)/2;o.rotation_mode='QUATERNION';o.rotation_quaternion=Vector((0,0,1)).rotation_difference(d.normalized());return o
def label(name,text,p,size=.06,rotation=None):
    data=bpy.data.curves.new(name,'FONT');data.body=text;data.size=size;data.extrude=.0002;data.align_x='CENTER'
    o=bpy.data.objects.new(name,data);details.objects.link(o);o.location=xyz(p);data.materials.append(bronze)
    if rotation:o.rotation_euler=rotation
    return o
def arch(name,path,z,width,depth,material,c):
    points=[Vector(p) for p in path];outer=[];inner=[]
    normals=[Vector((-(b-a).y,(b-a).x)).normalized() for a,b in zip(points,points[1:])]
    for i,p in enumerate(points):
        normal=normals[0] if i==0 else normals[-1] if i==len(points)-1 else (normals[i-1]+normals[i]).normalized()
        offset=normal*(width/2/normal.dot(normals[min(i,len(normals)-1)]));outer.append(p+offset);inner.append(p-offset)
    vertices=[xyz((p.x,p.y,z+dz)) for dz in [-depth/2,depth/2] for pair in zip(outer,inner) for p in pair];n=len(points)*2;faces=[]
    for i in range(len(points)-1):
        a=2*i;b=a+2
        faces.extend([(a,b,b+1,a+1),(n+a+1,n+b+1,n+b,n+a),(a,n+a,n+b,b),(a+1,b+1,n+b+1,n+a+1)])
    faces.extend([(0,1,n+1,n),(n-2,2*n-2,2*n-1,n-1)])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.materials.append(material)
    o=bpy.data.objects.new(name,mesh);c.objects.link(o)
    bevel=o.modifiers.new('Continuous mitred edge','BEVEL');bevel.width=.005;bevel.segments=3
    o.modifiers.new('Weighted frame normals','WEIGHTED_NORMAL');return o

# Both openings stay open; their existing runtime clearance is retained.
for z,name in [(2.19,'FORWARD / BRIDGE'),(5.05,'AFT / PANORAMA')]:
    path=[(-1.43,.04),(-1.43,2.13),(-1.10,2.60),(1.10,2.60),(1.43,2.13),(1.43,.04)]
    arch(name+' structural arch',path,z,.15,.16,steel,shell)
    arch(name+' pressure seal',path,z+.091,.034,.025,rubber,details)
    box(name+' sill',(0,-.035,z),(2.68,.07,.20),steel,floor,.01)
    for side in [-1,1]:
        box(name+' guide bezel',(side*1.43,1.25,z-.09),(.055,1.28,.04),rubber,fixtures)
        box(name+' guide diffuser',(side*1.43,1.25,z-.116),(.020,1.10,.014),amber,fixtures,.002)
    box(name+' overhead status',(0,2.58,z-.095),(.52,.022,.016),cyan,fixtures,.002)
    box(name+' upper closure',(0,2.86,z),(3.0,.32,.14),graphite,shell)

for side in [-1,1]:
    # Recesses occupy X1.5..1.9, outside the clear corridor.
    box('Pressure backing',(side*1.93,1.52,3.6),(.10,3.04,3),graphite,shell)
    for z in [2.30,4.91]:
        box('End service pier',(side*1.72,1.52,z),(.44,3.04,.20),ivory,shell,.018)
        for y in [.34,1.5,2.64]:
            box('Pier reinforcement',(side*1.495,y,z),(.015,.18,.12),steel,details,.003)
    box('Lower removable wall',(side*1.72,.405,3.6),(.44,.81,2.40),graphite,shell,.015)
    box('Upper pressure fascia',(side*1.72,2.80,3.6),(.44,.48,2.40),graphite,shell,.015)
    for z in [2.65,3.60,4.55]:
        box('Service wall cassette',(side*1.489,.40,z),(.018,.59,.83),ivory,details,.006)
        for dz in [-.33,.33]:
            for y in [.17,.63]:box('Captive wall fixing',(side*1.477,y,z+dz),(.012,.018,.018),steel,details,.003)
        for y in [.27,.32,.37]:box('Lower return vent',(side*1.476,y,z),(.008,.018,.42),rubber,details,.002)
    for y in [1.03,1.78]:
        box('Inset shelf',(side*1.73,y,3.6),(.30,.045,2.25),steel,niches,.012)
        box('Shelf retention lip',(side*1.57,y+.045,3.6),(.018,.055,2.25),bronze,niches,.003)
        box('Shelf underlight housing',(side*1.70,y-.037,3.6),(.12,.026,2.05),rubber,fixtures)
        box('Shelf warm underlight',(side*1.70,y-.053,3.6),(.08,.008,1.95),amber,fixtures,.001)
        for z in [2.65,4.55]:box('Shelf mounting bracket',(side*1.82,y-.10,z),(.18,.15,.04),graphite,niches)
    for i in range(7):
        z=2.70+i*.105;h=.40+(i%3)*.018
        box('Archive binder %s %02d'%(side,i),(side*1.72,1.055+h/2,z),(.22,h,.075),blue if i%2 else olive,niches,.008)
        box('Binder spine label',(side*1.603,1.34,z),(.008,.048,.049),paper,niches,.002)
        box('Binder metallic marker',(side*1.597,1.23,z),(.005,.009,.05),bronze,niches,.001)
    for dz in [-.64,.54]:
        z=3.6+dz
        box('Secured equipment case',(side*1.72,2,z),(.23,.39,.62),blue,niches,.025)
        for zz in [z-.23,z+.23]:
            box('Case reinforcement band',(side*1.72,2,zz),(.242,.408,.035),rubber,niches,.006)
            box('Case latch',(side*1.588,2.06,zz),(.025,.08,.035),bronze,niches,.003)
        box('Case grip',(side*1.588,2,z),(.020,.026,.18),steel,niches,.004)
    box('Niche upper light',(side*1.72,2.46,3.6),(.08,.012,2.10),amber,fixtures,.002)
    for z in [2.43,4.78]:
        box('Niche side reveal',(side*1.73,1.64,z),(.4,1.72,.06),rubber,niches)
        box('Reveal machined lip',(side*1.511,1.64,z),(.025,1.72,.028),steel,niches,.003)

box('Pressure deck underlay',(0,-.10,3.6),(3,.12,3),rubber,floor,0)
for i in range(5):
    z=2.1+.30+i*.60
    for side in [-1,1]:
        x=side*.66
        box('Removable deck cassette',(x,-.025,z),(1.19,.05,.58),steel,floor,.012)
        box('Inset non slip panel',(x,.004,z),(1.10,.014,.48),deck,floor,.008)
        # Actual shallow tread ridges; grouped per plate for manageable authoring.
        tread=[]
        for row in range(5):
            for column in range(10):
                o=box('Deck raised tread',(x-.48+column*.105,.014,z-.19+row*.092),(.047,.004,.008),graphite,floor,.001)
                o.rotation_euler.z=(pi/5 if (column+row)%2 else -pi/5);tread.append(o)
        bpy.ops.object.select_all(action='DESELECT')
        for o in tread:o.select_set(True)
        bpy.context.view_layer.objects.active=tread[0];bpy.ops.object.join();tread[0].name='Deck tread array %s %s'%(side,i)
        for dx in [-.55,.55]:
            for dz in [-.255,.255]:box('Deck quarter turn fastener',(x+dx,.006,z+dz),(.022,.009,.022),bronze,floor,.004)
        box('Deck lift recess',(x,.013,z-.17),(.15,.006,.035),rubber,floor,.003)
        box('Deck lift bar',(x,.017,z-.17),(.105,.005,.012),steel,floor,.002)
    for side in [-1,1]:
        box('Floor guide housing',(side*1.35,-.004,z),(.12,.026,.58),rubber,floor,.004)
        box('Floor guide diffuser',(side*1.35,.011,z),(.026,.008,.39),amber,fixtures,.002)

box('Roof backing',(0,3.15,3.6),(3,.10,3),graphite,roof)
for z in [2.20,3.12,4.08,5.00]:box('Roof transverse beam',(0,3.095,z),(3,.10,.10),steel,roof,.012)
for z in [2.65,3.60,4.55]:
    box('Ceiling removable cassette',(0,3.095,z),(1.70,.065,.79),ivory,roof,.014)
    for side in [-1,1]:
        box('Ceiling lamp well',(side*1.11,3.08,z),(.38,.08,.74),rubber,fixtures,.012)
        box('Ceiling warm diffuser',(side*1.11,3.047,z),(.22,.012,.59),amber,fixtures,.004)
        for j in range(6):box('Ceiling vent',(side*.70,3.058,z-.25+j*.1),(.16,.012,.025),rubber,roof,.002)
label('Forward designation','CRUZ DEL SUR  /  BRIDGE',(0,2.82,2.105),.071,(pi/2,0,0))
label('Aft designation','PANORAMA  /  ARRIVAL',(0,2.82,5.14),.063,(pi/2,0,pi))

# Archive only local source faces, with their material assignments. No original
# scene is saved, changed or exported from this independent document.
with bpy.data.libraries.load(str(SOURCE),link=False) as (src,dst):
    dst.scenes=[name for name in src.scenes if name=='CRUZ DEL SUR / Unified compact vessel']
source_scene=dst.scenes[0];reference_faces=0
for ob in list(source_scene.objects):
    if ob.type!='MESH':continue
    world=[ob.matrix_world@v.co for v in ob.data.vertices]
    chosen=[p for p in ob.data.polygons if all(-5.25<=world[i].y<=-1.95 and abs(world[i].x)<2.1 and -.3<=world[i].z<=3.4 for i in p.vertices)]
    if not chosen:continue
    indices=sorted({i for p in chosen for i in p.vertices});mapping={old:new for new,old in enumerate(indices)}
    data=bpy.data.meshes.new('Source local reference');data.from_pydata([world[i] for i in indices],[],[tuple(mapping[i] for i in p.vertices) for p in chosen])
    for m in ob.data.materials:data.materials.append(m)
    for new,old in zip(data.polygons,chosen):new.material_index=old.material_index
    ref=bpy.data.objects.new('REFERENCE / '+ob.name,data);refs.objects.link(ref);ref['source_file']=str(SOURCE.relative_to(ROOT));reference_faces+=len(chosen)
bpy.data.scenes.remove(source_scene)
refs.hide_render=True;refs.hide_viewport=True
for z in [6.1166666667,8.15,10.1833333333]:
    before=set(scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/models/cruz-del-sur-panoramic-bay.glb'))
    for o in set(scene.objects)-before:
        if o.parent is None:o.location.y-=z
        for c in list(o.users_collection):c.objects.unlink(o)
        context.objects.link(o);o['runtime_export']=False

world=bpy.data.worlds.new('Transition studio');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.025,.035,.05,1);world.node_tree.nodes['Background'].inputs[1].default_value=.25;scene.world=world
for z in [2.65,3.60,4.55]:
    data=bpy.data.lights.new('Preview warm ceiling','AREA');data.energy=110;data.color=(1,.67,.36);data.shape='RECTANGLE';data.size=2.2;data.size_y=.65
    o=bpy.data.objects.new(data.name,data);preview.objects.link(o);o.location=xyz((0,2.98,z))
cameras=[]
for name,eye,target in [('Player toward bridge',(.25,1.7,5.85),(0,1.05,2.10)),('Player toward panorama',(.25,1.7,1.50),(0,1.05,5.10)),('Shelf detail',(-.55,1.62,4.5),(-1.72,1.55,3.45))]:
    data=bpy.data.cameras.new(name);data.lens=24 if 'Player' in name else 32;data.clip_start=.04
    o=bpy.data.objects.new(name,data);preview.objects.link(o);o.location=xyz(eye);o.rotation_euler=(xyz(target)-o.location).to_track_quat('-Z','Y').to_euler();cameras.append(o)
scene.render.engine='BLENDER_WORKBENCH';scene.render.resolution_x=1100;scene.render.resolution_y=760;scene.render.resolution_percentage=100;scene.render.threads_mode='FIXED';scene.render.threads=2
scene.display.shading.light='STUDIO';scene.display.shading.color_type='MATERIAL';scene.display.shading.show_shadows=True;scene.display.shading.show_cavity=True;scene.display.shading.cavity_type='BOTH';scene.display.shading.background_type='WORLD'
scene.camera=cameras[0]
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
scene['runtime_coordinates']='X right, Y up, Z toward arrival; Blender X,-Z,Y'
scene['integration_status']='Authoring only; replace original transition faces and procedural shelves together before runtime integration'
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();triangles=0
for o in scene.objects:
    if o.type=='MESH' and refs not in o.users_collection and context not in o.users_collection:
        evaluated=o.evaluated_get(deps);mesh=evaluated.to_mesh();mesh.calc_loop_triangles();triangles+=len(mesh.loop_triangles);evaluated.to_mesh_clear()
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash
report={'source':str(SOURCE.relative_to(ROOT)),'sourceSHA256':source_hash,'sourceUnchanged':True,'runtimeChanged':False,'runtimeBounds':{'z':[2.1,5.1],'clearWidth':3,'ceilingUnderside':3.04,'mouthWidth':2.68},'editableMeshes':sum(o.type=='MESH' and refs not in o.users_collection and context not in o.users_collection for o in scene.objects),'evaluatedTriangles':triangles,'referenceFaces':reference_faces,'previewRenderer':'Workbench','previewResolution':[1100,760],'threads':2,'gpuFrameTimeMeasured':False,'pending':'Material-preview verification and runtime integration'}
(OUT/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'transition-master.blend'))
for camera in cameras:
    scene.camera=camera;scene.render.filepath=str(OUT/(camera.name.lower().replace(' ','-')+'.png'));bpy.ops.render.render(write_still=True)
print('TRANSITION_MASTER_READY',json.dumps(report))
