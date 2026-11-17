"""Read the editable source, export cleaned runtime copies, never save the .blend.

Run with Blender --background <source.blend> --python this_script.py.
Original runtime files and named source objects remain untouched on disk.
"""
from pathlib import Path
import bpy, bmesh, json, sys
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
recipe = ROOT / 'scripts/assets/export-refined-interior-live.py'
prefix = recipe.read_text(encoding='utf-8').split("export('cruz-del-sur-refined-bridge.glb'")[0]
exec(compile(prefix, str(recipe), 'exec'), globals())
OUT = ROOT / 'docs/audits/arrival-cleanup'
OUT.mkdir(parents=True, exist_ok=True)
arrival_only = '--arrival-only' in sys.argv
reference_cabin = '--reference-cabin' in sys.argv
cabin_revision = '--cabin-revision' in sys.argv or reference_cabin

removed = []
kept_arrival = []
for obj in arrival:
    name = obj.get('original_object', '')
    if name.startswith(('ARR10 equipment case', 'ARR10 case ')):
        removed.append(obj.name)
        continue
    # The 1m cabinets occupy alternating bays with 0.44m filtration modules.
    if name.startswith(('ARR10 technical cabinet', 'ARR10 cabinet ')):
        points = [obj.matrix_world @ Vector(v) for v in obj.bound_box]
        center = -sum(v.y for v in points) / len(points)
        old, new = (14.92, 14.8) if center < 15.9 else (16.87, 17.1)
        obj.matrix_world.translation.y -= new - old
        # Put the complete door, vent and hardware ahead of the structural ribs.
        obj.matrix_world.translation.x -= 0.19
    kept_arrival.append(obj)

kept_details = []
filter_sources = []
for obj in details:
    if 'Draped field textile' in obj.name or obj.name.startswith('CDS POLISH / Textile edging'):
        removed.append(obj.name)
    elif obj.name.startswith('CDS DETAIL / walls /'):
        filter_sources.append(obj)
        removed.append(obj.name)
    else:
        kept_details.append(obj)

assert len(filter_sources) == 5, 'Unexpected environmental wall batch layout'
modules = []
for original in filter_sources:
    # The named material batch contains three complete, disconnected assemblies.
    # Keep the first assembly, including text/fasteners, before copying it twice.
    data = original.data.copy()
    data.transform(original.matrix_world)
    bm = bmesh.new()
    bm.from_mesh(data)
    bmesh.ops.delete(bm, geom=[face for face in bm.faces
        if not (13.3 < -sum(v.co.y for v in face.verts) / len(face.verts) < 14.1)], context='FACES')
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=0.000001)
    bm.to_mesh(data)
    bm.free()
    assert len(data.polygons) > 0
    for z in [13.6, 15.9]:
        mesh = data.copy()
        for vertex in mesh.vertices:
            vertex.co.y -= z - 13.7
        copy = bpy.data.objects.new('CLEAN / Filter %.1f / %s' % (z, original.name.split(' / ')[-1]), mesh)
        source.collection.objects.link(copy)
        modules.append(copy)
    bpy.data.meshes.remove(data)

kept_details.extend(modules)
if cabin_revision:
    import runpy
    revise = runpy.run_path(str(ROOT / 'scripts/assets/revise-arrival-cabin.py'))['revise']
    before_revision = kept_arrival + kept_details
    kept_arrival, kept_details = revise(kept_arrival, kept_details, reference=reference_cabin)
    retained_revision = set(kept_arrival + kept_details)
    removed.extend(obj.name for obj in before_revision if obj not in retained_revision)
    OUT = ROOT / 'docs/audits' / ('cabin-reference' if reference_cabin else 'cabin-revision')
    OUT.mkdir(parents=True, exist_ok=True)
    variant = 'reference' if reference_cabin else 'cabin'
    export('cruz-del-sur-' + variant + '-arrival.glb', kept_arrival, arrival_local=True)
    export('cruz-del-sur-' + variant + '-details.glb', kept_details)
elif not arrival_only:
    export('cruz-del-sur-clean-bridge.glb', bridge)
if not cabin_revision:
    export('cruz-del-sur-clean-arrival.glb', kept_arrival, arrival_local=True)
if not arrival_only and not cabin_revision:
    export('cruz-del-sur-clean-details.glb', kept_details)
elif arrival_only and not cabin_revision:
    previous = json.loads((OUT / 'export.json').read_text(encoding='utf-8'))
    replacement = reports[0]
    reports[:] = [replacement if asset['file'] == replacement['file'] else asset
                  for asset in previous['assets']]
report = {
    'source': str(Path(bpy.data.filepath).resolve()),
    'sourceSaved': False,
    'cabinRevision': cabin_revision,
    'referenceCabin': reference_cabin,
    'originalRuntimeFilesChanged': False,
    'removedNamedSourceObjects': removed,
    **({'serviceWallReference': True,
        'serviceWallLayout': json.loads((ROOT / 'src/game/world/arrivalCabinLayout.json').read_text())['serviceBay'],
        'serviceWallZones': ['personal-storage', 'maintenance', 'open-engineering', 'life-support', 'medical']}
       if reference_cabin else {
           'filterWorldCentersZ': [13.6, 15.9],
           'cabinetWorldCentersZ': [14.8, 17.1],
           'cabinetWorldCentersX': [3.78, 3.78],
           'environmentFilterCount': 2,
           'technicalCabinetCount': 2}),
    'assets': reports,
}
(OUT / 'export.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('CLEAN_ARRIVAL_EXPORT', json.dumps(report))
