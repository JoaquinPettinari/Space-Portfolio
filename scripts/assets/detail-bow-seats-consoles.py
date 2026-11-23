"""Editable seat ergonomics and console hardware; no gameplay or anchor changes."""
from pathlib import Path
from math import pi
import bpy,json
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/bow-master'
assert Path(bpy.data.filepath)==OUT/'bow-master.blend'
NAME='12 Seat ergonomics and console hardware'
assert NAME not in bpy.data.collections,'Pass already exists'
backup=OUT/'before-seats-consoles.blend';assert not backup.exists()
bpy.ops.wm.save_as_mainfile(filepath=str(backup),copy=True)
scene=bpy.context.scene;col=bpy.data.collections.new(NAME);scene.collection.children.link(col)
anchors={o.name:o.matrix_world.copy() for o in bpy.data.collections['08 Interaction anchors - no export'].objects}
def xyz(p):return Vector((p[0],-p[2],p[1]))
def material(name,color,metal,rough,grain=0):
 m=bpy.data.materials.new('BOW SEAT / '+name);m.use_nodes=True
 p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;m.diffuse_color=(*color,1)
 if grain:
  n=m.node_tree.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=grain
  b=m.node_tree.nodes.new('ShaderNodeBump');b.inputs['Strength'].default_value=.13;b.inputs['Distance'].default_value=.001
  m.node_tree.links.new(n.outputs['Fac'],b.inputs['Height']);m.node_tree.links.new(b.outputs[0],p.inputs['Normal'])
 return m
leather=material('Charcoal woven upholstery',(.025,.038,.043),.03,.64,185)
rubber=material('Armrest elastomer',(.018,.023,.025),.02,.76,110)
stitch=material('Warm gray stitching',(.25,.235,.19),.05,.72)
steel=bpy.data.materials['BOW DETAIL / Machined dark titanium']
bronze=bpy.data.materials['BOW DETAIL / Satin bronze edging']
def move_to_collection(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o)
def box(name,p,size,m,root,bevel=.008):
 bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object;o.name='BOW EQUIP / '+name;move_to_collection(o)
 o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.parent=root;o.location=xyz(p);o.data.materials.append(m)
 if bevel:
  b=o.modifiers.new('Soft manufactured edge','BEVEL');b.width=min(bevel,min(size)*.45);b.segments=4
  o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def root(name,position,yaw):
 o=bpy.data.objects.new(name,None);col.objects.link(o);o.location=xyz(position);o.rotation_euler.z=yaw;return o
def seam(name,points,parent,radius=.002):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=radius;d.bevel_resolution=1
 s=d.splines.new('POLY');s.points.add(len(points)-1)
 for v,p in zip(s.points,points):v.co=(*xyz(p),1)
 o=bpy.data.objects.new('BOW EQUIP / '+name,d);col.objects.link(o);o.parent=parent;d.materials.append(stitch)
 return o
chairs=[('Computer',(-1.6721825407,0,-6.1721825407),pi/4),('Communications',(1.6721825407,0,-6.1721825407),-pi/4),('Personal',(3.2,0,-1.05),-pi/2),('Arcade',(-3.2,0,-2.75),pi/2)]
for name,pos,yaw in chairs:
 r=root('SEAT DETAIL / '+name,pos,yaw)
 # Mounts join the existing upper back; pads are separate editable inserts.
 for x in [-.12,.12]:box('Headrest telescopic support',(x,1.30,.34),(.028,.15,.035),steel,r,.004)
 box('Headrest rear shell',(0,1.41,.37),(.48,.22,.15),steel,r,.055)
 box('Headrest soft insert',(0,1.415,.275),(.43,.18,.065),leather,r,.028)
 seam('Headrest seam',[(-.18,1.36,.239),(-.18,1.47,.239),(.18,1.47,.239),(.18,1.36,.239)],r)
 # Front of the backrest faces local -Z; the lumbar pad follows its surface.
 box('Lumbar support insert',(0,.86,.205),(.43,.14,.052),leather,r,.024)
 for x in [-.14,-.07,0,.07,.14]:seam('Lumbar sewn channel',[(x,.816,.176),(x,.902,.176)],r,.0013)
 for side in [-1,1]:
  box('Armrest grip pad',(side*.40,.947,0),(.105,.035,.31),rubber,r,.014)
  for z in [-.10,-.05,0,.05,.1]:box('Armrest grip rib',(side*.40,.966,z),(.08,.004,.009),leather,r,.001)
  # Adjustment lever outside the seat cushion, clear of the walking aisle.
  box('Seat adjustment bracket',(side*.405,.61,.18),(.028,.08,.12),steel,r,.006)
  box('Seat adjustment paddle',(side*.435,.63,.18),(.035,.027,.08),rubber,r,.008)
 box('Rear headrest service inset',(0,1.41,.451),(.28,.095,.012),rubber,r,.004)
 for x in [-.105,-.07,-.035,0,.035,.07,.105]:box('Headrest rear vent',(x,1.41,.46),(.012,.065,.008),steel,r,.001)

# Stable monitor anchors define the local front plane; no changes to screen bounds.
sizes={'Computer':(1.8,1.1),'Communications':(1.8,1.1),'Personal':(1.3,1.1),'Arcade':(1.3,1.1),'Navigation':(2.46,.77)}
for name,(width,height) in sizes.items():
 a=bpy.data.objects['ANCHOR / '+name]
 r=root('CONSOLE DETAIL / '+name,(0,0,0),0);r.matrix_world=a.matrix_world.copy()
 for side in [-1,1]:
  for vertical in [-1,1]:
   x=side*(width/2-.035);y=vertical*(height/2-.035)
   box('Bezel corner protector',(x,y,.05),(.065,.065,.025),steel,r,.012)
   bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=.008,depth=.007)
   o=bpy.context.object;o.name='BOW EQUIP / Bezel captive screw';move_to_collection(o);o.parent=r;o.location=xyz((x,y,.067));o.rotation_euler.x=pi/2;o.data.materials.append(bronze)
 # Narrow casing vents along the upper rim, kept outside the active display.
 for i in range(5):box('Monitor cooling slit',((i-2)*.035,height/2-.018,.051),(.019,.009,.009),rubber,r,.002)
 # A recessed connector block beneath the rim, adjacent to the existing mount.
 box('Monitor lower service block',(width*.34,-height/2-.025,.012),(.17,.045,.055),steel,r,.009)
 for x in [-.045,0,.045]:box('Service socket',(width*.34+x,-height/2-.026,.044),(.025,.014,.008),rubber,r,.002)

studio=bpy.data.collections['09 Studio lights and cameras - no export']
for name,pos,target,lens in [('Seat inspection',(1.8,1.55,.25),(3.2,1.05,-1.05),35),('Seat front detail',(3.9,1.55,.0),(3.1,1.05,-1.05),28)]:
 d=bpy.data.cameras.new(name);d.lens=lens;o=bpy.data.objects.new('CAM / '+name,d);studio.objects.link(o);o.location=xyz(pos);o.rotation_euler=(xyz(target)-o.location).to_track_quat('-Z','Y').to_euler()
bpy.context.view_layer.update()
for name,matrix in anchors.items():assert bpy.data.objects[name].matrix_world==matrix,name
triangles=0;dg=bpy.context.evaluated_depsgraph_get()
for o in col.objects:
 if o.type in {'MESH','CURVE'}:
  e=o.evaluated_get(dg);mesh=e.to_mesh();mesh.calc_loop_triangles();triangles+=len(mesh.loop_triangles);e.to_mesh_clear()
scene.camera=bpy.data.objects['CAM / Forward overview'];bpy.ops.object.select_all(action='DESELECT')
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bow-master.blend'))
(OUT/'seats-consoles.json').write_text(json.dumps({'collection':NAME,'chairs':len(chairs),'consoleFrames':len(sizes),'objects':len(col.objects),'evaluatedTrianglesAdded':triangles,'anchorsPreserved':len(anchors),'runtimeChanged':False,'handsOrTabletChanged':False},indent=2))
print('SEATS_CONSOLES_COMPLETE',len(col.objects),triangles)
