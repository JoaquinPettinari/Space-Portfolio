"""V3 access surround and window finishing, executed in live Blender.

Preserves V2 and all earlier source scenes. No gameplay integration.
"""
from pathlib import Path
from math import pi, sin
from mathutils import Vector, Matrix
import bpy
import contextlib
import io

OUT=Path(__file__).resolve().parents[2]/'docs/assets/arrival-room'
NAME='Arrival Room - Finishes V3'
assert NAME not in bpy.data.scenes, 'V3 exists; inspect before rerunning.'
source=bpy.data.scenes['Arrival Room - Expanded V2']
scene=bpy.data.scenes.new(NAME)
bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'
scene.unit_settings.scale_length=1
materials={}
cols={}
for c in source.collection.children:
    key=c.name.split(' / ')[-1]
    col=bpy.data.collections.new('ARRIVAL V3 / '+key)
    scene.collection.children.link(col);cols[key]=col
    for src in c.objects:
        obj=src.copy();obj.data=src.data.copy()
        obj.name='ARR3 '+src.name.removeprefix('ARR2 ')
        col.objects.link(obj)
        for slot in obj.material_slots:
            old=slot.material
            if old.name not in materials:
                new=old.copy();new.name=old.name.replace('ARRIVAL ','ARRIVAL V3 ')
                materials[old.name]=new
            slot.material=materials[old.name]
for key in ['Access surround','Window seals','Wall trims','Signage']:
    c=bpy.data.collections.new('ARRIVAL V3 / '+key);scene.collection.children.link(c);cols[key]=c

# First restrained PBR palette; no procedural shaders that would disappear in glTF.
for key,color,metal,rough in [
    ('Graphite frame',(.035,.045,.055),.65,.42),
    ('Warm grey panels',(.19,.21,.21),.35,.58),
    ('Ivory cabinets',(.38,.37,.32),.18,.65),
]:
    m=materials['ARRIVAL '+key]
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    m.diffuse_color=(*color,1)

def xyz(p):return Vector((p[0],-p[2],p[1]))
def box(name,at,size,material,group,bevel=.008):
    sx,sy,sz=size[0]/2,size[2]/2,size[1]/2
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata([(a*sx,b*sy,c*sz) for a,b,c in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]],[],[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)])
    mesh.update();obj=bpy.data.objects.new('ARR3 '+name,mesh);cols[group].objects.link(obj)
    obj.location=xyz(at);mesh.materials.append(materials['ARRIVAL '+material])
    if bevel:
        mod=obj.modifiers.new('Edge finish','BEVEL');mod.width=min(bevel,min(size)/4);mod.segments=2
    return obj
def beam(name,a,b,width,depth,material,group):
    d=xyz(b)-xyz(a);axis=d.normalized()
    obj=box(name,tuple((a[i]+b[i])/2 for i in range(3)),(width,d.length,depth),material,group)
    normal=Vector((0,1,0))
    if abs(axis.dot(normal))>.98:normal=Vector((1,0,0))
    normal=(normal-axis*normal.dot(axis)).normalized()
    obj.rotation_mode='QUATERNION'
    obj.rotation_quaternion=Matrix((normal.cross(axis),normal,axis)).transposed().to_quaternion()
    return obj

# Faceted layered portal stays entirely outside a 2.68 x 2.50 rectangular aperture.
path=[(-1.48,.08),(-1.48,2.56),(-1.05,3.0),(1.05,3.0),(1.48,2.56),(1.48,.08)]
for i,(a,b) in enumerate(zip(path,path[1:])):
    beam('portal backing seal',(*a,.13),(*b,.13),.25,.12,'Gaskets','Access surround')
    beam('portal armor',(*a,.205),(*b,.205),.19,.13,'Warm grey panels','Access surround')
    beam('portal outer bead',(a[0]*1.075,a[1],.27),(b[0]*1.075,b[1],.27),.035,.025,'Graphite frame','Access surround')
for side in [-1,1]:
    for y in [.40,1.05,2.30]:
        box('portal removable insert',(side*1.48,y,.279),(.115,.30,.025),'Graphite frame','Access surround')
        for dy in [-.11,.11]:box('portal fastener',(side*1.48,y+dy,.296),(.025,.025,.012),'Ivory cabinets','Access surround',.003)
    box('portal light recess',(side*1.48,1.70,.285),(.095,.65,.025),'Gaskets','Access surround')
    box('portal amber lens',(side*1.48,1.70,.305),(.042,.55,.022),'Amber lamps','Access surround',.004)
    box('portal base shoe',(side*1.49,.15,.17),(.27,.30,.26),'Graphite frame','Access surround')

# Gaskets follow the same sampled bow as V2 glass; offset just inside its surface.
def window_point(x,y,z):
    x-=.65*sin(pi*max(0,min(4.13,z))/4.13)**2*max(0,min(1,(-x-.5)/2.26))
    return (x+.018,y,z)
for center in [.6885,2.0655,3.442]:
    z0,z1=center-.62,center+.62
    for x,y in [(-2.75,.85),(-2.50,2.40)]:
        points=[window_point(x,y,z0+(z1-z0)*i/4) for i in range(5)]
        for a,b in zip(points,points[1:]):beam('glazing horizontal gasket',a,b,.032,.03,'Gaskets','Window seals')
    for z in [z0,z1]:
        pts=[window_point(-2.75+.25*i/4,.85+1.55*i/4,z) for i in range(5)]
        for a,b in zip(pts,pts[1:]):beam('glazing vertical gasket',a,b,.03,.035,'Gaskets','Window seals')

# Shallow access panels on starboard wall; repeated assembly seams and plinth.
for z in [.60,1.27,2.57,3.91]:
    box('wall seam',(2.707,1.30,z),(.022,2.12,.035),'Gaskets','Wall trims',.002)
for z in [.58,2.57]:
    box('technical recessed surround',(2.689,1.45,z),(.04,.66,.42),'Gaskets','Wall trims')
    box('technical removable panel',(2.66,1.45,z),(.025,.56,.32),'Warm grey panels','Wall trims')
    for dz in [-.125,.125]:box('technical panel latch',(2.642,1.45,z+dz),(.012,.10,.025),'Ivory cabinets','Wall trims',.002)
box('starboard lower skirting',(2.68,.15,2.065),(.10,.28,4.10),'Graphite frame','Wall trims')

# Sign fits above the opening; lettering is geometry and stays English.
box('bridge sign backing',(0,2.79,.275),(1.63,.18,.035),'Graphite frame','Signage')
curve=bpy.data.curves.new('BRIDGE ACCESS lettering','FONT');curve.body='BRIDGE ACCESS'
curve.align_x='CENTER';curve.size=.115;curve.extrude=.001
label=bpy.data.objects.new('ARR3 BRIDGE ACCESS',curve);cols['Signage'].objects.link(label)
label.location=xyz((0,2.75,.298));label.rotation_euler=(pi/2,0,0)
curve.materials.append(materials['ARRIVAL Ivory cabinets'])
# Convert only this owned label, preserving all other source objects.
for obj in scene.objects:obj.select_set(False)
label.select_set(True);bpy.context.view_layer.objects.active=label
bpy.ops.object.convert(target='MESH');label.select_set(False)
scene['stage']='V3 layered portal, gaskets, technical panels and initial PBR palette; review only'
scene['game_translation']='[0,0,12.07]; runtime unchanged'
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'arrival-room-v3.blend'))
for obj in scene.objects:obj.select_set(obj.type=='MESH')
with contextlib.redirect_stdout(io.StringIO()):
    bpy.ops.export_scene.gltf(filepath=str(OUT/'arrival-room-v3.glb'),export_format='GLB',use_selection=True,
        use_active_scene=True,export_apply=True,export_yup=True,export_cameras=False,export_lights=False)
for obj in scene.objects:obj.select_set(False)
print('V3 source/export saved:',len(scene.objects),'objects. Earlier scenes preserved.')
