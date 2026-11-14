"""Whole-vessel silhouette study in the protected working copy. No export."""
from pathlib import Path
import bpy,bmesh,hashlib,json
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];folder=ROOT/'docs/assets/bridge'
output=folder/'crash-investigation/bridge-antennas-validated.blend'
assert Path(bpy.data.filepath).resolve()==output.resolve()
assert not bpy.data.collections.get('SHIP / Primary forms')
protected=folder/'bridge-interior-final.blend';before=hashlib.sha256(protected.read_bytes()).hexdigest()
scene=bpy.context.scene
original={o:(o.matrix_world.copy(),dict(o.items())) for o in scene.objects}
# Retain all previous work, but remove it from silhouette evaluation.
for name in ('EXTERIOR / Upper hull','BRIDGE / EDITABLE'):
    c=bpy.data.collections[name];c.hide_viewport=True;c.hide_render=True
collection=bpy.data.collections.new('SHIP / Primary forms');scene.collection.children.link(collection)
collection['purpose']='Proportion blockout only; interior retained hidden as scale reference. Not collision-ready.'
def material(name,color):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.65
    return m
armor=material('BLOCKOUT / Graphite',(.15,.18,.21))
topmat=material('BLOCKOUT / Upper armor',(.29,.32,.34))
dark=material('BLOCKOUT / Window band',(.025,.065,.082))
def make(name,verts,faces,mat):
    assert all(len(f)>=3 and all(0<=i<len(verts) for i in f) for f in faces)
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);assert not data.validate()
    bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
    obj=bpy.data.objects.new(name,data);collection.objects.link(obj);data.materials.append(mat)
    return obj
def loft(name,stations,mat):
    # Eight corners per transverse section: broad flat keel, chamfered shoulders.
    verts=[]
    for y,w,b,t in stations:
        verts.extend([(x,y,z) for x,z in [(-w*.72,b),(w*.72,b),(w,b+.65),(w,t-.45),(w*.84,t),(-w*.84,t),(-w,t-.45),(-w,b+.65)]])
    faces=[tuple(reversed(range(8))),tuple(range(len(verts)-8,len(verts)))]
    for j in range(len(stations)-1):
        for i in range(8):faces.append((j*8+i,j*8+(i+1)%8,(j+1)*8+(i+1)%8,(j+1)*8+i))
    return make(name,verts,faces,mat)
# Positive Y is bow. Blunt wide prow and a continuous belly replace the thin ramp.
loft('01 Continuous faceted hull',[(-18,5.6,-3.2,.2),(-16,6.8,-3.8,.4),(-7,7.2,-4.0,.35),(-1,7.1,-4.0,-.10),(8.7,6.7,-3.7,-.10),(16,6.3,-2.9,.2),(19,4.7,-1.8,.35),(20,4.1,-1.15,.25)],armor)
# Broad upper foredeck merges into the prow, not a detached pointed platform.
loft('02 Broad bow upper deck',[(8.7,5.8,-.11,.65),(12,6.0,-.25,.85),(16,5.65,-.35,.65),(19,4.2,-.65,.45),(19.65,3.85,-.75,.30)],topmat)
loft('03 Aft upper body',[(-17.4,5.25,.18,1.25),(-14,6.0,.2,1.65),(-6,5.9,.15,1.85),(-2.15,5.2,-.1,1.55)],topmat)
# Elevated exploration bridge: proportions surround the current room footprint.
loft('04 Bridge lower shoulder',[(-2.15,5.15,-.1,1.0),(2.75,5.15,-.1,1.0),(6.15,4.65,-.1,1.0),(8.7,2.3,-.1,1.0)],armor)
loft('05 Panoramic bridge band',[(-2.15,4.95,1.02,3.05),(2.75,4.95,1.02,3.05),(6.15,4.45,1.02,2.85),(8.7,2.1,1.02,2.60)],dark)
loft('06 Faceted bridge roof',[(-2.3,5.15,3.07,3.85),(2.75,5.15,3.07,3.85),(6.15,4.65,2.87,3.6),(8.85,2.3,2.62,3.35)],topmat)
for side in (-1,1):
    pod=loft('07 Integrated engine mass',[(-19,1.25,-2.25,.5),(-16,1.5,-2.6,.8),(-11,1.55,-2.4,.9)],armor)
    pod.location.x=side*4.5
    end=loft('08 Engine outlet placeholder',[(-19.05,.95,-1.95,.18),(-19.13,.95,-1.95,.18)],dark)
    end.location.x=side*4.5
bpy.context.view_layer.update()
for obj,(matrix,meta) in original.items():assert obj.matrix_world==matrix and dict(obj.items())==meta
triangles=0
for o in collection.objects:
    o.data.calc_loop_triangles();triangles+=len(o.data.loop_triangles)
    bm=bmesh.new();bm.from_mesh(o.data);assert all(e.is_manifold for e in bm.edges);bm.free()
assert triangles<1500
assert hashlib.sha256(protected.read_bytes()).hexdigest()==before
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        eye=Vector((40,29,20));target=Vector((0,0,0));r=area.spaces.active.region_3d
        r.view_rotation=(target-eye).to_track_quat('-Z','Y');r.view_distance=48;r.view_location=target;r.view_perspective='ORTHO'
        area.spaces.active.shading.type='SOLID';area.spaces.active.shading.color_type='MATERIAL'
old=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=1
    bpy.ops.wm.save_as_mainfile(filepath=str(output),compress=True)
finally:bpy.context.preferences.filepaths.save_version=old
print('Primary forms:',len(collection.objects),'objects;',triangles,'triangles. Length 39.13m, beam 14.4m, height 7.85m. Original untouched; detail/interior hidden, not deleted. Blockout has no gameplay clearance guarantee.')
