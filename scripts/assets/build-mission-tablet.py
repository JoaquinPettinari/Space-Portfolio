"""Independent rugged tablet master, with a removable static React-layout preview."""
from pathlib import Path
from math import pi
import bpy,bmesh,json
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/mission-tablet';OUT.mkdir(parents=True,exist_ok=True)
TARGET=OUT/'mission-tablet.blend';assert not TARGET.exists(),'Edit the existing master instead of overwriting it'
bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene;scene.name='CRUZ DEL SUR / Mission tablet'
names=['01 Tablet chassis','02 Protectors and hardware','03 Screen and interaction anchors','04 Static UI preview - no export','05 Linked hands - no export','06 Studio - no export','07 Reference - no export']
cols={n:bpy.data.collections.new(n) for n in names}
for c in cols.values():scene.collection.children.link(c)
def mat(name,color,metal=0,rough=.5,emission=0,grain=0):
 m=bpy.data.materials.new('TABLET / '+name);m.use_nodes=True;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission;m.diffuse_color=(*color,1)
 if name.startswith('UI '):
  out=next(n for n in m.node_tree.nodes if n.type=='OUTPUT_MATERIAL')
  e=m.node_tree.nodes.new('ShaderNodeEmission');e.inputs['Color'].default_value=(*color,1);e.inputs['Strength'].default_value=1
  m.node_tree.links.new(e.outputs[0],out.inputs['Surface'])
 if grain:
  n=m.node_tree.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=grain
  b=m.node_tree.nodes.new('ShaderNodeBump');b.inputs['Strength'].default_value=.15;b.inputs['Distance'].default_value=.00014
  m.node_tree.links.new(n.outputs['Fac'],b.inputs['Height']);m.node_tree.links.new(b.outputs[0],p.inputs['Normal'])
 return m
graphite=mat('Graphite titanium',(.032,.039,.043),.7,.37,grain=180)
rubber=mat('Black impact elastomer',(.009,.014,.017),.05,.75,grain=220)
edge=mat('Machined edge',(.16,.17,.17),.8,.30)
orange=mat('Safety orange polymer',(.88,.19,.025),.12,.4,grain=125)
glass=mat('Inactive display glass',(.003,.018,.025),.25,.21)
cyan=mat('Cyan LED',(.02,.7,.78),.05,.3,3)
white=mat('Etched warm white',(.72,.78,.76),.1,.55)
ui=mat('UI background',(.003,.027,.037),0,.9,.4)
uiline=mat('UI cyan strokes',(.025,.25,.3),0,.9,.65)
uitext=mat('UI typography',(.55,.85,.88),0,.8,.8)
uiblack=mat('UI panel fill',(.005,.045,.055),0,.9,.35)
def link(o,col):
 for c in list(o.users_collection):c.objects.unlink(o)
 cols[col].objects.link(o)
def box(name,p,size,m,col=names[1],bevel=.001):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=bpy.context.object;o.name='TABLET / '+name;link(o,col);o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:
  b=o.modifiers.new('Manufactured radius','BEVEL');b.width=min(bevel,min(size)*.4);b.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def outline(w,h,c):return [(-w/2+c,-h/2),(w/2-c,-h/2),(w/2,-h/2+c),(w/2,h/2-c),(w/2-c,h/2),(-w/2+c,h/2),(-w/2,h/2-c),(-w/2,-h/2+c)]
def mesh(name,vs,faces,m,col=names[0],bevel=.0007):
 d=bpy.data.meshes.new(name);d.from_pydata(vs,[],faces);d.update();bm=bmesh.new();bm.from_mesh(d);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(d);bm.free()
 o=bpy.data.objects.new('TABLET / '+name,d);cols[col].objects.link(o);d.materials.append(m)
 if bevel:
  b=o.modifiers.new('Edge chamfer','BEVEL');b.width=bevel;b.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def slab(name,points,front,back,m,col=names[0]):
 n=len(points);vs=[(x,y,z) for y in [front,back] for x,z in points];faces=[tuple(range(n)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 return mesh(name,vs,faces,m,col)
def ring(name,outer,inner,front,back,m):
 vs=[(x,y,z) for y in [front,back] for path in [outer,inner] for x,z in path];faces=[]
 for i in range(8):
  j=(i+1)%8;faces.extend([(i,j,8+j,8+i),(16+i,24+i,24+j,16+j),(i,16+i,16+j,j),(8+i,8+j,24+j,24+i)])
 return mesh(name,vs,faces,m)
slab('Rear pressure shell',outline(.38,.246,.013),-.003,.012,graphite)
ring('Elastomer perimeter',outline(.39,.256,.015),outline(.366,.231,.012),-.005,.008,rubber)
ring('Front structural bezel',outline(.384,.25,.012),outline(.344,.208,.008),-.014,.001,graphite)
ring('Screen compression seal',outline(.345,.209,.008),outline(.336,.200,.006),-.015,-.01,rubber)
slab('SCREEN_GLASS',outline(.337,.201,.006),-.0147,-.012,glass,names[2])
for sx in [-1,1]:
 for sz in [-1,1]:
  points=[(sx*x,sz*z) for x,z in [(.148,.125),(.178,.125),(.192,.111),(.192,.077),(.181,.088),(.181,.106),(.171,.115),(.148,.115)]]
  slab('Orange corner guard',points,-.017,.008,orange,names[1])
 for z in [-.068,.068]:
  box('Side grip bumper',(sx*.189,-.006,z),(.009,.018,.048),rubber,bevel=.002)
 for z in [-.048,-.034,-.02,.02,.034,.048]:
  box('Recessed side vent',(sx*.180,-.0147,z),(.002,.001,.008),rubber,bevel=.0003)
 for z in [-.103,.103]:
  bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=.0018,depth=.0012,location=(sx*.174,-.015,z),rotation=(pi/2,0,0));o=bpy.context.object;o.name='TABLET / Captive bezel screw';link(o,names[1]);o.data.materials.append(edge)
  box('Screw slot',(sx*.174,-.0158,z),(.002,.0003,.00035),rubber,bevel=.0001)
slab('Sensor brow',[(-.027,.108),(-.021,.122),(.021,.122),(.027,.108)],-.016,-.008,rubber,names[1])
box('Status LED surround',(0,-.017,.115),(.014,.002,.006),edge,bevel=.002)
box('Status LED',(0,-.0182,.115),(.008,.001,.0024),cyan,bevel=.0008)
for x in [-.032,.032]:
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.0022,location=(x,-.015,.116));o=bpy.context.object;o.name='TABLET / Optical sensor';o.scale=(1,.3,1);link(o,names[1]);o.data.materials.append(glass)
for i in range(4):
 o=box('Brand slash',(-.129+i*.0035,-.015,.115),(.0016,.001,.004),orange,bevel=.0002);o.rotation_euler.y=-.4
box('Lower service insert',(0,-.015,-.115),(.073,.002,.006),rubber)
box('Lower release latch',(0,-.017,-.115),(.025,.004,.004),edge)
for x in [-.046,.046]:box('Lower chassis join',(x,-.015,-.115),(.012,.002,.002),edge)
box('Rear battery hatch',(0,.013,0),(.27,.004,.16),rubber,bevel=.0015)
box('Rear battery plate',(0,.016,0),(.264,.003,.154),graphite)
for x in [-.12,.12]:
 for z in [-.065,.065]:
  bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=.002,depth=.001,location=(x,.018,z),rotation=(pi/2,0,0));o=bpy.context.object;o.name='TABLET / Rear service screw';link(o,names[1]);o.data.materials.append(edge)
for name,x in [('POWER',.113),('VOLUME_UP',.133),('VOLUME_DOWN',.148)]:
 o=box('BUTTON_'+name,(x,0,.126),(.011,.009,.0025),rubber);o['travel_metres']=.001
def text(name,body,x,z,size,m=white,col=names[1],y=-.0155):
 d=bpy.data.curves.new(name,'FONT');d.body=body;d.size=size;d.extrude=.00002;d.align_y='CENTER'
 o=bpy.data.objects.new('TABLET / '+name,d);cols[col].objects.link(o);o.location=(x,y,z);o.rotation_euler.x=pi/2;d.materials.append(m);return o
text('Brand engraving','C R U Z   D E L   S U R',-.108,.115,.0031)
text('Asset ID','CDS / FIELD TERMINAL 07',.055,-.115,.0023)
# UI preview is deliberately separate: it will be replaced by React DOM at integration.
slab('Preview screen background',outline(.335,.199,.006),-.0157,-.0155,ui,names[3])
def panel(x,z,w,h):
 box('Preview panel edge',(x,-.016,z),(w,.0002,h),uiline,names[3],.00005)
 box('Preview panel fill',(x,-.0162,z),(w-.001,.0002,h-.001),uiblack,names[3],.00005)
def label(body,x,z,size=.003):return text('Preview '+body,body,x,z,size,uitext,names[3],-.0166)
label('CDS-01  MISSION ASSISTANT',-.155,.088,.0048)
label('EXPEDITION / CRUZ DEL SUR',.025,.088,.0029)
label('EXPEDITION / PAMPA-07',-.155,.075,.0025)
label('MISSION PROGRESS     2 / 4',.077,.075,.0024)
for i in range(8):box('Preview progress segment',(.113+i*.0055,-.0167,.068),(.004,.0002,.002),cyan if i<4 else uiline,names[3],.00005)
panel(-.045,.048,.224,.031);label('CURRENT OBJECTIVE',-.150,.057,.0026);label('Contact Mission Control',-.150,.046,.0046);label('Bridge / Starboard communications',-.150,.036,.0025)
panel(-.104,-.014,.108,.086);label('TASKS',-.151,.022,.0035)
for i,(prefix,line) in enumerate([('[X]','Verify crew identity'),('[X]','Review expedition archives'),('[03]','Contact Mission Control'),('[04]','Download crew dossier')]):
 z=.007-i*.018;label(prefix,-.151,z,.003);label(line,-.137,z,.0029)
 if i==2:box('Preview active task',(-.104,-.0164,z-.006),(.096,.0002,.0005),cyan,names[3],.00005)
panel(.011,-.014,.112,.086);label('DECK MAP',-.039,.022,.0035)
def stroke(points):
 d=bpy.data.curves.new('Preview map stroke','CURVE');d.dimensions='3D';d.bevel_depth=.00035;d.bevel_resolution=0;s=d.splines.new('POLY');s.points.add(len(points)-1)
 for v,(x,z) in zip(s.points,points):v.co=(x,-.0168,z,1)
 o=bpy.data.objects.new('TABLET / Preview map',d);cols[names[3]].objects.link(o);d.materials.append(uitext)
stroke([(-.012,-.026),(-.012,-.006),(-.005,.006),(.022,.006),(.033,-.006),(.033,-.026),(.02,-.026),(.02,-.038),(.034,-.038),(.037,-.049),(-.017,-.049),(-.014,-.038),(.001,-.038),(.001,-.026),(-.012,-.026)])
label('BOW',.004,.012,.002);label('ARRIVAL',-.002,-.045,.002)
for z,title,rows in [(.039,'SHIP STATUS',['Reactor       100%','Life support  100%','Comms          94%']),(-.008,'ENVIRONMENT',['PAMPA-07','-28 C    0.72 atm','12 m/s']),(-.045,'COMMS / LOG',['08:26 Archives indexed','08:14 Identity verified'])]:
 panel(.116,z,.087,.038);label(title,.078,z+.013,.003)
 for i,line in enumerate(rows):label(line,.078,z+.004-i*.008,.0025)
panel(-.078,-.079,.160,.030);label('CREW NOTES',-.151,-.071,.003);label('Confirm uplink before departure.',-.151,-.082,.0028)
panel(.084,-.079,.152,.030);label('NEXT WAYPOINT',.014,-.071,.003);label('Mission Control Uplink  >>',.014,-.082,.0033)
for name,p in [('SCREEN_UI',(0,-.0158,0)),('GRIP_LEFT',(-.205,.01,-.12)),('GRIP_RIGHT',(.205,.01,-.12)),('CARD_PRESENT',(0,-.06,0))]:
 o=bpy.data.objects.new(name,None);cols[names[2]].objects.link(o);o.location=p;o.empty_display_size=.012
 if name=='SCREEN_UI':o['width_metres']=.335;o['height_metres']=.199;o['runtime_role']='React DOM surface; static preview excluded'
scene.world=bpy.data.worlds.new('Tablet studio');scene.world.use_nodes=True
bg=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs['Color'].default_value=(.018,.027,.041,1);bg.inputs['Strength'].default_value=.4
for i,(p,energy,color,size) in enumerate([((-.35,-.45,.4),8,(1,.73,.50),.5),((.35,-.25,.1),5,(.42,.72,1),.4),((0,.18,.3),10,(1,.5,.23),.4)]):
 d=bpy.data.lights.new('Tablet softbox','AREA');d.energy=energy;d.color=color;d.shape='DISK';d.size=size;o=bpy.data.objects.new('LIGHT / '+str(i),d);cols[names[5]].objects.link(o);o.location=p;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
for name,p,target,lens in [('Tablet front',(0,-.72,.035),(0,0,-.035),45),('Tablet detail',(.30,-.43,.22),(0,0,0),50),('Tablet assembly',(0,-.90,.025),(0,0,-.07),42)]:
 d=bpy.data.cameras.new(name);d.lens=lens;o=bpy.data.objects.new('CAM / '+name,d);cols[names[5]].objects.link(o);o.location=p;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
scene.camera=bpy.data.objects['CAM / Tablet front'];scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1400;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG'
scene.unit_settings.system='METRIC'
for c in [cols[n] for n in names[3:]]:c['exclude_runtime_export']=True
bpy.ops.object.select_all(action='DESELECT')
for area in bpy.context.screen.areas:
 if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA';area.spaces.active.shading.type='MATERIAL'
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(TARGET))
(OUT/'tablet-contract.json').write_text(json.dumps({'bodyMetres':[.39,.256,.03],'coordinateSystem':'Blender X right, Z up, front -Y; glTF X right,Y up,front +Z','screenMetres':[.335,.199],'screenOrigin':[0,-.0158,0],'handGripOrigins':{'left':[-.205,.01,-.12],'right':[.205,.01,-.12]},'runtimeChanged':False,'staticUIPreviewExcluded':True},indent=2))
scene.render.filepath=str(OUT/'tablet-front.png');bpy.ops.render.render(write_still=True)
print('TABLET_MASTER_READY',str(TARGET),flush=True)
