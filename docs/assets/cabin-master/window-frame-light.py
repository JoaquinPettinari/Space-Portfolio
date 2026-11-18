"""Constructive frame joints and recessed, warm ledge illumination."""
import bpy,bmesh,ast,json
from pathlib import Path
from math import pi
from mathutils import Vector,Matrix
s=bpy.context.scene;assert not s.get('window_frame_light');root=Path(bpy.data.filepath).parent
source=ast.parse((root/'detail-architecture.py').read_text());exec(compile(ast.Module(body=[n for n in source.body if isinstance(n,ast.FunctionDef)],type_ignores=[]),'shared geometry','exec'))
col=bpy.data.collections['20 Observation ledge and keepsakes'];archive=bpy.data.collections['90 Archive / Superseded layout - excluded'];retired=[]
paint=bpy.data.materials['WINDOW / Satin graphite finish'];metal=bpy.data.materials['WINDOW / Brushed edge alloy'];dark=bpy.data.materials['STUDIO / Carbon rubber'];frame=bpy.data.materials['STUDIO / Powder coated structural rails']
slots=['SLOT / Fixed docking door','SLOT / Sliding leaves','SLOT / Sliding stationary frame','SLOT / Credential terminal','SLOT / Full NASA EMU','LEAF_LEFT_SLIDE','LEAF_RIGHT_SLIDE'];snap={n:(bpy.data.objects[n].matrix_world.copy(),bpy.data.objects[n].matrix_local.copy()) for n in slots}
def tris():
 dg=bpy.context.evaluated_depsgraph_get();n=0
 for o in s.objects:
  if o.hide_render or o.get('archived') or o.type not in {'MESH','CURVE','FONT'}:continue
  e=o.evaluated_get(dg);m=e.to_mesh();m.calc_loop_triangles();n+=len(m.loop_triangles);e.to_mesh_clear()
 return n
def lights():return {o.name:{'energy':o.data.energy,'color':list(o.data.color),'position':list(o.location),'size':getattr(o.data,'size',None)} for o in s.objects if o.type=='LIGHT'}
before=tris();lightbefore=lights();exposure=s.view_settings.exposure
# Segment boundaries and replaceable corner shoes follow the octagonal pressure frame.
for y,sy in [(2.43,1),(.63,-1)]:
 for z,sz in [(12.22,-1),(18.08,1)]:
  o=box('Pressure-frame chamfer corner shoe',(-4.315,y,z),(.045,.10,.30),paint,col);o.rotation_euler.x=sy*sz*pi/4
  for off in [-.085,.085]:screw((-4.285,y+sy*off,z-sz*off),col,axis='side',r=.010)
for z in [13.45,15.15,16.85]:
 box('Upper frame recessed construction joint',(-4.338,2.58,z),(.018,.115,.012),dark,col)
 for dz in [-.043,.043]:screw((-4.324,2.58,z+dz),col,axis='side',r=.009)
# A narrow inner seal remains outside the existing clear aperture.
ring('Window inner seal transition',(-4.245,1.53,15.15),6.055,1.885,.018,.016,dark,col,c=.285,axis='side')
# Existing isolated emitters are archived, not layered with their replacements.
for o in list(col.objects):
 if 'Ledge recessed warm strip seat' in o.name or 'Ledge amber underside diffuser' in o.name:stash(o)
amber=bpy.data.materials['CABIN / REFERENCE / Warm diffuser'].copy();amber.name='WINDOW / Recessed amber diffuser';p=next(n for n in amber.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(.35,.12,.025,1);p.inputs['Emission Color'].default_value=(1,.36,.075,1);p.inputs['Emission Strength'].default_value=2.2
for o in col.objects:
 if 'Window amber inset' in o.name:o.data.materials.clear();o.data.materials.append(amber)
for z in [13.15,15.15,17.15]:
 box('Ledge recessed light housing',(-4.035,.707,z),(.17,.034,1.48),frame,col)
 box('Ledge warm opal optical insert',(-4.035,.683,z),(.105,.010,1.35),amber,col)
 box('Ledge glare shielding front lip',(-3.955,.682,z),(.018,.064,1.48),metal,col)
 box('Ledge recessed rear return',(-4.116,.690,z),(.014,.045,1.48),frame,col)
 for zz in [z-.72,z+.72]:box('Channel removable end cap',(-4.035,.683,zz),(.17,.050,.035),paint,col)
 d=bpy.data.lights.new('Observation ledge warm spill','AREA');d.energy=4;d.color=(1,.48,.16);d.shape='RECTANGLE';d.size=.08;d.size_y=1.28
 o=bpy.data.objects.new('Observation ledge warm spill',d);bpy.data.collections['10 Lighting and cameras'].objects.link(o);o.location=(-4.035,-z,.669);o['preview_light']=True;o['source']='Recessed observation ledge channel'
bpy.context.view_layer.update()
for n,(world,local) in snap.items():
 o=bpy.data.objects[n]
 assert all(abs(a-b)<1e-6 for ra,rb in zip(world,o.matrix_world) for a,b in zip(ra,rb)),n
 assert all(abs(a-b)<1e-6 for ra,rb in zip(local,o.matrix_local) for a,b in zip(ra,rb)),n
assert s.view_settings.exposure==exposure
after=tris();s['window_frame_light']=1
(root/'window-frame-light-audit.json').write_text(json.dumps({'trianglesBefore':before,'trianglesAfter':after,'preservedSlots':slots,'archivedReplacements':retired,'lightsBefore':lightbefore,'lightsAfter':lights(),'addedPracticalLights':3,'globalExposureUnchanged':True,'propsUnchanged':True,'runtimeChanged':False},indent=2))
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
print('WINDOW_FRAME_LIGHT_SAVED',before,after)
