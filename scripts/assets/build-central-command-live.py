"""Central command console, fitted to the existing 3.2m middle desk."""
from pathlib import Path
from math import sin,cos,pi
import bpy,bmesh,json
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
folder=ROOT/'docs/assets/bridge'
scene=bpy.context.scene
assert scene.name=='Bridge - Finished Interior'
assert not bpy.data.collections.get('BRIDGE / Central command')
bpy.data.libraries.write(str(folder/'bridge-interior-backup.blend'),{scene},fake_user=True,compress=True)
collection=bpy.data.collections.new('BRIDGE / Central command');scene.collection.children.link(collection)
materials={m.name.removeprefix('BRIDGE V15 '):m for m in bpy.data.materials if m.name.startswith('BRIDGE V15 ')}
materials['Safety']=bpy.data.materials['BRIDGE Safety paint']
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))
# Remove only the two small central readouts and the central cabinet's trim.
removed=[]
for o in list(scene.objects):
 if o.type!='MESH':continue
 pts=[o.matrix_world@Vector(v) for v in o.bound_box]
 lo=[min(v[k] for v in pts) for k in range(3)];hi=[max(v[k] for v in pts) for k in range(3)]
 instrument=o.name.startswith('Instrument') and lo[0]>-1.1 and hi[0]<1.1 and lo[1]>7.6 and hi[1]<8.15 and lo[2]>1.04 and hi[2]<1.25
 trim=o.name.startswith(('Perimeter cabinet panel','Perimeter cabinet pull','Perimeter cabinet vent','Cabinet ','Stencil SERVICE')) and lo[0]>-.5 and hi[0]<.5 and lo[1]>7.2 and hi[1]<7.30 and hi[2]<.9
 if instrument or trim:removed.append(o.name);bpy.data.objects.remove(o,do_unlink=True)
assert len(removed)>30

def contour(w,h,c,cx=0,cy=0):
 return [(cx-w/2+c,cy-h/2),(cx+w/2-c,cy-h/2),(cx+w/2,cy-h/2+c),(cx+w/2,cy+h/2-c),(cx+w/2-c,cy+h/2),(cx-w/2+c,cy+h/2),(cx-w/2,cy+h/2-c),(cx-w/2,cy-h/2+c)]
def plate(name,w,h,c,y,z,mat,thick=.03,cx=0):
 p=contour(w,h,c,cx,y);n=len(p)
 return mesh(name,[(x,v,d) for d in [z-thick,z] for x,v in p],[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],mat,.003)
def rim(name,w,h,c,y,z,mat,width=.035,cx=0):
 a=contour(w,h,c,cx,y);b=contour(w-2*width,h-2*width,max(.01,c-width/2),cx,y)
 return mesh(name,[(x,v,z) for x,v in a+b],[(i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8)],mat,0)
def label(t,x,y,z,size=.035,mat='Ivory'):
 data=bpy.data.curves.new('Command label','FONT');data.body=t;data.size=size;data.align_x='CENTER';data.extrude=0;data.resolution_u=2
 obj=bpy.data.objects.new('Central label '+t,data);collection.objects.link(obj);obj.location=xyz((x,y,z));obj.rotation_euler=(pi/2,0,0);data.materials.append(materials[mat])
 bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH');return bpy.context.object
# Large, clipped-corner layered monitor. No new interaction target.
plate('Central monitor chassis',2.46,.77,.13,1.62,-8.03,'Graphite',.11)
plate('Central monitor armor',2.43,.74,.12,1.62,-8.015,'Metal',.022)
plate('Central monitor gasket',2.33,.64,.09,1.62,-7.993,'Gasket',.012)
rim('Central monitor bright lip',2.42,.73,.12,1.62,-7.986,'Ivory',.012)
# One packed emissive image for all auxiliary displays.
mat=bpy.data.materials.new('BRIDGE Central navigation');mat.use_nodes=True
p=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Roughness'].default_value=.72
image=bpy.data.images.load(str(folder/'textures-final/central-navigation.png'),check_existing=True);image.pack()
t=mat.node_tree.nodes.new('ShaderNodeTexImage');t.image=image
mat.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color']);mat.node_tree.links.new(t.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=.7
materials['Navigation']=mat

def display(name,x,y,z,w,h,slope=0):
 obj=mesh(name,[(x-w/2,y-h/2,z+slope*h/2),(x+w/2,y-h/2,z+slope*h/2),(x+w/2,y+h/2,z-slope*h/2),(x-w/2,y+h/2,z-slope*h/2)],[(0,1,2,3)],'Navigation',0)
 uv=obj.data.uv_layers.new(name='Display');coords=[(0,0),(1,0),(1,1),(0,1)]
 for poly in obj.data.polygons:
  for li in poly.loop_indices:uv.data[li].uv=coords[obj.data.loops[li].vertex_index]
 return obj

display('Central panoramic navigation display',0,1.62,-7.978,2.24,.56)
for side in (-1,1):
 for x,y in [(side*1.16,1.35),(side*1.10,1.93)]:box('Central monitor fastener',(x,y,-7.975),(.025,.025,.009),'Graphite',.003)
 box('Central monitor foot',(side*.91,1.14,-8.04),(.20,.20,.19),'Graphite',.01)
 box('Central monitor lower light',(side*.90,1.255,-7.97),(.24,.012,.018),'Amber',.003)
 # Auxiliary side instrument above outer desk edge.
 plate('Central side readout housing',.31,.27,.035,1.40,-7.99,'Metal',.08,side*1.43)
 display('Central side readout',side*1.43,1.40,-7.98,.265,.20)
 box('Central side lamp recess',(side*1.43,1.60,-8.01),(.31,.06,.055),'Graphite')
 box('Central side practical',(side*1.43,1.60,-7.975),(.24,.022,.012),'Amber',.004)
# Sloping physical control deck lies entirely over the existing desktop.
mesh('Central inclined control desk',[(-1.30,1.043,-7.94),(1.30,1.043,-7.94),(1.30,1.043,-7.33),(-1.30,1.043,-7.33),(-1.30,1.20,-7.94),(1.30,1.20,-7.94),(1.30,1.07,-7.33),(-1.30,1.07,-7.33)],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'Metal',.009)
def height(z):return 1.07+(-7.33-z)*(.13/.61)
# Small embedded screen in the sloping deck.
verts=[(-.39,height(-7.83)+.006,-7.83),(.39,height(-7.83)+.006,-7.83),(.39,height(-7.44)+.006,-7.44),(-.39,height(-7.44)+.006,-7.44)]
obj=mesh('Central lower display bezel',verts,[(0,1,2,3)],'Graphite',0)
verts=[(-.34,height(-7.79)+.009,-7.79),(.34,height(-7.79)+.009,-7.79),(.34,height(-7.48)+.009,-7.48),(-.34,height(-7.48)+.009,-7.48)]
obj=mesh('Central lower navigation display',verts,[(0,1,2,3)],'Navigation',0)
uv=obj.data.uv_layers.new(name='Display')
for poly in obj.data.polygons:
 for li in poly.loop_indices:uv.data[li].uv=[(0,1),(1,1),(1,0),(0,0)][obj.data.loops[li].vertex_index]
for side in (-1,1):
 for col in range(3):
  for row in range(3):
   x=side*(.46+col*.073);z=-7.78+row*.11;y=height(z)
   box('Central key socket',(x,y+.012,z),(.063,.025,.08),'Graphite',.004)
   box('Central illuminated key',(x,y+.027,z),(.043,.012,.057),'Amber' if (col+row)%3==0 else 'Ivory',.003)
 for i in range(3):
  x=side*(.85+i*.13);z=-7.65;y=height(z)
  box('Central lever well',(x,y+.008,z),(.08,.018,.24),'Gasket',.004)
  beam('Central toggle lever',(x,y+.02,z+.03),(x,y+.10,z-.01),.018,'Metal')
  box('Central toggle cap',(x,y+.10,z-.01),(.045,.025,.032),'Ivory',.004)
  box('Central toggle lamp',(x,height(-7.46)+.015,-7.46),(.035,.014,.026),'Amber',.003)
 # Cabinet vent flanking the central hatch; face ahead of the existing base.
 plate('Central vent panel',.45,.70,.035,.48,-7.258,'Metal',.025,side*.96)
 plate('Central vent dark well',.34,.43,.022,.43,-7.247,'Gasket',.006,side*.96)
 for row in range(9):box('Central vent louver',(side*.96,.245+row*.046,-7.235),(.32,.018,.028),'Graphite',.003)
 box('Central vent practical',(side*.96,.855,-7.233),(.31,.020,.024),'Amber',.004)
 for dx in (-.19,.19):
  for y in (.17,.78):box('Central panel bolt',(side*.96+dx,y,-7.223),(.018,.018,.008),'Graphite',.003)
plate('Central service hatch',1.30,.74,.065,.47,-7.258,'Metal',.025)
plate('Central service inset',1.20,.64,.05,.47,-7.243,'Graphite',.008)
label('CRUZ DEL SUR',0,.57,-7.230,.055)
label('EXPLORATION VESSEL',0,.51,-7.230,.022)
for i in range(7):
 x=-.48+i*.145
 mesh('Central safety stripe',[(x,.19,-7.229),(x+.07,.19,-7.229),(x+.13,.255,-7.229),(x+.06,.255,-7.229)],[(0,1,2,3)],'Safety',0)
for side in (-1,1):
 for y in (.25,.68):box('Central hatch hinge',(side*.60,y,-7.225),(.025,.12,.025),'Metal',.004)
box('Central service grab rail',(0,.92,-7.225),(.98,.035,.05),'Graphite',.008)
# Existing shared materials/UV scale and static batching keep runtime costs bounded.
for obj in collection.objects:
 if obj.type!='MESH' or obj.data.uv_layers:continue
 uv=obj.data.uv_layers.new(name='Surface metres')
 for poly in obj.data.polygons:
  axis=max(range(3),key=lambda k:abs(poly.normal[k]));axes=[k for k in range(3) if k!=axis]
  for li in poly.loop_indices:
   p=obj.data.vertices[obj.data.loops[li].vertex_index].co;uv.data[li].uv=(p[axes[0]],p[axes[1]])
bpy.context.view_layer.update()
print('Central command created',len(collection.objects),'removed',len(removed))
bpy.ops.wm.save_as_mainfile(filepath=str(folder/'bridge-interior-final.blend'),compress=True)
