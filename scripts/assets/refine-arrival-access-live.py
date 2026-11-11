"""Preserve V4/V1 studies; repair rear closure and revise door typography."""
from pathlib import Path
import bpy

ROOT=Path(__file__).resolve().parents[2]
source=bpy.data.scenes['Arrival Room - Materials V4']
name='Arrival Room - Rear Closure V5'
assert name not in bpy.data.scenes
scene=bpy.data.scenes.new(name)
bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'
for col in source.collection.children:
    dest=bpy.data.collections.new(col.name.replace('V4','V5'))
    scene.collection.children.link(dest)
    for old in col.objects:
        obj=old.copy();obj.data=old.data.copy();obj.name=old.name.replace('ARR4','ARR5')
        dest.objects.link(obj)
        if 'rear header' in old.name:
            for v in obj.data.vertices:
                world=obj.matrix_world@v.co
                if world.z>3.0:
                    world.z=3.50
                    v.co=obj.matrix_world.inverted()@world
            obj.data.update()
scene.world=source.world
exporter=ROOT/'scripts/assets/export-arrival-runtime-live.py'
code=exporter.read_text(encoding='utf-8').replace("assert scene.name=='Arrival Room - Materials V4'", "assert scene.name=='Arrival Room - Rear Closure V5'")
exec(compile(code,str(exporter),'exec'),{'__file__':str(exporter)})
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/arrival-room/arrival-room-v5.blend'))

# Rebuild a separate hardware revision so the aperture itself follows the glass.
builder=ROOT/'scripts/assets/build-access-hardware-live.py'
code=builder.read_text(encoding='utf-8')
code=code.replace('Docking Door and Crew Access V1','Docking Door and Crew Access V2')
code=code.replace("'CDS hardware / '","'CDS hardware V2 / '")
code=code.replace("docking-and-crew-v1.blend","docking-and-crew-v2.blend")
code=code.replace('window=octagon(0,1.22,.86,.38,.06)','window=octagon(0,1.58,.86,.38,.06)')
code=code.replace('octagon(0,1.22,.98,.5,.07)','octagon(0,1.58,.98,.5,.07)')
code=code.replace("'DOCKING ACCESS',0,1.92", "'DOCKING ACCESS',0,2.02")
code=code.replace("'ARRIVAL / DEPARTURE',0,1.74", "'ARRIVAL / DEPARTURE',0,1.22")
code=code.replace("'PAMPA-07',0,1.62", "'PAMPA-07',0,1.08")
exec(compile(code,str(builder),'exec'),{'__file__':str(builder)})
