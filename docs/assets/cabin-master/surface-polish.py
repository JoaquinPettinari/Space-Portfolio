"""Pressure-wall panel construction, door guide hardware and counterbored deck fixings."""
import bpy,bmesh,ast,json
from pathlib import Path
from math import pi,cos,sin
from mathutils import Vector,Matrix
s=bpy.context.scene;assert not s.get('surface_polish');root=Path(bpy.data.filepath).parent
source=ast.parse((root/'detail-architecture.py').read_text());exec(compile(ast.Module(body=[n for n in source.body if isinstance(n,ast.FunctionDef)],type_ignores=[]),'shared geometry','exec'))
paint=bpy.data.materials['STUDIO / Warm graphite enamel'];metal=bpy.data.materials['STUDIO / Worn machined bronze steel'];dark=bpy.data.materials['STUDIO / Carbon rubber'];frame=bpy.data.materials['STUDIO / Powder coated structural rails'];ink=bpy.data.materials['STUDIO / Warm stencil ink']
archive=bpy.data.collections['90 Archive / Superseded layout - excluded'];retired=[]
col=bpy.data.collections.new('19 Surface construction polish');s.collection.children.link(col)
slots=['SLOT / Fixed docking door','SLOT / Sliding leaves','SLOT / Sliding stationary frame','SLOT / Credential terminal','SLOT / Full NASA EMU','LEAF_LEFT_SLIDE','LEAF_RIGHT_SLIDE']
snapshot={n:(bpy.data.objects[n].matrix_world.copy(),bpy.data.objects[n].matrix_local.copy()) for n in slots}
def triangles():
 dg=bpy.context.evaluated_depsgraph_get();total=0
 for o in s.objects:
  if o.hide_render or o.get('archived') or o.type not in {'MESH','CURVE','FONT'}:continue
  e=o.evaluated_get(dg);m=e.to_mesh();m.calc_loop_triangles();total+=len(m.loop_triangles);e.to_mesh_clear()
 return total
before=triangles()
# Framed pressure-wall access bays sit on the two genuinely blind end-wall areas.
for x,z,w,reverse in [(2.68,18.155,1.92,False),(-3.64,12.035,.98,True)]:
 direction=1 if reverse else -1
 prism('Pressure-wall joint backing',(x,1.43,z),w,2.34,.025,dark,col,c=.16)
 ring('Wall access structural surround',(x,1.43,z+direction*.023),w-.035,2.30,.055,.035,frame,col,c=.15)
 prism('Removable wall upper cover',(x,1.81,z+direction*.046),w-.18,1.31,.025,paint,col,c=.10)
 prism('Removable wall lower cover',(x,.70,z+direction*.046),w-.18,.80,.025,paint,col,c=.07)
 for xx in [x-w/2-.04,x+w/2+.04]:
  box('Wall vertical structural spine',(xx,1.43,z+direction*.025),(.055,2.48,.065),frame,col)
 for y in [.38,1.10,2.29]:
  for xx in [x-w/2+.16,x+w/2-.16]:screw((xx,y,z+direction*.065),col,r=.015)
 for y in [.49,.56,.63,.70]:box('Wall service ventilation rebate',(x,y,z+direction*.062),(w-.40,.016,.009),dark,col)
 text('PRESSURE SERVICES / 03' if not reverse else 'AUX / 04',(x,2.12,z+direction*.067),.042 if not reverse else .036,col,angle=pi if not reverse else 0)
 box('Wall recessed service pull',(x,1.34,z+direction*.063),(.25,.035,.014),dark,col)

# Slider guide shoes and protected locking cylinders travel with their respective leaf.
leaves=[bpy.data.objects['LEAF_LEFT_SLIDE'],bpy.data.objects['LEAF_RIGHT_SLIDE']]
for leaf in leaves:
 x=leaf.matrix_world.translation.x
 for y in [.24,2.51]:
  prism('Leaf guide shoe housing',(x, y,11.759),.42,.13,.030,frame,col,leaf,c=.025)
  box('Guide shoe wear insert',(x,y,11.778),(.30,.043,.012),metal,col,leaf)
  for xx in [x-.17,x+.17]:screw((xx,y,11.784),col,leaf,r=.012)
 xx=x+(-.46 if x<0 else .46)
 for y in [.71,2.06]:
  prism('Leaf compression pin shroud',(xx,y,11.762),.10,.23,.025,frame,col,leaf,c=.022)
  box('Protected compression pin',(xx,y,11.779),(.028,.13,.014),metal,col,leaf)
stationary=bpy.data.objects['SLOT / Sliding stationary frame']
prism('Static upper actuator inspection cover',(0,2.88,12.145),.84,.115,.024,frame,col,stationary,c=.025)
for x in [-.36,.36]:screw((x,2.88,12.165),col,stationary,r=.012)
dock=bpy.data.objects['SLOT / Fixed docking door']
for x in [-1.05,1.05]:
 prism('Docking pressure latch protection',(x,1.04,18.114),.16,.31,.035,frame,col,dock,c=.030)
 box('Docking protected lock indicator',(x,1.04,18.089),(.035,.17,.015),metal,col,dock)
 for y in [.93,1.15]:screw((x,y,18.085),col,dock,r=.012)

# Replace only the four existing register faces with counterbored copies.
deck=bpy.data.collections['17 Turnaround deck panels'];newfloor=[]
faces=[o for o in deck.objects if o.name.startswith('DETAIL / Large register dark face')]
for original in faces:
 pts=[original.matrix_world@Vector(v) for v in original.bound_box];x=(min(p.x for p in pts)+max(p.x for p in pts))/2;z=-(min(p.y for p in pts)+max(p.y for p in pts))/2
 face=original.copy();face.data=original.data.copy();deck.objects.link(face);face.name='POLISH / Counterbored register face';stash(original);newfloor.append(face)
 # The counterbores cut the actual face; the existing captive head is seated below deck level.
 for xx in [x-1.48,x+1.48]:
  for zz in [z-.64,z+.64]:
   bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=.027,depth=.04,location=xyz((xx,.003,zz)));cut=bpy.context.object
   mod=face.modifiers.new('Recessed captive fastener well','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cut;bpy.context.view_layer.objects.active=face;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
   # Annular machined lip, with an open center instead of a flat sticker disc.
   vs=[]
   for yy in [.006,.0098]:
    for r in [.033,.027]:vs.extend([(xx+r*cos(i*2*pi/16),yy,zz+r*sin(i*2*pi/16)) for i in range(16)])
   fs=[]
   for i in range(16):
    j=(i+1)%16;fs.extend([(i,j,16+j,16+i),(32+i,48+i,48+j,32+j),(i,32+i,32+j,j),(16+i,16+j,48+j,48+i)])
   lip=mesh('Counterbore machined lip',vs,fs,metal,deck,bevel=0);newfloor.append(lip)
 for o in deck.objects:
  if o.name.startswith('DETAIL / Register captive bolt') and abs(o.location.x-x)<1.6 and abs(-o.location.y-z)<.7:o.location.z=.0055
 # Short corner rub strips follow the register perimeter; no random rust or added grip.
 for sx in [-1,1]:
  for sz in [-1,1]:
   for at,size in [((x+sx*1.42,.0103,z+sz*.681),(.18,.001,.006)),((x+sx*1.53,.0103,z+sz*.57),(.006,.001,.16))]:
    o=box('Register corner wear land',at,size,metal,deck);newfloor.append(o)

# Validate the full active ornament hierarchy on temporary copies at actual travel.
bpy.context.view_layer.update();test=bpy.data.collections.new('TEMP / Surface door validation');s.collection.children.link(test);travel=[]
for leaf,delta in zip(leaves,[-1.37,1.37]):
 pivot=leaf.copy();pivot.parent=None;pivot.matrix_world=leaf.matrix_world.copy();test.objects.link(pivot);copies=[]
 for child in leaf.children:
  if child.get('archived') or child.hide_render:continue
  c=child.copy();c.parent=pivot;c.matrix_parent_inverse=child.matrix_parent_inverse.copy();c.matrix_basis=child.matrix_basis.copy();test.objects.link(c);copies.append(c)
 bpy.context.view_layer.update();starts=[o.matrix_world.translation.copy() for o in copies];pivot.location.x+=delta;bpy.context.view_layer.update()
 for o,p in zip(copies,starts):assert (o.matrix_world.translation-p-Vector((delta,0,0))).length<1e-5
 travel.append({'pivot':leaf.name,'partsFollowing':len(copies),'travel':delta,'openCenterX':pivot.location.x})
for o in list(test.objects):bpy.data.objects.remove(o,do_unlink=True)
bpy.data.collections.remove(test)
for n,(world,local) in snapshot.items():
 o=bpy.data.objects[n]
 assert all(abs(a-b)<1e-6 for ra,rb in zip(world,o.matrix_world) for a,b in zip(ra,rb)),n
 assert all(abs(a-b)<1e-6 for ra,rb in zip(local,o.matrix_local) for a,b in zip(ra,rb)),n
highest=max((o.matrix_world@Vector(v)).z for o in deck.objects if o.type=='MESH' for v in o.bound_box);assert highest<.025
after=triangles();s['surface_polish']=1
(root/'surface-polish-audit.json').write_text(json.dumps({'trianglesBefore':before,'trianglesAfter':after,'floorHighestY':highest,'slotsPreserved':slots,'copyTravelTests':travel,'archivedReplacements':retired,'activeObjects':sum(not o.hide_render and not o.get('archived') for o in s.objects),'archivedObjects':len(archive.objects),'runtimeChanged':False},indent=2))
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
print('SURFACE_POLISH_SAVED',before,after,highest,travel)
