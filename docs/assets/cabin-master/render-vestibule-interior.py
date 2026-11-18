"""Interior evidence of the real room and flush floor; no hidden geometry."""
import bpy
from pathlib import Path
from mathutils import Vector
s=bpy.context.scene;d=bpy.data.cameras.new('Vestibule interior review');c=bpy.data.objects.new('Vestibule interior review',d);s.collection.objects.link(c);c.location=(-.60,-18.78,1.68);target=Vector((.15,-20.45,1.03));c.rotation_euler=(target-c.location).to_track_quat('-Z','Y').to_euler();d.lens=24;d.clip_start=.015
s.camera=c;s.render.resolution_x=1000;s.render.resolution_y=640;s.cycles.samples=16;s.render.filepath=str(Path(bpy.data.filepath).parent/'vestibule-interior.png');bpy.ops.render.render(write_still=True)
