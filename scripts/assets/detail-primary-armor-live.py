"""Large fitted armor panels on the approved extended silhouette; copy only."""
from pathlib import Path
import bpy,bmesh,hashlib
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];folder=ROOT/'docs/assets/bridge'
output=folder/'crash-investigation/bridge-antennas-validated.blend'
assert Path(bpy.data.filepath).resolve()==output.resolve()
assert bpy.data.collections['SHIP / Primary forms'].get('extended_bow')
assert not bpy.data.collections.get('SHIP / Large armor panels')
protected=folder/'bridge-interior-final.blend';checksum=hashlib.sha256(protected.read_bytes()).hexdigest()
original={o:(o.matrix_world.copy(),dict(o.items())) for o in bpy.context.scene.objects}
c=bpy.data.collections.new('SHIP / Large armor panels');bpy.context.scene.collection.children.link(c)
c['source_only']=True
metal=bpy.data.materials['BLOCKOUT / Upper armor'];dark=bpy.data.materials['BLOCKOUT / Graphite']
def panel(name,points,normal,material):
    center=sum(points,Vector())/4
    inner=[center+(p-center)*.90 for p in points]
    verts=[tuple(p+normal*h) for h in (.025,.085) for p in inner]
    faces=((0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7))
    assert all(0<=i<len(verts) for f in faces for i in f)
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);assert not data.validate()
    bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));assert all(e.is_manifold for e in bm.edges);bm.to_mesh(data);bm.free()
    obj=bpy.data.objects.new(name,data);c.objects.link(obj);data.materials.append(material)
    bevel=obj.modifiers.new('Armor edge','BEVEL');bevel.width=.018;bevel.segments=1
# Use actual mesh stations, including the approved bow stretch. No guessed fit.
for name,edges in [('01 Continuous faceted hull',(2,6)),('02 Broad bow upper deck',(4,)),('03 Aft upper body',(4,))]:
    source=bpy.data.objects[name];v=[source.matrix_world@p.co for p in source.data.vertices]
    for section in range(len(v)//8-1):
        for edge in edges:
            j=(edge+1)%8
            a,b,d,e=v[section*8+edge],v[section*8+j],v[(section+1)*8+edge],v[(section+1)*8+j]
            length=abs(d.y-a.y);count=max(1,round(length/2.7))
            for k in range(count):
                t0=k/count;t1=(k+1)/count
                p=[a.lerp(d,t0),b.lerp(e,t0),b.lerp(e,t1),a.lerp(d,t1)]
                normal=(p[1]-p[0]).cross(p[3]-p[0]).normalized()
                if edge==4 and normal.z<0:normal=-normal
                if edge==2 and normal.x<0:normal=-normal
                if edge==6 and normal.x>0:normal=-normal
                if edge==4:
                    # Two broad armor lanes with a deliberate central service seam.
                    mid0=p[0].lerp(p[1],.5);mid1=p[3].lerp(p[2],.5)
                    panel('Upper deck armor',[p[0],mid0,mid1,p[3]],normal,dark)
                    panel('Upper deck armor',[mid0,p[1],p[2],mid1],normal,dark)
                else:panel('Lateral hull armor',p,normal,metal)
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();tris=0
for obj,(matrix,meta) in original.items():assert obj.matrix_world==matrix and dict(obj.items())==meta
for obj in c.objects:
    e=obj.evaluated_get(deps);m=e.to_mesh();m.calc_loop_triangles();tris+=len(m.loop_triangles);e.to_mesh_clear()
assert tris<12000
old=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=1
    bpy.ops.wm.save_as_mainfile(filepath=str(output),compress=True)
finally:bpy.context.preferences.filepaths.save_version=old
assert hashlib.sha256(protected.read_bytes()).hexdigest()==checksum
print('Large armor:',len(c.objects),'pieces,',tris,'triangles. Approved base untouched; fitted panels offset from source faces; original protected.')
