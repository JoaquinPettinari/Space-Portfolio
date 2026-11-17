"""Four quick interior review renders, without saving render overrides."""
import bpy,sys
from pathlib import Path
s=bpy.context.scene;p=Path(bpy.data.filepath).parent
s.render.resolution_x=1000;s.render.resolution_y=640;s.cycles.samples=16
requested=set(sys.argv[sys.argv.index('--')+1:]) if '--' in sys.argv else set()
for name,file in [('CAM / Observation window and EVA','turnaround-window.png'),('CAM / Service wall and access','turnaround-service.png'),('CAM / Fixed docking and EVA','turnaround-fixed-door.png'),('CAM / Sliding access and terminal','turnaround-sliding-door.png')]:
 if requested and file.removeprefix('turnaround-').removesuffix('.png') not in requested:continue
 s.camera=bpy.data.objects[name];s.render.filepath=str(p/file);bpy.ops.render.render(write_still=True);print('RENDER_READY',file,flush=True)
