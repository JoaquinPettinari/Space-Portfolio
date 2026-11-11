"""V4 portable image-based PBR materials, in live Blender. No app changes."""
from pathlib import Path
import bpy
import numpy as np
from mathutils import Vector
import contextlib
import io

OUT=Path(__file__).resolve().parents[2]/'docs/assets/arrival-room'
NAME='Arrival Room - Materials V4'
assert NAME not in bpy.data.scenes, 'V4 already exists; inspect before rerunning.'
source=bpy.data.scenes['Arrival Room - Finishes V3']
scene=bpy.data.scenes.new(NAME);bpy.context.window.scene=scene
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
materials={}
for col in source.collection.children:
    dest=bpy.data.collections.new(col.name.replace('V3','V4'));scene.collection.children.link(dest)
    for src in col.objects:
        obj=src.copy();obj.data=src.data.copy();obj.name=src.name.replace('ARR3','ARR4',1);dest.objects.link(obj)
        for slot in obj.material_slots:
            old=slot.material
            if old.name not in materials:
                m=old.copy();m.name=old.name.replace('V3','V4');materials[old.name]=m
            slot.material=materials[old.name]
        # Per-face planar UVs at one repeat per metre, stable across world transforms.
        uv=obj.data.uv_layers.new(name='Surface metres')
        for poly in obj.data.polygons:
            normal=obj.matrix_world.to_3x3()@poly.normal
            axis=max(range(3),key=lambda i:abs(normal[i]))
            pair=[i for i in range(3) if i!=axis]
            for loop in poly.loop_indices:
                p=obj.matrix_world@obj.data.vertices[obj.data.loops[loop].vertex_index].co
                uv.data[loop].uv=(p[pair[0]],p[pair[1]])
        obj.data.uv_layers.active=uv

N=512
rng=np.random.default_rng(47)
yy,xx=np.mgrid[0:N,0:N]/N
grain=rng.random((N,N)).astype(np.float32)-.5
cloud=(np.sin(2*np.pi*(3*xx+2*yy))*.35+np.sin(2*np.pi*(7*xx-5*yy))*.15)
scuffs=np.zeros((N,N),dtype=np.float32)
for _ in range(45):
    x=int(rng.integers(0,N));y=int(rng.integers(0,N));length=int(rng.integers(4,35))
    scuffs[y,x:min(N,x+length)]=rng.uniform(.2,.6)

def image(name,rgb,data=False):
    if rgb.ndim==2:rgb=np.repeat(rgb[:,:,None],3,axis=2)
    if not data:
        rgb=np.where(rgb<=.0031308,rgb*12.92,1.055*np.maximum(rgb,0)**(1/2.4)-.055)
    rgba=np.concatenate([np.clip(rgb,0,1),np.ones((N,N,1))],axis=2).astype(np.float32)
    img=bpy.data.images.new('ARRIVAL V4 '+name,width=N,height=N,alpha=True)
    # Set color space before writing; pixels are interpreted as that image's encoded data.
    if data:img.colorspace_settings.name='Non-Color'
    img.pixels.foreach_set(rgba.ravel());img.update()
    folder=OUT/'textures-v4';folder.mkdir(exist_ok=True)
    img.filepath_raw=str(folder/(name+'.png'));img.file_format='PNG';img.save();img.pack()
    return img

def node_image(m,img):
    n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=img;n.interpolation='Linear'
    return n

# Paint color texture stores subtle surface variation, not baked scene lighting.
for key,rough,metal in [('Graphite frame',.44,.65),('Warm grey panels',.59,.35),('Ivory cabinets',.64,.18)]:
    m=materials['ARRIVAL V3 '+key];p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    color=np.array(p.inputs['Base Color'].default_value[:3])
    variation=1+grain*.08+scuffs*.14
    rgb=color[None,None,:]*variation[:,:,None]
    tex=node_image(m,image(key.replace(' ','-')+'-color',rgb))
    m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
    # Standard glTF ORM packing: R unused AO=1, G roughness, B metallic.
    orm=np.ones((N,N,3),dtype=np.float32)
    orm[:,:,1]=np.clip(rough+grain*.055-scuffs*.09,.1,.95)
    orm[:,:,2]=metal
    tex=node_image(m,image(key.replace(' ','-')+'-orm',orm,True))
    sep=m.node_tree.nodes.new('ShaderNodeSeparateColor')
    m.node_tree.links.new(tex.outputs['Color'],sep.inputs['Color'])
    m.node_tree.links.new(sep.outputs['Green'],p.inputs['Roughness'])
    m.node_tree.links.new(sep.outputs['Blue'],p.inputs['Metallic'])

# Woven cushion color plus tangent-space normals: exported as real image maps.
m=materials['ARRIVAL V3 Bench cushions'];p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
weave=np.sin(xx*2*np.pi*96)*np.sin(yy*2*np.pi*96)
color=np.array([.045,.060,.065])[None,None,:]*(1+weave[:,:,None]*.10+grain[:,:,None]*.06)
tex=node_image(m,image('cushion-color',color));m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
p.inputs['Roughness'].default_value=.86;p.inputs['Metallic'].default_value=0
nx=.10*np.cos(xx*2*np.pi*96)*np.sin(yy*2*np.pi*96)
ny=.10*np.sin(xx*2*np.pi*96)*np.cos(yy*2*np.pi*96)
nz=np.sqrt(1-nx*nx-ny*ny)
tex=node_image(m,image('cushion-normal',np.stack([nx*.5+.5,ny*.5+.5,nz*.5+.5],axis=2),True))
normal=m.node_tree.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.35
m.node_tree.links.new(tex.outputs['Color'],normal.inputs['Color']);m.node_tree.links.new(normal.outputs['Normal'],p.inputs['Normal'])
# Rubber and glazing stay calm; lamps keep the prior emission.
m=materials['ARRIVAL V3 Gaskets'];p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs['Roughness'].default_value=.9;p.inputs['Metallic'].default_value=0
scene['stage']='V4 image-based paint scuffs, roughness variation and woven cushions; review only'
scene['texture_budget']='8 packed PNGs at 512x512; no external textures required by GLB'
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'arrival-room-v4.blend'))
for obj in scene.objects:obj.select_set(obj.type=='MESH')
with contextlib.redirect_stdout(io.StringIO()):
    bpy.ops.export_scene.gltf(filepath=str(OUT/'arrival-room-v4.glb'),export_format='GLB',
        use_selection=True,use_active_scene=True,export_apply=True,export_yup=True,
        export_cameras=False,export_lights=False)
for obj in scene.objects:obj.select_set(False)
print('V4 source and GLB saved; 8 texture images; previous versions preserved.')
