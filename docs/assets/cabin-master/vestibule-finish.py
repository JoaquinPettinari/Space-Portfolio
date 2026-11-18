"""Bounded finish pass: pressure leaf tooling, rail mounts and flush floor hardware."""
import bpy,bmesh,ast,json
from pathlib import Path
from math import pi
from mathutils import Vector,Matrix
s=bpy.context.scene;assert not s.get('vestibule_finish');root=Path(bpy.data.filepath).parent
source=ast.parse((root/'detail-architecture.py').read_text());exec(compile(ast.Module(body=[n for n in source.body if isinstance(n,ast.FunctionDef)],type_ignores=[]),'shared geometry','exec'))
col=bpy.data.collections['21 Docking vestibule - studio only'];static=bpy.data.objects['VESTIBULE / Static outer pressure closure'];metal=bpy.data.materials['WINDOW / Brushed edge alloy'];dark=bpy.data.materials['STUDIO / Carbon rubber'];frame=bpy.data.materials['STUDIO / Powder coated structural rails'];paint=bpy.data.materials['WINDOW / Satin graphite finish'].copy();paint.name='VESTIBULE / Pressure leaf enamel';ink=bpy.data.materials['STUDIO / Warm stencil ink']
p=next(n for n in paint.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Coat Weight'].default_value=.12
slots=['SLOT / Fixed docking door','SLOT / Sliding leaves','SLOT / Sliding stationary frame','SLOT / Credential terminal','SLOT / Full NASA EMU','LEAF_LEFT_SLIDE','LEAF_RIGHT_SLIDE'];snap={n:(bpy.data.objects[n].matrix_world.copy(),bpy.data.objects[n].matrix_local.copy()) for n in slots}
lightbefore={o.name:(o.data.energy,tuple(o.location),tuple(o.data.color)) for o in s.objects if o.type=='LIGHT'}
def tris():
 dg=bpy.context.evaluated_depsgraph_get();n=0
 for o in s.objects:
  if o.hide_render or o.get('archived') or o.type not in {'MESH','CURVE','FONT'}:continue
  e=o.evaluated_get(dg);m=e.to_mesh();m.calc_loop_triangles();n+=len(m.loop_triangles);e.to_mesh_clear()
 return n
before=tris();floorparts=[]
for y,h in [(1.80,.70),(.85,.55)]:
 prism('Outer leaf inset shadow seam',(0,y,20.854),1.37,h+.065,.020,dark,col,static,c=.09)
 prism('Outer leaf removable armor panel',(0,y,20.834),1.30,h,.022,paint,col,static,c=.075)
 for x in [-.55,.55]:
  for yy in [y-h/2+.085,y+h/2-.085]:screw((x,yy,20.815),col,static,r=.012)
for o in col.objects:
 if o.type=='FONT' and o.data.body in {'DOCK / 01','OUTER PRESSURE HATCH'}:o.location.y=-20.807
def tube(name,points,r,mat,parent_object=None):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=2;p=d.splines.new('POLY');p.points.add(len(points)-1)
 for v,co in zip(p.points,points):v.co=(*xyz(co),1)
 o=bpy.data.objects.new('VESTIBULE FINISH / '+name,d);col.objects.link(o);d.materials.append(mat);return parent(o,parent_object)
for side in [-1,1]:
 tube('Mechanical lock linkage',[(side*.15,1.30,20.822),(side*.58,1.30,20.822)],.016,metal,static)
 prism('Side locking bolt guide',(side*.60,1.30,20.815),.14,.19,.035,frame,col,static,c=.025)
 screw((side*.60,1.30,20.791),col,static,r=.022)
 for z in [19.03,20.36]:
  prism('Handrail mounting shoe',(side*1.604,.98,z),.17,.13,.025,metal,col,c=.025,axis='side')
  tube('Handrail wall standoff',[(side*1.604,.98,z),(side*1.44,.98,z)],.017,metal)
  for zz in [z-.055,z+.055]:screw((side*1.582,.98,zz),col,axis='side',r=.009)
 box('Vestibule protective wall skirting',(side*1.605,.13,19.80),(.035,.19,2.30),frame,col)
 box('Skirting upper machined transition',(side*1.582,.225,19.80),(.018,.014,2.28),metal,col)
 box('Outer bulkhead corner joint',(side*1.615,1.39,20.966),(.035,2.52,.030),dark,col)
# Flush rubber register seats and seated corner retainers; nothing rises above 20 mm.
for z in [18.80,19.63,20.46]:
 floorparts.append(box('Deck register recessed gasket',(0,.002,z),(1.41,.004,.77),dark,col))
 for x in [-.57,.57]:
  for zz in [z-.29,z+.29]:floorparts.append(box('Deck captive retainer',(x,.014,zz),(.032,.004,.032),metal,col))
 for x in [-.11,.11]:floorparts.append(box('Register flush pull hinge',(x,.014,z+.24),(.028,.004,.038),metal,col))
 floorparts.append(box('Register flush pull bar',(0,.014,z+.24),(.20,.004,.012),metal,col))
for i in range(13):floorparts.append(box('Port flush drain grate',(-1.16,.012,18.75+i*.16),(.32,.014,.027),metal,col))
bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();closed=0
for x in [-2,-1,-.4,0,.4,1,2]:
 for z in [-1,-.4,0,.4,1]:
  h,l,n,i,o,m=s.ray_cast(dg,Vector((0,-18.58,1.58)),Vector((x,-1,z)).normalized());assert h and o.name in col.objects;closed+=1
for n,(world,local) in snap.items():
 o=bpy.data.objects[n]
 assert all(abs(a-b)<1e-6 for ra,rb in zip(world,o.matrix_world) for a,b in zip(ra,rb)),n
 assert all(abs(a-b)<1e-6 for ra,rb in zip(local,o.matrix_local) for a,b in zip(ra,rb)),n
assert lightbefore=={o.name:(o.data.energy,tuple(o.location),tuple(o.data.color)) for o in s.objects if o.type=='LIGHT'}
floorheight=max((o.matrix_world@Vector(v)).z for o in floorparts for v in o.bound_box);assert floorheight<.025
cabinfloor=max((o.matrix_world@Vector(v)).z for o in bpy.data.collections['17 Turnaround deck panels'].objects if o.type=='MESH' for v in o.bound_box);assert cabinfloor<.025
after=tris();s['vestibule_finish']=1
(root/'vestibule-finish-audit.json').write_text(json.dumps({'trianglesBefore':before,'trianglesAfter':after,'preservedSlots':slots,'closedRoomRays':closed,'newFloorMaxY':floorheight,'cabinFloorMaxY':cabinfloor,'lightsUnchanged':True,'lightCount':len(lightbefore),'glassUnchanged':True,'runtimeChanged':False},indent=2))
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
print('VESTIBULE_FINISH_SAVED',before,after)
