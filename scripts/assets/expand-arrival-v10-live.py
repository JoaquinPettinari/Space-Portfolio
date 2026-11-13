"""Expand architectural footprint 1.5x while preserving human-scale equipment."""
from pathlib import Path
from math import sin, pi
import bpy
from mathutils import Matrix, Vector

ROOT=Path(__file__).resolve().parents[2]
NAME='Arrival Room - Spacious V10'
assert NAME not in bpy.data.scenes
source=bpy.data.scenes['Arrival Room - Coffee and Memories V9']
scene=bpy.data.scenes.new(NAME);bpy.context.window.scene=scene
scene.world=source.world;scene.unit_settings.system='METRIC'
SCALE=1.5;EXTENSION=4.13*.5;BENCH_SHIFT=2.65*.5
def expansion(z):return .65*sin(pi*max(0,min(4.13,z))/4.13)**2
for old_col in source.collection.children:
    category=old_col.name.split(' / ')[-1]
    col=bpy.data.collections.new('ARRIVAL V10 / '+category);scene.collection.children.link(col)
    for old in old_col.objects:
        obj=old.copy();obj.data=old.data.copy();obj.name=old.name.replace('ARR9','ARR10');col.objects.link(obj)
        name=old.name.removeprefix('ARR9 ')
        # Bake transforms so both older primitive meshes and baked detail meshes
        # are modified in the same metre-based coordinate system.
        obj.data.transform(obj.matrix_world);obj.matrix_world=Matrix.Identity(4)
        points=[v.co for v in obj.data.vertices]
        center=sum(points,Vector())/len(points)
        def translate(dx=0,dz=0):
            for p in points:p.x+=dx;p.y-=dz
        if category in ['Access surround','Access references','Signage'] or name=='bulkhead overhead reveal':
            pass
        elif name.startswith('rear jamb'):translate(dz=EXTENSION)
        elif name.startswith(('rear wall','rear header')):
            for p in points:p.x*=SCALE;p.y-=EXTENSION
        elif name.startswith(('front wall','access header')):
            for p in points:p.x*=SCALE
        elif name.startswith('bench '):
            for p in points:
                z=-p.y;new_z=z+BENCH_SHIFT
                p.x+=-1.32+expansion(z)-SCALE*expansion(new_z/SCALE)
                p.y=-new_z
        elif name.startswith(('equipment case','case ')):
            z=3.5;new_z=z+BENCH_SHIFT
            translate(-1.32+expansion(z)-SCALE*expansion(new_z/SCALE),BENCH_SHIFT)
        elif category=='Coffee and memories' or name.startswith(('service ','supply plaque','CABIN SUPPLIES')):
            translate(-1.4)
        elif name.startswith(('technical cabinet','cabinet ')):
            old_z=1.9 if -center.y<2.55 else 3.2
            translate(1.4,old_z*.5)
        elif category in ['Fitted lounge','Equipment details']:
            # Medical kit and flag remain near the secured access, at hand height.
            pass
        else:
            for p in points:p.x*=SCALE;p.y*=SCALE

# Fill enlarged end-wall apertures around the original-sized door mechanisms.
details=bpy.data.collections.new('ARRIVAL V10 / Door adapters');scene.collection.children.link(details)
mats={k:bpy.data.materials['ARRIVAL V4 '+k] for k in ['Warm grey panels','Graphite frame']}
helper=(ROOT/'scripts/assets/detail-arrival-v6-live.py').read_text()
import bmesh
exec(helper[helper.index('def xyz'):helper.index('# Equipment case')].replace("'ARR6 '+name","'ARR10 '+name"))
for side in [-1,1]:
    box('front aperture adapter',(side*1.675,1.25,-.06),(.67,2.5,.12),'Warm grey panels',0)
    box('rear aperture adapter',(side*1.5,1.25,4.18+EXTENSION),(.6,2.5,.16),'Warm grey panels',0)

exporter=ROOT/'scripts/assets/export-arrival-runtime-live.py'
exec(compile(exporter.read_text(),str(exporter),'exec'),{'__file__':str(exporter)})
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/arrival-room/arrival-room-v10.blend'))
print('V10: 8.4m base width, 6.195m depth, unchanged heights/doorways/equipment sizes.')
