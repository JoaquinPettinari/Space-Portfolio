"""Inspect and build an isolated bridge-ceiling study. No runtime export.

blender --background docs/assets/unified-ship/cruz-del-sur-interior-panels.blend
  --python scripts/assets/study-bridge-ceiling.py -- --inspect
"""
import bpy
import bmesh
from array import array
import hashlib
import json
import math
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'docs/assets/bridge-ceiling-study'
OUT.mkdir(parents=True,exist_ok=True)
SOURCE = Path(bpy.data.filepath)
assert SOURCE.name=='cruz-del-sur-interior-panels.blend'
scene = bpy.data.scenes['CRUZ DEL SUR / Unified compact vessel']
bpy.context.window.scene = scene
bpy.context.view_layer.update()

def bounds(points):
    return [[min(v[i] for v in points),max(v[i] for v in points)] for i in range(3)]

def components(obj):
    """Reconnect normals-split GLB vertices only to classify original solids."""
    count = len(obj.data.vertices)
    parent = list(range(count))
    def find(i):
        while parent[i]!=i:
            parent[i]=parent[parent[i]]
            i=parent[i]
        return i
    def union(a,b):
        a,b=find(a),find(b)
        if a!=b: parent[b]=a
    positions = [obj.matrix_world@v.co for v in obj.data.vertices]
    seen = {}
    for i,point in enumerate(positions):
        key = tuple(round(c,5) for c in point)
        if key in seen: union(i,seen[key])
        else: seen[key]=i
    for edge in obj.data.edges:
        union(*edge.vertices)
    groups = {}
    for i in range(count):groups.setdefault(find(i),[]).append(i)
    return [(indices,bounds([positions[i] for i in indices])) for indices in groups.values()]

inventory = []
for obj in scene.objects:
    if obj.type=='MESH' and obj.name.startswith('BRIDGE_RUNTIME_BRIDGE_V15_'):
        for indices,extent in components(obj):
            if extent[2][0]>2.7 and extent[1][1]>-1:
                inventory.append({'object':obj.name,'vertices':len(indices),'bounds':extent})
(OUT/'source-ceiling-components.json').write_text(json.dumps(inventory,indent=2))
print('CEILING_COMPONENTS',len(inventory),flush=True)

if '--inspect' in sys.argv:
    data = bpy.data.cameras.new('Ceiling source review')
    data.lens = 19
    camera = bpy.data.objects.new('Ceiling source review',data)
    scene.collection.objects.link(camera)
    camera.location = (0,-2.55,1.70)
    camera.rotation_euler = (Vector((0,4.6,2.1))-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.camera = camera
    try:scene.render.engine='CYCLES'
    except TypeError as error:raise RuntimeError(str(error))
    scene.cycles.samples=24
    scene.cycles.use_denoising=True
    scene.render.resolution_x=1280
    scene.render.resolution_y=800
    scene.render.resolution_percentage=75
    scene.render.image_settings.file_format='PNG'
    scene.render.filepath=str(OUT/'source-ceiling-overview.png')
    bpy.ops.render.render(write_still=True)

if '--inspect' not in sys.argv:
    source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    source_objects = list(scene.objects)

    def signature(obj):
        digest = hashlib.sha256()
        digest.update(str((tuple(v for row in obj.matrix_world for v in row),obj.hide_render,
                           obj.hide_viewport,obj.parent.name if obj.parent else None)).encode())
        if obj.type=='MESH':
            coords = array('f',[0])*(len(obj.data.vertices)*3)
            obj.data.vertices.foreach_get('co',coords)
            digest.update(coords.tobytes())
            loops = array('i',[0])*len(obj.data.loops)
            obj.data.loops.foreach_get('vertex_index',loops)
            digest.update(loops.tobytes())
            digest.update(str([m.name if m else None for m in obj.data.materials]).encode())
        return digest.hexdigest()

    before = {obj.name:signature(obj) for obj in source_objects}
    def protected_faces(obj):
        positions = [obj.matrix_world@v.co for v in obj.data.vertices]
        faces = []
        for face in obj.data.polygons:
            if min(positions[i].y for i in face.vertices)<=-1.0:
                faces.append(tuple(sorted(tuple(round(v,6) for v in positions[i]) for i in face.vertices)))
        return hashlib.sha256(str(sorted(faces)).encode()).hexdigest()

    collections = {}
    for name in ('00 Original ceiling archived - hidden','01 Angular transverse ribs',
                 '02 Recessed opaque ceiling cassettes','03 Warm spine and cyan fixtures',
                 '04 Preview lights and cameras - no export'):
        col = bpy.data.collections.new('CEILING STUDY / '+name)
        scene.collection.children.link(col)
        collections[name] = col
    archive = collections['00 Original ceiling archived - hidden']
    archive.hide_render = True
    archive.hide_viewport = True

    replaced = []
    modified = set()
    for obj in source_objects:
        if obj.type!='MESH' or not obj.name.startswith('BRIDGE_RUNTIME_BRIDGE_V15_'):
            continue
        chosen = set()
        for indices,extent in components(obj):
            # Complete old luminaire/panel solids only. Preserve the rear row
            # straddling the protected shelves, all structural frames and glass.
            if (extent[2][0]>=3.19 and extent[2][1]<=3.315 and
                extent[1][0]>=-.20 and extent[1][1]<=2.50 and
                max(abs(v) for v in extent[0])<=4.20):
                chosen.update(indices)
        if not chosen:
            continue
        protected_before = protected_faces(obj)
        old = obj.copy()
        old.data = obj.data.copy()
        old.name = 'ARCHIVE / Replaced ceiling / '+obj.name
        archive.objects.link(old)
        bm = bmesh.new()
        bm.from_mesh(old.data)
        bm.verts.ensure_lookup_table()
        bmesh.ops.delete(bm,geom=[v for v in bm.verts if v.index not in chosen],context='VERTS')
        bm.to_mesh(old.data)
        bm.free()
        obj.data = obj.data.copy()
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bm.verts.ensure_lookup_table()
        bmesh.ops.delete(bm,geom=[v for v in bm.verts if v.index in chosen],context='VERTS')
        bm.to_mesh(obj.data)
        bm.free()
        assert protected_faces(obj)==protected_before,'Protected rear geometry changed'
        modified.add(obj.name)
        replaced.append({'batch':obj.name,'archivedVertices':len(chosen),'protectedFacesUnchanged':True})

    def material(name,color,metal,rough,emission=0):
        mat = bpy.data.materials.new('CEILING / '+name)
        mat.use_nodes=True
        mat.diffuse_color=(*color,1)
        shader = next(node for node in mat.node_tree.nodes if node.type=='BSDF_PRINCIPLED')
        shader.inputs['Base Color'].default_value=(*color,1)
        shader.inputs['Metallic'].default_value=metal
        shader.inputs['Roughness'].default_value=rough
        shader.inputs['Emission Color'].default_value=(*color,1)
        shader.inputs['Emission Strength'].default_value=emission
        return mat

    graphite = material('Satin graphite structural metal',(.055,.070,.082),.65,.39)
    panels = material('Recessed blue grey ceramic alloy',(.095,.115,.132),.43,.50)
    black = material('Deep gasket and ventilation recess',(.008,.012,.016),.08,.72)
    edge = material('Muted champagne machined edge',(.25,.205,.145),.76,.33)
    warm = material('Warm frosted spine diffuser',(1,.53,.22),.05,.42,3)
    cyan = material('Restrained cyan service indicator',(.045,.57,.70),.05,.40,2.6)
    new_geometry = []

    def finish(obj,name,mat,collection,zone,bevel=.008):
        obj.name='CEILING / '+name
        for col in list(obj.users_collection):col.objects.unlink(obj)
        collections[collection].objects.link(obj)
        obj.data.materials.append(mat)
        obj['ceiling_study_zone']=zone
        obj['exclude_runtime_export']=True
        if bevel:
            mod=obj.modifiers.new('Manufactured edge radius','BEVEL')
            mod.width,mod.segments=bevel,3
            obj.modifiers.new('Face weighted normals','WEIGHTED_NORMAL')
        new_geometry.append(obj)
        return obj

    def box(name,position,size,mat,col,zone='opaque',bevel=.008):
        bpy.ops.mesh.primitive_cube_add(size=1,location=position)
        obj=bpy.context.object
        obj.dimensions=size
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        return finish(obj,name,mat,col,zone,bevel)

    def beam(name,a,b,width,height,mat,col,zone='opaque',bevel=.008):
        a,b=Vector(a),Vector(b)
        direction=(b-a).normalized()
        side=Vector((-direction.y,direction.x,0)).normalized()
        up=direction.cross(side).normalized()
        vertices=[tuple(p+side*s*width/2+up*t*height/2) for p in (a,b)
                  for s,t in ((-1,-1),(1,-1),(1,1),(-1,1))]
        faces=[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
        mesh=bpy.data.meshes.new(name)
        mesh.from_pydata(vertices,[],faces)
        mesh.update()
        obj=bpy.data.objects.new(name,mesh)
        collections[col].objects.link(obj)
        return finish(obj,name,mat,col,zone,bevel)

    rib_col='01 Angular transverse ribs'
    panel_col='02 Recessed opaque ceiling cassettes'
    light_col='03 Warm spine and cyan fixtures'
    for index,y in enumerate((-.26,1.20,2.60)):
        points=[(-4.70,y,2.82),(-3.85,y,3.10),(3.85,y,3.10),(4.70,y,2.82)]
        for segment,(a,b) in enumerate(zip(points,points[1:])):
            beam(f'Angular rib {index} segment {segment}',a,b,.18,.16,graphite,rib_col)
            # Thin inset edge follows the underside without creating a second beam.
            aa=Vector(a)+Vector((0,-.095,-.025))
            bb=Vector(b)+Vector((0,-.095,-.025))
            beam(f'Rib machined edge {index} {segment}',aa,bb,.018,.025,edge,rib_col,bevel=.003)
        for side in (-1,1):
            box(f'Wall termination {index} {side}',(side*4.72,y,2.84),(.12,.25,.27),graphite,rib_col)
            box(f'Rib end captive plate {index} {side}',(side*4.65,y-.102,2.87),(.07,.018,.16),edge,rib_col,bevel=.003)

    for row,(a,b) in enumerate(((-.14,1.06),(1.34,2.51))):
        center=(a+b)/2
        length=b-a
        for side in (-1,1):
            for column,x in enumerate((1.03,2.77)):
                x*=side
                width=1.47 if column==0 else 1.65
                box(f'Cassette shadow well {row} {side} {column}',(x,center,3.245),
                    (width+.08,length,.022),black,panel_col)
                box(f'Recessed cassette face {row} {side} {column}',(x,center,3.219),
                    (width-.07,length-.11,.030),panels,panel_col,bevel=.015)
                for xx in (x-width/2,x+width/2):
                    box(f'Cassette longitudinal frame {row} {side} {column}',(xx,center,3.177),
                        (.055,length,.045),graphite,panel_col)
                for yy in (a+.025,b-.025):
                    box(f'Cassette transverse frame {row} {side} {column}',(x,yy,3.177),
                        (width,.050,.045),graphite,panel_col)
                for xx in (x-width/2+.1,x+width/2-.1):
                    for yy in (a+.13,b-.13):
                        box(f'Captive panel screw {row} {side} {column}',(xx,yy,3.199),
                            (.032,.032,.012),edge,panel_col,bevel=.004)
                if column==0:
                    box(f'Ventilation well {row} {side}',(x,center,3.194),(.75,.60,.025),black,panel_col)
                    for i in range(7):
                        box(f'Ventilation fin {row} {side} {i}',(x,center-.24+i*.08,3.169),
                            (.67,.018,.035),graphite,panel_col,bevel=.003)
                else:
                    box(f'Cyan service light bezel {row} {side}',(side*1.96,center,3.164),
                        (.095,.66,.035),black,light_col)
                    box(f'Cyan service diffuser {row} {side}',(side*1.96,center,3.141),
                        (.032,.53,.012),cyan,light_col,bevel=.003)

    def spine_floor(y):
        if y<=2.75:return 3.275
        if y<=6.15:return 3.275-(y-2.75)*.125/1.7
        return 3.025-(y-6.15)*.15/1.2

    for index,(a,b) in enumerate(((-.14,1.06),(1.34,2.51),(2.85,4.34),
                                 (4.56,6.04),(6.26,7.24),(7.46,8.40))):
        zone='opaque' if b<2.75 else 'spine'
        beam(f'Central spine luminaire {index}',(0,a,spine_floor(a)-.045),
            (0,b,spine_floor(b)-.045),.30,.07,graphite,light_col,zone)
        beam(f'Central spine warm diffuser {index}',(0,a+.09,spine_floor(a+.09)-.088),
            (0,b-.09,spine_floor(b-.09)-.088),.125,.014,warm,light_col,zone,bevel=.004)
        for y in (a+.045,b-.045):
            box(f'Spine clamp {index}',(0,y,spine_floor(y)-.077),(.28,.045,.025),edge,light_col,zone,bevel=.004)

    # These trims occupy the existing opaque frame footprints only; the sky
    # apertures and all glass meshes remain unchanged and exposed.
    crossbars=[(4.45,4.45,3.085),(6.15,4.20,2.955),(7.35,3.00,2.805)]
    for index,(y,half_width,z) in enumerate(crossbars):
        beam(f'Skylight frame underside {index}',(-half_width,y,z),(half_width,y,z),
            .10,.055,graphite,rib_col,'crossbar',bevel=.006)
        for side in (-1,1):
            beam(f'Skylight frame cyan guide {index} {side}',
                (side*(half_width*.55-.32),y,z-.034),(side*(half_width*.55+.32),y,z-.034),
                .028,.010,cyan,light_col,'crossbar',bevel=.002)

    rig=collections['04 Preview lights and cameras - no export']
    def area_light(name,position,target,power,color,width,length):
        data=bpy.data.lights.new('CEILING PREVIEW / '+name,'AREA')
        data.energy=power
        data.color=color
        data.shape='RECTANGLE'
        data.size=width
        data.size_y=length
        obj=bpy.data.objects.new(data.name,data)
        rig.objects.link(obj)
        obj.location=position
        obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
        obj['exclude_runtime_export']=True
        return obj
    for y in (.45,1.93):
        area_light('Warm spine bounce',(0,y,3.01),(0,y,.2),50,(1,.66,.36),.25,1.0)
    for side in (-1,1):
        area_light('Cyan cove wash',(side*1.96,.46,3.07),(side*2.2,.46,2.0),7,(.16,.65,1),.18,.52)

    views=[]
    for name,position,target,lens in (
        ('Forward overview',(0,-2.55,1.70),(0,4.6,2.1),19),
        ('Ceiling diagonal',(2.85,-.10,1.65),(-1.4,2.8,2.75),20),
        ('Ceiling detail',(-1.5,.75,1.9),(.35,1.50,3.19),24)):
        data=bpy.data.cameras.new('CEILING REVIEW / '+name)
        data.lens=lens
        obj=bpy.data.objects.new(data.name,data)
        rig.objects.link(obj)
        obj.location=position
        obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
        obj['exclude_runtime_export']=True
        views.append(obj)

    # Verify all non-replaced objects exactly, including every window, shelf,
    # portal, chair, console, floor, source light and source camera.
    for obj in source_objects:
        if obj.name not in modified:
            assert signature(obj)==before[obj.name],f'Protected object changed: {obj.name}'
    triangles=0
    all_bounds=[]
    depsgraph=bpy.context.evaluated_depsgraph_get()
    for obj in new_geometry:
        extent=bounds([obj.matrix_world@Vector(v) for v in obj.bound_box])
        assert extent[1][0]>-.40 and extent[2][0]>2.64,f'Ceiling clearance: {obj.name}: {extent}'
        zone=obj['ceiling_study_zone']
        if zone=='opaque':
            assert extent[1][1]<2.74 and max(abs(v) for v in extent[0])<4.81,f'Opaque roof footprint: {obj.name}: {extent}'
        elif zone=='spine':
            assert max(abs(v) for v in extent[0])<=.151,'Spine blocks a skylight'
        else:
            assert any(extent[1][0]>=y-.061 and extent[1][1]<=y+.061 for y,_,_ in crossbars)
        mesh=obj.evaluated_get(depsgraph).to_mesh()
        mesh.calc_loop_triangles()
        triangles+=len(mesh.loop_triangles)
        obj.evaluated_get(depsgraph).to_mesh_clear()
        all_bounds.append(extent)
    assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash
    scene.name='CRUZ DEL SUR / Bridge ceiling study'
    scene.camera=views[0]
    scene.render.engine='CYCLES'
    scene.cycles.samples=32
    scene.cycles.use_denoising=True
    scene.render.resolution_x=1280
    scene.render.resolution_y=800
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene['ceiling_study_scope']='Ceiling only, protected Y<=-1; all glass and furniture retained; no runtime export'
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=='VIEW_3D':
                area.spaces.active.region_3d.view_perspective='CAMERA'
                area.spaces.active.shading.type='MATERIAL'
    bpy.ops.object.select_all(action='DESELECT')
    destination=OUT/'bridge-ceiling-study.blend'
    try:
        bpy.ops.wm.save_as_mainfile(filepath=str(destination))
    except RuntimeError:
        # Windows may transiently refuse Blender's final rename after writing
        # a complete temporary file. Never overwrite an existing destination.
        pending=destination.with_name(destination.name+'@')
        if destination.exists() or not pending.is_file():raise
        with pending.open('rb') as saved:
            assert saved.read(7)==b'BLENDER','Incomplete Blender temporary save'
        pending.replace(destination)
    report={'source':str(SOURCE.relative_to(ROOT)),'sourceSha256':source_hash,'sourceUnchanged':True,
            'revision':destination.name,'runtimeExported':False,'protectedBlenderYMaximum':-1.0,
            'newGeometryMinimumY':min(b[1][0] for b in all_bounds),
            'minimumNewHeadroom':min(b[2][0] for b in all_bounds),
            'unchangedOriginalObjects':len(source_objects)-len(modified),'modifiedBatches':replaced,
            'glassAndSkylightsUnchanged':True,'glassOcclusionPolicy':'new front trims remain within opaque spine/frame footprints',
            'editableNewMeshes':len(new_geometry),'evaluatedNewTriangles':triangles,
            'previewLights':4,'previewOnly':True,
            'cameras':[{'name':v.name,'position':list(v.location),'lens':v.data.lens} for v in views]}
    (OUT/'validation.json').write_text(json.dumps(report,indent=2))
    print('CEILING_STUDY',json.dumps(report),flush=True)
    if '--preview' in sys.argv:
        for index,camera in ((0,views[0]),(2,views[2])):
            scene.camera=camera
            scene.render.filepath=str(OUT/f'ceiling-review-{index+1:02}.png')
            bpy.ops.render.render(write_still=True)
