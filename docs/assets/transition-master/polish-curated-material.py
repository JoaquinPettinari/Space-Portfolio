"""Shoe-only material correction; preserve composition and geometry."""
from pathlib import Path
import bpy,ast,json
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3];OUT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(OUT/'transition-shelves-curated.blend'))
tree=ast.parse((ROOT/'scripts/assets/curate-transition-shelves.py').read_text());node=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='make_shoe_knit');exec(compile(ast.Module(body=[node],type_ignores=[]),'knit-material','exec'))
upper=bpy.data.objects['RUNNING / Continuous mesh upper'];upper.data.materials[0]=make_shoe_knit(upper.data.materials[0])
sole=bpy.data.objects['RUNNING / Foam midsole'];m=sole.data.materials[0].copy();m.name='SHELVES / Curated matte running foam';sole.data.materials[0]=m
p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Roughness'].default_value=.92
scene=bpy.context.scene;camera=scene.camera
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'transition-shelves-curated.blend'))
def xyz(p):return Vector((p[0],-p[2],p[1]))
for name,eye,target,lens in [('shelves-curated-shoe',(-1.0,1.42,2.57),(-1.72,1.15,2.83),55),('shelves-curated-overview',(0,1.7,1.15),(0,1.42,4),16)]:
    camera.location=xyz(eye);camera.rotation_euler=(xyz(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=lens;scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
report=json.loads((OUT/'shelves-curated.json').read_text());report['shoeMaterial']={'localCrossedWaveScale':220,'bumpDistanceMetres':.00065,'upperRoughness':[.78,.95],'soleRoughness':.92,'geometryUnchanged':True}
(OUT/'shelves-curated.json').write_text(json.dumps(report,indent=2)+'\n')
print('CURATED_KNIT_PREVIEW_READY')
