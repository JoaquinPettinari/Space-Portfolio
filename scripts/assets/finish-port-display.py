"""Finish the existing port display; preserve neighboring stations and personal shelves."""
import bpy,ast,bmesh,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/bridge-ceiling-study'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'bridge-galley-balanced-finish.blend'))
scene=bpy.context.scene
original={o.name:tuple(v for row in o.matrix_world for v in row) for o in scene.objects}
col=bpy.data.collections.new('PORT CORNER / Cabinet and finish');scene.collection.children.link(col)
tree=ast.parse((ROOT/'scripts/assets/polish-port-corner.py').read_text())
exec(compile(ast.Module(body=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in {'mesh','box'}],type_ignores=[]),'<port-builders>','exec'))
dark=bpy.data.materials['GALLEY POLISH / Graphite ceramic coated wall'];edge=bpy.data.materials['CEILING FINISH / Brushed edge alloy'];seal=bpy.data.materials['CEILING POLISH / Matte recessed gasket'];warm=bpy.data.materials['GALLEY / Honey diffuser']
for o in scene.objects:
 if o.name.startswith('PORT CORNER / ') and o.type=='MESH' and any(k in o.name for k in ('Floating shelf','Display side cheek','Sample cap')):
  o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(dark)
box('Built-in cabinet',(-4.12,-1.60,.61),(1.18,.43,1.07),dark,.018)
box('Recessed plinth',(-4.12,-1.64,.12),(1.08,.34,.14),seal)
for x in (-4.41,-3.83):
 box('Cabinet door',(x,-1.372,.64),(.55,.024,.88),dark,.008)
 box('Pull recess',(x,-1.356,1.00),(.20,.008,.035),seal,.003)
 box('Satin pull',(x,-1.345,1.012),(.18,.018,.012),edge,.003)
box('Cabinet toe diffuser',(-4.12,-1.41,.17),(.92,.012,.015),warm,.003)
for x in (-4.65,-3.59):
 for z in (1.22,2.64):box('Captive panel bolt',(x,-1.38,z),(.013,.008,.013),edge,.003)
# Keep the photograph and its authored UVs untouched.
# The old display crossed the side-wall lining; inset it 14 cm into the recess.
for o in scene.objects:
 if o.name.startswith('PORT CORNER / '):o.location.x+=.14
assert all(tuple(v for row in scene.objects[n].matrix_world for v in row)==v for n,v in original.items() if not n.startswith('PORT CORNER / '))
cam=bpy.data.objects['CORNER REVIEW'];cam.location=(-2.55,.45,1.75);cam.rotation_euler=(Vector((-4.12,-1.5,1.75))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=35;scene.camera=cam
(OUT/'port-display-validation.json').write_text(json.dumps({'originalTransformsPreserved':len(original),'newObjects':len(col.objects),'photoUVsUnchanged':True},indent=2)+'\n')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bridge-port-display-finish.blend'),compress=True)
