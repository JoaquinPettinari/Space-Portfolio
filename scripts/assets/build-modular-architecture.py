import io,zipfile,math,os
import numpy as np
import trimesh
from trimesh.transformations import rotation_matrix,translation_matrix,scale_matrix
ROOT=os.path.dirname(__file__)
z=zipfile.ZipFile('/mnt/data/GLB format.zip')
cache={}
def load(n):
 if n not in cache:
  s=trimesh.load(io.BytesIO(z.read('GLB format/'+n+'.glb')),file_type='glb',force='scene');cache[n]=s
 return cache[n]
def mat(t=(0,0,0),yaw=0,sc=(1,1,1)):
 return translation_matrix(t)@rotation_matrix(yaw,(0,1,0))@np.diag([*sc,1])
def add(s,n,loc,rot=0,sc=(1,1,1),label=None):
 geo=load(n)
 for i,(name,g) in enumerate(geo.geometry.items()):
  s.add_geometry(g,geom_name=f'{n}_{len(s.geometry)}',node_name=f'{label or n}_{len(s.graph.nodes_geometry)}',transform=mat(loc,rot,sc))
def box(s,label,size,pos,color):
 m=trimesh.creation.box(extents=size);m.visual.vertex_colors=color;s.add_geometry(m,node_name=label,transform=translation_matrix(pos))
white=[149,169,177,255];dark=[40,64,78,255];cyan=[55,179,200,255];amber=[198,143,78,255]
def beam(s,a,b,width=0.13,depth=0.16,color=dark,label='RIB'):
 a=np.array(a);b=np.array(b);v=b-a;mid=(a+b)/2; m=trimesh.creation.box(extents=[width,np.linalg.norm(v),depth]);m.visual.vertex_colors=color;T=trimesh.geometry.align_vectors([0,1,0],v);T[:3,3]=mid;s.add_geometry(m,node_name=f'{label}_{len(s.geometry)}',transform=T)
def floor_grid(s,xmin,xmax,zmin,zmax,step=1.8):
 for x in np.arange(xmin+step/2,xmax,step):
  for zz in np.arange(zmin+step/2,zmax,step):
   add(s,'floor-panel',(x,-0.25,zz),sc=(step,.75,step),label='KIT_FLOOR')
# entry
s=trimesh.Scene();floor_grid(s,-2.7,2.7,3.2,6.8)
for x in [-2.7,2.7]:
 for zz in [4.1,5.9]:add(s,'wall-detail',(x,0,zz),math.pi/2,sc=(1.8,3,1),label='ENTRY_WALL')
for x in [-1.8,0,1.8]:add(s,'floor-panel',(x,2.9,5),sc=(1.8,.3,1.8),label='ENTRY_CEILING')
add(s,'wall-switch',(-2.52,1.05,4.55),math.pi/2,sc=(.8,1.5,.6),label='POWER_LOCATION_REFERENCE')
box(s,'ENTRY_LIGHT_CYAN',(3.8,.045,.06),(0,2.8,4.9),cyan)
s.export(os.path.join(ROOT,'01-entry-module.glb'))
# passage
s=trimesh.Scene();floor_grid(s,-1.8,1.8,0,3.6,step=1.8)
for zz in [0,1.8,3.6]:
 for x in [-1.82,1.82]:beam(s,(x,0,zz),(x,2.85,zz),.14,.18,white,'PASSAGE_POST')
 beam(s,(-1.82,2.85,zz),(1.82,2.85,zz),.14,.2,white,'PASSAGE_ROOF_RIB')
for x in [-1.82,1.82]:
 beam(s,(x,0,0),(x,0,3.6),.16,.15,dark,'LOWER_SILL')
 beam(s,(x,2.85,0),(x,2.85,3.6),.16,.15,dark,'UPPER_SILL')
for zz in [0.9,2.7]:
 for x in [-1.8,1.8]:add(s,'wall-window-frame',(x,0,zz),math.pi/2,sc=(1.8,2.7,.65),label='KIT_WINDOW_FRAME')
for zz in [0.9,2.7]:add(s,'floor-panel',(0,2.85,zz),sc=(3.6,.25,1.8),label='PARTIAL_CEILING')
s.export(os.path.join(ROOT,'02-panoramic-passage.glb'))
# bridge: rear rectangle z=-0.2..-4.8, faceted front z=-4.8..-10.8
s=trimesh.Scene()
for x in np.arange(-4.5,4.51,1.8):
 for zz in np.arange(-0.9,-10.0,-1.8):
  # faceted nose: narrower forward
  width=4.7 if zz>=-5 else 4.7-(abs(zz)-5)*.32
  if abs(x)<width-.2:add(s,'floor-panel',(x,-.25,zz),sc=(1.8,.75,1.8),label='KIT_BRIDGE_FLOOR')
# bow panoramic structural nodes, front at -10.8, side angled
segments=[((-4.6,-4.8),(-3.25,-10.5)),((-3.25,-10.5),(3.25,-10.5)),((3.25,-10.5),(4.6,-4.8))]
for k,(a,b) in enumerate(segments):
 ax,az=a;bx,bz=b
 for frac in [0,.5,1]:
  x=ax+(bx-ax)*frac;zz=az+(bz-az)*frac
  beam(s,(x,0,zz),(x,2.5,zz),.17,.19,white,'BOW_MULLION')
  beam(s,(x,2.5,zz),(x,3.35,zz+1.2),.16,.19,white,'SLOPED_SKYLIGHT_RIB')
 beam(s,(ax,0,az),(bx,0,bz),.2,.2,dark,'LOWER_BOW_FRAME')
 beam(s,(ax,2.5,az),(bx,2.5,bz),.18,.18,white,'UPPER_BOW_FRAME')
 beam(s,(ax,3.35,az+1.2),(bx,3.35,bz+1.2),.18,.18,white,'ROOF_SPINE')
# roof middle with strips behind glazing; open skylight areas are intentionally empty
for zz in [-1.0,-2.8,-4.6]:
 for x in [-3.6,-1.8,0,1.8,3.6]:add(s,'floor-panel',(x,3.25,zz),sc=(1.8,.3,1.8),label='KIT_REAR_CEILING')
# rear wall modules
for x in [-3.6,-1.8,1.8,3.6]:add(s,'wall-detail',(x,0,-.1),sc=(1.8,3.1,.8),label='KIT_REAR_WALL')
for x in [-4.65,4.65]:
 for zz in [-.9,-2.7,-4.5]:add(s,'wall-window-frame',(x,0,zz),math.pi/2,sc=(1.8,3.1,.8),label='KIT_SIDE_WALL')
# horseshoe command bench near glass, in three sections
for i,(a,b) in enumerate(segments):
 ax,az=a;bx,bz=b
 # console 1m back toward player from bow line, only left and right + center
 a2=(ax*.84,az+1.1);b2=(bx*.84,bz+1.1)
 length=math.hypot(b2[0]-a2[0],b2[1]-a2[1]);mid=((a2[0]+b2[0])/2,.82,(a2[1]+b2[1])/2)
 angle=math.atan2(-(b2[1]-a2[1]),b2[0]-a2[0]);T=translation_matrix(mid)@rotation_matrix(angle,(0,1,0))
 m=trimesh.creation.box(extents=(length,.85,.75));m.visual.vertex_colors=dark;s.add_geometry(m,node_name=f'U_CONSOLE_SECTION_{i}',transform=T)
 beam(s,(a2[0],1.31,a2[1]),(b2[0],1.31,b2[1]),.09,.1,amber,'CONSOLE_TRIM')
# physical screen anchor objects (not substitute for functional monitors)
for name,pos in [('CENTRAL_ARCHIVE_ANCHOR',(-2.35,1.5,-7.8)),('EARTH_COMMS_ANCHOR',(2.35,1.5,-7.8))]:
 box(s,name,(.65,.04,.04),pos,cyan)
# rear decorative stations
add(s,'table-display-planet',(0,.05,-4.3),sc=(2,2,2),label='TACTICAL_TABLE_PLACEHOLDER')
add(s,'computer-wide',(3.1,0,-2),sc=(1.5,1.5,1.5),label='PERSONAL_STATION_REFERENCE')
add(s,'table',(-3.15,0,-2),sc=(1.5,1.3,1.5),label='COFFEE_REFERENCE')
s.export(os.path.join(ROOT,'03-faceted-bridge.glb'))
print('built',[(f,os.stat(os.path.join(ROOT,f)).st_size) for f in ['01-entry-module.glb','02-panoramic-passage.glb','03-faceted-bridge.glb']])
