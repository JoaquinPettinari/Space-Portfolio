"""Visible pressure-frame and door redesign on the current editable master."""
import bpy,bmesh,json
from pathlib import Path
from math import pi
from mathutils import Vector,Matrix
s=bpy.context.scene;assert not s.get('detail_architecture')
root=Path(bpy.data.filepath).parent
slots=['SLOT / Fixed docking door','SLOT / Sliding leaves','SLOT / Sliding stationary frame','SLOT / Credential terminal','SLOT / Full NASA EMU','LEAF_LEFT_SLIDE','LEAF_RIGHT_SLIDE']
snapshot={n:(bpy.data.objects[n].matrix_world.copy(),bpy.data.objects[n].matrix_local.copy()) for n in slots}
archive=bpy.data.collections['90 Archive / Superseded layout - excluded'];retired=[]
def stash(o):
 retired.append(o.name)
 for c in list(o.users_collection):c.objects.unlink(o)
 archive.objects.link(o);o.hide_render=True;o['archived']=True;o['exclude_runtime_export']=True
def xyz(p):return Vector((p[0],-p[2],p[1]))
paint=bpy.data.materials['STUDIO / Warm graphite enamel'];metal=bpy.data.materials['STUDIO / Worn machined bronze steel'];dark=bpy.data.materials['STUDIO / Carbon rubber'];frame=bpy.data.materials['STUDIO / Powder coated structural rails'];warm=bpy.data.materials['CABIN / REFERENCE / Warm diffuser'];cyan=bpy.data.materials['CABIN / REFERENCE / Cyan status'];ink=bpy.data.materials['STUDIO / Warm stencil ink']
def parent(o,p):
 if p:
  world=o.matrix_world.copy();o.parent=p;o.matrix_world=world
 return o
def mesh(name,vs,fs,mat,col,p=None,bevel=.004):
 d=bpy.data.meshes.new(name);d.from_pydata([xyz(v) for v in vs],[],fs);d.update();d.materials.append(mat)
 bm=bmesh.new();bm.from_mesh(d);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(d);bm.free()
 o=bpy.data.objects.new('DETAIL / '+name,d);col.objects.link(o)
 if bevel:
  b=o.modifiers.new('Machined radius','BEVEL');b.width=bevel;b.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return parent(o,p)
def outline(w,h,c):return [(-w/2+c,-h/2),(w/2-c,-h/2),(w/2,-h/2+c),(w/2,h/2-c),(w/2-c,h/2),(-w/2+c,h/2),(-w/2,h/2-c),(-w/2,-h/2+c)]
def point(at,u,v,d,axis):
 x,y,z=at;return (x+d,y+v,z+u) if axis=='side' else (x+u,y+v,z+d)
def prism(name,at,w,h,depth,mat,col,p=None,c=.08,axis='front'):
 shape=outline(w,h,c);vs=[point(at,u,v,d,axis) for d in [-depth/2,depth/2] for u,v in shape]
 fs=[tuple(range(8)),tuple(reversed(range(8,16)))]+[(i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8)]
 return mesh(name,vs,fs,mat,col,p)
def ring(name,at,w,h,edge,depth,mat,col,p=None,c=.25,axis='front',open_base=False):
 shapes=[outline(w,h,c),outline(w-2*edge,h-2*edge,max(c-edge*.5,.02))]
 vs=[point(at,u,v,d,axis) for d in [-depth/2,depth/2] for sh in shapes for u,v in sh];fs=[]
 for i in range(8):
  if open_base and i==0:continue
  j=(i+1)%8;fs.extend([(i,j,8+j,8+i),(16+i,24+i,24+j,16+j),(i,16+i,16+j,j),(8+i,8+j,24+j,24+i)])
 if open_base:fs.extend([(0,8,24,16),(1,17,25,9)])
 return mesh(name,vs,fs,mat,col,p)
def box(name,at,size,mat,col,p=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(at));o=bpy.context.object;o.name='DETAIL / '+name
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
 b=o.modifiers.new('Edge radius','BEVEL');b.width=min(.006,min(size)*.25);b.segments=3
 return parent(o,p)
def screw(at,col,p=None,axis='front',r=.012):
 bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r,depth=.008,location=xyz(at));o=bpy.context.object;o.name='DETAIL / Captive hex fastener'
 o.rotation_euler=(0,pi/2,0) if axis=='side' else (pi/2,0,0)
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.data.materials.append(metal);return parent(o,p)
def text(body,at,size,col,p=None,angle=0):
 bpy.ops.object.text_add(location=xyz(at),rotation=(pi/2,0,angle));o=bpy.context.object;o.name='DETAIL / '+body
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.data.body=body;o.data.align_x='CENTER';o.data.size=size;o.data.resolution_u=4;o.data.materials.append(ink);return parent(o,p)

# Replace the broad pale moving leaf faces; every new part follows its leaf pivot.
col=bpy.data.collections['08 Sliding access door']
leaves=[bpy.data.objects['LEAF_LEFT_SLIDE'],bpy.data.objects['LEAF_RIGHT_SLIDE']]
for leaf in leaves:
 for o in list(leaf.children_recursive):
  if o.type=='MESH':stash(o)
 x=leaf.matrix_world.translation.x
 prism('Dark pressure leaf',(x,1.25,11.65),1.34,2.86,.10,frame,col,leaf,.11)
 prism('Leaf inset panel',(x,1.30,11.708),1.19,2.57,.014,paint,col,leaf,.10)
 ring('Leaf recessed perimeter',(x,1.30,11.722),1.22,2.61,.018,.012,metal,col,leaf,.10)
 prism('Cyan port dark seat',(x,1.86,11.726),.18,.82,.025,dark,col,leaf,.035)
 prism('Cyan vertical vision port',(x,1.86,11.742),.075,.65,.009,cyan,col,leaf,.012)
 for xx in [x-.067,x+.067]:box('Port edge rebate',(xx,1.86,11.744),(.009,.72,.009),metal,col,leaf)
 prism('Lower impact panel',(x,.40,11.729),1.10,.38,.018,metal,col,leaf,.06)
 box('Leaf ochre datum',(x,.94,11.733),(1.13,.027,.010),metal,col,leaf)
 hx=x+(.43 if x<0 else -.43)
 prism('Recessed manual pull',(hx,1.28,11.73),.105,.25,.018,dark,col,leaf,.018)
 box('Manual pull bar',(hx,1.28,11.741),(.021,.17,.018),metal,col,leaf)
 for xx in [x-.52,x+.52]:
  for yy in [.58,2.43]:screw((xx,yy,11.736),col,leaf)
 box('Flexible center seal',(-.012 if x<0 else .012,1.24,11.72),(.018,2.78,.02),dark,col,leaf)
 text('PRESSURE / A-07',(x,2.36,11.739),.034,col,leaf)
 text('KEEP CLEAR',(x,.65,11.741),.026,col,leaf)
stationary=bpy.data.objects['SLOT / Sliding stationary frame']
ring('Access outer pressure arch',(0,1.43,12.052),3.35,3.04,.09,.075,paint,col,stationary,.30,open_base=True)
ring('Access stepped inner arch',(0,1.43,12.098),3.16,2.86,.035,.045,metal,col,stationary,.26,open_base=True)
for x in [-1.55,1.55]:
 for y in [.45,2.36]:
  prism('Access armor corner',(x,y,12.13),.13,.26,.035,frame,col,stationary,.03)
  screw((x,y,12.154),col,stationary)

# Docking keeps its real window/labels; add stepped octagonal tooling and locks.
col=bpy.data.collections['07 Fixed docking door'];dock=bpy.data.objects['SLOT / Fixed docking door']
for o in col.objects:
 if o.type=='MESH' and 'Warm_grey_alloy' in o.name:
  o.data.materials.clear();o.data.materials.append(paint)
ring('Docking pressure outer tooling',(0,1.40,18.145),2.85,2.79,.075,.055,metal,col,dock,.31)
ring('Docking black recessed seal',(0,1.40,18.112),2.66,2.61,.035,.020,dark,col,dock,.28)
ring('Docking amber pressure index',(0,1.40,18.097),2.56,2.51,.011,.009,warm,col,dock,.26)
ring('Inspection window machined bezel',(0,1.58,18.174),1.04,.56,.075,.035,metal,col,dock,.10)
for x in [-1.05,1.05]:
 for y in [.67,1.98]:
  prism('Pressure dog locking seat',(x,y,18.163),.14,.19,.045,frame,col,dock,.025)
  screw((x,y,18.133),col,dock,r=.026)
for x in [-1.26,1.26]:
 for y in [.28,2.48]:screw((x,y,18.104),col,dock)

# Deep, stepped perimeter around the one clear panorama: no central mullions.
col=bpy.data.collections['14 Clear panoramic observation']
for o in list(col.objects):
 if 'Panoramic structural perimeter' in o.name or 'Panoramic inner metal rebate' in o.name:stash(o)
ring('Observation outer pressure frame',(-4.84,1.52,15.15),6.40,2.18,.12,.16,paint,col,c=.28,axis='side')
ring('Observation black cavity',(-4.72,1.52,15.15),6.17,1.95,.045,.09,dark,col,c=.23,axis='side')
ring('Observation inner machined rim',(-4.655,1.52,15.15),6.08,1.86,.035,.045,metal,col,c=.21,axis='side')
for y,sy in [(.58,-1),(2.46,1)]:
 for z,sz in [(12.16,-1),(18.14,1)]:
  o=box('Observation corner gusset',(-4.61,y,z),(.034,.115,.31),frame,col);o.rotation_euler.x=sy*sz*pi/4
  for off in [-.085,.085]:screw((-4.582,y+off*sy,z-off*sz),col,axis='side')
for y in [.60,2.44]:
 for z in [13.05,14.10,16.20,17.25]:
  box('Perimeter expansion joint',(-4.622,y,z),(.016,.065,.016),dark,col)
  screw((-4.604,y,z+.045),col,axis='side',r=.009)
text('OBSERVATION / PRESSURE GLAZING',(-4.596,2.485,15.15),.035,col,angle=pi/2)

# Copy-only travel test proves new leaf ornaments move with the real pivots.
bpy.context.view_layer.update();test=bpy.data.collections.new('TEMP / Door travel validation');s.collection.children.link(test)
travel_results=[]
for leaf,travel in zip(leaves,[-1.37,1.37]):
 pivot=leaf.copy();pivot.parent=None;pivot.matrix_world=leaf.matrix_world.copy();test.objects.link(pivot)
 pairs=[]
 for child in leaf.children:
  if child.get('archived'):continue
  copy=child.copy();copy.parent=pivot;copy.matrix_parent_inverse=child.matrix_parent_inverse.copy();copy.matrix_basis=child.matrix_basis.copy();test.objects.link(copy);pairs.append((child,copy))
 bpy.context.view_layer.update();initial=[o.matrix_world.translation.copy() for _,o in pairs];pivot.location.x+=travel;bpy.context.view_layer.update()
 for (_,copy),start in zip(pairs,initial):
  delta=copy.matrix_world.translation-start;assert abs(delta.x-travel)<1e-5 and abs(delta.y)<1e-5 and abs(delta.z)<1e-5
 travel_results.append({'pivot':leaf.name,'partsFollowing':len(pairs),'testedTravel':travel,'openCenterX':pivot.location.x})
for o in list(test.objects):bpy.data.objects.remove(o,do_unlink=True)
bpy.data.collections.remove(test)
for name,(world,local) in snapshot.items():
 o=bpy.data.objects[name]
 assert all(abs(a-b)<1e-6 for ra,rb in zip(world,o.matrix_world) for a,b in zip(ra,rb)),name
 assert all(abs(a-b)<1e-6 for ra,rb in zip(local,o.matrix_local) for a,b in zip(ra,rb)),name
s['detail_architecture']=1
(root/'detail-architecture-audit.json').write_text(json.dumps({'retired':retired,'preservedSlots':slots,'copyTravelTests':travel_results,'runtimeChanged':False},indent=2))
version=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=version
print('ARCHITECTURE_DETAIL_READY',travel_results)
