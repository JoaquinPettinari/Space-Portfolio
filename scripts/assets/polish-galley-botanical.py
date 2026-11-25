"""Local botanical, espresso and wall finish study, preserving bridge placement."""
import bpy
import bmesh
import math
import json
import hashlib
from pathlib import Path
from mathutils import Vector

OUT=Path(__file__).resolve().parents[2]/'docs/assets/bridge-ceiling-study'
source=Path(bpy.data.filepath)
assert source.name=='bridge-galley-wall-complete.blend'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
scene=bpy.context.scene
transforms={o.name:tuple(v for row in o.matrix_world for v in row) for o in scene.objects}
col=bpy.data.collections.new('GALLEY POLISH / Botanical and appliance finish');scene.collection.children.link(col)
dark=bpy.data.materials['CEILING FINISH / Satin charcoal titanium']
metal=bpy.data.materials['CEILING FINISH / Brushed edge alloy']
black=bpy.data.materials['CEILING POLISH / Matte recessed gasket']
gold=bpy.data.materials['SHELVES / Medal satin brass']

def material(name,color,roughness,metallic=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=roughness;p.inputs['Metallic'].default_value=metallic
    return m

def mesh(name,verts,faces,mat):
    d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update()
    o=bpy.data.objects.new('GALLEY POLISH / '+name,d);col.objects.link(o);d.materials.append(mat);return o

def box(name,pos,size,mat):
    bm=bmesh.new();bmesh.ops.create_cube(bm,size=1)
    for v in bm.verts:
        for i in range(3):v.co[i]*=size[i]
    d=bpy.data.meshes.new(name);bm.to_mesh(d);bm.free()
    o=bpy.data.objects.new('GALLEY POLISH / '+name,d);col.objects.link(o);o.location=pos;d.materials.append(mat)
    b=o.modifiers.new('Machined rounding','BEVEL');b.width=.003;b.segments=3;o.modifiers.new('Face normals','WEIGHTED_NORMAL');return o

def tube(name,points,radius,mat):
    d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=radius;d.bevel_resolution=2
    s=d.splines.new('POLY');s.points.add(len(points)-1)
    for p,co in zip(s.points,points):p.co=(*co,1)
    o=bpy.data.objects.new('GALLEY POLISH / '+name,d);col.objects.link(o);d.materials.append(mat);return o

archive=bpy.data.collections.new('GALLEY POLISH / Earlier plant - hidden');scene.collection.children.link(archive);archive.hide_render=True;archive.hide_viewport=True
for o in list(scene.objects):
    if o.name.startswith(('GALLEY WALL / Sculpted leaf','GALLEY WALL / Plant stem')):
        for c in list(o.users_collection):c.objects.unlink(o)
        archive.objects.link(o)
leaves=[material('GALLEY POLISH / Leaf '+str(i),c,.48) for i,c in enumerate(((.038,.10,.014),(.065,.145,.025),(.095,.18,.035)))]
vein=material('GALLEY POLISH / Leaf veins',(.13,.20,.045),.63)
soil=material('GALLEY POLISH / Potting substrate',(.018,.011,.007),.94)
pot=bpy.data.objects['GALLEY WALL / Neutral plant pot'];pot.data=pot.data.copy();pot.data.materials.clear();pot.data.materials.append(material('GALLEY POLISH / Powder coated pot',(.028,.033,.031),.62,.12))
center=Vector((4.43,-.70,1.26))
tube('Pot rolled rim',[(4.43+.13*math.cos(i*math.tau/64),-.70+.13*math.sin(i*math.tau/64),1.26) for i in range(65)],.006,metal)
mesh('Recessed soil',[(4.43,-.70,1.253)]+[(4.43+.12*math.cos(i*math.tau/48),-.70+.12*math.sin(i*math.tau/48),1.253) for i in range(48)],[(0,i+1,(i+1)%48+1) for i in range(48)],soil)
for i in range(14):
    a=i*2.399;direction=Vector((math.cos(a),math.sin(a),0));side=Vector((-math.sin(a),math.cos(a),0))
    height=.13+(i%5)*.065
    start=center+direction*.045+Vector((0,0,height))
    length=.23+(i%3)*.025;width=.064+(i%3)*.008
    tube('Curved petiole',[center,center+direction*.02+Vector((0,0,height*.55)),start],.0035,leaves[0])
    verts=[];mid=[]
    for j in range(13):
        t=j/12;spine=start+direction*(length*t)+Vector((0,0,.09*math.sin(t*math.pi)-.055*t))
        mid.append(spine);w=width*math.sin(math.pi*t)**.8
        verts.extend([spine-side*w-Vector((0,0,w*.28)),spine+Vector((0,0,.008*math.sin(math.pi*t))),spine+side*w-Vector((0,0,w*.28))])
    faces=[(j*3+k,j*3+k+1,(j+1)*3+k+1,(j+1)*3+k) for j in range(12) for k in range(2)]
    o=mesh('Curved lanceolate leaf',verts,faces,leaves[i%3])
    for p in o.data.polygons:p.use_smooth=True
    m=o.modifiers.new('Leaf tissue','SOLIDIFY');m.thickness=.0007
    tube('Central leaf vein',[p+Vector((0,0,.009)) for p in mid],.0009,vein)
    for j in (3,5,7,9):
        w=width*math.sin(math.pi*j/12)**.8
        for sign in (-1,1):
            a=mid[j]+Vector((0,0,.009));b=mid[j]+direction*.025+side*w*.82*sign-Vector((0,0,w*.18))
            tube('Fine lateral vein',[a,a+(b-a)*.60],.0004,vein)

# Espresso-specific details: grille, controls, steam wand, removable filter handle.
for i in range(7):box('Machine top cooling slot',(3.77+i*.025,-1.44,1.588),(.009,.15,.003),black)
box('Brew handle grip',(3.85,-1.30,1.421),(.022,.13,.022),black)
tube('Steam wand',[(3.96,-1.36,1.47),(3.97,-1.30,1.39),(3.98,-1.28,1.20)],.006,metal)
box('Steam wand insulated collar',(3.976,-1.285,1.25),(.018,.02,.055),black)
for x in (3.73,3.97):
    for z in (1.49,1.55):box('Fascia captive fastener',(x,-1.251,z),(.009,.004,.009),gold)
box('Machine base brushed band',(3.85,-1.251,1.115),(.27,.009,.012),metal)
box('Coffee service badge',(3.85,-1.252,1.493),(.07,.004,.009),gold)

# Dedicated wall finish keeps the original shared materials untouched.
wall=dark.copy();wall.name='GALLEY POLISH / Graphite ceramic coated wall'
nodes=wall.node_tree.nodes;links=wall.node_tree.links
p=next(n for n in nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Metallic'].default_value=.32
noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=95;noise.inputs['Detail'].default_value=2
tex=nodes.new('ShaderNodeTexCoord');links.new(tex.outputs['Object'],noise.inputs['Vector'])
ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.37,.37,.37,1);ramp.color_ramp.elements[1].color=(.53,.53,.53,1)
links.new(noise.outputs['Fac'],ramp.inputs['Fac']);links.new(ramp.outputs['Color'],p.inputs['Roughness'])
changed=[]
for o in scene.objects:
    if o.name.startswith('GALLEY WALL / ') and o.type=='MESH' and any(k in o.name for k in ('wall panel','wall frame','profile','technical rib')):
        o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(wall);changed.append(o.name)
for x in (3.47,4.73):
    for z in (1.24,2.85):box('Wall recessed fastener',(x,-1.534,z),(.012,.006,.012),metal)
for name in ('GALLEY / Counter practical','GALLEY WALL / Lower shelf practical'):
    o=bpy.data.objects[name];o.data=o.data.copy();o.data.color=(1,.56,.24)
bpy.context.view_layer.update()
assert all(tuple(v for row in scene.objects[n].matrix_world for v in row)==v for n,v in transforms.items())
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
(OUT/'galley-polish-validation.json').write_text(json.dumps({'sourceUnchanged':True,'sourceSha256':digest,'originalTransformsPreserved':len(transforms),'wallMeshesRefined':changed,'runtimeExported':False},indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bridge-galley-botanical-finish.blend'),compress=True)
print('GALLEY_POLISH_READY')
