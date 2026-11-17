"""Second studio-only pass, preserving camera and current authoring edits."""
from pathlib import Path
from math import sin,pi
from mathutils import Vector
import bpy,json
scene=bpy.context.scene
assert scene.name=='Service wall / Design studio'
assert not scene.get('studio_finish_pass')
wall=bpy.data.collections['01 / Editable wall']
paint=bpy.data.materials['STUDIO / Warm graphite enamel']
n=paint.node_tree.nodes;l=paint.node_tree.links;p=next(v for v in n if v.type=='BSDF_PRINCIPLED')
p.inputs['Metallic'].default_value=.38
coord=n.new('ShaderNodeTexCoord');mapping=n.new('ShaderNodeMapping');mapping.inputs['Scale'].default_value=(2,35,2)
l.new(coord.outputs['Object'],mapping.inputs['Vector'])
noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=9;noise.inputs['Detail'].default_value=2
l.new(mapping.outputs['Vector'],noise.inputs['Vector'])
ramp=n.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].color=(.021,.025,.025,1);ramp.color_ramp.elements[1].color=(.036,.040,.038,1)
l.new(noise.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs[0],p.inputs['Base Color'])
# Make each leaf a curved lancet with a raised centre vein and rounded outline.
for o in list(wall.objects):
 if 'Heart shaped vine leaf' not in o.name:continue
 a,side,b,other=[v.co.copy() for v in o.data.vertices]
 axis=b-a;across=(side-(a+b)*.5);across-=axis*across.dot(axis)/axis.length_squared
 across=across.normalized()*.045
 vs=[];fs=[]
 for row in range(9):
  t=row/8;center=a.lerp(b,t);width=sin(pi*t)**.72
  arch=Vector((-.018*sin(pi*t),0,0))
  vs.extend([center+across*width,center+arch,center-across*width])
 for row in range(8):
  k=row*3;fs.extend([(k,k+3,k+4,k+1),(k+1,k+4,k+5,k+2)])
 old=o.data;d=bpy.data.meshes.new('Curved living leaf');d.from_pydata(vs,[],fs);d.materials.append(old.materials[0]);d.update();o.data=d
 for f in d.polygons:f.use_smooth=True
# Diagonal safety chevrons inlaid in the door bottom.
for o in list(wall.objects):
 if 'Maintenance caution mark' not in o.name:continue
 center=o.location.copy();data=bpy.data.meshes.new('Diagonal ochre inlay')
 x,y,z=center
 data.from_pydata([(x-.01,y-.025,z-.018),(x-.01,y+.010,z-.018),
                   (x-.01,y+.042,z+.018),(x-.01,y+.007,z+.018)],[],[(0,1,2,3)])
 data.materials.append(bpy.data.materials['CABIN / REFERENCE / Aged brass']);o.data=data;o.location=(0,0,0);o.modifiers.clear()
def text(body,x,y,z,size):
 bpy.ops.object.text_add(location=(x-4,15.285-z,y),rotation=(pi/2,0,-pi/2));o=bpy.context.object;o.name='STUDIO / '+body
 for c in list(o.users_collection):c.objects.unlink(o)
 wall.objects.link(o);o.data.body=body;o.data.size=size;o.data.resolution_u=4
 o.data.materials.append(bpy.data.materials['STUDIO / Warm stencil ink'])
for z,code in [(15.11,'MT / 021'),(16.66,'LS / 004')]:
 text(code,3.668,.56,z-.12,.025)
 text('CAUTION / SERVICE ACCESS',3.668,2.29,z-.25,.023)
text('CRUZ DEL SUR / EXPEDITION ARCHIVE',3.822,1.913,13.83,.020)
scene['studio_finish_pass']=1
scene.render.filepath=str(Path(bpy.data.filepath).with_name('studio-final.png'))
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
dg=bpy.context.evaluated_depsgraph_get();tris=0
for o in wall.objects:
 if o.type not in {'MESH','CURVE','FONT'}:continue
 evaluated=o.evaluated_get(dg);m=evaluated.to_mesh();tris+=sum(len(p.vertices)-2 for p in m.polygons);evaluated.to_mesh_clear()
report={'editableObjects':len(wall.objects),'meshObjects':sum(o.type=='MESH' for o in wall.objects),
 'evaluatedTriangles':tris,'materials':len({m.name for o in wall.objects if hasattr(o.data,'materials') for m in o.data.materials}),
 'packedImages':[i.name for i in bpy.data.images if i.packed_file],
 'proceduralMaterialsRequireBaking':True,'runtimeChanged':False,'cameraChanged':False}
(Path(bpy.data.filepath).parent/'refinement.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
