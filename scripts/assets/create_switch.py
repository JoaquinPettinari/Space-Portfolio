import trimesh, numpy as np, math, os
from trimesh.transformations import rotation_matrix
OUT=os.path.dirname(__file__)
s=trimesh.Scene()
C={'white':[198,207,207,255],'white2':[145,162,166,255],'dark':[28,39,46,255],'black':[10,16,21,255],'steel':[73,86,94,255],'amber':[255,158,42,255],'red':[196,48,43,255],'green':[50,230,139,255],'cyan':[58,203,227,255],'rubber':[19,27,30,255]}
def add(name,ext,pos,color):
 m=trimesh.creation.box(extents=ext);m.apply_translation(pos);m.visual.face_colors=C[color];s.add_geometry(m,node_name=name,geom_name=name)
def cyl(name,r,h,pos,color,axis='z',sections=20):
 m=trimesh.creation.cylinder(radius=r,height=h,sections=sections)
 if axis=='z':m.apply_transform(rotation_matrix(math.pi/2,[1,0,0]))
 m.apply_translation(pos);m.visual.face_colors=C[color];s.add_geometry(m,node_name=name,geom_name=name)
# X width, Y height, Z depth; wall behind at Z=-0.09, front toward +Z
add('Housing_Backplate',(0.35,0.55,0.07),(0,0,-0.045),'dark')
add('Housing_WhiteFront',(0.326,0.524,0.035),(0,0,0.009),'white')
add('Housing_InnerRecess',(0.278,0.392,0.012),(0,-0.025,0.034),'steel')
add('Housing_CentralBlackPanel',(0.251,0.365,0.016),(0,-0.025,0.043),'black')
# side trim / corner mechanical fixtures
for x in [-0.155,0.155]:
 add(f'SideTrim_{x}',(0.012,0.48,0.025),(x,0,0.036),'white2')
 for y in [-0.235,0.235]:cyl(f'Bolt_{x}_{y}',0.009,0.005,(x,y,0.049),'dark')
# upper status display and indicator rails
add('StatusPanel',(0.245,0.082,0.012),(0,0.169,0.061),'dark')
add('StatusPanelScreen',(0.211,0.045,0.003),(0,0.169,0.069),'cyan')
add('StatusScreenOverlay',(0.197,0.031,0.003),(0,0.169,0.073),'black')
add('StatusBarAmber',(0.070,0.008,0.004),(-0.055,0.169,0.078),'amber')
add('StatusBarCyan',(0.052,0.008,0.004),(0.045,0.169,0.078),'cyan')
# caution stripes as independent mesh slats, on side rails
for side in [-1,1]:
 x=side*0.119
 for i in range(7):
  y=-0.196+i*0.044
  add(f'HazardStripe_{side}_{i}',(0.019,0.019,0.004),(x,y,0.058),'amber')
# OFF/ON lamps, on by material swap via named mesh
cyl('Indicator_OFF_Red',0.020,0.011,(-0.052,0.082,0.069),'red')
cyl('Indicator_ON_Green',0.020,0.011,(0.052,0.082,0.069),'green')
for x in [-0.052,0.052]:cyl(f'IndicatorBezel_{x}',0.026,0.007,(x,0.082,0.061),'steel')
# lever hub and shaft as a single independently animatable assembly, with origin at pivot
# lever points up when OFF; rotation about local X around pivot will tilt down toward front
pivot=(0,-0.072,0.091)
def lever_part(name,ext,local,color):
 m=trimesh.creation.box(extents=ext);m.apply_translation(local);m.visual.face_colors=C[color]
 s.add_geometry(m,node_name=name,geom_name=name,transform=trimesh.transformations.translation_matrix(pivot))
# named moving pieces can be parented in Three.js under a single pivot group
lever_part('LEVER_SHAFT_ANIMATE',(0.030,0.126,0.031),(0,0.061,0),'steel')
lever_part('LEVER_GRIP_ANIMATE',(0.068,0.050,0.054),(0,0.135,0),'dark')
lever_part('LEVER_GRIP_AMBER_ANIMATE',(0.065,0.010,0.055),(0,0.160,0),'amber')
cyl('LeverPivotFixed',0.048,0.018,pivot,'steel')
cyl('LeverPivotInnerFixed',0.032,0.022,(0,-0.072,0.104),'black')
# lower safety plate and cable port
add('LowerMaintenancePlate',(0.20,0.075,0.012),(0,-0.224,0.062),'white2')
for x in [-0.072,0.072]:cyl(f'LowerScrew_{x}',0.008,0.005,(x,-0.224,0.070),'dark')
add('LowerWarningStrip',(0.14,0.009,0.004),(0,-0.255,0.073),'amber')
path=os.path.join(OUT,'cruz-del-sur-auxiliary-power-switch.glb')
s.export(path)
print(path,os.path.getsize(path),len(s.geometry))
