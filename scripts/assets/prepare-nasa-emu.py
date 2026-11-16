"""Prepare NASA/Michael D. Carbajal's EMU as a bounded static display prop.

Run in a separate factory-startup Blender, never the user's editable scene.
Source and credit: docs/assets/nasa-emu/README.md.
"""
from pathlib import Path
import bpy, bmesh, json, math
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / 'docs/assets/nasa-emu'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(EVIDENCE / 'original.glb'))
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in meshes:
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
points = [o.matrix_world @ Vector(v) for o in meshes for v in o.bound_box]
lo=Vector(tuple(min(v[i] for v in points) for i in range(3)))
hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
print('SOURCE_BOUNDS', list(lo), list(hi))
print('SOURCE_MATERIAL_COUNT',len(meshes[0].data.materials))
for o in meshes:
    for m in o.data.materials:
        if m.use_nodes:
            p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
            p.inputs['Transmission Weight'].default_value=0
            p.inputs['IOR'].default_value=1.45
if '--metrics' in __import__('sys').argv:
    o=meshes[0]
    for i,m in enumerate(o.data.materials):
        vs={v for p in o.data.polygons if p.material_index==i for v in p.vertices}
        ps=[o.matrix_world@o.data.vertices[v].co for v in vs]
        print('MAT_BOUNDS',i,m.name,len(vs),[round(min(v[k] for v in ps),3) for k in range(3)],[round(max(v[k] for v in ps),3) for k in range(3)])
    raise SystemExit

if '--upper-preview' in __import__('sys').argv:
    o=meshes[0]
    keep={0,1,2,7,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24}
    bm=bmesh.new();bm.from_mesh(o.data)
    bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.material_index not in keep or all((o.matrix_world@v.co).z<1.05 for v in f.verts) or all((o.matrix_world@v.co).y<-.25 for v in f.verts)],context='FACES')
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
    bm.to_mesh(o.data);bm.free()
    points=[o.matrix_world@v.co for v in o.data.vertices]
    lo=Vector(tuple(min(v[i] for v in points) for i in range(3)))
    hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))

def setup_preview(center, radius):
    scene=bpy.context.scene
    scene.render.engine='BLENDER_EEVEE'
    scene.eevee.taa_render_samples=16
    scene.render.resolution_x=500
    scene.render.resolution_y=650
    scene.render.resolution_percentage=100
    scene.world.color=(.13,.13,.13)
    scene.view_settings.view_transform='AgX'
    for loc,power,size in [((-2,-4,5),650,4),((3,-1,2),450,3),((0,3,4),700,3)]:
        bpy.ops.object.light_add(type='AREA',location=Vector(loc)*radius+center)
        light=bpy.context.object
        light.data.energy=power*radius*radius
        light.data.shape='DISK';light.data.size=size*radius
        light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=center+Vector((0,-4,1))*radius)
    camera=bpy.context.object
    camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO';camera.data.ortho_scale=2.6*radius
    scene.camera=camera
    return scene,camera

if '--inspect' in __import__('sys').argv or '--upper-preview' in __import__('sys').argv:
    center=(lo+hi)/2
    scene,camera=setup_preview(center,max(hi-lo)/2)
    if '--upper-preview' in __import__('sys').argv:
        camera.location=center+Vector((0,4,1))*max(hi-lo)/2
        camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(EVIDENCE/'source-preview.png')
    bpy.ops.render.render(write_still=True)
    raise SystemExit

# A displayed jacket is the upper garment, not the leg assembly or PLSS rack.
o=meshes[0]
bpy.context.view_layer.objects.active=o
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
bm=bmesh.new();bm.from_mesh(o.data)
keep={0,1,2,7,9,10,11,12,13,14,15,16,17,18,19,20,21,22}
bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.material_index not in keep],context='FACES')
for plane_co,plane_no in [((0,0,1.04),(0,0,1)),((0,-.40,0),(0,1,0))]:
    cut=bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.00001,plane_co=plane_co,plane_no=plane_no,clear_inner=True)
    boundary=[e for e in cut['geom_cut'] if isinstance(e,bmesh.types.BMEdge) and e.is_boundary]
    if boundary:bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
# The imported render mesh splits vertices at normal/material seams. Weld those
# seams before reducing triangles; otherwise individual sleeve strips collapse.
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0002)
# Remove detached display-rail fragments, preserving the sleeve, hand and torso.
seen=set()
detached=[]
for vertex in list(bm.verts):
    if vertex in seen:continue
    stack=[vertex];component=[]
    while stack:
        v=stack.pop()
        if v in seen:continue
        seen.add(v);component.append(v)
        stack.extend(e.other_vert(v) for e in v.link_edges)
    faces={f for v in component for f in v.link_faces}
    center=sum((v.co for v in component),Vector())/len(component)
    if len(faces)<250 and abs(center.x)>.30 and (center.y>.08 or center.z>1.65):
        detached.extend(component)
if detached:bmesh.ops.delete(bm,geom=detached,context='VERTS')
print('CROPPED_JACKET', len(bm.verts), len(bm.faces), 'removedDetached',len(detached),flush=True)
# Relax the side arms toward the torso, keeping the source folds and proportions.
from mathutils import Matrix
for v in bm.verts:
    weight=max(0,min(1,(abs(v.co.x)-.25)/.14))
    if weight:
        pivot=Vector((math.copysign(.27,v.co.x),-.08,1.53))
        v.co=pivot+Matrix.Rotation(math.copysign(.3,v.co.x)*weight,3,'Y')@(v.co-pivot)
bm.to_mesh(o.data);bm.free()

material_map={0:0,1:1,2:0,7:1,9:4,10:0,11:0,12:0,13:3,14:0,15:5,16:3,17:3,18:3,19:1,20:0,21:0,22:4}
indices=[material_map.get(p.material_index,0) for p in o.data.polygons]
o.data.materials.clear()
for name,color,metal,rough in [
 ('EVA woven pressure fabric',(.68,.70,.69,1),.02,.78),
 ('EVA reinforced gray seams',(.24,.28,.29,1),.2,.6),
 ('EVA rubber',(.022,.031,.036,1),.05,.8),
 ('EVA closed gold visor',(.34,.22,.07,1),.72,.22),
 ('EVA ochre safety bands',(.42,.18,.045,1),.16,.55),
 ('EVA metal fittings',(.27,.32,.34,1),.72,.35),
]:
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=color
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    o.data.materials.append(m)
for p,i in zip(o.data.polygons,indices):p.material_index=i
before=sum(len(p.vertices)-2 for p in o.data.polygons)
modifier=o.modifiers.new('Static display simplification','DECIMATE')
modifier.ratio=min(1,42000/max(1,before))
print('SIMPLIFY', before, modifier.ratio,flush=True)
bpy.ops.object.modifier_apply(modifier=modifier.name)
for polygon in o.data.polygons:polygon.use_smooth=True
# Source faces +Y in Blender. Canonical glTF faces +Z (Blender -Y).
o.data.transform(Matrix.Rotation(math.pi,4,'Z'))
points=[v.co for v in o.data.vertices]
lo=Vector(tuple(min(v[i] for v in points) for i in range(3)))
hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
size=hi-lo
scale=min(1.43/size.z,.88/size.x,.75/size.y)
center=(lo+hi)/2
for v in o.data.vertices:v.co=Vector(((v.co.x-center.x)*scale,(v.co.y-center.y)*scale,(v.co.z-lo.z)*scale))
# The NASA display rack has two high, disconnected planar tips outside the
# shoulder/helmet silhouette. Remove only that region after normalization.
bm=bmesh.new();bm.from_mesh(o.data)
bmesh.ops.delete(bm,geom=[f for f in bm.faces if all(v.co.z>.64 and abs(v.co.x)>.26 for v in f.verts)],context='FACES')
bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
bm.to_mesh(o.data);bm.free()
o.data.update();o.name='EVA jacket and closed helmet'
bpy.ops.object.select_all(action='DESELECT');o.select_set(True)
target=ROOT/'public/models/cruz-del-sur-eva-suit.glb'
bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',use_selection=True,export_yup=True,export_animations=False,export_lights=False,export_cameras=False)
points=[v.co for v in o.data.vertices]
lo=Vector(tuple(min(v[i] for v in points) for i in range(3)))
hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
size=hi-lo
report={'source':'NASA/Michael D. Carbajal','sourceTriangles':343455,'originalBytes':(EVIDENCE/'original.glb').stat().st_size,'triangles':sum(len(p.vertices)-2 for p in o.data.polygons),'materials':len({p.material_index for p in o.data.polygons}),'bytes':target.stat().st_size,'gltfDimensions':[size.x,size.z,size.y],'gltfBoundsMin':[lo.x,lo.z,-hi.y],'gltfBoundsMax':[hi.x,hi.z,-lo.y],'uniformScale':scale,'adaptation':'Upper garment, detached display rack and leg assembly removed, arms relaxed, opaque neutral fabrics and closed gold visor, neutral patches; not an unchanged engineering model.'}
(EVIDENCE/'audit.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print('PREPARED_EMU',json.dumps(report),flush=True)
if '--no-render' in __import__('sys').argv:raise SystemExit
scene,camera=setup_preview(Vector((0,0,size.z/2)),size.z/2)
scene.render.filepath=str(EVIDENCE/'prepared-preview.png')
bpy.ops.render.render(write_still=True)
