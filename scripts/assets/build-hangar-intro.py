"""Create an isolated hangar variant from the docking master loaded by Blender CLI.

blender --background docs/assets/docking-intro/cruz-del-sur-docking-intro.blend
  --python scripts/assets/build-hangar-intro.py [-- --preview]
Never modifies the source master or the interactive Blender session.
"""
import bpy
import bmesh
import json
import hashlib
import math
import sys
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/docking-intro'
SOURCE = Path(bpy.data.filepath).resolve()
if SOURCE.name != 'cruz-del-sur-docking-intro.blend':
    raise RuntimeError('Load the original docking master before generating this variant.')
source_sha256 = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
scene = next(s for s in bpy.data.scenes if 'PAMPA_07_MOTION' in s.objects)
bpy.context.window.scene = scene
scene.name = 'CDS / PAMPA-07 hangar arrival'
scene.frame_set(1)
carrier = scene.objects['PAMPA_07_MOTION']
camera = scene.camera
carrier.animation_data_clear()
camera.animation_data_clear()
target = scene.objects.get('CAM_DOCKING_TARGET')
if target:
    target.animation_data_clear()
for col in list(scene.collection.children):
    if col.name.startswith(('03 /', '03B /')):
        for obj in list(col.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.collections.remove(col)
for obj in list(scene.objects):
    if obj.name.startswith(('PAMPA / mating', 'PAMPA / pressure', 'PAMPA / collar')):
        bpy.data.objects.remove(obj, do_unlink=True)

col = bpy.data.collections.new('03 / Integrated shuttle hangar')
scene.collection.children.link(col)

def material(name, color, metal=0, rough=.4, emission=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Metallic'].default_value = metal
    shader.inputs['Roughness'].default_value = rough
    shader.inputs['Emission Color'].default_value = (*color, 1)
    shader.inputs['Emission Strength'].default_value = emission
    return mat

armor = material('Hangar / blue titanium', (.105, .155, .195), .72, .34)
edge = material('Hangar / machined edges', (.26, .33, .37), .8, .3)
dark = material('Hangar / graphite recess', (.012, .021, .028), .3, .6)
deck = material('Hangar / landing deck', (.065, .085, .1), .6, .42)
ochre = material('Hangar / safety ochre', (.85, .42, .065), .35, .42)
white = material('Hangar / ivory stencil', (.7, .79, .77), .15, .5)
warm = material('Hangar / warm practicals', (1, .56, .23), .1, .3, 4)
cyan = material('Hangar / approach cyan', (.04, .7, .9), .1, .3, 3)
green = material('Hangar / bay secured', (.12, .8, .42), .1, .3, .15)

def finish(obj, mat, bevel=.035, parent=None):
    obj.data.materials.append(mat)
    for owner in list(obj.users_collection):
        owner.objects.unlink(obj)
    col.objects.link(obj)
    if parent:
        obj.parent = parent
    if bevel:
        mod = obj.modifiers.new('Machined edge radius', 'BEVEL')
        mod.width, mod.segments = bevel, 3
        obj.modifiers.new('Weighted face normals', 'WEIGHTED_NORMAL')
    return obj

def box(name, center, size, mat=armor, bevel=.035, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat, bevel, parent)

def prism(name, polygon, front, back, mat=armor, parent=None, bevel=.025):
    n = len(polygon)
    vertices = [(x,y,z) for y in (front,back) for x,z in polygon]
    faces = [tuple(range(n-1,-1,-1)), tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    bm = bmesh.new(); bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh); bm.free()
    obj = bpy.data.objects.new(name, mesh)
    col.objects.link(obj)
    return finish(obj, mat, bevel, parent)

def profile(width, bottom, top, chamfer):
    return [(-width+chamfer,bottom),(width-chamfer,bottom),
            (width,bottom+chamfer),(width,top-chamfer),
            (width-chamfer,top),(-width+chamfer,top),
            (-width,top-chamfer),(-width,bottom+chamfer)]

def frame(name, outer, inner, front, back, mat=edge):
    # Individual solid segments leave a genuinely open central portal.
    for i in range(8):
        j = (i+1)%8
        prism(name+' / %02d'%i, [outer[i],outer[j],inner[j],inner[i]], front, back, mat)

def beam(name, a, b, width, depth, mat=armor):
    a,b = Vector(a),Vector(b)
    obj = box(name, (a+b)/2, (width,depth,(b-a).length), mat)
    obj.rotation_euler = (b-a).to_track_quat('Z','Y').to_euler()
    return obj

def text(name, label, location, size, mat=white, parent=None):
    data = bpy.data.curves.new(name, 'FONT')
    data.body, data.size, data.align_x = label, size, 'CENTER'
    data.extrude = .001
    obj = bpy.data.objects.new(name,data)
    col.objects.link(obj)
    obj.location = location
    obj.rotation_euler.x = math.pi/2
    data.materials.append(mat)
    obj.parent = parent
    return obj

# The new bay occupies clear space above the stern. Its back ends before the
# arrival room; load-bearing rails overlap the upper hull instead of floating.
FRONT, BACK, FLOOR, CEILING, HALF = -31.0, -20.6, 1.2, 5.5, 2.7
inner = profile(HALF,FLOOR,CEILING,.45)
outer = profile(3.5,.65,6.15,.75)
frame('Hangar / longitudinal shell',outer,inner,FRONT+.3,BACK,armor)
prism('Hangar / rear pressure bulkhead',outer,BACK,BACK+.22,armor)
box('Hangar / continuous landing floor',(0,-25.8,1.08),(5.4,10.4,.24),deck)
for side in (-1,1):
    beam('Hangar / root load spine',(side*2.45,-20.15,-.35),(side*2.45,-30.8,.82),.42,.65)
    beam('Hangar / stern armor gusset',(side*3.4,-22.2,-.7),(side*3.4,-27,1.45),.5,.65)
    # Side pockets are part of the entry bulkhead and receive the actual doors.
    pocket=[(side*x,z) for x,z in [(2.65,.8),(5.75,.8),(6.0,1.2),(6.0,5.65),(5.5,6.15),(2.65,6.15)]]
    prism('Hangar / shutter pocket',pocket,FRONT+.2,FRONT+1.5,armor)
    for z in (1.55,5.2):
        box('Hangar / pocket track',(side*4.3,FRONT+.07,z),(2.9,.16,.16),dark)
    box('Hangar / entry vertical lamp',(side*3.15,FRONT-.22,3.35),(.08,.08,2.5),warm,.02)
    for y in (-29.8,-27.8,-25.8,-23.8,-21.6):
        box('Hangar / floor landing guide',(side*1.9,y,1.215),(.065,.85,.025),cyan,.008)
        box('Hangar / interior wall panel',(side*2.67,y,3.1),(.035,1.6,2.3),dark,.02)
        box('Hangar / interior rib',(side*2.63,y+.88,3.3),(.12,.13,3.25),edge)
    for z in (2.1,4.55):
        box('Hangar / corner guard',(side*5.3,FRONT-.04,z),(.65,.15,1),edge)

frame('Hangar / entrance armor',profile(3.35,.85,5.9,.65),inner,FRONT-.25,FRONT+.18,edge)
frame('Hangar / dark portal seal',profile(2.81,1.09,5.61,.46),inner,FRONT-.31,FRONT-.255,dark)
box('Hangar / lintel light',(0,FRONT-.29,5.75),(3.3,.08,.075),warm,.015)
text('Hangar / entry designation','SHUTTLE BAY / 01',(0,FRONT-.33,6.0),.18)
for y in (-29.8,-27.8,-25.8,-23.8,-21.8):
    box('Hangar / deck expansion joint',(0,y,1.215),(3.4,.035,.026),edge,.006)
    box('Hangar / ceiling panel',(0,y,5.48),(3.9,1.65,.035),deck)
    for x in (-1.65,1.65):
        box('Hangar / ceiling practical',(x,y,5.42),(.12,1.05,.05),warm,.012)
for y in (-28.9,-26.15,-23.4):
    box('Hangar / roof service panel',(0,y,6.165),(5.1,2.4,.06),deck,.045)
    for side in (-1,1):
        box('Hangar / side armor panel',(side*3.515,y,3.3),(.07,2.4,2.8),deck,.04)
        for z in (2.1,2.32,2.54):
            box('Hangar / side cooling slot',(side*3.56,y,z),(.03,1.7,.045),dark,.008)
for y in (-29,-25,-22):
    data=bpy.data.lights.new('Hangar / internal flood','AREA')
    data.energy,data.color,data.shape,data.size=210,(.66,.82,1),'RECTANGLE',3
    data.size_y=1.5
    obj=bpy.data.objects.new(data.name,data);col.objects.link(obj)
    obj.location=(0,y,5.25)
box('Hangar / crew hatch inset',(0,BACK-.02,2.55),(1.5,.06,2.65),dark)
box('Hangar / crew hatch',(0,BACK-.07,2.5),(1.2,.08,2.3),edge)
text('Hangar / crew route','CREW ACCESS',(0,BACK-.13,3.95),.16)

doors=[]
for side in (-1,1):
    root=bpy.data.objects.new('HANGAR_DOOR_'+('LEFT' if side<0 else 'RIGHT'),None)
    col.objects.link(root);doors.append((root,side))
    shape=[(side*x,z) for x,z in [(0,1.18),(2.28,1.18),(2.75,1.68),(2.75,5.03),(2.28,5.53),(0,5.53)]]
    prism('Hangar / pressure shutter',shape,FRONT-.12,FRONT+.1,armor,root)
    for z in (2.15,4.5):
        panel=[(side*x,zz) for x,zz in [(.2,z-.55),(2.25,z-.55),(2.48,z-.32),(2.48,z+.32),(2.25,z+.55),(.2,z+.55)]]
        prism('Hangar / shutter recessed armor',panel,FRONT-.18,FRONT-.125,deck,root)
    box('Hangar / shutter seam',(side*.055,FRONT-.2,3.35),(.06,.08,3.9),edge,.01,root)
    box('Hangar / shutter amber trim',(side*1.35,FRONT-.205,3.35),(2.15,.045,.07),ochre,.01,root)
    text('Hangar / shutter stencil','01' if side<0 else 'BAY',(side*1.35,FRONT-.23,3.65),.33,white,root)
    for z in (1.45,5.27):
        for x in (.35,.85,1.35,1.85):
            marker=box('Hangar / shutter hazard',(side*x,FRONT-.205,z),(.23,.04,.12),ochre,.006,root)
            marker.rotation_euler.y=side*-.4
    box('Hangar / secured indicator',(side*3.1,FRONT-.25,1.05),(.4,.1,.08),green,.01)

def smooth(t):
    t=max(0,min(1,t));return t*t*(3-2*t)

for marker in list(scene.timeline_markers):
    scene.timeline_markers.remove(marker)
for name,frame in [('01 APPROACH',1),('02 ENTER HANGAR',92),('03 PARKED / CLEAR DOORS',166),('04 SHUTTERS CLOSING',181),('05 BAY SEALED',226)]:
    scene.timeline_markers.new(name,frame=frame)
scene.frame_start,scene.frame_end=1,240
scene.render.fps=30
for f in range(1,241):
    t=(f-1)/30
    u=min(t/5.5,1)
    # Ease-out approach, no teleport or visibility animation. Nose points +Y.
    carrier.location=(.8*(1-smooth(t/2.5)),-46+20.2*(2*u-u*u),1.2)
    carrier.rotation_euler=(0,0,math.pi)
    carrier.keyframe_insert('location',frame=f)
    carrier.keyframe_insert('rotation_euler',frame=f)
    cam=smooth(t/5.5)
    camera.location=Vector((45,-75,27)).lerp(Vector((11,-43,10)),cam)
    aim=Vector((0,-14,-1)).lerp(Vector((0,-28,3.1)),cam)
    camera.rotation_euler=(aim-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.keyframe_insert('location',frame=f)
    camera.keyframe_insert('rotation_euler',frame=f)
    closing=smooth((t-6)/1.5)
    for door,side in doors:
        door.location.x=side*2.82*(1-closing)
        door.keyframe_insert('location',frame=f)
shader=next(n for n in green.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
for f,value in ((1,.15),(225,.15),(228,4),(240,4)):
    shader.inputs['Emission Strength'].default_value=value
    shader.inputs['Emission Strength'].keyframe_insert('default_value',frame=f)

# Prove the full ship is inside before shutter motion, without hiding geometry.
pampa=[o for o in scene.objects if o.type=='MESH' and o.name.startswith('PAMPA_07 / source hull')]
def bounds(objects):
    pts=[o.matrix_world@Vector(v) for o in objects for v in o.bound_box]
    return [min(p[i] for p in pts) for i in range(3)],[max(p[i] for p in pts) for i in range(3)]
min_clearance=100
minimum_camera_margin=1
for f in range(1,241):
    scene.frame_set(f)
    lo,hi=bounds(pampa)
    for obj in pampa:
        for vertex in obj.bound_box:
            projected=world_to_camera_view(scene,camera,obj.matrix_world@Vector(vertex))
            margin=min(projected.x,1-projected.x,projected.y,1-projected.y)
            assert margin>=.02,('PAMPA outside safe framing',f,margin)
            minimum_camera_margin=min(minimum_camera_margin,margin)
    if hi[1]>FRONT:
        assert hi[1]<BACK-.1,('Ship beyond rear bulkhead',f,hi)
        assert lo[0]>-HALF and hi[0]<HALF
        assert lo[2]>FLOOR and hi[2]<CEILING
    if f>=181:
        assert lo[1]>FRONT+.1,('Shutter crossing ship',f,lo)
        min_clearance=min(min_clearance,lo[1]-(FRONT+.1))
scene.frame_set(240)
final_bounds=bounds(pampa)
assert all(abs(door.location.x)<.001 for door,_ in doors)
scene['arrival_design']='Physical shuttle hangar; fully parked ship remains behind closed doors.'
scene['runtime_note']='Native video keeps the existing loading/fade/reveal contract; 8 seconds, 30 fps.'
scene.frame_set(1)
bpy.ops.file.pack_all()
destination=OUT/'cruz-del-sur-hangar-intro.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(destination))
source_sha256_after = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
assert source_sha256_after == source_sha256, 'Source master changed unexpectedly'
(OUT/'hangar-validation.json').write_text(json.dumps({
    'master':destination.name,'fps':30,'frames':240,'duration':8,
    'openingWidth':HALF*2,'openingHeight':CEILING-FLOOR,'bayDepth':BACK-FRONT,
    'parkedAtSeconds':5.5,'doorClosureSeconds':[6,7.5],
    'minimumShipDoorClearance':min_clearance,'parkedShipBounds':final_bounds,
    'doorChecks':60,'trajectoryChecks':240,'minimumCameraMargin':minimum_camera_margin,
    'sourceMasterUnchanged':source_sha256_after == source_sha256,
    'sourceMasterSha256Before':source_sha256,'sourceMasterSha256After':source_sha256_after,
    'pampaHiddenByGeometryOnly':True,
},indent=2),encoding='utf8')
print('HANGAR_READY',str(destination))
if '--preview' in sys.argv:
    scene.render.resolution_x,scene.render.resolution_y=960,540
    scene.render.resolution_percentage=100
    scene.eevee.taa_render_samples=8
    scene.render.image_settings.file_format='PNG'
    for f in (1,120,240):
        scene.frame_set(f)
        scene.render.filepath=str(OUT/('hangar-review-%03d.png'%f))
        bpy.ops.render.render(write_still=True)
