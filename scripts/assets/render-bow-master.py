"""Render saved bow review cameras without saving or changing its master."""
from pathlib import Path
import bpy, sys
out=Path(bpy.data.filepath).parent
scene=bpy.context.scene
views=[('Forward overview','bow-forward.png'),('Aft connection','bow-aft.png')]
for name,filename in [('Deck inspection','bow-deck-detail.png'),('Console and window','bow-console-window.png'),('Seat inspection','bow-seat-detail.png'),('Seat front detail','bow-seat-front.png')]:
    if 'CAM / '+name in bpy.data.objects: views.append((name,filename))
for name,filename in views:
    if '--' in sys.argv and name not in sys.argv[sys.argv.index('--')+1:]: continue
    scene.camera=bpy.data.objects['CAM / '+name]
    scene.render.filepath=str(out/filename)
    bpy.ops.render.render(write_still=True)
