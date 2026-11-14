"""Read-only scene checks and a real visibility ray through the station window."""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

OUT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio\docs\assets\station-reference-interior')
scene=bpy.data.scenes['Station / Reference interior and Cruz del Sur']
assert bpy.context.scene==scene
root=bpy.data.collections['STATION / Reference interior']
def visible_render_objects(col):
    if col.hide_render:return
    for o in col.objects:
        if not o.hide_render:yield o
    for child in col.children:yield from visible_render_objects(child)
meshes=[o for o in visible_render_objects(root) if o.type=='MESH']
nonfinite=[o.name for o in meshes if any(not math.isfinite(x) for v in o.data.vertices for x in v.co)]
zero=[o.name for o in meshes if any(p.area<1e-10 for p in o.data.polygons)]
ship=bpy.data.objects['STATION / Cruz del Sur outside observation windows']
assert ship.instance_type=='COLLECTION'
ship_ids={o.as_pointer() for o in ship.instance_collection.all_objects}
cam=bpy.data.objects['STN / Observation entry view']
target=ship.matrix_world@Vector((0,0,4))
direction=(target-cam.location).normalized()
origin=cam.location.copy()
hits=[]
ship_visible=False
passage_checks=[]
# The disposable editing proxy is absent from renders. Temporarily expose the
# render sources for this read-only ray, then restore the user's edit view.
visibility={c:c.hide_viewport for c in root.children}
try:
    for c in root.children:c.hide_viewport=c.hide_render
    bpy.context.view_layer.update()
    dg=bpy.context.evaluated_depsgraph_get()
    for step in range(16):
        hit,point,normal,index,ob,matrix=scene.ray_cast(dg,origin,direction,distance=200)
        if not hit:break
        hits.append(ob.name)
        if ob.as_pointer() in ship_ids or ob.original.as_pointer() in ship_ids:
            ship_visible=True
            break
        if 'Observation glazing' not in ob.name:break
        origin=point+direction*.01
    if root.get('panoramic_passage_v2'):
        for origin,direction in [(Vector((0,-8.15,.5)),Vector((-1,0,0))),
                                 (Vector((0,-8.15,1.7)),Vector((1,0,0))),
                                 (Vector((0,-8.15,2.7)),Vector((-1,0,0))),
                                 (Vector((.75,-8.15,1.7)),Vector((0,0,1)))]:
            hit,point,normal,index,ob,matrix=scene.ray_cast(dg,origin,direction,distance=4)
            passage_checks.append({'hit':ob.name if ob else None,'point':list(point) if hit else None,'glass':bool(hit and 'V2 GLASS' in ob.name)})
finally:
    for c,hidden in visibility.items():c.hide_viewport=hidden
    bpy.context.view_layer.update()
image_problems=[]
for im in bpy.data.images:
    if im.source=='FILE' and not im.packed_file:
        path=Path(bpy.path.abspath(im.filepath))
        if not path.exists():image_problems.append({'name':im.name,'path':str(path)})
report={
    'scene':scene.name,
    'visible_station_meshes':len(meshes),
    'station_source_faces':sum(len(o.data.polygons) for o in meshes),
    'nonfinite_station_objects':nonfinite,
    'zero_area_face_station_objects':zero,
    'missing_external_images':image_problems,
    'ship_is_real_collection_instance':True,
    'ship_source_objects':len(ship.instance_collection.all_objects),
    'ship_position':list(ship.location),
    'ship_visibility_ray_hits':hits,
    'ship_visible_from_observation':ship_visible,
    'original_cabin_objects':len(bpy.data.collections['BRIDGE / EDITABLE'].all_objects),
    'original_cabin_stays_hidden':bpy.data.collections['BRIDGE / EDITABLE'].hide_viewport,
    'new_station_separate_scene':True,
    'ship_cabin_fitted_to_exterior':False,
    'traversable_docking_connection':False,
    'runtime_integrated':False,
    'panoramic_passage_matches_game_v2':bool(root.get('panoramic_passage_v2')),
    'lightweight_edit_preview_present':bpy.data.collections.get('STATION / EDIT PREVIEW - hide to edit source pieces') is not None,
    'panoramic_passage_glass_rays':passage_checks,
    'notes':'Single-surface glass, display cards and decorative leaves are intentional; source study is not a collider model.',
}
(OUT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
if nonfinite or zero or image_problems or not ship_visible or any(not p['glass'] for p in passage_checks):
    raise RuntimeError('Station validation found an unresolved geometry, texture or visibility issue')
