"""Compare the same station scene in detailed/material, detailed/solid and batched/solid views.

Run with browser measurements and other GPU tasks stopped. This is redraw timing,
not animation timing or a sustained FPS benchmark. Restore lightweight editing.
"""
import bpy
import json
import time
from pathlib import Path

OUT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio\docs\assets\station-reference-interior')
scene=bpy.context.scene
root=bpy.data.collections['STATION / Reference interior']
proxy=bpy.data.collections['STATION / EDIT PREVIEW - hide to edit source pieces']
areas=[a for a in bpy.context.screen.areas if a.type=='VIEW_3D']
original={c:c.hide_viewport for c in root.children}
report=json.loads((OUT/'viewport-performance.json').read_text(encoding='utf-8'))
conditions=[]
try:
    for name,batched,shading in [('detailed_material',False,'MATERIAL'),('detailed_solid',False,'SOLID'),('edit_preview_solid',True,'SOLID')]:
        for c in root.children:
            c.hide_viewport=(False if c==proxy else original[c]) if batched else (c==proxy or c.hide_render)
        for a in areas:a.spaces.active.shading.type=shading
        bpy.context.view_layer.update()
        bpy.ops.wm.redraw_timer(type='DRAW_WIN_SWAP',iterations=3)
        trials=[]
        for i in range(3):
            start=time.perf_counter()
            bpy.ops.wm.redraw_timer(type='DRAW_WIN_SWAP',iterations=3)
            trials.append((time.perf_counter()-start)*1000/3)
        conditions.append({'name':name,'trials_mean_redraw_ms':trials,'median_trial_ms':sorted(trials)[1]})
finally:
    for c,hidden in original.items():c.hide_viewport=hidden
    proxy.hide_viewport=False
    for a in areas:a.spaces.active.shading.type='SOLID'
    bpy.context.view_layer.update()
report['controlled_same_scene_comparison']=conditions
report['comparison_conditions']='Same camera and 1574x860 viewport; browser tests stopped. 3 warmup redraws, 3 trials x 3 redraws. Sources retain bevels in both detailed conditions.'
report['warning']='Other applications, driver scheduling, caches and UI overhead affect these short timings. Do not interpret reciprocal milliseconds as sustained FPS.'
(OUT/'viewport-performance.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'station-reference-interior.blend'))
print('SAME SCENE VIEWPORT COMPARISON',json.dumps(conditions))
