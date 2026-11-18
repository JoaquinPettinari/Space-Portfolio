"""Chamfered observation bay with a low personal display ledge; no console."""
import bpy,bmesh,ast,json
from pathlib import Path
from math import pi,cos,sin
from mathutils import Vector,Matrix
s=bpy.context.scene;assert not s.get('window_dressing');root=Path(bpy.data.filepath).parent
source=ast.parse((root/'detail-architecture.py').read_text());exec(compile(ast.Module(body=[n for n in source.body if isinstance(n,ast.FunctionDef)],type_ignores=[]),'shared geometry','exec'))
paint=bpy.data.materials['STUDIO / Warm graphite enamel'];metal=bpy.data.materials['STUDIO / Worn machined bronze steel'];dark=bpy.data.materials['STUDIO / Carbon rubber'];frame=bpy.data.materials['STUDIO / Powder coated structural rails'];ink=bpy.data.materials['STUDIO / Warm stencil ink'];warm=bpy.data.materials['CABIN / REFERENCE / Warm diffuser'];brass=bpy.data.materials['CABIN / REFERENCE / Aged brass']
archive=bpy.data.collections['90 Archive / Superseded layout - excluded'];retired=[]
col=bpy.data.collections.new('20 Observation ledge and keepsakes');s.collection.children.link(col)
slots=['SLOT / Fixed docking door','SLOT / Sliding leaves','SLOT / Sliding stationary frame','SLOT / Credential terminal','SLOT / Full NASA EMU','LEAF_LEFT_SLIDE','LEAF_RIGHT_SLIDE'];snapshot={n:(bpy.data.objects[n].matrix_world.copy(),bpy.data.objects[n].matrix_local.copy()) for n in slots}
def tris():
 dg=bpy.context.evaluated_depsgraph_get();n=0
 for o in s.objects:
  if o.hide_render or o.get('archived') or o.type not in {'MESH','CURVE','FONT'}:continue
  e=o.evaluated_get(dg);m=e.to_mesh();m.calc_loop_triangles();n+=len(m.loop_triangles);e.to_mesh_clear()
 return n
before=tris()
for o in list(bpy.data.collections['14 Clear panoramic observation'].objects):
 if o.name.startswith('DETAIL /') or 'Window corner warm index' in o.name or 'Window captive joint' in o.name:stash(o)
# Thick octagonal pressure perimeter, then a recessed dark seal and a machined inner step.
ring('Panorama octagonal structural reveal',(-4.43,1.53,15.15),6.42,2.25,.15,.17,frame,col,c=.40,axis='side')
ring('Panorama recessed pressure gasket',(-4.315,1.53,15.15),6.13,1.96,.040,.050,dark,col,c=.32,axis='side')
ring('Panorama stepped inner bronze rim',(-4.27,1.53,15.15),6.06,1.89,.035,.035,metal,col,c=.29,axis='side')
for z in [12.04,18.26]:
 for y in [1.04,2.02]:
  box('Window warm vertical bezel',(-4.323,y,z),(.045,.32,.065),dark,col)
  box('Window amber inset',(-4.294,y,z),(.014,.24,.022),warm,col)
for z in [12.44,13.65,16.65,17.86]:
 for y in [.47,2.59]:screw((-4.337,y,z),col,axis='side',r=.015)
text('CRUZ DEL SUR  /  OBSERVATION',(-4.335,2.59,15.15),.043,col,angle=pi/2)

# Horizontal ledge is an actual chamfered slab, with support brackets and lower fascia.
shape=[(-4.58,12.30),(-4.04,12.30),(-3.91,12.43),(-3.91,17.87),(-4.04,18.0),(-4.58,18.0)]
vs=[(x,y,z) for y in [.69,.755] for x,z in shape];fs=[tuple(range(6)),tuple(reversed(range(6,12)))]+[(i,(i+1)%6,(i+1)%6+6,i+6) for i in range(6)]
mesh('Observation ledge chamfered slab',vs,fs,paint,col,bevel=.015)
box('Ledge continuous metal nose',(-3.915,.716,15.15),(.025,.035,5.36),metal,col)
for z in [12.85,14.0,16.30,17.45]:
 prism('Ledge structural bracket',(-4.19,.53,z),.20,.36,.40,frame,col,c=.045,axis='side')
 prism('Ledge underside service fascia',(-4.35,.36,z),1.03,.28,.025,paint,col,c=.035,axis='side')
for z in [13.25,17.03]:
 box('Ledge recessed warm strip seat',(-3.962,.687,z),(.040,.025,.85),dark,col)
 box('Ledge amber underside diffuser',(-3.966,.671,z),(.021,.009,.73),warm,col)

# Reuse the existing plant as a shelf specimen, including its pot and curved leaves.
plant=bpy.data.collections['16 Corner floor plant'];pivot=Vector((-3.95,-12.65,0));target=Vector((-4.22,-17.52,.755));transform=Matrix.Translation(target)@Matrix.Scale(.60,4)@Matrix.Translation(-pivot)
for o in plant.objects:o.matrix_world=transform@o.matrix_world
plant['placement']='Reused existing plant on observation ledge; no duplicate plant.'

def tube(name,points,r,mat):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.resolution_u=2;d.bevel_depth=r;d.bevel_resolution=2;p=d.splines.new('POLY');p.points.add(len(points)-1)
 for v,co in zip(p.points,points):v.co=(*xyz(co),1)
 o=bpy.data.objects.new('WINDOW / '+name,d);col.objects.link(o);d.materials.append(mat);return o
def sphere(name,p,r,mat):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=r,location=xyz(p));o=bpy.context.object;o.name='WINDOW / '+name
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.data.materials.append(mat)
 for f in o.data.polygons:f.use_smooth=True
 return o
def base(name,p,size):return box(name,p,size,metal,col)
# Small exploration instrument: inclined sighting rings, spindle and foot.
base('Orbital instrument foot',(-4.19,.78,16.65),(.30,.045,.32))
tube('Orbital instrument stem',[(-4.19,.80,16.65),(-4.19,1.03,16.65)],.018,brass)
for tilt in [0,.78]:
 points=[]
 for i in range(49):
  a=i*2*pi/48;u=.19*cos(a);v=.19*sin(a);points.append((-4.19+u*sin(tilt),1.10+v,16.65+u*cos(tilt)))
 tube('Bronze exploration sighting ring',points,.009,brass)
sphere('Instrument central marker',(-4.19,1.10,16.65),.034,metal)
tube('Instrument polar axis',[(-4.19,.88,16.65),(-4.19,1.32,16.65)],.006,metal)

# Two small framed local space images, packed at an appropriate display resolution.
images=[next(i for i in bpy.data.images if i.name=='CDS ORBIT / Cinematic orbital panorama - packed'),next(i for i in bpy.data.images if i.name=='CDS ORBIT / Deep space with distant galaxies and planets')]
for idx,(z,w,h) in enumerate([(12.93,.40,.27),(13.53,.34,.30)]):
 img=images[idx].copy();img.name='WINDOW / Keepsake space image '+str(idx+1);img.scale(512,256);img.pack()
 m=bpy.data.materials.new('WINDOW / Photographic print '+str(idx+1));m.use_nodes=True;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Roughness'].default_value=.40
 t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=img;m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
 prism('Keepsake standing frame',(-4.18,.79+h/2,z),w+.055,h+.055,.034,metal,col,c=.018,axis='side')
 box('Keepsake frame foot',(-4.22,.773,z),(.21,.025,w*.75),frame,col)
 y=.79+h/2;vs=[(-4.155,y-h/2,z-w/2),(-4.155,y-h/2,z+w/2),(-4.155,y+h/2,z+w/2),(-4.155,y+h/2,z-w/2)]
 ob=mesh('Packed space photograph',vs,[(0,1,2,3)],m,col,bevel=0);uv=ob.data.uv_layers.new(name='Print UV')
 for loop,co in zip(uv.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=co
# Modest celestial sample, no screen in the middle of the window.
base('Celestial sample plinth',(-4.20,.78,14.04),(.22,.045,.24))
sphere('Small celestial specimen',(-4.20,.88,14.04),.080,bpy.data.materials['STUDIO / Brushed copper coolant'])

ref=bpy.data.images.load(r'C:\Users\joaqu\AppData\Local\Temp\codex-clipboard-86d9d68f-0747-4991-aee6-3ba737180ae2.png',check_existing=True);ref.name='REFERENCE / Observation ledge without console';ref.pack()
bpy.context.view_layer.update()
for n,(world,local) in snapshot.items():
 o=bpy.data.objects[n]
 assert all(abs(a-b)<1e-6 for ra,rb in zip(world,o.matrix_world) for a,b in zip(ra,rb)),n
 assert all(abs(a-b)<1e-6 for ra,rb in zip(local,o.matrix_local) for a,b in zip(ra,rb)),n
after=tris();s['window_dressing']=1
(root/'window-dressing-audit.json').write_text(json.dumps({'trianglesBefore':before,'trianglesAfter':after,'preservedSlots':slots,'archivedReplacements':retired,'images':[i.name for i in images],'newImageResolution':[512,256],'plantReused':True,'centerFreeRuntimeZ':[14.5,16.3],'ledgeRuntimeBounds':{'x':[-4.58,-3.91],'y':[.69,.755],'z':[12.30,18.0]},'runtimeChanged':False},indent=2))
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
print('WINDOW_DRESSING_SAVED',before,after)
