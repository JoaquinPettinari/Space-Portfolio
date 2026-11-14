"""Extend only the bow beyond the bridge in the working copy."""
from pathlib import Path
import bpy,bmesh,hashlib
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];folder=ROOT/'docs/assets/bridge'
output=folder/'crash-investigation/bridge-antennas-validated.blend'
assert Path(bpy.data.filepath).resolve()==output.resolve()
collection=bpy.data.collections['SHIP / Primary forms']
assert not collection.get('extended_bow')
protected=folder/'bridge-interior-final.blend';checksum=hashlib.sha256(protected.read_bytes()).hexdigest()
targets=[bpy.data.objects[n] for n in ('01 Continuous faceted hull','02 Broad bow upper deck')]
fixed={o:o.matrix_world.copy() for o in bpy.context.scene.objects}
hinge=8.7;old_tip=20.;new_tip=30.
factor=(new_tip-hinge)/(old_tip-hinge)
changed=0
for o in targets:
    previous=[v.co.copy() for v in o.data.vertices]
    for v in o.data.vertices:
        if v.co.y>hinge:
            v.co.y=hinge+(v.co.y-hinge)*factor;changed+=1
    for v,p in zip(o.data.vertices,previous):
        assert v.co.x==p.x and v.co.z==p.z
        if p.y<=hinge:assert v.co==p
    o.data.update()
    bm=bmesh.new();bm.from_mesh(o.data);assert all(e.is_manifold for e in bm.edges);bm.free()
for o,m in fixed.items():assert o.matrix_world==m
bpy.context.view_layer.update()
collection['extended_bow']=True
collection['bow_extension_metres']=10.
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        target=Vector((0,5.4,0));eye=Vector((45,34,20));r=area.spaces.active.region_3d
        r.view_rotation=(target-eye).to_track_quat('-Z','Y');r.view_distance=57;r.view_location=target;r.view_perspective='ORTHO'
old=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=1
    bpy.ops.wm.save_as_mainfile(filepath=str(output),compress=True)
finally:bpy.context.preferences.filepaths.save_version=old
assert hashlib.sha256(protected.read_bytes()).hexdigest()==checksum
print('Bow tip Y20 -> Y30; total length 49.13m. Forebody beyond bridge 21.3m; aft beyond bridge 16.98m unchanged. Width/height/topology and other objects unchanged. Changed vertices:',changed)
