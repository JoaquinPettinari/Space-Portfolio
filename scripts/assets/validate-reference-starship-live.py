"""Inspect visible ship meshes; exclude staging and preserved legacy collections."""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

OUT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio\docs\assets\cruz-del-sur-exterior')
root=bpy.data.collections['CRUZ DEL SUR / REFERENCE EXTERIOR']
stage=bpy.data.collections['CDS PREVIEW / Cameras and lighting - no export']
stage_ids={o.as_pointer() for o in stage.all_objects}
objects=[o for o in root.all_objects if o.as_pointer() not in stage_ids and not o.hide_render]
meshes=[o for o in objects if o.type=='MESH']
invalid=[o.name for o in meshes if any(not math.isfinite(x) for v in o.data.vertices for x in v.co)]
zero=[o.name for o in meshes if any(p.area<1e-10 for p in o.data.polygons)]
points=[o.matrix_world@Vector(v) for o in meshes for v in o.bound_box]
dg=bpy.context.evaluated_depsgraph_get()
tris=0
for ob in meshes:
    ev=ob.evaluated_get(dg)
    me=ev.to_mesh()
    me.calc_loop_triangles()
    tris+=len(me.loop_triangles)
    ev.to_mesh_clear()
bridge=bpy.data.collections['BRIDGE / EDITABLE']
report={
    'objects_visible_ship':len(objects),
    'mesh_objects_visible_ship':len(meshes),
    'source_faces':sum(len(o.data.polygons) for o in meshes),
    'evaluated_triangles':tris,
    'nonfinite_objects':invalid,
    'zero_area_face_objects':zero,
    'bounds_min':[min(p[i] for p in points) for i in range(3)],
    'bounds_max':[max(p[i] for p in points) for i in range(3)],
    'original_bridge_objects':len(bridge.all_objects),
    'original_bridge_hidden':bridge.hide_viewport and bridge.hide_render,
    'web_exported':False,
    'web_performance_measured':False,
    'note':'Exterior glazing includes intentional single-surface panes; not a collider mesh.',
}
(OUT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
if invalid or zero:raise RuntimeError('Invalid mesh coordinates or zero-area faces found')
