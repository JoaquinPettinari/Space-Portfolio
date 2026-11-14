"""Temporary external assembly review of actual runtime assets. No source save."""
from pathlib import Path
import bpy,json
from mathutils import Vector
ROOT=Path(r'C:\Users\joaqu\Desktop\Space-Portfolio')
prior=bpy.context.scene
old_objects=set(bpy.data.objects);old_meshes=set(bpy.data.meshes);old_materials=set(bpy.data.materials);old_images=set(bpy.data.images)
old_lights=set(bpy.data.lights);old_cameras=set(bpy.data.cameras);old_worlds=set(bpy.data.worlds)
scene=bpy.data.scenes.new('TEMP / Player ship asset assembly review')
bpy.context.window.scene=scene
try:
    def asset(name,z=0):
        before=set(scene.objects)
        bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/models'/name))
        for ob in set(scene.objects)-before:
            if ob.parent is None:ob.location.y-=z
    asset('cruz-del-sur-player-hull.glb')
    asset('cruz-del-sur-bridge-interior.glb')
    asset('cruz-del-sur-amber-details.glb')
    asset('cruz-del-sur-furnishings.glb')
    asset('cruz-del-sur-arrival-room.glb',12.07)
    for z in [6.1166666667,8.15,10.1833333333]:asset('cruz-del-sur-panoramic-bay.glb',z)
    # Runtime procedural canopy surfaces, taken from the same layout manifest.
    layout=json.loads((ROOT/'docs/assets/bridge/layout.json').read_text())
    glass=bpy.data.materials.new('REVIEW / Runtime canopy glass');glass.use_nodes=True
    p=next(n for n in glass.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(.08,.18,.23,1);p.inputs['Metallic'].default_value=.15;p.inputs['Roughness'].default_value=.25
    def panel(name,points):
        data=bpy.data.meshes.new(name);data.from_pydata([(x,-z,y) for x,y,z in points],[],[(0,1,2),(0,2,3)])
        ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);data.materials.append(glass)
    for entry in layout['roof']:
        if entry['glass']:panel('Runtime canopy',[(x,y,z-3.15) for x,y,z in entry['points']])
    outline=layout['outline']
    def roof(z):return 3.3 if z>=.4 else 3.05+(z+3)/3.4*.25 if z>=-3 else 2.75+(max(-5.4,z)+5.4)/2.4*.3
    for a,b in zip(outline[1:6],outline[2:7]):panel('Runtime forward window',[(a[0],.8,a[1]-3.15),(b[0],.8,b[1]-3.15),(b[0],roof(b[1]),b[1]-3.15),(a[0],roof(a[1]),a[1]-3.15)])
    scene.render.engine=prior.render.engine
    scene.render.resolution_x=1440;scene.render.resolution_y=900;scene.render.resolution_percentage=100
    formats=[i.identifier for i in scene.render.image_settings.bl_rna.properties['file_format'].enum_items]
    scene.render.image_settings.file_format=next(i for i in formats if i=='PNG')
    world=bpy.data.worlds.new('REVIEW / Dark space');world.use_nodes=True
    background=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND')
    background.inputs['Color'].default_value=(.035,.045,.065,1);background.inputs['Strength'].default_value=.55;scene.world=world
    for location,power,size in [((20,35,32),45000,35),((-28,0,18),30000,30),((5,-35,25),20000,25)]:
        light=bpy.data.lights.new('REVIEW / Softbox','AREA');light.energy=power;light.shape='DISK';light.size=size
        ob=bpy.data.objects.new(light.name,light);scene.collection.objects.link(ob);ob.location=location;ob.rotation_euler=(Vector((0,2,-1))-ob.location).to_track_quat('-Z','Y').to_euler()
    camera=bpy.data.cameras.new('REVIEW / Assembly camera');ob=bpy.data.objects.new(camera.name,camera);scene.collection.objects.link(ob)
    ob.location=(43,52,33);ob.rotation_euler=(Vector((0,3,-1.5))-ob.location).to_track_quat('-Z','Y').to_euler();camera.type='ORTHO';camera.ortho_scale=68;scene.camera=ob
    scene.render.filepath=str(ROOT/'docs/assets/station-reference-interior/game-player-ship/upper-deck-assembly.png')
    bpy.ops.render.render(write_still=True)
    print('Rendered runtime asset assembly:',scene.render.filepath)
finally:
    bpy.context.window.scene=prior
    for ob in set(bpy.data.objects)-old_objects:bpy.data.objects.remove(ob,do_unlink=True)
    bpy.data.scenes.remove(scene)
    for mesh in set(bpy.data.meshes)-old_meshes:
        if mesh.users==0:bpy.data.meshes.remove(mesh)
    for material in set(bpy.data.materials)-old_materials:
        if material.users==0:bpy.data.materials.remove(material)
    for img in set(bpy.data.images)-old_images:
        if img.users==0:bpy.data.images.remove(img)
    for datablocks,before in [(bpy.data.lights,old_lights),(bpy.data.cameras,old_cameras),(bpy.data.worlds,old_worlds)]:
        for data in set(datablocks)-before:
            if data.users==0:datablocks.remove(data)
