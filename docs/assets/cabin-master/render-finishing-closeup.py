"""Unsaved inspection camera for the pressure manifold and instrument connections."""
import bpy
from pathlib import Path
from mathutils import Vector
s=bpy.context.scene
d=bpy.data.cameras.new('Inspection temporary');c=bpy.data.objects.new('Inspection temporary',d);s.collection.objects.link(c)
c.location=(2.35,-15.88,1.50);target=Vector((3.77,-15.88,1.45))
c.rotation_euler=(target-c.location).to_track_quat('-Z','Y').to_euler();d.lens=48
s.camera=c;s.render.resolution_x=1000;s.render.resolution_y=640;s.cycles.samples=16
s.render.filepath=str(Path(bpy.data.filepath).parent/'finishing-service-closeup.png')
bpy.ops.render.render(write_still=True)
