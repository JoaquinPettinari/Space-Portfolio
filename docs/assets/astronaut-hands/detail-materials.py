from pathlib import Path
import bpy,json
from mathutils import Vector
out=Path(bpy.data.filepath).parent;s=bpy.context.scene
for matname in ['HAND / Graphite woven glove','HAND / Reinforced finger pads']:
 m=bpy.data.materials[matname];n=m.node_tree.nodes;l=m.node_tree.links;p=next(x for x in n if x.type=='BSDF_PRINCIPLED')
 tex=n.new('ShaderNodeTexNoise');tex.name='Fine woven roughness';tex.inputs['Scale'].default_value=135;tex.inputs['Detail'].default_value=2
 ramp=n.new('ShaderNodeMapRange');ramp.inputs['From Min'].default_value=0;ramp.inputs['From Max'].default_value=1;ramp.inputs['To Min'].default_value=.43;ramp.inputs['To Max'].default_value=.78;l.new(tex.outputs['Fac'],ramp.inputs['Value']);l.new(ramp.outputs[0],p.inputs['Roughness'])
 wave=n.new('ShaderNodeTexWave');wave.name='Glove cross weave';wave.bands_direction='X';wave.inputs['Scale'].default_value=105;wave.inputs['Distortion'].default_value=2
 bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.32;bump.inputs['Distance'].default_value=.00032;l.new(wave.outputs['Color'],bump.inputs['Height']);l.new(bump.outputs[0],p.inputs['Normal'])
for side in ['Left','Right']:
 col=bpy.data.collections['HAND / '+side];rig=bpy.data.objects['HAND_RIG.'+side[0]]
 # A single skinned stitch mesh per hand, no separate draw object for each thread.
 verts=[];faces=[]
 def stitch(x,y,z):
  base=len(verts);dx,dy,dz=.0007,.00045,.0014
  verts.extend([(x+a*dx,y+b*dy,z+c*dz) for a,b,c in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]])
  faces.extend([tuple(base+i for i in face) for face in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]])
 for x in [-.025,.025]:
  for i in range(9):stitch(x,-.028,.029+i*.004)
 mesh=bpy.data.meshes.new('Dorsal double stitching.'+side[0]);mesh.from_pydata(verts,[],faces);o=bpy.data.objects.new('Dorsal double stitching.'+side[0],mesh);col.objects.link(o);o.parent=rig;mesh.materials.append(bpy.data.materials['HAND / Seam thread']);vg=o.vertex_groups.new(name='wrist');vg.add(list(range(len(verts))),1,'REPLACE');md=o.modifiers.new('Shared wrist articulation','ARMATURE');md.object=rig;bevel=o.modifiers.new('Rounded threads','BEVEL');bevel.width=.00035;bevel.segments=2
bpy.ops.wm.save_as_mainfile(filepath=str(out/'astronaut-hands.blend'))
s.render.filepath=str(out/'hands-tablet-hold.png');bpy.ops.render.render(write_still=True)
# Fresh pose evidence, without saving alternate action assignments.
report=[]
for side in ['Left','Right']:
 col=bpy.data.collections['HAND / '+side];s.collection.children.link(col);rig=bpy.data.objects['HAND_RIG.'+side[0]];poses={}
 for mode in ['neutral','tablet_hold','card_pinch','radio_press']:
  rig.animation_data.action=bpy.data.actions[mode+'.'+side[0]];s.frame_set(16);s.frame_set(15);bpy.context.view_layer.update();poses[mode]={'indexTip':list(rig.pose.bones['index.3'].tail),'thumbTip':list(rig.pose.bones['thumb.3'].tail)}
 weights=[sum(g.weight for g in v.groups) for v in bpy.data.objects['HAND_SURFACE.'+side[0]].data.vertices];assert all(abs(w-1)<1e-5 for w in weights)
 assert (Vector(poses['card_pinch']['indexTip'])-Vector(poses['card_pinch']['thumbTip'])).length<.015
 report.append({'side':side,'poses':poses,'allSurfaceWeightsNormalized':True})
(out/'pose-validation.json').write_text(json.dumps(report,indent=2))
print('SURFACE_DETAIL_PASS_COMPLETE')
