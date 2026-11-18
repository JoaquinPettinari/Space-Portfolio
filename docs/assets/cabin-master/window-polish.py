"""Natural foliage and local material/hardware polish for the observation ledge."""
import bpy,bmesh,ast,json,random
from pathlib import Path
from math import pi,sin,cos
from mathutils import Vector,Matrix
s=bpy.context.scene;assert not s.get('window_polish');root=Path(bpy.data.filepath).parent
source=ast.parse((root/'detail-architecture.py').read_text());exec(compile(ast.Module(body=[n for n in source.body if isinstance(n,ast.FunctionDef)],type_ignores=[]),'shared geometry','exec'))
archive=bpy.data.collections['90 Archive / Superseded layout - excluded'];retired=[];col=bpy.data.collections['20 Observation ledge and keepsakes']
slots=['SLOT / Fixed docking door','SLOT / Sliding leaves','SLOT / Sliding stationary frame','SLOT / Credential terminal','SLOT / Full NASA EMU','LEAF_LEFT_SLIDE','LEAF_RIGHT_SLIDE'];snap={n:(bpy.data.objects[n].matrix_world.copy(),bpy.data.objects[n].matrix_local.copy()) for n in slots}
def tris():
 dg=bpy.context.evaluated_depsgraph_get();n=0
 for o in s.objects:
  if o.hide_render or o.get('archived') or o.type not in {'MESH','CURVE','FONT'}:continue
  e=o.evaluated_get(dg);m=e.to_mesh();m.calc_loop_triangles();n+=len(m.loop_triangles);e.to_mesh_clear()
 return n
before=tris()
def cloned(name,new):
 m=bpy.data.materials[name].copy();m.name=new;return m,next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
paint,p=cloned('STUDIO / Warm graphite enamel','WINDOW / Satin graphite finish');p.inputs['Coat Weight'].default_value=.22;p.inputs['Coat Roughness'].default_value=.28
metal,p=cloned('STUDIO / Worn machined bronze steel','WINDOW / Brushed edge alloy');p.inputs['Base Color'].default_value=(.32,.29,.235,1)
brass,p=cloned('CABIN / REFERENCE / Aged brass','WINDOW / Sighting instrument brass');p.inputs['Metallic'].default_value=.86;p.inputs['Roughness'].default_value=.28
frame=bpy.data.materials['STUDIO / Powder coated structural rails'];dark=bpy.data.materials['STUDIO / Carbon rubber'];ink=bpy.data.materials['STUDIO / Warm stencil ink']
for o in col.objects:
 if o.type not in {'MESH','CURVE'}:continue
 for i,m in enumerate(o.data.materials):
  if m and m.name=='STUDIO / Warm graphite enamel':o.data.materials[i]=paint
  elif m and m.name=='STUDIO / Worn machined bronze steel':o.data.materials[i]=metal
  elif m and m.name=='CABIN / REFERENCE / Aged brass':o.data.materials[i]=brass
def tube(name,points,r,mat):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.resolution_u=2;d.bevel_depth=r;d.bevel_resolution=2;p=d.splines.new('POLY');p.points.add(len(points)-1)
 for v,co in zip(p.points,points):v.co=(*xyz(co),1)
 o=bpy.data.objects.new('WINDOW POLISH / '+name,d);col.objects.link(o);d.materials.append(mat);return o
def material(name,color,rough,metallic=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metallic;return m,p
leafm=[]
for i,color in enumerate([(.038,.105,.014),(.065,.16,.022),(.095,.20,.028)]):
 m,p=material('WINDOW / Living foliage '+str(i),color,.44);p.inputs['Subsurface Weight'].default_value=.045;leafm.append(m)
vein,_=material('WINDOW / Leaf veins',(.13,.19,.035),.60)
stem,_=material('WINDOW / Living stems',(.075,.11,.022),.68)
plant=bpy.data.collections['16 Corner floor plant']
for o in list(plant.objects):
 if o.name.startswith('REV / Ficus branch') or o.name.startswith('REV / Curved floor plant leaf'):stash(o)
# Reuse planter and soil; its rim/foot become readable, restrained construction details.
for y,r in [(1.063,.164),(.79,.134)]:tube('Planter rolled rim' if y>1 else 'Planter foot rim',[(-4.22+r*cos(i*2*pi/48),y,17.52+r*sin(i*2*pi/48)) for i in range(49)],.008,metal)
rng=random.Random(712)
def leaf(base,direction,length,width,index):
 axis=Vector(direction).normalized();side=axis.cross(Vector((0,1,0))).normalized();vs=[];veins=[]
 for j in range(9):
  t=j/8;center=Vector(base)+axis*(length*t)+Vector((0,.028*sin(pi*t)-.048*t*t,0));veins.append(tuple(center+Vector((0,.001,0))))
  for k in range(5):
   u=(k-2)/2;spread=width*(sin(pi*t)**.72);point=center+side*(u*spread)+Vector((0,-.018*u*u*sin(pi*t),0));vs.append(tuple(point))
 fs=[]
 for j in range(8):
  for k in range(4):a=j*5+k;fs.append((a,a+1,a+6,a+5))
 ob=mesh('Curved living leaf',vs,fs,leafm[index%3],col,bevel=0)
 for p in ob.data.polygons:p.use_smooth=True
 tube('Leaf central vein',veins,.00065,vein)
# Upright branching and two lateral trailing sprigs create an irregular leafy silhouette.
leafcount=0
for branch in range(8):
 angle=branch*2*pi/8+.2;length=.26+rng.random()*.22
 start=Vector((-4.22,1.065,17.52));end=start+Vector((cos(angle)*.18,length,sin(angle)*.20));middle=start.lerp(end,.5)+Vector((0,.055,0))
 tube('Living branch',[tuple(start),tuple(middle),tuple(start.lerp(end,.85))],.0035,stem)
 for j in range(5):
  t=.25+j*.15;attach=start.lerp(end,t);sign=-1 if j%2 else 1;direction=Vector((cos(angle+sign*.95),.18+rng.random()*.45,sin(angle+sign*.95)))
  tip=attach+direction.normalized()*.025;tube('Leaf petiole',[tuple(attach),tuple(tip)],.0018,stem)
  leaf(tip,direction,.14+rng.random()*.12,.042+rng.random()*.028,leafcount);leafcount+=1
for side in [-1,1]:
 pts=[(-4.22,1.10,17.52),(-4.06,1.06,17.52+side*.18),(-3.94,.91,17.52+side*.27),(-3.92,.70,17.52+side*.30)]
 tube('Trailing side branch',pts,.003,stem)
 for j in range(6):
  t=j/5;attach=Vector(pts[1]).lerp(Vector(pts[-1]),t);direction=(.6,-.25,side*(1 if j%2 else -.7));leaf(attach,direction,.12+rng.random()*.07,.040,leafcount);leafcount+=1
# Tiny substrate granules remain in the same pot, no loose room props.
soil=bpy.data.materials.get('STUDIO / Carbon rubber')
for i in range(12):
 a=i*2.399;r=.12*(i/12)**.5;box('Planter substrate granule',(-4.22+r*cos(a),1.069,17.52+r*sin(a)),(.015,.008,.013),soil,col)

# Instrument pivots, graduated sighting ring and cradle feet.
for y in [.91,1.29]:screw((-4.17,y,16.65),col,axis='side',r=.015)
for i in range(20):
 a=i*2*pi/20;tube('Instrument graduated index',[(-4.174,1.10+.173*sin(a),16.65+.173*cos(a)),(-4.174,1.10+.186*sin(a),16.65+.186*cos(a))],.0018,metal)
for z in [16.54,16.76]:box('Instrument cradle foot',(-4.19,.812,z),(.13,.030,.038),frame,col)
# Frame glass is mostly transparent with a small Fresnel reflection; photos stay non-emissive.
glass=bpy.data.materials.new('WINDOW / Keepsake protective glass');glass.use_nodes=True;nt=glass.node_tree;nt.nodes.clear();out=nt.nodes.new('ShaderNodeOutputMaterial');mix=nt.nodes.new('ShaderNodeMixShader');mix.inputs[0].default_value=.065;clear=nt.nodes.new('ShaderNodeBsdfTransparent');coat=nt.nodes.new('ShaderNodeBsdfGlass');coat.inputs['Roughness'].default_value=.04;coat.inputs['IOR'].default_value=1.45;nt.links.new(clear.outputs[0],mix.inputs[1]);nt.links.new(coat.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],out.inputs[0])
for z,w,h in [(12.93,.40,.27),(13.53,.34,.30)]:
 y=.79+h/2;mesh('Keepsake protective glazing',[(-4.149,y-h/2,z-w/2),(-4.149,y-h/2,z+w/2),(-4.149,y+h/2,z+w/2),(-4.149,y+h/2,z-w/2)],[(0,1,2,3)],glass,col,bevel=0)
 tube('Keepsake folding support',[(-4.205,y+.04,z),(-4.31,.785,z)],.009,metal)
 for zz in [z-w/2-.014,z+w/2+.014]:screw((-4.151,y-h/2-.014,zz),col,axis='side',r=.005)
 for o in col.objects:
  if o.name.startswith('DETAIL / Keepsake standing frame'):
   for mod in o.modifiers:
    if mod.type=='BEVEL':mod.width=.007;mod.segments=3
# Turn the existing sphere into a mineral specimen with fine relief and mottled alloy tones.
sample,p=material('WINDOW / Mineral specimen',(.12,.10,.065),.42,.55);nt=sample.node_tree;noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=9;noise.inputs['Detail'].default_value=3;ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.035,.043,.040,1);ramp.color_ramp.elements[1].color=(.28,.18,.08,1);bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.30;bump.inputs['Distance'].default_value=.006;nt.links.new(noise.outputs['Fac'],ramp.inputs[0]);nt.links.new(ramp.outputs[0],p.inputs['Base Color']);nt.links.new(noise.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs[0],p.inputs['Normal']);o=bpy.data.objects['WINDOW / Small celestial specimen'];o.data.materials.clear();o.data.materials.append(sample)
for v in o.data.vertices:
 v.co*=1+.055*sin(v.co.x*63)*cos(v.co.z*57)
bpy.context.view_layer.update()
for n,(world,local) in snap.items():
 o=bpy.data.objects[n]
 assert all(abs(a-b)<1e-6 for ra,rb in zip(world,o.matrix_world) for a,b in zip(ra,rb)),n
 assert all(abs(a-b)<1e-6 for ra,rb in zip(local,o.matrix_local) for a,b in zip(ra,rb)),n
after=tris();s['window_polish']=1
(root/'window-polish-audit.json').write_text(json.dumps({'trianglesBefore':before,'trianglesAfter':after,'preservedSlots':slots,'curvedLeaves':leafcount,'archivedFoliage':retired,'newLights':0,'localMaterialsOnly':True,'runtimeChanged':False},indent=2))
v=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
finally:bpy.context.preferences.filepaths.save_version=v
print('WINDOW_POLISH_SAVED',before,after,leafcount)

