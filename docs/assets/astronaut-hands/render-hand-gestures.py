"""Render selected gesture evidence without saving authoring state."""
from pathlib import Path
import bpy,json,sys

out=Path(bpy.data.filepath).parent
contract=json.loads((out/'gesture-contract.json').read_text())
folder=out/'gesture-review';folder.mkdir(exist_ok=True)
selected=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
for scene_name,t,name in contract['renderViews']:
    if selected and name not in selected:continue
    scene=bpy.data.scenes[scene_name];bpy.context.window.scene=scene
    frame=t*contract['fps']+1;scene.frame_set(int(frame),subframe=frame-int(frame))
    scene.render.filepath=str(folder/(name+'.png'))
    bpy.ops.render.render(write_still=True)
print('GESTURE_CONTACT_RENDERS_COMPLETE')
