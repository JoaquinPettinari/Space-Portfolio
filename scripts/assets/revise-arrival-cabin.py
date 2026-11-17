"""Runtime-only cabin furniture. Invoked by export-arrival-cleanup --cabin-revision.

All dimensions are world metres in the same JSON read by Rapier's layout.
The caller uses a separate Blender process and never saves the source .blend.
"""
from pathlib import Path
import json
import bpy


def revise(arrival, details, reference=False):
    layout = json.loads((Path(__file__).resolve().parents[2] /
                        'src/game/world/arrivalCabinLayout.json').read_text())
    removed_prefixes = ['ARR10 bench ']
    if reference:
        removed_prefixes += ['ARR10 window ', 'ARR10 outer hull sill']
    arrival = [o for o in arrival if not o.get('original_object', '').startswith(tuple(removed_prefixes))]
    details = [o for o in details if not o.name.startswith('CDS POLISH / Scientific transport cases /')]
    made = []

    def material(name, rgb, metallic=0.0, roughness=.6):
        m = bpy.data.materials.new('CABIN / ' + name)
        m.use_nodes = True
        shader = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        color = tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb)
        shader.inputs['Base Color'].default_value = (*color, 1)
        shader.inputs['Metallic'].default_value = metallic
        shader.inputs['Roughness'].default_value = roughness
        return m

    # Existing cabin finishes remain in the same export batches. Only the new
    # upholstery needs a new material, rather than seven extra draw calls.
    mats = {key: bpy.data.materials['ARRIVAL V4 ' + name] for key, name in {
        'frame': 'Graphite frame', 'ivory': 'Ivory cabinets',
        'dark': 'Gaskets', 'seam': 'Gaskets', 'metal': 'Warm grey panels',
        'ochre': 'Amber lamps',
    }.items()}
    mats['fabric'] = material('Charcoal woven upholstery' if reference else 'Sage woven upholstery',
                              (.19, .21, .23) if reference else (.32, .39, .36), 0, .68)

    def box(name, at, size, finish, bevel=.008):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(at[0], -at[2], at[1]))
        o = bpy.context.object
        o.name = 'CABIN / ' + name
        o.scale = (size[0], size[2], size[1])
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        o.data.materials.append(mats[finish])
        if bevel:
            mod = o.modifiers.new('Soft manufactured edges', 'BEVEL')
            mod.width = min(bevel, min(size) * .4)
            mod.segments = 3
        made.append(o)
        return o

    b = layout['bench']
    x, z = b['x'], (b['startZ'] + b['endZ']) / 2
    length, depth = b['endZ'] - b['startZ'], b['depth']
    box('Straight lounge chassis', (x, .24, z), (depth, .48, length), 'frame', .035)
    box('Recessed plinth', (x - .04, .06, z), (depth - .1, .12, length - .12), 'dark')
    box('Continuous back shell', (x - depth / 2 + .06, .85, z), (.12, .9, length), 'ivory', .025)
    for i in range(3):
        seat_z = b['startZ'] + length * (i + .5) / 3
        width = length / 3 - .065
        box('Seat cushion %d' % i, (x + .055, .55, seat_z), (.72, .18, width), 'fabric', .065)
        back = box('Upholstered back %d' % i, (x - .285, .96, seat_z), (.19, .64, width), 'fabric', .055)
        back.rotation_euler.y = -.10
        box('Lumbar pad %d' % i, (x - .16, .77, seat_z), (.11, .18, width - .065), 'fabric', .04)
        box('Cushion seam %d' % i, (x + .418, .515, seat_z), (.008, .016, width - .055), 'seam', .003)
        box('Storage gasket %d' % i, (x + depth / 2 + .004, .28, seat_z), (.025, .3, width), 'dark')
        box('Storage face %d' % i, (x + depth / 2 + .02, .28, seat_z), (.024, .265, width - .035), 'ivory')
        box('Inset pull %d' % i, (x + depth / 2 + .036, .34, seat_z), (.014, .038, .21), 'dark')
        for offset in [-.12, .12]:
            box('Pull end', (x + depth / 2 + .043, .34, seat_z + offset), (.018, .042, .018), 'metal', .003)
    for end in [b['startZ'] + .025, b['endZ'] - .025]:
        box('Armrest support', (x + .06, .62, end), (.64, .39, .07), 'frame', .025)
        box('Padded armrest', (x + .075, .83, end), (.66, .095, .105), 'fabric', .04)
    # Close the space behind the bench against the selected shell: one straight
    # sill for the current reference, segmented only for the retained old recipe.
    from math import sin, pi
    shell = json.loads((Path(__file__).resolve().parents[2] /
                       'src/game/world/arrivalShellLayout.json').read_text()) if reference else None
    sill_segments = 1 if reference else 28
    for i in range(sill_segments):
        zz = b['startZ'] + (i + .5) * length / sill_segments
        local = (zz - 12.07) / 1.5
        hull_x = (-2.76 - .65 * sin(pi * local / 4.13) ** 2) * 1.5
        if shell:
            hull_x = -shell['wallX'] + shell['thickness']
        inner = x - depth / 2
        width = max(.02, inner - hull_x)
        box('Fitted rear sill', (inner - width / 2, .65, zz), (width, 1.3, length / sill_segments + .002), 'frame', 0)

    bay = layout['serviceBay']
    mid_z = (bay['startZ'] + bay['endZ']) / 2
    bay_length = bay['endZ'] - bay['startZ']
    box('Service bay continuous plinth', (bay['frontX'] + .21, .14, mid_z), (.42, .28, bay_length), 'frame')
    box('Service bay recessed backing', (bay['frontX'] + .61, 1.39, mid_z), (.12, 2.5, bay_length), 'dark')
    for end in [bay['startZ'], bay['endZ']]:
        box('Service bay closed return', (bay['frontX'] + .22, bay['height'] / 2, end), (.44, bay['height'], .055), 'frame')
    box('Service plinth amber datum', (bay['frontX'] - .006, .23, mid_z), (.012, .018, bay_length - .14), 'ochre', .003)

    h = layout['serviceHatch']
    hx, hy, hz, w, height = h['x'], h['y'], h['z'], h['width'], h['height']
    box('Side service hatch gasket', (hx, hy, hz), (w, height, .045), 'dark', .035)
    box('Side service hatch recessed panel', (hx, hy, hz + .025), (w - .06, height - .06, .04), 'frame', .03)
    box('Side service hatch inner plate', (hx, hy + .08, hz + .052), (w - .17, height - .28, .018), 'ivory', .025)
    for sign in [-1, 1]:
        for offset in [-.55, .55]:
            box('Hatch captive fastener', (hx + sign * (w / 2 - .06), hy + offset, hz + .055), (.028, .055, .025), 'metal')
        box('Hatch locking bar', (hx + sign * .37, hy - .06, hz + .075), (.055, .54, .035), 'metal')
    box('Hatch handle recess', (hx + .22, hy + .12, hz + .068), (.18, .31, .025), 'dark')
    box('Hatch pull handle', (hx + .22, hy + .12, hz + .11), (.045, .23, .055), 'metal')
    for i in range(6):
        box('Hatch lower vent', (hx - .13, hy - .51 + i * .033, hz + .069), (.4, .012, .016), 'dark', .002)
    for dx in [-.30, -.15, 0, .15, .30]:
        box('Hatch caution index', (hx + dx, hy - height / 2 + .10, hz + .064), (.085, .032, .012), 'ochre', .002)

    # Mesh lettering is static and included in the existing material batches.
    bpy.ops.object.text_add(location=(hx - .35, -(hz + .073), hy + .59), rotation=(1.57079632679, 0, 0))
    text = bpy.context.object
    text.name = 'CABIN / Service hatch identification'
    text.data.body = 'SERVICE / 02'
    text.data.size = .065
    text.data.extrude = 0
    text.data.materials.append(mats['dark'])
    bpy.ops.object.convert(target='MESH')
    made.append(bpy.context.object)
    print('CABIN_REVISION', json.dumps({'removedCurvedBench': True, 'removedLooseCases': True,
                                      'layout': layout, 'newObjects': len(made)}))
    if reference:
        import runpy
        enrich = runpy.run_path(str(Path(__file__).with_name('detail-reference-cabin.py')))['enrich']
        arrival, details = enrich(arrival, details, made, box, mats, material)
    return arrival + made, details
