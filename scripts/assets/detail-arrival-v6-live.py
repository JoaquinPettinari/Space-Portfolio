"""Small lived-in hardware pass; preserves V5 and all gameplay clearances."""
from pathlib import Path
from math import pi, sin
import bpy, bmesh
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
NAME='Arrival Room - Equipment Details V6'
assert NAME not in bpy.data.scenes
source=bpy.data.scenes['Arrival Room - Rear Closure V5']
scene=bpy.data.scenes.new(NAME);bpy.context.window.scene=scene
scene.unit_settings.system='METRIC';scene.world=source.world
for old_col in source.collection.children:
    col=bpy.data.collections.new(old_col.name.replace('V5','V6'));scene.collection.children.link(col)
    for old in old_col.objects:
        obj=old.copy();obj.data=old.data.copy();obj.name=old.name.replace('ARR5','ARR6');col.objects.link(obj)
details=bpy.data.collections.new('ARRIVAL V6 / Equipment details');scene.collection.children.link(details)
mats={k:bpy.data.materials['ARRIVAL V4 '+k] for k in ['Graphite frame','Warm grey panels','Ivory cabinets','Gaskets','Cyan technical','Amber lamps']}
for key,color in [('Medical red',(.42,.035,.025)),('Flag blue',(.18,.48,.68))]:
    m=bpy.data.materials.new('ARRIVAL V6 '+key);m.use_nodes=True;m.use_backface_culling=True
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.48
    m.diffuse_color=(*color,1);mats[key]=m
def xyz(p):return Vector((p[0],-p[2],p[1]))
def uv(mesh):
    mesh.update();layer=mesh.uv_layers.new(name='UVMap')
    for face in mesh.polygons:
        axis=max(range(3),key=lambda i:abs(face.normal[i]))
        axes=[i for i in range(3) if i!=axis]
        for li in face.loop_indices:
            v=mesh.vertices[mesh.loops[li].vertex_index].co
            layer.data[li].uv=(v[axes[0]],v[axes[1]])
def box(name,at,size,mat,bevel=.008):
    mesh=bpy.data.meshes.new(name)
    vs=[xyz((at[0]+x*size[0]/2,at[1]+y*size[1]/2,at[2]+z*size[2]/2)) for x,y,z in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]]
    mesh.from_pydata(vs,[],[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)])
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free();uv(mesh)
    obj=bpy.data.objects.new('ARR6 '+name,mesh);details.objects.link(obj);mesh.materials.append(mats[mat])
    if bevel:
        mod=obj.modifiers.new('Manufactured edge','BEVEL');mod.width=min(bevel,min(size)/4);mod.segments=2
    return obj
def label(text,at,size=.035):
    curve=bpy.data.curves.new('Service lettering','FONT');curve.body=text;curve.align_x='CENTER';curve.size=size;curve.extrude=.0005;curve.resolution_u=2
    obj=bpy.data.objects.new('Lettering',curve);details.objects.link(obj);obj.location=xyz(at);obj.rotation_euler=(pi/2,0,0)
    curve.materials.append(mats['Ivory cabinets'])
    deps=bpy.context.evaluated_depsgraph_get();mesh=bpy.data.meshes.new_from_object(obj.evaluated_get(deps),depsgraph=deps);mesh.transform(obj.matrix_world);uv(mesh)
    bpy.data.objects.remove(obj,do_unlink=True)
    out=bpy.data.objects.new('ARR6 '+text,mesh);details.objects.link(out)

# Equipment case rests within the existing bench collider, never in the aisle.
x=-2.27-.65*sin(pi*3.5/4.13)**2
box('equipment case',(x,.76,3.5),(.60,.32,.46),'Graphite frame',.025)
box('case lid seam',(x,.84,3.5),(.61,.016,.47),'Gaskets',.003)
for side in [-1,1]:
    box('case reinforced corner',(x+side*.27,.76,3.5),(.055,.34,.48),'Warm grey panels')
    box('case latch',(x+side*.18,.78,3.738),(.06,.09,.025),'Ivory cabinets',.004)
box('case carry handle',(x,.935,3.5),(.24,.03,.045),'Gaskets')

# First-aid cabinet and Argentina plaque, above the existing memory board.
box('medical cabinet',(-2.57,2.33,.14),(.32,.36,.16),'Medical red',.025)
box('medical cross horizontal',(-2.57,2.33,.225),(.18,.055,.012),'Ivory cabinets',.003)
box('medical cross vertical',(-2.57,2.33,.226),(.055,.18,.012),'Ivory cabinets',.003)
box('flag backing',(-2.05,2.33,.10),(.47,.29,.035),'Graphite frame')
for i in [-1,0,1]:box('Argentina stripe',(-2.05,2.33+i*.075,.122),(.42,.075,.01),'Ivory cabinets' if i==0 else 'Flag blue',.001)
box('flag sun',(-2.05,2.33,.13),(.028,.028,.006),'Amber lamps',.006)

# Shallow handles and vents follow cabinet faces, staying within furniture zones.
for z in [1.9,3.2]:
    for j in range(6):box('cabinet ventilation',(2.411,1.93+j*.035,z),(.012,.012,.50),'Gaskets',.001)
    for end in [-1,1]:box('cabinet hinge',(2.408,1.35+end*.55,z-.42),(.022,.11,.05),'Warm grey panels')
    box('cabinet service strip',(2.409,.62,z),(.018,.035,.44),'Ivory cabinets',.002)
for xh in [-2.5,-1.95]:
    box('service pull mount',(xh,.68,.802),(.10,.10,.025),'Graphite frame')
    box('service pull grip',(xh,.68,.825),(.065,.018,.025),'Ivory cabinets')
box('supply plaque',(-2.23,.27,.802),(.55,.12,.018),'Graphite frame')
label('CABIN SUPPLIES',(-2.23,.25,.815),.045)
label('MEDICAL',(-2.57,2.08,.13),.035)

exporter=ROOT/'scripts/assets/export-arrival-runtime-live.py'
code=exporter.read_text(encoding='utf-8')
exec(compile(code,str(exporter),'exec'),{'__file__':str(exporter)})
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        area.spaces.active.shading.type='MATERIAL'
        r=area.spaces.active.region_3d;r.view_location=xyz((-.5,1.6,1.0));r.view_distance=3.0
        r.view_rotation=Vector((0,-1,0)).to_track_quat('Z','Y')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/arrival-room/arrival-room-v6.blend'))
print('V6 details saved; door, terminal, floor, glazing and circulation unchanged.')
