"""Portable subtle PBR finishes and service details; retain V1 and screen anchors."""
from pathlib import Path
from math import sin,cos
import json,bpy,bmesh,numpy as np
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
NAME='Bridge - Surface Finishes V2'
assert NAME not in bpy.data.scenes
source=bpy.data.scenes['Bridge - Industrial Interior V1']
scene=bpy.data.scenes.new(NAME);scene.world=source.world;bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'
collection=bpy.data.collections.new('BRIDGE V2 / Architecture');scene.collection.children.link(collection)
materials={}
for old in source.objects:
    if old.type!='MESH':continue
    obj=old.copy();obj.data=old.data.copy();collection.objects.link(obj)
    for slot in obj.material_slots:
        key=slot.material.name.removeprefix('BRIDGE V1 ')
        if key not in materials:
            m=slot.material.copy();m.name='BRIDGE V2 '+key;materials[key]=m
        slot.material=materials[key]

# Existing geometry helpers create small editable fittings using the same metre layout.
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],__file__,'exec'))
layout=json.loads((ROOT/'docs/assets/bridge/layout.json').read_text())
for seg in layout['consoles']:
    for t in [-.28,0,.28]:
        x=t*seg['length']
        for dx in [-seg['length']*.105,seg['length']*.105]:
            for y in [.36,.73]:
                box('Recessed service fastener',(x+dx,y,.552),(.026,.026,.012),'Graphite',.005,seg)
                box('Fastener slot',(x+dx,y,.559),(.014,.003,.003),'Metal',.001,seg)
        box('Service label plate',(x,.47,.551),(.22,.065,.012),'Graphite',.003,seg)
        for j in range(3):box('Service label ticks',(x-.07+j*.035,.47,.559),(.018,.007,.002),'Ivory',.0005,seg)
    # Thin exposed metal lip catches light without covering the amber strip.
    box('Counter edge seam',(0,1.005,.529),(seg['length']-.16,.012,.012),'Gasket',.002,seg)

# One UV repeat per metre, with actual image maps rather than Blender-only noise nodes.
for obj in collection.objects:
    uv=obj.data.uv_layers.new(name='Surface metres')
    obj.data.update()
    for poly in obj.data.polygons:
        normal=obj.matrix_world.to_3x3()@poly.normal
        axis=max(range(3),key=lambda i:abs(normal[i]));pair=[i for i in range(3) if i!=axis]
        for li in poly.loop_indices:
            p=obj.matrix_world@obj.data.vertices[obj.data.loops[li].vertex_index].co
            uv.data[li].uv=(p[pair[0]],p[pair[1]])
    obj.data.uv_layers.active=uv

N=512;rng=np.random.default_rng(83)
yy,xx=np.mgrid[0:N,0:N]/N
grain=rng.random((N,N)).astype(np.float32)-.5
brush=np.sin(yy*2*np.pi*128)*.5
scuffs=np.zeros((N,N),dtype=np.float32)
for _ in range(26):
    x,y=rng.integers(0,N,size=2);length=rng.integers(3,25)
    scuffs[y,(x+np.arange(length))%N]=rng.uniform(.15,.5)
folder=ROOT/'docs/assets/bridge/textures-v2';folder.mkdir(exist_ok=True)
def image(name,rgb,data=False):
    if not data:rgb=np.where(rgb<=.0031308,rgb*12.92,1.055*np.maximum(rgb,0)**(1/2.4)-.055)
    rgba=np.concatenate([np.clip(rgb,0,1),np.ones((N,N,1))],axis=2).astype(np.float32)
    img=bpy.data.images.new('BRIDGE V2 '+name,width=N,height=N,alpha=True)
    if data:img.colorspace_settings.name='Non-Color'
    img.pixels.foreach_set(rgba.ravel());img.update()
    img.filepath_raw=str(folder/(name+'.png'));img.file_format='PNG';img.save();img.pack()
    return img
def texture(mat,img):
    node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=img;node.interpolation='Linear';return node
for key in ['Graphite','Ivory','Metal']:
    mat=materials[key];p=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    color=np.array(p.inputs['Base Color'].default_value[:3])
    variation=1+grain*.035+brush*(.035 if key=='Metal' else .008)+scuffs*.08
    tex=texture(mat,image(key+'-color',color[None,None,:]*variation[:,:,None]))
    mat.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
    orm=np.ones((N,N,3),dtype=np.float32)
    orm[:,:,1]=np.clip(p.inputs['Roughness'].default_value+grain*.05-scuffs*.07,.2,.85)
    orm[:,:,2]=p.inputs['Metallic'].default_value
    tex=texture(mat,image(key+'-orm',orm,True));sep=mat.node_tree.nodes.new('ShaderNodeSeparateColor')
    mat.node_tree.links.new(tex.outputs['Color'],sep.inputs['Color'])
    mat.node_tree.links.new(sep.outputs['Green'],p.inputs['Roughness'])
    mat.node_tree.links.new(sep.outputs['Blue'],p.inputs['Metallic'])
# Shared subtle tangent-space microtexture; low amplitude avoids shimmering.
nx=.012*np.sin(xx*2*np.pi*64);ny=.012*np.cos(yy*2*np.pi*64)
normal_image=image('micro-normal',np.stack([nx*.5+.5,ny*.5+.5,np.sqrt(1-nx*nx-ny*ny)*.5+.5],axis=2),True)
for key in ['Graphite','Ivory','Metal']:
    mat=materials[key];p=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    tex=texture(mat,normal_image);normal=mat.node_tree.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.25
    mat.node_tree.links.new(tex.outputs['Color'],normal.inputs['Color']);mat.node_tree.links.new(normal.outputs['Normal'],p.inputs['Normal'])

# Same non-destructive material-batched export as V1.
footer=base[base.index('# Editable source'):base.index('bpy.ops.wm.save_as_mainfile')]
exec(compile(footer,__file__,'exec'))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/bridge/bridge-interior-v2.blend'))
print('V2: subtle painted metal, brushed alloy, roughness and micro-normal maps; seven packed 512px textures.')
