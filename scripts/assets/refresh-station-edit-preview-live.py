"""Refresh a disposable solid editing proxy; retain full editable sources for renders.

Hide this preview collection and enable a source collection in the Outliner to
edit individual pieces. Rerun this script afterwards to refresh the preview.
"""
import bpy
import json
import time
from pathlib import Path
from mathutils import Matrix, Vector

OUT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio\docs\assets\station-reference-interior')
scene=bpy.data.scenes['Station / Reference interior and Cruz del Sur']
assert bpy.context.scene==scene
root=bpy.data.collections['STATION / Reference interior']
NAME='STATION / EDIT PREVIEW - hide to edit source pieces'
OWNER='station_edit_preview_v1'
proxy=bpy.data.collections.get(NAME)
if proxy:
    if proxy.get('owner')!=OWNER:raise RuntimeError('Preview collection ownership mismatch')
    for ob in list(proxy.objects):
        if ob.get('owner')!=OWNER:raise RuntimeError('Unowned object in generated preview; preserve it')
        data=ob.data
        bpy.data.objects.remove(ob,do_unlink=True)
        if data and data.users==0:bpy.data.meshes.remove(data)
else:
    proxy=bpy.data.collections.new(NAME)
    root.children.link(proxy)
    proxy['owner']=OWNER
proxy.hide_render=True
proxy.hide_viewport=False
dg=bpy.context.evaluated_depsgraph_get()
default=bpy.data.materials['STATION / Ceiling graphite']
def is_glass(mat):
    if not mat:return False
    name=mat.name.lower()
    if 'observation glass' in name or ('glazing' in name and 'gasket' not in name):return True
    if mat.use_nodes:
        for n in mat.node_tree.nodes:
            if n.type=='BSDF_TRANSPARENT':return True
            if n.type=='BSDF_PRINCIPLED' and n.inputs['Alpha'].default_value<.99:return True
    return False

def merged(name,items):
    vertices=[]
    faces=[]
    indices=[]
    materials=[]
    material_ids={}
    uv_coords=[]
    included=0
    for ob,matrix in items:
        if ob.hide_render or ob.type not in {'MESH','CURVE','FONT'}:continue
        evaluated=None
        if ob.type=='MESH':
            data=ob.data  # Editable base geometry, before thousands of small bevels.
        else:
            evaluated=ob.evaluated_get(dg)
            data=evaluated.to_mesh()
        try:
            usable=[]
            for p in data.polygons:
                mat=ob.material_slots[p.material_index].material if p.material_index<len(ob.material_slots) else default
                if is_glass(mat):continue  # Solid shading would turn glass opaque.
                usable.append((p,mat or default))
            if not usable:continue
            base=len(vertices)
            vertices.extend(tuple(matrix@v.co) for v in data.vertices)
            uv=data.uv_layers.active
            for p,mat in usable:
                key=mat.as_pointer()
                if key not in material_ids:
                    material_ids[key]=len(materials)
                    materials.append(mat)
                faces.append(tuple(base+i for i in p.vertices))
                indices.append(material_ids[key])
                uv_coords.extend(tuple(uv.data[i].uv) if uv else (0,0) for i in p.loop_indices)
            included+=1
        finally:
            if evaluated:evaluated.to_mesh_clear()
    data=bpy.data.meshes.new(name)
    data.from_pydata(vertices,[],faces)
    data.update()
    for mat in materials:data.materials.append(mat)
    for p,idx in zip(data.polygons,indices):p.material_index=idx
    uv=data.uv_layers.new(name='Source UV')
    for loop,co in zip(uv.data,uv_coords):loop.uv=co
    ob=bpy.data.objects.new(name,data)
    proxy.objects.link(ob)
    ob.hide_render=True
    ob['owner']=OWNER
    ob['role']='Disposable solid viewport preview; never export or render.'
    return {'name':name,'source_objects':included,'vertices':len(vertices),'faces':len(faces),'materials':len(materials)}

def render_items(col):
    if col.hide_render:return
    for ob in col.objects:yield ob
    for child in col.children:yield from render_items(child)

station=[]
seen=set()
for col in root.children:
    if col==proxy or 'PREVIEW /' in col.name:continue
    for ob in render_items(col):
        if ob.as_pointer() in seen:continue
        seen.add(ob.as_pointer())
        station.append((ob,ob.matrix_world.copy()))
ship=bpy.data.objects['STATION / Cruz del Sur outside observation windows']
ship_items=[(ob,ship.matrix_world@ob.matrix_world) for ob in ship.instance_collection.all_objects]
reports=[merged('STN EDIT / Station - base geometry',station),merged('STN EDIT / Ship - base geometry',ship_items)]
for col in root.children:
    if col==proxy or 'PREVIEW / Cameras' in col.name:continue
    col.hide_viewport=True
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        sh=area.spaces.active.shading
        sh.type='SOLID'
        sh.light='STUDIO'
        sh.color_type='MATERIAL'
        sh.show_shadows=False
        sh.show_cavity=False
        area.spaces.active.overlay.show_overlays=False
bpy.context.view_layer.update()
bpy.ops.wm.redraw_timer(type='DRAW_WIN_SWAP',iterations=2)
trials=[]
for i in range(3):
    t=time.perf_counter()
    bpy.ops.wm.redraw_timer(type='DRAW_WIN_SWAP',iterations=3)
    trials.append((time.perf_counter()-t)*1000/3)
report={
    'method':'Three trials of three synchronous full-window redraws after warmup; UI overhead included, not sustained animation FPS.',
    'baseline':json.loads(scene.get('viewport_baseline','{}')),
    'solid_unbatched_ms':scene.get('viewport_edit_redraw_ms'),
    'solid_batched_trials_ms':trials,
    'proxy_objects':reports,
    'render_raytracing_preserved':scene.eevee.use_raytracing,
    'render_samples_preserved':scene.eevee.taa_render_samples,
    'full_detail_sources_preserved':True,
    'transparent_panes_omitted_in_solid_proxy_only':True,
}
(OUT/'viewport-performance.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
proxy['instructions']='Hide this collection and enable the relevant source collection to edit. Rerun refresh-station-edit-preview-live.py after source changes.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'station-reference-interior.blend'))
print('EDIT PREVIEW REPORT',json.dumps(report))
