"""Final rounded leaf pass for the Blender-only reference maquette."""
import bpy
from math import sin,cos,pi
from mathutils import Vector
collection=bpy.data.collections['UNIFIED / 13 Reference side cassettes - Blender only']
leaf=bpy.data.materials['CDS NICHE / Specimen jade leaves']
young=bpy.data.materials['CDS NICHE / Specimen young leaves']
for o in list(collection.objects):
 if o.type=='MESH' and len(o.data.materials)==1 and o.data.materials[0] in [leaf,young]:
  data=o.data;bpy.data.objects.remove(o,do_unlink=True)
  if data.users==0:bpy.data.meshes.remove(data)
for m in [leaf,young]:
 bs=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 nodes=m.node_tree.nodes;links=m.node_tree.links
 uv=nodes.new('ShaderNodeTexCoord');sep=nodes.new('ShaderNodeSeparateXYZ');links.new(uv.outputs['UV'],sep.inputs['Vector'])
 sub=nodes.new('ShaderNodeMath');sub.operation='SUBTRACT';sub.inputs[1].default_value=.5;links.new(sep.outputs['X'],sub.inputs[0])
 absolute=nodes.new('ShaderNodeMath');absolute.operation='ABSOLUTE';links.new(sub.outputs[0],absolute.inputs[0])
 line=nodes.new('ShaderNodeMath');line.operation='LESS_THAN';line.inputs[1].default_value=.025;links.new(absolute.outputs[0],line.inputs[0])
 noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=9;links.new(uv.outputs['UV'],noise.inputs['Vector'])
 ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.012,.035,.004,1);ramp.color_ramp.elements[1].color=(.055,.13,.014,1)
 links.new(noise.outputs['Fac'],ramp.inputs['Fac'])
 mix=nodes.new('ShaderNodeMixRGB');links.new(line.outputs[0],mix.inputs[0]);links.new(ramp.outputs['Color'],mix.inputs[1]);mix.inputs[2].default_value=(.12,.22,.03,1)
 links.new(mix.outputs[0],bs.inputs['Base Color']);bs.inputs['Roughness'].default_value=.43

def add(name,verts,faces,mat,coords=None):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
 o=bpy.data.objects.new('CDS NICHE / '+name,me);collection.objects.link(o);me.materials.append(mat)
 for p in me.polygons:p.use_smooth=True
 if coords:
  layer=me.uv_layers.new()
  for p in me.polygons:
   for i in p.loop_indices:layer.data[i].uv=coords[me.loops[i].vertex_index]
 return o
cx=-2.86
for branch in range(4):
 points=[]
 for j in range(10):
  t=j/9;points.append((cx-.43+.095*sin(t*5+branch),-1.35+.15*t,2.30-t*(.35+.65*(branch/3))))
 data=bpy.data.curves.new('Living vine stem','CURVE');data.dimensions='3D';data.bevel_depth=.005;data.bevel_resolution=2
 spl=data.splines.new('POLY');spl.points.add(len(points)-1)
 for v,co in zip(spl.points,points):v.co=(*co,1)
 o=bpy.data.objects.new('CDS NICHE / Living vine stem',data);collection.objects.link(o);data.materials.append(leaf)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
 for j in range(9):
  p=Vector(points[j]);sign=1 if j%2 else -1;w=.085+.015*sin(j);length=.18
  verts=[tuple(p)];coords=[(.5,0)]
  for row in range(1,10):
   t=row/10;span=w*sin(pi*t)**.7*(1+.12*sin(3*pi*t))
   for col in [-1,-.5,0,.5,1]:
    verts.append((p.x+sign*length*t+col*span*.45,p.y+.075*sin(pi*t)-.025*col*col+.012*sin(2*pi*t+branch),p.z+.04*sin(pi*t)+col*span*.8-.14*t))
    coords.append(((col+1)/2,t))
  verts.append((p.x+sign*length,p.y+.012*sin(branch),p.z-.14));coords.append((.5,1))
  faces=[(0,1+c,2+c) for c in range(4)]
  faces += [(1+r*5+c,2+r*5+c,2+(r+1)*5+c,1+(r+1)*5+c) for r in range(8) for c in range(4)]
  faces += [(41+c,42+c,46) for c in range(4)]
  add('Cupped veined pothos leaf',verts,faces,leaf if j%3 else young,coords)
for mat in [leaf,young]:
 objects=[o for o in collection.objects if o.type=='MESH' and len(o.data.materials)==1 and o.data.materials[0]==mat]
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name='CDS NICHE / Batch / '+mat.name.removeprefix('CDS NICHE / ')
print('Rounded leaves complete; meshes',len(collection.objects))
