"""Restrained shelf and botanical finish; appliance anchors remain untouched."""
import bpy, ast, math, hashlib, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/assets/bridge-ceiling-study'
source=OUT/'bridge-galley-open-wide.blend'
if Path(bpy.data.filepath)!=source: bpy.ops.wm.open_mainfile(filepath=str(source))
scene=bpy.context.scene
original={o.name:tuple(v for row in o.matrix_world for v in row) for o in scene.objects}
col=bpy.data.collections.new('GALLEY FINISH / Shelf and botanical details');scene.collection.children.link(col)
# Reuse the established mesh builders rather than duplicate the geometry code.
tree=ast.parse((ROOT/'scripts/assets/polish-galley-botanical.py').read_text())
import bmesh
exec(compile(ast.Module(body=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in {'material','mesh','box','tube'}],type_ignores=[]),'<galley-builders>','exec'))
metal=bpy.data.materials['CEILING FINISH / Brushed edge alloy']
dark=bpy.data.materials['GALLEY POLISH / Graphite ceramic coated wall']
ceramic=material('GALLEY FINISH / Ivory stoneware',(.46,.40,.30),.38)
black=bpy.data.materials['CEILING POLISH / Matte recessed gasket']
archive=bpy.data.collections.new('GALLEY FINISH / Plain shelf props - hidden');scene.collection.children.link(archive);archive.hide_render=True;archive.hide_viewport=True
for o in list(scene.objects):
    if o.name.startswith(('GALLEY WIDE / Cup rack','GALLEY WIDE / Provision container','GALLEY WIDE / Container lid')):
        for c in list(o.users_collection):c.objects.unlink(o)
        archive.objects.link(o)
# Folded underside and inset screwheads add depth without hanging into the work area.
for z in (2.02,2.66):
    box('Shelf folded rear lip',(3.4,-1.785,z+.037),(2.44,.018,.045),metal)
    for x in (2.22,4.58):
        box('Shelf end cap',(x,-1.60,z),(.025,.37,.055),metal)
        for y in (-1.46,-1.74):
            box('Flush shelf screw',(x,y,z+.029),(.007,.007,.002),black)
# Hollow turned vessels, not solid blocks. Two mugs and two sealed canisters only.
def vessel(name,x,y,z,profile,mat):
    verts=[(x+r*math.cos(i*math.tau/32),y+r*math.sin(i*math.tau/32),z+h) for r,h in profile for i in range(32)]
    faces=[(j*32+i,j*32+(i+1)%32,(j+1)*32+(i+1)%32,(j+1)*32+i) for j in range(len(profile)-1) for i in range(32)]
    o=mesh(name,verts,faces,mat)
    for p in o.data.polygons:p.use_smooth=True
    return o
for x in (2.36,2.58):
    vessel('Stoneware mug',x,-1.60,2.044,[(0,0),(.039,0),(.045,.012),(.047,.105),(.042,.11),(.037,.104),(.034,.014),(0,.014)],ceramic)
    tube('Mug handle',[(x+.044+.026*math.sin(t*math.pi),-1.60,2.12-.064*t) for t in [i/16 for i in range(17)]],.006,ceramic)
for x,h in ((4.05,.18),(4.29,.135)):
    vessel('Provision tin',x,-1.62,2.685,[(0,0),(.063,0),(.068,.008),(.068,h),(.064,h+.008),(0,h+.008)],dark)
    vessel('Tin lid band',x,-1.62,2.685,[(.069,h-.016),(.069,h+.005),(.062,h+.012)],metal)
    box('Tin index tab',(x,-1.55,2.76),(.029,.003,.014),ceramic)
# Subdivision softens the leaf silhouette; existing veins and plant footprint stay fixed.
for o in scene.objects:
    if o.name.startswith('GALLEY POLISH / Curved lanceolate leaf'):
        mod=o.modifiers.new('Soft leaf curvature','SUBSURF');mod.levels=1;mod.render_levels=1
        bpy.context.view_layer.objects.active=o
        bpy.ops.object.modifier_move_up(modifier=mod.name)
for i,color in enumerate(((.025,.075,.012),(.045,.115,.021),(.072,.15,.029))):
    m=bpy.data.materials['GALLEY POLISH / Leaf '+str(i)]
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.62
# Matte ceramic and graphite: less plastic-like specular response.
for name,rough,metallic in [('GALLEY POLISH / Powder coated pot',.78,.03),('GALLEY WALL / Pale brushed composite',.55,.08)]:
    m=bpy.data.materials[name];p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metallic
p=next(n for n in dark.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Metallic'].default_value=.18
# Small seams and attachment points on existing panels, no new vertical obstructions.
for x in (2.45,3.35,4.25):
    for z in (1.20,3.10):box('Panel captive fastener',(x,-1.792,z),(.012,.004,.012),metal)
assert all(tuple(v for row in scene.objects[n].matrix_world for v in row)==matrix for n,matrix in original.items())
report={'originalTransformsPreserved':len(original),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'newObjects':len(col.objects),'appliancePositionsUnchanged':True}
(OUT/'galley-shelf-finish.json').write_text(json.dumps(report,indent=2)+'\n')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bridge-galley-shelf-finish.blend'),compress=True)
print(report)
