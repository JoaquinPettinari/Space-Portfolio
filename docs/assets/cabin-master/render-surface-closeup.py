"""Unsaved close inspection of real deck counterbores and corner lands."""
import bpy
from pathlib import Path
from mathutils import Vector
s=bpy.context.scene;d=bpy.data.cameras.new('Deck inspection temporary');c=bpy.data.objects.new('Deck inspection temporary',d);s.collection.objects.link(c)
c.location=(.73,-14.56,.64);target=Vector((.12,-15.21,.006));c.rotation_euler=(target-c.location).to_track_quat('-Z','Y').to_euler();d.lens=55
s.camera=c;s.render.resolution_x=1000;s.render.resolution_y=640;s.cycles.samples=16;s.render.filepath=str(Path(bpy.data.filepath).parent/'surface-polish-floor-closeup.png');bpy.ops.render.render(write_still=True)
