"""Persist real-time playback without regenerating geometry or animation."""
import bpy
from pathlib import Path
from mathutils import Vector

for scene in bpy.data.scenes:
    scene.sync_mode = 'FRAME_DROP'
scene=bpy.data.scenes['02 Credential present']
bpy.context.window.scene=scene
scene.frame_set(51)
bpy.context.view_layer.update()
card=scene.objects['FIXTURE / Crew credential']
normal=card.matrix_world.to_3x3()@Vector((0,1,0))
normal.normalize()
target=card.matrix_world.translation+Vector((0,0,-.06))
scene.camera.location=target-normal*.52+Vector((.10,0,.08))
scene.camera.rotation_euler=(target-scene.camera.location).to_track_quat('-Z','Y').to_euler()
scene.camera.data.type='PERSP'
scene.camera.data.lens=38
print('CARD_CAMERA',list(card.matrix_world.translation),list(normal),list(scene.camera.location),flush=True)
bpy.context.window.scene=bpy.data.scenes['01 Tablet raise']
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('GESTURE_REALTIME_PLAYBACK_SET')
folder=Path(bpy.data.filepath).parent/'gesture-review'
bpy.context.window.scene=scene
scene.render.engine='BLENDER_WORKBENCH'
scene.display.shading.light='STUDIO'
scene.display.shading.color_type='MATERIAL'
scene.display.shading.show_shadows=True
scene.display.shading.show_cavity=True
scene.render.resolution_x=640;scene.render.resolution_y=480
scene.render.image_settings.file_format='PNG'
for frame,name in [(23,'card-approach-visible'),(51,'card-contact-visible'),(118,'card-withdraw-visible')]:
    scene.frame_set(frame)
    scene.render.filepath=str(folder/(name+'.png'))
    bpy.ops.render.render(write_still=True)
