"""Continue the approved ceiling toward the bow in an independent Blender copy."""
import bpy
import hashlib
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/bridge-ceiling-study'
source = Path(bpy.data.filepath)
assert source.name == 'bridge-junctions-polished.blend'
digest = hashlib.sha256(source.read_bytes()).hexdigest()
scene = bpy.context.scene
protected = {o.name: (tuple(v for row in o.matrix_world for v in row),o.data.as_pointer() if o.data else None) for o in scene.objects}
col = bpy.data.collections.new('CEILING BOW / Fitted opaque cassettes and ribs')
scene.collection.children.link(col)
mat = {key:bpy.data.materials['CEILING POLISH / '+name] for key,name in {
 'shell':'Satin charcoal titanium','panel':'Warm grey recessed alloy',
 'edge':'Brushed edge alloy','seal':'Matte recessed gasket',
 'warm':'Warm encased diffuser','cyan':'Small cyan status guide',
}.items()}
created = []
def mesh(name,vertices,faces,material,bevel=.006):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices,[],faces)
    data.update()
    o = bpy.data.objects.new('CEILING BOW / '+name,data)
    col.objects.link(o)
    data.materials.append(mat[material])
    if bevel:
        m=o.modifiers.new('Folded edge radius','BEVEL');m.width=bevel;m.segments=2
        o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    created.append(o)
    return o
def beam(name,a,b,width,height,material,bevel=.004):
    a,b=Vector(a),Vector(b)
    direction=(b-a).normalized()
    side=direction.cross(Vector((0,0,1))).normalized()
    up=side.cross(direction).normalized()
    verts=[tuple(p+side*s*width/2+up*t*height/2) for p in (a,b) for s,t in ((-1,-1),(1,-1),(1,1),(-1,1))]
    return mesh(name,verts,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],material,bevel)
def roof(y):
    return 3.30-(y-2.75)*.25/3.4 if y<=6.15 else 3.05-(y-6.15)*.30/2.4
def width(y):
    return 4.8-(y-2.75)*.5/3.4 if y<=6.15 else 4.3-(y-6.15)
def plate(name,a,b,left,right,material,offset,thickness):
    # left/right are fractions of the available roof width, keeping the taper.
    points=[(left*width(a),a,roof(a)+offset),(right*width(a),a,roof(a)+offset),
            (right*width(b),b,roof(b)+offset),(left*width(b),b,roof(b)+offset)]
    vertices=points+[(x,y,z+thickness) for x,y,z in points]
    return mesh(name,vertices,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],material)

for row,(a,b) in enumerate(((2.77,4.40),(4.50,6.10),(6.20,7.30),(7.40,8.50))):
    for side in (-1,1):
        # Backing closes the canopy; inset panels leave deliberate shadow joints.
        lo,hi=sorted((side*.04,side*.98))
        plate(f'Roof backing {row} {side}',a,b,lo,hi,'shell',-.058,.035)
        for index,(start,end) in enumerate(((.07,.48),(.52,.94))):
            lo,hi=sorted((side*start,side*end))
            plate(f'Recessed ceiling cartridge {row} {side} {index}',a+.07,b-.07,lo,hi,'panel',-.085,.020)
        x=side*width((a+b)/2)*.50
        beam(f'Longitudinal stiffener {row} {side}',(side*width(a)*.50,a,roof(a)-.095),(side*width(b)*.50,b,roof(b)-.095),.075,.075,'shell')
        # Fixture housings and lenses follow the same roof slope.
        for key,half,h,offset in [('seal',.15,.038,-.112),('warm',.085,.012,-.14)]:
            beam(f'Inset fixture {row} {side} {key}',(x,a+.20,roof(a+.20)+offset),(x,b-.20,roof(b-.20)+offset),half,h,key)
    # Small structural collars tie the new bays to the existing central spine.
    beam(f'Spine collar {row}',(-.23,a,roof(a)-.10),(.23,a,roof(a)-.10),.09,.07,'edge')

# Deep folded ribs use the pre-existing roof-frame stations, not window openings.
for row,y in enumerate((4.45,6.15,7.35)):
    span=width(y)*.965
    z=roof(y)-.14
    beam(f'Transverse rib {row}',(-span,y,z),(span,y,z),.14,.10,'shell',.009)
    for side in (-1,1):
        beam(f'Rib machined flange {row} {side}',(-span,y+side*.085,z-.025),(span,y+side*.085,z-.025),.022,.025,'edge')
        x=side*span*.72
        beam(f'Recessed cyan socket {row} {side}',(x-.24,y,z-.055),(x+.24,y,z-.055),.065,.025,'seal')
        beam(f'Cyan rib marker {row} {side}',(x-.19,y,z-.072),(x+.19,y,z-.072),.028,.009,'cyan',.002)

bpy.context.view_layer.update()
for name,(matrix,data) in protected.items():
    obj=scene.objects[name]
    assert tuple(v for row in obj.matrix_world for v in row)==matrix,name
    assert (obj.data.as_pointer() if obj.data else None)==data,name
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
camera=bpy.data.objects.new('CEILING BOW REVIEW / Whole ceiling',bpy.data.cameras.new('CEILING BOW REVIEW'))
scene.collection.objects.link(camera)
camera.location=(1.4,-.6,1.65)
camera.rotation_euler=(Vector((0,4.6,2.65))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.lens=17
scene.camera=camera
scene.name='CRUZ DEL SUR / Continuous bow ceiling'
destination=OUT/'bridge-ceiling-complete.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(destination))
(OUT/'ceiling-complete-validation.json').write_text(json.dumps({
 'source':source.name,'sourceSha256':digest,'sourceUnchanged':True,
 'originalObjectsRetained':len(protected),'addedMeshes':len(created),
 'scope':'Opaque ceiling extends over former skylights; front and side windows unchanged',
 'newLights':0,'newMaterials':0,'runtimeExported':False,
},indent=2))
print('CEILING_COMPLETE',destination,len(created))
