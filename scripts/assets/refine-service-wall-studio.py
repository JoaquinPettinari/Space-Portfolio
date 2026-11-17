"""One authored studio pass. Run in the open studio, never on runtime source."""
from pathlib import Path
from math import sin,cos,pi
import bpy, random
from mathutils import Vector

scene=bpy.context.scene
assert scene.name=='Service wall / Design studio'
assert not scene.get('reference_detail_pass'), 'Already applied: preserve direct edits'
wall=bpy.data.collections['01 / Editable wall']
def xyz(p): return Vector((p[0]-4,15.285-p[2],p[1]))
def mat(name,color,metal=.0,rough=.5,grain=150,bump=.0007):
 m=bpy.data.materials.new('STUDIO / '+name);m.use_nodes=True
 n=m.node_tree.nodes;l=m.node_tree.links;p=next(n for n in n if n.type=='BSDF_PRINCIPLED')
 p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal
 tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=grain;tex.inputs['Detail'].default_value=2
 ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(rough*.75,)*3+(1,);ramp.color_ramp.elements[1].color=(min(rough*1.2,.95),)*3+(1,)
 l.new(tex.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs[0],p.inputs['Roughness'])
 relief=n.new('ShaderNodeBump');relief.inputs['Strength'].default_value=.23;relief.inputs['Distance'].default_value=bump
 l.new(tex.outputs['Fac'],relief.inputs['Height']);l.new(relief.outputs[0],p.inputs['Normal'])
 return m
paint=mat('Warm graphite enamel',(.065,.061,.052),.48,.36,120,.0008)
frame=mat('Powder coated structural rails',(.025,.028,.027),.5,.43,95,.001)
metal=mat('Worn machined bronze steel',(.18,.145,.095),.82,.34,210,.00035)
copper=mat('Brushed copper coolant',(.38,.16,.055),.8,.28,200,.0003)
rubber=mat('Carbon rubber',(.012,.015,.014),.0,.7,140,.0004)
leather=mat('Dark saddle leather',(.115,.049,.020),.0,.46,190,.0015)
red=mat('Oxide red emergency enamel',(.30,.018,.012),.28,.31,150,.0005)
leafmat=mat('Living vine',(.055,.17,.022),.0,.52,35,.0004)
stitch=mat('Leather stitching',(.35,.21,.09),0,.8)
white=mat('Warm stencil ink',(.48,.44,.32),.05,.65)
screen=mat('Black instrument glass',(.001,.007,.009),.25,.17,100,0)
cyan=bpy.data.materials['CABIN / REFERENCE / Cyan status']
warm=bpy.data.materials['CABIN / REFERENCE / Warm diffuser']
def mesh(name,vs,fs,m):
 d=bpy.data.meshes.new(name);d.from_pydata([xyz(p) for p in vs],[],fs);d.update()
 o=bpy.data.objects.new('STUDIO / '+name,d);wall.objects.link(o);d.materials.append(m);return o
def box(name,p,size,m,bevel=.008):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.name='STUDIO / '+name
 for c in list(o.users_collection):c.objects.unlink(o)
 wall.objects.link(o);o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(m)
 if bevel:
  b=o.modifiers.new('Manufactured edge radius','BEVEL');b.width=bevel;b.segments=3
  o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
 return o
def tube(name,points,r,m):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.resolution_u=12;d.bevel_depth=r;d.bevel_resolution=4
 s=d.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
 for b,p in zip(s.bezier_points,points):b.co=xyz(p);b.handle_left_type='AUTO';b.handle_right_type='AUTO'
 o=bpy.data.objects.new('STUDIO / '+name,d);wall.objects.link(o);d.materials.append(m);return o
def cylinder(name,p,r,depth,m,axis='y'):
 bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=depth,location=xyz(p));o=bpy.context.object;o.name='STUDIO / '+name
 if axis=='x':o.rotation_euler[1]=pi/2
 for c in list(o.users_collection):c.objects.unlink(o)
 wall.objects.link(o);o.data.materials.append(m)
 for f in o.data.polygons:f.use_smooth=True
 b=o.modifiers.new('Collar edge','BEVEL');b.width=.003;b.segments=2
 return o
def text(body,p,size,m):
 bpy.ops.object.text_add(location=xyz(p),rotation=(pi/2,0,-pi/2));o=bpy.context.object;o.name='STUDIO / '+body.replace('\n',' ')
 for c in list(o.users_collection):c.objects.unlink(o)
 wall.objects.link(o);o.data.body=body;o.data.size=size;o.data.resolution_u=6;o.data.materials.append(m);return o
def chamfer(name,x,y,z,h,w,depth,m,c=.08):
 points=[(-w/2+c,-h/2),(w/2-c,-h/2),(w/2,-h/2+c),(w/2,h/2-c),(w/2-c,h/2),(-w/2+c,h/2),(-w/2,h/2-c),(-w/2,-h/2+c)]
 vs=[(xx,y+yy,z+zz) for xx in [x-depth/2,x+depth/2] for zz,yy in points]
 fs=[tuple(reversed(range(8))),tuple(range(8,16))]+[(i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8)]
 o=mesh(name,vs,fs,m);b=o.modifiers.new('Panel rolled edge','BEVEL');b.width=.008;b.segments=3;o.modifiers.new('Panel normals','WEIGHTED_NORMAL');return o
def remove(parts):
 for o in list(wall.objects):
  if any(p in o.name for p in parts):bpy.data.objects.remove(o,do_unlink=True)

# Preserve existing dimensions while giving every surface a distinct finish.
for o in list(wall.objects):
 if o.type!='MESH':continue
 name=o.name
 for i,m in enumerate(o.data.materials):
  if m.name=='ARRIVAL V4 Graphite frame':o.data.materials[i]=paint
  elif 'Brushed titanium' in m.name:o.data.materials[i]=metal
  elif 'Gaskets' in m.name:o.data.materials[i]=rubber
 if 'Saddle cushion' in name:o.data.materials[0]=leather
 if 'Emergency medical case' in name:o.data.materials[0]=red
 if any(s in name for s in ['Bay divider','fascia','plinth','backing']):o.data.materials[0]=frame
 for mod in o.modifiers:
  if mod.type=='BEVEL':mod.segments=3

# Octagonal perimeter reveals and stepped metal gaskets around tall doors.
remove(['Maintenance panel','Life support panel','Maintenance reveal','Life support reveal'])
for z,w in [(15.11,.68),(16.66,.65)]:
 chamfer('Octagonal perimeter',3.76,1.40,z,2.28,w+.10,.075,metal,.095)
 chamfer('Door perimeter gasket',3.709,1.40,z,2.22,w+.045,.027,rubber,.08)
 chamfer('Recessed painted door',3.688,1.40,z,2.16,w,.023,paint,.07)
 for zz in [z-w/2+.04,z+w/2-.04]:
  for yy in [.41,2.37]:cylinder('Flush hex screw',(3.668,yy,zz),.012,.009,metal,'x')
 # Latch consists of a sunk well and a floating pull, not a painted stripe.
 box('Latch recess',(3.664,.87,z),(.014,.075,.23),rubber,.012)
 box('Recessed pull',(3.647,.885,z),(.020,.018,.17),metal,.006)

# Replace rectangular pipe clips with real sleeves and gently swept elbows.
remove(['Copper coolant riser','Pipe collar','Flexible service harness'])
for z in [15.66,16.12]:
 tube('Swept copper coolant riser',[(3.88,.43,z),(3.88,.60,z),(3.88,2.15,z),(3.88,2.27,z),(3.88,2.31,15.89)],.027,copper)
 for y in [.65,1.10,1.77,2.13]:
  cylinder('Compression coupling',(3.88,y,z),.039,.063,metal)
  cylinder('Rubber isolator',(3.88,y,z),.041,.018,rubber)
  box('Pipe mount',(3.95,y,z),(.09,.075,.09),frame,.01)
tube('Cable trunk',[(3.82,.49,15.77),(3.82,.95,15.73),(3.82,1.21,15.90),(3.82,1.53,16.03),(3.82,2.22,16.03)],.019,rubber)
for y in [.88,.94,1.00,1.06]:cylinder('Cable rib',(3.82,y,15.73),.023,.012,frame)
for o in list(wall.objects):
 if 'Electrical service module' in o.name:
  o.data.materials[0]=paint
  # Front-facing labels and fasteners indicate replaceable modules.
  p=o.location; yy=p.z; zz=15.285-p.y
  text('SYS / '+str(round(yy*10)),(3.735,yy+.04,zz-.085),.027,white)
  for dz in [-.10,.10]:box('Module service latch',(3.732,yy,zz+dz),(.018,.08,.018),metal,.004)

# A broader readable cyan instrument graphic, with a gauge and separated rows.
remove(['O2    21.0%','Environmental display bezel','Environmental display glass'])
chamfer('Instrument bezel',3.645,1.43,16.66,.76,.51,.035,metal,.04)
chamfer('Instrument black glass',3.619,1.43,16.66,.69,.45,.014,screen,.035)
text('OXYGEN',(3.608,1.68,16.48),.034,cyan)
text('21.0%',(3.608,1.55,16.49),.082,cyan)
text('CO2    0.04%\nPRESS  101.3\nTEMP   22.0 C',(3.608,1.37,16.48),.039,cyan)
for y in [1.49,1.09]:box('Screen fine rule',(3.608,y,16.66),(.003,.004,.36),cyan,.0)

# Darker leather, inset seams and soft edge piping on the bench pads.
for z in [13.21,13.71,14.21]:
 for zz in [z-.20,z+.20]:
  tube('Seat stitched seam',[(3.68,.632,zz),(3.85,.637,zz),(4.12,.632,zz)],.002,stitch)
 for xx in [3.68,4.12]:tube('Seat welt',[(xx,.624,z-.20),(xx,.631,z),(xx,.624,z+.20)],.003,leather)
# Case reinforcing bands, corner armor, handle and medical retention straps.
for z in [13.68,13.98]:
 box('Survey case restraint',(3.76,.82,z),(.035,.33,.035),rubber,.005)
 box('Case metal buckle',(3.737,.90,z),(.015,.055,.055),metal,.008)
for z in [13.65,14.01]:
 for y in [.69,.95]:box('Case corner armor',(3.765,y,z),(.04,.07,.065),metal,.009)
tube('Case carry handle',[(3.77,1.00,13.76),(3.77,1.035,13.76),(3.77,1.035,13.90),(3.77,1.00,13.90)],.009,rubber)
for y in [1.26,1.58]:
 box('Medical webbing',(3.677,y,17.39),(.022,.048,.365),rubber,.009)
 box('Medical strap buckle',(3.660,y,17.27),(.020,.071,.067),metal,.01)
box('Medical handle',(3.80,1.715,17.39),(.12,.045,.16),rubber,.015)

# Replace miniature potted sprig with a generous hanging vine in the shelf bay.
remove(['Terracotta planter','Planter soil','Plant stem','Curved botanical leaf'])
cylinder('Ceramic plant pot',(3.76,1.94,13.16),.10,.19,leather)
cylinder('Plant pot rim',(3.76,2.035,13.16),.109,.024,metal)
cylinder('Dark pot soil',(3.76,2.045,13.16),.096,.008,rubber)
rng=random.Random(31)
for b in range(8):
 z0=13.12+(b%3)*.06;length=.52+(b%4)*.14
 pts=[(3.71,2.07,z0),(3.64,2.03,z0-.10),(3.60,1.85,z0-.17),(3.61,2.03-length,z0-.20)]
 tube('Hanging vine stem',pts,.004,leafmat)
 for k in range(7):
  t=k/6;y=2.04-length*t;z=z0-.15-.08*t;side=1 if (k+b)%2 else -1
  x=3.59+rng.random()*.04;w=.055+rng.random()*.02;dy=.13
  vs=[(x,y,z),(x-.022,y-.06,z+side*w),(x,y-dy,z+side*.045),(x+.018,y-.07,z+side*.022)]
  leaf=mesh('Heart shaped vine leaf',vs,[(0,1,2),(0,2,3)],leafmat)
  sol=leaf.modifiers.new('Leaf thickness','SOLIDIFY');sol.thickness=.001
  tube('Leaf midrib',[vs[0],(x-.008,y-.065,z+side*.025),vs[2]],.001,metal)

# Warm practical pools: these remain preview-only, distinct from runtime lights.
lights=bpy.data.collections['02 / Preview lighting - not for export']
for o in lights.objects:
 if o.type=='LIGHT':
  o.data.color=(1,.77,.52);o.data.energy=170 if 'Warm' in o.name else 45
def area(name,p,target,power,size):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=(1,.56,.25);d.shape='DISK';d.size=size
 o=bpy.data.objects.new(name,d);lights.objects.link(o);o.location=xyz(p);o.rotation_euler=(xyz(target)-o.location).to_track_quat('-Z','Y').to_euler()
for z in [13.7,15.11,16.66,17.39]:area('Amber upper practical',(3.48,2.49,z),(3.9,1.30,z),10,.43)
area('Shelf pool',(3.60,1.78,13.78),(3.95,1.22,13.78),7,.65)
area('Floor amber bounce',(3.40,.20,15.3),(3.9,.90,15.3),10,2.5)
scene.cycles.samples=48;scene.render.filepath=str(Path(bpy.data.filepath).with_name('studio-refined.png'))
scene['reference_detail_pass']=1
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('STUDIO_REFINED',len(wall.objects))
