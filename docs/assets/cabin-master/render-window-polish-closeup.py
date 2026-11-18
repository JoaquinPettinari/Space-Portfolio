"""Inspect foliage curvature and the orbital instrument without saving a camera."""
import bpy
from pathlib import Path
from mathutils import Vector
s=bpy.context.scene;d=bpy.data.cameras.new('Window objects closeup temporary');c=bpy.data.objects.new('Window objects closeup temporary',d);s.collection.objects.link(c);c.location=(-2.35,-16.70,1.37);target=Vector((-4.16,-17.20,1.11));c.rotation_euler=(target-c.location).to_track_quat('-Z','Y').to_euler();d.lens=48
s.camera=c;s.render.resolution_x=1000;s.render.resolution_y=640;s.cycles.samples=16;s.render.filepath=str(Path(bpy.data.filepath).parent/'window-polish-closeup.png');bpy.ops.render.render(write_still=True)
