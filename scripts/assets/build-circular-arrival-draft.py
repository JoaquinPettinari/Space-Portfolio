"""Blender-only proposal from the original circular docking master.

blender --background docs/assets/docking-intro/cruz-del-sur-docking-intro.blend
  --python scripts/assets/build-circular-arrival-draft.py [-- --preview]
No web assets are exported. Approval is required before integration.
"""
import bpy
import bmesh
import hashlib
import json
import math
import shutil
import sys
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/docking-intro'
source = Path(bpy.data.filepath).resolve()
if source.name != 'cruz-del-sur-docking-intro.blend':
    raise RuntimeError('Open the original circular docking master, not the hangar.')
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
scene = next(s for s in bpy.data.scenes if 'PAMPA_07_MOTION' in s.objects)
bpy.context.window.scene = scene
scene.name = 'CDS / Circular arrival / APPROVAL DRAFT'
scene.frame_set(1)
carrier, camera = scene.objects['PAMPA_07_MOTION'], scene.camera
carrier.animation_data_clear()
camera.animation_data_clear()
target = scene.objects.get('CAM_DOCKING_TARGET')
if target:
    target.animation_data_clear()
for collection in list(scene.collection.children):
    if collection.name.startswith(('03 /', '03B /')):
        for obj in list(collection.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.collections.remove(collection)
for obj in list(scene.objects):
    if obj.name.startswith(('PAMPA / mating', 'PAMPA / pressure', 'PAMPA / collar')):
        bpy.data.objects.remove(obj, do_unlink=True)
col = bpy.data.collections.new('03 / Circular entry / approval draft')
scene.collection.children.link(col)

def material(name, color, metal=.6, rough=.38, emission=0):
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

steel = material('Circular draft / original titanium', (.18,.23,.28), .8,.3)
dark = material('Circular draft / graphite lining', (.025,.035,.045), .3,.58)
amber = material('Circular draft / guide', (1,.32,.08), .1,.35,2)
green = material('Circular draft / secured', (.08,.65,.35), .1,.35,.1)
FRONT, BACK, CENTER, RADIUS = -25.0, -18.8, 1.95, 1.7
PARKED_Y = -21.96
ROOT_Y, PREVIOUS_FRONT = -18.7, -27.5

def shorten_y(y):
    """Compress only exterior length about the unchanged mounting root."""
    return ROOT_Y+(y-ROOT_Y)*(FRONT-ROOT_Y)/(PREVIOUS_FRONT-ROOT_Y)

def finish(obj, mat, bevel=.025, parent=None):
    for owner in list(obj.users_collection):
        owner.objects.unlink(obj)
    col.objects.link(obj)
    obj.data.materials.append(mat)
    obj.parent = parent
    if bevel:
        modifier = obj.modifiers.new('Machined edge', 'BEVEL')
        modifier.width, modifier.segments = bevel, 2
        obj.modifiers.new('Corner normals', 'WEIGHTED_NORMAL')
    return obj

def mesh_object(name, vertices, faces, mat, bevel=.025, parent=None):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    bm = bmesh.new(); bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh); bm.free()
    obj = bpy.data.objects.new(name, mesh)
    col.objects.link(obj)
    return finish(obj, mat, bevel, parent)

def box(name, location, size, mat=steel):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name, obj.dimensions = name, size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat)

def ring(name, y, radius, thickness, mat):
    bpy.ops.mesh.primitive_torus_add(major_segments=64, minor_segments=10,
        major_radius=radius, minor_radius=thickness,
        location=(0,y,CENTER), rotation=(math.pi/2,0,0))
    obj = bpy.context.object; obj.name = name
    return finish(obj, mat, 0)

def profile(width,bottom,top,chamfer):
    return [(-width+chamfer,bottom),(width-chamfer,bottom),
            (width,bottom+chamfer),(width,top-chamfer),
            (width-chamfer,top),(-width+chamfer,top),
            (-width,top-chamfer),(-width,bottom+chamfer)]

# Keep the original broad root and narrowing shoulders, not a rectangular bay.
# A slightly taller bore provides clearance above the existing engine deck.
stations = [(-18.7,2.5,-1.2,3.95,.42),(-20,2.35,-1.35,3.95,.42),
            (-22,2.05,-.55,3.9,.45),(-24,1.92,.02,3.88,.46),
            (PREVIOUS_FRONT+.2,1.88,.07,3.83,.48)]
stations = [(shorten_y(y),width,bottom,top,chamfer)
            for y,width,bottom,top,chamfer in stations]
verts, faces = [], []
for y,width,bottom,top,chamfer in stations:
    polygon=profile(width,bottom,top,chamfer)
    # 64 outer vertices retain the eight planar shoulders of the old fairing.
    for i in range(64):
        a,b=Vector(polygon[i//8]),Vector(polygon[(i//8+1)%8])
        point=a.lerp(b,(i%8)/8)
        verts.append((point.x,y,point.y))
    # Align both profiles radially so the front annulus never crosses the bore.
    outer_ring=list(verts[-64:])
    for x,_,z in outer_ring:
        angle=math.atan2(z-CENTER,x)
        verts.append((RADIUS*math.cos(angle),y,CENTER+RADIUS*math.sin(angle)))
for j in range(len(stations)-1):
    for offset in (0,64):
        for i in range(64):
            a=j*128+offset+i; b=j*128+offset+(i+1)%64
            faces.append((a,b,b+128,a+128))
for j in (0,len(stations)-1):
    for i in range(64):
        a=j*128+i; b=j*128+(i+1)%64
        faces.append((a,b,b+64,a+64))
mesh_object('Circular draft / tapered original foundation',verts,faces,steel)

# Only the two narrow structural bands of the old tube, without new decoration.
for y,width,bottom,top in [(-24,1.92,.02,3.88),(-26.3,1.895,.05,3.85)]:
    y=shorten_y(y)
    outer=profile(width+.065,bottom-.065,top+.065,.46)
    inner=profile(width-.015,bottom+.015,top-.015,.46)
    vertices=[(x,yy,z) for yy in (y-.075,y+.075) for poly in (outer,inner) for x,z in poly]
    faces=[]
    for i in range(8):
        j=(i+1)%8
        faces.extend([(i,j,j+16,i+16),(i+8,j+8,j+24,i+24),
                      (i,j,j+8,i+8),(i+16,j+16,j+24,i+24)])
    mesh_object('Circular draft / original narrow structural band',vertices,faces,steel,.015)

# Short round sleeve makes the mouth legible, and the lining remains hollow.
verts=[(radius*math.cos(2*math.pi*i/64),y,CENTER+radius*math.sin(2*math.pi*i/64))
       for y in (FRONT,FRONT+.35) for radius in (RADIUS,RADIUS+.13) for i in range(64)]
faces=[]
for offset in (0,64):
    for i in range(64):
        a=offset+i;b=offset+(i+1)%64;faces.append((a,b,b+128,a+128))
for j in (0,128):
    for i in range(64):
        a=j+i;b=j+(i+1)%64;faces.append((a,b,b+64,a+64))
mesh_object('Circular draft / round mouth sleeve',verts,faces,steel,.012)
ring('Circular draft / front machined lip',FRONT-.035,RADIUS+.075,.07,steel)
ring('Circular draft / inner gasket',FRONT+.025,RADIUS+.005,.035,dark)
for y in (-26.7,-24.5,-21.5):
    ring('Circular draft / inner pressure rib',shorten_y(y),RADIUS+.02,.035,dark)
for side in (-1,1):
    for y in (-26.5,-24.5,-22.5):
        box('Circular draft / small approach marker',(side*1.37,shorten_y(y),.96),(.055,.3,.035),amber)
    box('Circular draft / hinge mount',(side*1.82,FRONT+.05,CENTER),(.22,.45,.48))
    box('Circular draft / secured lamp',(side*1.82,FRONT-.2,CENTER-.45),(.09,.07,.11),green)
    # Thin root supports keep the old connection to the hull.
    a,b=Vector((side*1.8,shorten_y(-20),-.6)),Vector((side*1.45,shorten_y(-26.5),.45))
    obj=box('Circular draft / lower structural spine',(a+b)/2,(.18,.22,(b-a).length))
    obj.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()

# Two semicircular leaves fold outward in front of the mouth. This avoids the
# broad exterior pockets that made the rejected rectangular hangar too large.
doors=[]
for side in (-1,1):
    hinge=bpy.data.objects.new('CIRCULAR_DOOR_'+str(side),None);col.objects.link(hinge)
    hinge.location=(side*RADIUS,FRONT-.18,CENTER)
    points=[(0,-RADIUS)]
    angles=[-math.pi/2+i*math.pi/40 for i in range(41)]
    points=[(side*RADIUS*math.cos(angle),RADIUS*math.sin(angle)) for angle in angles]
    n=len(points)
    vertices=[(x-side*RADIUS,y,z) for y in (-.07,.07) for x,z in points]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    leaf=mesh_object('Circular draft / semicircular pressure door',vertices,faces,steel,.015,hinge)
    doors.append((hinge,side,leaf))

# A plain dark back wall prevents the entrance reading as an open tunnel to space.
box('Circular draft / rear partition',(0,BACK,CENTER),(3.4,.12,3.4),dark)

def smooth(t):
    t=max(0,min(1,t));return t*t*(3-2*t)

for marker in list(scene.timeline_markers):scene.timeline_markers.remove(marker)
for name,frame in [('APPROACH / DRAFT',1),('ENTER ROUND PORT',100),('FULLY INSIDE',166),('ROUND DOORS CLOSE',181),('SEALED',226)]:
    scene.timeline_markers.new(name,frame=frame)
scene.frame_start,scene.frame_end,scene.render.fps=1,240,30
for frame in range(1,241):
    t=(frame-1)/30;u=min(t/5.5,1)
    carrier.location=(0,-43.5+(PARKED_Y+43.5)*(2*u-u*u),.535)
    carrier.rotation_euler=(0,0,math.pi)
    carrier.keyframe_insert('location',frame=frame)
    carrier.keyframe_insert('rotation_euler',frame=frame)
    camera.location=Vector((42,-69,24)).lerp(Vector((10,-36.5,7.5)),smooth(t/5.5))
    aim=Vector((0,-13,-1)).lerp(Vector((0,FRONT+.7,1.95)),smooth(t/5.5))
    camera.rotation_euler=(aim-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.keyframe_insert('location',frame=frame)
    camera.keyframe_insert('rotation_euler',frame=frame)
    for hinge,side,leaf in doors:
        hinge.rotation_euler.z=side*math.pi/2*(1-smooth((t-6)/1.5))
        hinge.keyframe_insert('rotation_euler',frame=frame)

pampa=[o for o in scene.objects if o.type=='MESH' and o.name.startswith('PAMPA_07 / source hull')]
minimum_radial=100;minimum_door=100;minimum_camera=1
swept_lo=[math.inf]*3;swept_hi=[-math.inf]*3
for frame in range(1,241):
    scene.frame_set(frame)
    points=[o.matrix_world@Vector(v) for o in pampa for v in o.bound_box]
    for p in points:
        for axis in range(3):
            swept_lo[axis]=min(swept_lo[axis],p[axis])
            swept_hi[axis]=max(swept_hi[axis],p[axis])
        projected=world_to_camera_view(scene,camera,p)
        minimum_camera=min(minimum_camera,projected.x,1-projected.x,projected.y,1-projected.y)
        if p.y>FRONT:
            clearance=RADIUS-math.hypot(p.x,p.z-CENTER)
            assert clearance>0,('Radial clearance',frame,clearance)
            minimum_radial=min(minimum_radial,clearance)
            assert p.y<BACK-.1,('Rear partition clearance',frame,p.y)
    if frame>=181:
        ship_rear=min(p.y for p in points)
        door_front=max((leaf.matrix_world@Vector(v)).y for _,_,leaf in doors for v in leaf.bound_box)
        minimum_door=min(minimum_door,ship_rear-door_front)
        assert ship_rear-door_front>.08,('Door sweep clearance',frame,ship_rear-door_front)
assert minimum_camera>.02,minimum_camera

# The shortened exterior intentionally borrows internal hull space, as approved
# for this fictional draft. Report intersections honestly rather than asserting
# a physically empty parking compartment or changing the original hull.
source_hull=next(c for c in scene.collection.children if c.name.startswith('01 /'))
limits=tuple((swept_lo[axis]-.01,swept_hi[axis]+.01) for axis in range(3))
obstructions=[]
def clip_polygon(points, axis, boundary, sign):
    result=[]
    for a,b in zip(points,points[1:]+points[:1]):
        da=sign*(a[axis]-boundary);db=sign*(b[axis]-boundary)
        if da>=0: result.append(a)
        if (da>=0)!=(db>=0): result.append(a.lerp(b,da/(da-db)))
    return result
for obj in source_hull.all_objects:
    if obj.type!='MESH':continue
    vertices=[obj.matrix_world@v.co for v in obj.data.vertices]
    for face in obj.data.polygons:
        polygon=[vertices[i] for i in face.vertices]
        for axis,(lo,hi) in enumerate(limits):
            polygon=clip_polygon(polygon,axis,lo,1) if polygon else []
            polygon=clip_polygon(polygon,axis,hi,-1) if polygon else []
        if polygon: obstructions.append(obj.name)
engine_objects=[o for o in source_hull.all_objects
                if o.type=='MESH' and 'lower-hull' in o.name]
engine_aft=min((o.matrix_world@v.co).y for o in engine_objects for v in o.data.vertices)
scene.frame_set(240)
closed_port_aft=min((o.matrix_world@Vector(v)).y
                    for o in col.objects if o.type=='MESH' for v in o.bound_box)
assert closed_port_aft>=engine_aft,('Closed port protrudes past engines',closed_port_aft,engine_aft)
scene.frame_set(240)
scene['status']='BLENDER APPROVAL DRAFT ONLY / no app or video export'
scene['design']='Same-width circular port shortened behind aft engine plane; internal parking is fictional.'
bpy.ops.file.pack_all()
destination=OUT/'circular-arrival-draft.blend'
backup=OUT/'circular-arrival-before-shortening.blend'
if destination.exists() and not backup.exists():
    shutil.copy2(destination,backup)
bpy.ops.wm.save_as_mainfile(filepath=str(destination))
after_hash=hashlib.sha256(source.read_bytes()).hexdigest()
assert source_hash==after_hash
(OUT/'circular-arrival-validation.json').write_text(json.dumps({
    'status':'approval draft only','innerDiameter':RADIUS*2,'mouthRetraction':FRONT-PREVIOUS_FRONT,
    'centerHeight':CENTER,'tubeDepth':BACK-FRONT,'framesChecked':240,
    'minimumConservativeRadialClearance':minimum_radial,'minimumDoorSweepClearance':minimum_door,
    'minimumCameraMargin':minimum_camera,'sourceShaBefore':source_hash,'sourceShaAfter':after_hash,
    'originalHullSweptBoxIntersections':len(obstructions),
    'internalParkingIsFictional':True,'intersectedSourceObjects':sorted(set(obstructions)),
    'measuredSweptBounds':limits,
    'engineAftPlane':engine_aft,'closedPortAftPlane':closed_port_aft,
    'closedPortInsetFromEngines':closed_port_aft-engine_aft,
    'publicAssetsChanged':False,'doorType':'two outward-folding semicircular leaves',
},indent=2),encoding='utf8')
print('CIRCULAR_DRAFT_READY',destination,flush=True)
if '--preview' in sys.argv:
    scene.render.resolution_x,scene.render.resolution_y,scene.render.resolution_percentage=960,540,100
    scene.eevee.taa_render_samples=8
    scene.render.image_settings.file_format='PNG'
    for frame in (1,90,240):
        scene.frame_set(frame)
        scene.render.filepath=str(OUT/f'circular-draft-review-{frame:03d}.png')
        bpy.ops.render.render(write_still=True)
