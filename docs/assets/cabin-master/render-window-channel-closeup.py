"""Unsaved view of lower frame, recessed channel and warm spill."""
import bpy
from pathlib import Path
from mathutils import Vector
s=bpy.context.scene;d=bpy.data.cameras.new('Observation channel temporary');c=bpy.data.objects.new('Observation channel temporary',d);s.collection.objects.link(c);c.location=(-2.7,-12.40,1.05);target=Vector((-4.18,-13.45,.73));c.rotation_euler=(target-c.location).to_track_quat('-Z','Y').to_euler();d.lens=42
s.camera=c;s.render.resolution_x=1000;s.render.resolution_y=640;s.cycles.samples=16;s.render.filepath=str(Path(bpy.data.filepath).parent/'window-channel-closeup.png');bpy.ops.render.render(write_still=True)
