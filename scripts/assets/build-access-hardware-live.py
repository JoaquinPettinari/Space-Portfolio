"""Run in live Blender. Separate editable study; does not alter the arrival room.
Design axes match Three.js (Y up, +Z front), converted to Blender on creation.
"""
from pathlib import Path
import math
import bpy
import bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/access-hardware'
NAME = 'Docking Door and Crew Access V1'
assert NAME not in bpy.data.scenes, 'Inspect existing study before rebuilding.'
scene = bpy.data.scenes.new(NAME)
bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
groups = {}
for name in ['Docking door', 'Crew Access']:
    col = bpy.data.collections.new('CDS hardware / '+name)
    scene.collection.children.link(col)
    groups[name] = col
current = groups['Docking door']

def xyz(p): return Vector((p[0], -p[2], p[1]))
def material(name, color, metal=.4, rough=.45, emission=0):
    m = bpy.data.materials.new('CDS hardware '+name)
    m.use_nodes = True
    m.use_backface_culling = True
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    p.inputs['Emission Color'].default_value = (*color, 1)
    p.inputs['Emission Strength'].default_value = emission
    m.diffuse_color = (*color, 1)
    return m

graphite = material('Graphite', (.055,.067,.073), .65)
panel = material('Warm grey alloy', (.25,.27,.26), .6)
ivory = material('Off white enamel', (.58,.59,.53), .25)
black = material('Rubber seals', (.009,.015,.02), .05,.8)
amber = material('Amber diffuser', (1,.65,.29), .1,.3,2)
gold = material('Safety ochre', (.67,.40,.10), .3)
silver = material('Steel fasteners', (.38,.42,.44), .8,.32)
cyan = material('Technical cyan', (.05,.6,.72), .1,.35,.6)

def finish(o, mat, bevel=.012):
    o.data.materials.append(mat)
    if o.type == 'MESH':
        bm=bmesh.new(); bm.from_mesh(o.data)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
        bm.to_mesh(o.data); bm.free()
        if bevel:
            mod=o.modifiers.new('Manufactured bevel','BEVEL')
            mod.width=bevel; mod.segments=3
    return o

def prism(name, polygon, back, front, mat, bevel=.012):
    n=len(polygon)
    vertices=[xyz((x,y,z)) for z in [back,front] for x,y in polygon]
    faces=[tuple(range(n-1,-1,-1)), tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(vertices,[],faces); mesh.update()
    o=bpy.data.objects.new(name,mesh); current.objects.link(o)
    return finish(o,mat,bevel)

def box(name, at, size, mat, bevel=.008):
    x,y,z=at; w,h,d=size
    return prism(name,[(x-w/2,y-h/2),(x+w/2,y-h/2),(x+w/2,y+h/2),(x-w/2,y+h/2)],z-d/2,z+d/2,mat,bevel)

def octagon(cx,cy,w,h,c):
    return [(cx-w/2+c,cy-h/2),(cx+w/2-c,cy-h/2),(cx+w/2,cy-h/2+c),
            (cx+w/2,cy+h/2-c),(cx+w/2-c,cy+h/2),(cx-w/2+c,cy+h/2),
            (cx-w/2,cy+h/2-c),(cx-w/2,cy-h/2+c)]

def ring(name, outer, inner, back, front, mat):
    for i in range(len(outer)):
        j=(i+1)%len(outer)
        prism(name+' '+str(i),[outer[i],outer[j],inner[j],inner[i]],back,front,mat,.008)

def label(name, text, x,y,z,size,mat):
    curve=bpy.data.curves.new(name,'FONT'); curve.body=text
    curve.align_x='CENTER'; curve.align_y='CENTER'; curve.size=size
    curve.extrude=.0004; curve.resolution_u=3
    o=bpy.data.objects.new(name,curve);current.objects.link(o)
    o.location=xyz((x,y,z)); o.rotation_euler=(math.pi/2,0,0)
    curve.materials.append(mat)
    return o

def bolt(x,y,z,r=.014):
    poly=[(x+math.cos(i*math.tau/6)*r,y+math.sin(i*math.tau/6)*r) for i in range(6)]
    prism('Recessed hex bolt',poly,z-.008,z,silver,.001)
    box('Fastener slot',(x,y,z+.001),(r,.003,.002),black,0)

# Front faces +Z. Runtime rotates this rear hatch by pi to face the arrival room.
outer=octagon(0,1.4,2.85,2.8,.32)
inner=octagon(0,1.3,2.4,2.6,.29)
ring('Outer stepped surround',outer,inner,-.12,.07,panel)
ring('Inner graphite frame',inner,octagon(0,1.3,2.22,2.48,.28),-.08,.12,graphite)
ring('Dark pressure gasket',octagon(0,1.25,2.21,2.47,.27),octagon(0,1.25,2.13,2.39,.27),-.04,.13,black)
# Door plate is physically cut out around the inspection window.
plate=octagon(0,1.25,2.12,2.40,.27)
window=octagon(0,1.22,.86,.38,.06)
ring('Armoured door plate',plate,window,-.075,.065,panel)
ring('Inset panel seam',octagon(0,1.25,1.97,2.22,.28),octagon(0,1.25,1.93,2.18,.28),.065,.071,black)
ring('Inspection window bevel',octagon(0,1.22,.98,.5,.07),window,.066,.105,graphite)
glass=material('Inspection glass',(.08,.19,.23),.1,.18)
shader=next(n for n in glass.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
shader.inputs['Alpha'].default_value=.28
glass.diffuse_color=(.08,.19,.23,.28)
glass.use_backface_culling=False
prism('Inspection glass',window,.01,.016,glass,0)
# Rear face needs a finished surface too; no invisible backing or fake tunnel.
label('Docking title','DOCKING ACCESS',0,1.92,.078,.135,ivory)
label('Docking subtitle','ARRIVAL / DEPARTURE',0,1.74,.078,.065,ivory)
label('Docking vessel','PAMPA-07',0,1.62,.078,.055,gold)
label('Hull number','CDS / A-3',0,.57,.078,.055,ivory)
for side in [-1,1]:
    box('Vertical lamp housing',(side*1.25,1.22,.115),(.09,.8,.09),graphite)
    box('Vertical amber lamp',(side*1.25,1.22,.165),(.035,.69,.018),amber)
    for y in [.35,.8,1.65,2.2]: bolt(side*1.03,y,.08)
    for y in [.25,2.42]: bolt(side*1.27,y,.08,.018)
box('Overhead lamp housing',(0,2.57,.1),(1.25,.12,.12),graphite)
box('Overhead diffuser',(0,2.57,.166),(1.08,.038,.015),amber)
box('Lower reinforcement',(0,.20,.09),(1.54,.14,.055),graphite)
for i in range(7):
    x=-.63+i*.18
    prism('Threshold caution stripe',[(x,.15),(x+.09,.15),(x+.18,.25),(x+.09,.25)],.12,.123,gold,.001)
for side in [-1,1]:
    for i in range(5):
        box('Frame service vent',(side*1.30,.44+i*.035,.082),(.10,.012,.008),black,.001)

current=groups['Crew Access']
# Dimensions match the live screen plane and existing ID-card animation.
box('Wall mount',(0,0,-.21),(.5,.5,.18),graphite)
prism('Crew terminal enclosure',octagon(0,0,1.3,1.1,.085),-.12,.115,panel)
ring('Crew bezel',octagon(0,.03,1.23,.94,.055),octagon(0,.03,1.10,.80,0),.115,.14,graphite)
box('Display backing',(0,.03,.123),(1.1,.8,.014),black,0)
for side in [-1,1]:
    box('Side amber strip',(side*.617,0,.144),(.012,.6,.012),amber,.003)
    for y in [-.45,.45]: bolt(side*.58,y,.15,.016)
    for y in [-.32,-.27,-.22]:
        box('Terminal side vent',(side*.637,y,0),(.008,.018,.13),black,.001)
box('Card reader frame',(0,-.48,.09),(.42,.18,.12),graphite)
box('Reader slot',(0,-.48,.148),(.32,.06,.008),black,.002)
for side in [-1,1]:
    box('Reader contact',(side*.18,-.48,.155),(.015,.09,.008),gold,.002)
label('Crew header','CREW ACCESS',0,.49,.145,.04,ivory)

# Export each asset from evaluated copies, batching static parts by material.
# Named parents and source meshes remain editable in this separate study.
OUT.mkdir(parents=True,exist_ok=True)
for group,filename,prefix in [('Docking door','cruz-del-sur-docking-door.glb','DOCK'),('Crew Access','cruz-del-sur-crew-access.glb','CREW')]:
    source=list(groups[group].objects)
    deps=bpy.context.evaluated_depsgraph_get()
    copies=[]; buckets={}
    for o in source:
        mesh=bpy.data.meshes.new_from_object(o.evaluated_get(deps),depsgraph=deps)
        mesh.transform(o.matrix_world)
        temp=bpy.data.objects.new('export temporary',mesh);scene.collection.objects.link(temp)
        copies.append(temp);buckets.setdefault(mesh.materials[0].name,[]).append(temp)
    for o in scene.objects:o.select_set(False)
    batches=[]
    for key,objects in buckets.items():
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:bpy.ops.object.join()
        batch=objects[0];batch.name=prefix+'_'+key.replace(' ','_');batches.append(batch)
        batch.select_set(False)
    for o in batches:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models'/filename),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_cameras=False,export_lights=False)
    for o in batches:o.data.calc_loop_triangles()
    print(filename, 'batches',len(batches),'triangles',sum(len(o.data.loop_triangles) for o in batches),'bytes',(ROOT/'public/models'/filename).stat().st_size)
    for o in batches:
        mesh=o.data;bpy.data.objects.remove(o,do_unlink=True)
        if mesh.users==0:bpy.data.meshes.remove(mesh)

# Visible side-by-side editable study (after exporting local coordinates).
for o in groups['Crew Access'].objects:o.location += xyz((2.4,1.45,0))
scene.world=bpy.data.worlds.new('Hardware studio world');scene.world.use_nodes=True
bg=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs['Color'].default_value=(.35,.35,.35,1)
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        area.spaces.active.shading.type='MATERIAL'
        region=area.spaces.active.region_3d
        region.view_location=xyz((.7,1.4,0))
        region.view_rotation=Vector((0,-1,.05)).to_track_quat('Z','Y')
        region.view_distance=5.8
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'docking-and-crew-v1.blend'))
print('Editable study saved; original arrival scenes retained.')
