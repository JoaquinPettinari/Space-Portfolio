"""Unified editable Blender design, preserving source scenes and runtime assets.

Metres in runtime coordinates: X starboard, Y up, Z aft. No game export here.
"""
from pathlib import Path
from math import sin,cos,pi
import bpy,bmesh,json
from mathutils import Vector

ROOT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio')
OUT=ROOT/'docs/assets/unified-ship';OUT.mkdir(parents=True,exist_ok=True)
NAME='CRUZ DEL SUR / Unified compact vessel'
assert NAME not in bpy.data.scenes,'Unified scene already exists; refine it instead of duplicating'
previous=bpy.context.scene
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'before-unification.blend'),copy=True,compress=True)
protected={o.name:(o.matrix_world.copy(),o.hide_render,o.hide_viewport) for o in previous.objects}
scene=bpy.data.scenes.new(NAME);bpy.context.window.scene=scene
scene.unit_settings.system='METRIC';scene.render.engine=previous.render.engine
def collection(name):
    c=bpy.data.collections.new('UNIFIED / '+name);scene.collection.children.link(c);return c
hull=collection('01 Lower hull - fitted working copy')
interior=collection('02 Interior and equipment - retained anchors')
corridor=collection('03 Panoramic connector - retained')
skin=collection('04 Continuous shoulders and pressure shell')
roofcol=collection('05 Swept canopy and dorsal carapace')
details=collection('06 Structural seams vents and markings')
ribs=collection('07 Interior oblique ribs')
rig=collection('PREVIEW Cameras and lights - no export')

def asset(filename,col,z=0):
    before=set(scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/models'/filename))
    added=set(scene.objects)-before
    for ob in added:
        if ob.parent is None:ob.location.y-=z
        for c in list(ob.users_collection):c.objects.unlink(ob)
        col.objects.link(ob)
        ob['runtime_reference_file']=filename
    return added
asset('cruz-del-sur-player-hull.glb',hull)
asset('cruz-del-sur-bridge-interior.glb',interior)
asset('cruz-del-sur-amber-details.glb',interior)
asset('cruz-del-sur-furnishings.glb',interior)
asset('cruz-del-sur-arrival-room.glb',interior,12.07)
for z in [6.1166666667,8.15,10.1833333333]:asset('cruz-del-sur-panoramic-bay.glb',corridor,z)

def mat(name,color,metal=.4,rough=.4,emission=0,alpha=1):
    m=bpy.data.materials.new('UNIFIED / '+name);m.use_nodes=True;m.diffuse_color=(*color,alpha)
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
    p.inputs['Alpha'].default_value=alpha
    if alpha<1:
        methods=[i.identifier for i in m.bl_rna.properties['surface_render_method'].enum_items]
        if 'DITHERED' in methods:m.surface_render_method='DITHERED'
        p.inputs['Transmission Weight'].default_value=.12
    return m
steel=mat('Blue titanium',(.115,.16,.19),.6,.38)
armor=mat('Graphite ceramic',(.04,.058,.073),.48,.43)
edge=mat('Machined seam edges',(.27,.34,.36),.72,.32)
gasket=mat('Deep pressure seals',(.008,.013,.018),.1,.7)
glass=mat('Panoramic smoked glass',(.045,.19,.25),.2,.23,0,.16)
amber=mat('Warm practical cores',(1,.43,.10),.05,.35,3)
cyan=mat('Cyan navigation markings',(.025,.48,.58),.1,.35,1.4)
ivory=mat('Warm identification stencil',(.65,.57,.39),.25,.5)

def xyz(p):return Vector((p[0],-p[2],p[1]))
def mesh(name,vertices,faces,material,col=skin,bevel=0):
    data=bpy.data.meshes.new(name);data.from_pydata([xyz(p) for p in vertices],[],faces)
    bm=bmesh.new();bm.from_mesh(data)
    zero=[f for f in bm.faces if f.calc_area()<1e-12]
    if zero:bmesh.ops.delete(bm,geom=zero,context='FACES')
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
    ob=bpy.data.objects.new('CDS U / '+name,data);col.objects.link(ob);data.materials.append(material)
    if bevel:
        mod=ob.modifiers.new('Manufactured edge radius','BEVEL');mod.width=bevel;mod.segments=2
    return ob
def box(name,p,size,material,col=details,bevel=.008):
    vs=[tuple(p[i]+v[i]*size[i]/2 for i in range(3)) for v in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]]
    return mesh(name,vs,[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)],material,col,min(bevel,min(size)/3))
def beam(name,a,b,width,material,col=details,depth=None):
    start,end=xyz(a),xyz(b);direction=end-start
    ob=box(name,(0,0,0),(width,width if depth is None else depth,direction.length),material,col,.006)
    ob.rotation_mode='QUATERNION';ob.rotation_quaternion=Vector((0,-1,0)).rotation_difference(direction.normalized());ob.location=(start+end)/2
    return ob
def slab(name,points,thickness,material,col=skin):
    n=len(points);normal=(Vector(points[1])-Vector(points[0])).cross(Vector(points[2])-Vector(points[0])).normalized()
    axis=max(range(3),key=lambda i:abs(normal[i]))
    outward=sum(p[axis] for p in points)/n if axis==0 else 1
    if normal[axis]*outward<0:normal.negate()
    vertices=points+[tuple(Vector(p)-normal*thickness) for p in points]
    ob=mesh(name,vertices,[tuple(range(n)),tuple(reversed(range(n,2*n)))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],material,col,.012)
    ob['unified_panel_thickness']=thickness
    return ob

# Remove the temporary rectangular foundation from this working copy only.
for ob in hull.objects:
    if ob.type!='MESH':continue
    bm=bmesh.new();bm.from_mesh(ob.data)
    faces=[f for f in bm.faces if all(abs((ob.matrix_world@v.co).z+.251)<.00015 for v in f.verts)]
    if faces:bmesh.ops.delete(bm,geom=faces,context='FACES')
    bm.to_mesh(ob.data);bm.free()

# A faceted continuous collar grows from the lower hull, narrows around the glass
# connector and opens into the aft pressure pod. Each panel remains editable.
# z, outer halfwidth, inner halfwidth, upper shoulder height
stations=[(-11.4,4.9,2.15,-.08),(-9.1,5.85,2.2,.35),(-8.55,6.05,2.12,.72),(-6.15,6.45,4.48,.80),(-2.75,6.65,4.97,1.05),(1.95,6.65,4.97,1.05),(3.3,6.5,1.95,.78),(5.1,6.3,2.23,.65),(8.15,6.05,2.23,.65),(11.2,5.95,2.23,.65),(12.07,5.95,5.35,.72),(14.5,5.85,5.35,.72),(17.4,5.65,5.15,.70),(18.6,5.35,4.8,.68),(20.4,3.7,.8,-.05)]
for side in (-1,1):
    for i,(a,b) in enumerate(zip(stations,stations[1:])):
        z,w,inner,h=a;zz,ww,inn,hh=b
        points=[(side*inner,h,z),(side*w,-.32,z),(side*ww,-.32,zz),(side*inn,hh,zz)]
        slab('Continuous shoulder %s %02d'%(side,i),points,.10,steel)
        beam('Shoulder perimeter rail',(side*w,-.27,z),(side*ww,-.27,zz),.055,edge)
        beam('Pressure collar recessed seam',(side*inner,h+.016,z),(side*inn,hh+.016,zz),.035,gasket)
        if i in (2,3,4,7,8,11):
            t=.45;mid=tuple(points[0][k]*(1-t)+points[3][k]*t for k in range(3))
            out=tuple(points[1][k]*(1-t)+points[2][k]*t for k in range(3))
            for f in [.25,.38,.51,.64]:
                p=tuple(mid[k]*(1-f)+out[k]*f for k in range(3))
                beam('Shoulder diagonal cooling fin',(p[0],p[1]+.025,p[2]-.23),(p[0]+side*.045,p[1]+.025,p[2]+.23),.025,gasket)

# Main command pod: swept window belt rather than a rectangular upper building.
layout=json.loads((ROOT/'docs/assets/bridge/layout.json').read_text())
outline=[(x,z-3.15) for x,z in layout['outline']]
def ceiling(local_z):return 3.3 if local_z>=.4 else 3.05+(local_z+3)/3.4*.25 if local_z>=-3 else 2.75+(max(-5.4,local_z)+5.4)/2.4*.3
for i,(a,b) in enumerate(zip(outline[1:6],outline[2:7])):
    ax,az=a;bx,bz=b;ah=ceiling(az+3.15);bh=ceiling(bz+3.15)
    mesh('Command panoramic facet %02d'%i,[(ax,.85,az),(bx,.85,bz),(bx,bh-.10,bz),(ax,ah-.10,az)],[(0,1,2,3)],glass,roofcol)
    slab('Lower swept bridge sill %02d'%i,[(ax*1.015,.65,az-.03),(bx*1.015,.65,bz-.03),(bx*1.01,.84,bz),(ax*1.01,.84,az)],.09,armor)
    beam('Bridge outer pressure mullion',(ax,.82,az),(ax,ah+.06,az),.095,armor,roofcol)
    beam('Bridge forward visor edge',(ax,ah+.06,az),(bx,bh+.06,bz),.11,edge,roofcol)

for panel in layout['roof']:
    points=[(x,y+.06,z-3.15) for x,y,z in panel['points']]
    if panel['glass']:mesh('Command roof aperture',points,[(0,1,2,3)],glass,roofcol)
    else:slab('Dorsal canopy spine',points,.085,armor,roofcol)

# Tall aft flanks of command pod rake outwards into the same shoulder collar.
for side in (-1,1):
    slab('Command raked pressure cheek '+str(side),[(side*4.97,1.0,-2.75),(side*4.97,1.0,1.95),(side*4.88,3.38,1.65),(side*4.88,3.38,-2.65)],.11,armor)
    slab('Command roof chamfer '+str(side),[(side*4.88,3.38,-2.65),(side*4.88,3.38,1.65),(side*3.8,3.54,1.35),(side*3.8,3.54,-2.35)],.10,steel,roofcol)
    # Swept buttress converges toward the glass connector, staying outside it.
    slab('Converging command buttress '+str(side),[(side*4.9,3.34,1.6),(side*4.98,.95,1.95),(side*2.33,.68,4.92),(side*2.35,1.16,4.92)],.12,steel)
    beam('Buttress warm navigation slash',(side*4.89,2.88,1.97),(side*2.44,.95,4.6),.025,amber)

# Aft pod: long chamfered carapace with a descending tail; faceted roof over the
# existing pressure space. The port observation windows remain open below it.
roof_stations=[(11.8,3.55,3.52,5.1,2.65),(12.8,3.9,3.63,5.35,2.62),(15.5,3.8,3.60,5.35,2.60),(17.9,3.4,3.46,5.05,2.52),(18.75,2.9,3.18,4.8,1.6),(20.1,1.6,1.0,3.7,.1)]
for i,(a,b) in enumerate(zip(roof_stations,roof_stations[1:])):
    z,w,h,o,oh=a;zz,ww,hh,oo,ooh=b
    slab('Aft dorsal carapace %02d'%i,[(-w,h,z),(w,h,z),(ww,hh,zz),(-ww,hh,zz)],.12,armor if i%2 else steel,roofcol)
    for side in (-1,1):
        slab('Aft roof shoulder %s %02d'%(side,i),[(side*w,h,z),(side*o,oh,z),(side*oo,ooh,zz),(side*ww,hh,zz)],.10,steel,roofcol)
        beam('Aft carapace longitudinal seam',(side*w,h+.025,z),(side*ww,hh+.025,zz),.045,gasket)
        if i<3:beam('Aft canopy warm edge',(side*(o-.05),oh-.045,z+.16),(side*(oo-.05),ooh-.045,zz-.16),.025,amber)

# Sloping roof ribs define the aft pod from inside, instead of a flat room box.
# They stay outside the central 2.68m x 2.50m circulation aperture.
for z in [13.35,15.45,17.4]:
    points=[(-4.6,.85,z),(-4.25,2.40,z),(-3.05,3.18,z),(2.85,3.18,z),(3.78,2.42,z),(4.0,.03,z)]
    for i,(a,b) in enumerate(zip(points,points[1:])):beam('Aft internal oblique rib %s %s'%(z,i),a,b,.10,armor,ribs)
    for side in (-1,1):
        a=(side*3.65,2.68,z-.055);b=(side*3.0,3.08,z-.055)
        beam('Aft diagonal amber practical',a,b,.025,amber,ribs)
    # Asymmetric overhead utility spine makes the circulation direction legible.
    box('Offset overhead service trunk',(1.1,3.14,z),(.44,.12,1.75),armor,ribs)

# Connector stays glazed. Low guards and folded collars replace an exposed
# greenhouse-on-a-platform appearance, without covering eye-height scenery.
for side in (-1,1):
    for z in [5.2,7.18,9.2,11.1]:
        beam('Connector diagonal brace',(side*2.24,.68,z-.22),(side*2.24,1.0,z+.20),.065,edge)
    beam('Connector low continuous pressure rail',(side*2.22,.70,5.15),(side*2.22,.70,11.15),.065,armor)
    beam('Connector cyan running line',(side*2.22,.75,5.23),(side*2.22,.75,11.07),.018,cyan)

# Restrained roof equipment integrated into the aft carapace, not a separate box.
for side in (-1,1):
    for j,z in enumerate([13.15,14.45,15.75]):
        box('Flush carapace radiator bed',(side*2.3,3.67,z),(1.0,.08,.8),gasket)
        for k in range(6):box('Carapace radiator fin',(side*2.3,3.72,z-.30+k*.12),(.85,.035,.025),edge)
    for z in [12.3,17.0]:box('Recessed carapace latch',(side*3.25,3.66,z),(.14,.045,.27),edge)
beam('Low swept sensor mast',(0,3.66,15.5),(.0,4.55,16.1),.09,armor)
box('Sensor mast cyan tip',(0,4.55,16.1),(.12,.045,.12),cyan)

# Source-only lights: soft exterior review plus warm practical fill inside.
world=bpy.data.worlds.new('UNIFIED / Space review world');world.use_nodes=True
background=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND')
background.inputs['Color'].default_value=(.035,.045,.065,1);background.inputs['Strength'].default_value=.45;scene.world=world
def area(name,location,target,power,size,color=(1,1,1)):
    light=bpy.data.lights.new('UNIFIED / '+name,'AREA');light.energy=power;light.color=color;light.size=size
    ob=bpy.data.objects.new(light.name,light);rig.objects.link(ob);ob.location=xyz(location);ob.rotation_euler=(xyz(target)-ob.location).to_track_quat('-Z','Y').to_euler();return ob
area('Exterior key',(25,32,-30),(0,0,0),45000,35,(.78,.87,1))
area('Exterior fill',(-25,18,-3),(0,0,0),28000,25,(1,.85,.63))
area('Exterior rim',(4,25,30),(0,0,5),22000,25,(.65,.82,1))
for z in [-4,0,7.8,14,17]:area('Warm interior fill '+str(z),(0,2.8,z),(0,0,z),140,2.2,(1,.63,.30))
def camera(name,position,target,ortho=None,lens=24):
    data=bpy.data.cameras.new('UNIFIED / '+name);data.lens=lens
    if ortho:data.type='ORTHO';data.ortho_scale=ortho
    ob=bpy.data.objects.new(data.name,data);rig.objects.link(ob);ob.location=xyz(position);ob.rotation_euler=(xyz(target)-ob.location).to_track_quat('-Z','Y').to_euler();return ob
hero=camera('Exterior three quarter',(43,31,-52),(0,-1.2,-1),68)
camera('Upper deck close view',(22,16,-17),(0,1.4,5),38)
camera('Arrival toward glass spine',(0,1.7,17.0),(0,1.9,10.0),lens=20)
camera('Bridge toward aft ribs',(0,1.7,-4.6),(0,1.8,5),lens=22)
scene.camera=hero;scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
formats=[i.identifier for i in scene.render.image_settings.bl_rna.properties['file_format'].enum_items]
scene.render.image_settings.file_format=next(i for i in formats if i=='PNG')
scene['design_scope']='Unified compact working design. Original scenes/runtime files preserved; not exported to game.'
scene['circulation_clearance']='Central route X +/-1.34m, Y<=2.5m retained; geometry review, no new game collider validation.'
bpy.context.view_layer.update()
for name,(matrix,render,viewport) in protected.items():
    ob=bpy.data.objects[name];assert ob.matrix_world==matrix and ob.hide_render==render and ob.hide_viewport==viewport,name
for ob in scene.objects:ob.select_set(False)
for ob in skin.objects:ob.select_set(True)
bpy.context.view_layer.objects.active=next(iter(skin.objects))
for screen in bpy.data.screens:
    for ar in screen.areas:
        if ar.type=='VIEW_3D':ar.spaces.active.shading.type='SOLID'
scene.render.filepath=str(OUT/'unified-compact-hero.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'cruz-del-sur-unified.blend'),compress=True)
bpy.ops.render.render(write_still=True)
report={'scene':NAME,'file':bpy.data.filepath,'meshObjects':sum(o.type=='MESH' for o in scene.objects),'newEditableMeshes':sum(o.type=='MESH' for c in [skin,roofcol,details,ribs] for o in c.objects),'lights':sum(o.type=='LIGHT' for o in scene.objects),'originalScenePreserved':True,'runtimeFilesModified':False,'glassConnectorPreserved':True}
(OUT/'validation.json').write_text(json.dumps(report,indent=2))
print('UNIFIED DESIGN',json.dumps(report))
