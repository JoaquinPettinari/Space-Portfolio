"""Idempotent final rail cleanup on the prepared GLB; no re-decimation."""
from pathlib import Path
import bpy, bmesh, json
from mathutils import Vector

root=Path(__file__).resolve().parents[2]
evidence=root/'docs/assets/nasa-emu'
target=root/'public/models/cruz-del-sur-eva-suit.glb'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(target))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
removed=0
for o in meshes:
    bm=bmesh.new();bm.from_mesh(o.data)
    faces=[f for f in bm.faces if all((o.matrix_world@v.co).z>.64 and abs((o.matrix_world@v.co).x)>.26 for v in f.verts)]
    removed+=sum(len(f.verts)-2 for f in faces)
    if faces:bmesh.ops.delete(bm,geom=faces,context='FACES')
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
    bm.to_mesh(o.data);bm.free()
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',use_selection=True,export_yup=True,export_animations=False,export_lights=False,export_cameras=False)
points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
lo=Vector(tuple(min(v[i] for v in points) for i in range(3)))
hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
size=hi-lo
report=json.loads((evidence/'audit.json').read_text())
report.update({'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes),'bytes':target.stat().st_size,'gltfDimensions':[size.x,size.z,size.y],'gltfBoundsMin':[lo.x,lo.z,-hi.y],'gltfBoundsMax':[hi.x,hi.z,-lo.y],'finalRailTrianglesRemoved':removed})
(evidence/'audit.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print('FINAL_RAIL_CLEANUP',json.dumps(report),flush=True)

scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE';scene.eevee.taa_render_samples=8
scene.render.resolution_x=500;scene.render.resolution_y=650;scene.render.resolution_percentage=100
scene.world.color=(.13,.13,.13);scene.view_settings.view_transform='AgX'
center=(lo+hi)/2;radius=size.z/2
for loc,power,light_size in [((-2,-4,5),650,4),((3,-1,2),450,3),((0,3,4),700,3)]:
    bpy.ops.object.light_add(type='AREA',location=Vector(loc)*radius+center)
    light=bpy.context.object;light.data.energy=power*radius*radius;light.data.shape='DISK';light.data.size=light_size*radius
    light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=center+Vector((0,-4,1))*radius)
camera=bpy.context.object;camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=2.6*radius
scene.camera=camera;scene.render.filepath=str(evidence/'prepared-preview.png')
bpy.ops.render.render(write_still=True)
