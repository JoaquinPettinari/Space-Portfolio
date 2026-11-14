"""One cohesive source-only industrial pass; preserve playable geometry."""
from pathlib import Path
from math import sin, cos, pi
import json, bpy, bmesh
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parents[2]
folder=ROOT/'docs/assets/bridge'
scene=bpy.context.scene
assert scene.name=='Bridge - Finished Interior'
assert not any(c.name=='BRIDGE / Industrial finish' for c in scene.collection.children)
bpy.data.libraries.write(str(folder/'bridge-interior-backup.blend'),{scene},fake_user=True,compress=True)
original={o:(o.matrix_world.copy(),dict(o.items())) for o in scene.objects}
collection=bpy.data.collections.new('BRIDGE / Industrial finish')
scene.collection.children.link(collection)
materials={m.name.removeprefix('BRIDGE V15 '):m for m in bpy.data.materials if m.name.startswith('BRIDGE V15 ')}
paint=materials['Ivory'].copy();paint.name='BRIDGE Safety paint'
for node in list(paint.node_tree.nodes):
    if node.type not in {'BSDF_PRINCIPLED','OUTPUT_MATERIAL'}:paint.node_tree.nodes.remove(node)
p=next(n for n in paint.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs['Base Color'].default_value=(.48,.25,.045,1)
p.inputs['Metallic'].default_value=.15;p.inputs['Roughness'].default_value=.66
paint.diffuse_color=(.48,.25,.045,1);materials['Safety']=paint
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))
layout=json.loads((folder/'layout.json').read_text())

def label(text,at,size,pose,owner=None):
    curve=bpy.data.curves.new('Industrial stencil','FONT');curve.body=text
    curve.align_x='CENTER';curve.size=size;curve.extrude=0;curve.resolution_u=2
    obj=bpy.data.objects.new('Stencil '+text,curve);collection.objects.link(obj)
    x,y,z=at;a=pose['yaw']
    obj.location=xyz((pose['x']+x*cos(a)+z*sin(a),y,pose['z']-x*sin(a)+z*cos(a)))
    obj.rotation_euler=(pi/2,0,-a)
    curve.materials.append(materials['Ivory'])
    for other in bpy.context.selected_objects:other.select_set(False)
    obj.select_set(True);bpy.context.view_layer.objects.active=obj
    bpy.ops.object.convert(target='MESH');obj.select_set(False)
    if owner:obj['interaction']=owner

def stripes(name,x,y,z,width,pose,owner=None):
    # Small raised paint inlays, separated from panel faces by 2mm.
    for i in range(5):
        left=x-width/2+i*width/5
        verts=[]
        for px,py in [(left,y-.025),(left+.035,y-.025),(left+.065,y+.025),(left+.03,y+.025)]:
            a=pose['yaw'];verts.append((pose['x']+px*cos(a)+z*sin(a),py,pose['z']-px*sin(a)+z*cos(a)))
        obj=mesh(name,verts,[(0,1,2,3)],'Safety',0)
        # Explicit front winding for outward-facing stencil (+local Z).
        if owner:obj['interaction']=owner

# Cabinet faces gain inset handles, hinges and understated warning stencils.
# Work only on occupied cabinet spans: no geometry across the knee openings.
for i,seg in enumerate(layout['consoles']):
    pose=dict(seg);pose['z']-=3.15
    owner={0:'arcade',2:'computer',4:'communications',6:'personal'}.get(i)
    start=set(collection.objects)
    for support in seg['supports']:
        local=[(x-seg['x'])*cos(seg['yaw'])-(z-seg['z'])*sin(seg['yaw']) for x,z in support]
        width=min(max(local)-min(local)-.12,.68)
        if width<.30:continue
        mid=(min(local)+max(local))/2
        box('Cabinet handle socket',(mid,.74,.559),(.27,.065,.012),'Graphite',.006,pose)
        box('Cabinet bridge handle',(mid,.74,.575),(.18,.024,.021),'Metal',.005,pose)
        for y in (.24,.66):
            box('Cabinet hinge block',(mid-width/2+.025,y,.552),(.035,.06,.022),'Graphite',.005,pose)
            box('Cabinet hinge pin',(mid-width/2+.025,y,.568),(.008,.046,.009),'Metal',.002,pose)
        label('SERVICE', (mid,.59,.553),.029,pose,owner)
        stripes('Cabinet caution inlay',mid,.20,.554,.30,pose,owner)
    # Layered front lip follows the existing top. No new controls or screen slabs.
    box('Counter protective nosing',(0,1.015,.544),(seg['length']-.16,.025,.024),'Metal',.005,pose)
    for obj in set(collection.objects)-start:
        if owner:obj['interaction']=owner

# Tactical pedestal: service IDs and restrained warnings; keep top aperture free.
for side in (-1,1):
    pose={'x':0,'z':-2.65,'yaw':0 if side==1 else pi}
    label('TACTICAL SYSTEMS',(-.38,.55,1.008),.025,pose,'tactical')
    label('CDS-01',(.38,.55,1.008),.025,pose,'tactical')
    stripes('Tactical caution inlay',.38,.40,1.008,.30,pose,'tactical')
    for x in (-.38,.38):
        obj=box('Tactical service latch',(x,.63,1.015),(.085,.042,.018),'Gasket',.006,pose);obj['interaction']='tactical'
        obj=box('Tactical latch tongue',(x,.63,1.029),(.052,.014,.012),'Metal',.003,pose);obj['interaction']='tactical'

# Manufactured collar joints on the opaque roof beams, clear of lights/windows.
for z in (1.0,2.0,3.0,4.0):
    for x in (-3.6,3.6):
        box('Roof junction shoe',(x,3.19,z-3.15),(.22,.045,.16),'Graphite',.006)
        for dx in (-.065,.065):
            box('Roof captive bolt',(x+dx,3.162,z-3.15),(.025,.012,.025),'Metal',.003)

new=list(collection.objects)
for obj in new:
    if not obj.data.uv_layers:
        uv=obj.data.uv_layers.new(name='Surface metres')
        for poly in obj.data.polygons:
            axis=max(range(3),key=lambda k:abs(poly.normal[k]));axes=[k for k in range(3) if k!=axis]
            for li in poly.loop_indices:
                pt=obj.data.vertices[obj.data.loops[li].vertex_index].co
                uv.data[li].uv=(pt[axes[0]],pt[axes[1]])
bpy.context.view_layer.update()
for obj,(transform,metadata) in original.items():
    assert obj.matrix_world==transform and dict(obj.items())==metadata
# New fittings must not occlude the four actual monitor rectangles or table.
deps=bpy.context.evaluated_depsgraph_get();verts=[];polys=[]
for obj in new:
    evaluated=obj.evaluated_get(deps);data=evaluated.to_mesh();offset=len(verts)
    verts.extend(obj.matrix_world@v.co for v in data.vertices)
    polys.extend([offset+k for k in p.vertices] for p in data.polygons)
    evaluated.to_mesh_clear()
tree=BVHTree.FromPolygons(verts,polys)
screens=[(m['position'][0],m['position'][1],m['position'][2]-3.15,m['rotation'],1.6,.9) for m in layout['monitors'].values()]
screens += [(4.205,1.68,-1.05,-pi/2,1.1,.8),(-4.205,1.68,-2.75,pi/2,1.1,.8)]
checks=0
for x,y,z,a,w,h in screens:
    normal=Vector((sin(a),0,cos(a)))
    for dx in (-w*.48,0,w*.48):
        for dy in (-h*.48,0,h*.48):
            target=Vector((x+dx*cos(a),y+dy,z-dx*sin(a)))
            assert tree.ray_cast(xyz(target+normal),xyz(-normal),.99)[0] is None
            checks+=1
for x in (-.85,0,.85):
    for z in (-3.8,-2.65,-1.5):
        assert tree.ray_cast(xyz((x,2,z)),xyz((0,-1,0)),.94)[0] is None
        checks+=1
assert sum(o.type=='LIGHT' for o in scene.objects)==4
previous=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/'bridge-interior-final.blend'),compress=True)
finally:bpy.context.preferences.filepaths.save_version=previous
print('Industrial pass:',len(new),'new parts;',checks,'display clearance rays passed; existing transforms/metadata preserved; no runtime export.')
