"""Final placement corrections, engine mouths and output renders."""
import bpy
import bmesh
import math
import random
from pathlib import Path
from mathutils import Vector

ROOT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio')
OUT=ROOT/'docs/assets/cruz-del-sur-exterior'
scene=bpy.context.scene
cam=bpy.data.objects['CDS | Reference three quarter']
cam.data.lens=53
q=cam.rotation_euler.to_quaternion()
center=cam.location+(q@Vector((0,0,-1)))*300+(q@Vector((1,0,0)))*95-(q@Vector((0,1,0)))*190
globe=bpy.data.objects['CDS PREVIEW | Planet']
globe.location=center
globe.scale=(200/112,)*3
# An opaque atmospheric shell casts shadows in EEVEE; use the planet shader's limb.
atmosphere=bpy.data.objects['CDS PREVIEW | Atmospheric limb']
atmosphere.hide_render=True
atmosphere.hide_viewport=True
mat=bpy.data.materials['CDS PREVIEW / Procedural ocean and cloud bands']
noise=next(n for n in mat.node_tree.nodes if n.type=='TEX_NOISE')
noise.inputs['Distortion'].default_value=.35
noise.inputs['Scale'].default_value=9
n=mat.node_tree.nodes
l=mat.node_tree.links
principled=next(n for n in n if n.type=='BSDF_PRINCIPLED')
ramp=next(n for n in n if n.type=='VALTORGB')
fres=n.new('ShaderNodeFresnel')
fres.inputs['IOR'].default_value=1.08
mix=n.new('ShaderNodeMixRGB')
mix.blend_type='MIX'
mix.inputs[2].default_value=(.14,.37,.65,1)
l.new(fres.outputs[0],mix.inputs[0])
l.new(ramp.outputs[0],mix.inputs[1])
l.new(mix.outputs[0],principled.inputs['Emission Color'])
principled.inputs['Emission Strength'].default_value=.65

engineering=bpy.data.collections['CDS 05 / Engines and cooling']
details=bpy.data.collections['CDS 06 / Service details']
edge=bpy.data.materials['CDS / Machined edges']
black=bpy.data.materials['CDS / Deep recess']
graphite=bpy.data.materials['CDS / Ceramic graphite']
cyan=bpy.data.materials['CDS / Ion cyan']

def annulus(name,x,y,z,outer,inner,depth,mat):
    vs=[]
    N=48
    for yy,r in [(y,outer),(y,inner),(y+depth,inner),(y+depth,outer)]:
        vs.extend((x+math.cos(i*math.tau/N)*r,yy,z+math.sin(i*math.tau/N)*r) for i in range(N))
    fs=[]
    for ring in range(4):
        for i in range(N):
            fs.append((ring*N+i,ring*N+(i+1)%N,((ring+1)%4)*N+(i+1)%N,((ring+1)%4)*N+i))
    me=bpy.data.meshes.new(name)
    me.from_pydata(vs,[],fs)
    me.update()
    me.materials.append(mat)
    ob=bpy.data.objects.new(name,me)
    engineering.objects.link(ob)
    mod=ob.modifiers.new('Nozzle lip radius','BEVEL')
    mod.width=.015
    mod.segments=2
    return ob

# Model actual annular mouths rather than stacked solid disks.
for o in list(engineering.objects):
    if 'Nested ion nozzle' in o.name:
        o.hide_render=True
        o.hide_viewport=True
for x in [-4.5,0,4.5]:
    annulus('CDS | Engine machined mouth',x,-19.64,-1.35,1.24,1.05,.38,edge)
    annulus('CDS | Engine recessed throat',x,-19.6,-1.35,1.055,.76,.44,black)
    annulus('CDS | Engine inner ceramic collar',x,-19.54,-1.35,.79,.66,.26,graphite)
    annulus('CDS | Engine plasma ring',x,-19.47,-1.35,.65,.49,.08,cyan)
    annulus('CDS | Engine center baffle',x,-19.46,-1.35,.48,.18,.1,black)
    annulus('CDS | Engine inner plasma',x,-19.4,-1.35,.18,.02,.05,cyan)
    for i in range(12):
        a=i*math.tau/12
        # Narrow radial baffles, aligned in the nozzle plane.
        ra,rb=.8,1.06
        da=.025
        vs=[(x+math.cos(a+d)*r,yy,-1.35+math.sin(a+d)*r) for yy in [-19.62,-19.39] for r,d in [(ra,-da),(rb,-da),(rb,da),(ra,da)]]
        me=bpy.data.meshes.new('Nozzle radial vane')
        me.from_pydata(vs,[],[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)])
        me.materials.append(graphite)
        o=bpy.data.objects.new('CDS | Nozzle radial vane',me)
        engineering.objects.link(o)

# Make gallery interiors less uniform; preserve long continuous glazing.
random.seed(44)
for o in bpy.data.collections['CDS 03 / Windows and running lights'].objects:
    if 'Gallery illuminated bay' in o.name:
        # Object vertices use world coordinates, so scale around their own centroid.
        if random.random()<.25:
            o.hide_render=True
            o.hide_viewport=True
        else:
            center=sum((v.co for v in o.data.vertices),Vector())/len(o.data.vertices)
            f=random.uniform(.55,1.6)
            for v in o.data.vertices:v.co.y=center.y+(v.co.y-center.y)*f

# Tone correction and bow fittings follow the rising underside.
for o in bpy.data.collections['CRUZ DEL SUR / REFERENCE EXTERIOR'].all_objects:
    if o.type=='MESH' and any(k in o.name for k in ['Flush docking lamp','Cyan running light','Running light socket']):
        pts=[o.matrix_world@v.co for v in o.data.vertices]
        if pts:
            y=sum(p.y for p in pts)/len(pts)
            if y>23:
                low=-3.05+(y-22)*(.9/5.5) if y<27.5 else -2.15+(y-27.5)*(.9/2.5)
                dz=max(0,low+.35-min(p.z for p in pts))
                for v in o.data.vertices:v.co.z+=dz
for o in bpy.data.collections['CDS 01 / Continuous hull'].objects:
    if 'Long bow deck' in o.name or 'Aft engineering deck' in o.name:
        o.data.materials[0]=graphite
for i,o in enumerate(bpy.data.collections['CDS 02 / Armor and structural rails'].objects):
    if 'Dorsal armor slab' in o.name and i%3:o.data.materials[0]=graphite
    if o.type=='MESH' and any(k in o.name for k in ['Longitudinal armored rail','Rail polished lip']):
        if any(p.area<1e-10 for p in o.data.polygons):
            h=.025 if 'polished' in o.name else .12
            for j,v in enumerate(o.data.vertices):
                y=v.co.y
                low=-3.8+(y-9)*(.75/13) if y<=22 else -3.05+(y-22)*(.9/5.5)
                v.co.z=low+.3+(h if j%4>=2 else 0)
            o.data.update()
            bm=bmesh.new()
            bm.from_mesh(o.data)
            bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
            bm.to_mesh(o.data)
            bm.free()
for o in bpy.data.collections['CDS 07 / Livery and identification'].objects:
    if o.type=='MESH' and 'Southern Cross star' in o.name:
        s=1 if o.data.vertices[0].co.x>0 else -1
        half=len(o.data.vertices)//2
        for i,v in enumerate(o.data.vertices):v.co.x=s*(7.385+(.008 if i>=half else 0))
for o in bpy.data.collections['CDS 04 / Exterior bridge shell'].objects:
    if 'Overhanging bridge roof' in o.name:o.data.materials[0]=graphite
bpy.data.objects['CDS | Large cool key'].data.energy=18000
bpy.data.objects['CDS | Warm solar rim'].data.energy=24000
bpy.data.objects['CDS | Port-side long softbox'].data.energy=11000

# Final camera is comfortably framed for its full bow and stern.
scene.camera=cam
scene.render.resolution_x=1800
scene.render.resolution_y=1000
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(OUT/'cruz-del-sur-hero.png')
for a in bpy.context.screen.areas:
    if a.type=='VIEW_3D':
        a.spaces.active.region_3d.view_perspective='CAMERA'
        a.spaces.active.shading.type='MATERIAL'
        a.spaces.active.shading.use_scene_lights=True
        a.spaces.active.shading.use_scene_world=True
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'cruz-del-sur-exterior.blend'))
print('POLISH SAVED')
