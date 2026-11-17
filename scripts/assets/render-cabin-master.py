"""Render both interior review views without changing the saved master."""
from pathlib import Path
import bpy
scene=bpy.context.scene
assert scene.name=='CRUZ DEL SUR / Cabin master'
folder=Path(bpy.data.filepath).parent
scene.render.resolution_x=1000;scene.render.resolution_y=640;scene.cycles.samples=16
for camera,file in [('CAM / Lounge and EVA','master-lounge.png'),
                    ('CAM / Service wall and access','master-service.png'),
                    ('CAM / Fixed docking and EVA','master-fixed-door.png'),
                    ('CAM / Sliding access and terminal','master-sliding-door.png')]:
 scene.camera=bpy.data.objects[camera]
 scene.render.filepath=str(folder/file)
 bpy.ops.render.render(write_still=True)
 print('RENDER_READY',file,flush=True)
