"""Door, signs, lighting and source-only corrections after station render review."""
import bpy
import bmesh
import math
from pathlib import Path
from mathutils import Vector

ROOT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio')
src=(ROOT/'scripts/assets/build-station-reference-interior-live.py').read_text(encoding='utf-8')
scene=bpy.context.scene
root=bpy.data.collections['STATION / Reference interior']
if root.get('finishing_pass'):raise RuntimeError('Finishing pass already applied')
props=bpy.data.collections['STATION / 06 Interior dressing']
finish=bpy.data.collections['STATION / 04 Reference ceiling and fixtures']
displays=bpy.data.collections['STATION / 05 Display surfaces - static preview']
rig=bpy.data.collections['STATION / PREVIEW / Cameras and lighting']
graphite=bpy.data.materials['STATION / Ceiling graphite']
metal=bpy.data.materials['STATION / Grey titanium']
black=bpy.data.materials['STATION / Deep gasket']
warm=bpy.data.materials['STATION / Warm diffusers']
cyan=bpy.data.materials['STATION / Cyan display lines']
ivory=bpy.data.materials['STATION / Ivory stencil']
ns={'bpy':bpy,'bmesh':bmesh,'math':math,'Vector':Vector,'finish':finish,'props':props,'displays':displays,'ivory':ivory}
exec(src[src.index('def mesh('):src.index('layout=json.loads')],ns)
mesh,box,beam,curve,text=[ns[k] for k in ['mesh','box','beam','curve','text']]
exec(src[src.index('def area('):src.index("area('Forward warm ceiling'")],globals())

for o in bpy.data.collections['STATION / 02 Arrival lounge - working copy'].objects:
    if o.name.startswith('STN / ARR10 locker inset face'):
        o.hide_render=True
        o.hide_viewport=True

for o in props.objects:
    if o.type=='FONT' and o.data.body in ['DOCKING ACCESS','ARRIVAL / DEPARTURE']:
        o.rotation_euler=(math.pi/2,0,math.pi)
        o.location.y=-16.08
    if o.type=='MESH' and any(k in o.name for k in ['Arrival closed docking hatch','Docking hatch inset','Docking hatch viewport','Docking hatch warm jamb']):
        for v in o.data.vertices:v.co.y+=.3
    if any(k in o.name for k in ['Desk planter','Planter dark substrate','Plant flexible stem','Plant leaf']):
        o.location.y+=3.15

gold=bpy.data.materials['CDS / Ivory markings']
red=bpy.data.materials.new('STATION / Emergency red enamel')
red.use_nodes=True
p=next(n for n in red.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs['Base Color'].default_value=(.4,.035,.015,1)
p.inputs['Roughness'].default_value=.35

def ring_xz(name,outline,inner,y,depth,mat):
    N=len(outline)
    vs=[(x,yy,z) for yy in [y,y-depth] for points in [outline,inner] for x,z in points]
    fs=[]
    for i in range(N):
        j=(i+1)%N
        fs.extend([(i,j,N+j,N+i),(2*N+i,3*N+i,3*N+j,2*N+j),(i,2*N+i,2*N+j,j),(N+i,N+j,3*N+j,3*N+i)])
    return mesh(name,vs,fs,mat,props,.02)
outer=[(-1.36,.05),(1.36,.05),(1.52,.24),(1.52,2.46),(1.12,2.92),(-1.12,2.92),(-1.52,2.46),(-1.52,.24)]
inner=[(-1.14,.16),(1.14,.16),(1.27,.34),(1.27,2.31),(.98,2.66),(-.98,2.66),(-1.27,2.31),(-1.27,.34)]
ring_xz('Docking faceted pressure frame',outer,inner,-16.06,.13,graphite)
for a,b in zip(inner,inner[1:]+inner[:1]):
    beam('Docking frame machined seal',(a[0],-16.025,a[1]),(b[0],-16.025,b[1]),.035,metal,props)
for s in [-1,1]:
    # Overlay polygonal lower armor, hinges and a clearly separate manual release.
    coords=[(s*.15,.25),(s*1.04,.25),(s*1.12,.4),(s*1.12,1.35),(s*.78,1.12),(s*.15,1.12)]
    mesh('Docking lower chamfered armor',[(x,-16.025,z) for x,z in coords],[tuple(range(6))],metal,props)
    for z in [.55,1.8,2.35]:
        box('Docking door hinge',(s*1.13,-15.99,z),(.13,.08,.24),graphite,props,.025)
        box('Docking hinge pin',(s*1.13,-15.94,z),(.035,.04,.17),metal,props,.009)
    box('Docking outer vertical practical',(s*1.4,-15.91,1.45),(.045,.025,.7),warm,props,.008)
    for z in [.48,1.02,2.39]:
        for x in [s*.93,s*.35]:
            box('Door captive fastener',(x,-15.986,z),(.026,.018,.026),ivory,props,.004)
for i in range(7):
    x=-.65+i*.2
    beam('Docking warning diagonal',(x,-15.982,.35),(x+.11,-15.982,.46),.055,gold,props)
box('Docking access terminal chassis',(1.94,-16.0,1.72),(.7,.13,.58),graphite,props,.05)
box('Docking access terminal screen',(1.94,-15.92,1.72),(.59,.025,.46),black,props,.035)
text('DOCK',(1.94,-15.9,1.78),.09,(math.pi/2,0,math.pi),cyan)
text('A - 3',(1.94,-15.9,1.6),.12,(math.pi/2,0,math.pi),cyan)
box('Manual release backing',(1.94,-16,1.03),(.45,.1,.52),metal,props,.04)
box('Manual release recess',(1.94,-15.94,1.03),(.34,.025,.39),black,props,.03)
beam('Manual release handle',(1.84,-15.89,1.08),(2.04,-15.89,1.08),.07,red,props)
beam('Manual release stem',(1.94,-15.89,1.04),(1.94,-15.89,.9),.06,red,props)
text('EMERGENCY',(1.94,-15.9,1.35),.055,(math.pi/2,0,math.pi))
text('CRUZ DEL SUR',(-2.5,-16.12,2.17),.14,(math.pi/2,0,math.pi))
text('ORBITAL ACCESS',(-2.5,-16.12,1.98),.07,(math.pi/2,0,math.pi))

# Rear observation wall receives useful signage rather than a blank panel.
old=bpy.data.objects.get('STN / OBSERVATION / CRUZ DEL SUR')
if old:
    old.rotation_euler=(math.pi/2,0,math.pi)
    old.location.y=-1.78
    old.location.z=2.92
    old.data.body='CRUZ DEL SUR'
    old.data.size=.2
text('OBSERVATION / OPERATIONS',(0,-1.77,2.7),.07,(math.pi/2,0,math.pi),cyan)
box('Rear mission notes frame',(-2.85,-1.76,1.6),(1.02,.07,.66),metal,props,.035)
box('Rear mission notes backing',(-2.85,-1.71,1.6),(.91,.025,.55),black,props,.02)
for x,z,w,h in [(-3.1,1.69,.29,.23),(-2.72,1.67,.3,.27),(-2.99,1.44,.25,.16),(-2.66,1.43,.21,.14)]:
    box('Mission note insert',(x,-1.69,z),(w,.012,h),ivory,props,.008)
    for j in range(3):box('Mission note printed line',(x,-1.68,z-h*.25+j*h*.18),(w*.65,.005,.008),graphite,props,.001)
text('FIELD NOTES',(-2.85,-1.68,2.02),.065,(math.pi/2,0,math.pi))
box('Rear medical kit bracket',(-1.73,-1.7,1.35),(.36,.09,.44),graphite,props,.03)
box('Rear red medical kit',(-1.73,-1.63,1.35),(.3,.1,.36),red,props,.035)
box('Medical cross vertical',(-1.73,-1.568,1.35),(.035,.012,.17),ivory,props,.003)
box('Medical cross horizontal',(-1.73,-1.568,1.35),(.17,.012,.035),ivory,props,.003)

curve('Operations badge outline',[(2.85+.42*math.cos(i*math.tau/96),-1.72,2.0+.42*math.sin(i*math.tau/96)) for i in range(96)],.014,gold,props,True)
text('CDS',(2.85,-1.7,2.06),.16,(math.pi/2,0,math.pi),ivory)
text('OPERATIONS',(2.85,-1.7,1.87),.06,(math.pi/2,0,math.pi),cyan)

# A modest frontal fill lets small interior details read while retaining the warm practicals.
area('Entry warm camera fill',(0,-3,2.65),(0,3,1.2),120,(1,.73,.48),4,2)
bpy.data.objects['STN / Cool window bounce'].data.energy=180
bpy.data.objects['STN / Forward warm ceiling'].data.energy=220
area('Arrival lounge soft fill',(-1,-12,2.7),(-3,-13,1),110,(.65,.78,1),2,3)
area('Docking door warm fill',(0,-14,2.8),(0,-16.1,1.2),120,(1,.78,.54),2.5,2)

# A second camera shows more of the real ship through the forward panoramic opening.
cam=bpy.data.objects['STN / Forward console view']
cam.location=(0,.4,1.85)
cam.rotation_euler=(Vector((0,8,1.95))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.lens=19
scene.eevee.taa_render_samples=96
scene.eevee.use_raytracing=True
root['finishing_pass']=True
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/station-reference-interior/station-reference-interior.blend'))
print('STATION FINISHING PASS SAVED')
