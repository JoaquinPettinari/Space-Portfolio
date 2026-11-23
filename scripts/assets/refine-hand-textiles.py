"""Replace layered experimental shaders with reusable matte textile materials."""
from pathlib import Path
import bpy
import hashlib
import json
import shutil

out = Path(bpy.data.filepath).parent
assert out.name == 'astronaut-hands'
backup = out / 'astronaut-hands-before-textiles.blend'
if not backup.exists():
    shutil.copy2(bpy.data.filepath, backup)

def geometry_signature():
    data = []
    for obj in sorted(bpy.data.objects, key=lambda o: o.name):
        if obj.type == 'MESH':
            data.append((obj.name, [tuple(v.co) for v in obj.data.vertices],
                         [[(g.group, g.weight) for g in v.groups] for v in obj.data.vertices]))
        elif obj.type == 'ARMATURE':
            data.append((obj.name, [(b.name, tuple(b.rotation_euler)) for b in obj.pose.bones]))
    return hashlib.sha256(repr(data).encode()).hexdigest()

before = geometry_signature()
specs = [
    ('Graphite woven glove', (.018, .023, .027), .79, .065, 260, .00010),
    ('Reinforced finger pads', (.036, .039, .035), .87, .045, 360, .00008),
    ('Ivory pressure fabric', (.64, .61, .53), .84, .18, 210, .00013),
    ('Dark cuff rubber', (.012, .016, .018), .83, .04, 430, .00005),
    ('Safety orange', (.65, .16, .025), .78, .08, 270, .00008),
    ('Seam thread', (.20, .19, .16), .91, .08, 320, .00005),
]
for name, color, roughness, sheen, frequency, relief in specs:
    material = bpy.data.materials['HAND / ' + name]
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new('ShaderNodeOutputMaterial')
    shader = nodes.new('ShaderNodeBsdfPrincipled')
    shader.inputs['Metallic'].default_value = 0
    shader.inputs['Specular IOR Level'].default_value = .22
    shader.inputs['Sheen Weight'].default_value = sheen
    shader.inputs['Sheen Roughness'].default_value = .8
    links.new(shader.outputs['BSDF'], output.inputs['Surface'])
    coords = nodes.new('ShaderNodeTexCoord')
    # Object coordinates give each shared material a consistent physical scale.
    waves = []
    for axis in ['X', 'Z']:
        wave = nodes.new('ShaderNodeTexWave')
        wave.bands_direction = axis
        wave.inputs['Scale'].default_value = frequency
        wave.inputs['Distortion'].default_value = .35
        links.new(coords.outputs['Object'], wave.inputs['Vector'])
        waves.append(wave)
    weave = nodes.new('ShaderNodeMath'); weave.operation = 'MULTIPLY'
    links.new(waves[0].outputs['Fac'], weave.inputs[0])
    links.new(waves[1].outputs['Fac'], weave.inputs[1])
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 1600
    noise.inputs['Detail'].default_value = 2
    links.new(coords.outputs['Object'], noise.inputs['Vector'])
    grain = nodes.new('ShaderNodeMath'); grain.operation = 'MULTIPLY_ADD'
    links.new(noise.outputs['Fac'], grain.inputs[0]); grain.inputs[1].default_value = .22
    links.new(weave.outputs[0], grain.inputs[2])
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = .24
    bump.inputs['Distance'].default_value = relief
    links.new(grain.outputs[0], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = tuple(c * .82 for c in color) + (1,)
    ramp.color_ramp.elements[1].color = tuple(c * 1.08 for c in color) + (1,)
    links.new(noise.outputs['Fac'], ramp.inputs[0])
    links.new(ramp.outputs['Color'], shader.inputs['Base Color'])
    rough = nodes.new('ShaderNodeMapRange')
    rough.inputs['To Min'].default_value = roughness - .05
    rough.inputs['To Max'].default_value = min(.98, roughness + .05)
    links.new(noise.outputs['Fac'], rough.inputs['Value'])
    links.new(rough.outputs[0], shader.inputs['Roughness'])
    material.diffuse_color = (*color, 1)
    material['textile_bake_required'] = True

assert geometry_signature() == before, 'Materials pass must preserve geometry, weights and pose'
bpy.ops.wm.save_as_mainfile(filepath=str(out / 'astronaut-hands.blend'))
(out / 'textile-validation.json').write_text(json.dumps({
    'geometryWeightsAndPoseUnchanged': True, 'signature': before,
    'materials': [s[0] for s in specs], 'metallic': 0,
    'proceduralBakeRequiredForGLTF': True, 'runtimeChanged': False,
}, indent=2) + '\n')
print('TEXTILES_UPDATED')
