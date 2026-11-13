"""Refine four seats inside their existing collision envelopes; Blender only."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
v17 = (ROOT/'scripts/assets/close-bridge-walls-v17-live.py').read_text()
prefix = v17[:v17.index('outline = json')]
prefix = prefix.replace('Closed Console Walls V17', 'Ergonomic Seats V18').replace('Lighting Study V16', 'Closed Console Walls V17').replace('BRIDGE V17', 'BRIDGE V18').replace('V17 lighting', 'V18 lighting')
exec(compile(prefix, __file__, 'exec'))
from math import pi
old_seats = [o for o in collection.objects if o.name.startswith('Command seat ')]
assert old_seats
for o in old_seats:
    bpy.data.objects.remove(o, do_unlink=True)
existing = set(collection.objects)
layout = json.loads((ROOT/'docs/assets/bridge/layout.json').read_text())
layout['monitors'].update(layout['sideChairs'])
v9 = (ROOT/'scripts/assets/detail-command-seats-v9-live.py').read_text()
chairs = v9[v9.index('for kind, monitor'):v9.index('# Same UV')]
# Retain the proven anchors, pan, arms and shell. Rework cushions and base below.
exec(compile(chairs, __file__, 'exec'))
for o in list(set(collection.objects)-existing):
    if any(key in o.name for key in ('longitudinal foot','cross brace','foot pad','upper cushion')):
        bpy.data.objects.remove(o, do_unlink=True)

for kind, monitor in layout['monitors'].items():
    position = monitor['chair']
    pose = {'x':position[0], 'z':position[2]-3.15, 'yaw':monitor['rotation']}
    def part(name, at, size, material, bevel=.012):
        return box('Command seat '+kind+' '+name, at, size, material, bevel, pose)
    def world(p):
        x,y,z=p
        return (pose['x']+x*cos(pose['yaw'])+z*sin(pose['yaw']),y,
                pose['z']-x*sin(pose['yaw'])+z*cos(pose['yaw']))
    # Rounded segmented upholstery and a separate head cushion, below 1.30m.
    part('thoracic cushion',(0,1.045,.248),(.50,.18,.085),'Gasket',.035)
    part('head cushion',(0,1.225,.245),(.40,.12,.095),'Gasket',.035)
    for side in (-1,1):
        part('back edge piping',(side*.275,1.04,.242),(.022,.28,.025),'Graphite',.008)
        part('arm adjustment collar',(side*.35,.77,.20),(.085,.065,.095),'Graphite',.012)
        part('arm adjustment key',(side*.395,.81,.12),(.024,.025,.055),'Metal',.006)
    part('seat front stitch',(0,.715,-.275),(.46,.008,.012),'Graphite',.003)
    # Five radial feet with twin low-poly casters, all inside +/-0.42m.
    for j in range(5):
        angle=2*pi*j/5
        dx,dz=sin(angle),cos(angle)
        beam('Command seat '+kind+' radial foot',world((dx*.05,.16,dz*.05)),
             world((dx*.32,.105,dz*.32)),.065,'Metal')
        part('caster fork',(dx*.32,.08,dz*.32),(.07,.09,.07),'Graphite',.01)
        # Cylinders rotate about the horizontal tangential axle.
        tangent=Vector((cos(angle),0,-sin(angle)))
        radial=Vector((dx,0,dz))
        for side in (-1,1):
            center=Vector((dx*.32,.045,dz*.32))+tangent*(side*.029)
            vertices=[]
            for axial in (-.014,.014):
                for k in range(12):
                    t=2*pi*k/12
                    p=center+tangent*axial+radial*(.045*cos(t))+Vector((0,.045*sin(t),0))
                    vertices.append(world(p))
            mesh('Command seat '+kind+' caster wheel',vertices,
                 [tuple(reversed(range(12))),tuple(range(12,24))]+
                 [(k,(k+1)%12,(k+1)%12+12,k+12) for k in range(12)],'Gasket',.002)

new_seats = [o for o in collection.objects if o.name.startswith('Command seat ')]
bpy.context.view_layer.update()
for kind, monitor in layout['monitors'].items():
    anchor=monitor['chair']; yaw=monitor['rotation']
    objects=[o for o in new_seats if o.name.startswith('Command seat '+kind+' ')]
    assert objects
    for o in objects:
        for vertex in o.data.vertices:
            p=o.matrix_world@vertex.co
            dx=p.x-anchor[0]; dz=-p.y-(anchor[2]-3.15)
            localx=dx*cos(yaw)-dz*sin(yaw)
            localz=dx*sin(yaw)+dz*cos(yaw)
            assert abs(localx)<=.421 and abs(localz)<=.421
            assert -.001<=p.z<=1.301
for old,obj in pairs:
    if old.name.startswith('Command seat '):continue
    assert old.matrix_world==obj.matrix_world and dict(old.items())==dict(obj.items())
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/bridge/bridge-interior-v18-seats.blend'))
print(f'V18 saved: four refined seats, {len(new_seats)} seat parts; original .84m square / 1.30m height envelopes verified. No runtime export.')
