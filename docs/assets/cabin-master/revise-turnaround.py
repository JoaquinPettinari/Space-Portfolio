"""Edit the current master only; archive superseded art, preserve hardware slots."""
import bpy,bmesh,json,random
from pathlib import Path
from math import sin,cos,pi
from mathutils import Vector
s=bpy.context.scene;assert s.name=='CRUZ DEL SUR / Cabin master'
assert not s.get('turnaround_revision'),'Already applied; edit current master directly'
folder=Path(bpy.data.filepath).parent
slot_names=['SLOT / Fixed docking door','SLOT / Sliding leaves','SLOT / Sliding stationary frame','SLOT / Credential terminal','SLOT / Full NASA EMU']
before={n:bpy.data.objects[n].matrix_world.copy() for n in slot_names}
archive=bpy.data.collections.new('90 Archive / Superseded layout - excluded');s.collection.children.link(archive)
archive['exclude_runtime_export']=True;archive['archive_reason']='Turnaround direction: clear observation window and new deck'
archived=[]
def stash(o):
 archived.append(o.name)
 for c in list(o.users_collection):c.objects.unlink(o)
 archive.objects.link(o);o.hide_render=True;o['archived']=True;o['exclude_runtime_export']=True
def collection(name):
 c=bpy.data.collections.new(name);s.collection.children.link(c);return c
window=collection('14 Clear panoramic observation');display=collection('15 EVA glass display');plantcol=collection('16 Corner floor plant');deck=collection('17 Turnaround deck panels')
def xyz(p):return Vector((p[0],-p[2],p[1]))
paint=bpy.data.materials['STUDIO / Warm graphite enamel'];metal=bpy.data.materials['STUDIO / Worn machined bronze steel'];dark=bpy.data.materials['STUDIO / Carbon rubber']
frame=bpy.data.materials['STUDIO / Powder coated structural rails'];floor=bpy.data.materials['MASTER / Graphite alloy deck']
warm=bpy.data.materials['CABIN / REFERENCE / Warm diffuser'];cyan=bpy.data.materials['CABIN / REFERENCE / Cyan status'];ink=bpy.data.materials['STUDIO / Warm stencil ink']
def mesh(name,vs,fs,mat,col):
 d=bpy.data.meshes.new(name);d.from_pydata([xyz(p) for p in vs],[],fs);d.update();d.materials.append(mat)
 o=bpy.data.objects.new('REV / '+name,d);col.objects.link(o);return o
def box(name,p,size,mat,col,bevel=.008):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.name='REV / '+name
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
 if bevel:
  m=o.modifiers.new('Machined edge','BEVEL');m.width=min(bevel,min(size)*.4);m.segments=3
  o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def tube(name,points,r,mat,col):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.resolution_u=8;d.bevel_depth=r;d.bevel_resolution=2
 sp=d.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
 for b,p in zip(sp.bezier_points,points):b.co=xyz(p);b.handle_left_type='AUTO';b.handle_right_type='AUTO'
 o=bpy.data.objects.new('REV / '+name,d);col.objects.link(o);d.materials.append(mat);return o
def text(body,p,size,mat,col,rotation=(0,0,0)):
 bpy.ops.object.text_add(location=xyz(p),rotation=rotation);o=bpy.context.object;o.name='REV / '+body
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.data.body=body;o.data.size=size;o.data.align_x='CENTER';o.data.resolution_u=4;o.data.materials.append(mat);return o
def outline(a,b,c):
 return [(-a+c,-b),(a-c,-b),(a,-b+c),(a,b-c),(a-c,b),(-a+c,b),(-a,b-c),(-a,-b+c)]
def ring(name,x,y,z,w,h,edge,depth,mat,col):
 outer=outline(w/2,h/2,.18);inner=outline(w/2-edge,h/2-edge,.14)
 vs=[(xx,y+yy,z+zz) for xx in [x-depth/2,x+depth/2] for shape in [outer,inner] for zz,yy in shape]
 fs=[]
 for i in range(8):
  j=(i+1)%8;fs.extend([(i,j,8+j,8+i),(16+i,24+i,24+j,16+j),(i,16+i,16+j,j),(8+i,8+j,24+j,24+i)])
 o=mesh(name,vs,fs,mat,col);b=o.modifiers.new('Perimeter bevel','BEVEL');b.width=.008;b.segments=3;o.modifiers.new('Perimeter normals','WEIGHTED_NORMAL');return o

# Keep pressure portals and independent service hatch; remove all lounge/galley art.
old=bpy.data.collections['04 Lounge and galley']
keep=['ARR10 portal','ARR10 bridge sign','ARR10 BRIDGE ACCESS','ARR10 medical','ARR10 MEDICAL','ARR10 flag','ARR10 sun ',
      'Service bay closed return','Side service hatch','Hatch ','Service hatch identification','LIFE SUPPORT\nTOOLS', 'Lamp retaining clip']
for o in list(old.objects):
 if not any(p in o.name for p in keep):stash(o)
old.name='04 Port wall technical fittings'
# The window is one uninterrupted opening, not a glazed grid.
for o in list(bpy.data.collections['01 Hull and glazing'].objects):
 if any(p in o.name for p in ['Straight cabin port glazing','Straight cabin window']):stash(o)
ring('Panoramic structural perimeter',-4.84,1.52,15.15,6.30,2.12,.12,.15,frame,window)
ring('Panoramic inner metal rebate',-4.75,1.52,15.15,6.08,1.90,.028,.035,metal,window)
vs=[(-4.82,1.52+y,15.15+z) for z,y in outline(3.0,.91,.14)]
mesh('Single panoramic pressure glass',vs,[tuple(range(8))],bpy.data.materials['MASTER / Clear pressure glazing'],window)
box('Low pressure wall below panorama',(-4.87,.235,15.15),(.16,.47,6.30),frame,window)
for z in [12.27,18.03]:
 box('Window corner warm index',(-4.73,.62,z),(.012,.015,.21),warm,window,.002)
for y in [.61,2.43]:
 for z in [13.15,15.15,17.15]:box('Window captive joint',(-4.72,y,z),(.014,.025,.025),metal,window,.004)

# Transparent EVA case surrounds the existing suit; no suit transform/mesh edits.
glass=bpy.data.materials['MASTER / Clear pressure glazing'].copy();glass.name='REV / EVA display clear glass'
mix=next(n for n in glass.node_tree.nodes if n.type=='MIX_SHADER');mix.inputs[0].default_value=.035
cx=-2.17
mesh('EVA front glass',[(cx-.51,.235,17.245),(cx+.51,.235,17.245),(cx+.51,2.49,17.245),(cx-.51,2.49,17.245)],[(0,1,2,3)],glass,display)
for side in [-1,1]:
 x=cx+side*.54
 mesh('EVA side glass',[(x,.235,17.25),(x,.235,18.09),(x,2.49,18.09),(x,2.49,17.25)],[(0,1,2,3)],glass,display)
 box('EVA front corner post',(x,1.37,17.26),(.034,2.39,.035),metal,display)
 for y in [.21,2.54]:box('EVA side frame rail',(x,y,17.69),(.035,.035,.88),frame,display)
 box('EVA glass catch',(x,1.26,17.224),(.045,.085,.028),metal,display,.006)
for y in [.21,2.54]:box('EVA front frame rail',(cx,y,17.26),(1.12,.045,.055),frame,display)
text('EVA / EMU-01',(cx,2.445,17.235),.052,ink,display,(pi/2,0,pi))
for x in [cx-.44,cx+.44]:box('Glass safety etch',(x,.35,17.236),(.012,.11,.003),cyan,display,.001)

# Freestanding plant replaces coffee furniture at the front window corner.
def plain(name,color,metallic,rough):
 m=bpy.data.materials.new('REV / '+name);m.use_nodes=True;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metallic;p.inputs['Roughness'].default_value=rough;return m
greens=[plain('Ficus leaf '+str(i),c,0,.50) for i,c in enumerate([(.045,.135,.018),(.075,.19,.025),(.035,.10,.012)])]
px,pz=-3.95,12.65
bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=.21,radius2=.27,depth=.52,location=xyz((px,.26,pz)))
pot=bpy.context.object;pot.name='REV / Brushed floor planter'
for c in list(pot.users_collection):c.objects.unlink(pot)
plantcol.objects.link(pot);pot.data.materials.append(metal)
for p in pot.data.polygons:p.use_smooth=True
box('Planter foot',(px,.035,pz),(.36,.07,.36),frame,plantcol,.035)
bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.255,depth=.012,location=xyz((px,.516,pz)))
soil=bpy.context.object;soil.name='REV / Planter soil'
for c in list(soil.users_collection):c.objects.unlink(soil)
plantcol.objects.link(soil);soil.data.materials.append(dark)
rng=random.Random(612)
for branch in range(7):
 a=branch*2*pi/7;top=.98+(branch%3)*.20
 tip=(px+.29*cos(a),top,pz+.29*sin(a));tube('Ficus branch',[(px,.51,pz),(px+.10*cos(a),.83,pz+.10*sin(a)),tip],.009,frame,plantcol)
 for k in range(5):
  t=.3+k*.16;start=Vector((px+.29*cos(a)*t,.55+(top-.55)*t,pz+.29*sin(a)*t))
  side=1 if k%2 else -1;angle=a+side*.85
  end=start+Vector((.32*cos(angle),.055,.32*sin(angle)))
  width=Vector((-.10*sin(angle),0,.10*cos(angle)));vs=[];fs=[]
  for row in range(9):
   f=row/8;center=start.lerp(end,f)+Vector((0,.055*sin(pi*f),0));w=sin(pi*f)**.8
   vs.extend([tuple(center+width*w),tuple(center+Vector((0,.012*w,0))),tuple(center-width*w)])
  for row in range(8):
   i=row*3;fs.extend([(i,i+3,i+4,i+1),(i+1,i+4,i+5,i+2)])
  leaf=mesh('Curved floor plant leaf',vs,fs,greens[(branch+k)%3],plantcol)
  for p in leaf.data.polygons:p.use_smooth=True
  mod=leaf.modifiers.new('Leaf thickness','SOLIDIFY');mod.thickness=.001

# New rectangular service deck: narrow joints, clipped corners, inset bolts.
oldfloor=bpy.data.collections['02 Floor and grilles']
for o in list(oldfloor.objects):
 if 'floor substrate' not in o.name.lower():stash(o)
oldfloor.name='02 Structural floor substrate'
box('Continuous dark deck underlay',(0,-.035,15.17),(9.70,.065,6.40),dark,deck,0)
def plate(name,x,z,w,d,height,thick,mat):
 pts=outline(w/2,d/2,.065);vs=[(x+xx,y,z+zz) for y in [height-thick,height] for xx,zz in pts]
 fs=[tuple(reversed(range(8))),tuple(range(8,16))]+[(i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8)]
 o=mesh(name,vs,fs,mat,deck)
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
 b=o.modifiers.new('Panel edge bevel','BEVEL');b.width=.003;b.segments=2;return o
for i,x in enumerate([-4,-2.4,-.8,.8,2.4,4]):
 for j,z in enumerate([12.85,14.35,15.85,17.35]):
  plate('Deck plate rim %d %d'%(i,j),x,z,1.555,1.455,.004,.025,metal)
  plate('Graphite deck face %d %d'%(i,j),x,z,1.513,1.413,.009,.014,floor)
  for xx in [x-.69,x+.69]:
   for zz in [z-.64,z+.64]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=.013,depth=.003,location=xyz((xx,.011,zz)))
    bolt=bpy.context.object;bolt.name='REV / Recessed deck fastener'
    for c in list(bolt.users_collection):c.objects.unlink(bolt)
    deck.objects.link(bolt);bolt.data.materials.append(metal)
for x in [-3.20,-1.60,1.60,3.20]:
 for z in [12.95,14.45,15.95,17.45]:
  box('Recessed amber deck channel',(x,.007,z),(.036,.010,1.02),dark,deck,.003)
  box('Amber deck core',(x,.012,z),(.012,.006,.91),warm,deck,.002)
# Floor signage faces the corresponding real door, never a fictitious side exit.
for z,body,angle,direction in [(13.0,'BRIDGE ACCESS',0,-1),(17.2,'ARRIVAL / DOCKING',pi,1)]:
 text(body,(0,.014,z),.145,ink,deck,(0,0,angle))
 for x in [-1.22,1.22]:box('Access label edge',(x,.013,z),(.014,.004,.75),metal,deck,.001)
 for zz in [z-.375,z+.375]:box('Access label edge',(0,.013,zz),(2.45,.004,.014),metal,deck,.001)
 for x in [-.13,.13]:
  zz=z+direction*.49
  mesh('Door direction arrow',[(x-.085,.015,zz-direction*.10),(x,.015,zz),(x+.085,.015,zz-direction*.10)],[(0,1,2)],metal,deck)

# A small service identifier refines the technical bank without replacing it.
tech=bpy.data.collections['06 Refined service wall']
text('AUX BUS / C-12',(3.67,.38,15.88),.033,ink,tech,(pi/2,0,-pi/2))
archive.hide_render=True;archive.hide_viewport=True
for lc in bpy.context.view_layer.layer_collection.children:
 if lc.collection==archive:lc.exclude=True
ref=Path(r'C:/Users/joaqu/AppData/Local/Temp/codex-clipboard-6af99bdc-290f-40fc-818d-5343d2edabe8.png')
image=bpy.data.images.load(str(ref),check_existing=True);image.name='REFERENCE / Turnaround - user corrections override';image.pack()
o=bpy.data.objects.new('Reference / Corrected turnaround',None);o.empty_display_type='IMAGE';o.data=image;o.hide_render=True;o.location=(14,0,0);bpy.data.collections['11 Packed references'].objects.link(o)
cam=bpy.data.objects['CAM / Lounge and EVA'];cam.name='CAM / Observation window and EVA';s.camera=cam
s['turnaround_revision']=1;s['turnaround_interpretation']='Port: clear window, no sofa/table/cafe/console. Starboard: existing technical wall. Real doors unchanged.'
bpy.context.view_layer.update()
for name,world in before.items():
 assert all(abs(a-b)<1e-6 for ra,rb in zip(world,bpy.data.objects[name].matrix_world) for a,b in zip(ra,rb)),name
active=[o for o in s.objects if not o.get('archived')]
report={'archivedObjects':len(archived),'archiveCollection':archive.name,'archiveExcludedRenderViewportExport':True,
 'activeObjects':len(active),'activeGeometry':sum(o.type in {'MESH','CURVE','FONT'} for o in active),
 'archivedNames':archived,'slotTransformsUnchanged':slot_names,'newCollections':[c.name for c in [window,display,plantcol,deck]],
 'floorLabels':{'BRIDGE ACCESS':'towards negative runtime Z','ARRIVAL / DOCKING':'towards positive runtime Z'},
 'runtimeChanged':False,'camera':s.camera.name}
(folder/'turnaround-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
version=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0
 bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=version
print('TURNAROUND_READY',json.dumps({k:v for k,v in report.items() if k!='archivedNames'}))
