"""Reference desk/chair pass. Preserve all screen anchors and collision envelopes."""
from pathlib import Path
from math import sin,cos,pi
import bpy,bmesh,json
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];folder=ROOT/'docs/assets/bridge';scene=bpy.context.scene
assert scene.name=='Bridge - Finished Interior'
assert not bpy.data.collections.get('BRIDGE / Desk and seating finish')
bpy.data.libraries.write(str(folder/'bridge-interior-backup.blend'),{scene},fake_user=True,compress=True)
collection=bpy.data.collections.new('BRIDGE / Desk and seating finish');scene.collection.children.link(collection)
materials={m.name.removeprefix('BRIDGE V15 '):m for m in bpy.data.materials if m.name.startswith('BRIDGE V15 ')}
materials['Upholstery']=bpy.data.materials['BRIDGE Upholstery']
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))
layout=json.loads((folder/'layout.json').read_text());chairs={**layout['monitors'],**layout['sideChairs']}
protected={o.name:(o.matrix_world.copy(),dict(o.items())) for o in scene.objects if o.get('interaction')}
removed=[]
for o in list(scene.objects):
 if not o.name.startswith('Command seat '):continue
 # Retain the proven cushions and five-spoke base. Replace the boxy rear/arms.
 if any(s in o.name for s in ['faceted shell','rear service inset','rear ventilation','rear fastener','rear amber marker','arm support','arm body','arm pad','back edge piping']):
  removed.append(o.name);bpy.data.objects.remove(o,do_unlink=True)
 elif 'caster wheel' in o.name:
  # Twelve-sided rubber wheels do not need bevel tessellation on every edge.
  for m in list(o.modifiers):
   if m.type=='BEVEL':o.modifiers.remove(m)
for kind,m in chairs.items():
 pose={'x':m['chair'][0],'z':m['chair'][2]-3.15,'yaw':m['rotation']}
 def world(p):
  x,y,z=p;a=pose['yaw'];return(pose['x']+x*cos(a)+z*sin(a),y,pose['z']-x*sin(a)+z*cos(a))
 def part(name,p,size,mat,bevel=.006):return box('Command seat '+kind+' '+name,p,size,mat,bevel,pose)
 def panel(name,outline,back,front,mat):
  n=len(outline);return mesh('Command seat '+kind+' '+name,[world((x,y,z)) for z in [back,front] for x,y in outline],[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],mat,.006)
 # Tapered rear armor with shoulder cut-ins and separate headrest support.
 outline=[(-.29,.75),(.29,.75),(.30,.91),(.26,1.12),(.19,1.19),(-.19,1.19),(-.26,1.12),(-.30,.91)]
 panel('sculpted rear armor',outline,.30,.39,'Metal')
 inset=[(-.225,.80),(.225,.80),(.23,.92),(.195,1.09),(.145,1.13),(-.145,1.13),(-.195,1.09),(-.23,.92)]
 panel('rear graphite insert',inset,.392,.399,'Graphite')
 part('headrest spine',(0,1.19,.33),(.12,.17,.055),'Metal')
 panel('headrest rear cap',[(-.19,1.175),(.19,1.175),(.17,1.285),(-.17,1.285)],.30,.365,'Graphite')
 for side in (-1,1):
  beam('Command seat '+kind+' exposed back rail',world((side*.29,.77,.398)),world((side*.21,1.13,.398)),.018,'Ivory')
  # Open bent arm bracket; keep top at .935 and width under .84m.
  points=[(side*.33,.60,.20),(side*.37,.69,.24),(side*.37,.85,.16),(side*.35,.88,-.20)]
  for a,b in zip(points,points[1:]):beam('Command seat '+kind+' bent arm bracket',world(a),world(b),.035,'Metal')
  part('soft arm pad',(side*.35,.916,-.045),(.11,.035,.42),'Upholstery',.01)
  part('arm hinge',(side*.35,.67,.20),(.06,.08,.075),'Graphite')
  for y in (.82,1.08):part('armor captive bolt',(side*.18,y,.408),(.018,.018,.009),'Metal',.002)
 for j in range(3):part('rear cooling slot',(0,.93+j*.034,.405),(.20,.009,.008),'Gasket',.001)
 part('rear warm marker',(0,.81,.407),(.13,.012,.008),'Amber',.002)
 part('lumbar seam',(0,.96,.209),(.39,.007,.006),'Graphite',.001)
 # Rear seat-height paddle, visible without introducing an interaction.
 part('height adjustment stalk',(.25,.56,.13),(.19,.018,.025),'Metal')
 part('height adjustment paddle',(.325,.56,.13),(.06,.027,.075),'Graphite')
# Desk supports flank each knee opening; no objects below the desktop in the opening.
for i,seg in enumerate(layout['consoles']):
 if 'opening' not in seg:continue
 pose=dict(seg);pose['z']-=3.15;opening=seg['opening']
 for side in (-1,1):
  x=opening+side*.72
  box('Desk drawer backing',(x,.49,.542),(.29,.72,.025),'Graphite',.004,pose)
  for row in range(3):
   y=.26+row*.225
   box('Desk machined drawer',(x,y,.56),(.27,.205,.025),'Metal',.006,pose)
   box('Desk recessed pull',(x,y+.055,.575),(.13,.027,.009),'Gasket',.003,pose)
   box('Desk pull lower lip',(x,y+.042,.582),(.11,.009,.012),'Ivory',.002,pose)
  box('Desk undercounter lamp housing',(x,.90,.55),(.30,.055,.05),'Graphite',.005,pose)
  box('Desk undercounter warm strip',(x,.90,.58),(.23,.016,.012),'Amber',.003,pose)
 # Low-profile forearm support on the outer edge; keyboard remains unchanged.
 box('Desk padded wrist edge',(opening,1.058,.474),(.82,.027,.065),'Upholstery',.009,pose)
 # Mouse stays beside the existing .57m keyboard, below the screen aperture.
 box('Desk mouse pad',(opening+.39,1.047,.32),(.17,.006,.26),'Gasket',.002,pose)
 box('Desk mouse body',(opening+.39,1.073,.31),(.075,.043,.12),'Graphite',.016,pose)
 box('Desk mouse central split',(opening+.39,1.096,.286),(.003,.003,.045),'Metal',.001,pose)
 # Rear cable grommet, still below the existing monitor mount.
 box('Desk cable access',(opening-.40,1.048,-.16),(.12,.009,.09),'Graphite',.004,pose)
 for j in range(3):box('Desk cable slot',(opening-.44+j*.04,1.054,-.16),(.012,.003,.06),'Gasket',.001,pose)
# Shared UVs/materials keep the existing material batching budget.
for o in collection.objects:
 if o.type!='MESH':continue
 uv=o.data.uv_layers.new(name='Surface metres')
 for poly in o.data.polygons:
  axis=max(range(3),key=lambda k:abs(poly.normal[k]));axes=[k for k in range(3) if k!=axis]
  for li in poly.loop_indices:
   p=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=(p[axes[0]],p[axes[1]])
bpy.context.view_layer.update()
for name,(matrix,extras) in protected.items():
 o=bpy.data.objects[name];assert o.matrix_world==matrix and dict(o.items())==extras
# Verify evaluated geometry, including bevels, remains inside chair colliders.
deps=bpy.context.evaluated_depsgraph_get()
for kind,m in chairs.items():
 for o in scene.objects:
  if not o.name.startswith('Command seat '+kind+' '):continue
  e=o.evaluated_get(deps);data=e.to_mesh();a=m['rotation']
  for v in data.vertices:
   p=o.matrix_world@v.co;dx=p.x-m['chair'][0];dz=-p.y-(m['chair'][2]-3.15)
   assert abs(dx*cos(a)-dz*sin(a))<=.422 and abs(dx*sin(a)+dz*cos(a))<=.422,o.name
   assert -.002<=p.z<=1.302,o.name
  e.to_mesh_clear()
old_versions=bpy.context.preferences.filepaths.save_version
try:
 bpy.context.preferences.filepaths.save_version=0
 bpy.ops.wm.save_as_mainfile(filepath=str(folder/'bridge-interior-final.blend'),compress=True)
finally:bpy.context.preferences.filepaths.save_version=old_versions
print('Desk/seat pass',len(collection.objects),'new pieces,',len(removed),'replaced. Four screen anchors and evaluated seat envelopes preserved.')
