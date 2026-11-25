"""Dedicated graphite wall finish; preserve the approved galley arrangement."""
import bpy,ast,bmesh,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/bridge-ceiling-study'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'bridge-galley-shelf-finish.blend'))
scene=bpy.context.scene
transforms={o.name:tuple(v for row in o.matrix_world for v in row) for o in scene.objects}
col=bpy.data.collections.new('GALLEY WALL FINISH / Flush panel detailing');scene.collection.children.link(col)
tree=ast.parse((ROOT/'scripts/assets/polish-galley-botanical.py').read_text())
exec(compile(ast.Module(body=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in {'material','box'}],type_ignores=[]),'<galley-builders>','exec'))
m=material('GALLEY WALL FINISH / Fine graphite ceramic',(.034,.041,.048),.64,.16)
n=m.node_tree.nodes;l=m.node_tree.links;p=next(n for n in n if n.type=='BSDF_PRINCIPLED')
t=n.new('ShaderNodeTexCoord');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=130;noise.inputs['Detail'].default_value=2
l.new(t.outputs['Generated'],noise.inputs['Vector'])
ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.026,.032,.039,1);ramp.color_ramp.elements[1].color=(.040,.048,.057,1)
l.new(noise.outputs['Fac'],ramp.inputs['Fac']);l.new(ramp.outputs['Color'],p.inputs['Base Color'])
b=n.new('ShaderNodeBump');b.inputs['Strength'].default_value=.13;b.inputs['Distance'].default_value=.0007;l.new(noise.outputs['Fac'],b.inputs['Height']);l.new(b.outputs['Normal'],p.inputs['Normal'])
changed=[]
for o in scene.objects:
    if o.name.startswith('GALLEY WIDE / ') and any(k in o.name for k in ('Wall face','Side closure','Rear pressure closure')):
        o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(m);changed.append(o.name)
black=bpy.data.materials['CEILING POLISH / Matte recessed gasket'];metal=bpy.data.materials['CEILING FINISH / Brushed edge alloy']
# Shallow panel joints and small service plates, all behind appliances.
for x in (2.90,3.80):box('Recessed panel joint',(x,-1.797,2.12),(.014,.008,2.12),black)
for x in (2.45,4.25):
    box('Flush service plate',(x,-1.788,2.37),(.19,.007,.07),m)
    box('Service plate index',(x-.055,-1.782,2.37),(.035,.003,.008),metal)
# Warm diffusers remain warm while wall relief carries the contrast.
for o in scene.objects:
    if o.type=='LIGHT' and o.name.startswith('GALLEY WIDE / '):o.data.energy=8;o.data.color=(1,.62,.32)
assert all(tuple(v for row in scene.objects[n].matrix_world for v in row)==v for n,v in transforms.items())
(OUT/'galley-wall-finish.json').write_text(json.dumps({'wallObjects':changed,'originalTransformsPreserved':len(transforms),'additionalRuntimeLights':0},indent=2)+'\n')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bridge-galley-graphite-light.blend'),compress=True)

