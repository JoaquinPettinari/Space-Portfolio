"""Local vestibule surface response and two-source light balance; no geometry changes."""
import bpy,json
from pathlib import Path
from mathutils import Vector
s=bpy.context.scene;assert not s.get('vestibule_material_light');root=Path(bpy.data.filepath).parent;col=bpy.data.collections['21 Docking vestibule - studio only']
slots=['SLOT / Fixed docking door','SLOT / Sliding leaves','SLOT / Sliding stationary frame','SLOT / Credential terminal','SLOT / Full NASA EMU','LEAF_LEFT_SLIDE','LEAF_RIGHT_SLIDE']
snap={n:([list(r) for r in bpy.data.objects[n].matrix_world],[list(r) for r in bpy.data.objects[n].matrix_local]) for n in slots}
geometry={o.name:([list(r) for r in o.matrix_world],len(o.data.vertices) if o.type=='MESH' else len(o.data.splines) if o.type=='CURVE' else o.data.body) for o in s.objects if o.type in {'MESH','CURVE','FONT'}}
def lightdata(o):return {'energy':o.data.energy,'color':list(o.data.color),'position':list(o.location),'rotation':list(o.rotation_euler),'size':o.data.size,'sizeY':o.data.size_y}
outside={o.name:lightdata(o) for o in s.objects if o.type=='LIGHT' and o.name not in col.objects};beforelights={o.name:lightdata(o) for o in col.objects if o.type=='LIGHT'}
exposure=s.view_settings.exposure;cameras={o.name:[list(r) for r in o.matrix_world] for o in s.objects if o.type=='CAMERA'}
def matdata(m):
 p=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
 return {'name':m.name,'principled':{k:list(p.inputs[k].default_value) if k=='Base Color' else p.inputs[k].default_value for k in ['Base Color','Roughness','Metallic','Coat Weight','Transmission Weight','IOR']} if p else {},'ramps':[[list(e.color) for e in n.color_ramp.elements] for n in m.node_tree.nodes if n.type=='VALTORGB'],'mix':[n.inputs[0].default_value for n in m.node_tree.nodes if n.type=='MIX_SHADER'],'ranges':[[n.inputs['To Min'].default_value,n.inputs['To Max'].default_value] for n in m.node_tree.nodes if n.type=='MAP_RANGE']}
glass=bpy.data.materials['VESTIBULE / Clear inspection glass'];glassbefore=matdata(glass)
oldnames=['WINDOW / Satin graphite finish','VESTIBULE / Pressure leaf enamel','WINDOW / Brushed edge alloy','STUDIO / Powder coated structural rails'];beforemats={n:matdata(bpy.data.materials[n]) for n in oldnames}
def rough(m,low,high):
 p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 if p.inputs['Roughness'].is_linked:
  n=p.inputs['Roughness'].links[0].from_node
  if n.type=='VALTORGB':n.color_ramp.elements[0].color=(low,low,low,1);n.color_ramp.elements[-1].color=(high,high,high,1)
  elif n.type=='MAP_RANGE':n.inputs['To Min'].default_value=low;n.inputs['To Max'].default_value=high
 else:p.inputs['Roughness'].default_value=(low+high)/2
 return p
copies={}
for name in oldnames:
 m=bpy.data.materials[name].copy();m.name='VESTIBULE / Balanced '+name.split(' / ')[-1];copies[name]=m;p=rough(m,.32,.44)
 if name in oldnames[:2]:
  p.inputs['Metallic'].default_value=.35;p.inputs['Coat Weight'].default_value=.13
  if p.inputs['Base Color'].is_linked:
   n=p.inputs['Base Color'].links[0].from_node
   if n.type=='VALTORGB':n.color_ramp.elements[0].color=(.037,.043,.044,1);n.color_ramp.elements[-1].color=(.068,.075,.074,1)
 elif name==oldnames[2]:p=rough(m,.23,.34);p.inputs['Base Color'].default_value=(.40,.355,.28,1);p.inputs['Metallic'].default_value=.88
 else:p.inputs['Base Color'].default_value=(.032,.039,.040,1);p.inputs['Metallic'].default_value=.48
 for n in m.node_tree.nodes:
  if n.type=='BUMP':n.inputs['Strength'].default_value=.08;n.inputs['Distance'].default_value=.001
floor=bpy.data.materials['MASTER / Graphite alloy deck'].copy();floor.name='VESTIBULE / Satin deck alloy';p=rough(floor,.31,.43);p.inputs['Metallic'].default_value=.73;p.inputs['Coat Weight'].default_value=.05
for o in col.objects:
 if o.type not in {'MESH','CURVE','FONT'}:continue
 for i,m in enumerate(o.data.materials):
  if m and m.name in copies:o.data.materials[i]=copies[m.name]
 if 'Vestibule continuous deck' in o.name or 'Vestibule deck access plate' in o.name:o.data.materials[0]=floor
# Keep both supports beneath their actual fixtures; aim toward the outer leaf, not straight down.
for o in col.objects:
 if o.type!='LIGHT':continue
 left=o.location.x<0;o.location.z=2.43;o.data.energy=62 if left else 48;o.data.color=(1,.73,.49) if left else (1,.81,.62);o.data.size=.22;o.data.size_y=.68
 target=Vector((.25 if left else -.25,-20.85,1.32));o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
bpy.context.view_layer.update()
assert geometry=={o.name:([list(r) for r in o.matrix_world],len(o.data.vertices) if o.type=='MESH' else len(o.data.splines) if o.type=='CURVE' else o.data.body) for o in s.objects if o.type in {'MESH','CURVE','FONT'}}
for n,(world,local) in snap.items():assert world==[list(r) for r in bpy.data.objects[n].matrix_world] and local==[list(r) for r in bpy.data.objects[n].matrix_local]
assert outside=={o.name:lightdata(o) for o in s.objects if o.type=='LIGHT' and o.name not in col.objects}
assert glassbefore==matdata(glass);assert exposure==s.view_settings.exposure;assert cameras=={o.name:[list(r) for r in o.matrix_world] for o in s.objects if o.type=='CAMERA'}
dg=bpy.context.evaluated_depsgraph_get();tris=0
for o in s.objects:
 if o.hide_render or o.get('archived') or o.type not in {'MESH','CURVE','FONT'}:continue
 e=o.evaluated_get(dg);m=e.to_mesh();m.calc_loop_triangles();tris+=len(m.loop_triangles);e.to_mesh_clear()
assert tris==397177;s['vestibule_material_light']=1
(root/'vestibule-material-light-audit.json').write_text(json.dumps({'trianglesBefore':397177,'trianglesAfter':tris,'geometryUnchanged':True,'preservedSlots':slots,'glassUnchanged':True,'camerasUnchanged':True,'globalExposureUnchanged':True,'outsideLightsUnchanged':True,'newLights':0,'lightsBefore':beforelights,'lightsAfter':{o.name:lightdata(o) for o in col.objects if o.type=='LIGHT'},'materialsBefore':beforemats,'materialsAfter':[matdata(m) for m in [*copies.values(),floor]],'runtimeChanged':False},indent=2))
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
print('VESTIBULE_MATERIAL_LIGHT_SAVED',tris)
