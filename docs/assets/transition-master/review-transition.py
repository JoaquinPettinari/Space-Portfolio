"""Update preview framing/mitred joins; optional real-material Eevee preview."""
from pathlib import Path
import ast,bpy,sys,json
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[3];OUT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(OUT/'transition-master.blend'))
scene=bpy.context.scene
context=bpy.data.collections['98 Surrounding bridge and passage - NO EXPORT']
for o in list(context.objects):bpy.data.objects.remove(o,do_unlink=True)
for z in [6.1166666667,8.15,10.1833333333]:
    before=set(scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/models/cruz-del-sur-panoramic-bay.glb'))
    for o in set(scene.objects)-before:
        if o.parent is None:o.location.y-=z
        for c in list(o.users_collection):c.objects.unlink(o)
        context.objects.link(o);o['runtime_export']=False
def xyz(p):return Vector((p[0],-p[2],p[1]))
source=ast.parse((ROOT/'scripts/assets/build-transition-master.py').read_text())
function=next(n for n in source.body if isinstance(n,ast.FunctionDef) and n.name=='arch')
exec(compile(ast.Module(body=[function],type_ignores=[]),'arch-helper','exec'))
for o in list(scene.objects):
    if o.name.startswith(('FORWARD / BRIDGE structural arch','AFT / PANORAMA structural arch','FORWARD / BRIDGE pressure seal','AFT / PANORAMA pressure seal')):bpy.data.objects.remove(o,do_unlink=True)
path=[(-1.43,.04),(-1.43,2.13),(-1.10,2.60),(1.10,2.60),(1.43,2.13),(1.43,.04)]
for z,name in [(2.19,'FORWARD / BRIDGE'),(5.05,'AFT / PANORAMA')]:
    arch(name+' structural arch',path,z,.15,.16,bpy.data.materials['TRANSITION / Brushed titanium'],bpy.data.collections['01 Pressure walls and portal frames'])
    arch(name+' pressure seal',path,z+.091,.034,.025,bpy.data.materials['TRANSITION / Recessed pressure seals'],bpy.data.collections['05 Fasteners seals and labels'])
materials='--materials' in sys.argv
if materials:
    # Only Eevee is used for the real-material preview.
    try:scene.render.engine='BLENDER_EEVEE'
    except TypeError:scene.render.engine='BLENDER_EEVEE_NEXT'
    if hasattr(scene,'eevee') and hasattr(scene.eevee,'taa_render_samples'):scene.eevee.taa_render_samples=16
    scene.render.resolution_x=1280;scene.render.resolution_y=720;scene.view_settings.exposure=.6
    for side in [-1,1]:
        name='Preview shelf wash '+str(side)
        if bpy.data.objects.get(name):continue
        data=bpy.data.lights.new(name,'AREA');data.energy=32;data.color=(1,.65,.32);data.shape='RECTANGLE';data.size=2;data.size_y=.18
        o=bpy.data.objects.new(name,data);bpy.data.collections['90 PREVIEW cameras and lighting'].objects.link(o);o.location=xyz((side*1.7,2.43,3.6));o.rotation_euler=(xyz((side*.8,.7,3.6))-o.location).to_track_quat('-Z','Y').to_euler()
scene.camera=bpy.data.objects['Player toward panorama']
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();vertices=[];faces=[];triangles=0;meshes=0
for o in scene.objects:
    if o.type!='MESH' or any(c.name.startswith(('90 ','98 ','99 ')) for c in o.users_collection):continue
    evaluated=o.evaluated_get(deps);data=evaluated.to_mesh();data.calc_loop_triangles();triangles+=len(data.loop_triangles);meshes+=1
    offset=len(vertices);vertices.extend(o.matrix_world@v.co for v in data.vertices);faces.extend(tuple(offset+i for i in p.vertices) for p in data.polygons);evaluated.to_mesh_clear()
tree=BVHTree.FromPolygons(vertices,faces);checks=[]
for x in [-.7,0,.7]:
    for y in [.2,1.7,2.35]:
        hit=tree.ray_cast(xyz((x,y,2.31)),Vector((0,-1,0)),2.55)
        assert hit[0] is None,('Passage blocked',x,y,hit)
        checks.append({'x':x,'height':y,'clear':True})
report=json.loads((OUT/'manifest.json').read_text());report.update({'editableMeshes':meshes,'evaluatedTriangles':triangles,'clearanceRays':checks,'continuousMitredFrames':True,'contextSource':'public/models/cruz-del-sur-panoramic-bay.glb (3 instances, no export)'})
(OUT/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'transition-master.blend'))
for name in ([] if '--validate-only' in sys.argv else ['Player toward panorama','Shelf detail'] if materials else ['Player toward bridge','Player toward panorama','Shelf detail']):
    scene.camera=bpy.data.objects[name];scene.render.filepath=str(OUT/(name.lower().replace(' ','-')+('-materials' if materials else '')+'.png'));bpy.ops.render.render(write_still=True)
if materials:
    report.update({'materialPreview':{'renderer':scene.render.engine,'resolution':[1280,720],'samples':getattr(getattr(scene,'eevee',None),'taa_render_samples',None),'threads':2},'pending':'Runtime integration; authoring material previews complete'})
    (OUT/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print('TRANSITION_REVIEW_READY',scene.render.engine)
