"""Industrial bridge visual pass from exported runtime coordinates. No gameplay objects."""
from pathlib import Path
from math import sin,cos
import json,bpy,bmesh
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
layout=json.loads((ROOT/'docs/assets/bridge/layout.json').read_text())
NAME='Bridge - Industrial Interior V1'
assert NAME not in bpy.data.scenes
scene=bpy.data.scenes.new(NAME);scene.world=bpy.context.scene.world;bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'
collection=bpy.data.collections.new('BRIDGE V1 / Architecture');scene.collection.children.link(collection)
materials={}
for name,color,metal,rough,emission in [
    ('Graphite',(.055,.065,.075),.45,.5,0),('Ivory',(.52,.53,.48),.25,.48,0),
    ('Gasket',(.008,.012,.016),0,.85,0),('Metal',(.22,.25,.27),.65,.4,0),
    ('Amber',(.95,.57,.23),0,.4,1.2),('Cyan',(.02,.38,.46),0,.45,.7)]:
    mat=bpy.data.materials.new('BRIDGE V1 '+name);mat.use_nodes=True;mat.use_backface_culling=True
    p=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
    mat.diffuse_color=(*color,1);materials[name]=mat
def xyz(p):return Vector((p[0],-p[2],p[1]))
def mesh(name,vertices,faces,mat,bevel=.008):
    data=bpy.data.meshes.new(name);data.from_pydata([xyz(p) for p in vertices],[],faces)
    bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
    obj=bpy.data.objects.new(name,data);collection.objects.link(obj);data.materials.append(materials[mat])
    if bevel:
        mod=obj.modifiers.new('Manufactured edges','BEVEL');mod.width=bevel;mod.segments=2
    return obj
faces=[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)]
def box(name,at,size,mat,bevel=.008,pose=None):
    vertices=[]
    for x,y,z in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]:
        px,py,pz=[at[i]+v*size[i]/2 for i,v in enumerate([x,y,z])]
        if pose:
            yaw=pose['yaw'];px,pz=pose['x']+px*cos(yaw)+pz*sin(yaw),pose['z']-px*sin(yaw)+pz*cos(yaw)
        vertices.append((px,py,pz))
    return mesh(name,vertices,faces,mat,min(bevel,min(size)/3))
def beam(name,a,b,width,mat):
    start,end=xyz(a),xyz(b);direction=end-start
    obj=box(name,(0,0,0),(width,width,direction.length),mat,.006)
    # Box length is local Blender Y (game Z).
    obj.rotation_mode='QUATERNION';obj.rotation_quaternion=Vector((0,-1,0)).rotation_difference(direction.normalized())
    obj.location=(start+end)/2
    return obj
def prism(name,footprint,bottom,top,mat):
    n=len(footprint)
    return mesh(name,[(x,y,z) for y in [bottom,top] for x,z in footprint],
      [tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],mat,.012)

# Roof beams use the exact existing canopy edges, inside its collider envelope.
edges={}
for panel in layout['roof']:
    pts=panel['points']
    for i,a in enumerate(pts):
        b=pts[(i+1)%len(pts)];edges[tuple(sorted((tuple(a),tuple(b))))]=(a,b)
for a,b in edges.values():beam('Canopy structural frame',a,b,.12,'Graphite')
# Layered service tiles only on the opaque aft roof. Panoramic canopy remains open.
for z in [1.0,2.0,3.0,4.0,4.75]:
    for x in [-3.6,-2.4,-1.2,0,1.2,2.4,3.6]:
        box('Ceiling cassette',(x,3.27,z),(1.04,.07,.66),'Metal')
        box('Ceiling inset',(x,3.228,z),(.87,.012,.48),'Graphite',.003)
        for dx in [-.45,.45]:box('Cassette fastener',(x+dx,3.225,z),(.025,.012,.025),'Ivory',.003)
    for x in [-2.4,2.4]:
        box('Practical diffuser',(x,3.218,z),(.65,.012,.32),'Amber',.003)
    for dz in [-.15,-.05,.05,.15]:
        box('Central ventilation',(0,3.218,z+dz),(.65,.012,.023),'Metal',.002)

# Panoramic mullions: broad seals/backing sit behind narrower metal face strips.
outline=layout['outline']
def roof(z):return 3.3 if z>=.4 else 3.05+(z+3)/3.4*.25 if z>=-3 else 2.75+(max(-5.4,z)+5.4)/2.4*.3
for x,z in outline[1:7]:
    beam('Window gasket',(x,.8,z),(x,roof(z),z),.23,'Gasket')
    armor=beam('Window armor',(x,.8,z),(x,roof(z),z),.12,'Metal')
    # The metal face sits room-side of the gasket rather than buried inside it.
    armor.location += xyz((-x,0,-z)).normalized()*.10
for a,b in zip(outline[1:6],outline[2:7]):
    beam('Panoramic sill',(a[0],.80,a[1]),(b[0],.80,b[1]),.24,'Graphite')
    beam('Panoramic header',(a[0],roof(a[1]),a[1]),(b[0],roof(b[1]),b[1]),.18,'Metal')

# Exact miter footprints retain the existing collision boundary and monitor mounts.
for i,seg in enumerate(layout['consoles']):
    prism('Console base '+str(i),seg['footprint'],0,.94,'Graphite')
    prism('Console countertop '+str(i),seg['footprint'],.94,1.04,'Ivory')
    length=seg['length']
    for t in [-.28,0,.28]:
        x=t*length
        box('Console drawer',(x,.55,.526),(length*.25,.56,.018),'Metal',pose=seg)
        box('Drawer inset',(x,.55,.539),(length*.22,.48,.012),'Ivory',pose=seg)
        box('Drawer pull',(x,.73,.551),(.18,.026,.018),'Gasket',pose=seg)
        for j in range(4):box('Console vent',(x,.35+j*.03,.551),(.25,.008,.016),'Graphite',.002,seg)
    box('Console amber rail',(0,.91,.54),(length-.35,.022,.025),'Amber',.003,seg)
    # Small auxiliary readouts and physical switches stay below the main monitors.
    for x in [-length*.32,length*.32]:
        box('Instrument bezel',(x,1.055,-.22),(.38,.024,.28),'Graphite',.006,seg)
        box('Instrument face',(x,1.069,-.22),(.32,.004,.22),'Gasket',.001,seg)
        for j in range(4):box('Instrument trace',(x,1.073,-.29+j*.045),(.21-j*.025,.003,.009),'Cyan',.001,seg)
        for j in range(3):box('Console key',(x-.09+j*.09,1.063,.17),(.045,.04,.055),'Ivory',.004,seg)

# Editable source keeps every part; export joins temporary evaluated material batches.
deps=bpy.context.evaluated_depsgraph_get();temp=bpy.data.collections.new('Export temporary');scene.collection.children.link(temp)
groups={}
for obj in list(collection.objects):
    data=bpy.data.meshes.new_from_object(obj.evaluated_get(deps),depsgraph=deps);data.transform(obj.matrix_world)
    copy=bpy.data.objects.new('Export part',data);temp.objects.link(copy)
    groups.setdefault(data.materials[0].name,[]).append(copy)
for obj in scene.objects:obj.select_set(False)
batches=[]
for key,objects in groups.items():
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1:bpy.ops.object.join()
    objects[0].name='BRIDGE_RUNTIME_'+key.replace(' ','_');batches.append(objects[0]);objects[0].select_set(False)
for obj in batches:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/cruz-del-sur-bridge-interior.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_cameras=False,export_lights=False)
for obj in list(temp.objects):
    data=obj.data;bpy.data.objects.remove(obj,do_unlink=True)
    if data.users==0:bpy.data.meshes.remove(data)
bpy.data.collections.remove(temp)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'docs/assets/bridge/bridge-interior-v1.blend'))
print('Bridge V1 saved: roof, panoramic frames and console bodies. Six runtime batches; monitors/controls remain in React.')
