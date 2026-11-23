"""Apply the reviewed galactic artwork to the saved procedural Blender study.

blender --background docs/assets/cosmos/asterion-expanse.blend --python
scripts/assets/build-cosmos-art-sky.py -- --render

Preserves all 3D worlds. Seam/pole continuity is resolved in shader nodes, not
by modifying the artwork bitmap. The procedural world remains as a fallback.
"""
from pathlib import Path
import json
import math
import sys
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/assets/cosmos'
scene = bpy.context.scene
source = OUT / 'asterion-galaxy-art.png'
old = scene.world
if 'artwork' not in old.name:
    old.name = 'ASTERION / procedural radiance fallback'
    old.use_fake_user = True
world = bpy.data.worlds.get('ASTERION / reviewed artwork and continuous stars')
if world is None:
    world = bpy.data.worlds.new('ASTERION / reviewed artwork and continuous stars')
world.use_nodes = True
n = world.node_tree.nodes
l = world.node_tree.links
n.clear()
image = bpy.data.images.load(str(source), check_existing=True)
image.colorspace_settings.name = 'sRGB'
image.pack()
image.filepath = '//asterion-galaxy-art.png'
texture = n.new('ShaderNodeTexImage')
texture.name = 'Reviewed galactic artwork / sRGB / packed'
texture.image = image
texture.extension = 'CLIP'
coord = n.new('ShaderNodeTexCoord')
direction = n.new('ShaderNodeVectorMath');direction.operation = 'SCALE'
direction.inputs['Scale'].default_value = -1
l.new(coord.outputs['Normal'],direction.inputs[0])
separate = n.new('ShaderNodeSeparateXYZ')
l.new(direction.outputs[0], separate.inputs[0])

def math_node(operation, left, right):
    node=n.new('ShaderNodeMath');node.operation=operation
    for index,value in enumerate((left,right)):
        if isinstance(value,(float,int)):node.inputs[index].default_value=value
        else:l.new(value,node.inputs[index])
    return node.outputs[0]

# Perspective sky-sector projection keeps the 1774px artwork sharp instead of
# stretching its central few pixels across a full 360-degree panorama.
depth=math_node('MAXIMUM',separate.outputs['Y'],.001)
u=math_node('ADD',math_node('MULTIPLY',math_node('DIVIDE',separate.outputs['X'],depth),1/(2*math.tan(math.radians(50)))),.5)
v=math_node('ADD',math_node('MULTIPLY',math_node('DIVIDE',separate.outputs['Z'],depth),1/math.tan(math.radians(50))),.35)
uv=n.new('ShaderNodeCombineXYZ');l.new(u,uv.inputs['X']);l.new(v,uv.inputs['Y'])
l.new(uv.outputs[0],texture.inputs['Vector'])
edge=math_node('MINIMUM',math_node('MINIMUM',u,math_node('SUBTRACT',1,u)),
               math_node('MINIMUM',v,math_node('SUBTRACT',1,v)))
feather=n.new('ShaderNodeMapRange');feather.inputs['From Min'].default_value=.015
feather.inputs['From Max'].default_value=.13;l.new(edge,feather.inputs['Value'])
front=math_node('GREATER_THAN',separate.outputs['Y'],.05)
mask=math_node('MULTIPLY',feather.outputs[0],front)
fallback_image=next((im for im in bpy.data.images if im.filepath.endswith('asterion-galactic-radiance.exr')),None)
if fallback_image is None:fallback_image=bpy.data.images.load(str(OUT/'asterion-galactic-radiance.exr'))
fallback_image.pack()
fallback_image.filepath = '//asterion-galactic-radiance.exr'
fallback=n.new('ShaderNodeTexEnvironment');fallback.image=fallback_image
color = n.new('ShaderNodeMixRGB')
l.new(mask, color.inputs[0])
l.new(fallback.outputs[0], color.inputs[1]);l.new(texture.outputs[0], color.inputs[2])
background = n.new('ShaderNodeBackground');background.inputs['Strength'].default_value = 1.1
ambient = n.new('ShaderNodeBackground');ambient.inputs['Strength'].default_value = .012
l.new(color.outputs[0], background.inputs[0]);l.new(color.outputs[0], ambient.inputs[0])
light_path = n.new('ShaderNodeLightPath')
mix = n.new('ShaderNodeMixShader')
l.new(light_path.outputs['Is Camera Ray'], mix.inputs[0])
l.new(ambient.outputs[0], mix.inputs[1]);l.new(background.outputs[0], mix.inputs[2])
output = n.new('ShaderNodeOutputWorld');l.new(mix.outputs[0], output.inputs[0])
scene.world = world
scene['art_sky_source'] = str(source.relative_to(ROOT))
if 'art_sky_yaw_degrees' in scene:del scene['art_sky_yaw_degrees']
scene['art_sky_projection_degrees'] = 100
scene['sky_continuity'] = 'Front sky-sector feather into continuous 360 procedural radiance; unmodified sRGB artwork.'

seam_name = 'VIEW 06 / Artwork seam inspection'
seam_camera = bpy.data.objects.get(seam_name)
if seam_camera is None:
    data = bpy.data.cameras.new(seam_name)
    seam_camera = bpy.data.objects.new(seam_name,data)
    bpy.data.collections['03 / Review cameras and stellar lighting'].objects.link(seam_camera)
    data.lens = 29;data.clip_end = 1000
seam_camera.rotation_euler = Vector((.707,.707,.15)).to_track_quat('-Z','Y').to_euler()
cameras = sorted((o for o in scene.objects if o.type == 'CAMERA' and o.name.startswith(('VIEW 01','VIEW 02','VIEW 03','VIEW 04'))), key=lambda o:o.name)
scene.camera = cameras[0]
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces.active.region_3d.view_perspective = 'CAMERA'
            area.spaces.active.overlay.show_overlays = False
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'asterion-expanse.blend'))
if '--render' in sys.argv:
    for index,camera in enumerate(cameras+[seam_camera]):
        scene.camera=camera
        scene.render.resolution_x=1280;scene.render.resolution_y=720
        scene.render.filepath=str(OUT/('review-%02d.png'%(index+1)))
        bpy.ops.render.render(write_still=True)
scene.camera=cameras[0]
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'asterion-expanse.blend'))
report_path=OUT/'asterion-validation.json'
report=json.loads(report_path.read_text(encoding='utf-8-sig'))
report.update({'world_texture':list(image.size),'sky_source':str(source.relative_to(ROOT)),
               'sky_color_space':'sRGB','sky_packed':bool(image.packed_file),
               'procedural_fallback_texture':[4096,2048],
               'sky_projection_degrees':100,'seam_and_pole_blend':True,
               'cameras':[c.name for c in cameras]+['VIEW 05 / 360 equirectangular',seam_name]})
report.pop('sky_yaw_degrees',None)
report['objects']=len(scene.objects)
report_path.write_text(json.dumps(report,indent=2),encoding='utf-8')
print('ASTERION_ART_SKY_READY',json.dumps(report))
