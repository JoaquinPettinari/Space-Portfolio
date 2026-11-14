"""Small additive game furnishing pass. Never changes the open source scene.

Coordinates come from the runtime layout, including its -3.15m placement.
All decorative pieces remain in existing furniture envelopes; no new colliders.
"""
from pathlib import Path
from math import sin, cos, pi
import bpy, bmesh, json
from mathutils import Vector

ROOT = Path(r'C:\Users\joaqu\Desktop\Space-Portfolio')
OUT = ROOT/'docs/assets/station-reference-interior'
previous = bpy.context.scene
scene = bpy.data.scenes.new('Runtime / Console seating and foliage details')
bpy.context.window.scene = scene
collection = bpy.data.collections.new('Runtime furnishings / editable source')
scene.collection.children.link(collection)
materials = {}
for name, color, metal, rough, emission in [
    ('Graphite', (.035,.029,.022), .15,.55,0),
    ('Metal', (.32,.27,.19), .75,.32,0),
    ('Ivory', (.42,.32,.17), .25,.5,0),
    ('Amber', (1,.48,.12), .1,.4,1.5),
    ('Leaf', (.12,.26,.025), 0,.57,0),
    ('Leaf light', (.25,.39,.055), 0,.6,0),
]:
    material=bpy.data.materials.new('FURNISH / '+name)
    material.use_nodes=True
    material.use_backface_culling=name not in ('Leaf','Leaf light')
    shader=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    shader.inputs['Base Color'].default_value=(*color,1)
    shader.inputs['Metallic'].default_value=metal
    shader.inputs['Roughness'].default_value=rough
    shader.inputs['Emission Color'].default_value=(*color,1)
    shader.inputs['Emission Strength'].default_value=emission
    materials[name]=material

# Reuse the source's metre-to-Blender conversion and simple modelling helpers.
base=(ROOT/'scripts/assets/build-bridge-interior-live.py').read_text()
exec(compile(base[base.index('def xyz'):base.index('# Roof beams')],'bridge-modelling-helpers','exec'))
layout=json.loads((ROOT/'docs/assets/bridge/layout.json').read_text())

try:
    for key, chair in {**layout['monitors'],**layout['sideChairs']}.items():
        pose={'x':chair['chair'][0], 'z':chair['chair'][2]-3.15, 'yaw':chair['rotation']}
        # Visible raised piping on the existing rear armor, within 0.42m radius.
        for side in (-1,1):
            box('Seat '+key+' tailored piping',(side*.235,.94,.413),(.009,.25,.008),'Ivory',.002,pose)
            for row in range(7):
                box('Seat '+key+' saddle stitch',(side*.218,.83+row*.033,.415),(.006,.012,.006),'Metal',0,pose)
            box('Seat '+key+' arm trim',(side*.35,.92,-.045),(.113,.006,.32),'Ivory',.002,pose)
        for row in range(3):
            box('Seat '+key+' headrest stitching',(0,1.20+row*.022,.371),(.24,.004,.006),'Ivory',0,pose)
        box('Seat '+key+' rear badge',(0,1.075,.416),(.075,.038,.007),'Metal',.002,pose)
        box('Seat '+key+' badge line',(0,1.075,.419),(.047,.004,.004),'Amber',0,pose)

    for index, seg in enumerate(layout['consoles']):
        if 'opening' not in seg:continue
        pose=dict(seg);pose['z']-=3.15
        opening=seg['opening']
        # At the keyboard edge, below the screen's lower edge, not over its face.
        box('Console control tray',(opening-.39,1.06,.28),(.14,.03,.24),'Graphite',.006,pose)
        for row in range(4):
            box('Console amber key',(opening-.41,1.078,.20+row*.05),(.026,.009,.025),'Amber',.002,pose)
            box('Console neutral key',(opening-.365,1.078,.20+row*.05),(.026,.009,.025),'Ivory',.002,pose)
        for side in (-1,1):
            box('Console maintenance label',(opening+side*.72,.77,.58),(.15,.042,.008),'Ivory',.002,pose)
            for row in range(3):
                box('Console label engraving',(opening+side*.72,.782-row*.009,.586),(.10-row*.018,.003,.003),'Graphite',0,pose)
            box('Console edge fastener',(opening+side*.48,1.045,.46),(.015,.009,.015),'Metal',.002,pose)

    # Two compact desk plants: clear of the side screens and shoulder passage.
    for side in (-1,1):
        cx,cz=side*4.05,-.38
        box('Planter substrate',(cx,1.22,cz),(.21,.018,.21),'Graphite',.005)
        # Faceted tapered metal pot, hollow appearance from inset dark substrate.
        verts=[(cx+r*cos(i*pi/6),y,cz+r*sin(i*pi/6)) for y,r in [(1.045,.105),(1.23,.14)] for i in range(12)]
        mesh('Brushed planter',verts,[(i,(i+1)%12,(i+1)%12+12,i+12) for i in range(12)],'Metal',.002)
        for y in (1.07,1.215):
            for i in range(12):
                a=i*pi/6;b=(i+1)*pi/6
                beam('Planter rolled rim',(cx+.141*cos(a),y,cz+.141*sin(a)),(cx+.141*cos(b),y,cz+.141*sin(b)),.009,'Metal')
        for branch in range(12):
            angle=branch*2.399
            reach=.18+(branch%3)*.035
            tip=Vector((cx+reach*cos(angle),1.47+(branch%4)*.065,cz+reach*sin(angle)))
            start=Vector((cx,1.23,cz))
            beam('Plant stem',tuple(start),tuple(tip),.006,'Leaf')
            for j in range(4):
                center=start.lerp(tip,.35+j*.2)
                a=angle+(-1 if j%2 else 1)*1.1
                direction=Vector((cos(a),.35,sin(a))).normalized()
                across=Vector((-sin(a),0,cos(a)))
                length=.17+(j%2)*.035
                end=center+direction*length
                mid=center+direction*length*.48
                ridge=mid+Vector((0,.014,0))
                # Folded, pointed leaves: no alpha texture or transparent sorting.
                vertices=[center,center+direction*length*.12+across*length*.33,mid+across*length*.48,end,mid-across*length*.48,center+direction*length*.12-across*length*.33,ridge]
                mesh('Folded pothos leaf',[tuple(v) for v in vertices],[(k,(k+1)%6,6) for k in range(6)],'Leaf light' if (branch+j)%3==0 else 'Leaf',0)

    bpy.context.view_layer.update()
    dg=bpy.context.evaluated_depsgraph_get()
    bounds=[]
    # Check EVERY evaluated vertex against the runtime shell (not only centers).
    for ob in collection.objects:
        evaluated=ob.evaluated_get(dg);data=evaluated.to_mesh()
        for v in data.vertices:
            p=ob.matrix_world@v.co;x,y,z=p.x,p.z,-p.y
            local_z=z+3.15
            width=4.8 if local_z>=.4 else 4.3+(local_z+3)/3.4*.5 if local_z>=-3 else 1.9+(local_z+5.4)
            assert -5.4<local_z<5.1 and abs(x)<width-.12 and 0<y<2.7,(ob.name,x,y,z)
            if ob.name.startswith('Seat '):
                key=ob.name.split(' ')[1]
                chair={**layout['monitors'],**layout['sideChairs']}[key]
                a=chair['rotation'];dx=x-chair['chair'][0];dz=z-(chair['chair'][2]-3.15)
                assert abs(dx*cos(a)-dz*sin(a))<.422 and abs(dx*sin(a)+dz*cos(a))<.422 and y<1.302,ob.name
            bounds.append((x,y,z))
        evaluated.to_mesh_clear()
    source_count=len(collection.objects)
    bpy.data.libraries.write(str(OUT/'runtime-furnishings.blend'),{scene},fake_user=True,compress=True)
    groups={}
    for ob in list(collection.objects):
        data=bpy.data.meshes.new_from_object(ob.evaluated_get(dg),depsgraph=dg)
        data.transform(ob.matrix_world)
        part=bpy.data.objects.new('Runtime furnishing batch',data);scene.collection.objects.link(part)
        groups.setdefault(data.materials[0].name,[]).append(part)
    for ob in list(collection.objects):
        data=ob.data
        bpy.data.objects.remove(ob,do_unlink=True)
        if data.users==0:bpy.data.meshes.remove(data)
    batches=[]
    for name,objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for ob in objects:ob.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:bpy.ops.object.join()
        objects[0].name=name.replace(' / ','_');batches.append(objects[0])
    bpy.ops.object.select_all(action='DESELECT')
    for ob in batches:ob.select_set(True)
    target=ROOT/'public/models/cruz-del-sur-furnishings.glb'
    bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_cameras=False,export_lights=False)
    report={'sourcePieces':source_count,'batches':len(batches),'bytes':target.stat().st_size,'allEvaluatedVerticesInsideShell':True,'newLights':0,'newTextures':0,'bounds':[[min(v[i] for v in bounds) for i in range(3)],[max(v[i] for v in bounds) for i in range(3)]]}
    (OUT/'runtime-furnishings.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report))
finally:
    bpy.context.window.scene=previous
    for ob in list(scene.objects):
        data=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
        if data and data.users==0:bpy.data.meshes.remove(data)
    bpy.data.scenes.remove(scene)
    bpy.data.collections.remove(collection)
    for material in materials.values():
        if material.users==0:bpy.data.materials.remove(material)
