"""Source-only roof service spine, radome and aft antenna cluster."""
from pathlib import Path
from math import sin,cos,pi
import bpy,bmesh,json
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];folder=ROOT/'docs/assets/bridge';scene=bpy.context.scene
assert scene.name=='Bridge - Finished Interior'
assert not bpy.data.collections.get('EXTERIOR / Roof and antennas')
output=folder/'crash-investigation/bridge-antennas-validated.blend'
assert Path(bpy.data.filepath).resolve()==output.resolve(), 'Open the isolated working copy first'
original={o:(o.matrix_world.copy(),dict(o.items())) for o in scene.objects}
collection=bpy.data.collections.new('EXTERIOR / Roof and antennas')
bpy.data.collections['EXTERIOR / Upper hull'].children.link(collection);collection['source_only']=True
materials={m.name.removeprefix('BRIDGE V15 '):m for m in bpy.data.materials if m.name.startswith('BRIDGE V15 ')}
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))
_unchecked_mesh=mesh
def mesh(name,vertices,faces,mat,bevel=.008):
    assert all(len(f)>=3 and all(isinstance(i,int) and 0<=i<len(vertices) for i in f) for f in faces), name
    return _unchecked_mesh(name,vertices,faces,mat,bevel)
# Service island over the opaque aft roof. Lowest point stays above existing roof.
outline=[(-1.1,1.6),(1.1,1.6),(1.25,1.35),(1.25,-.7),(.95,-1.05),(-.95,-1.05),(-1.25,-.7),(-1.25,1.35)]
prism('Roof sensor island',outline,3.425,3.61,'Graphite')
prism('Roof sensor island armor',[(x*.94,z*.94) for x,z in outline],3.615,3.65,'Metal')
for side in (-1,1):
    for i in range(4):
        z=1.1-i*.5
        box('Roof access cassette',(side*.93,3.675,z),(.34,.04,.38),'Graphite')
        box('Roof cassette latch',(side*.93,3.702,z),(.13,.012,.03),'Gasket',.002)
    beam('Roof protected cable run',(side*.54,3.69,-.5),(side*.54,3.69,1.2),.035,'Gasket')
    for z in (-.3,.2,.7,1.1):
        box('Roof cable clamp',(side*.54,3.715,z),(.09,.025,.035),'Metal',.002)
    # Slim stepped masts, aft of panoramic glazing, with short sensor crossbars.
    x=side*.65;z=.95;tip=4.95 if side<0 else 5.22
    box('Antenna mounting foot',(x,3.70,z),(.24,.10,.25),'Graphite')
    beam('Antenna lower mast',(x,3.75,z),(x,4.3,z),.075,'Metal')
    beam('Antenna upper mast',(x,4.3,z),(x,tip,z),.025,'Graphite')
    for y in (4.12,4.38):
        beam('Antenna crossbar',(x-.16,y,z),(x+.16,y,z),.025,'Metal')
    box('Antenna amber cap',(x,tip+.016,z),(.035,.032,.035),'Amber',.003)
    beam('Antenna mounting brace',(x+side*.13,3.75,z+.09),(x,4.04,z),.025,'Graphite')
# Low hemispherical radar cover, 16 sides / 6 rings. Single welded pole.
cx=0;cz=-.43;base_y=3.70;r=.32;n=16;rings=6
vertices=[]
for j in range(rings):
    a=(pi/2)*j/rings
    for k in range(n):
        t=2*pi*k/n;vertices.append((cx+r*cos(a)*cos(t),base_y+r*sin(a),cz+r*cos(a)*sin(t)))
vertices.append((cx,base_y+r,cz));pole=len(vertices)-1
dome_faces=[tuple(reversed(range(n)))]
for j in range(rings-1):
    for k in range(n):dome_faces.append((j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k))
for k in range(n):dome_faces.append(((rings-1)*n+k,(rings-1)*n+(k+1)%n,pole))
dome=mesh('Roof radar dome',vertices,dome_faces,'Ivory',0)
for polygon in dome.data.polygons:polygon.use_smooth=len(polygon.vertices)<=4
box('Roof radome plinth',(0,3.675,cz),(.70,.05,.70),'Graphite',.02)
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();tris=0
for obj,(matrix,meta) in original.items():assert obj.matrix_world==matrix and dict(obj.items())==meta
for o in collection.objects:
    e=o.evaluated_get(deps);data=e.to_mesh();data.calc_loop_triangles();tris+=len(data.loop_triangles)
    assert all((o.matrix_world@v.co).z>=3.424 for v in data.vertices)
    e.to_mesh_clear()
assert tris<7000
for v in json.loads((folder/'exterior-window-validation.json').read_text())['serviceViews']:
    eye=Vector(v['eye']);target=Vector(v['target']);hit=scene.ray_cast(deps,eye,(target-eye).normalized(),distance=5)
    assert hit[0] and hit[4].name.startswith('Exterior service')
assert sum(o.type=='LIGHT' for o in scene.objects)==4
old=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(output),compress=True)
finally:bpy.context.preferences.filepaths.save_version=old
print('Roof detail:',len(collection.objects),'pieces,',tris,'triangles. Roof clearance, original transforms and six window views passed; no export.')
