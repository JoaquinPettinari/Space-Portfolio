"""Assemble the editable cabin master. Sources and runtime assets stay untouched."""
from pathlib import Path
from math import pi
import bpy,json
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/cabin-master'
OUT.mkdir(parents=True,exist_ok=True);target=OUT/'cabin-master.blend'
assert not target.exists(),'Master exists; edit it directly, do not regenerate over edits'
bpy.ops.wm.read_factory_settings(use_empty=True)
master=bpy.context.scene;master.name='CRUZ DEL SUR / Cabin master'
names=['01 Hull and glazing','02 Floor and grilles','03 Ceiling','04 Lounge and galley',
       '05 EVA alcove','06 Refined service wall','07 Fixed docking door','08 Sliding access door',
       '09 Credential terminal','10 Lighting and cameras','11 Packed references','12 Space backdrop']
cols={n:bpy.data.collections.new(n) for n in names}
for c in cols.values():master.collection.children.link(c)
sources=[];removed_service=0
def xyz(p):return Vector((p[0],-p[2],p[1]))
def bounds(o):
 ps=[o.matrix_world@Vector(v) for v in o.bound_box]
 return ([min(p.x for p in ps),min(p.z for p in ps),min(-p.y for p in ps)],
         [max(p.x for p in ps),max(p.z for p in ps),max(-p.y for p in ps)])
def load_scene(file):
 print('LOAD_SOURCE',file,flush=True)
 with bpy.data.libraries.load(str(ROOT/file),link=False) as (src,dst):dst.scenes=src.scenes
 s=dst.scenes[0];bpy.context.window.scene=s;bpy.context.view_layer.update();sources.append(file);return s
def clone(o,col,offset=None):
 c=o.copy();c.data=o.data.copy() if o.data else None;world=o.matrix_world.copy();c.parent=None;c.matrix_world=world
 if offset:c.matrix_world.translation+=Vector(offset)
 cols[col].objects.link(c);c['master_source_object']=o.name;return c

# Shell contains the full ship; include only the corrected arrival pressure skin.
s=load_scene('docs/assets/straight-cabin/straight-pressure-shell.blend')
for o in s.objects:
 if o.type!='MESH':continue
 n=o.name
 wanted=(('Straight cabin' in n and 'tail' not in n) or any(p in n for p in [
  'Forward octagonal pressure collar','Aft docking pressure collar',
  'Forward collar swept equipment wing','Forward collar chamfer trim',
  'Forward collar diagonal light','Docking inclined collar practical',
  'Forward angled service recess','Forward service bay']))
 if wanted:clone(o,'03 Ceiling' if 'roof' in n or 'shoulder' in n else '01 Hull and glazing')
bpy.data.scenes.remove(s)
s=load_scene('docs/assets/cabin-reference/cabin-reference-dressing.blend')
for o in s.objects:
 if o.type!='MESH':continue
 lo,hi=bounds(o)
 if lo[0]>=3.565 and hi[0]<=4.415 and lo[2]>=12.835 and hi[2]<=17.735:
  removed_service+=1;continue
 if o.get('original_object','').startswith('ARR10 glazing '):continue
 n=o.name.lower()
 col='02 Floor and grilles' if any(p in n for p in ['floor','deck plate','grating','inset path']) else '03 Ceiling' if any(p in n for p in ['ceiling','overhead','roof']) else '04 Lounge and galley'
 clone(o,col)
bpy.data.scenes.remove(s)
assert removed_service==215,removed_service
s=load_scene('docs/assets/service-wall-studio/service-wall-design.blend')
for o in s.objects:
 if any(c.name.startswith('01 / Editable wall') for c in o.users_collection):clone(o,'06 Refined service wall',(4,-15.285,0))
bpy.data.scenes.remove(s)

# Detailed floor surfaces were not part of the dressing library; copy native art.
s=load_scene('docs/assets/unified-ship/cruz-del-sur-interior-panels.blend')
for o in s.objects:
 if o.type=='MESH' and o.name.startswith('CDS DETAIL / arrival /'):
  c=clone(o,'02 Floor and grilles')
  if 'Graphite deck' in o.name:c.location.z+=.008
  elif 'Service stencils' in o.name or 'Muted safety ochre' in o.name:c.location.z+=.006
bpy.data.scenes.remove(s)
bpy.context.window.scene=master;bpy.context.view_layer.update()
paint=bpy.data.materials['STUDIO / Warm graphite enamel'];metal=bpy.data.materials['STUDIO / Worn machined bronze steel']
dark=bpy.data.materials['STUDIO / Carbon rubber'];frame=bpy.data.materials['STUDIO / Powder coated structural rails']
warm=bpy.data.materials['CABIN / REFERENCE / Warm diffuser'];cyan=bpy.data.materials['CABIN / REFERENCE / Cyan status']
def box(name,p,size,m,col,bevel=.015):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.name='MASTER / '+name
 for c in list(o.users_collection):c.objects.unlink(o)
 cols[col].objects.link(o);o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:
  b=o.modifiers.new('Manufactured edges','BEVEL');b.width=min(bevel,min(size)*.35);b.segments=3
  o.modifiers.new('Corner normals','WEIGHTED_NORMAL')
 return o
def root(name,col,p=(0,0,0),yaw=0):
 o=bpy.data.objects.new(name,None);cols[col].objects.link(o);o.location=xyz(p);o.rotation_euler.z=yaw;return o
def glb(file,col):
 before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/models'/file));objects=list(set(bpy.data.objects)-before)
 for o in objects:
  for c in list(o.users_collection):c.objects.unlink(o)
  cols[col].objects.link(o)
 sources.append('public/models/'+file);bpy.context.view_layer.update();return objects
def parent_roots(objects,parent):
 for o in objects:
  if o.parent not in objects:
   world=o.matrix_world.copy();o.parent=parent;o.matrix_world=world

# Real hardware and exact runtime transforms; no generic replacement doors.
objects=glb('cruz-del-sur-docking-door.glb','07 Fixed docking door')
dock=root('SLOT / Fixed docking door','07 Fixed docking door');parent_roots(objects,dock)
dock.location=xyz((0,0,18.265));dock.rotation_euler.z=pi;dock['runtime_position']=[0,0,18.265];dock['runtime_yaw']=pi
objects=glb('cruz-del-sur-sliding-bulkhead.glb','08 Sliding access door')
leaf_left=next(o for o in objects if o.type=='EMPTY' and o.name.startswith('LEAF_LEFT_SLIDE'))
leaf_right=next(o for o in objects if o.type=='EMPTY' and o.name.startswith('LEAF_RIGHT_SLIDE'))
leaf_root=root('SLOT / Sliding leaves','08 Sliding access door')
for leaf,travel in [(leaf_left,-1.37),(leaf_right,1.37)]:
 world=leaf.matrix_world.copy();leaf.parent=leaf_root;leaf.matrix_world=world
 leaf['closed_local_x']=leaf.location.x;leaf['open_local_x']=leaf.location.x+travel;leaf['travel_metres']=travel
leaf_desc={leaf_left,leaf_right,*leaf_left.children_recursive,*leaf_right.children_recursive}
frame_objects=[o for o in objects if o not in leaf_desc]
frame_root=root('SLOT / Sliding stationary frame','08 Sliding access door');parent_roots(frame_objects,frame_root)
leaf_root.location=xyz((0,-.18,11.65));frame_root.location=xyz((0,-.18,11.17))
leaf_root['runtime_position']=[0,-.18,11.65];frame_root['runtime_position']=[0,-.18,11.17]
objects=glb('cruz-del-sur-crew-access.glb','09 Credential terminal')
terminal=root('SLOT / Credential terminal','09 Credential terminal');parent_roots(objects,terminal);terminal.location=xyz((2,1.65,12.37));terminal['runtime_position']=[2,1.65,12.37]
objects=glb('cruz-del-sur-eva-full.glb','05 EVA alcove')
suit=root('SLOT / Full NASA EMU','05 EVA alcove');parent_roots(objects,suit);suit.location=xyz((-2.17,.18,17.765));suit.rotation_euler.z=pi;suit['runtime_position']=[-2.17,.18,17.765]

# Editable counterpart of the runtime outfitting: recessed EVA berth and lockers.
c='05 EVA alcove';cx=-2.17
box('EVA dark back',(cx,1.31,18.21),(1.16,2.62,.07),dark,c)
for side in [-1,1]:
 x=cx+side*.53;box('EVA recessed jamb',(x,1.32,18.085),(.10,2.64,.32),paint,c)
 box('EVA frame highlight',(x-side*.045,1.33,17.985),(.012,2.16,.045),metal,c)
box('EVA upper canopy',(cx,2.57,17.895),(1.16,.14,.70),paint,c)
box('EVA floor plinth',(cx,.086,17.745),(1.16,.172,1.0),paint,c)
box('EVA anti slip deck',(cx,.176,17.745),(1.04,.008,.92),dark,c)
box('EVA upper lamp',(cx,2.394,17.645),(.68,.012,.105),warm,c)
box('EVA cyan datum',(cx,.092,17.227),(.67,.018,.009),cyan,c)
box('EVA crown cyan',(cx,2.52,17.528),(.66,.015,.008),cyan,c)
for x in [cx-.54,cx+.54]:
 for y in [.28,1.25,2.30]:box('EVA captive bolt',(x,y,17.919),(.024,.049,.018),metal,c,.004)
box('Rear locker shell',(-3.28,1.23,18.105),(1.1,2.32,.28),frame,c)
for x in [-3.55,-3.01]:
 box('Rear locker gasket',(x,1.25,17.958),(.51,2.09,.018),dark,c)
 box('Rear locker door',(x,1.25,17.942),(.47,2.03,.018),paint,c)
 box('Rear locker pull',(x+(.17 if x<-3.28 else -.17),1.12,17.915),(.025,.23,.035),metal,c)
 for i in range(5):box('Rear locker vent',(x,2.05+i*.027,17.925),(.29,.012,.012),dark,c,.002)
 box('Rear locker safety mark',(x,.4,17.925),(.23,.018,.012),metal,c,.002)
box('Rear locker upper case',(-3.28,2.58,18.115),(.95,.25,.29),paint,c)

# Extend the deck to the corrected shell, close the shell's doorway returns.
for x in [-4.55,4.55]:box('Straight edge deck',(x,-.065,15.15),(.70,.13,6.56),frame,'02 Floor and grilles')
for x in [-3.28,3.28]:
 box('Rear pressure infill',(x,1.5,18.39),(2.1,3.0,.09),paint,'01 Hull and glazing')

# Cohesive room materials retain textures but bring painted framing into the palette.
for cname in ['01 Hull and glazing','03 Ceiling','04 Lounge and galley']:
 for o in cols[cname].objects:
  if o.type!='MESH':continue
  for i,m in enumerate(o.data.materials):
   if m and ('Graphite frame' in m.name or 'Graphite ceramic' in m.name):o.data.materials[i]=frame
   elif m and ('Warm grey panels' in m.name or 'Blue titanium' in m.name):o.data.materials[i]=paint

# Star field is a preview backdrop, not another room or exported geometry.
image=bpy.data.images.load(str(ROOT/'public/textures/cruz-del-sur/deep-space.webp'),check_existing=True);image.pack()
m=bpy.data.materials.new('MASTER / Distant star field');m.use_nodes=True;n=m.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');em=n.new('ShaderNodeEmission');em.inputs['Strength'].default_value=.5;tex=n.new('ShaderNodeTexImage');tex.image=image;m.node_tree.links.new(tex.outputs['Color'],em.inputs[0]);m.node_tree.links.new(em.outputs[0],out.inputs[0])
back=box('Space visible beyond windows',(-11,3,15.2),(.01,12,18),m,'12 Space backdrop',0)
# Box face UVs are generated consistently by the primitive; backdrop never collides.
glass=bpy.data.materials.new('MASTER / Clear pressure glazing');glass.use_nodes=True
shader=next(n for n in glass.node_tree.nodes if n.type=='BSDF_PRINCIPLED');shader.inputs['Base Color'].default_value=(.65,.80,.86,1);shader.inputs['Transmission Weight'].default_value=1;shader.inputs['Roughness'].default_value=.045;shader.inputs['IOR'].default_value=1.12
for o in cols['01 Hull and glazing'].objects:
 if 'port glazing' in o.name:o.data.materials.clear();o.data.materials.append(glass)

def area(name,p,at,power,size,color=(1,.66,.38)):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color
 o=bpy.data.objects.new(name,d);cols['10 Lighting and cameras'].objects.link(o);o.location=xyz(p);o.rotation_euler=(xyz(at)-o.location).to_track_quat('-Z','Y').to_euler();return o
for z in [13.1,15.1,17.1]:
 area('Ceiling amber bounce',(0,2.93,z),(0,0,z),150,2.6,(1,.77,.53))
 area('Port ceiling practical',(-3.25,2.78,z),(-3.6,1,z),38,1.2)
area('Service ceiling wash',(2.7,2.8,15.3),(3.8,1.2,15.3),130,2.9)
area('EVA display key',(-2.17,2.35,17.40),(-2.17,1.15,17.8),32,.65,(1,.83,.61))
area('Window space fill',(-4.7,2.1,15.3),(0,1,15.3),25,3,(.35,.55,1))
for z in [13.7,15.11,16.66,17.39]:area('Service amber practical',(3.45,2.49,z),(3.9,1.3,z),9,.43)
def camera(name,p,at):
 d=bpy.data.cameras.new(name);d.lens=25;o=bpy.data.objects.new(name,d);cols['10 Lighting and cameras'].objects.link(o);o.location=xyz(p);o.rotation_euler=(xyz(at)-o.location).to_track_quat('-Z','Y').to_euler();return o
port=camera('CAM / Lounge and EVA',(2.1,1.65,15.1),(-3.5,1.35,15.4))
starboard=camera('CAM / Service wall and access',(-2.1,1.65,15.1),(3.65,1.35,15.3))
master.camera=port
master.world=bpy.data.worlds.new('MASTER / Low space ambient');master.world.use_nodes=True
bg=next(n for n in master.world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs[0].default_value=(.025,.030,.045,1);bg.inputs[1].default_value=.25
for file,label in [('codex-clipboard-a0485840-a2e9-4695-98ef-014b7bc30f61.png','Service wall'),('codex-clipboard-4ea38203-d5ff-4082-98da-5301965ee544.png','Organic lounge'),('codex-clipboard-df83c039-a671-4eec-bcb3-fe7482094f87.png','Straight lounge')]:
 path=Path('C:/Users/joaqu/AppData/Local/Temp')/file
 if path.exists():
  image=bpy.data.images.load(str(path),check_existing=True);image.name='MASTER REFERENCE / '+label;image.pack()
  o=bpy.data.objects.new('Reference / '+label,None);o.empty_display_type='IMAGE';o.data=image;o.hide_render=True;o.location=(14,0,0);cols['11 Packed references'].objects.link(o)

bpy.context.view_layer.update()
print('LEAF_TRANSFORMS',leaf_left.name,leaf_left['closed_local_x'],leaf_right.name,leaf_right['closed_local_x'],flush=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'assembly-checkpoint.blend'),copy=True)
assert len(cols['06 Refined service wall'].objects)==375
assert abs(leaf_left['closed_local_x']+.685)<.001 and abs(leaf_right['closed_local_x']-.685)<.001
inventory={}
for key,col in cols.items():
 rows=[]
 for o in col.objects:
  if o.type not in {'MESH','CURVE','FONT'}:continue
  lo,hi=bounds(o);rows.append({'name':o.name,'min':lo,'max':hi})
  if key not in ['08 Sliding access door','11 Packed references','12 Space backdrop']:
   assert lo[2]>11.0 and hi[2]<18.9,(o.name,lo,hi)
 inventory[key]={'objects':len(col.objects),'geometry':len(rows),'bounds':rows}
report={'sources':sources,'removedOldServiceObjects':removed_service,'runtimeChanged':False,
 'coordinates':'Blender (x,-runtimeZ,runtimeY), metres','collections':inventory,
 'doors':{'fixed':{'position':[0,0,18.265],'yaw':pi},'slidingFrame':[0,-.18,11.17],
  'slidingLeaves':[0,-.18,11.65],'leftClosedOpen':[-.685,-2.055],'rightClosedOpen':[.685,2.055]},
 'terminal':[2,1.65,12.37],'eva':[-2.17,.18,17.765],
 'cameras':[port.name,starboard.name],'proceduralMaterialsRequireBaking':True}
(OUT/'assembly.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
master['workflow']='Editable master only. Runtime integration and collider/art validation are pending.'
master['runtime_coordinate_mapping']='(x,y,z) -> Blender (x,-z,y)'
master.render.engine='CYCLES';master.cycles.samples=32;master.cycles.use_denoising=True
master.render.resolution_x=1400;master.render.resolution_y=900;master.render.resolution_percentage=100
master.render.filepath=str(OUT/'master-lounge.png')
for screen in bpy.data.screens:
 for a in screen.areas:
  if a.type=='VIEW_3D':a.spaces.active.region_3d.view_perspective='CAMERA'
# Remove loaded-only datablocks from the new save, without touching source files.
bpy.ops.outliner.orphans_purge(do_recursive=True)
bpy.ops.wm.save_as_mainfile(filepath=str(target))
print('MASTER_ASSEMBLED',len(master.objects),target)
