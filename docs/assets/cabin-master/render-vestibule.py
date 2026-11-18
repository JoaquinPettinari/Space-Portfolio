"""Matched cabin views and a real camera view through the docking inspection glass."""
import bpy,sys
from pathlib import Path
from mathutils import Vector
s=bpy.context.scene;p=Path(bpy.data.filepath).parent;s.render.resolution_x=1000;s.render.resolution_y=640;s.cycles.samples=16
for camera,file in [('CAM / Observation window and EVA','turnaround-window.png'),('CAM / Fixed docking and EVA','turnaround-fixed-door.png')]:
 if '--no-window' in sys.argv and file=='turnaround-window.png':continue
 s.camera=bpy.data.objects[camera];s.render.filepath=str(p/file);bpy.ops.render.render(write_still=True)
d=bpy.data.cameras.new('Through docking inspection glass');c=bpy.data.objects.new('Through docking inspection glass',d);s.collection.objects.link(c);c.location=(.03,-17.62,1.58);target=Vector((0,-20.6,1.48));c.rotation_euler=(target-c.location).to_track_quat('-Z','Y').to_euler();d.lens=28;d.clip_start=.01
s.camera=c;s.render.filepath=str(p/'vestibule-through-glass.png');bpy.ops.render.render(write_still=True)
