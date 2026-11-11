"""Live V2 revision; retains V1 scene and files. No runtime changes."""
from pathlib import Path
from math import sin, pi
import bpy
import bmesh
from mathutils import Vector, Matrix
import contextlib
import io

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/assets/arrival-room'
NAME='Arrival Room - Expanded V2'
assert NAME not in bpy.data.scenes, 'V2 already exists; do not duplicate.'
source=bpy.data.scenes['Arrival Room - Architectural Study']
scene=bpy.data.scenes.new(NAME)
bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'
scene.unit_settings.scale_length=1

def bulge(z):
    return .65*sin(pi*max(0,min(4.13,z))/4.13)**2

def deform(p):
    x,y,z=p.x,p.y,p.z # Blender: y=-game Z, z=height
    # Extend only port side, with unchanged ends and center circulation.
    x-=bulge(-y)*max(0,min(1,(-x-.5)/2.26))
    # Vault rises 38cm centrally; door tops and side shoulders retain their heights.
    z+=.38*max(0,1-(abs(x)/2.8)**2)*max(0,min(1,(z-2.45)/.55))
    return Vector((x,y,z))

collections={}
for src_col in source.collection.children:
    key=src_col.name.split(' / ')[-1]
    col=bpy.data.collections.new('ARRIVAL V2 / '+key)
    scene.collection.children.link(col)
    collections[key]=col
    for src in src_col.objects:
        obj=src.copy(); obj.data=src.data.copy()
        obj.name='ARR2 '+src.name.removeprefix('ARR ')
        col.objects.link(obj)
        if key=='Furniture':
            if obj.location.x<-.5:
                obj.location.x-=bulge(-obj.location.y)
        elif key!='Access references':
            # Bake world transforms before subdividing long surfaces to follow the bow.
            obj.data.transform(obj.matrix_world)
            obj.matrix_world=Matrix.Identity(4)
            bm=bmesh.new();bm.from_mesh(obj.data)
            # Subdivide only surfaces requiring curvature; keep end panels planar.
            if key in ['Window','Roof','Floor']:
                bmesh.ops.subdivide_edges(bm,edges=list(bm.edges),cuts=3,use_grid_fill=True)
            for v in bm.verts:v.co=deform(v.co)
            bm.to_mesh(obj.data);bm.free();obj.data.update()

def box(name,at,size,material,group='Floor',bevel=.004):
    mesh=bpy.data.meshes.new(name)
    sx,sy,sz=size[0]/2,size[2]/2,size[1]/2
    mesh.from_pydata([(a*sx,b*sy,c*sz) for a,b,c in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]],[],[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)])
    mesh.update()
    obj=bpy.data.objects.new('ARR2 '+name,mesh)
    collections[group].objects.link(obj)
    obj.location=(at[0],-at[2],at[1])
    mesh.materials.append(bpy.data.materials['ARRIVAL '+material])
    if bevel:
        mod=obj.modifiers.new('Manufactured edges','BEVEL');mod.width=bevel;mod.segments=2
    return obj

# Replace four actual floor plates with recessed grating assemblies (no overlay).
for obj in list(collections['Floor'].objects):
    if obj.name.startswith('ARR2 deck plate'):
        center=sum((v.co for v in obj.data.vertices),Vector())/len(obj.data.vertices)
        if abs(abs(center.x)-.7)<.15 and 1.1 < -center.y <3.1:
            bpy.data.objects.remove(obj,do_unlink=True)
for x in [-.7,.7]:
    for z in [1.549,2.582]:
        box('grating dark well',(x,-.029,z),(1.37,.012,1.0),'Gaskets')
        for dx in [-.665,.665]:box('grating side frame',(x+dx,-.008,z),(.04,.016,1.0),'Warm grey panels')
        for dz in [-.48,.48]:box('grating end frame',(x,-.008,z+dz),(1.29,.016,.04),'Warm grey panels')
        # Broad bars and true openings keep the pattern legible without microgeometry.
        for i in range(13):box('grating crossbar',(x,-.008,z-.42+i*.07),(1.29,.016,.032),'Graphite frame',bevel=.002)
        for dx in [-.60,.60]:
            for dz in [-.44,.44]:box('grating latch',(x+dx,.003,z+dz),(.055,.006,.035),'Gaskets',bevel=.001)

# Layered ceiling service panels follow the raised center without hanging into headroom.
for z in [.516,1.549,2.582,3.615]:
    box('ceiling recessed service surround',(0,3.29,z),(1.22,.065,.78),'Gaskets','Roof')
    box('ceiling service panel',(0,3.255,z),(1.08,.025,.64),'Warm grey panels','Roof')
    for x in [-.46,.46]:
        for dz in [-.23,.23]:box('ceiling service latch',(x,3.236,z+dz),(.065,.012,.035),'Graphite frame','Roof')
    for x in [-.80,.80]:
        box('ceiling vent surround',(x,3.22,z),(.18,.04,.65),'Gaskets','Roof')
        for i in range(7):box('ceiling vent vane',(x,3.19,z-.24+i*.08),(.14,.018,.025),'Warm grey panels','Roof',.002)

# Locker fronts and a toe-kick lamp add manufactured layers to the bowed lounge.
for obj in list(collections['Furniture'].objects):
    if obj.name.startswith('ARR2 bench locker'):
        x,y,z=obj.location
        box('locker inset face',(x+.397,.24,-y),(.014,.33,.68),'Warm grey panels','Furniture')
        box('bench foot light',(x+.405,.075,-y),(.018,.025,.62),'Amber lamps','Furniture',.002)

scene['stage']='V2 bowed port lounge, raised vault and recessed floor gratings; review only'
scene['port_expansion_m']=.65
scene['ceiling_rise_m']=.38
scene['game_translation']='[0,0,12.07]; runtime integration pending'
bpy.context.view_layer.update()
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        space=area.spaces.active
        eye=Vector((.7,-3.85,1.7));target=Vector((-.55,-.6,1.65))
        space.region_3d.view_rotation=(target-eye).to_track_quat('-Z','Y')
        space.region_3d.view_distance=(target-eye).length
        space.region_3d.view_location=target
        space.region_3d.view_perspective='PERSP'
        space.lens=22
        space.clip_start=.02
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'arrival-room-v2.blend'))
for obj in scene.objects:obj.select_set(obj.type=='MESH')
with contextlib.redirect_stdout(io.StringIO()):
    bpy.ops.export_scene.gltf(filepath=str(OUT/'arrival-room-v2.glb'),export_format='GLB',
        use_selection=True,use_active_scene=True,export_apply=True,export_yup=True,
        export_cameras=False,export_lights=False)
for obj in scene.objects:obj.select_set(False)
print('V2 created:',len(scene.objects),'objects; V1 preserved.')
