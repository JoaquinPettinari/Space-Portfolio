"""Blender-only coffee and botanical close-up finish; no layout changes."""
import bpy,ast,bmesh,math,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/assets/bridge-ceiling-study'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'bridge-galley-graphite-light.blend'))
scene=bpy.context.scene
original={o.name:tuple(v for row in o.matrix_world for v in row) for o in scene.objects}
col=bpy.data.collections.new('GALLEY DETAIL / Espresso and botanical finish');scene.collection.children.link(col)
tree=ast.parse((ROOT/'scripts/assets/polish-galley-botanical.py').read_text())
exec(compile(ast.Module(body=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in {'material','box','tube','mesh'}],type_ignores=[]),'<galley-builders>','exec'))
steel=material('GALLEY DETAIL / Satin stainless steel',(.32,.35,.37),.31,.82)
rubber=bpy.data.materials['CEILING POLISH / Matte recessed gasket']
# Ring profiles are small machining details within the existing appliance footprint.
def ring(name,x,y,z,r,thickness,mat,vertical=False):
    pts=[(x+r*math.cos(i*math.tau/48),y if vertical else y+r*math.sin(i*math.tau/48),z+r*math.sin(i*math.tau/48) if vertical else z) for i in range(49)]
    return tube(name,pts,thickness,mat)
ring('Brew group machined collar',2.75,-1.232,1.48,.047,.005,steel)
ring('Brew group lower gasket',2.75,-1.232,1.468,.043,.003,rubber)
# Folded tray perimeter gives the removable grille a visible lip.
tube('Drip tray rolled perimeter',[(2.60,-1.39,1.168),(2.90,-1.39,1.168),(2.90,-1.11,1.168),(2.60,-1.11,1.168),(2.60,-1.39,1.168)],.004,steel)
for x in (2.61,2.89):box('Tray fixing recess',(x,-1.12,1.166),(.01,.018,.002),rubber)
# Narrow inset seams at the head, no overlays on the existing display.
for x in (2.572,2.928):box('Head service seam',(x,-1.28,1.61),(.004,.29,.09),rubber)
for i in range(8):box('Spine ventilation',(2.67+i*.023,-1.404,1.36),(.011,.003,.054),rubber)
# Subtle lip and sleeve at the steam nozzle.
ring('Steam wand nozzle collar',2.906,-1.10,1.225,.008,.002,steel)
# Leaf surfaces: restrained mottling and low-strength microrelief, not shiny plastic.
for i in range(3):
    m=bpy.data.materials['GALLEY POLISH / Leaf '+str(i)]
    n=m.node_tree.nodes;l=m.node_tree.links;p=next(v for v in n if v.type=='BSDF_PRINCIPLED')
    color=tuple(p.inputs['Base Color'].default_value)
    tex=n.new('ShaderNodeTexCoord');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=22;noise.inputs['Detail'].default_value=2
    l.new(tex.outputs['Generated'],noise.inputs['Vector'])
    ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=tuple(v*.82 for v in color[:3])+(1,);ramp.color_ramp.elements[1].color=tuple(v*1.14 for v in color[:3])+(1,)
    l.new(noise.outputs['Fac'],ramp.inputs['Fac']);l.new(ramp.outputs['Color'],p.inputs['Base Color'])
    bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.10;bump.inputs['Distance'].default_value=.00025
    l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
# Tone down the contrasting veins so they read as part of the leaf tissue.
m=bpy.data.materials['GALLEY POLISH / Leaf veins'];p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(.067,.12,.025,1)
# Recessed soil grains confined to the pot, no extra shelf clutter.
soil=bpy.data.materials['GALLEY POLISH / Potting substrate']
for i in range(18):
    a=i*2.399;r=.025+.078*((i*7)%17)/17
    box('Soil granule',(4.43+r*math.cos(a),-.68+r*math.sin(a),1.257),(.009,.007,.005),soil)
ring('Pot lower ceramic foot',4.43,-.68,1.085,.087,.004,rubber)
# Existing shelf practicals: warm, broad and modest, no new lights.
for o in scene.objects:
    if o.type=='LIGHT' and o.name.startswith('GALLEY WIDE / '):o.data.energy=10;o.data.color=(1,.65,.36)
assert all(tuple(v for row in scene.objects[n].matrix_world for v in row)==v for n,v in original.items())
(OUT/'galley-appliance-finish.json').write_text(json.dumps({'originalTransformsPreserved':len(original),'newDetailObjects':len(col.objects),'runtimeIntegrated':False,'additionalLights':0},indent=2)+'\n')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bridge-galley-appliance-finish.blend'),compress=True)
