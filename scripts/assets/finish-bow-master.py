"""Record interaction anchors and finish the first bow authoring pass."""
from pathlib import Path
from math import pi
import bpy, json, shutil
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/bow-master'
scene = bpy.context.scene
assert Path(bpy.data.filepath) == OUT / 'bow-master.blend'
backup = OUT / 'bow-master-initial.blend'
if not backup.exists(): shutil.copy2(bpy.data.filepath, backup)
anchors = [
    ('Navigation', [0,1.62,-7.974],0),
    ('Computer', [-2.3792893219,1.65,-6.8792893219],pi/4),
    ('Communications', [2.3792893219,1.65,-6.8792893219],-pi/4),
    ('Personal', [4.205,1.68,-1.05],-pi/2),
    ('Arcade', [-4.205,1.68,-2.75],pi/2),
    ('Tactical', [0,0,-2.65],0),
    ('Radio', [-3.9,1.27,-1.15],pi/2),
    ('Coffee', [-4.25,0,.5],pi/2),
]
col = bpy.data.collections['08 Interaction anchors - no export']
for name, position, yaw in anchors:
    key='ANCHOR / '+name
    obj=bpy.data.objects.get(key)
    if obj is None:
        obj=bpy.data.objects.new(key,None);col.objects.link(obj)
    obj.location=(position[0],-position[2],position[1]);obj.rotation_euler.z=yaw
    obj.empty_display_size=.12
    obj['runtime_position']=position;obj['runtime_yaw']=yaw
    obj['exclude_runtime_export']=True
# Fine metal grain on the existing floor, preserving its authored color map.
for material in bpy.data.materials:
    if not material.name.startswith('CDS DETAIL / Graphite deck'): continue
    p=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    if material.get('bow_finish'): continue
    nodes=material.node_tree.nodes;links=material.node_tree.links
    noise=nodes.new('ShaderNodeTexNoise');noise.label='Fine anti-slip metal grain';noise.inputs['Scale'].default_value=180
    bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.27;bump.inputs['Distance'].default_value=.014
    if p.inputs['Normal'].is_linked: links.new(p.inputs['Normal'].links[0].from_socket,bump.inputs['Normal'])
    links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],p.inputs['Normal'])
    p.inputs['Metallic'].default_value=.68
    material['bow_finish']=True
bpy.context.view_layer.update()
assert len(col.objects)==8
assert len(bpy.data.collections['06 Glass connector reference - no export'].objects)==51
degenerate=[]
triangles=0
dg=bpy.context.evaluated_depsgraph_get()
for obj in scene.objects:
    if obj.type=='MESH':
        evaluated=obj.evaluated_get(dg);mesh=evaluated.to_mesh();mesh.calc_loop_triangles()
        triangles+=len(mesh.loop_triangles)
        if not mesh.polygons: degenerate.append(obj.name)
        evaluated.to_mesh_clear()
for name in degenerate:
    bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
scene.camera=bpy.data.objects['CAM / Forward overview']
scene.cycles.samples=16
scene.render.resolution_x=1200;scene.render.resolution_y=750
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bow-master.blend'))
(OUT/'validation.json').write_text(json.dumps({'runtimeChanged':False,'anchors':[{'name':n,'position':p,'yaw':y} for n,p,y in anchors], 'collections':{c.name:len(c.objects) for c in scene.collection.children}, 'trianglesIncludingReferenceAndPreview':triangles,'removedEmptySourceMeshes':degenerate,'emptyMeshes':[],'sourceFilesPreserved':True,'previewDisplaysInteractive':False},indent=2))
print('BOW_FINISH_VALIDATED',triangles,'triangles',degenerate)
