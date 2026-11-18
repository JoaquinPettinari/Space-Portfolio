"""Real enclosed docking vestibule visible through the existing inspection aperture."""
import bpy,bmesh,ast,json
from pathlib import Path
from math import pi
from mathutils import Vector,Matrix
s=bpy.context.scene;assert not s.get('docking_vestibule');root=Path(bpy.data.filepath).parent
source=ast.parse((root/'detail-architecture.py').read_text());exec(compile(ast.Module(body=[n for n in source.body if isinstance(n,ast.FunctionDef)],type_ignores=[]),'shared geometry','exec'))
col=bpy.data.collections.new('21 Docking vestibule - studio only');s.collection.children.link(col);col['integration_pending']=True
paint=bpy.data.materials['WINDOW / Satin graphite finish'];metal=bpy.data.materials['WINDOW / Brushed edge alloy'];dark=bpy.data.materials['STUDIO / Carbon rubber'];frame=bpy.data.materials['STUDIO / Powder coated structural rails'];ink=bpy.data.materials['STUDIO / Warm stencil ink'];warm=bpy.data.materials['WINDOW / Recessed amber diffuser'];cyan=bpy.data.materials['CABIN / REFERENCE / Cyan status']
slots=['SLOT / Fixed docking door','SLOT / Sliding leaves','SLOT / Sliding stationary frame','SLOT / Credential terminal','SLOT / Full NASA EMU','LEAF_LEFT_SLIDE','LEAF_RIGHT_SLIDE'];snap={n:(bpy.data.objects[n].matrix_world.copy(),bpy.data.objects[n].matrix_local.copy()) for n in slots}
def tris():
 dg=bpy.context.evaluated_depsgraph_get();n=0
 for o in s.objects:
  if o.hide_render or o.get('archived') or o.type not in {'MESH','CURVE','FONT'}:continue
  e=o.evaluated_get(dg);m=e.to_mesh();m.calc_loop_triangles();n+=len(m.loop_triangles);e.to_mesh_clear()
 return n
before=tris();lightsbefore=len([o for o in s.objects if o.type=='LIGHT'])
# Preserve the glass mesh and original shared material; use a local transmission finish.
glassobj=bpy.data.objects['DOCK_CDS_hardware_Inspection_glass.001'];oldglass=glassobj.data.materials[0].name
glass=glassobj.data.materials[0].copy();glass.name='VESTIBULE / Clear inspection glass';p=next(n for n in glass.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(.92,.98,.97,1);p.inputs['Transmission Weight'].default_value=1;p.inputs['Alpha'].default_value=1;p.inputs['Roughness'].default_value=.035;p.inputs['IOR'].default_value=1.45;glassobj.data.materials[0]=glass
# Closed 3.4 m wide, 2.65 m deep room. Original docking door is the near pressure boundary.
box('Vestibule continuous deck',(0,-.065,19.70),(3.50,.13,2.85),frame,col)
box('Vestibule continuous roof',(0,2.78,19.70),(3.50,.14,2.85),frame,col)
for x in [-1.70,1.70]:box('Vestibule pressure side wall',(x,1.36,19.70),(.14,2.86,2.85),frame,col)
box('Vestibule sealed outer bulkhead',(0,1.36,21.065),(3.50,2.86,.14),frame,col)
for x in [-1.48,1.48]:box('Vestibule near jamb closure',(x,1.36,18.355),(.43,2.86,.14),frame,col)
box('Vestibule near overhead closure',(0,2.71,18.355),(2.55,.16,.14),frame,col)
# A static outer closure gives a readable destination through the inspection glass.
static=bpy.data.objects.new('VESTIBULE / Static outer pressure closure',None);col.objects.link(static);static['decorative_only']=True
prism('Outer hatch recessed perimeter',(0,1.36,20.95),1.80,2.46,.08,dark,col,static,c=.24)
prism('Outer hatch pressure leaf',(0,1.36,20.895),1.62,2.29,.045,paint,col,static,c=.20)
ring('Outer hatch machined seal',(0,1.36,20.86),1.65,2.32,.035,.018,metal,col,static,c=.21)
for x in [-.66,.66]:
 for y in [.53,2.15]:
  prism('Outer latch mounting pad',(x,y,20.85),.13,.20,.025,metal,col,static,c=.018)
  screw((x,y,20.825),col,static,r=.018)
text('DOCK / 01',(0,2.03,20.851),.105,col,static,angle=pi)
text('OUTER PRESSURE HATCH',(0,.62,20.85),.052,col,static,angle=pi)
box('Outer hatch cyan status',(0,2.35,20.84),(.42,.025,.012),cyan,col,static)
prism('Hatch manual lock seat',(0,1.30,20.85),.27,.32,.035,frame,col,static,c=.035)
box('Hatch manual lock crossbar',(0,1.30,20.815),(.34,.045,.035),metal,col,static)
box('Hatch manual lock upright',(0,1.30,20.81),(.045,.30,.035),metal,col,static)
def tube(name,points,r,mat):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=2;p=d.splines.new('POLY');p.points.add(len(points)-1)
 for v,co in zip(p.points,points):v.co=(*xyz(co),1)
 o=bpy.data.objects.new('VESTIBULE / '+name,d);col.objects.link(o);d.materials.append(mat);return o
for side in [-1,1]:
 for z in [18.95,20.10]:
  prism('Vestibule side inspection cover',(side*1.615,1.71,z),.96,1.31,.025,paint,col,c=.09,axis='side')
  for zz in [z-.39,z+.39]:screw((side*1.59,2.25,zz),col,axis='side',r=.014)
 tube('Return handrail',[(side*1.62,.98,18.78),(side*1.44,.98,18.91),(side*1.44,.98,20.47),(side*1.62,.98,20.60)],.025,metal)
 for y in [.38,.45,.52,.59]:box('Vestibule ventilation slat',(side*1.615,y,20.12),(.025,.020,.72),dark,col)
 box('Vestibule overhead luminaire housing',(side*.93,2.67,19.70),(.16,.07,1.70),frame,col)
 box('Vestibule warm opal diffuser',(side*.93,2.626,19.70),(.085,.012,1.52),warm,col)
 d=bpy.data.lights.new('Vestibule ceiling practical','AREA');d.energy=42;d.color=(1,.70,.43);d.shape='RECTANGLE';d.size=.12;d.size_y=1.48;o=bpy.data.objects.new('Vestibule ceiling practical',d);col.objects.link(o);o.location=(side*.93,-19.70,2.60);o['preview_light']=True
for z in [18.80,19.63,20.46]:
 box('Vestibule deck access plate',(0,.006,z),(1.35,.012,.71),paint,col)
 for x in [-.64,.64]:box('Vestibule deck edge band',(x,.013,z),(.014,.010,.66),metal,col)
for i in range(13):box('Vestibule inset floor grate bar',(1.16,.012,18.75+i*.16),(.32,.014,.027),metal,col)
# Local finish and clean kick transition beneath the observation bay; no new floor obstacle.
window=bpy.data.collections['20 Observation ledge and keepsakes'];floorcol=bpy.data.collections['17 Turnaround deck panels']
localfloor=bpy.data.materials['MASTER / Graphite alloy deck'].copy();localfloor.name='WINDOW / Perimeter deck satin';p=next(n for n in localfloor.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Metallic'].default_value=.76
if p.inputs['Roughness'].is_linked:
 n=p.inputs['Roughness'].links[0].from_node
 if n.type=='MAP_RANGE':n.inputs['To Min'].default_value=.31;n.inputs['To Max'].default_value=.44
refinished=[]
for o in floorcol.objects:
 if o.type!='MESH':continue
 ps=[o.matrix_world@Vector(v) for v in o.bound_box];center=(min(v.x for v in ps)+max(v.x for v in ps))/2
 if center<-3.25:
  for i,m in enumerate(o.data.materials):
   if m.name=='MASTER / Graphite alloy deck':o.data.materials[i]=localfloor;refinished.append(o.name)
localwall=paint.copy();localwall.name='WINDOW / Lower wall protective enamel';p=next(n for n in localwall.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Coat Weight'].default_value=.10
for o in window.objects:
 if 'Ledge underside service fascia' in o.name:o.data.materials[0]=localwall
for z in [13.22,15.15,17.08]:
 prism('Observation lower kick transition',(-4.40,.105,z),1.85,.13,.025,frame,window,c=.022,axis='side')
 box('Kickplate brushed upper edge',(-4.382,.166,z),(.009,.008,1.74),metal,window)
bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get()
# Inspect the aperture without treating a glass hit as an opaque closure.
aperture=[]
for x in [-.30,0,.30]:
 for y in [1.45,1.58,1.70]:
  origin=Vector((x,-18.265,y));direction=Vector((0,-1,0));hit,loc,n,idx,obj,mat=s.ray_cast(dg,origin,direction)
  assert hit and obj.name in col.objects,(x,y,obj.name if hit else None)
  aperture.append({'x':x,'y':y,'hit':obj.name,'runtimeZ':-loc.y})
for n,(world,local) in snap.items():
 o=bpy.data.objects[n]
 assert all(abs(a-b)<1e-6 for ra,rb in zip(world,o.matrix_world) for a,b in zip(ra,rb)),n
 assert all(abs(a-b)<1e-6 for ra,rb in zip(local,o.matrix_local) for a,b in zip(ra,rb)),n
highest=max((o.matrix_world@Vector(v)).z for o in floorcol.objects if o.type=='MESH' for v in o.bound_box);assert highest<.025
after=tris();s['docking_vestibule']=1
(root/'vestibule-audit.json').write_text(json.dumps({'trianglesBefore':before,'trianglesAfter':after,'lightsBefore':lightsbefore,'lightsAfter':len([o for o in s.objects if o.type=='LIGHT']),'preservedSlots':slots,'originalGlassMaterialPreserved':oldglass,'apertureClosureRays':aperture,'windowFloorRefinished':refinished,'cabinFloorMaxY':highest,'vestibuleBoundsRuntime':{'x':[-1.77,1.77],'y':[-.13,2.85],'z':[18.285,21.135]},'newOuterClosureStatic':True,'runtimeChanged':False},indent=2))
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
print('VESTIBULE_SAVED',before,after,len(aperture))
