"""Cheap Workbench motion evidence, JPEG pipe -> local VP9 WebM encoder.

The preview demonstrates motion, not the final shader appearance. No file save.
"""
from pathlib import Path
import bpy,json,subprocess,math

out=Path(bpy.data.filepath).parent/'gesture-review'
out.mkdir(exist_ok=True)
contract=json.loads((out.parent/'gesture-contract.json').read_text())
encoder=Path(r'C:\Users\joaqu\AppData\Local\ms-playwright\ffmpeg-1013\ffmpeg-win64.exe')
assert encoder.exists()
previews=[('01 Tablet raise','tablet-raise',contract['timing']['tablet']['raise']),
          ('01 Tablet lower','tablet-lower',contract['timing']['tablet']['lower']),
          ('02 Credential present','card-present',contract['timing']['card']['duration']),
          ('03 Radio press','radio-press',contract['timing']['radio']['duration'])]
for scene_name,name,duration in previews:
    scene=bpy.data.scenes[scene_name];bpy.context.window.scene=scene
    scene.render.engine='BLENDER_WORKBENCH'
    scene.display.shading.light='STUDIO'
    scene.display.shading.color_type='MATERIAL'
    scene.display.shading.show_shadows=True
    scene.display.shading.show_cavity=True
    scene.render.resolution_x=640;scene.render.resolution_y=480
    scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=85
    frames=[]
    count=max(3,round(duration*12)+1)
    for i in range(count):
        t=duration*i/(count-1)
        frame=t*contract['fps']+1
        scene.frame_set(int(frame),subframe=frame-int(frame))
        path=out/(name+'-'+str(i).zfill(3)+'.jpg')
        scene.render.filepath=str(path);bpy.ops.render.render(write_still=True)
        frames.append(path)
    args=[str(encoder),'-y','-f','image2pipe','-c:v','mjpeg','-r',str((count-1)/duration),'-i','pipe:0','-an','-c:v','libvpx-vp9','-crf','35','-b:v','0','-deadline','realtime',str(out/(name+'.webm'))]
    process=subprocess.Popen(args,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,creationflags=subprocess.CREATE_NO_WINDOW)
    for path in frames:process.stdin.write(path.read_bytes())
    process.stdin.close()
    stderr=process.stderr.read().decode(errors='replace');code=process.wait()
    assert code==0,stderr
    print('PREVIEW_READY',name,flush=True)
print('ALL_GESTURE_PREVIEWS_READY')
