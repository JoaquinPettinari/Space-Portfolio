"""Replace overlapping straight trim ends with shared miter vertices."""
from pathlib import Path
from math import sin,cos
import bpy,bmesh,json
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];folder=ROOT/'docs/assets/bridge'
scene=bpy.context.scene
assert scene.name=='Bridge - Finished Interior'
assert not any(o.name.startswith('Mitered window sill') for o in scene.objects)
bpy.data.libraries.write(str(folder/'bridge-interior-backup.blend'),{scene},fake_user=True,compress=True)
collection=bpy.data.collections.new('Trim joint repairs');scene.collection.children.link(collection)
materials={m.name.removeprefix('BRIDGE V15 '):m for m in bpy.data.materials if m.name.startswith('BRIDGE V15 ')}
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))
layout=json.loads((folder/'layout.json').read_text())
targets=[o for o in scene.objects if o.name.startswith(('Panoramic sill','Lateral window sill','Perimeter edge seam','Counter protective nosing'))]
assert len(targets)==21
original={o:(o.matrix_world.copy(),dict(o.items())) for o in scene.objects if o not in targets}

def offset(points,distance):
    normals=[]
    for a,b in zip(points,points[1:]):
        t=(b-a).normalized();normals.append(Vector((-t.y,t.x)))
    result=[]
    for i,p in enumerate(points):
        if i==0:n=normals[0];scale=distance
        elif i==len(points)-1:n=normals[-1];scale=distance
        else:
            n=(normals[i-1]+normals[i]).normalized();scale=distance/n.dot(normals[i])
        result.append(p+n*scale)
    return result

def trim(name,points,center,width,bottom,top,material,group,interactive=False):
    a=offset(points,center-width/2);b=offset(points,center+width/2)
    for i in range(len(points)-1):
        obj=prism(name+' '+str(i),[a[i],a[i+1],b[i+1],b[i]],bottom,top,material)
        # Beveling separate touching ends would re-open seams. Leave shared
        # miter coordinates exact; other surrounding furniture retains bevels.
        obj.modifiers.clear()
        group.objects.link(obj);collection.objects.unlink(obj)
        if interactive:
            owner={0:'arcade',2:'computer',4:'communications',6:'personal'}.get(i)
            if owner:obj['interaction']=owner
        uv=obj.data.uv_layers.new(name='Surface metres')
        for poly in obj.data.polygons:
            axis=max(range(3),key=lambda k:abs(poly.normal[k]));axes=[k for k in range(3) if k!=axis]
            for li in poly.loop_indices:
                p=obj.data.vertices[obj.data.loops[li].vertex_index].co
                uv.data[li].uv=(p[axes[0]],p[axes[1]])
outline=[Vector((x,z-3.15)) for x,z in layout['outline']]
front=[layout['consoles'][0]['footprint'][3]]+[seg['footprint'][2] for seg in layout['consoles']]
front=[Vector((x,z-3.15)) for x,z in front]
trim('Mitered window sill',outline,0,.24,.68,.92,'Graphite',bpy.data.collections['03 Ceiling and frames'])
trim('Mitered counter seal',front,.004,.015,.981,.999,'Gasket',bpy.data.collections['04 Consoles'])
trim('Mitered counter nosing',front,.019,.024,1.0025,1.0275,'Metal',bpy.data.collections['04 Consoles'],True)
for obj in targets:bpy.data.objects.remove(obj,do_unlink=True)
bpy.data.collections.remove(collection)
bpy.context.view_layer.update()
for obj,(matrix,metadata) in original.items():assert obj.matrix_world==matrix and dict(obj.items())==metadata
old=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/'bridge-interior-final.blend'),compress=True)
finally:bpy.context.preferences.filepaths.save_version=old
print('Replaced 21 trim pieces with exact miter joins; 14 previously measured coplanar overlaps addressed. Other anchors and metadata unchanged.')
