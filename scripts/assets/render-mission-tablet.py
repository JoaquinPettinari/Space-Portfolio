"""Render authoring views without changing or saving the master."""
from pathlib import Path
import bpy,sys
scene=bpy.context.scene;out=Path(bpy.data.filepath).parent
views=[('Tablet front','tablet-front.png'),('Tablet detail','tablet-detail.png'),('Tablet assembly','tablet-hands.png')]
for name,filename in views:
    if '--' in sys.argv and name not in sys.argv[sys.argv.index('--')+1:]:continue
    scene.camera=bpy.data.objects['CAM / '+name]
    bpy.data.collections['05 Linked hands - no export'].hide_render=name!='Tablet assembly'
    scene.render.filepath=str(out/filename);bpy.ops.render.render(write_still=True)
