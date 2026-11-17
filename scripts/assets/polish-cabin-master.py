"""First whole-cabin lighting/material pass, with separate preview-only UI."""
from pathlib import Path
from math import pi
from mathutils import Vector
import bpy,json
s=bpy.context.scene;assert s.name=='CRUZ DEL SUR / Cabin master'
assert not s.get('whole_cabin_polish')
folder=Path(bpy.data.filepath).parent
def xyz(p):return Vector((p[0],-p[2],p[1]))
# The first review traced the blue patch to a glazing reflection, not geometry.
glass=bpy.data.materials['MASTER / Clear pressure glazing'];n=glass.node_tree.nodes;n.clear();l=glass.node_tree.links
out=n.new('ShaderNodeOutputMaterial');clear=n.new('ShaderNodeBsdfTransparent');reflection=n.new('ShaderNodeBsdfPrincipled')
reflection.inputs['Base Color'].default_value=(.12,.16,.18,1);reflection.inputs['Metallic'].default_value=1;reflection.inputs['Roughness'].default_value=.18
mix=n.new('ShaderNodeMixShader');mix.inputs[0].default_value=.025;l.new(clear.outputs[0],mix.inputs[1]);l.new(reflection.outputs[0],mix.inputs[2]);l.new(mix.outputs[0],out.inputs[0])
for o in bpy.data.objects:
 if 'Window space fill' in o.name:o.visible_glossy=False
# Use an explicit full-image UV, rather than a cube UV sampling a black corner.
back=bpy.data.objects['MASTER / Space visible beyond windows'];old=back.data
points=[(-11,-.5,10.5),(-11,-.5,20.5),(-11,4.7,20.5),(-11,4.7,10.5)]
d=bpy.data.meshes.new('Distant star backdrop UV');d.from_pydata([xyz(p) for p in points],[],[(0,1,2,3)]);d.update();d.materials.append(old.materials[0]);back.data=d;back.matrix_world.identity()
uv=d.uv_layers.new(name='UVMap')
for loop,value in zip(uv.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=value
em=next(n for n in d.materials[0].node_tree.nodes if n.type=='EMISSION');em.inputs['Strength'].default_value=1.7
# Finely worn, dark metal panels, with roughness variation rather than flat grey.
floor=bpy.data.materials.new('MASTER / Graphite alloy deck');floor.use_nodes=True;n=floor.node_tree.nodes;l=floor.node_tree.links
p=next(n for n in n if n.type=='BSDF_PRINCIPLED');p.inputs['Metallic'].default_value=.78
coord=n.new('ShaderNodeTexCoord');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=16;noise.inputs['Detail'].default_value=3;l.new(coord.outputs['Object'],noise.inputs[0])
colors=n.new('ShaderNodeValToRGB');colors.color_ramp.elements[0].color=(.025,.029,.028,1);colors.color_ramp.elements[1].color=(.070,.073,.065,1)
l.new(noise.outputs['Fac'],colors.inputs[0]);l.new(colors.outputs[0],p.inputs['Base Color'])
rough=n.new('ShaderNodeMapRange');rough.inputs['To Min'].default_value=.27;rough.inputs['To Max'].default_value=.47;l.new(noise.outputs['Fac'],rough.inputs[0]);l.new(rough.outputs[0],p.inputs['Roughness'])
micro=n.new('ShaderNodeTexNoise');micro.inputs['Scale'].default_value=230;l.new(coord.outputs['Object'],micro.inputs[0])
bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=.001;l.new(micro.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs[0],p.inputs['Normal'])
metal=bpy.data.materials['STUDIO / Worn machined bronze steel'];dark=bpy.data.materials['STUDIO / Carbon rubber']
for o in bpy.data.collections['02 Floor and grilles'].objects:
 if o.type!='MESH':continue
 name=o.name.lower()
 if 'deck plate' in name or 'graphite deck' in name or 'straight edge deck' in name:
  for i in range(len(o.data.materials)):o.data.materials[i]=floor
 elif 'grating' in name:
  for i in range(len(o.data.materials)):o.data.materials[i]=dark if 'dark well' in name else metal
  # Preserve top level while adding depth to bars and the dark recess.
  world=o.matrix_world.copy();inv=world.inverted()
  for v in o.data.vertices:
   p=world@v.co
   if -.09<p.z<0:p.z*=5;v.co=inv@p
# Terminal art is clearly separate from the actual imported interactive mesh.
col=bpy.data.collections.new('13 Preview displays - not for export');s.collection.children.link(col);col['exclude_runtime_export']=True
cyan=bpy.data.materials['CABIN / REFERENCE / Cyan status']
screen=bpy.data.materials['STUDIO / Black instrument glass']
def panel(name,points,mat):
 d=bpy.data.meshes.new(name);d.from_pydata([xyz(p) for p in points],[],[(0,1,2,3)]);d.materials.append(mat)
 o=bpy.data.objects.new(name,d);col.objects.link(o);o['preview_only']=True;return o
panel('PREVIEW / Credential screen',[(1.45,1.28,12.504),(2.55,1.28,12.504),(2.55,2.08,12.504),(1.45,2.08,12.504)],screen)
for y in [1.32,2.04]:panel('PREVIEW / Screen rule',[(1.49,y,12.506),(2.51,y,12.506),(2.51,y+.005,12.506),(1.49,y+.005,12.506)],cyan)
for body,y,size in [('CRUZ DEL SUR',1.94,.058),('CREW ACCESS',1.65,.085),('IDENTIFICATION REQUIRED',1.48,.035),('STANDBY',1.37,.028)]:
 bpy.ops.object.text_add(location=xyz((2,y,12.507)),rotation=(pi/2,0,0));o=bpy.context.object;o.name='PREVIEW / '+body
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.data.body=body;o.data.align_x='CENTER';o.data.size=size;o.data.materials.append(cyan);o['preview_only']=True
def camera(name,p,at):
 d=bpy.data.cameras.new(name);d.lens=24;o=bpy.data.objects.new(name,d);bpy.data.collections['10 Lighting and cameras'].objects.link(o);o.location=xyz(p);o.rotation_euler=(xyz(at)-o.location).to_track_quat('-Z','Y').to_euler();return o
camera('CAM / Fixed docking and EVA',(.8,1.65,13.0),(-.7,1.30,18.15))
camera('CAM / Sliding access and terminal',(-.8,1.65,17.7),(.7,1.30,11.95))
s.unit_settings.system='METRIC';s['whole_cabin_polish']=1
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
report={'glassFix':'Thin clear sheet with discrete reflection; blue fill hidden from glossy rays',
 'backgroundFix':'Full image UV on dedicated distant plane', 'floor':'Procedural dark metal, variable roughness and deeper grilles',
 'terminalPreviewCollection':col.name,'previewOnly':True,'runtimeChanged':False,
 'cameras':[o.name for o in bpy.data.collections['10 Lighting and cameras'].objects if o.type=='CAMERA']}
(folder/'polish.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('MASTER_POLISHED',flush=True)
