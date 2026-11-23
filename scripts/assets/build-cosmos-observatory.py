"""Author an independent 360-degree fictional observatory environment in Blender.

No runtime assets are replaced. All procedural shaders remain editable in the .blend.
Run with Blender --background --python this_file; pass -- --render to render reviews.
"""
from pathlib import Path
import sys
import json
import math
import random
import bpy
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/cosmos'
OUT.mkdir(parents=True, exist_ok=True)
random.seed(7719)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = 'CRUZ DEL SUR / The Asterion Expanse / Art review'


def collection(name):
    result = bpy.data.collections.new(name)
    scene.collection.children.link(result)
    return result


worlds = collection('01 / Worlds and moons')
rocks = collection('02 / Fractured orbital debris')
rig = collection('03 / Review cameras and stellar lighting')


def move(obj, destination):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    destination.objects.link(obj)
    return obj


def smoothnoise(x, y, seed=0):
    ix, iy = np.floor(x), np.floor(y)
    fx, fy = x-ix, y-iy
    fx, fy = fx*fx*(3-2*fx), fy*fy*(3-2*fy)
    def h(a, b):
        v = np.sin(a*127.1+b*311.7+seed*73.11)*43758.5453
        return v-np.floor(v)
    return ((h(ix,iy)*(1-fx)+h(ix+1,iy)*fx)*(1-fy)
            +(h(ix,iy+1)*(1-fx)+h(ix+1,iy+1)*fx)*fy)


def fbm(x,y,seed=0,octaves=6):
    result=np.zeros_like(x)
    amplitude=.5
    for octave in range(octaves):
        result += smoothnoise(x,y,seed+octave)*amplitude
        x,y=x*2.07+17.8,y*2.03-13.1
        amplitude*=.52
    return result


def connect_world(image):
    world=bpy.data.worlds.new('ASTERION / 360 starfield and twin spiral galaxies')
    world.use_nodes=True
    nodes=world.node_tree.nodes; links=world.node_tree.links
    nodes.clear()
    texture=nodes.new('ShaderNodeTexEnvironment');texture.image=image
    background=nodes.new('ShaderNodeBackground');background.inputs['Strength'].default_value=.65
    ambient=nodes.new('ShaderNodeBackground');ambient.inputs['Strength'].default_value=.012
    light_path=nodes.new('ShaderNodeLightPath')
    mix=nodes.new('ShaderNodeMixShader')
    output=nodes.new('ShaderNodeOutputWorld')
    links.new(texture.outputs['Color'],background.inputs['Color'])
    links.new(texture.outputs['Color'],ambient.inputs['Color'])
    links.new(light_path.outputs['Is Camera Ray'],mix.inputs[0])
    links.new(ambient.outputs[0],mix.inputs[1]);links.new(background.outputs[0],mix.inputs[2])
    links.new(mix.outputs[0],output.inputs[0])
    scene.world=world


def galactic_world():
    if '--reuse-world' in sys.argv and (OUT/'asterion-galactic-radiance.exr').exists():
        image=bpy.data.images.load(str(OUT/'asterion-galactic-radiance.exr'))
        image.pack();connect_world(image)
        return
    # Spherical radiance field: no billboard boundaries or seams at the poles.
    width,height=4096,2048
    lon=(np.arange(width,dtype=np.float32)/width*2-1)*np.pi
    lat=(np.arange(height,dtype=np.float32)/height-.5)*np.pi
    dx=np.cos(lat)[:,None]*np.cos(lon)[None,:]
    dy=-np.cos(lat)[:,None]*np.sin(lon)[None,:]
    dz=np.broadcast_to(np.sin(lat)[:,None],dx.shape)
    rgb=np.zeros((height,width,3),dtype=np.float32)
    rgb[:]=(.0008,.0014,.0035)
    # Two spiral systems on opposite sides; each uses independent clouds and dust lanes.
    for direction,size,tilt,strength,seed in [((.24,1,.31),.68,.53,1.,12),
                                             ((-.3,-1,.21),.42,-.68,.48,42)]:
        normal=Vector(direction).normalized()
        right=normal.cross(Vector((0,0,1))).normalized()
        up=right.cross(normal).normalized()
        forward=dx*normal.x+dy*normal.y+dz*normal.z
        x=(dx*right.x+dy*right.y+dz*right.z)/np.maximum(forward,.01)/size
        y=(dx*up.x+dy*up.y+dz*up.z)/np.maximum(forward,.01)/size
        xx=x*np.cos(tilt)+y*np.sin(tilt)
        yy=(-x*np.sin(tilt)+y*np.cos(tilt))*2.15
        r=np.sqrt(xx*xx+yy*yy)+.0001
        angle=np.arctan2(yy,xx)
        grain=fbm(xx*16,yy*16,seed)
        turbulence=fbm(xx*3,yy*3,seed+4)
        phase=angle-2.6*np.log(r+.08)+2.5*(turbulence-.5)+.7*(grain-.5)
        arms=(.5+.5*np.cos(phase*2))**4
        secondary=(.5+.5*np.cos(phase*4+1.2))**11*.20
        disk=np.exp(-r*2.4)*np.clip((1.65-r)*3,0,1)*(forward>.25)
        cloud=np.clip((grain-.30)*2.8,0,1.5)
        structure=(arms+secondary+.08)*cloud*disk
        dust=(.5+.5*np.cos(phase*2+.63))**9
        structure*=1-.85*dust
        warm=(np.exp(-r*r*110)*1.8+np.exp(-r*r*22)*.3)*(forward>.25)
        warm*=np.clip((grain-.18)*2,0,1)*(1-.88*dust)
        halo=np.exp(-r*r*8)*.055*(forward>.25)
        ion=np.clip(fbm(xx*44,yy*44,seed+2)-.60,0,1)*arms*disk
        rgb[:,:,0]+=strength*(structure*.48+warm*1.25+halo+ion*3.5)
        rgb[:,:,1]+=strength*(structure*.68+warm*.86+halo*.7+ion*.22)
        rgb[:,:,2]+=strength*(structure*1.32+warm*.64+halo*.8+ion*.48)
    # Faint irregular nebular arc fills the side vistas without washing out black space.
    belt=np.exp(-((dz+.18*np.sin(np.arctan2(dy,dx)*3))/.12)**2)
    cloud=fbm(dx*8+dz*3,dy*8-dz*4,80)
    haze=np.clip(cloud-.46,0,1)*belt*.13
    rgb+=haze[:,:,None]*np.array([.36,.21,.72],dtype=np.float32)
    # Deterministic stars distributed uniformly over the sphere, not equirectangular pixels.
    rng=np.random.default_rng(8402)
    for i in range(16000):
        u=rng.uniform(0,width)
        v=(np.arcsin(rng.uniform(-1,1))/np.pi+.5)*height
        px,py=int(u),min(height-1,int(v))
        brightness=float(rng.pareto(2.6)+.10)*.10
        color=np.array([(1.,.73,.48),(.60,.76,1.),(.92,.94,1.)][i%3])
        rgb[py,px]+=color*brightness
        if brightness>1.7 and 4<py<height-5:
            for oy in range(-4,5):
                for ox in range(-4,5):
                    falloff=math.exp(-(ox*ox+oy*oy)/2.8)*brightness*.13
                    rgb[py+oy,(px+ox)%width]+=color*falloff
    rgba=np.ones((height,width,4),dtype=np.float32)
    rgba[:,:,:3]=rgb
    image=bpy.data.images.new('ASTERION / authored 360 spiral radiance',width,height,float_buffer=True)
    image.pixels.foreach_set(rgba.ravel())
    image.filepath_raw=str(OUT/'asterion-galactic-radiance.exr')
    image.file_format='OPEN_EXR'
    image.save()
    image.pack()
    connect_world(image)


def ramp(nodes, stops):
    node=nodes.new('ShaderNodeValToRGB')
    cr=node.color_ramp
    while len(cr.elements)>2:cr.elements.remove(cr.elements[-1])
    for i,(position,color) in enumerate(stops):
        e=cr.elements[i] if i<2 else cr.elements.new(position)
        e.position=position;e.color=(*color,1)
    return node


def rocky_material(name, colors, ice=False):
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    n=mat.node_tree.nodes;l=mat.node_tree.links;n.clear()
    out=n.new('ShaderNodeOutputMaterial');bs=n.new('ShaderNodeBsdfPrincipled')
    bs.inputs['Roughness'].default_value=.65 if ice else .86
    coord=n.new('ShaderNodeTexCoord')
    terrain=n.new('ShaderNodeTexNoise');terrain.inputs['Scale'].default_value=4.1
    terrain.inputs['Detail'].default_value=7.;terrain.inputs['Roughness'].default_value=.72
    l.new(coord.outputs['Generated'],terrain.inputs['Vector'])
    col=ramp(n,colors);l.new(terrain.outputs['Fac'],col.inputs[0])
    l.new(col.outputs[0],bs.inputs['Base Color'])
    fine=n.new('ShaderNodeTexNoise');fine.inputs['Scale'].default_value=180
    fine.inputs['Detail'].default_value=4
    l.new(coord.outputs['Generated'],fine.inputs['Vector'])
    bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.42
    bump.inputs['Distance'].default_value=.075
    l.new(fine.outputs['Fac'],bump.inputs['Height'])
    large=n.new('ShaderNodeBump');large.inputs['Strength'].default_value=.60
    large.inputs['Distance'].default_value=.32
    l.new(terrain.outputs['Fac'],large.inputs['Height']);l.new(bump.outputs[0],large.inputs['Normal'])
    craters=n.new('ShaderNodeTexVoronoi');craters.inputs['Scale'].default_value=36
    l.new(coord.outputs['Generated'],craters.inputs['Vector'])
    crater_profile=ramp(n,[(0,(.05,.05,.05)),(.23,(.05,.05,.05)),
                          (.31,(.78,.78,.78)),(.39,(.46,.46,.46)),(.50,(.46,.46,.46))])
    l.new(craters.outputs['Distance'],crater_profile.inputs[0])
    crater_bump=n.new('ShaderNodeBump');crater_bump.inputs['Strength'].default_value=.26 if ice else .52
    crater_bump.inputs['Distance'].default_value=.10
    l.new(crater_profile.outputs[0],crater_bump.inputs['Height'])
    l.new(large.outputs[0],crater_bump.inputs['Normal'])
    l.new(crater_bump.outputs[0],bs.inputs['Normal']);l.new(bs.outputs[0],out.inputs[0])
    return mat


def gas_material(name, palette):
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    n=mat.node_tree.nodes;l=mat.node_tree.links;n.clear()
    out=n.new('ShaderNodeOutputMaterial');bs=n.new('ShaderNodeBsdfPrincipled')
    bs.inputs['Roughness'].default_value=.68
    coord=n.new('ShaderNodeTexCoord')
    mapping=n.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY'
    mapping.inputs[1].default_value=(2,2,8)
    l.new(coord.outputs['Generated'],mapping.inputs[0])
    noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=1.8
    noise.inputs['Detail'].default_value=6;noise.inputs['Roughness'].default_value=.64
    noise.inputs['Distortion'].default_value=2.4
    l.new(mapping.outputs[0],noise.inputs['Vector'])
    color=ramp(n,palette);l.new(noise.outputs['Fac'],color.inputs[0])
    l.new(color.outputs[0],bs.inputs['Base Color'])
    l.new(bs.outputs[0],out.inputs[0])
    return mat


def sphere(name, location, radius, material, segments=128, rings=64):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=radius,location=location)
    obj=move(bpy.context.object,worlds);obj.name=name;obj.data.materials.append(material)
    for p in obj.data.polygons:p.use_smooth=True
    return obj


def atmosphere(planet,color):
    mat=bpy.data.materials.new(planet.name+' / thin scattering rim');mat.use_nodes=True
    n=mat.node_tree.nodes;l=mat.node_tree.links;n.clear()
    out=n.new('ShaderNodeOutputMaterial');transparent=n.new('ShaderNodeBsdfTransparent')
    emission=n.new('ShaderNodeEmission');emission.inputs[0].default_value=(*color,1)
    emission.inputs[1].default_value=.42
    weight=n.new('ShaderNodeLayerWeight');weight.inputs['Blend'].default_value=.18
    power=n.new('ShaderNodeMath');power.operation='POWER';power.inputs[1].default_value=2.2
    l.new(weight.outputs['Fresnel'],power.inputs[0])
    geometry=n.new('ShaderNodeNewGeometry')
    facing=n.new('ShaderNodeVectorMath');facing.operation='DOT_PRODUCT'
    facing.inputs[1].default_value=Vector((.9,.35,.28)).normalized()
    l.new(geometry.outputs['Normal'],facing.inputs[0])
    daylight=n.new('ShaderNodeMapRange');daylight.inputs['From Min'].default_value=-.1
    daylight.inputs['From Max'].default_value=.65
    l.new(facing.outputs['Value'],daylight.inputs['Value'])
    rim=n.new('ShaderNodeMath');rim.operation='MULTIPLY'
    l.new(power.outputs[0],rim.inputs[0]);l.new(daylight.outputs[0],rim.inputs[1])
    mix=n.new('ShaderNodeMixShader');l.new(rim.outputs[0],mix.inputs[0])
    l.new(transparent.outputs[0],mix.inputs[1]);l.new(emission.outputs[0],mix.inputs[2])
    l.new(mix.outputs[0],out.inputs[0])
    obj=sphere(planet.name+' / atmosphere',planet.location,planet.dimensions.x*.502,mat)
    obj.visible_shadow=False


def planetary_rings(planet, inner, outer):
    # Separate radial strips supply physical gaps and subtle band color differences.
    mats=[]
    for index in range(8):
        mat=bpy.data.materials.new('Nacre / icy ring band %02d'%index);mat.diffuse_color=(.18+index*.035,.14+index*.027,.105+index*.023,1)
        mat.use_nodes=True
        bs=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        bs.inputs['Base Color'].default_value=mat.diffuse_color;bs.inputs['Roughness'].default_value=.9
        mats.append(mat)
    verts=[];faces=[];indices=[]
    steps=144;segments=256
    for band in range(steps):
        t=band/steps
        if .53<t<.58 or .77<t<.79:continue
        r0=inner+(outer-inner)*t;r1=r0+(outer-inner)/steps*.91
        base=len(verts)
        for radius in (r0,r1):
            verts.extend([(radius*math.cos(i*math.tau/segments),radius*math.sin(i*math.tau/segments),0) for i in range(segments)])
        for i in range(segments):
            faces.append((base+i,base+(i+1)%segments,base+segments+(i+1)%segments,base+segments+i))
            indices.append((band*13+band//7)%8)
    mesh=bpy.data.meshes.new('Nacre / 144 separated dust bands');mesh.from_pydata(verts,[],faces);mesh.materials.clear()
    for mat in mats:mesh.materials.append(mat)
    for p,index in zip(mesh.polygons,indices):p.material_index=index
    obj=bpy.data.objects.new('NACRE / rings with Cassini and outer gaps',mesh);worlds.objects.link(obj)
    obj.location=planet.location;obj.rotation_euler=(math.radians(17),math.radians(-23),math.radians(12))


galactic_world()
basalt=rocky_material('VESPER / obsidian mineral shelves and pale salt basins',[
    (.24,(.012,.018,.024)),(.40,(.045,.065,.074)),(.49,(.13,.15,.145)),
    (.55,(.25,.225,.18)),(.63,(.51,.46,.35)),(.76,(.75,.72,.62))])
vesper=sphere('VESPER / tidally scarred mineral world',(-38,82,-29),29,basalt)
vesper.rotation_euler=(.3,.4,.65)
atmosphere(vesper,(.17,.48,1.))
moonmat=rocky_material('SELENE / charcoal regolith',[(.22,(.013,.016,.020)),(.45,(.055,.060,.065)),(.68,(.20,.18,.15)),(.8,(.38,.32,.25))])
sphere('SELENE / Vesper moon',(-17,95,16),5.5,moonmat)
nacre=sphere('NACRE / copper and pearl gas giant',(48,165,-17),9,gas_material('NACRE / turbulent copper cloud belts',[
    (.20,(.04,.035,.04)),(.36,(.18,.10,.065)),(.45,(.36,.23,.13)),(.53,(.66,.51,.34)),(.61,(.88,.77,.61)),(.75,(.35,.25,.18))]))
planetary_rings(nacre,12.15,21.75)
atmosphere(nacre,(.7,.46,.24))
cerulean=sphere('ITHACA / violet storm giant',(32,-115,17),29,gas_material('ITHACA / violet ammonia cloud bands',[
    (.2,(.016,.022,.055)),(.37,(.06,.08,.19)),(.46,(.17,.14,.30)),(.54,(.32,.28,.42)),(.64,(.60,.49,.51)),(.8,(.24,.16,.29))]))
cerulean.rotation_euler=(.18,.3,.2);atmosphere(cerulean,(.35,.27,.8))
ice=rocky_material('ORISON / turquoise ice plates and blue fissures',[(.2,(.008,.03,.055)),(.4,(.025,.12,.16)),(.48,(.11,.28,.31)),(.53,(.32,.47,.49)),(.63,(.7,.79,.78)),(.8,(.91,.94,.89))],True)
orison=sphere('ORISON / fractured ocean ice',(-53,-100,-22),17,ice)
atmosphere(orison,(.13,.67,.78))
sphere('ORISON / distant companion',(-80,-145,23),4,moonmat)
sphere('CINDER / iron moon',(112,8,-18),11,rocky_material('CINDER / rust and impact glass',[(.25,(.025,.015,.01)),(.43,(.11,.05,.025)),(.56,(.30,.12,.055)),(.72,(.48,.27,.13))]))
sphere('LUMEN / pale distant satellite',(-155,15,38),9,ice)

# Three shared rocky meshes. Irregular geometry retains a physically shaded silhouette.
templates=[]
for index in range(3):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3,radius=1)
    obj=move(bpy.context.object,rocks);obj.name='DEBRIS / shared source %d'%index
    for v in obj.data.vertices:
        p=v.co;v.co*=1+.14*math.sin(p.x*7+index)+.10*math.cos(p.y*9+p.z*5)
    obj.data.materials.append(moonmat);templates.append(obj.data)
    bpy.data.objects.remove(obj,do_unlink=True)
for index in range(155):
    theta=random.uniform(0,math.tau);distance=random.uniform(72,170)
    z=random.gauss(-21,8)+math.sin(theta*2)*12
    obj=bpy.data.objects.new('DEBRIS / orbital fragment %03d'%index,templates[index%3]);rocks.objects.link(obj)
    obj.location=(math.cos(theta)*distance,math.sin(theta)*distance,z)
    radius=random.uniform(.18,1.35)*(2.1 if index%21==0 else 1)
    obj.scale=(radius,radius*random.uniform(.6,1.2),radius*random.uniform(.5,1.1))
    obj.rotation_euler=tuple(random.uniform(0,math.tau) for _ in range(3))

# A distant sun lights the objects; no environment lighting changes are exported to runtime.
data=bpy.data.lights.new('ASTERION / warm primary star','SUN');data.energy=3.7;data.angle=.035
sun=bpy.data.objects.new(data.name,data);rig.objects.link(sun)
sun.rotation_euler=Vector((-.9,-.35,-.28)).to_track_quat('-Z','Y').to_euler()


def camera(name,target,lens=29):
    data=bpy.data.cameras.new(name);obj=bpy.data.objects.new(name,data);rig.objects.link(obj)
    obj.rotation_euler=Vector(target).to_track_quat('-Z','Y').to_euler()
    data.lens=lens;data.clip_end=1000;data.clip_start=.1
    return obj


cameras=[camera('VIEW 01 / Bridge / Vesper and Nacre',(0,1,.10)),
         camera('VIEW 02 / Aft / Ithaca and Orison',(0,-1,.04)),
         camera('VIEW 03 / Port / Lumen and nebular arc',(-1,0,.05)),
         camera('VIEW 04 / Starboard / Cinder and debris',(1,0,0))]
panorama=camera('VIEW 05 / 360 equirectangular',(0,1,0));panorama.data.type='PANO'
panorama.data.panorama_type='EQUIRECTANGULAR'
scene.camera=cameras[0]
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1280;scene.render.resolution_y=720;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.view_settings.view_transform='AgX';scene.view_settings.exposure=.35
prefs=bpy.context.preferences.addons['cycles'].preferences
try:
    prefs.compute_device_type='OPTIX';prefs.get_devices()
    for device in prefs.devices:device.use=device.type!='CPU'
    scene.cycles.device='GPU'
except Exception:scene.cycles.device='CPU'
scene['status']='Blender art review. No runtime assets replaced.'
scene['orientation']='Blender +Y = bridge forward (Three -Z); +Z = up.'
scene['worlds']='Vesper / Nacre / Ithaca / Orison / Cinder / Lumen; fictional, not Solar System replicas.'
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_perspective='CAMERA'
            area.spaces.active.overlay.show_overlays=False
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'asterion-expanse.blend'))
sky_image=next(n.image for n in scene.world.node_tree.nodes if n.type=='TEX_ENVIRONMENT')
report={'review_only':True,'orientation':scene['orientation'],'world_texture':list(sky_image.size),
        'sky_source':scene.get('art_sky_source','procedural radiance / packed EXR'),
        'cameras':[c.name for c in cameras]+[panorama.name],
        'objects':len(scene.objects),'worlds':scene['worlds'],
        'limitations':['Procedural planet shaders require baking before glTF export.',
                       'No browser performance measurement yet; preview is authoring quality.']}
(OUT/'asterion-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
if '--render' in sys.argv:
    for index,cam in enumerate(cameras):
        scene.camera=cam;scene.render.filepath=str(OUT/('review-%02d.png'%(index+1)))
        bpy.ops.render.render(write_still=True)
    scene.camera=cameras[0]
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'asterion-expanse.blend'))
print('ASTERION_READY',json.dumps(report))
