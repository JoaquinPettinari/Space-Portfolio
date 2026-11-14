"""Fit display surfaces and refine only the independent station working copy."""
import bpy
import bmesh
import math
import random
from pathlib import Path
from mathutils import Vector

ROOT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio')
src=(ROOT/'scripts/assets/build-station-reference-interior-live.py').read_text(encoding='utf-8')
scene=bpy.context.scene
root=bpy.data.collections['STATION / Reference interior']
room=bpy.data.collections['STATION / 01 Observation room - working copy']
displays=bpy.data.collections['STATION / 05 Display surfaces - static preview']
props=bpy.data.collections['STATION / 06 Interior dressing']
finish=bpy.data.collections['STATION / 04 Reference ceiling and fixtures']
ns={'bpy':bpy,'bmesh':bmesh,'math':math,'Vector':Vector,'finish':finish,'props':props,'displays':displays,'ivory':bpy.data.materials['STATION / Ivory stencil']}
exec(src[src.index('def mesh('):src.index('layout=json.loads')],ns)
mesh,box,beam,curve,text=[ns[k] for k in ['mesh','box','beam','curve','text']]

for i,kind in enumerate(['computer','communications','personal','arcade']):
    old=next(o for o in bpy.data.collections['05 Computers'].objects if 'Monitor '+kind+' screen seal' in o.name)
    pts=[old.matrix_world@v.co for v in old.data.vertices]
    lo=Vector(tuple(min(p[j] for p in pts) for j in range(3)))
    hi=Vector(tuple(max(p[j] for p in pts) for j in range(3)))
    center=(lo+hi)/2
    normal={'computer':Vector((1,-1,0)).normalized(),'communications':Vector((-1,-1,0)).normalized(),'personal':Vector((-1,0,0)),'arcade':Vector((1,0,0))}[kind]
    right=Vector((0,0,1)).cross(normal).normalized()
    up=Vector((0,0,1))
    width=(max(p.dot(right) for p in pts)-min(p.dot(right) for p in pts))*.95
    height=(hi.z-lo.z)*.94
    center+=normal*.022
    ob=bpy.data.objects['STN / Static fitted console display '+str(i)]
    coords=[center-right*width/2-up*height/2,center+right*width/2-up*height/2,center+right*width/2+up*height/2,center-right*width/2+up*height/2]
    for v,p in zip(ob.data.vertices,coords):v.co=p
    ob.data.update()

for mat in [m for m in bpy.data.materials if m.name.startswith('STATION / Technical display')]:
    n=mat.node_tree.nodes
    l=mat.node_tree.links
    texture=next(n for n in n if n.type=='TEX_IMAGE')
    texture.image.update()
    out=next(n for n in n if n.type=='OUTPUT_MATERIAL')
    emission=n.new('ShaderNodeEmission')
    emission.inputs[1].default_value=1.8
    l.new(texture.outputs['Color'],emission.inputs[0])
    l.new(emission.outputs[0],out.inputs['Surface'])

glazing=bpy.data.materials['STATION / Observation glass - clear preview']
enums=[i.identifier for i in glazing.bl_rna.properties['surface_render_method'].enum_items]
if 'BLENDED' in enums:glazing.surface_render_method='BLENDED'
glazing.use_transparent_shadow=True
mix=next(n for n in glazing.node_tree.nodes if n.type=='MIX_SHADER')
mix.inputs[0].default_value=.007

# Material overrides belong to copied objects, never their shared source meshes.
overrides={}
for name,factor,rough in [('BRIDGE Deck finish',.5,.29),('BRIDGE Counter finish',.72,.38)]:
    original=bpy.data.materials.get(name)
    if not original:continue
    mat=original.copy()
    mat.name='STATION / '+name.removeprefix('BRIDGE ')+' reference finish'
    nodes=mat.node_tree.nodes
    links=mat.node_tree.links
    p=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
    for l in list(p.inputs['Roughness'].links):links.remove(l)
    p.inputs['Roughness'].default_value=rough
    p.inputs['Metallic'].default_value=.72
    if p.inputs['Base Color'].is_linked:
        old=p.inputs['Base Color'].links[0].from_socket
        multiply=nodes.new('ShaderNodeMixRGB')
        multiply.blend_type='MULTIPLY'
        multiply.inputs[0].default_value=1
        multiply.inputs[2].default_value=(factor,factor,factor,1)
        links.new(old,multiply.inputs[1])
        links.new(multiply.outputs[0],p.inputs['Base Color'])
    overrides[original]=mat
for ob in room.objects:
    for slot in ob.material_slots:
        if slot.material in overrides:
            new=overrides[slot.material]
            slot.link='OBJECT'
            slot.material=new
    if ob.type=='LIGHT' and 'bow daylight' not in ob.name:
        ob.data.color=(1,.76,.5)
        ob.data.energy*=.9

# Small personal items use native geometry and stay on the desk surface.
leafmat=bpy.data.materials.new('STATION / Living foliage')
leafmat.use_nodes=True
p=next(n for n in leafmat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs['Base Color'].default_value=(.075,.19,.035,1)
p.inputs['Roughness'].default_value=.55
stemmat=bpy.data.materials['STATION / Ceiling graphite']
potmat=bpy.data.materials['STATION / Grey titanium']
random.seed(42)
def cylinder(name,pos,radius,height,mat):
    vs=[]
    N=32
    for r,z in [(radius*.83,0),(radius,height*.85),(radius*.96,height)]:
        vs.extend((pos[0]+math.cos(i*math.tau/N)*r,pos[1]+math.sin(i*math.tau/N)*r,pos[2]+z) for i in range(N))
    fs=[tuple(reversed(range(N))),tuple(range(2*N,3*N))]
    fs.extend((k*N+i,k*N+(i+1)%N,(k+1)*N+(i+1)%N,(k+1)*N+i) for k in range(2) for i in range(N))
    return mesh(name,vs,fs,mat,props,.005)

base=Vector((-3.9,.35,1.055))
cylinder('Desk planter',base,.18,.24,potmat)
cylinder('Planter dark substrate',base+Vector((0,0,.242)),.16,.015,stemmat)
for i in range(9):
    angle=i*math.tau/9
    tip=base+Vector((math.cos(angle)*.24,math.sin(angle)*.24,random.uniform(.55,.85)))
    start=base+Vector((0,0,.25))
    curve('Plant flexible stem',[tuple(start),tuple(start.lerp(tip,.5)+Vector((0,0,.09))),tuple(tip)],.006,stemmat,props)
    for t in [.4,.65,.85]:
        center=start.lerp(tip,t)
        direction=Vector((math.cos(angle+.7),math.sin(angle+.7),.3)).normalized()
        for side in [-1,1]:
            end=center+direction*side*random.uniform(.14,.23)+Vector((0,0,.07))
            cross=direction.cross(Vector((0,0,1))).normalized()*.055
            mid=center.lerp(end,.55)+Vector((0,0,.025))
            mesh('Plant leaf',[tuple(center),tuple(mid+cross),tuple(end),tuple(mid-cross),tuple(mid+Vector((0,0,.02)))],[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],leafmat,props)

# Cups and stacked field books complement the reference's inhabited workspace.
for x,y in [(-3.7,1),(3.8,.4)]:
    cylinder('Desk mug metal body',(x,y,1.055),.055,.12,potmat)
    cylinder('Desk mug dark opening',(x,y,1.179),.045,.005,stemmat)
    curve('Desk mug handle',[(x+.055+.027*math.cos(a),y,1.115+.04*math.sin(a)) for a in [i*math.tau/24 for i in range(24)]],.008,potmat,props,True)
for i in range(3):
    box('Stacked field notebook',(-3.9,1.6,1.075+i*.032),(.24,.32,.025),potmat if i%2 else stemmat,props,.005)

ship=bpy.data.objects['STATION / Cruz del Sur outside observation windows']
ship.location=(0,83,4.6)
root['display_status']='Static authored diagrams and line globe for visual review; not interactive UI.'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/station-reference-interior/station-reference-interior.blend'))
print('STATION DISPLAY AND MATERIAL REFINEMENT SAVED')
