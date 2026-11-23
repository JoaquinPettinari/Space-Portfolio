"""Reusable weighted astronaut gloves. Creates a new authoring file only."""
from pathlib import Path
from math import pi, sin, cos
import bpy, json
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/assets/astronaut-hands';OUT.mkdir(parents=True,exist_ok=True)
TARGET=OUT/'astronaut-hands.blend'
assert not TARGET.exists(),'Edit existing hand master; never regenerate over it'
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.name='CDS / Astronaut hands authoring';scene.unit_settings.system='METRIC'
def mat(name,c,rough=.55,metal=0,grain=0,emit=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=emit;m.diffuse_color=(*c,1)
 if grain:
  n=m.node_tree.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=grain
  b=m.node_tree.nodes.new('ShaderNodeBump');b.inputs['Strength'].default_value=.22;b.inputs['Distance'].default_value=.0006
  m.node_tree.links.new(n.outputs['Fac'],b.inputs['Height']);m.node_tree.links.new(b.outputs[0],p.inputs['Normal'])
 return m
mats=[mat('HAND / Graphite woven glove',(.024,.034,.04),.68,grain=260),mat('HAND / Reinforced finger pads',(.045,.056,.06),.6,grain=350),mat('HAND / Ivory pressure fabric',(.56,.53,.44),.79,grain=190),mat('HAND / Dark cuff rubber',(.012,.019,.022),.72),mat('HAND / Safety orange',(.9,.235,.035),.42,.2),mat('HAND / Brushed wrist alloy',(.14,.17,.18),.34,.72),mat('HAND / Cyan status',(.03,.58,.68),.3,emit=2),mat('HAND / Seam thread',(.23,.24,.22),.77)]
all_report=[]
def build(side,sign):
 col=bpy.data.collections.new('HAND / '+side);scene.collection.children.link(col)
 arm=bpy.data.armatures.new('HAND_SKELETON.'+side[0]);rig=bpy.data.objects.new('HAND_RIG.'+side[0],arm);col.objects.link(rig);rig.show_in_front=True
 bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
 bones={}
 def bone(name,a,b,parent=None):
  eb=arm.edit_bones.new(name);eb.head=(a[0]*sign,a[1],a[2]);eb.tail=(b[0]*sign,b[1],b[2]);eb.roll=0
  if parent:eb.parent=arm.edit_bones[parent]
  bones[name]=(Vector(eb.head),Vector(eb.tail));return name
 bone('forearm',(0,0,-.22),(0,0,0));bone('wrist',(0,0,0),(0,0,.065),'forearm')
 specs=[('index',.027,.083,[.035,.027,.022]),('middle',.009,.088,[.039,.029,.024]),('ring',-.010,.083,[.036,.027,.022]),('pinky',-.028,.074,[.028,.022,.020])]
 finger_paths={}
 for name,x,z,lengths in specs:
  ps=[Vector((x,0,z))]
  for length in lengths:ps.append(ps[-1]+Vector((0,0,length)))
  for i in range(3):bone(f'{name}.{i+1}',ps[i],ps[i+1],'wrist' if i==0 else f'{name}.{i}')
  finger_paths[name]=ps
 thumb=[Vector(p) for p in [( .031,-.004,.039),(.052,-.016,.065),(.047,-.027,.090),(.036,-.032,.105)]]
 for i in range(3):bone(f'thumb.{i+1}',thumb[i],thumb[i+1],'wrist' if i==0 else f'thumb.{i}')
 finger_paths['thumb']=thumb
 bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)
 verts=[];faces=[];face_mats=[];weights=[]
 def loft(rings,material,weight_fn,sides=16):
  start=len(verts)
  for ri,(center,rx,ry) in enumerate(rings):
   center=Vector(center)
   for j in range(sides):
    angle=2*pi*j/sides;p=center+Vector((rx*cos(angle),ry*sin(angle),0))
    verts.append((p.x*sign,p.y,p.z));weights.append(weight_fn(ri,center))
  for r in range(len(rings)-1):
   for j in range(sides):faces.append((start+r*sides+j,start+r*sides+(j+1)%sides,start+(r+1)*sides+(j+1)%sides,start+(r+1)*sides+j));face_mats.append(material)
  faces.append(tuple(start+j for j in reversed(range(sides))));face_mats.append(material)
  faces.append(tuple(start+(len(rings)-1)*sides+j for j in range(sides)));face_mats.append(material)
 def rigid(name):return lambda i,p:{name:1}
 # Smooth palm volume, tapered wrist and rounded metacarpal profile.
 loft([((0,0,z),rx,ry) for z,rx,ry in [(-.006,.025,.016),(.005,.028,.018),(.025,.037,.021),(.055,.043,.023),(.077,.042,.022),(.091,.036,.019),(.096,.028,.015)]],0,rigid('wrist'),24)
 # Forearm suit, soft folds are part of the silhouette rather than texture alone.
 sleeve=[]
 for i in range(25):
  t=i/24;z=-.225+t*.196;r=.048-(t*.014);fold=.0025*sin(t*pi*12)**2
  sleeve.append(((.004*sin(t*pi),.005*sin(t*pi),z),r+fold,(r+fold)*.82))
 loft(sleeve,2,rigid('forearm'),24)
 loft([((0,0,z),rx,ry) for z,rx,ry in [(-.036,.037,.031),(-.033,.040,.033),(-.014,.04,.033),(-.008,.034,.026)]],3,rigid('forearm'),24)
 loft([((0,0,z),.0404,.0334) for z in [-.027,-.021]],4,rigid('forearm'),24)
 # Skinning gradients cross each knuckle to allow deforming finger bends.
 for name,ps in finger_paths.items():
  lengths=[(ps[i+1]-ps[i]).length for i in range(3)];total=sum(lengths);cumulative=[0,lengths[0],lengths[0]+lengths[1],total]
  ring_positions=[];distances=[]
  for j in range(19):
   d=total*j/18;segment=next((k for k in range(3) if d<=cumulative[k+1]),2);t=(d-cumulative[segment])/lengths[segment]
   p=ps[segment].lerp(ps[segment+1],t)
   radius=(.0104 if name=='thumb' else .0091 if name=='pinky' else .0102)*(1-.22*j/18)
   if j==18:radius*=.32
   elif j==17:radius*=.75
   ring_positions.append((p,radius,radius*.91));distances.append(d)
  def weighting(ri,p):
   d=distances[ri];seg=next((k for k in range(3) if d<=cumulative[k+1]),2)
   for boundary in [1,2]:
    if abs(d-cumulative[boundary])<.007:
     t=(d-cumulative[boundary]+.007)/.014;return {f'{name}.{boundary}':1-t,f'{name}.{boundary+1}':t}
   return {f'{name}.{seg+1}':1}
  loft(ring_positions,0,weighting,14)
 mesh=bpy.data.meshes.new('Weighted glove surface.'+side[0]);mesh.from_pydata(verts,[],faces);mesh.materials.clear()
 for m in mats:mesh.materials.append(m)
 for p,mi in zip(mesh.polygons,face_mats):p.material_index=mi;p.use_smooth=True
 # Mirroring must preserve the outward winding.
 if sign<0:
  import bmesh
  bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.reverse_faces(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
 obj=bpy.data.objects.new('HAND_SURFACE.'+side[0],mesh);col.objects.link(obj);obj.parent=rig
 groups={name:obj.vertex_groups.new(name=name) for name in bones}
 for i,ws in enumerate(weights):
  for name,w in ws.items():groups[name].add([i],w,'REPLACE')
 mod=obj.modifiers.new('Shared hand articulation','ARMATURE');mod.object=rig
 smooth=obj.modifiers.new('Soft glove refinement','SUBSURF');smooth.levels=1;smooth.render_levels=1
 def attach(ob,bone_name):
  for c in list(ob.users_collection):c.objects.unlink(ob)
  col.objects.link(ob);ob.parent=rig
  # Rigid plates still use the same armature, keeping them exportable with the rig.
  vg=ob.vertex_groups.new(name=bone_name);vg.add(list(range(len(ob.data.vertices))),1,'REPLACE')
  md=ob.modifiers.new('Hand articulation','ARMATURE');md.object=rig
  return ob
 def pad(name,p,size,mi,bn,bevel=.003):
  bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0]*sign,p[1],p[2]));o=bpy.context.object;o.name=name+'.'+side[0];o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  # Apply location into mesh before armature so bone coordinates remain rig-local.
  bpy.ops.object.transform_apply(location=True,rotation=False,scale=False)
  o.data.materials.append(mats[mi]);attach(o,bn)
  b=o.modifiers.new('Soft seam radius','BEVEL');b.width=bevel;b.segments=3;o.modifiers.new('Normal finish','WEIGHTED_NORMAL');return o
 # Dorsal armor is soft-edged fabric, not mechanical claws.
 pad('Dorsal metacarpal pad',(0,-.023,.048),(.057,.009,.046),1,'wrist',.006)
 for name,ps in finger_paths.items():
  for segment in range(3):
   p=ps[segment].lerp(ps[segment+1],.52);p.y-=.0085
   length=(ps[segment+1]-ps[segment]).length*.58
   pad('Grip pad '+name+str(segment),p,(.015,.006,length),1,f'{name}.{segment+1}',.003)
 for x in [-.024,0,.024]:pad('Backhand seam',(x,-.029,.045),(.0015,.0018,.031),7,'wrist',.0005)
 pad('Wrist instrument cradle',(0,-.035,-.025),(.035,.013,.031),5,'forearm',.004)
 pad('Wrist instrument glass',(0,-.043,-.025),(.026,.004,.022),3,'forearm',.003)
 pad('Wrist status bar',(0,-.046,-.027),(.017,.002,.004),6,'forearm',.001)
 # Sleeve seams and safety ribbon follow the length without covering folds.
 pad('Sleeve orange identification',(0,-.041,-.133),(.012,.004,.102),4,'forearm',.002)
 for x in [-.025,.025]:pad('Sleeve stitched seam',(x,-.035,-.13),(.002,.002,.115),7,'forearm',.0007)
 for name,bn,offset in [('FINGERTIP_INDEX','index.3',(0,0,0)),('CARD_PINCH','thumb.3',(0,0,0))]:
  anchor=bpy.data.objects.new(name+'.'+side[0],None);col.objects.link(anchor);anchor.parent=rig;anchor.parent_type='BONE';anchor.parent_bone=bn;anchor.location=(0,0,0);anchor.empty_display_size=.006;anchor['contact_role']=name
 # Separate clip datablocks; each uses the same stable skeleton.
 actions={}
 for mode in ['neutral','tablet_hold','card_pinch','radio_press']:
  rig.animation_data_create();action=bpy.data.actions.new(mode+'.'+side[0]);action.use_fake_user=True;rig.animation_data.action=action
  for pb in rig.pose.bones:pb.rotation_mode='XYZ';pb.rotation_euler=(0,0,0)
  for fname in ['index','middle','ring','pinky']:
   bends=[0,0,0] if mode=='neutral' else [20,48,30] if mode=='tablet_hold' else [35,60,35]
   if mode=='radio_press' and fname=='index':bends=[-3,4,3]
   if mode=='card_pinch' and fname=='index':bends=[18,32,20]
   for i,degrees in enumerate(bends):rig.pose.bones[f'{fname}.{i+1}'].rotation_euler.x=-degrees*pi/180
  if mode=='card_pinch':rig.pose.bones['thumb.2'].rotation_euler.x=-.22
  if mode=='radio_press':rig.pose.bones['thumb.1'].rotation_euler.x=-.25
  for pb in rig.pose.bones:
   for f in [1,15,30]:pb.keyframe_insert(data_path='rotation_euler',frame=f,group=pb.name)
  actions[mode]=action
 rig.animation_data.action=actions['tablet_hold'];scene.frame_set(15)
 rig['asset_contract']='Z fingertips, -Z sleeve, front -Y; scale metres; root origin wrist'
 rig['available_poses']=['neutral','tablet_hold','card_pinch','radio_press']
 # Sources are held by collection instances, not visible twice in the authoring scene.
 scene.collection.children.unlink(col)
 all_report.append({'side':side,'collection':col.name,'rig':rig.name,'bones':len(bones),'surfaceVertices':len(verts),'unweightedVertices':sum(not w for w in weights),'actions':[a.name for a in actions.values()],'defaultPose':'tablet_hold'})
 return col
left=build('Left',1);right=build('Right',-1)
preview=bpy.data.collections.new('PREVIEW / Studio - not for export');scene.collection.children.link(preview)
for name,col,x in [('Left',left,-.10),('Right',right,.10)]:
 ob=bpy.data.objects.new('PREVIEW / '+name,None);preview.objects.link(ob);ob.instance_type='COLLECTION';ob.instance_collection=col;ob.location=(x,0,0)
world=bpy.data.worlds.new('Hands studio');world.use_nodes=True;scene.world=world
bg=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs[0].default_value=(.035,.045,.06,1);bg.inputs[1].default_value=.35
def aim(ob,target):ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
for name,pos,power,size,color in [('Key',(-.3,-.35,.4),45,.45,(1,.8,.61)),('Fill',(.35,-.25,.1),22,.35,(.48,.75,1)),('Rim',(0,.25,.3),45,.3,(1,.58,.27))]:
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color;o=bpy.data.objects.new(name,d);preview.objects.link(o);o.location=pos;aim(o,(0,0,0))
d=bpy.data.cameras.new('Hand review');d.lens=48;o=bpy.data.objects.new('CAM / Hand review',d);preview.objects.link(o);o.location=(.06,-.80,.15);aim(o,(0,0,-.025));scene.camera=o
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.resolution_x=1000;scene.render.resolution_y=950;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'hands-tablet-hold.png')
scene.frame_set(15);bpy.ops.object.select_all(action='DESELECT')
bpy.ops.wm.save_as_mainfile(filepath=str(TARGET))
(OUT/'validation.json').write_text(json.dumps({'units':'metres','front':'-Y','fingers':'+Z','forearm':'-Z','hands':all_report,'runtimeChanged':False},indent=2))
bpy.ops.render.render(write_still=True)
print('HANDS_MASTER_COMPLETE',TARGET,flush=True)
