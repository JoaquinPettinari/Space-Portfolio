"""Continuous yokes across upper modules, threshold and final design review."""
from pathlib import Path
import bpy,bmesh,json,math
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio');OUT=ROOT/'docs/assets/unified-ship'
scene=bpy.context.scene
assert scene.name=='CRUZ DEL SUR / Unified compact vessel'
assert not scene.get('structural_flow_finish')
skin=bpy.data.collections['UNIFIED / 04 Continuous shoulders and pressure shell'];roofcol=bpy.data.collections['UNIFIED / 05 Swept canopy and dorsal carapace']
details=bpy.data.collections['UNIFIED / 06 Structural seams vents and markings'];ribs=bpy.data.collections['UNIFIED / 07 Interior oblique ribs']
steel=bpy.data.materials['UNIFIED / Blue titanium'];armor=bpy.data.materials['UNIFIED / Graphite ceramic'];edge=bpy.data.materials['UNIFIED / Machined seam edges'];gasket=bpy.data.materials['UNIFIED / Deep pressure seals']
amber=bpy.data.materials['UNIFIED / Warm practical cores'];cyan=bpy.data.materials['UNIFIED / Cyan navigation markings']
source=(ROOT/'scripts/assets/build-unified-compact-ship-live.py').read_text(encoding='utf-8')
exec(compile(source[source.index('def xyz'):source.index('# Remove the temporary')],'unified-modelling-helpers','exec'))

# The spine stays open in its centre: these roof-edge yokes connect both pods
# without replacing the panorama with a second opaque corridor.
for side in (-1,1):
    slab('Command to connector upper yoke '+str(side),[(side*4.87,3.40,1.60),(side*4.94,3.17,1.92),(side*2.31,3.18,5.16),(side*2.25,3.40,5.16)],.10,armor,roofcol)
    beam('Continuous connector dorsal rail',(side*2.25,3.40,5.16),(side*2.25,3.40,11.18),.12,armor,roofcol)
    beam('Dorsal rail machined edge',(side*2.25,3.47,5.20),(side*2.25,3.47,11.12),.025,edge)
    slab('Connector to aft pod yoke '+str(side),[(side*2.25,3.40,11.10),(side*2.31,3.18,11.10),(side*4.96,2.57,12.82),(side*4.96,2.73,12.82)],.10,armor,roofcol)
    for z in [6.3,8.2,10.1]:box('Dorsal rail inset light',(side*2.25,3.42,z),(.025,.026,.32),amber)

# A real connecting apron closes the source-only gap between the portal floor
# and the retained arrival plates. Ends meet rather than stack coplanarly.
slab('Faceted receiving threshold apron',[(-1.70,-.026,11.20),(1.70,-.026,11.20),(5.10,-.026,11.86),(5.10,-.026,12.068),(-5.10,-.026,12.068),(-5.10,-.026,11.86)],.12,armor)
for side in (-1,1):beam('Receiving threshold path strip',(side*1.42,.004,11.27),(side*1.42,.004,12.04),.025,amber)

# Asymmetric technical bay by the portal, kept away from the credential reader.
mesh('Forward angled service recess',[(3.0,.52,12.105),(4.55,.76,12.105),(3.75,2.15,12.105),(3.0,2.15,12.105)],[(0,1,2,3)],gasket,details)
for j in range(5):
    y=.84+j*.16
    beam('Forward service bay diagonal vane',(3.16,y,12.135),(3.86-j*.075,y+.06,12.135),.025,edge)
beam('Forward service bay amber lip',(3.08,2.21,12.14),(3.73,2.21,12.14),.025,amber)

# Verify new opaque geometry never closes the human circulation/view corridor.
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
new_cols=[skin,roofcol,details,ribs]
vertices=[];faces=[];new_triangles=0;nonfinite=[];degenerate=0
for col in new_cols:
    for ob in col.objects:
        if ob.type!='MESH':continue
        evaluated=ob.evaluated_get(deps);data=evaluated.to_mesh()
        data.calc_loop_triangles();new_triangles+=len(data.loop_triangles)
        points=[ob.matrix_world@v.co for v in data.vertices]
        if any(not math.isfinite(value) for p in points for value in p):nonfinite.append(ob.name)
        degenerate+=sum(t.area<1e-12 for t in data.loop_triangles)
        material=ob.material_slots[0].material
        shader=next((n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) if material.use_nodes else None
        if not shader or shader.inputs['Alpha'].default_value>=.5:
            start=len(vertices);vertices.extend(points);faces.extend(tuple(start+i for i in p.vertices) for p in data.polygons)
        evaluated.to_mesh_clear()
tree=BVHTree.FromPolygons(vertices,faces)
checks=[]
for x in [-.75,0,.75]:
    for y in [.5,1.7,2.35]:
        origin=xyz((x,y,17.5));direction=xyz((0,0,-1));hit=tree.ray_cast(origin,direction,12.1)
        assert hit[0] is None,('Central circulation obstructed',x,y,hit)
        checks.append({'x':x,'height':y,'clear':True})
for z in [6.0,8.0,10.0]:
    for side in [-1,1]:
        hit=tree.ray_cast(xyz((0,1.7,z)),Vector((side,0,0)),5)
        assert hit[0] is None,('Panoramic lateral sightline obstructed',z,side,hit)
assert not nonfinite
assert degenerate==0,('Degenerate new triangles',degenerate)
scene['structural_flow_finish']=True
report={'scene':scene.name,'newEvaluatedTriangles':new_triangles,'newEditableMeshes':sum(len(c.objects) for c in new_cols),'meshObjectsInScene':sum(o.type=='MESH' for o in scene.objects),'previewLights':sum(o.type=='LIGHT' for o in scene.objects),'nonfiniteObjects':nonfinite,'degenerateNewTriangles':degenerate,'centralClearanceRays':checks,'sixLateralPanoramicRaysClear':True,'runtimeFilesModified':False,'fpsMeasured':False}
(OUT/'validation.json').write_text(json.dumps(report,indent=2))

# Review both the overall silhouette and the new inside-facing pressure shape.
scene.camera=bpy.data.objects['UNIFIED / Exterior three quarter'];scene.render.filepath=str(OUT/'unified-compact-hero.png');bpy.ops.render.render(write_still=True)
scene.camera=bpy.data.objects['UNIFIED / Upper deck close view'];scene.render.filepath=str(OUT/'unified-upper-deck-close.png');bpy.ops.render.render(write_still=True)
cam=bpy.data.objects['UNIFIED / Arrival toward glass spine']
cam.location=xyz((-.75,1.7,16.9));cam.rotation_euler=(xyz((1.0,1.9,11.5))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.camera=cam;scene.render.filepath=str(OUT/'unified-arrival-interior.png');bpy.ops.render.render(write_still=True)
scene.camera=bpy.data.objects['UNIFIED / Exterior three quarter'];scene.render.filepath=str(OUT/'unified-compact-hero.png')
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            space=area.spaces.active;space.region_3d.view_location=Vector((0,1,-1));space.region_3d.view_distance=65
            space.region_3d.view_rotation=scene.camera.rotation_euler.to_quaternion()
            modes=[i.identifier for i in space.region_3d.bl_rna.properties['view_perspective'].enum_items]
            if 'PERSP' in modes:space.region_3d.view_perspective='PERSP'
versions=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'cruz-del-sur-unified.blend'),compress=True)
finally:bpy.context.preferences.filepaths.save_version=versions
print('UNIFIED STRUCTURAL FLOW VALIDATED',json.dumps(report))
