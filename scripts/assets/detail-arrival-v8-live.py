"""Fitted lounge furniture and wall-mounted medical/flag details; preserves V7."""
from pathlib import Path
from math import pi, sin, cos, atan
import bpy, bmesh
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[2]
NAME = 'Arrival Room - Fitted Lounge V8'
assert NAME not in bpy.data.scenes
source = bpy.data.scenes['Arrival Room - Bench and Portal V7']
scene = bpy.data.scenes.new(NAME)
bpy.context.window.scene = scene
scene.world = source.world
scene.unit_settings.system = 'METRIC'
for old_col in source.collection.children:
    col = bpy.data.collections.new(old_col.name.replace('V7', 'V8'))
    scene.collection.children.link(col)
    for old in old_col.objects:
        obj = old.copy(); obj.data = old.data.copy()
        obj.name = old.name.replace('ARR7', 'ARR8'); col.objects.link(obj)
details = bpy.data.collections.new('ARRIVAL V8 / Fitted lounge')
scene.collection.children.link(details)
mats = {k:bpy.data.materials['ARRIVAL V4 '+k] for k in
        ['Graphite frame','Warm grey panels','Ivory cabinets','Gaskets','Amber lamps']}
mats['Fabric'] = next(o for o in source.objects if o.name == 'ARR7 bench seat').data.materials[0]

def xyz(p): return Vector((p[0], -p[2], p[1]))
def bulge(z): return .65*sin(pi*max(0,min(4.13,z))/4.13)**2
def uv(mesh):
    mesh.update()
    layer = mesh.uv_layers.new(name='UVMap')
    for face in mesh.polygons:
        axis = max(range(3),key=lambda i:abs(face.normal[i]))
        axes = [i for i in range(3) if i != axis]
        for li in face.loop_indices:
            v = mesh.vertices[mesh.loops[li].vertex_index].co
            layer.data[li].uv = (v[axes[0]],v[axes[1]])

def box(name, at, size, material, curved=False, lean=False, bevel=.005):
    # Build longitudinal rings so every furniture section follows the hull.
    count = max(1, round(size[2]/.07)) if curved else 1
    vertices=[]; faces=[]
    for i in range(count+1):
        z=at[2]-size[2]/2+size[2]*i/count
        for dx,dy in [(-1,-1),(1,-1),(1,1),(-1,1)]:
            y=at[1]+dy*size[1]/2
            x=at[0]+dx*size[0]/2-(bulge(z) if curved else 0)+(.03 if curved else 0)
            if lean:x += .14*max(0,min(1,(y-.57)/.52))
            vertices.append(xyz((x,y,z)))
    faces.append((3,2,1,0))
    for i in range(count):
        for j in range(4):
            a=4*i+j; b=4*i+(j+1)%4
            faces.append((a,b,b+4,a+4))
    faces.append(tuple(4*count+j for j in range(4)))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free();uv(mesh)
    obj=bpy.data.objects.new('ARR8 '+name,mesh);details.objects.link(obj)
    mesh.materials.append(mats[material])
    if bevel:
        mod=obj.modifiers.new('Manufactured edge','BEVEL')
        mod.width=min(bevel,min(size)/3);mod.segments=3
    return obj

# Replace only copied furniture. Existing V7 scene and original meshes stay intact.
for obj in list(scene.objects):
    if any(obj.name.startswith('ARR8 '+s) for s in
           ['bench ', 'locker pull', 'flag backing', 'Argentina stripe', 'flag sun']):
        bpy.data.objects.remove(obj,do_unlink=True)
box('bench continuous base',(-2.27,.24,2.65),(.78,.48,2.54),'Ivory cabinets',True)
box('bench recessed toe kick',(-1.873,.075,2.65),(.018,.12,2.48),'Gaskets',True)
box('bench warm light strip',(-1.86,.085,2.65),(.012,.022,2.40),'Amber lamps',True)
for z in [1.8,2.65,3.5]:
    box('bench fitted cushion',(-2.24,.53,z),(.78,.12,.80),'Fabric',True,bevel=.025)
    box('bench fitted back',(-2.59,.83,z),(.13,.52,.80),'Fabric',True,True,.025)
    box('bench cushion piping',(-1.848,.548,z),(.007,.009,.73),'Gaskets',True,bevel=.002)
    box('bench locker inset',(-1.872,.29,z),(.018,.27,.73),'Graphite frame',True)
    box('bench locker face',(-1.856,.29,z),(.014,.24,.69),'Ivory cabinets',True)
    box('bench recessed pull',(-1.844,.34,z),(.013,.028,.19),'Gaskets',True)
    for i in range(3):
        box('bench locker vent',(-1.844,.20+i*.018,z),(.012,.006,.18),'Gaskets',True,bevel=.001)

# Turn the existing equipment case along the seat tangent, keeping it rigid.
center=xyz((-2.27-bulge(3.5),.76,3.5))
slope=.65*pi/4.13*sin(2*pi*3.5/4.13)
rotation=Matrix.Rotation(-atan(slope),4,'Z')
for obj in scene.objects:
    if obj.name.startswith(('ARR8 equipment case','ARR8 case ')):
        obj.matrix_world=Matrix.Translation(center+xyz((.03,-.026,0)))@rotation@Matrix.Scale(.9,4)@Matrix.Translation(-center)@obj.matrix_world

# Keep the complete medical cabinet clear of the window rib, on a solid bracket.
for obj in scene.objects:
    if obj.name.startswith(('ARR8 medical','ARR8 MEDICAL')):
        obj.location += xyz((.31,-.07,.04))
        if obj.name.startswith('ARR8 MEDICAL'):
            obj.location += xyz((0,.12,.096))
box('medical wall bracket',(-2.26,2.26,.05),(.29,.32,.10),'Graphite frame')
box('medical latch',(-2.13,2.26,.272),(.025,.065,.022),'Graphite frame')

# Dedicated untextured enamel: the white stripe never samples cabinet grime.
def enamel(key, rgb):
    mat=bpy.data.materials.new('ARRIVAL V8 '+key);mat.use_nodes=True
    shader=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    def linear(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
    color=tuple(linear(c/255) for c in rgb)
    shader.inputs['Base Color'].default_value=(*color,1)
    shader.inputs['Roughness'].default_value=.55
    mat.diffuse_color=(*color,1);mat.use_backface_culling=True;mats[key]=mat
enamel('Flag white',(255,255,255));enamel('Flag sky blue',(116,172,223))
enamel('Sun gold',(246,180,14));enamel('Sun features',(133,52,10))
box('flag wall bracket',(-1.86,2.33,.045),(.38,.25,.09),'Graphite frame')
box('flag enamel frame',(-1.86,2.33,.105),(.40,.265,.03),'Graphite frame')
for i in [-1,0,1]:
    box('flag white stripe' if i==0 else 'flag sky stripe',(-1.86,2.33+i*.075,.124),(.36,.075,.008),'Flag white' if i==0 else 'Flag sky blue',bevel=0)

def emblem(name, points, depth, material):
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata([xyz((-1.86+x,2.33+y,depth)) for x,y in points],[],[tuple(range(len(points)))])
    bm=bmesh.new();bm.from_mesh(mesh)
    bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free();uv(mesh)
    obj=bpy.data.objects.new('ARR8 '+name,mesh);details.objects.link(obj);mesh.materials.append(mats[material])
    # XY points are CCW viewed from the room: normal is +glTF Z.
    return obj

for i in range(32):
    a=2*pi*i/32
    if i%2==0:
        points=[(.011,-.0013),(.030,0),(.011,.0013)]
    else:
        # Alternating flame-like wavy rays, outlined by a simple strip.
        path=[(.011+t*.017,.002*sin(t*pi*2)) for t in [j/8 for j in range(9)]]
        points=[(x,y-.0008*(1-j/9)) for j,(x,y) in enumerate(path)]
        points+= [(x,y+.0008*(1-j/9)) for j,(x,y) in reversed(list(enumerate(path)))]
    emblem('sun ray',[(x*cos(a)-y*sin(a),x*sin(a)+y*cos(a)) for x,y in points],.129,'Sun gold')
emblem('sun disk',[(.013*cos(2*pi*i/48),.013*sin(2*pi*i/48)) for i in range(48)],.130,'Sun gold')
for x in [-.0044,.0044]:
    emblem('sun eye',[(x+.0012*cos(2*pi*i/12),.002+.00065*sin(2*pi*i/12)) for i in range(12)],.131,'Sun features')
emblem('sun nose',[(-.0006,-.002),(.001,-.002),(0,.003)],.131,'Sun features')
emblem('sun mouth',[(-.0035,-.005),(-.0015,-.006),(.0015,-.006),(.0035,-.005),(.0015,-.0052),(-.0015,-.0052)],.131,'Sun features')

# Validate evaluated bevel geometry before exporting, not only object origins.
from mathutils.bvhtree import BVHTree
deps=bpy.context.evaluated_depsgraph_get();vertices=[];faces=[]
for obj in scene.objects:
    if 'window' in obj.name or 'panoramic glass' in obj.name:
        mesh=bpy.data.meshes.new_from_object(obj.evaluated_get(deps),depsgraph=deps)
        offset=len(vertices)
        vertices.extend(obj.matrix_world@v.co for v in mesh.vertices)
        faces.extend(tuple(offset+i for i in p.vertices) for p in mesh.polygons)
        bpy.data.meshes.remove(mesh)
shell=BVHTree.FromPolygons(vertices,faces);clearance=99
for obj in scene.objects:
    if obj.name.startswith(('ARR8 bench fitted','ARR8 bench continuous')):
        mesh=bpy.data.meshes.new_from_object(obj.evaluated_get(deps),depsgraph=deps)
        for vertex in mesh.vertices:
            point=obj.matrix_world@vertex.co
            hit=shell.ray_cast(Vector((0,point.y,point.z)),Vector((-1,0,0)),5)[0]
            if hit is not None:clearance=min(clearance,point.x-hit.x)
        bpy.data.meshes.remove(mesh)
assert clearance>.01, f'Bench intersects glazing: {clearance}'
print('Minimum lateral bench clearance:',round(clearance*1000,1),'mm')

exporter=ROOT/'scripts/assets/export-arrival-runtime-live.py'
exec(compile(exporter.read_text(),str(exporter),'exec'),{'__file__':str(exporter)})
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/arrival-room/arrival-room-v8.blend'))
print('V8 saved: fitted curved bench, mounted medical cabinet, enamel Argentine flag.')
