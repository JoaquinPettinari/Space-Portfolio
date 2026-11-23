"""Isolated Blender review: cropped PAMPA nose behind the existing docking glass."""
import bpy
import bmesh
import hashlib
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/docking-intro'
BASE = ROOT / 'docs/assets/cabin-master/cabin-master.blend'
SHIP = OUT / 'circular-arrival-draft.blend'
hashes = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in (BASE, SHIP)}
scene = bpy.context.scene
scene.name = 'CDS / Interior PAMPA nose / REVIEW ONLY'
existing = set(bpy.data.objects)
with bpy.data.libraries.load(str(SHIP), link=False) as (available, loaded):
    loaded.scenes = available.scenes
foreign = next(s for s in loaded.scenes if 'PAMPA_07_MOTION' in s.objects)
bpy.context.window.scene = foreign
foreign.frame_set(240)
bpy.context.view_layer.update()
source = [o for o in foreign.objects if o.type == 'MESH' and o.name.startswith('PAMPA_07 / source hull')]
points = [o.matrix_world @ v.co for o in source for v in o.data.vertices]
tip = max(p.y for p in points)
cut = tip - 1.28
collection = bpy.data.collections.new('REVIEW / Cropped PAMPA nose only')
scene.collection.children.link(collection)
full_tris = sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in source)
created = []
for original in source:
    mesh = original.data.copy()
    mesh.transform(original.matrix_world)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.bisect_plane(bm, geom=list(bm.verts)+list(bm.edges)+list(bm.faces), dist=0.00001,
                          plane_co=(0,cut,0), plane_no=(0,1,0), clear_inner=True)
    if not bm.faces:
        bm.free(); bpy.data.meshes.remove(mesh); continue
    # Keep original scale and UVs. Place the nose in front of the existing outer hatch.
    for v in bm.verts:
        v.co.y += -19.35-tip
        v.co.z -= .55
    bm.to_mesh(mesh); bm.free(); mesh.update()
    obj = bpy.data.objects.new('PAMPA nose / '+original.name.rsplit(' ',1)[-1], mesh)
    collection.objects.link(obj)
    created.append(obj)
bpy.context.window.scene = scene
for s in loaded.scenes:
    bpy.data.scenes.remove(s)
for obj in list(bpy.data.objects):
    if obj not in existing and obj not in created:
        bpy.data.objects.remove(obj, do_unlink=True)

def camera(name, location, target):
    data=bpy.data.cameras.new(name); obj=bpy.data.objects.new(name,data)
    scene.collection.objects.link(obj); obj.location=location
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    data.lens=28; data.clip_start=.01
    return obj

cameras=[camera('CAM / PAMPA inspection glass',(.03,-17.62,1.58),(0,-20,1.48)),
         camera('CAM / PAMPA inspection oblique',(.19,-17.56,1.58),(-.04,-20,1.48))]
scene.camera=cameras[0]
scene.render.resolution_x=960; scene.render.resolution_y=540; scene.render.resolution_percentage=100
scene.cycles.samples=24; scene.cycles.use_denoising=True
prefs=bpy.context.preferences.addons['cycles'].preferences
try:
    prefs.compute_device_type='OPTIX'; prefs.get_devices()
    for device in prefs.devices: device.use=device.type!='CPU'
    scene.cycles.device='GPU'
except Exception:
    scene.cycles.device='CPU'
scene['review_status']='Pending user approval. No app assets exported.'
scene['nose_note']='Original UV/materials; physical mesh crop, full ship absent.'
bpy.context.view_layer.update()
bounds=[o.matrix_world@v.co for o in created for v in o.data.vertices]
report={'source_sha256':hashes,'full_triangles':full_tris,
        'cropped_triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in created),
        'cropped_objects':len(created),
        'bounds':{'min':[min(p[i] for p in bounds) for i in range(3)],'max':[max(p[i] for p in bounds) for i in range(3)]},
        'glass_y':-18.265,'nose_tip_y':-19.35,'nose_glass_gap_m':1.085,
        'review_only':True,'cameras':[c.name for c in cameras]}
assert all(hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==h for p,h in hashes.items())
(OUT/'pampa-interior-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_perspective='CAMERA'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'pampa-interior-review.blend'))
for cam,name in zip(cameras,['pampa-interior-front.png','pampa-interior-oblique.png']):
    scene.camera=cam; scene.render.filepath=str(OUT/name)
    bpy.ops.render.render(write_still=True)
scene.camera=cameras[0]
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'pampa-interior-review.blend'))
print('INTERIOR_REVIEW',json.dumps(report))
