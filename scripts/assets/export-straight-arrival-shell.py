"""Export a straight arrival pressure shell from a disposable Blender process.

Read the approved unified source; retain the bridge, doors, and original files.
Geometry and physics share this shell, including continuous port glazing.
"""
from pathlib import Path
import bpy, json
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
config = json.loads((ROOT / 'src/game/world/arrivalShellLayout.json').read_text())
recipe = ROOT / 'scripts/assets/export-unified-runtime-live.py'
code = recipe.read_text(encoding='utf-8').split("try:\n    if 'envelope' in targets:")[0]
# Side floor strips follow the same constant wall, instead of the old bow.
old_floor = 'stations=[(12.07,5.128),(12.8,5.35),(15.5,5.35),(17.9,5.10),(18.265,4.90)]'
assert old_floor in code, 'Unified exporter floor recipe changed; review shell integration'
code = code.replace(old_floor, "stations=[(12.07,config['wallX']),(config['endZ'],config['wallX'])]")
exec(compile(code, str(recipe), 'exec'), globals())
skin, roofcol, details, ribs = [cols[k] for k in ['skin', 'roof', 'details', 'ribs']]
armor = bpy.data.materials['UNIFIED / Graphite ceramic']
steel = bpy.data.materials['UNIFIED / Blue titanium']
edge = bpy.data.materials['UNIFIED / Machined seam edges']
glass = bpy.data.materials['UNIFIED / Panoramic smoked glass']
amber = bpy.data.materials['UNIFIED / Warm practical cores']
helpers = (ROOT / 'scripts/assets/build-unified-compact-ship-live.py').read_text(encoding='utf-8')
exec(compile(helpers[helpers.index('def xyz'):helpers.index('# Remove the temporary')], 'shell-helpers', 'exec'), globals())

prefixes = (
    'Aft dorsal carapace', 'Aft roof shoulder', 'Aft carapace longitudinal seam',
    'Aft canopy warm edge', 'Aft internal oblique rib', 'Aft diagonal amber practical',
    'Offset overhead service trunk', 'Starboard folded pressure wall',
    'Starboard armored shoulder seam', 'Starboard slanted wall rib',
    'Starboard inset amber slit', 'Port observation', 'Port pressure plinth',
    'Aft continuous roof shoulder lip', 'Flush carapace radiator bed',
    'Carapace radiator fin', 'Recessed carapace latch', 'Low swept sensor mast',
    'Sensor mast cyan tip', 'Connector to aft pod yoke',
)
removed = [o for o in envelope if o.name.startswith(tuple('CDS U / ' + p for p in prefixes))]
envelope = [o for o in envelope if o not in removed]
collision = [o for o in collision if o not in removed]
before = set(bpy.data.objects)
wall, shoulder, roofx, roofy = [config[k] for k in ['wallX', 'shoulderY', 'roofX', 'roofY']]
start, end, sill = [config[k] for k in ['startZ', 'endZ', 'sillY']]
thickness = config['thickness']

# Trim only boundary collar solids to meet the new roof silhouette. The central
# apertures and all terminal/door transforms remain unchanged.
for original in list(envelope):
    if not original.name.startswith(('CDS U / Forward octagonal pressure collar',
                                     'CDS U / Aft docking pressure collar')):
        continue
    copy = original.copy(); copy.data = original.data.copy()
    skin.objects.link(copy)
    copy.data.transform(copy.matrix_world); copy.matrix_world.identity()
    forward = 'Forward' in original.name
    outer = ([(5.10,0,wall,0),(5.10,1.9,wall,shoulder),
              (3.55,3.52,roofx,roofy),(2.65,3.58,2.65,roofy)] if forward else
             [(4.75,0,wall,0),(4.75,1.35,wall,shoulder),
              (3.25,2.9,roofx,roofy),(2.1,3.3,2.1,roofy)])
    for vertex in copy.data.vertices:
        p = vertex.co
        for ox, oy, nx, ny in outer:
            if abs(abs(p.x)-ox)<.001 and abs(p.z-oy)<.001:
                p.x = nx if p.x>0 else -nx
                p.z = ny
                break
    envelope.remove(original)
    if original in collision: collision.remove(original)

slab('Straight cabin flat roof', [(-roofx,roofy,start),(roofx,roofy,start),
     (roofx,roofy,end),(-roofx,roofy,end)], thickness, armor, roofcol)
for side in [-1, 1]:
    slab('Straight cabin shoulder', [(side*roofx,roofy,start),(side*wall,shoulder,start),
         (side*wall,shoulder,end),(side*roofx,roofy,end)], thickness, steel, roofcol)
    if side > 0:
        slab('Straight cabin pressure wall', [(wall,0,start),(wall,0,end),
             (wall,shoulder,end),(wall,shoulder,start)], thickness, armor, skin)
    else:
        slab('Straight cabin window plinth', [(-wall,0,start),(-wall,0,end),
             (-wall,sill,end),(-wall,sill,start)], thickness, armor, skin)
        # Single continuous plane closes physics; mullions provide visual bays.
        mesh('Straight cabin port glazing', [(-wall,sill,start),(-wall,sill,end),
             (-wall,shoulder,end),(-wall,shoulder,start)], [(0,1,2,3)], glass, roofcol)
        for z in [start,13.5,15.14,16.78,end]:
            beam('Straight cabin window mullion',(-wall+.055,sill,z),
                 (-wall+.055,shoulder,z),.09,armor,roofcol)
        for y in [sill,shoulder]:
            beam('Straight cabin window edge',(-wall+.055,y,start),
                 (-wall+.055,y,end),.09,armor,roofcol)
        beam('Straight cabin window cross rail',(-wall+.055,1.65,start),
             (-wall+.055,1.65,end),.045,armor,roofcol)

# Rear exterior keeps its tapered silhouette beyond the room's docking collar.
stations = [(end,roofx,roofy,wall,shoulder),(18.75,2.9,3.18,4.8,1.6),(20.1,1.6,1.0,3.7,.1)]
for a,b in zip(stations,stations[1:]):
    z,w,h,o,oh=a; zz,ww,hh,oo,ooh=b
    slab('Straight cabin tail transition',[(-w,h,z),(w,h,z),(ww,hh,zz),(-ww,hh,zz)],thickness,armor,roofcol)
    for side in [-1,1]:
        slab('Straight cabin tail shoulder',[(side*w,h,z),(side*o,oh,z),
             (side*oo,ooh,zz),(side*ww,hh,zz)],thickness,steel,roofcol)

made = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
envelope.extend(made); collision.extend(made)
# The polished source adds a Blender wear bitmap to structural panels. Keep
# the established texture-free envelope contract and leave interior art alone.
plain_materials = {}
for obj in envelope:
    copied_data = False
    for index, slot in enumerate(obj.material_slots):
        material = slot.material
        if not material or not material.use_nodes:
            continue
        if not any(n.type == 'TEX_IMAGE' for n in material.node_tree.nodes):
            continue
        if material not in plain_materials:
            plain = material.copy()
            shader = next(n for n in plain.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
            for socket in shader.inputs:
                for link in list(socket.links): plain.node_tree.links.remove(link)
            shader.inputs['Base Color'].default_value = (.055,.068,.080,1)
            shader.inputs['Roughness'].default_value = .58
            plain_materials[material] = plain
        if not copied_data:
            obj.data = obj.data.copy()
            copied_data = True
        obj.material_slots[index].link = 'DATA'
        obj.data.materials[index] = plain_materials[material]
export('cruz-del-sur-straight-envelope.glb', envelope)
export('cruz-del-sur-straight-collision.glb', collision, physics=True)
folder = ROOT / 'docs/assets/straight-cabin'
folder.mkdir(parents=True, exist_ok=True)
preview = bpy.data.scenes.new('Cabin / Straight pressure shell')
for original in envelope:
    copy=original.copy(); world=original.matrix_world.copy(); copy.parent=None
    copy.matrix_world=world; preview.collection.objects.link(copy)
bpy.data.libraries.write(str(folder / 'straight-pressure-shell.blend'), {preview},
                         path_remap='RELATIVE', fake_user=True, compress=True)
(folder / 'export.json').write_text(json.dumps({
    'sourceSaved':False,'profile':config,'removedObjects':[o.name for o in removed],
    'assets':reports},indent=2),encoding='utf-8')
print('STRAIGHT_SHELL_EXPORT', json.dumps(reports))
