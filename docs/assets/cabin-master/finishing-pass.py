"""Construction joints, EVA hardware and functional-looking service connections."""
import bpy,bmesh,ast,json
from pathlib import Path
from math import pi,cos,sin
from mathutils import Vector,Matrix
s=bpy.context.scene;assert not s.get('finishing_pass')
root=Path(bpy.data.filepath).parent
# Reuse the established geometry helpers without replaying the earlier art pass.
source=ast.parse((root/'detail-architecture.py').read_text())
exec(compile(ast.Module(body=[n for n in source.body if isinstance(n,ast.FunctionDef)],type_ignores=[]),'shared architecture helpers','exec'))
paint=bpy.data.materials['STUDIO / Warm graphite enamel'];metal=bpy.data.materials['STUDIO / Worn machined bronze steel'];dark=bpy.data.materials['STUDIO / Carbon rubber'];frame=bpy.data.materials['STUDIO / Powder coated structural rails'];ink=bpy.data.materials['STUDIO / Warm stencil ink']
archive=bpy.data.collections['90 Archive / Superseded layout - excluded'];retired=[]
col=bpy.data.collections.new('18 Construction finishing');s.collection.children.link(col)
slots=['SLOT / Fixed docking door','SLOT / Sliding leaves','SLOT / Sliding stationary frame','SLOT / Credential terminal','SLOT / Full NASA EMU','LEAF_LEFT_SLIDE','LEAF_RIGHT_SLIDE']
snapshot={n:(bpy.data.objects[n].matrix_world.copy(),bpy.data.objects[n].matrix_local.copy()) for n in slots}
def stats():
 active=[o for o in s.objects if not o.hide_render and not o.get('archived')];dg=bpy.context.evaluated_depsgraph_get();tris=0
 for o in active:
  if o.type not in {'MESH','CURVE','FONT'}:continue
  e=o.evaluated_get(dg);m=e.to_mesh();m.calc_loop_triangles();tris+=len(m.loop_triangles);e.to_mesh_clear()
 return {'activeObjects':len(active),'evaluatedTriangles':tris,'archivedObjects':len(archive.objects)}
before=stats()
def tube(name,points,r,mat):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.resolution_u=2;d.bevel_depth=r;d.bevel_resolution=2
 p=d.splines.new('POLY');p.points.add(len(points)-1)
 for v,co in zip(p.points,points):v.co=(*xyz(co),1)
 o=bpy.data.objects.new('FINISH / '+name,d);col.objects.link(o);d.materials.append(mat);return o
def disc(name,p,r,depth,mat,side=True):
 bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=depth,location=xyz(p));o=bpy.context.object;o.name='FINISH / '+name
 o.rotation_euler=(0,pi/2,0) if side else (pi/2,0,0)
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.data.materials.append(mat);return o

# Ceiling joints follow the cassette gaps, with end blocks on existing luminaires.
for z in [13.465,14.695,15.925,17.145]:
 box('Cassette transverse recessed joint',(0,3.116,z),(5.66,.018,.026),dark,col)
 for x in [-2.78,-.12,.12,2.78]:box('Ceiling joint retaining clip',(x,3.103,z),(.085,.025,.13),metal,col)
for o in list(bpy.data.collections['03 Ceiling'].objects):
 if 'Ceiling light housing' not in o.name:continue
 pts=[o.matrix_world@Vector(v) for v in o.bound_box];xx=sum(p.x for p in pts)/8;zz=[-p.y for p in pts]
 for z in [min(zz)+.025,max(zz)-.025]:box('Luminaire captive end cap',(xx,3.041,z),(.18,.10,.055),frame,col)
# Wide shoulder duct covers follow the longitudinal construction zone, not the glass.
for side in [-1,1]:
 for z in [13.35,15.15,16.95]:
  o=box('Shoulder ventilation cassette',(side*3.65,3.035,z),(.46,.055,1.10),frame,col);o.rotation_euler.y=-side*.48
  for dz in [-.35,-.175,0,.175,.35]:
   o=box('Shoulder duct slot',(side*3.625,3.00,z+dz),(.32,.012,.026),dark,col);o.rotation_euler.y=-side*.48
  for dz in [-.48,.48]:box('Duct end clamp',(side*3.62,2.99,z+dz),(.34,.025,.045),metal,col)
# Low removable wall panels below the observation opening, leaving the view clear.
for z in [12.95,14.42,15.89,17.36]:
 prism('Observation sill service panel',(-4.42,.255,z),1.39,.25,.018,paint,col,c=.035,axis='side')
 for dz in [-.62,.62]:screw((-4.404,.255,z+dz),col,axis='side',r=.011)

# EVA front gasket, hinges and latches only on the frame margins.
ring('EVA glass compression seal',(-2.17,1.365,17.239),1.065,2.32,.008,.006,dark,col,c=.012)
for y in [.62,2.12]:
 box('EVA hinge mounting leaf',(-2.708,y,17.222),(.065,.14,.025),metal,col)
 tube('EVA hinge pin',[(-2.708,y-.068,17.195),(-2.708,y+.068,17.195)],.012,frame)
 for yy in [y-.045,y+.045]:screw((-2.735,yy,17.204),col,r=.007)
for y in [.80,1.85]:
 prism('EVA compression latch seat',(-1.635,y,17.218),.095,.17,.022,frame,col,c=.016)
 box('EVA locking cam',(-1.635,y,17.194),(.035,.09,.020),metal,col)
 screw((-1.635,y+.056,17.180),col,r=.010)
prism('EVA inventory plate',(-2.17,.147,17.205),.66,.085,.012,frame,col,c=.008)
text('EMU-01  /  EVA READY',(-2.17,.133,17.195),.027,col)
for x in [-2.68,-1.66]:
 for z in [17.31,18.02]:box('EVA base anchor shoe',(x,.235,z),(.10,.065,.12),metal,col)

# Instruments bridge the real pipework, in gaps between existing junction modules.
disc('Pressure gauge bezel',(3.705,1.48,15.89),.105,.033,metal)
disc('Pressure gauge dial',(3.684,1.48,15.89),.088,.009,dark)
for i in range(9):
 a=(-pi*.72)+i*pi*1.44/8
 tube('Gauge scale tick',[(3.677,1.48+cos(a)*.070,15.89+sin(a)*.070),(3.677,1.48+cos(a)*.079,15.89+sin(a)*.079)],.0016,ink)
tube('Gauge pressure needle',[(3.674,1.48,15.89),(3.674,1.527,15.85)],.003,ink)
disc('Gauge central spindle',(3.671,1.48,15.89),.009,.007,metal)
tube('Pressure sensor branch',[(3.88,1.48,15.66),(3.80,1.48,15.66),(3.76,1.48,15.73),(3.71,1.48,15.89)],.018,metal)
disc('Isolation valve body',(3.81,.97,15.66),.060,.16,metal)
disc('Isolation valve stem',(3.70,.97,15.66),.020,.08,frame)
points=[(3.65,.97+.075*cos(i*2*pi/24),15.66+.075*sin(i*2*pi/24)) for i in range(25)]
tube('Isolation hand wheel',points,.009,metal)
for a in [0,2*pi/3,4*pi/3]:tube('Valve spoke',[(3.65,.97,15.66),(3.65,.97+.075*cos(a),15.66+.075*sin(a))],.006,metal)
# Flexible harness between modules, clamped and terminated rather than floating.
for z in [15.83,15.91]:
 tube('Electrical module harness',[(3.74,1.63,z),(3.70,1.59,z),(3.70,1.42,z),(3.74,1.37,z)],.008,dark)
 for y in [1.38,1.62]:box('Harness termination gland',(3.74,y,z),(.05,.035,.025),metal,col)
bpy.context.view_layer.update()
for n,(world,local) in snapshot.items():
 o=bpy.data.objects[n]
 assert all(abs(a-b)<1e-6 for ra,rb in zip(world,o.matrix_world) for a,b in zip(ra,rb)),n
 assert all(abs(a-b)<1e-6 for ra,rb in zip(local,o.matrix_local) for a,b in zip(ra,rb)),n
after=stats();s['finishing_pass']=1
(root/'finishing-pass-audit.json').write_text(json.dumps({'before':before,'after':after,'preservedSlots':slots,'newObjects':len(col.objects),'runtimeChanged':False},indent=2))
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
print('FINISHING_SAVED',before,after)

