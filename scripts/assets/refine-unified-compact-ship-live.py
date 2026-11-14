"""Replace the leftover aft room box with an editable faceted pressure pod."""
from pathlib import Path
import bpy,bmesh,json,re
from mathutils import Vector
ROOT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio')
OUT=ROOT/'docs/assets/unified-ship'
scene=bpy.context.scene
assert scene.name=='CRUZ DEL SUR / Unified compact vessel'
assert not scene.get('faceted_aft_pod_refinement')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'unified-first-shell.blend'),copy=True,compress=True)
skin=bpy.data.collections['UNIFIED / 04 Continuous shoulders and pressure shell']
roofcol=bpy.data.collections['UNIFIED / 05 Swept canopy and dorsal carapace']
details=bpy.data.collections['UNIFIED / 06 Structural seams vents and markings']
ribs=bpy.data.collections['UNIFIED / 07 Interior oblique ribs']
interior=bpy.data.collections['UNIFIED / 02 Interior and equipment - retained anchors']
steel=bpy.data.materials['UNIFIED / Blue titanium'];armor=bpy.data.materials['UNIFIED / Graphite ceramic']
edge=bpy.data.materials['UNIFIED / Machined seam edges'];gasket=bpy.data.materials['UNIFIED / Deep pressure seals']
glass=bpy.data.materials['UNIFIED / Panoramic smoked glass'];amber=bpy.data.materials['UNIFIED / Warm practical cores']
cyan=bpy.data.materials['UNIFIED / Cyan navigation markings'];ivory=bpy.data.materials['UNIFIED / Warm identification stencil']
source=(ROOT/'scripts/assets/build-unified-compact-ship-live.py').read_text(encoding='utf-8')
exec(compile(source[source.index('def xyz'):source.index('# Remove the temporary')],'unified-modelling-helpers','exec'))

# Keep individual source furnishings and window parts, not the old rectangular
# roof/wall box embedded in material batches. Originals remain untouched.
old_arrival=[o for o in interior.objects if o.get('runtime_reference_file')=='cruz-del-sur-arrival-room.glb']
canonical=lambda name:re.sub(r'\.\d{3}$','',name)
warm_mats={canonical(slot.material.name):slot.material for o in old_arrival for slot in o.material_slots if slot.material}
source_scene=bpy.data.scenes['Arrival Room - Spacious V10']
retained=0;skipped=[]
for col in source_scene.collection.children:
    category=col.name.split(' / ')[-1]
    for old in col.objects:
        if old.type!='MESH':continue
        if category in {'Roof','Walls','Wall trims','Door adapters','Access references','Closure details'} or 'locker inset face' in old.name:
            skipped.append(old.name);continue
        if 'Access surround'==category and max((old.matrix_world@Vector(v)).z for v in old.bound_box)>3.1:
            skipped.append(old.name);continue
        ob=old.copy();ob.name='CDS U / Retained '+old.name;interior.objects.link(ob)
        ob.matrix_world=old.matrix_world.copy();ob.location.y-=12.07
        ob['source_scene']='Arrival Room - Spacious V10';ob['original_object']=old.name
        for slot in ob.material_slots:
            key=canonical(slot.material.name) if slot.material else ''
            if key in warm_mats:slot.link='OBJECT';slot.material=warm_mats[key]
        retained+=1
for ob in old_arrival:
    data=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
    if data and data.users==0:bpy.data.meshes.remove(data)

# Raked starboard armor closes the rear pod; the port side remains panoramic.
segments=[(11.98,5.10,4.92,2.66),(12.8,5.35,5.0,2.62),(15.5,5.35,5.0,2.60),(17.9,5.10,4.85,2.52),(18.55,4.75,3.35,2.85)]
for i,(a,b) in enumerate(zip(segments,segments[1:])):
    z,bottom,top,height=a;zz,bb,tt,hh=b
    slab('Starboard folded pressure wall %02d'%i,[(bottom,.70,z),(bb,.70,zz),(tt,hh,zz),(top,height,z)],.10,armor)
    beam('Starboard armored shoulder seam',(bottom,.73,z),(bb,.73,zz),.05,edge)
    if i<3:
        beam('Starboard slanted wall rib',(bottom,.76,z+.12),(top,height-.05,z+.12),.075,steel)
        beam('Starboard inset amber slit',(bottom-.06,1.04,z+.3),(top-.03,height-.23,z+.3),.022,amber)
    # Narrow, inset port panes sit beneath the roof chamfer, following the slope.
    if i<3:
        mesh('Port observation sloped pane %02d'%i,[(-bottom,.80,z+.10),(-bb,.80,zz-.10),(-tt,hh-.10,zz-.10),(-top,height-.10,z+.10)],[(0,1,2,3)],glass,roofcol)
        beam('Port observation divider',(-bottom,.78,z+.08),(-top,height-.06,z+.08),.085,armor,roofcol)
        slab('Port pressure plinth %02d'%i,[(-bottom,.72,z),(-bb,.72,zz),(-bb,.05,zz),(-bottom,.05,z)],.08,armor)

# A swept faceted end, with an actual entrance aperture, replaces the flat box
# facade. All central clearance stays X +/-1.34m, floor..2.50m.
def ring(name,outer,inner,z,depth,material):
    n=len(outer);assert n==len(inner)
    vs=[(x,y,zz) for zz in [z,z+depth] for points in [outer,inner] for x,y in points]
    fs=[]
    for i in range(n):
        j=(i+1)%n
        fs.extend([(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)])
    ob=mesh(name,vs,fs,material,skin,0)
    bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.triangulate(bm,faces=list(bm.faces))
    zero=[f for f in bm.faces if f.calc_area()<1e-12]
    if zero:bmesh.ops.delete(bm,geom=zero,context='FACES')
    bm.to_mesh(ob.data);bm.free()
    ob.data.update();ob.data.calc_loop_triangles()
    bad={t.polygon_index for t in ob.data.loop_triangles if t.area<1e-12}
    if bad:
        bm=bmesh.new();bm.from_mesh(ob.data);bm.faces.ensure_lookup_table()
        bmesh.ops.delete(bm,geom=[bm.faces[i] for i in bad],context='FACES');bm.to_mesh(ob.data);bm.free();ob.data.update()
    return ob
outer=[(-5.1,.0),(-5.1,1.9),(-3.55,3.52),(-2.65,3.58),(2.65,3.58),(3.55,3.52),(5.1,1.9),(5.1,.0)]
inner=[(-1.34,0),(-1.34,2.50),(-.9,2.75),(-.45,2.80),(.45,2.80),(.9,2.75),(1.34,2.50),(1.34,0)]
ring('Forward octagonal pressure collar',outer,inner,11.86,.12,armor)
for a,b in zip(inner,inner[1:]+inner[:1]):beam('Forward collar chamfer trim',(a[0],a[1],11.835),(b[0],b[1],11.835),.045,edge)
for side in (-1,1):
    beam('Forward collar diagonal light',(side*1.49,.35,12.02),(side*1.49,2.30,12.02),.028,amber)
    slab('Forward collar swept equipment wing '+str(side),[(side*1.62,.28,12.03),(side*4.9,.68,12.03),(side*3.7,2.60,12.03),(side*1.62,2.60,12.03)],.09,steel)
rear=[(-4.75,0),(-4.75,1.35),(-3.25,2.9),(-2.1,3.3),(2.1,3.3),(3.25,2.9),(4.75,1.35),(4.75,0)]
rear_inner=[(-1.2,0),(-1.2,2.3),(-.9,2.55),(-.5,2.58),(.5,2.58),(.9,2.55),(1.2,2.3),(1.2,0)]
ring('Aft docking pressure collar',rear,rear_inner,18.42,.14,armor)
box('Docking inner pressure hatch',(0,1.23,18.50),(2.37,2.46,.09),steel,skin,.035)
box('Docking hatch dark viewport',(0,1.63,18.44),(.72,.30,.04),gasket)
box('Docking hatch cyan status',(0,1.64,18.415),(.48,.025,.015),cyan)
for side in (-1,1):beam('Docking inclined collar practical',(side*1.37,.55,18.39),(side*1.37,2.17,18.39),.025,amber)

# Connect the carapace to its shoulders rather than leaving a roof visor floating
# above the pressure walls. Preserve the stepped, rearward-descending silhouette.
for side in (-1,1):
    slab('Aft continuous roof shoulder lip '+str(side),[(side*4.92,2.66,11.98),(side*5.0,2.62,12.8),(side*5.35,2.62,12.8),(side*5.1,2.65,11.98)],.08,steel,roofcol)
    slab('Aft continuous roof shoulder lip mid '+str(side),[(side*5.0,2.62,12.8),(side*5.0,2.60,15.5),(side*5.35,2.60,15.5),(side*5.35,2.62,12.8)],.08,steel,roofcol)
    slab('Aft continuous roof shoulder lip rear '+str(side),[(side*5.0,2.60,15.5),(side*4.85,2.52,17.9),(side*5.05,2.52,17.9),(side*5.35,2.60,15.5)],.08,steel,roofcol)

# Body-aligned service cladding breaks the remaining flat interior panels into
# technical bays without filling the central circulation space.
for z in [13.9,16.0,17.5]:
    slab('Interior starboard sloped service bay '+str(z),[(4.21,.45,z-.55),(4.21,.45,z+.55),(3.98,2.32,z+.48),(3.98,2.32,z-.48)],.045,armor,ribs)
    beam('Interior service bay upper lip',(3.97,2.34,z-.45),(3.97,2.34,z+.45),.03,edge,ribs)

scene['faceted_aft_pod_refinement']=True
(OUT/'aft-pod-refinement.json').write_text(json.dumps({'retainedSourceObjects':retained,'excludedOldBoxParts':skipped,'runtimeFilesModified':False},indent=2))
scene.camera=bpy.data.objects['UNIFIED / Exterior three quarter']
scene.render.filepath=str(OUT/'unified-compact-hero.png')
bpy.ops.render.render(write_still=True)
scene.camera=bpy.data.objects['UNIFIED / Arrival toward glass spine']
scene.render.filepath=str(OUT/'unified-arrival-interior.png')
bpy.ops.render.render(write_still=True)
scene.camera=bpy.data.objects['UNIFIED / Exterior three quarter']
scene.render.filepath=str(OUT/'unified-compact-hero.png')
versions=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'cruz-del-sur-unified.blend'),compress=True)
finally:bpy.context.preferences.filepaths.save_version=versions
print('FACETED AFT POD',retained,'source furnishings retained;',len(skipped),'old box pieces excluded')
