"""Reference-led cabin dressing; static, material-batched and source-preserving.

Called by revise-arrival-cabin.py. Coordinates are runtime world metres; all
conversion to Blender's Z-up happens in these authoring helpers, never per frame.
"""
from pathlib import Path
from math import sin, cos, pi
import bpy
import json
import numpy as np
from mathutils import Vector


def enrich(arrival, details, made, box, mats, material):
    root = Path(__file__).resolve().parents[2]
    layout = json.loads((root / 'src/game/world/arrivalCabinLayout.json').read_text())
    rng = np.random.default_rng(1707)
    # Centre hatch faces were below their black gasket backing (8 vs 13 mm),
    # hiding their actual metal finish. Correct the layer order, not the grating
    # wells/substrate: those must stay dark to preserve the visible openings.
    for obj in details:
        if obj.name.startswith('CDS DETAIL / arrival / Graphite deck'):
            obj.location.z += .008
        elif obj.name.startswith(('CDS DETAIL / arrival / Service stencils',
                                  'CDS DETAIL / arrival / Muted safety ochre')):
            obj.location.z += .006
    mats['alloy'] = material('REFERENCE / Brushed titanium', (.39, .42, .41), .72, .33)
    mats['ceiling'] = material('REFERENCE / Padded ceiling', (.52, .51, .45), .12, .55)
    mats['cloth'] = material('REFERENCE / Woven cream', (.76, .71, .59), 0, .9)
    mats['pillow'] = material('REFERENCE / Flight cushion textile', (.13, .18, .19), 0, .88)
    mats['stripe'] = material('REFERENCE / Woven ochre stripe', (.61, .40, .15), 0, .88)
    mats['leaf'] = material('REFERENCE / Living green', (.22, .39, .09), 0, .63)
    mats['bronze'] = material('REFERENCE / Aged brass', (.61, .39, .16), .7, .37)
    mats['warm'] = material('REFERENCE / Warm diffuser', (.98, .72, .35), 0, .4)
    mats['cyan'] = material('REFERENCE / Cyan status', (.12, .6, .62), 0, .4)
    for key, color, strength in [('warm', (1, .30, .055, 1), 2), ('cyan', (.04, .75, .9, 1), 2)]:
        shader = next(n for n in mats[key].node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        shader.inputs['Emission Color'].default_value = color
        shader.inputs['Emission Strength'].default_value = strength
    for obj in arrival + made:
        if obj.type != 'MESH': continue
        for i, source_material in enumerate(obj.data.materials):
            if source_material and source_material.name == 'ARRIVAL V4 Amber lamps':
                obj.data.materials[i] = mats['cyan'] if 'Hatch caution index' in obj.name else mats['warm']

    def grain(mat, base, cloth=False):
        """Small packed images survive glTF export, unlike preview Noise nodes."""
        n = 256
        yy, xx = np.mgrid[:n, :n]
        noise = rng.uniform(-1, 1, (n, n))
        if cloth:
            variation = .93 + .035 * noise + .03 * np.sin(xx * pi / 2) * np.cos(yy * pi / 2)
        else:
            variation = .94 + .025 * noise + .025 * np.sin(xx * .21)
        pixels = np.ones((n, n, 4), dtype=np.float32)
        for channel in range(3):
            pixels[:, :, channel] = base[channel] * variation
        image = bpy.data.images.new(mat.name + ' albedo 256', n, n)
        image.pixels.foreach_set(pixels.ravel())
        image.pack()
        nodes = mat.node_tree.nodes
        shader = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
        tex = nodes.new('ShaderNodeTexImage'); tex.image = image
        mat.node_tree.links.new(tex.outputs['Color'], shader.inputs['Base Color'])
        if not cloth:
            return
        # Explicit normal bitmap: subtle woven relief without new geometry.
        normal = np.ones((n, n, 4), dtype=np.float32)
        normal[:, :, 0] = .5 + .045 * np.sin(xx * pi / 2)
        normal[:, :, 1] = .5 + .045 * np.sin(yy * pi / 2)
        normal[:, :, 2] = 1
        normal_image = bpy.data.images.new(mat.name + ' relief 256', n, n)
        normal_image.colorspace_settings.name = 'Non-Color'
        normal_image.pixels.foreach_set(normal.ravel()); normal_image.pack()
        normal_tex = nodes.new('ShaderNodeTexImage'); normal_tex.image = normal_image
        normal_node = nodes.new('ShaderNodeNormalMap'); normal_node.inputs['Strength'].default_value = .22
        mat.node_tree.links.new(normal_tex.outputs['Color'], normal_node.inputs['Color'])
        mat.node_tree.links.new(normal_node.outputs['Normal'], shader.inputs['Normal'])

    # Packed image pixels are linear light: the previous values made the green
    # considerably brighter than its intended swatch after color conversion.
    grain(mats['fabric'], (.065, .072, .080), True)
    grain(mats['cloth'], (.67, .61, .48), True)
    grain(mats['pillow'], (.10, .14, .15), True)
    grain(mats['ceiling'], (.48, .46, .39))

    def mesh(name, vertices, faces, finish, smooth=True):
        data = bpy.data.meshes.new('REFERENCE / ' + name)
        data.from_pydata([(p[0], -p[2], p[1]) for p in vertices], [], faces)
        data.update()
        uv = data.uv_layers.new(name='UVMap')
        for face in data.polygons:
            face.use_smooth = smooth
            for li in face.loop_indices:
                p = vertices[data.loops[li].vertex_index]
                uv.data[li].uv = (p[2] * 3, (p[0] + p[1]) * 3)
        obj = bpy.data.objects.new('REFERENCE / ' + name, data)
        bpy.context.scene.collection.objects.link(obj)
        data.materials.append(mats[finish]); made.append(obj)
        return obj

    def tube(name, points, radius, finish, sides=8):
        vertices, faces = [], []
        points = [Vector(p) for p in points]
        for i, point in enumerate(points):
            direction = (points[min(i + 1, len(points)-1)] - points[max(0, i-1)]).normalized()
            across = direction.cross(Vector((0, 1, 0)))
            if across.length < .001: across = direction.cross(Vector((1, 0, 0)))
            across.normalize(); up = direction.cross(across).normalized()
            for j in range(sides):
                vertices.append(point + radius * (across * cos(j*2*pi/sides) + up * sin(j*2*pi/sides)))
        for i in range(len(points)-1):
            for j in range(sides):
                a = i*sides+j; b = i*sides+(j+1)%sides
                faces.append((a, b, b+sides, a+sides))
        faces.extend([tuple(reversed(range(sides))), tuple((len(points)-1)*sides+j for j in range(sides))])
        return mesh(name, vertices, faces, finish)

    def ring(name, center, radius, finish, axis='y', thickness=.008):
        x, y, z = center
        points = []
        for i in range(49):
            a = 2*pi*i/48
            points.append((x + (0 if axis=='x' else radius*cos(a)),
                           y + (0 if axis=='y' else radius*sin(a)),
                           z + (radius*cos(a) if axis=='x' else radius*sin(a) if axis=='y' else 0)))
        return tube(name, points, thickness, finish)

    def lathe(name, at, profile, finish):
        vertices, faces = [], []
        for y, radius in profile:
            for i in range(24):
                a = 2*pi*i/24
                vertices.append((at[0]+radius*cos(a), at[1]+y, at[2]+radius*sin(a)))
        for j in range(len(profile)-1):
            for i in range(24):
                a=j*24+i; b=j*24+(i+1)%24
                faces.append((a,b,b+24,a+24))
        faces += [tuple(reversed(range(24))),tuple((len(profile)-1)*24+i for i in range(24))]
        return mesh(name, vertices, faces, finish)

    def label(text, at, size, finish='dark', wall='front'):
        bpy.ops.object.text_add(location=(at[0], -at[2], at[1]))
        obj = bpy.context.object; obj.name = 'REFERENCE / ' + text
        obj.rotation_euler = (pi/2, 0, pi/2 if wall == 'side' else 0)
        obj.data.body = text; obj.data.size = size; obj.data.extrude = 0
        obj.data.materials.append(mats[finish])
        bpy.ops.object.convert(target='MESH'); made.append(bpy.context.object)

    # Remove small old shelves/flask before replacing this area. Keep the actual
    # photo frames/slots; move them as a whole above the expanded service shelf.
    retained = []
    for obj in arrival:
        name = obj.get('original_object', '')
        if name.startswith(('ARR10 coffee ', 'ARR10 canister ', 'ARR10 shelf bracket',
                            'ARR10 insulated flask', 'ARR10 flask cap')):
            continue
        if name.startswith(('ARR10 memory ', 'ARR10 MEMORY_', 'ARR10 notes ',
                            'ARR10 blank note ', 'ARR10 CREW MEMORIES')):
            obj.location.z += .62
        retained.append(obj)
    arrival = retained
    # Give surviving photo slots real expedition imagery, reusing local assets.
    for index, file in enumerate(['orbital-vista.webp', 'earth-surface.png', 'deep-space.webp'], 1):
        name = 'ARRIVAL_MEMORY_%02d' % index
        mat = bpy.data.materials.get(name)
        if mat:
            image = bpy.data.images.load(str(root / 'public/textures/cruz-del-sur' / file), check_existing=True).copy()
            image.scale(256, 256); image.pack()
            node = mat.node_tree.nodes.new('ShaderNodeTexImage'); node.image = image
            shader = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
            mat.node_tree.links.new(node.outputs['Color'], shader.inputs['Base Color'])

    # A continuous dark upholstered back replaces the raised block-like lumbar
    # pads. Keep every seat inside the established furniture collider.
    made[:] = [obj for obj in made if 'Lumbar pad' not in obj.name]
    for obj in made:
        if 'Continuous back shell' in obj.name:
            obj.data.materials[0] = mats['frame']
        elif 'Storage face' in obj.name:
            obj.data.materials[0] = mats['alloy']
    # More rounded upholstery, plus warm tailored piping around each pad.
    for obj in list(made):
        if any(key in obj.name for key in ['Seat cushion', 'Upholstered back', 'Lumbar pad']):
            for mod in obj.modifiers:
                if mod.type == 'BEVEL': mod.segments = 5
            for polygon in obj.data.polygons: polygon.use_smooth = True
            mod = obj.modifiers.new('Weighted cushion normals', 'WEIGHTED_NORMAL'); mod.keep_sharp=True
    for z in [15.1983, 16.045, 16.8917]:
        tube('Tailored seat welt', [(-3.18,.58,z-.34),(-3.145,.59,z-.30),(-3.145,.59,z+.30),(-3.18,.58,z+.34)], .005, 'bronze')
        for zz in [z-.29,z+.29]:
            tube('Back stitch line', [(-3.723,.76,zz),(-3.723,1.19,zz)], .003, 'bronze', 6)
    b = layout['bench']
    middle_z = (b['startZ'] + b['endZ']) / 2
    box('REFERENCE / Lounge plinth light recess',
        (b['x'] + b['depth']/2 + .005,.075,middle_z),(.018,.045,b['endZ']-b['startZ']-.12),'dark',.006)
    box('REFERENCE / Lounge plinth warm diffuser',
        (b['x'] + b['depth']/2 + .016,.075,middle_z),(.008,.016,b['endZ']-b['startZ']-.24),'warm',.004)
    pillow = box('REFERENCE / Flight cushion', (-3.51,.88,16.86), (.23,.46,.51), 'pillow', .1)
    pillow.rotation_euler.y = -.18
    for modifier in pillow.modifiers:
        if modifier.type == 'BEVEL': modifier.segments = 6
    for face in pillow.data.polygons: face.use_smooth = True
    pillow.modifiers.new('Cushion weighted normals','WEIGHTED_NORMAL')
    ring('Embroidered flight patch', (-3.378,.91,16.86), .11, 'cloth', 'x', .004)
    tube('Flight patch diagonal', [(-3.372,.83,16.92),(-3.372,.99,16.80)], .004, 'cloth')

    # A static drape follows the back, seat and front edge. No cloth simulation.
    path = [(-3.95,1.34),(-3.78,1.35),(-3.67,1.26),(-3.64,1.07),(-3.61,.84),
            (-3.56,.69),(-3.39,.68),(-3.17,.675),(-3.07,.59),(-3.055,.36)]
    vertices, faces = [], []
    rows, columns = 46, 25
    for row in range(rows):
        t = row/(rows-1)*(len(path)-1); k=min(len(path)-2,int(t)); f=t-k
        px=path[k][0]*(1-f)+path[k+1][0]*f; py=path[k][1]*(1-f)+path[k+1][1]*f
        for col in range(columns):
            u=col/(columns-1)
            fold=.018*sin(u*10*pi+row*.08)+.007*sin(u*23*pi)
            vertices.append((px+fold,py+.009*sin(u*8*pi),15.19+(u-.5)*.55))
    for row in range(rows-1):
        for col in range(columns-1):
            a=row*columns+col; faces.append((a,a+1,a+columns+1,a+columns))
    cloth = mesh('Draped expedition blanket',vertices,faces,'cloth')
    solid=cloth.modifiers.new('Fabric thickness','SOLIDIFY'); solid.thickness=.006
    for row in [37,39]:
        tube('Woven blanket stripe',vertices[row*columns:(row+1)*columns],.012,'stripe')
    for col in range(1,columns-1):
        p=vertices[(rows-1)*columns+col]
        tube('Blanket fringe',[p,(p[0]+.008,p[1]-.065,p[2]+.006*sin(col))],.003,'cloth',5)

    # Ceiling cassettes are below the existing shell; do not duplicate windows.
    for x in [-1.45, 1.45]:
        for z in [12.85,14.08,15.31,16.54,17.62]:
            box('REFERENCE / Ceiling cassette',(x,3.16,z),(2.76,.065,1.12 if z<17.6 else .86),'ceiling',.045)
            for dx in [-1.29,1.29]:
                for dz in [-.43,.43]:
                    box('REFERENCE / Captive ceiling screw',(x+dx,3.119,z+dz),(.035,.012,.035),'alloy',.008)
    for x in [-2.93,0,2.93]:
        for z in [13.15,14.7,16.25,17.5]:
            box('REFERENCE / Ceiling light housing',(x,3.08,z),(.16,.095,1.15),'frame',.024)
            box('REFERENCE / Ceiling amber diffuser',(x,3.025,z),(.065,.015,.99),'warm',.025)
            for dz in [-.54,.54]:
                box('REFERENCE / Lamp retaining clip',(x,3.014,z+dz),(.105,.023,.035),'alloy',.005)
    # Over-window service rail and repeated recessed cyan indicators.
    box('REFERENCE / Window service rail',(-3.98,2.62,15.3),(.16,.18,4.7),'frame',.02)
    for z in [13.4,15.0,16.6]:
        box('REFERENCE / Window lamp recess',(-3.88,2.61,z),(.06,.08,.39),'dark',.015)
        box('REFERENCE / Window cyan lens',(-3.845,2.61,z),(.012,.027,.28),'cyan',.009)
    # Framed, warmer service panel with readable secondary markings.
    label('LIFE SUPPORT\nTOOLS\nSUPPLIES\nSPARES',(-2.69,1.52,12.242),.038)
    for y in [.46,.91,1.36,1.81]:
        box('REFERENCE / Hatch hinge',(-2.855,y,12.24),(.065,.11,.055),'alloy',.012)
    for z in [15.2,16.05,16.9]:
        box('REFERENCE / Storage status lens',(-3.062,.38,z+.29),(.012,.019,.036),'cyan',.006)
        for zz in [z-.32,z+.32]:
            for y in [.19,.39]:
                box('REFERENCE / Drawer captive screw',(-3.057,y,zz),(.012,.025,.025),'bronze',.006)

    # Coffee machine: open brew recess, drip grid, steam wand and rotary controls.
    box('REFERENCE / Espresso chassis',(-3.91,1.27,12.45),(.33,.48,.31),'frame',.035)
    box('REFERENCE / Espresso head',(-3.91,1.48,12.48),(.35,.085,.35),'alloy',.02)
    box('REFERENCE / Espresso recess',(-3.91,1.24,12.619),(.255,.29,.025),'dark',.012)
    box('REFERENCE / Espresso drip tray',(-3.91,1.055,12.63),(.34,.04,.22),'alloy',.015)
    for i in range(9):
        box('REFERENCE / Drip grid',(-4.045+i*.034,1.078,12.64),(.01,.006,.16),'dark',.002)
    tube('Portafilter',[(-3.91,1.395,12.64),(-3.91,1.395,12.78)],.018,'frame')
    tube('Steam wand',[(-3.76,1.4,12.60),(-3.72,1.23,12.69),(-3.74,1.19,12.72)],.008,'alloy')
    for x in [-4.02,-3.91,-3.80]:
        box('REFERENCE / Coffee control',(x,1.482,12.663),(.034,.028,.014),'cyan',.009)
    # Broad shelf replaces tiny floating slats, with a warm under-cabinet strip.
    box('REFERENCE / Coffee wall shelf',(-3.65,1.79,12.35),(1.09,.045,.42),'ivory',.012)
    box('REFERENCE / Under shelf light',(-3.65,1.758,12.48),(.91,.014,.045),'warm',.009)
    for x in [-4.08,-3.22]:
        tube('Shelf stay',[(x,1.77,12.22),(x,1.6,12.18)],.014,'alloy')
    for i in range(6):
        xx=-3.98+i*.048
        box('REFERENCE / Expedition book',(xx,1.94,12.28),(.038,.27-(i%3)*.025,.15),'bronze' if i%2 else 'frame',.003)
        box('REFERENCE / Book spine marking',(xx,1.94,12.358),(.026,.009,.003),'cloth',0)
    lathe('Coffee tin',(-3.57,1.815,12.30),[(0,.055),(.18,.055),(.185,.06),(.20,.06)],'alloy')
    # Planted objects have shaped solid leaves with veins, rather than alpha cards.
    def plant(at, scale=1, hanging=False):
        x,y,z=at
        lathe('Terracotta planter',at,[(0,.09*scale),(.18*scale,.115*scale),(.195*scale,.12*scale),(.21*scale,.12*scale)],'bronze')
        lathe('Planter soil',(x,y+.193*scale,z),[(0,.102*scale),(.005,.102*scale)],'dark')
        branches = 11 if hanging else 7
        for branch in range(branches):
            angle=branch*2*pi/branches
            length=(.28+.035*(branch%3))*scale
            stem=[]
            for i in range(12):
                t=i/11; fall=(-.65*t*t if hanging else .40*t-.17*t*t)*scale
                stem.append((x+cos(angle)*length*t,y+.20*scale+fall,z+sin(angle)*length*t))
            tube('Plant stem',stem,.004*scale,'leaf',6)
            for i in (range(2,12) if hanging else [3,5,7,9,11]):
                p=Vector(stem[i]); a=angle+(-.65 if i%4 else .65)
                tip=p+Vector((cos(a)*.19*scale,.065*scale,sin(a)*.19*scale))
                side=Vector((-sin(a)*.068*scale,0,cos(a)*.068*scale))
                vs, fs = [], []
                for row in range(7):
                    t=row/6; center=p.lerp(tip,t); width=sin(pi*t)*.98+.015
                    ridge=Vector((0,.017*scale*sin(pi*t),0))
                    vs.extend([center+side*width,center+ridge,center-side*width,center-Vector((0,.003,0))])
                for row in range(6):
                    a0=row*4; b0=a0+4
                    fs.extend([(a0,b0,b0+1,a0+1),(a0+1,b0+1,b0+2,a0+2),
                               (a0+2,b0+2,b0+3,a0+3),(a0+3,b0+3,b0,a0)])
                fs.extend([(3,2,1,0),(24,25,26,27)])
                mesh('Curved botanical leaf',vs,fs,'leaf')
    plant((-3.27,1.815,12.32),.72)
    plant((-3.36,1.024,12.45),.65)
    # Trailing plant is attached high at the rear corner, clear of the suit niche.
    box('REFERENCE / High planter shelf',(-3.78,2.51,17.68),(.67,.045,.36),'frame',.012)
    plant((-3.78,2.535,17.68),1.0,True)

    # Side table and armillary instrument occupy the already closed window edge.
    table = layout['sideTable']
    box('REFERENCE / Window side table',(table['x'],table['height']-.035,table['z']),
        (table['width'],.07,table['length']),'ivory',.025)
    box('REFERENCE / Side table support',(-4.27,.34,13.94),(.18,.63,.65),'frame',.02)
    lathe('Armillary base',(-4.08,.71,13.95),[(0,.12),(.035,.13),(.055,.08)],'bronze')
    tube('Armillary spindle',[(-4.08,.76,13.95),(-4.08,1.03,13.95)],.012,'bronze')
    for axis in ['x','y','z']:
        ring('Armillary orbit',(-4.08,1.05,13.95),.20,'bronze',axis,.006)
    for i in range(3):
        box('REFERENCE / Survey notebook',(-4.08,.73+i*.025,13.65),(.23,.024,.18),'frame' if i%2 else 'cloth',.003)
    # Broad baseboards / small fasteners, keeping the aisle floor unaltered.
    for zz in [13.25,14.25,15.25,16.25,17.25]:
        for xx in [-2.65,2.65]:
            box('REFERENCE / Floor flush fastener',(xx,.006,zz),(.026,.008,.026),'alloy',.008)
    # The opposite technical wall shares these authored materials and helpers.
    import runpy
    service_wall = runpy.run_path(str(Path(__file__).with_name('detail-service-wall.py')))['dress']
    arrival, details = service_wall(arrival, details, made, box, tube, ring, plant,
                                   mesh, mats, layout)
    # A separate editable dressing file keeps named objects/modifiers. It does
    # not overwrite the unified source or change the user's open Blender scene.
    preview = bpy.data.scenes.new('Cabin / Reference dressing')
    for original in arrival + made:
        copy = original.copy()
        world = original.matrix_world.copy()
        copy.parent = None; copy.matrix_world = world
        preview.collection.objects.link(copy)
    folder = root / 'docs/assets/cabin-reference'
    folder.mkdir(parents=True, exist_ok=True)
    bpy.data.libraries.write(str(folder / 'cabin-reference-dressing.blend'), {preview},
                             path_remap='RELATIVE', fake_user=True, compress=True)
    for obj in list(preview.objects): bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.scenes.remove(preview)
    return arrival, details
