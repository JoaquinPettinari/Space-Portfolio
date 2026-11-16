"""Render the final GLB only; never exports or modifies the asset."""
from pathlib import Path
import bpy
from mathutils import Vector

root=Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root/'public/models/cruz-del-sur-eva-suit.glb'))
points=[o.matrix_world@v.co for o in bpy.context.scene.objects if o.type=='MESH' for v in o.data.vertices]
lo=Vector(tuple(min(v[i] for v in points) for i in range(3)))
hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
center=(lo+hi)/2;radius=(hi.z-lo.z)/2
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE';scene.eevee.taa_render_samples=8
scene.render.resolution_x=500;scene.render.resolution_y=650;scene.render.resolution_percentage=100
scene.world.color=(.13,.13,.13);scene.view_settings.view_transform='AgX'
for loc,power,light_size in [((-2,-4,5),650,4),((3,-1,2),450,3),((0,3,4),700,3)]:
    bpy.ops.object.light_add(type='AREA',location=Vector(loc)*radius+center)
    light=bpy.context.object;light.data.energy=power*radius*radius;light.data.shape='DISK';light.data.size=light_size*radius
    light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=center+Vector((0,-4,1))*radius)
camera=bpy.context.object;camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=2.6*radius
scene.camera=camera;scene.render.filepath=str(root/'docs/assets/nasa-emu/prepared-preview.png')
bpy.ops.render.render(write_still=True)
