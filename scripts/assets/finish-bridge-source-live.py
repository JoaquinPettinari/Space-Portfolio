"""Finish editable bridge only; no runtime export. Write standalone scene files."""
from pathlib import Path
from math import sin, cos
import json, bpy, bmesh
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[2]
folder = ROOT/'docs/assets/bridge'
source = bpy.data.scenes['Bridge - Ergonomic Seats V18']
# A standalone rollback contains only the scene and its dependencies.
bpy.data.libraries.write(str(folder/'bridge-interior-backup.blend'), {source}, fake_user=True, compress=True)
scene = bpy.data.scenes.new('Bridge - Finished Interior')
scene.world = source.world
scene.unit_settings.system = 'METRIC'
bpy.context.window.scene = scene
collection = bpy.data.collections.new('BRIDGE / Architecture')
scene.collection.children.link(collection)
rig = bpy.data.collections.new('PREVIEW ONLY / Lighting - exclude from GLB')
scene.collection.children.link(rig)
materials = {}
pairs = []
for old in source.objects:
    obj = old.copy(); obj.data = old.data.copy()
    (rig if old.type == 'LIGHT' else collection).objects.link(obj)
    pairs.append((old,obj))
    if old.type == 'MESH':
        for slot in obj.material_slots:
            materials[slot.material.name.removeprefix('BRIDGE V15 ')] = slot.material
base = (ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')], __file__, 'exec'))
existing = set(collection.objects)
layout = json.loads((folder/'layout.json').read_text())
# Flush service plates on the newly closed hull, behind the desks. All plates
# stay below the glazing, outside knee bays and away from screen apertures.
outline = [Vector((x,z-3.15)) for x,z in layout['outline']]
from math import atan2, ceil
for i,(a,b) in enumerate(zip(outline,outline[1:])):
    d=b-a; length=d.length; tangent=d.normalized()
    inward=Vector((-tangent.y,tangent.x))
    count=max(1,ceil(length/1.4))
    for j in range(count):
        center=a.lerp(b,(j+.5)/count)+inward*.012
        pose={'x':center.x,'z':center.y,'yaw':atan2(-tangent.y,tangent.x)}
        width=length/count-.14
        box('Hull service facing',(0,.39,0),(width,.58,.018),'Metal',.006,pose)
        box('Hull recessed panel',(0,.39,.012),(width-.06,.50,.008),'Graphite',.003,pose)
        for side in (-1,1):
            for height in (.16,.62):
                box('Hull captive fixing',(side*(width/2-.06),height,.019),(.022,.022,.009),'Metal',.003,pose)
# Console rear upstands separate countertop from glazing, without adding another
# screen or hiding the existing interface. Preserve interaction ownership.
for i,seg in enumerate(layout['consoles']):
    pose=dict(seg);pose['z']-=3.15
    before=set(collection.objects)
    box('Console rear cable channel',(0,1.07,-.49),(seg['length']-.20,.075,.065),'Graphite',.008,pose)
    for side in (-1,1):
        box('Console cable cover',(side*seg['length']*.26,1.112,-.49),(.20,.012,.045),'Metal',.003,pose)
    # Decorative pieces share a workstation action only where that desk has one.
    owner={0:'arcade',2:'computer',4:'communications',6:'personal'}.get(i)
    if owner:
        for obj in set(collection.objects)-before:obj['interaction']=owner
# Discrete manufactured grip details on the tactical frame, outside the aperture.
for side in (-1,1):
    for z in (-.44,-.22,0,.22,.44):
        obj=box('Tactical grip inset',(side*.985,1.068,-2.65+z),(.045,.006,.10),'Gasket',.002)
        obj['interaction']='tactical'
new=set(collection.objects)-existing
for obj in new:
    uv=obj.data.uv_layers.new(name='Surface metres')
    for poly in obj.data.polygons:
        axis=max(range(3),key=lambda k:abs(poly.normal[k]));axes=[k for k in range(3) if k!=axis]
        for li in poly.loop_indices:
            p=obj.data.vertices[obj.data.loops[li].vertex_index].co
            uv.data[li].uv=(p[axes[0]],p[axes[1]])
bpy.context.view_layer.update()
for old,obj in pairs:
    assert old.matrix_world==obj.matrix_world and dict(old.items())==dict(obj.items())
    if old.type=='MESH':
        assert len(old.data.vertices)==len(obj.data.vertices)
        assert all(a.co==b.co for a,b in zip(old.data.vertices,obj.data.vertices))
assert len(rig.objects)==4
bpy.data.libraries.write(str(folder/'bridge-interior-final.blend'), {scene}, fake_user=True, compress=True)
print('Saved standalone final and backup; added',len(new),'finishing meshes. Existing geometry and interaction metadata unchanged.')
