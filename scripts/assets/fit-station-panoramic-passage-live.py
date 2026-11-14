"""Replace only the station study's closed passage with the game's editable V2 bays."""
import bpy
import json
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio')
OUT=ROOT/'docs/assets/station-reference-interior'
scene=bpy.context.scene
root=bpy.data.collections['STATION / Reference interior']
if root.get('panoramic_passage_v2'):raise RuntimeError('Panoramic passage already fitted')
if not (OUT/'before-glass-performance.blend').exists():
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'before-glass-performance.blend'),copy=True)
old=bpy.data.collections['STATION / 03 Connecting passage']
old.hide_viewport=True
old.hide_render=True
old['status']='Closed first study preserved for comparison; replaced by the V2 glass passage.'
source=bpy.data.collections.get('Panoramic Bay V2')
if source is None:
    with bpy.data.libraries.load(str(ROOT/'docs/assets/panoramic-bay/panoramic-bay-v2.blend'),link=False) as (a,b):
        b.collections=['Panoramic Bay V2']
    source=b.collections[0]
new=bpy.data.collections.new('STATION / 03b Panoramic passage - game V2')
root.children.link(new)
glass=bpy.data.materials['STATION / Observation glass - clear preview']
depth=6.1/3
for i in range(3):
    center=-5.1-(i+.5)*depth
    for original in list(source.all_objects):
        ob=original.copy()
        ob.name='STN GLASS BAY '+str(i+1)+' / '+original.name
        new.objects.link(ob)
        # Appended, unlinked objects have unevaluated matrix_world values.
        # This module has no parents; matrix_basis preserves authored transforms.
        assert original.parent is None, 'Unexpected parent in the bay source'
        ob.matrix_world=Matrix.Translation((0,center,0))@original.matrix_basis
        ob.hide_viewport=False
        ob.hide_render=False
        if ob.type=='MESH':
            for slot in ob.material_slots:
                if slot.material and 'glazing V2' in slot.material.name:
                    slot.link='OBJECT'
                    slot.material=glass

# The native three-bay passage is 6.1 m, 0.9 m longer than the closed study.
for o in bpy.data.collections['STATION / 02 Arrival lounge - working copy'].objects:
    o.location.y-=.9
for o in bpy.data.collections['STATION / 06 Interior dressing'].objects:
    p=[o.matrix_world@Vector(v) for v in o.bound_box]
    if p and max(v.y for v in p)<-15.5:o.location.y-=.9
for o in bpy.data.collections['STATION / PREVIEW / Cameras and lighting'].objects:
    if o.location.y<-11.5:o.location.y-=.9
    if o.name.startswith('STN / Passage ceiling'):o.data.energy=40

# A camera inside the actual glass section looks across its inclined facets.
data=bpy.data.cameras.new('STN / Panoramic passage review')
camera=bpy.data.objects.new(data.name,data)
bpy.data.collections['STATION / PREVIEW / Cameras and lighting'].objects.link(camera)
camera.location=(0,-10.55,1.7)
camera.rotation_euler=(Vector((0,-3,1.6))-camera.location).to_track_quat('-Z','Y').to_euler()
data.lens=18
data.clip_end=500
root['panoramic_passage_v2']=True
root['passage_source']='panoramic-bay-v2.blend; three native 2.033333 m bays, same profile as runtime.'
root['passage_profile']=json.dumps([(1.65,.1),(2.05,.85),(2.05,2.4),(1.65,3.2)])
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'station-reference-interior.blend'))
print('GLASS PASSAGE FITTED',len(new.objects),'editable pieces; 6.1 m long')
