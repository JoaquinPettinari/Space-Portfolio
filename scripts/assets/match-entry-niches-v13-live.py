"""Replace the two selected outer white wall panels with matching adjacent niches."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
v8=(ROOT/'scripts/assets/detail-bridge-furniture-v8-live.py').read_text()
prefix=v8[:v8.index('existing = set(collection.objects)')]
prefix=prefix.replace('Bridge - Furniture Details V8','Bridge - Matching Entry Niches V13').replace('Bridge - Finished Entry V7','Bridge - Console Monitors V12').replace('BRIDGE V8 / Architecture','BRIDGE V13 / Architecture')
exec(compile(prefix,__file__,'exec'))
from mathutils import Matrix
panels=[o for o in collection.objects if o.name.startswith('Entry outer panel')]
assert len(panels)==2
for obj in panels:
    data=obj.data;bpy.data.objects.remove(obj,do_unlink=True)
    if data.users==0:bpy.data.meshes.remove(data)
existing=set(collection.objects)
# Duplicate the neighbouring recess construction into each original 1.66m bay.
# Preserve wall depth/height, floor alignment and the existing wall collider.
for old in source.objects:
    if old.type!='MESH' or not old.name.startswith('Niche '):continue
    points=[old.matrix_world@v.co for v in old.data.vertices]
    centre=sum(p.x for p in points)/len(points)
    side=1 if centre>0 else -1
    obj=old.copy();obj.data=old.data.copy();obj.name='Outer '+old.name
    obj.data.transform(old.matrix_world);obj.matrix_world=Matrix.Identity(4)
    for v in obj.data.vertices:v.co.x=side*3.97+(v.co.x-side*2.56)*(1.66/1.16)
    collection.objects.link(obj)
finish=v8[v8.index('for obj in set(collection.objects)-existing:'):]
finish=finish.replace('bridge-interior-v8.blend','bridge-interior-v13.blend')
finish=finish[:finish.index("print('V8")]+"print('V13: two white panels replaced by matching recessed bays; wall closure retained.')"
exec(compile(finish,__file__,'exec'))
