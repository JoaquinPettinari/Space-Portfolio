"""Matched observation view plus an unsaved oblique view of the ledge depth."""
import bpy
from pathlib import Path
from mathutils import Vector
s=bpy.context.scene;p=Path(bpy.data.filepath).parent;s.render.resolution_x=1000;s.render.resolution_y=640;s.cycles.samples=16
s.camera=bpy.data.objects['CAM / Observation window and EVA'];s.render.filepath=str(p/'turnaround-window.png');bpy.ops.render.render(write_still=True)
d=bpy.data.cameras.new('Observation oblique temporary');c=bpy.data.objects.new('Observation oblique temporary',d);s.collection.objects.link(c);c.location=(.15,-12.80,1.52);target=Vector((-4.25,-15.25,1.28));c.rotation_euler=(target-c.location).to_track_quat('-Z','Y').to_euler();d.lens=26
s.camera=c;s.render.filepath=str(p/'window-dressing-oblique.png');bpy.ops.render.render(write_still=True)
