"""Polish the saved Asterion scene without rebuilding or changing its sky.

blender --background docs/assets/cosmos/asterion-expanse.blend --python
scripts/assets/polish-cosmos-worlds.py -- --render
"""
import bpy
import math
import json
import hashlib
import sys
from pathlib import Path
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/cosmos'
SOURCE = OUT / 'asterion-expanse.blend'
source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
scene = bpy.context.scene
scene.name = 'CRUZ DEL SUR / Asterion / Worlds polish v2'


def material(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    output = nodes.new('ShaderNodeOutputMaterial')
    return mat, nodes, links, output


def ramp(nodes, values):
    node = nodes.new('ShaderNodeValToRGB')
    for i, (p, color) in enumerate(values):
        item = node.color_ramp.elements[i] if i < 2 else node.color_ramp.elements.new(p)
        item.position = p
        item.color = (*color, 1)
    return node


def noise(nodes, links, vector, scale, detail=3, rough=.6):
    node = nodes.new('ShaderNodeTexNoise')
    node.inputs['Scale'].default_value = scale
    node.inputs['Detail'].default_value = detail
    node.inputs['Roughness'].default_value = rough
    links.new(vector, node.inputs['Vector'])
    return node


def operation(nodes, links, op, a, b=0):
    node = nodes.new('ShaderNodeMath')
    node.operation = op
    for i, value in enumerate((a, b)):
        if isinstance(value, (int, float)):
            node.inputs[i].default_value = value
        else:
            links.new(value, node.inputs[i])
    return node.outputs[0]


def gas(obj, palette, storm_center, storm_color):
    mat, n, l, out = material(obj.name.split(' / ')[0] + ' / layered atmospheric belts v2')
    bs = n.new('ShaderNodeBsdfPrincipled')
    bs.inputs['Roughness'].default_value = .88
    bs.inputs['Specular IOR Level'].default_value = .12
    coord = n.new('ShaderNodeTexCoord')
    vec = coord.outputs['Generated']
    sep = n.new('ShaderNodeSeparateXYZ'); l.new(vec, sep.inputs[0])
    turbulence = noise(n, l, vec, 7, 5, .58)
    micro = noise(n, l, vec, 65, 3, .57)
    latitude = operation(n, l, 'MULTIPLY', sep.outputs['Z'], 39)
    large_weather = noise(n, l, vec, 2.8, 4, .62)
    distortion = operation(n, l, 'ADD', operation(n,l,'MULTIPLY',large_weather.outputs['Fac'],7), operation(n,l,'MULTIPLY',turbulence.outputs['Fac'],2.8))
    phase = operation(n, l, 'ADD', latitude, distortion)
    belts = operation(n, l, 'SINE', phase)
    belts = operation(n, l, 'MULTIPLY_ADD', belts, .38)
    # Math MULTIPLY_ADD third input is the mean latitude color index.
    belts.node.inputs[2].default_value = .5
    fine = operation(n, l, 'MULTIPLY', micro.outputs['Fac'], .08)
    value = operation(n, l, 'ADD', belts, fine)
    col = ramp(n, palette); l.new(value, col.inputs[0])
    # A coherent oval storm follows local planet coordinates, not view direction.
    sub = n.new('ShaderNodeVectorMath'); sub.operation = 'SUBTRACT'
    l.new(vec, sub.inputs[0]); sub.inputs[1].default_value = storm_center
    elliptical = n.new('ShaderNodeVectorMath'); elliptical.operation = 'MULTIPLY'
    l.new(sub.outputs[0], elliptical.inputs[0]); elliptical.inputs[1].default_value = (10, 13, 29)
    dist = n.new('ShaderNodeVectorMath'); dist.operation = 'LENGTH'; l.new(elliptical.outputs[0], dist.inputs[0])
    profile = ramp(n, [(0, (1,1,1)), (.35,(.8,.8,.8)), (.55,(.2,.2,.2)), (.72,(.0,.0,.0))])
    l.new(dist.outputs['Value'], profile.inputs[0])
    blend = n.new('ShaderNodeMixRGB'); blend.blend_type = 'MIX'
    l.new(profile.outputs[0], blend.inputs[0]); l.new(col.outputs[0], blend.inputs[1])
    blend.inputs[2].default_value = (*storm_color, 1)
    l.new(blend.outputs[0], bs.inputs['Base Color']); l.new(bs.outputs[0], out.inputs[0])
    obj.data.materials.clear(); obj.data.materials.append(mat)


def crater_texture():
    """Nonuniform spherical impacts: varied radii, overlapping rims and ejecta."""
    w, h = 2048, 1024
    height = np.full((h,w), .5, np.float32)
    rng = np.random.default_rng(41479)
    for i in range(480):
        longitude = rng.uniform(-math.pi, math.pi)
        latitude = rng.uniform(-1.25, 1.25)
        radius = rng.uniform(.013,.035) if i < 370 else rng.uniform(.035,.105)
        extent = radius * 1.65
        cy = (latitude / math.pi + .5) * h
        cx = (longitude / math.tau + .5) * w
        rx = math.ceil(extent / max(math.cos(latitude), .22) / math.tau*w)
        ry = math.ceil(extent/math.pi*h)
        xs = np.arange(int(cx)-rx, int(cx)+rx+1)
        ys = np.arange(max(0,int(cy)-ry), min(h,int(cy)+ry+1))
        lon = (xs/w-.5)*math.tau; lat=(ys/h-.5)*math.pi
        dot = np.sin(lat)[:,None]*math.sin(latitude)+np.cos(lat)[:,None]*math.cos(latitude)*np.cos(lon[None,:]-longitude)
        d = np.arccos(np.clip(dot,-1,1))/radius
        depth = rng.uniform(.035,.13)*(radius/.04)**.25
        floor = -depth*np.clip(1-d*d,0,1)**1.3
        rim = depth*.48*np.exp(-((d-1)/.105)**2)
        ejecta = depth*.11*np.exp(-((d-1.21)/.20)**2)
        height[np.ix_(ys,xs%w)] += (floor+rim+ejecta).astype(np.float32)
    image = bpy.data.images.new('VESPER / varied spherical impact relief v2', width=w, height=h, float_buffer=True)
    rgba=np.ones((h,w,4),np.float32); rgba[:,:,:3]=np.clip(height[:,:,None],0,1)
    image.pixels.foreach_set(rgba.ravel()); image.colorspace_settings.name='Non-Color'
    image.filepath_raw=str(OUT/'vesper-impact-relief-v2.exr'); image.file_format='OPEN_EXR'; image.save(); image.pack()
    return image


impact = crater_texture()
vesper = bpy.data.objects['VESPER / tidally scarred mineral world']
oldmat=vesper.data.materials[0]
newmat=oldmat.copy(); newmat.name='VESPER / geological basins and irregular impacts v2'
vesper.data.materials[0]=newmat
n,l=newmat.node_tree.nodes,newmat.node_tree.links
bs=next(x for x in n if x.type=='BSDF_PRINCIPLED')
old_crater=next(x for x in n if x.type=='BUMP' and abs(x.inputs['Distance'].default_value-.1)<.001)
underlying=old_crater.inputs['Normal'].links[0].from_socket
tex=n.new('ShaderNodeTexImage');tex.image=impact;tex.interpolation='Linear'
bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.65;bump.inputs['Distance'].default_value=1.25
l.new(tex.outputs['Color'],bump.inputs['Height']);l.new(underlying,bump.inputs['Normal']);l.new(bump.outputs[0],bs.inputs['Normal'])
bs.inputs['Roughness'].default_value=.92
bs.inputs['Specular IOR Level'].default_value=.16

nacre=bpy.data.objects['NACRE / copper and pearl gas giant']
gas(nacre,[(.1,(.13,.085,.055)),(.28,(.28,.18,.105)),(.44,(.53,.39,.24)),(.61,(.73,.62,.43)),(.80,(.44,.31,.18)),(.96,(.66,.52,.34))],(.36,.035,.56),(.33,.16,.075))
ithaca=bpy.data.objects['ITHACA / violet storm giant']
gas(ithaca,[(.1,(.035,.045,.08)),(.3,(.095,.11,.19)),(.47,(.22,.24,.32)),(.65,(.41,.4,.46)),(.82,(.18,.17,.26)),(.98,(.49,.44,.45))],(.37,.97,.43),(.42,.28,.25))

# Orison: dark fissures between blue-white plates, rather than cratered snow.
orison=bpy.data.objects['ORISON / fractured ocean ice']
mat,n,l,out=material('ORISON / glacial tectonic plates v2')
coord=n.new('ShaderNodeTexCoord');vec=coord.outputs['Generated']
warp=noise(n,l,vec,5,5,.65)
vs=n.new('ShaderNodeVectorMath');vs.operation='SCALE';vs.inputs['Scale'].default_value=.24;l.new(warp.outputs['Color'],vs.inputs[0])
add=n.new('ShaderNodeVectorMath');add.operation='ADD';l.new(vec,add.inputs[0]);l.new(vs.outputs[0],add.inputs[1])
cracks=n.new('ShaderNodeTexVoronoi');cracks.feature='DISTANCE_TO_EDGE';cracks.inputs['Scale'].default_value=19;l.new(add.outputs[0],cracks.inputs['Vector'])
base=ramp(n,[(.25,(.035,.11,.16)),(.42,(.14,.27,.32)),(.55,(.38,.50,.52)),(.68,(.61,.68,.67)),(.8,(.74,.77,.74))]);l.new(warp.outputs['Fac'],base.inputs[0])
fracture=ramp(n,[(0,(.75,.75,.75)),(.008,(.33,.33,.33)),(.02,(0,0,0)),(1,(0,0,0))]);l.new(cracks.outputs['Distance'],fracture.inputs[0])
coverage=noise(n,l,vec,3.4,3,.7)
mask=ramp(n,[(.30,(0,0,0)),(.48,(.1,.1,.1)),(.63,(.8,.8,.8)),(.8,(1,1,1))]);l.new(coverage.outputs['Fac'],mask.inputs[0])
fissure=operation(n,l,'MULTIPLY',fracture.outputs[0],mask.outputs[0])
profile=n.new('ShaderNodeMixRGB');l.new(fissure,profile.inputs[0]);l.new(base.outputs[0],profile.inputs[1]);profile.inputs[2].default_value=(.006,.025,.047,1)
bs=n.new('ShaderNodeBsdfPrincipled');bs.inputs['Roughness'].default_value=.62;bs.inputs['Specular IOR Level'].default_value=.20
l.new(profile.outputs[0],bs.inputs['Base Color'])
bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.20;bump.inputs['Distance'].default_value=.08;bump.invert=True;l.new(fissure,bump.inputs['Height']);l.new(bump.outputs[0],bs.inputs['Normal']);l.new(bs.outputs[0],out.inputs[0])
orison.data.materials.clear();orison.data.materials.append(mat)

# Physically shaded ice/dust ring sheet: radial optical depth and transmitted light.
rings=bpy.data.objects['NACRE / rings with Cassini and outer gaps']
mat,n,l,out=material('NACRE / translucent ice particles and optical depth v2')
coord=n.new('ShaderNodeTexCoord')
length=n.new('ShaderNodeVectorMath');length.operation='LENGTH';l.new(coord.outputs['Object'],length.inputs[0])
radius=operation(n,l,'DIVIDE',operation(n,l,'SUBTRACT',length.outputs['Value'],12.15),9.60)
color=ramp(n,[(0,(.20,.16,.12)),(.10,(.44,.37,.27)),(.24,(.77,.71,.58)),(.47,(.52,.46,.36)),(.64,(.74,.70,.60)),(.9,(.28,.27,.24)),(1,(.12,.13,.14))]);l.new(radius,color.inputs[0])
micro=noise(n,l,coord.outputs['Object'],65,2,.5)
band=operation(n,l,'SINE',operation(n,l,'MULTIPLY',radius,370))
depth=operation(n,l,'ADD',operation(n,l,'ADD',operation(n,l,'MULTIPLY',band,.12),.60),operation(n,l,'MULTIPLY',micro.outputs['Fac'],.16))
diffuse=n.new('ShaderNodeBsdfDiffuse');l.new(color.outputs[0],diffuse.inputs['Color']);diffuse.inputs['Roughness'].default_value=.8
translucent=n.new('ShaderNodeBsdfTranslucent');l.new(color.outputs[0],translucent.inputs['Color'])
scatter=n.new('ShaderNodeMixShader');scatter.inputs[0].default_value=.62;l.new(diffuse.outputs[0],scatter.inputs[1]);l.new(translucent.outputs[0],scatter.inputs[2])
transparent=n.new('ShaderNodeBsdfTransparent')
optical=n.new('ShaderNodeMixShader');l.new(depth,optical.inputs[0]);l.new(transparent.outputs[0],optical.inputs[1]);l.new(scatter.outputs[0],optical.inputs[2]);l.new(optical.outputs[0],out.inputs[0])
rings.data.materials.clear();rings.data.materials.append(mat)
for polygon in rings.data.polygons:polygon.material_index=0
nacre.rotation_euler=rings.rotation_euler.copy()
bpy.data.objects['NACRE / copper and pearl gas giant / atmosphere'].rotation_euler=rings.rotation_euler.copy()

# Secondary focal points are visible above the side-window sills.
lumen=bpy.data.objects['LUMEN / pale distant satellite'];lumen.location=(-90,4,3.5);lumen.scale=(1.44,)*3
cinder=bpy.data.objects['CINDER / iron moon'];cinder.location=(102,-4,14);cinder.scale=(1.18,)*3
overhead=bpy.data.objects['SELENE / Vesper moon'].copy();overhead.name='HALO / high inclination companion';scene.collection.objects.link(overhead)
overhead.location=(15,8,125);overhead.scale=(.72,)*3

sun=next(o for o in scene.objects if o.type=='LIGHT' and o.data.type=='SUN')
sun.data.energy=3.2;sun.data.angle=.015
for obj in scene.objects:
    if obj.type=='MESH' and obj.name.endswith('/ atmosphere'):
        for m in obj.data.materials:
            for node in m.node_tree.nodes:
                if node.type=='EMISSION':node.inputs['Strength'].default_value=.28
        obj.scale*=.9985

# Dedicated detail camera, separate from the parent-owned window review cameras.
camera_data=bpy.data.cameras.new('DETAIL / Nacre ring transmission and shadow')
camera=bpy.data.objects.new(camera_data.name,camera_data);scene.collection.objects.link(camera)
camera.location=nacre.location+Vector((-22,-55,17));target=nacre.location
camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera_data.lens=45;camera_data.clip_end=1000
scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=1280;scene.render.resolution_y=720
scene.camera=bpy.data.objects['VIEW 01 / Bridge / Vesper and Nacre']
scene['polish_v2']='Irregular impact relief; coherent gas belts; fissured ice; transmitted rings; coherent Sun.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'asterion-expanse-v2.blend'))
report={'source_sha256':source_hash,'source_unchanged':hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash,
        'output':'asterion-expanse-v2.blend','world_preserved':scene.world.name,
        'sun_count':sum(o.type=='LIGHT' and o.data.type=='SUN' for o in scene.objects),
        'sun_energy':sun.data.energy,'impact_map':[2048,1024],'ring_translucent_fraction':.62,
        'runtime_changed':False}
(OUT/'polish-v2-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
if '--render' in sys.argv:
    for camera_name,filename in [('VIEW 01 / Bridge / Vesper and Nacre','v2-front.png'),('VIEW 02 / Aft / Ithaca and Orison','v2-rear.png'),(camera.name,'v2-rings.png')]:
        scene.camera=bpy.data.objects[camera_name];scene.render.filepath=str(OUT/filename);bpy.ops.render.render(write_still=True)
    scene.camera=bpy.data.objects['VIEW 01 / Bridge / Vesper and Nacre']
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'asterion-expanse-v2.blend'))
print('POLISH_V2',json.dumps(report))
